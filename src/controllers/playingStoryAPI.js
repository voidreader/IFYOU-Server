import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, logDB, transactionDB, logAllPass } from "../mysqldb";
import { respondDB, respondError } from "../respondent";
import { logger } from "../logger";
import {
  getUserProjectCurrent,
  requestUpdateProjectCurrent,
} from "../com/userProject";
import {
  checkMissionByEpisode,
  checkSideUnlockByEpisode,
} from "./storyController";

import { getUserBankInfo } from "./bankController";
import { UQ_ACCQUIRE_CURRENCY } from "../USERQStore";
import { getUserStorySelectionHistory } from "./accountController";

// * 인게임에서 호출되는 API

// * 스페셜 에피소드 해금 (2022.07.27)
export const requestUnlockSpecialEpisode = async (req, res) => {
  const {
    body: { userkey, project_id, episode_id },
  } = req;

  res.status(200).send("");

  logger.info(`requestUnlockSpecialEpisode [${JSON.stringify(req.body)}]`);

  const result = await DB(`
  INSERT IGNORE user_side(userkey, project_id, episode_id) 
  VALUES (${userkey}, ${project_id}, ${episode_id});`);

  if (!result.state) {
    logger.error(`requestUnlockSpecialEpisode : ${result.error}`);
  }
}; // ? requestUnlockSpecialEpisode

// * 미션 해금 (2022.07.27)
export const requestUnlockMission = async (req, res) => {
  const {
    body: { userkey, project_id, mission_id },
  } = req;

  res.status(200).send("");

  logger.info(`requestUnlockMission [${JSON.stringify(req.body)}]`);

  const result = await DB(`
  INSERT IGNORE user_mission(userkey, project_id, mission_id) 
  VALUES (${userkey}, ${project_id}, ${mission_id});`);

  if (!result.state) {
    logger.error(`requestUnlockMission : ${result.error}`);
  }
}; // ? requestUnlockMission

// * 유저 재화 입력
const addUserProperty = async (userkey, currency, quantity, pathCode) => {
  const result = await DB(UQ_ACCQUIRE_CURRENCY, [
    userkey,
    currency,
    quantity,
    pathCode,
  ]);

  if (!result.state) {
    logger.error(result.error);
  }
};

// * 유저 에피소드 첫 클리어 보상 요청 (실제 수신 처리)
export const requestEpisodeFirstClear = async (req, res) => {
  const {
    body: { userkey, episode_id, is_double, currency, quantity },
  } = req;

  // accountController의 동일함수는 삭제 대상
  let realQuantity = quantity;
  if (is_double) realQuantity = quantity * 5;

  if (realQuantity > 200) {
    logger.error(
      `Wrong requestEpisodeFirstClear [${JSON.stringify(req.body)}]`
    );
    respondError(res, "error", "error");
  }

  await addUserProperty(userkey, currency, realQuantity, "first_clear");

  const responseData = {};
  responseData.bank = await getUserBankInfo(req.body); // 뱅크 갱신
  responseData.reward = { currency, quantity: realQuantity }; // 받은 물건

  res.status(200).json(responseData); // 응답처리
}; // ? END requestEpisodeFirstClearReward

// * 에피소드 플레이 완료 처리(2022.04.17)
export const requestCompleteEpisode = async (req, res) => {
  const {
    body: {
      userkey,
      project_id,
      episodeID,
      nextEpisodeID = -1,
      useRecord = true,
      lang = "KO",
      ver = 0,
    },
  } = req;

  // * 이전 버전에서 불필요한 통신을 줄이고, 최소한으로 진행.
  const responseData = {}; // 리턴값

  logger.info(`requestCompleteEpisode [${JSON.stringify(req.body)}]`);
  req.body.episode_id = episodeID; // 이름.. 실수..

  // ! 2021.08.26 projectCurrent
  // 프로젝트의 현재 플레이 지점을 업데이트 하기 위한 파라매터
  // * nextEpisodeID가 0보다 작은 경우는 막다른 길이다.
  // * 스페셜 에피소드는 다음 에피소드 지정이 되지 않는다.
  // * 엔딩에서도 다음 에피소드 지정이 되지 않는다.
  // * 파라매터로 막다른 길임을 알려준다.
  const updateParam = {
    userkey,
    project_id,
    episodeID: nextEpisodeID < 0 ? episodeID : nextEpisodeID, // 다음 에피소드 설정이 있을때만 다음 에피소드 ID로 지정
    is_final: nextEpisodeID < 0 ? 1 : 0, // 다음 에피소드 설정이 없으면 1로 처리 (엔딩이나 설정 문제)
  };

  logger.info(
    `requestCompleteEpisode updateParam [${JSON.stringify(updateParam)}]`
  );

  // 에피소드 플레이 기록 저장하기, 엔딩 오픈 처리
  const updateEpisodeRecordResult = await DB(`
  call sp_update_user_episode_hist(${userkey}, ${project_id}, ${episodeID});
  CALL sp_update_user_ending(${userkey}, ${project_id}, ${updateParam.episodeID});
  `);

  if (!updateEpisodeRecordResult.state) {
    logger.error(
      `requestCompleteEpisode : [${JSON.stringify(
        updateEpisodeRecordResult.error
      )}]`
    );
  }

  // 플레이 지점 저장하기
  // * useRecord는 엔딩 메뉴에서 플레이한 경우 false로 전달받는다.
  let projectCurrent;
  if (useRecord) {
    projectCurrent = await requestUpdateProjectCurrent(updateParam);
  } else {
    projectCurrent = await getUserProjectCurrent(req.body); // useRecord false 인경우는 갱신없음.
  }

  responseData.projectCurrent = projectCurrent;
  responseData.episode_id = episodeID; // 방금 플레이한 에피소드ID

  // * 사이드 에피소드, 미션 해금 처리
  responseData.unlockSide = await checkSideUnlockByEpisode(req.body);
  responseData.unlockMission = await checkMissionByEpisode(req.body);

  // 첫결제 보상 서버에서 정해주기
  responseData.firstClearResult = { currency: "coin", quantity: 20 };

  // * 작품의 선택지 기록 갱신해오기.
  responseData.selectionHistory = await getUserStorySelectionHistory(req.body);

  // 클리어 로그
  logAction(userkey, "episode_clear", req.body);
  // 올패스 수집
  const result = await DB(
    `
  SELECT 
  CASE WHEN now() <= allpass_expiration THEN 1 ELSE 0 END allpass_check
  FROM table_account
  WHERE userkey = ?;`,
    [userkey]
  );
  if (result.state && result.row.length > 0) {
    const { allpass_check } = result.row[0];
    if (allpass_check === 1) logAllPass(userkey, project_id, episodeID);
  }

  res.status(200).json(responseData);
};

// * 에피소드 플레이 완료 처리(2022.07.27)
export const requestCompleteEpisodeType2 = async (req, res) => {
  const {
    body: {
      userkey,
      project_id,
      episodeID,
      nextEpisodeID = -1,
      useRecord = true,
      lang = "KO",
      ver = 0,
    },
  } = req;

  // * 이전 버전에서 불필요한 통신을 줄이고, 최소한으로 진행.
  const responseData = {}; // 리턴값

  logger.info(`requestCompleteEpisodeType2 [${JSON.stringify(req.body)}]`);
  req.body.episode_id = episodeID; // 이름.. 실수..

  // ! 2021.08.26 projectCurrent
  // 프로젝트의 현재 플레이 지점을 업데이트 하기 위한 파라매터
  // * nextEpisodeID가 0보다 작은 경우는 막다른 길이다.
  // * 스페셜 에피소드는 다음 에피소드 지정이 되지 않는다.
  // * 엔딩에서도 다음 에피소드 지정이 되지 않는다.
  // * 파라매터로 막다른 길임을 알려준다.
  const updateParam = {
    userkey,
    project_id,
    episodeID: nextEpisodeID < 0 ? episodeID : nextEpisodeID, // 다음 에피소드 설정이 있을때만 다음 에피소드 ID로 지정
    is_final: nextEpisodeID < 0 ? 1 : 0, // 다음 에피소드 설정이 없으면 1로 처리 (엔딩이나 설정 문제)
  };

  logger.info(
    `requestCompleteEpisodeType2 updateParam [${JSON.stringify(updateParam)}]`
  );

  // 쿼리만들기
  let currentQuery = "";

  // hist, progress 입력하기.
  currentQuery += `INSERT IGNORE INTO user_episode_hist (userkey, project_id, episode_id) VALUES (${userkey}, ${project_id}, ${episodeID});`;
  currentQuery += `INSERT IGNORE INTO user_episode_progress (userkey, project_id, episode_id) VALUES (${userkey}, ${project_id}, ${episodeID});`;

  // 엔딩에 대한 처리
  currentQuery += `CALL sp_update_user_ending(${userkey}, ${project_id}, ${updateParam.episodeID});`;

  // 에피소드 플레이 기록 저장하기, 엔딩 오픈 처리
  const updateEpisodeRecordResult = await DB(currentQuery);

  if (!updateEpisodeRecordResult.state) {
    logger.error(
      `requestCompleteEpisodeType2 : [${updateEpisodeRecordResult.error}]`
    );
  }

  // 플레이 지점 저장하기
  // * useRecord는 엔딩 메뉴에서 플레이한 경우 false로 전달받는다.
  let projectCurrent;
  if (useRecord) {
    projectCurrent = await requestUpdateProjectCurrent(updateParam);
  } else {
    projectCurrent = await getUserProjectCurrent(req.body); // useRecord false 인경우는 갱신없음.
  }

  responseData.projectCurrent = projectCurrent;
  responseData.episode_id = episodeID; // 방금 플레이한 에피소드ID

  // 첫결제 보상 서버에서 정해주기
  responseData.firstClearResult = { currency: "coin", quantity: 20 };

  // * 작품의 선택지 기록 갱신해오기.
  // responseData.selectionHistory = await getUserStorySelectionHistory(req.body);

  res.status(200).json(responseData);

  // 클리어 로그
  logAction(userkey, "episode_clear", req.body);

  // 올패스 수집
  /*
  const result = await DB(
    `
  SELECT 
  CASE WHEN now() <= allpass_expiration THEN 1 ELSE 0 END allpass_check
  FROM table_account
  WHERE userkey = ?;`,
    [userkey]
  );
  if (result.state && result.row.length > 0) {
    const { allpass_check } = result.row[0];
    if (allpass_check === 1) logAllPass(userkey, project_id, episodeID);
  } 
  */
};
