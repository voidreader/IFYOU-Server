import mysql from "mysql2/promise";
import { response } from "express";
import {
  DB,
  logAction,
  logDB,
  transactionDB,
  logAllPass,
  logAD,
} from "../mysqldb";
import { respondDB, respondError } from "../respondent";
import { logger } from "../logger";
import {
  getUserProjectCurrent,
  ProcessUpdateUserProjectCurrent,
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
    body: {
      userkey,
      episode_id,
      is_double,
      currency,
      quantity,
      project_id = -1,
    },
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

  // 광고 로그 쌓기
  if (is_double) logAD(userkey, project_id, episode_id, "first_clear");
}; // ? END requestEpisodeFirstClear

// * 에피소드 클리어처리 최적화 버전 (1.2.42 부터 적용)
export const requestCompleteEpisodeOptimized = async (req, res) => {
  const {
    body: {
      userkey,
      project_id,
      episode_id,
      nextEpisodeID = -1,
      is_next_ending = 0,
      scene_id,
      useRecord = true,
      lang = "EN",
      ver = 0,
    },
  } = req;

  const responseData = {}; // 리턴값
  logger.info(`requestCompleteEpisodeOptimized [${JSON.stringify(req.body)}]`);
  logAction(userkey, "episode_clear", req.body);

  // 프로젝트의 현재 플레이 지점을 업데이트 하기 위한 파라매터
  // * nextEpisodeID가 0보다 작은 경우는 막다른 길이다.
  // * 스페셜 에피소드는 다음 에피소드 지정이 되지 않는다.
  // * 엔딩에서도 다음 에피소드 지정이 되지 않는다.
  // * 파라매터로 막다른 길임을 알려준다.
  const updateParam = {
    userkey,
    project_id,
    episodeID: nextEpisodeID < 0 ? episode_id : nextEpisodeID, // 다음 에피소드 설정이 있을때만 다음 에피소드 ID로 지정
    is_final: nextEpisodeID < 0 ? 1 : 0, // 다음 에피소드 설정이 없으면 1로 처리 (엔딩을 플레이 했거나 설정상의 문제)
  };

  logger.info(
    `requestCompleteEpisodeOptimized updateParam [${JSON.stringify(
      updateParam
    )}]`
  );

  // 쿼리만들기
  let currentQuery = "";

  // hist, progress 입력하기.(에피소드ID 및 사건ID)
  currentQuery += `INSERT IGNORE INTO user_episode_hist (userkey, project_id, episode_id) VALUES (${userkey}, ${project_id}, ${episode_id});`;
  currentQuery += `INSERT IGNORE INTO user_episode_progress (userkey, project_id, episode_id) VALUES (${userkey}, ${project_id}, ${episode_id});`;
  currentQuery += `INSERT IGNORE INTO user_scene_progress (userkey, project_id, episode_id, scene_id) VALUES (${userkey}, ${project_id}, ${episode_id}, '${scene_id}');`;
  currentQuery += `INSERT IGNORE INTO user_scene_hist (userkey, project_id, episode_id, scene_id) VALUES (${userkey}, ${project_id}, ${episode_id},'${scene_id}');`;

  // 다음화가 엔딩인 경우에 대한 처리
  if (is_next_ending > 0) {
    currentQuery += `INSERT IGNORE INTO user_ending (userkey, episode_id, project_id) VALUES (${userkey}, ${nextEpisodeID}, ${project_id});`;
  }

  // 에피소드 플레이 기록 저장하기, 엔딩 오픈 처리
  const updateEpisodeRecordResult = await DB(currentQuery);

  if (!updateEpisodeRecordResult.state) {
    logger.error(
      `requestCompleteEpisodeOptimized : [${updateEpisodeRecordResult.error}]`
    );
  }

  // 플레이 지점 저장하기
  // * useRecord는 엔딩 메뉴에서 플레이한 경우 false로 전달받는다.
  let projectCurrent;
  if (useRecord) {
    // projectCurrent = await requestUpdateProjectCurrent(updateParam);
    projectCurrent = await ProcessUpdateUserProjectCurrent(updateParam);
  } else {
    projectCurrent = await getUserProjectCurrent(req.body); // useRecord false 인경우는 갱신없음.
  }

  // 결과값 처리하기
  responseData.projectCurrent = projectCurrent;
  responseData.episode_id = episode_id; // 방금 플레이한 에피소드ID

  // 첫결제 보상 서버에서 정해주기
  responseData.firstClearResult = { currency: "coin", quantity: 20 };

  res.status(200).json(responseData);

  // 오류 체크
  if (
    !responseData.projectCurrent ||
    responseData.projectCurrent.length === 0
  ) {
    logger.error(
      `requestCompleteEpisodeOptimized projectCurrentError : ${JSON.stringify(
        req.body
      )}`
    );
  }

  // 클리어 로그
  logAction(userkey, "episode_clear_result", responseData);
};
