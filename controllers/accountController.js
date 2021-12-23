/* eslint-disable prefer-destructuring */
/* eslint-disable no-plusplus */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { response } from "express";
import { DB, logAction, logDB, transactionDB } from "../mysqldb";
import {
  Q_CLIENT_LOGIN_BY_DEVICE,
  Q_SELECT_PROJECT_BUBBLE_SET,
  Q_SELECT_PROJECT_BUBBLE_SPRITE,
  Q_SELECT_PROJECT_MODEL_ALL_FILES,
  Q_SELECT_PROJECT_LIVE_OBJECT_ALL_FILES,
  Q_SELECT_PROJECT_LIVE_ILLUST_ALL_FILES,
  Q_CLIENT_LOGIN_BY_GAMEBASE,
  Q_REGISTER_CLIENT_ACCOUNT_WITH_GAMEBASE,
  Q_UPDATE_CLIENT_ACCOUNT_WITH_GAMEBASE,
  Q_CLIENT_LOGIN_BY_USERKEY,
  Q_SELECT_PROJECT_BGM,
  Q_SELECT_PROJECT_NAME_TAG,
  Q_SELECT_PROJECT_DETAIL,
} from "../QStore";

import {
  Q_CHANGE_USERKEY_GAMEBASE,
  Q_DELETE_USER_EPISODE_SCENE_PROGRESS,
  Q_INSERT_USER_DRESS_PROGRESS,
  Q_INSERT_USER_EPISODE_SCENE_HISTORY,
  Q_SELECT_PROJECT_ALL_ILLUST,
  Q_SELECT_PROJECT_DRESS_CODE,
  Q_SELECT_USER_DRESS_PROGRESS,
  Q_SELECT_USER_FAVOR_HISTORY,
  Q_SELECT_USER_ILLUST_HISTORY,
  Q_UPDATE_USER_FAVOR_UPDATE,
  Q_UPDATE_USER_ILLUST_HISTORY,
  Q_USER_EPISODE_PURCHASE,
  Q_USER_EPISODE_SCENE_CLEAR,
  Q_USER_EPISODE_SCENE_PROGRESS,
  UQ_ACCQUIRE_CURRENCY,
  UQ_SELECT_USER_SIDE_EPISODE,
  UQ_USE_CURRENCY,
  UQ_CHECK_PROJECT_USER_FREEPASS,
  Q_UPDATE_USER_MISSION_HISTORY,
  Q_SELECT_USER_MISSION_HISTORY,
  Q_PROJECT_ENDING_COUNT,
  Q_USER_ENDING_COUNT,
  UQ_GET_PROJECT_USER_PROPERTY,
  UQ_SELECT_USER_MAIN_EPISODE,
  UQ_INSERT_USER_TIMEDEAL,
} from "../USERQStore";

import { logger } from "../logger";
import { getUserVoiceHistory } from "./soundController";
import {
  checkSideUnlockByEpisode,
  requestProjectNametag,
  checkSideUnlockByScene,
  checkMissionByEpisode,
  checkMissionByScence,
  checkMissionByDrop,
  getProjectFreepassPrice,
} from "./storyController";
import { respondDB, respondError } from "../respondent";
import {
  getUserProjectCurrent,
  getUserProjectSelectionProgress,
  requestUpdateProjectCurrent,
} from "../com/userProject";
import { getConnectedGalleryImages } from "./episodeController";
import {
  getProjectBgmBannerInfo,
  getProjectFreepassBannerInfo,
  getProjectFreepassTitleInfo,
  getProjectGalleryBannerInfo,
} from "./designController";
import { getUserBankInfo } from "./bankController";
import { getProjectFreepassProduct } from "./shopController";
import { gamebaseAPI } from "../com/gamebaseAPI";

dotenv.config();

// 캐릭터 탈퇴일자 업데이트
export const updateWithdrawDate = (req, res) => {
  const {
    body: { userkey },
  } = req;

  DB(
    `update table_account set withdraw_date = now() where userkey = ${userkey}`
  );

  res.status(200).send("");
};

////////// ! 재화 소모와 획득에 대한 처리 부분

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

// * 유저가 프로젝트의 프리패스를 가지고 있는지 체크.
export const checkUserHasProjectFreepass = async (userkey, project_id) => {
  const result = await DB(`
   SELECT fn_get_user_property(${userkey}, fn_get_project_freepass(${project_id})) freepass
    FROM DUAL;
   `);

  if (result.row > 0 && result.row[0].freepass > 0) return true;
  else return false;
};

// * 유저의 프로젝트 재화 (대여권, 프리패스) 소유 체크
export const getUserProjectProperty = async (userInfo) => {
  // logger.info(`getUserProjectProperty ${JSON.stringify(userInfo)}`);

  // 유저의 프로젝트 재화
  const propertyResult = await DB(UQ_GET_PROJECT_USER_PROPERTY, [
    userInfo.userkey,
    userInfo.project_id,
    userInfo.userkey,
    userInfo.project_id,
    userInfo.userkey,
    userInfo.project_id,
  ]);

  const { freepass, ticket, onetime } = propertyResult.row[0];
  const responseData = {};
  responseData.freepass = freepass;
  responseData.ticket = ticket;
  responseData.onetime = onetime;

  return responseData;
};

// 재화 수량 조회
// * 특정 그룹 재화를 위한 기능 추가 (1회권)
export const getCurrencyQuantity = async (
  userkey,
  currency,
  isGroup = false
) => {
  let result;

  if (isGroup) {
    result = await DB(
      `SELECT fn_get_user_group_property(?, ?) quantity
      FROM DUAL;`,
      [userkey, currency]
    );
  } else {
    result = await DB(
      `SELECT fn_get_user_property(?, ?) quantity
      FROM DUAL;`,
      [userkey, currency]
    );
  }

  if (result.state && result.row.length > 0) {
    return result.row[0].quantity;
  } else {
    if (!result.state) {
      logger.error(`getCurrencyQuantity Error ${result.error}`);
    }

    return 0;
  }
};

// 유저의 미수신 우편 카운트
const getUserUnreadMailCount = async (userkey) => {
  const { cnt } = (
    await DB(`SELECT fn_get_user_unread_mail_count(${userkey}) cnt FROM DUAL;`)
  ).row[0];

  return cnt;
};

// * 프리패스 구매하기
export const purchaseFreepass = async (req, res) => {
  const {
    body: {
      currency,
      userkey,
      project_id,
      originPrice = 0,
      salePrice = 0,
      freepass_no = -1,
    },
  } = req;

  // currency 체크
  const currencyCheck = await DB(`
  SELECT cc.currency 
  FROM com_currency cc 
 WHERE connected_project = ${project_id} 
   AND currency_type = 'nonconsumable'
   AND currency = '${currency}'
   ;`);

  // 화폐가 없어..!?
  if (currencyCheck.row.length === 0) {
    respondDB(res, 80059, "프리패스 구매 과정에서 오류가 발생했습니다.");
    return;
  }

  // 이미 프리패스 구매자인지 체크
  const freepassExists = await DB(`
  SELECT up.currency FROM user_property up WHERE userkey = ${userkey} AND currency = '${currency}';
  `);

  // 이미 기존에 구매한 경우에 대한 처리
  if (freepassExists.row.length > 0) {
    respondDB(res, 80060, "이미 프리패스를 구매하였습니다.");
    return;
  }

  // * 프리패스 구매에 필요한 가격 조회 및 보유량 체크
  const currentGem = await getCurrencyQuantity(userkey, "gem"); // 현재 유저의 젬 보유량

  let freepassPricesObject = null;
  let fresspassSalePrice = salePrice;

  // 값이 기본값으로 들어온 경우는 서버에서 정보를 가져오도록 처리한다.
  if (originPrice === 0) {
    freepassPricesObject = await getProjectFreepassPrice({
      userkey,
      project_id,
    });
    fresspassSalePrice = freepassPricesObject.sale_freepass_price; // 세일 가격을 서버에서 받아온다.
  } else {
    fresspassSalePrice = salePrice;
  }

  console.log(
    `purchaseFreepass needGem:[${fresspassSalePrice}] / currentGem:[${currentGem}]`
  );

  // 현재 보유량이 가격보다 적은 경우! return
  if (currentGem < fresspassSalePrice) {
    respondDB(res, 80014, "젬이 부족합니다");
    return;
  } // ? 젬 부족

  // 조건들을 다 통과했으면 실제 구매처리를 시작한다.
  // TransactionDB 사용
  const useQuery = mysql.format(`CALL sp_use_user_property(?,?,?,?,?);`, [
    userkey,
    "gem",
    fresspassSalePrice,
    "freepass",
    project_id,
  ]);

  const buyQuery = mysql.format(`CALL sp_insert_user_property(?,?,?,?);`, [
    userkey,
    currency,
    1,
    "freepass",
  ]);

  // 최종 재화 소모 및, 프리패스 구매 처리
  const finalResult = await transactionDB(`${useQuery}${buyQuery}`);
  if (!finalResult.state) {
    respondDB(res, 80059, finalResult.error);
  }

  // * 성공했으면 bank와 userProperty(프로젝트) 갱신해서 전달해주기
  const responseData = {};
  responseData.bank = await getUserBankInfo(req.body);
  responseData.userProperty = await getUserProjectProperty(req.body);
  responseData.purchaseResult = req.body;

  res.status(200).json(responseData);

  // 성공했으면 gamelog에 insert
  // 얼마에 샀고, 어떤 타임딜에 구매했는지.
  logDB(
    `INSERT INTO log_freepass (userkey, project_id, freepass_no, price) VALUES(${userkey}, ${project_id}, ${freepass_no}, ${fresspassSalePrice});`
  );

  logAction(userkey, "freepass", req.body);
};

// ? /////////////////////////////////////////////////////////////////////////////////////////////////

// 1회권 에피소드의 플레이 카운트 0으로 만들기
const setZeroEpisodeOneTimePlayCount = async (userkey, episodeID) => {
  await DB(
    `
  UPDATE user_episode_purchase
   SET onetime_playable = 0
 WHERE userkey = ?
   AND episode_id = ?;
  `,
    [userkey, episodeID]
  );

  // 오류 체크.. 필요 없겠지?;;
};

// 에피소드의 1회권 플레이 횟수 차감 가능 여부 체크
const getEpisodeOneTimePlayable = async (userkey, episodeID) => {
  const result = await DB(
    `
  SELECT CASE WHEN a.purchase_type = 'OneTime' AND a.onetime_playable > 0 THEN 1
            ELSE 0 END isPlayable
  FROM user_episode_purchase a
 WHERE a.userkey = ?
   AND episode_id = ?;
  `,
    [userkey, episodeID]
  );

  if (
    !result.state ||
    result.row.length === 0 ||
    result.row[0].isPlayable === 0
  )
    // 차감 불가
    return false;
  else return true; // 차감 가능한 상태
};

// 유저 에피소드 구매 정보 !
const getUserEpisodePurchaseInfo = async (userInfo) => {
  const result = await DB(Q_USER_EPISODE_PURCHASE, [
    userInfo.userkey,
    userInfo.project_id,
  ]);

  if (!result.state) {
    logger.error(`getUserEpisodePurchaseInfo Error ${result.error}`);
    return [];
  }

  return result.row;
};

// ? 유저 수집요소 달성율
// 작품상세화면 View
const getUserCollectionProgress = async (userInfo) => {
  // 갤러리
  // 미션
  // 엔딩
  let missionProgress = 0;
  let endingProgress = 0;
  let galleryProgress = 0;

  // ! 갤러리 겁나 빡셈!
  // 공개된 음성, 공개된 라이브오브제+미니컷, 모든 일러스트, 라이브일러스트
  const userGallery = await DB(
    `
  SELECT fn_get_user_gallery_count(?, ?) cnt
  FROM DUAL;
  `,
    [userInfo.userkey, userInfo.project_id]
  );

  const projectGallery = await DB(
    `
  SELECT fn_get_project_gallery_count(?) cnt
  FROM DUAL; 
  `,
    [userInfo.project_id]
  );

  if (projectGallery.row[0].cnt === 0 || userGallery.row[0].cnt === 0) {
    // 0 나누기 방지
    galleryProgress = 0;
  } else {
    galleryProgress =
      parseFloat(userGallery.row[0].cnt) /
      parseFloat(projectGallery.row[0].cnt);
  }

  // 미션
  // 유저 미션
  const userMission = await DB(
    `
  SELECT count(um.mission_id) cnt
  FROM user_mission um
     , list_mission lm
 WHERE lm.mission_id = um.mission_id  
   AND lm.project_id = ?
   AND um.userkey = ?;
  `,
    [userInfo.project_id, userInfo.userkey]
  );

  // ? 프로젝트 미션
  const projectMission = await DB(
    `
  SELECT count(*) cnt FROM list_mission lm WHERE project_id = ?;
  `,
    [userInfo.project_id]
  );

  if (projectMission.row[0].cnt === 0 || userMission.row[0].cnt === 0) {
    // 0 나누기 방지
    missionProgress = 0;
  } else {
    missionProgress =
      parseFloat(userMission.row[0].cnt) /
      parseFloat(projectMission.row[0].cnt);
  }
  // ? 미션 끝

  // ? 엔딩
  const projectEnding = await DB(Q_PROJECT_ENDING_COUNT, [userInfo.project_id]);
  const userEnding = await DB(Q_USER_ENDING_COUNT, [
    userInfo.project_id,
    userInfo.userkey,
    "KO",
  ]);

  if (userEnding.row[0].cnt === 0 || projectEnding.row[0].cnt === 0) {
    endingProgress = 0;
  } else {
    endingProgress =
      parseFloat(userEnding.row[0].cnt) / parseFloat(projectEnding.row[0].cnt);
  }
  // ? 엔딩 끝

  const progress = {};
  progress.mission = missionProgress;
  progress.ending = endingProgress;
  progress.gallery = galleryProgress;

  logger.info(
    `Progress gallery : [${userGallery.row[0].cnt}/${projectGallery.row[0].cnt}], mission : [${userMission.row[0].cnt}/${projectMission.row[0].cnt}], ending : [${userEnding.row[0].cnt}/${projectEnding.row[0].cnt}]`
  );

  return progress;
};

// 유저가 획득한 엔딩 리스트
// 엔딩 View에서 사용
export const getUserEndingList = async (req, res) => {
  const {
    body: { userkey, project_id, lang = "KO" },
  } = req;

  const result = await DB(
    `
  SELECT c.episode_id
     , c.title
     , a.ending_type
     , fn_get_design_info(a.popup_image_id, 'url') popup_image_url
     , fn_get_design_info(a.popup_image_id, 'key') popup_image_key
  FROM list_episode a
     , user_ending b
     , list_episode_detail c
 WHERE a.project_id = ?
   AND b.userkey = ?
   AND b.episode_id = a.episode_id
   AND a.episode_type ='ending'
   AND a.episode_id = c.episode_id 
   AND c.lang = ?
 ORDER BY sortkey ;
  `,
    [project_id, userkey, lang]
  );

  // 프로젝트 엔딩 카운트
  const projectEndingCount = await DB(Q_PROJECT_ENDING_COUNT, [project_id]);

  const responseData = {};
  responseData.userEnding = result.row;
  responseData.projectEndingCount = projectEndingCount.row[0].cnt;

  res.status(200).json(responseData);
};

// 유저 호감도 히스토리 업데이트
export const updateUserFavorHistory = async (req, res) => {
  const userInfo = req.body;

  logger.info(`updateUserFavorHistory ${JSON.stringify(userInfo)}`);

  const result = await DB(Q_UPDATE_USER_FAVOR_UPDATE, [
    userInfo.userkey,
    userInfo.project_id,
    userInfo.favor_name,
    userInfo.score,
  ]);

  if (!result.state) {
    logger.error(`updateUserFavorHistory Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 업데이트하고 재조회
  const refresh = await DB(Q_SELECT_USER_FAVOR_HISTORY, [
    userInfo.userkey,
    userInfo.project_id,
  ]);

  res.status(200).send(refresh.row);
};

// 유저 일러스트 히스토리 업데이트
export const updateUserIllustHistory = async (req, res) => {
  logger.info(`updateUserIllustHistory ${JSON.stringify(req.body)}`);

  const {
    body: { project_id, userkey, illust_id, illust_type },
  } = req;

  const result = await DB(Q_UPDATE_USER_ILLUST_HISTORY, [
    userkey,
    project_id,
    illust_id,
    illust_type,
  ]);

  if (!result.state) {
    logger.error(`updateUserIllustHistory Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 업데이트하고 재조회
  const refresh = await DB(Q_SELECT_USER_ILLUST_HISTORY, [
    userkey,
    userkey,
    project_id,
    project_id,
    project_id,
    project_id,
  ]);

  const responseData = {};

  if (refresh.state) {
    responseData.illustHistory = refresh.row;
  } else responseData.illustHistory = [];

  res.status(200).send(responseData);
};

// 유저 도전과제 히스토리 업데이트
export const updateUserMissionHistory = async (req, res) => {
  logger.info(`updateUserMissionHistory ${JSON.stringify(req.body)}`);

  const userInfo = req.body;

  const result = await DB(Q_UPDATE_USER_MISSION_HISTORY, [
    userInfo.userkey,
    userInfo.mission_id,
  ]);

  if (!result.state) {
    logger.error(`updateUserMissionHistory Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 업데이트하고 재조회
  const refresh = await DB(Q_SELECT_USER_MISSION_HISTORY, [
    userInfo.userkey,
    userInfo.project_id,
  ]);

  res.status(200).send(refresh.row);
};

// 프로젝트의 유저 의상 진행정보 조회
const getUserProjectDressProgress = async (userInfo) => {
  const result = await DB(Q_SELECT_USER_DRESS_PROGRESS, [
    userInfo.userkey,
    userInfo.project_id,
  ]);

  if (result.state) return result.row;
  else return [];
};

// 프로젝트의 유저 캐릭터 진행정보 입력
export const insertUserProjectDressProgress = async (req, res) => {
  console.log(`insertUserProjectDressProgress ${req.body}`);
  const userInfo = req.body;

  const result = await DB(Q_INSERT_USER_DRESS_PROGRESS, [
    userInfo.userkey,
    userInfo.project_id,
    userInfo.speaker,
    userInfo.dress_id,
  ]);

  if (!result.state) {
    logger.error(`insertUserProjectDressProgress Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const returnValue = await getUserProjectDressProgress(userInfo);
  res.status(200).json(returnValue);
};

//////////////////////////// 의상 정보 관련 처리 끝 ///////////////////////////////////////

// 유저 에피소드 상황 History
const getUserEpisodeSceneProgress = async (userInfo) => {
  const result = await DB(Q_USER_EPISODE_SCENE_PROGRESS, [
    userInfo.userkey,
    userInfo.project_id,
  ]);

  if (!result.state) {
    logger.error(`getUserEpisodeSceneProgress Error ${result.error}`);
    return [];
  }

  // console.log(result);

  const scenes = [];

  result.row.forEach((item) => {
    scenes.push(item.scene_id);
  });

  // console.log(scenes);

  return scenes;
};

// 유저 사건ID 진행도 삭제(개별)
export const deleteUserEpisodeSceneProgress = async (req, res) => {
  const userInfo = req.body;

  await DB(Q_DELETE_USER_EPISODE_SCENE_PROGRESS, [
    userInfo.userkey,
    userInfo.scene_id,
  ]);

  const list = await getUserEpisodeSceneProgress(userInfo);
  res.status(200).json(list);
};

// 유저 에피소드 씬 히스토리 입력(hist, progress 같이 입력)
export const insertUserEpisodeSceneHistory = async (req, res) => {
  const userInfo = req.body;

  await DB(Q_INSERT_USER_EPISODE_SCENE_HISTORY, [
    userInfo.userkey,
    userInfo.project_id,
    userInfo.episode_id,
    userInfo.scene_id,
  ]);

  const list = await getUserEpisodeSceneProgress(userInfo);
  res.status(200).json(list);
};

// 선택한 에피소드의 사건ID 진행도 초기화
export const clearUserEpisodeSceneProgress = async (req, res) => {
  const userInfo = req.body;

  logger.info(`clearUserEpisodeSceneProgress [${JSON.stringify(userInfo)}]`);

  const result = await DB(Q_USER_EPISODE_SCENE_CLEAR, [
    userInfo.userkey,
    userInfo.episode_id,
  ]);

  if (!result.state) {
    logger.error(`clearUserEpisodeSceneProgress Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const list = await getUserEpisodeSceneProgress(userInfo);
  res.status(200).json(list);
};

// 앱에서 사용되는 사이드 에피소드 리스트
const requestSideEpisodeList = async (userInfo) => {
  const sideEpisodes = await DB(UQ_SELECT_USER_SIDE_EPISODE, [
    userInfo.userkey,
    userInfo.userkey,
    userInfo.userkey,
    userInfo.project_id,
  ]);

  if (!sideEpisodes.state) {
    logger.error(`requestSideEpisodeList Error ${sideEpisodes.error}`);
    return [];
  }

  // ! 2021.09.01 갤러리 이미지 리소스의 첫 등장 에피소드 정보에 따라서 각 에피소드에 넣어준다.
  const galleryImages = await getConnectedGalleryImages(userInfo.project_id);

  // 정렬된 에피소드 목록을 돌면서 연결된 갤러리 이미지를 넣어준다.
  sideEpisodes.row.forEach((item) => {
    item.galleryImage = []; // 빈 배열을 만들어주기!

    for (let i = 0; i < galleryImages.length; i++) {
      if (galleryImages[i].appear_episode === item.episode_id) {
        // 첫 등장 에피소드 ID를 비교해서 일치하면 push!
        item.galleryImage.push(galleryImages[i]); // push 해준다.
      }
    } //
  });

  return sideEpisodes.row;
};

// 앱에서 사용되는 메인 에피소드 리스트
const requestMainEpisodeList = async (userInfo) => {
  // 유저의 메인 에피소드 리스트
  const regularEpisodes = await DB(UQ_SELECT_USER_MAIN_EPISODE, [
    userInfo.userkey,
    userInfo.userkey,
    userInfo.userkey,
    userInfo.userkey,
    userInfo.userkey,
    userInfo.project_id,
  ]);
  const mainEpisodes = []; // 메인 에피소드

  const endingEpisodes = []; // 엔딩
  const sides = []; // 사이드 (임시)
  const organized = []; // 정렬된

  // 에피소드 type에 따라서 각 배열로 따로 정리
  regularEpisodes.row.forEach((element) => {
    // 에피소드 형태별 수집하기
    if (element.episode_type === "chapter") {
      mainEpisodes.push(element);
    } else if (element.episode_type === "ending") {
      element.indexed_title = `[엔딩] ${element.title}`;
      endingEpisodes.push(element);
    } else if (element.episode_type === "side") {
      element.indexed_title = `[사이드] ${element.title}`;
      sides.push(element);
    }
  }); // 분류 끝.

  /*
  logger.info(
    `Each Episodes Count [${mainEpisodes.length}] / [${endingEpisodes.length}]`
  );
  */

  let mainIndex = 1;
  // 정규 에피소드부터 쌓기 시작한다.
  // title은 그대로 두고 색인 타이틀 indexed_title 을 추가한다.
  mainEpisodes.forEach((item) => {
    item.indexed_title = `[${mainIndex}] ${item.title}`;
    item.episode_no = mainIndex;
    mainIndex += 1;

    organized.push(item);

    // ending쪽에서 연결된거 찾는다. (리스트 순서 떄문에!)
    endingEpisodes.forEach((ending) => {
      if (ending.depend_episode === item.episode_id) organized.push(ending);
    });
  }); // 메인과 연결된 엔딩 집어넣기.

  // 연결되지 않은 엔딩 집어넣기
  endingEpisodes.forEach((item) => {
    if (item.depend_episode < 0) {
      item.indexed_title = `[X]${item.title}`;
      // 연결되지 않은 것만
      organized.push(item);
    }
  });

  // 사이드 에피소드 임시로 집어넣기
  sides.forEach((item) => {
    organized.push(item);
  });

  // ! 2021.09.01 갤러리 이미지 리소스의 첫 등장 에피소드 정보에 따라서 각 에피소드에 넣어준다.
  const galleryImages = await getConnectedGalleryImages(userInfo.project_id);

  // 정렬된 에피소드 목록을 돌면서 연결된 갤러리 이미지를 넣어준다.
  organized.forEach((item) => {
    item.galleryImage = []; // 빈 배열을 만들어주기!

    for (let i = 0; i < galleryImages.length; i++) {
      if (galleryImages[i].appear_episode === item.episode_id) {
        // 첫 등장 에피소드 ID를 비교해서 일치하면 push!
        item.galleryImage.push(galleryImages[i]); // push 해준다.
      }
    } //
  });

  return organized;
};

// * 프로젝트에 연결된 말풍선 세트 ID 조회
const getProjectBubbleSetVersionID = async (userInfo) => {
  // console.log(getProjectBubbleSetVersionID);

  const result = await DB(
    `
    SELECT lp.bubble_set_id, cbm.bubble_ver
    FROM list_project_master lp
       , com_bubble_master cbm 
   WHERE lp.project_id = ?
     AND cbm.set_id = lp.bubble_set_id;
 `,
    [userInfo.project_id]
  );

  // 마스터 정보
  const bubbleMaster = { bubbleID: 25, bubble_ver: 1 };

  // 리턴
  if (result.state && result.row.length > 0) {
    bubbleMaster.bubbleID = result.row[0].bubble_set_id;
    bubbleMaster.bubble_ver = result.row[0].bubble_ver;
    return bubbleMaster;
  } else return bubbleMaster;
}; // ? END

// 프로젝트 말풍선 세트 정보 조회
const getProjectBubbleSetDetail = async (userInfo) => {
  const result = await DB(Q_SELECT_PROJECT_BUBBLE_SET, [userInfo.bubbleID]);

  if (result.state) return result.row;
  else return [];
};

const initBubbleSetObject = () => {
  const bubbleSet = {};
  // 말풍선 세트 초기화
  bubbleSet.talk = {}; // 대화
  bubbleSet.whisper = {}; // 속삭임
  bubbleSet.feeling = {}; // 속마음
  bubbleSet.yell = {}; // 외침
  bubbleSet.monologue = {}; // 독백
  bubbleSet.speech = {}; // 중요대사

  // 템플릿 별로 variation 초기화.
  // 템플릿 2종 추가됨! 2021.06.29
  bubbleSet.talk.normal = [];
  bubbleSet.talk.emoticon = [];
  bubbleSet.talk.reverse_emoticon = [];
  bubbleSet.talk.double = [];

  bubbleSet.whisper.normal = [];
  bubbleSet.whisper.emoticon = [];
  bubbleSet.whisper.reverse_emoticon = [];
  bubbleSet.whisper.double = [];

  bubbleSet.feeling.normal = [];
  bubbleSet.feeling.emoticon = [];
  bubbleSet.feeling.reverse_emoticon = [];
  bubbleSet.feeling.double = [];

  bubbleSet.yell.normal = [];
  bubbleSet.yell.emoticon = [];
  bubbleSet.yell.reverse_emoticon = [];
  bubbleSet.yell.double = [];

  bubbleSet.monologue.normal = [];
  bubbleSet.monologue.emoticon = [];
  bubbleSet.monologue.reverse_emoticon = [];
  bubbleSet.monologue.double = [];

  bubbleSet.speech.normal = [];
  bubbleSet.speech.emoticon = [];
  bubbleSet.speech.reverse_emoticon = [];
  bubbleSet.speech.double = [];

  return bubbleSet;
};

// 유저 프로젝트 일러스트 히스토리
const getUserIllustHistory = async (userInfo) => {
  const result = await DB(Q_SELECT_USER_ILLUST_HISTORY, [
    userInfo.userkey,
    userInfo.userkey,
    userInfo.project_id,
    userInfo.project_id,
    userInfo.project_id,
    userInfo.project_id,
  ]);

  if (result.state) return result.row;
  else return [];
};

// 유저 프로젝트 호감도 히스토리
const getUserFavorHistory = async (userInfo) => {
  const result = await DB(Q_SELECT_USER_FAVOR_HISTORY, [
    userInfo.userkey,
    userInfo.project_id,
  ]);

  if (result.state) return result.row;
  else return [];
};

// 유저 프로젝트 도전과제 히스토리
const getUserMissionHistory = async (userInfo) => {
  const result = await DB(Q_SELECT_USER_MISSION_HISTORY, [
    userInfo.userkey,
    userInfo.project_id,
  ]);

  if (result.state) return result.row;
  else return [];
};

// 프로젝트의 모든 도전과제 리스트
// * user_mission과 조인해서 주는것으로 변경 (2021.08.13)
const getProjectAllMission = async (userInfo) => {
  const result = await DB(
    `
  SELECT a.mission_id
  , fn_get_mission_name(a.mission_id, '${userInfo.lang}') mission_name
  , fn_get_mission_hint(a.mission_id, '${userInfo.lang}') mission_hint
  , a.mission_type 
  , a.is_hidden 
  , a.reward_currency 
  , a.reward_quantity 
  , a.reward_exp 
  , a.image_url 
  , a.image_key 
  , b.unlock_state 
FROM list_mission a 
LEFT OUTER JOIN user_mission b ON a.mission_id = b.mission_id AND b.userkey = ${userInfo.userkey}
WHERE a.project_id = ${userInfo.project_id};
  `
  );

  if (result.state) return result.row;
  else return [];
};

// 유저, 프로젝트에서 경험한 모든 사건ID 목록 (삭제나 수정되지 않음)
export const getUserProjectSceneHistory = async (userInfo) => {
  const result = await DB(
    `
  SELECT hist.scene_id
    FROM user_scene_hist hist
   WHERE hist.userkey = ?
    AND hist.project_id = ?
    ;
  `,
    [userInfo.userkey, userInfo.project_id]
  );

  const scenes = [];

  if (result.state) {
    result.row.forEach((item) => {
      scenes.push(item.scene_id);
    });

    return scenes;
  } else return [];
};

// 프로젝트 해시태그 정보
const requestProjectHashtag = async (userInfo) => {
  const query = `
  SELECT lph.project_id
  , lph.hashtag_no
  , ch.tag_name 
    FROM list_project_master lp 
    , list_project_hashtag lph
    , com_hashtag ch 
    WHERE lp.project_id = ?
    AND lph.project_id = lp.project_id
    AND ch.hashtag_no = lph.hashtag_no 
    ORDER BY ch.hashtag_no 
    ;  
  `;

  const result = await DB(query, [userInfo.project_id]);

  if (result.state && result.row.length > 0) return result.row;
  else return [];
};

// 프로젝트 메인 썸네일 정보
const requestProjectMainThumbnail = async (userInfo) => {
  const query = `
  SELECT lpt.image_url, lpt.image_key 
  FROM list_project_thumbnail lpt
 WHERE lpt.project_id = ?
 ;
  `;

  const result = await DB(query, [userInfo.project_id]);
  if (result.state && result.row.length > 0) return result.row;
  else return [];
};

// 유저 에피소드 진행도 조회
const getUserEpisodeProgress = async (userInfo) => {
  const result = await DB(
    `SELECT a.episode_id
  FROM user_episode_progress a 
 WHERE a.userkey = ?
   AND a.project_id = ?
 ORDER BY open_date DESC;`,
    [userInfo.userkey, userInfo.project_id]
  );

  if (result.state) {
    // 배열로 리턴
    const rValue = [];
    result.row.forEach((item) => {
      rValue.push(item.episode_id);
    });

    return rValue;
  } else return [];
};

// ! 유저 에피소드 진행도 조회 버전2
const getUserEpisodeProgressVer2 = async (userInfo) => {
  const result = await DB(
    `SELECT a.episode_id, is_clear
  FROM user_episode_progress a 
 WHERE a.userkey = ?
   AND a.project_id = ?
 ORDER BY open_date DESC;`,
    [userInfo.userkey, userInfo.project_id]
  );

  if (result.state) {
    return result.row; // 그냥 행 자체를  return
  } else {
    return [];
  }
};

// 유저 에피소드 플레이 히스토리
export const getUserEpisodeHistory = async (userInfo) => {
  const result = await DB(
    `SELECT a.episode_id
  FROM user_episode_hist a 
 WHERE a.userkey = ?
   AND a.project_id = ?
 ORDER BY first_play DESC;`,
    [userInfo.userkey, userInfo.project_id]
  );

  if (result.state) {
    // 배열로 리턴
    const rValue = [];
    result.row.forEach((item) => {
      rValue.push(item.episode_id);
    });

    return rValue;
  } else return [];
};

// ! 유저가 에피소드 플레이를 시작한 시점에 호출
// ! user_episode_progress에 입력된다.
export const insertUserEpisodeStartRecord = async (req, res) => {
  logger.info(`insertUserEpisodeStartRecord [${JSON.stringify(req.body)}]`);

  const {
    body: { userkey, project_id, episodeID },
  } = req;

  const progressQuery = `CALL sp_insert_user_episode_progress(?, ?, ?);`;
  const progressResult = await DB(progressQuery, [
    userkey,
    project_id,
    episodeID,
  ]);

  const responseData = {};

  // 진행도 처리
  // TODO 업데이트 전까지 배열과 object 배열을 함께준다.
  if (progressResult.state && progressResult.row[0].length > 0) {
    responseData.episodeProgress = [];
    progressResult.row[0].forEach((element) => {
      responseData.episodeProgress.push(element.episode_id);
    });

    // ! 버전 2 (완료 여부까지 함께)
    responseData.episodeProgressVer2 = progressResult.row;
  } else {
    logger.error(`insertUserEpisodeStartRecord Error ${progressResult.error}`);
    respondDB(res, 80026, progressResult.error);
    return;
  }

  res.status(200).json(responseData);

  logAction(userkey, "insert_episode_start", req.body);
}; // * end of insertUserEpisodeStartRecord

///////////////
///////////////

// 대상 에피소드 사건 진행율 가져오기
const getEpisodeSceneCount = async (userkey, episodeID) => {
  const result = await DB(
    `
  SELECT fn_get_count_scene_in_history(?, ?, 'KO', 'total') total_scene_count
       , fn_get_count_scene_in_history(?, ?, 'KO', 'played') played_scene_count
  FROM dual
  `,
    [userkey, episodeID, userkey, episodeID]
  );

  return result.row[0].played_scene_count;
};

// 에피소드 첫 클리어 보상 가져오기
const getEpisodeFisrtClearReward = async (userkey, episodeID) => {
  const existsCheck = await DB(`
  SELECT EXISTS (SELECT z.userkey FROM user_episode_hist z WHERE z.userkey = ${userkey} AND z.episode_id = ${episodeID}) is_exists 
  FROM dual;  
  `);

  // 이미 히스토리에 있으면 보상 없다.
  if (existsCheck.row[0].is_exists > 0) return [];

  // 없으면, 첫클리어 보상 정보 가져오기
  const rewardResult = await DB(`
  SELECT le.first_reward_currency currency
     , le.first_reward_quantity quantity
  FROM list_episode le 
  WHERE episode_id = ${episodeID};
  `);

  // 없을리가 없는데 일치하는 에피소드 없으면..  오류 기록은 남긴다.
  if (!rewardResult.state || rewardResult.row === 0) {
    logger.error(
      `Wrong episode ID in getEpisodeFisrtClearReward [${episodeID}]`
    );
    return [];
  }

  return rewardResult.row;
};

// ! 유저 에피소드 플레이 기록(Hist, Progress) 업데이트
// ! 유저가 에피소드 플레이를 완료한 시점에 호출
export const updateUserEpisodePlayRecord = async (req, res) => {
  // * nextEpisodeID가 ending의 경우는 user_ending에 따로 추가로 수집한다.
  // * 플레이 기록은 에피소드 플레이 완료시에 쌓이기 때문에
  // * 엔딩의 플레이를 완료하지 않아도 엔딩정보를 수집해야 한다.

  // * 2021.07 : 사이드 에피소드의 해금을 체크해야한다.(unlockSide)
  // * 2021.08 : 미션 해금을 체크한다.(unlockMission)
  // * 2021.08.09 : OneTime. 1회 플레이에 대한 처리를 진행한다. (user_episode_purchase, episodePurchase 갱신 필요)
  // * 2021.12.12 : ending 선택지 로그 히스토리 때문에 sp_insert_user_ending_new 프로시저로 변경 - JE
  const {
    body: { userkey, project_id, episodeID, nextEpisodeID = -1 },
  } = req;

  logger.info(`updateUserEpisodePlayRecord [${JSON.stringify(req.body)}]`);
  req.body.episode_id = episodeID;

  const histQuery = `CALL sp_insert_user_episode_hist(?, ?, ?);`;
  const progressQuery = `CALL sp_update_user_episode_done(?, ?, ?);`;
  const endingQuery = `CALL sp_insert_user_ending_new(?,?,?,?);`;

  // * 2021.09.18 첫 클리어 보상을 위한 추가 로직
  // * 첫 클리어 보상 정보 가져온다.
  let firstClearResult = await getEpisodeFisrtClearReward(userkey, episodeID);

  const histResult = await DB(histQuery, [userkey, project_id, episodeID]); // 히스토리 입력
  const progressResult = await DB(progressQuery, [
    userkey,
    project_id,
    episodeID,
  ]); // 진행도 입력

  // ! 2021.08.26 projectCurrent
  // * nextEpisodeID가 0보다 작은 경우는 막다른 길이다.
  // * 스페셜 에피소드는 다음 에피소드 지정이 되지 않는다.
  // * 엔딩에서도 다음 에피소드 지정이 되지 않는다.
  // * 파라매터로 막다른 길임을 알려준다.
  const updateCurrentParam = {
    userkey,
    project_id,
    episodeID: nextEpisodeID < 0 ? episodeID : nextEpisodeID, // 다음 에피소드 설정이 있을때만 다음 에피소드 ID로 지정
    is_final: nextEpisodeID < 0 ? 1 : 0, // 다음 에피소드 설정이 없으면 1로 처리 (엔딩이나 설정 문제)
  };

  logger.info(`updateCurrentParam : ${JSON.stringify(updateCurrentParam)}`);

  // 플레이 위치 저장 (배열로 받음)
  const projectCurrent = await requestUpdateProjectCurrent(updateCurrentParam);

  // 배열로 받은 projectCurrent를 responseData.projectCurrent에 넣어준다.
  const responseData = { projectCurrent }; // * response 값

  // console.log(`responseData Check : `, responseData);

  // 히스토리 처리
  if (histResult.state && histResult.row[0].length > 0) {
    responseData.episodeHistory = [];
    histResult.row[0].forEach((element) => {
      responseData.episodeHistory.push(element.episode_id);
    });
  } else {
    logger.error(
      `updateUserEpisodePlayRecord error in episode hist ${histResult.error}`
    );
    respondDB(res, 80026, histResult.error);
    return;
  }

  // 진행도 처리
  // TODO 업데이트 전까지 배열과 object 배열을 함께준다.
  if (progressResult.state) {
    responseData.episodeProgress = [];
    progressResult.row[0].forEach((element) => {
      responseData.episodeProgress.push(element.episode_id);
    });

    // ! 버전 2 (완료 여부까지 함께)
    // TODO 왜 ... ver2를 만들었는지 기억이 안난다...
    // responseData.episodeProgressVer2 = progressResult.row[0];
  } else {
    logger.error(`updateUserEpisodePlayRecord Error 1 ${progressResult.error}`);
    respondDB(res, 80026, progressResult.error);
    return;
  }

  // 이 시점에 클리어 로그
  logAction(userkey, "episode_clear", req.body);

  // 엔딩 수집 추가 처리 (2021.07.05) -

  // 플레이 회차 확인
  const playResult = await DB(
    `
  SELECT DISTINCT play_count 
  FROM user_selection_current
  WHERE userkey = ? AND project_id = ?;
  `,
    [userkey, project_id]
  );
  let playCount = 0;
  if (playResult.row.length > 0) playCount = playResult.row[0].play_count;

  const endingResult = await DB(endingQuery, [
    userkey,
    nextEpisodeID,
    project_id,
    playCount,
  ]);
  if (!endingResult.state) {
    logger.error(`updateUserEpisodePlayRecord Error 2 ${endingResult.error}`); // 로그만 남긴다.
  }

  // * 사이드 에피소드 해금 처리(2021.07.05)
  responseData.unlockSide = await checkSideUnlockByEpisode(req.body);

  // scene Count 정보(2021.08.05)
  responseData.playedSceneCount = await getEpisodeSceneCount(
    userkey,
    episodeID
  );

  // * 미션 해금 정보(2021.08.06)
  responseData.unlockMission = await checkMissionByEpisode(req.body);

  // * 1회권 처리 - 1회권으로 플레이를 했는지 체크한다.
  const needOneTimePlayCount = await getEpisodeOneTimePlayable(
    userkey,
    episodeID
  );

  // * 1회권 차감, 에피소드 1회 플레이 했음을 처리.
  if (needOneTimePlayCount) {
    // 차감 처리 한다.
    logger.info(
      `It's OneTime Episode. [{$episodeID}] play count is set to zero :)`
    );
    await setZeroEpisodeOneTimePlayCount(userkey, episodeID);
  }
  // ? 1회권 처리 끝

  // * 2021.09.18 처리할꺼 다 하고, 첫 클리어 보상 입력처리.
  const rewardPromise = [];
  firstClearResult = firstClearResult.filter((reward) => reward.quantity > 0);
  firstClearResult.forEach((reward) => {
    console.log("first clear : ", reward);
    rewardPromise.push(
      addUserProperty(userkey, reward.currency, reward.quantity, "first_clear")
    );
  });

  await Promise.all(rewardPromise)
    .then((values) => {
      console.log(values);
    })
    .catch((err) => {
      console.log(err);
      logger.error(err);
    });

  // * 2021.09.18 첫결제 보상 추가되면서 bank 추가
  // 첫 결제 보상 정보
  responseData.firstClearResult = firstClearResult;
  // bank 정보 refresh
  responseData.bank = await getUserBankInfo(req.body);

  res.status(200).json(responseData);

  // 이 시점에 클리어 후에 처리를 위한 로그 추가
  logAction(userkey, "episode_clear_after", responseData);
};

// 말풍선 세트 재배열
const arrangeBubbleSet = (allBubbleSet) => {
  const bubbleSet = initBubbleSetObject(); // 말풍선 초기화

  // 말풍선 세트는 복잡하니까 분할해서 처리
  // 대분류를 template으로 변경해서 정리합니다.
  allBubbleSet.forEach((item) => {
    switch (item.template) {
      case "talk": // 대화
        if (item.variation === "normal") bubbleSet.talk.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.talk.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.talk.reverse_emoticon.push(item);
        else if (item.variation === "double") bubbleSet.talk.double.push(item);
        break;

      case "whisper": // 속삭임
        if (item.variation === "normal") bubbleSet.whisper.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.whisper.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.whisper.reverse_emoticon.push(item);
        else if (item.variation === "double")
          bubbleSet.whisper.double.push(item);
        break;

      case "feeling": // 속마음
        if (item.variation === "normal") bubbleSet.feeling.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.feeling.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.feeling.reverse_emoticon.push(item);
        else if (item.variation === "double")
          bubbleSet.feeling.double.push(item);
        break;

      case "yell": // 외침
        if (item.variation === "normal") bubbleSet.yell.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.yell.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.yell.reverse_emoticon.push(item);
        else if (item.variation === "double") bubbleSet.yell.double.push(item);
        break;

      case "monologue": // 독백
        if (item.variation === "normal") bubbleSet.monologue.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.monologue.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.monologue.reverse_emoticon.push(item);
        else if (item.variation === "double")
          bubbleSet.monologue.double.push(item);
        break;

      case "speech": // 중요대사
        if (item.variation === "normal") bubbleSet.speech.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.speech.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.speech.reverse_emoticon.push(item);
        else if (item.variation === "double")
          bubbleSet.speech.double.push(item);
        break;

      default:
        break;
    }
  }); // end of forEach

  return bubbleSet;
};

// 프로젝트 화폐정보
const getProjectCurrency = async (project_id) => {
  const result = await DB(
    `
  SELECT cc.currency
     , cc.origin_name 
     , cc.currency_type 
     , cc.local_code
     , cc.is_unique 
  FROM com_currency cc WHERE connected_project = ?;
  `,
    [project_id]
  );

  return result.row;
};

// * 유저 소모성 재화의 사용 처리
export const consumeUserCurrency = async (req, res) => {
  const {
    body: { userkey, quantity, currency, reason = `none` },
  } = req;

  // ! reason은 사용 코드 : consume_code

  logger.info(`consumeUserCurrency [${JSON.stringify(req.body)}]`);
  const responseData = {}; // 응답 데이터

  // 사용할 재화에 대한 수량을 체크한다.
  const currentQuantity = await getCurrencyQuantity(userkey, currency);
  // 소모하려는 개수가 보유한 개수보다 많을때.
  if (currentQuantity < currency) {
    logger.error(`consumeUserCurrency Error not enough currnecy`);
    respondDB(res, 80031, "not enough your property");
  } else {
    // 소모 처리
    const consumeResult = await (UQ_USE_CURRENCY,
    [userkey, currency, quantity, reason, -1]);

    // DB ERROR
    if (!consumeResult.state) {
      logger.error(`consumeUserCurrency Error ${consumeResult.error}`);
      respondDB(res, 80026, consumeResult.error);
      return;
    }

    // * 재화 갱신 및 응답
    responseData.currency = currency; // 사용한 재화
    responseData.currentQuantity = await getCurrencyQuantity(userkey, currency); // 개수
    res.status(200).json(responseData);

    logAction(userkey, "consume_currency", req.body);
  }
}; // * end of 유저 소모성 재화 소모 처리

// * 유저 소모성 재화의 획득 처리
export const accquireUserConsumableCurrency = async (req, res) => {
  const {
    body: { userkey, quantity, currency, reason = `none` },
  } = req;

  logger.info(`accquireUserConsumableCurrency [${JSON.stringify(req.body)}]`);
  const responseData = {}; // 응답 데이터

  // ! reason은 획득 코드 : accquire_code
  const accquireResult = await DB(UQ_ACCQUIRE_CURRENCY, [
    userkey,
    currency,
    quantity,
    reason,
  ]);

  if (!accquireResult.state) {
    logger.error(
      `accquireUserConsumableCurrency Error ${accquireResult.error}`
    );
    respondDB(res, 80026, accquireResult.error);
  } else {
    // * 재화 갱신 및 응답
    responseData.currency = currency; // 사용한 재화
    responseData.currentQuantity = await getCurrencyQuantity(userkey, currency); // 개수
    res.status(200).json(responseData);

    logAction(userkey, "accuire_currency", req.body);
  }
};

// ! 재화 소모와 획득에 대한 처리 끝! //////////////////////

// # 에피소드 구매 타입2 (Rent, OneTime, Permanent)
// * 2021.08.03 추가 로직 1.0.10 버전부터 반영된다.
export const purchaseEpisodeType2 = async (req, res) => {
  const {
    // 클라이언트에서 구매타입, 사용화폐, 화폐개수를 같이 받아온다.
    body: {
      userkey,
      episodeID,
      purchaseType,
      project_id,
      currency = "none",
      currencyQuantity = 0,
    },
  } = req;

  logger.info(`purchaseEpisodeType2 start [${JSON.stringify(req.body)}]`);

  let useCurrency = currency; // 사용되는 화폐
  let useQuantity = currencyQuantity; // 사용되는 화폐 개수
  let hasFreepass = false; // 자유이용권 갖고 있는지 true/false
  let freepassCode = ""; // 연결된 작품의 자유이용권 코드
  let currentPurchaseType = purchaseType; // 입력되는 구매 형태

  // 구매 형태(purchase_type은 list_standard.purchase_type 참조)

  const responseData = {}; // 응답데이터

  // ! 자유이용권 구매자인지 체크할것!
  // 클라이언트에서 체크하겠지만 한번 더 체크..
  const freepassCheck = await DB(UQ_CHECK_PROJECT_USER_FREEPASS, [
    userkey,
    project_id,
  ]);

  // * 자유이용권 보유중!!
  if (freepassCheck.state && freepassCheck.row.length > 0) {
    logger.info(`freepass user [${userkey}]`);

    hasFreepass = true;
    freepassCode = freepassCheck.row[0].currency;

    // 자유이용권 이용자는 화폐를 프리패스로 변경.
    useCurrency = freepassCode;
    useQuantity = 1;
    currentPurchaseType = "Permanent"; // 프리패스 이용자는 무조건 소장처리
  } // ? 자유이용권 보유 체크 종료

  // * 프리패스(자유이용권) '미'소지자에 대한 처리
  if (!hasFreepass) {
    // ! 아직 유효한 구매상태인지 체크한다.
    // 대여기간, 1회 플레이, 소장
    // 이중구매는 막아준다. 400 응답
    // 프리패스 이용자가 아닐때만 하는 이유는 프리패스는 이중구매고 뭐고 그냥 구매해도 상관없다.
    const validationCheck = await DB(
      `
      SELECT CASE WHEN uep.permanent = 1 THEN 1
                  ELSE 0 END is_purchased
        FROM user_episode_purchase uep
        WHERE uep.userkey = ? 
          AND uep.episode_id = ?;
    `,
      [userkey, episodeID]
    );

    // 유효한 구매 있음.
    if (
      validationCheck.state &&
      validationCheck.row.length > 0 &&
      validationCheck.row[0].is_purchased > 0
    ) {
      // * 이미 구입했으면 클라이언트에서 정상 동작하도록 처리해준다.(2021.11.18)
      responseData.episodePurchase = await getUserEpisodePurchaseInfo(req.body); // 구매기록
      responseData.bank = await getUserBankInfo(req.body); // bank.
      responseData.userProperty = await getUserProjectProperty(req.body); // 프로젝트 프로퍼티
      res.status(200).json(responseData);

      logger.error(`purchaseEpisodeType2 double purchase`);
      return;
    } // ? 유효한 구매 체크 종료

    // ! 사용하려는 재화의 보유고를 체크한다.
    // ! none일때는 제외
    if (useCurrency !== "none") {
      // 보유고가 모자라면 400 응답
      const currentCurrencyCount = await getCurrencyQuantity(
        userkey,
        useCurrency
      );

      // 모자라요!
      if (currentCurrencyCount < useQuantity) {
        logger.error(`purchaseEpisodeType2 Error 2`);
        respondDB(res, 80024, "not enough your property");
        return;
      }
    }
  } // ? 프리패스 미소유자에 대한 처리 끝

  logger.info(
    `purchase procedure call ${episodeID}/${useCurrency}/${useQuantity}/${currentPurchaseType}`
  );

  // ! 실제 구매 처리(type2)
  const purchaseResult = await DB(
    `
  CALL sp_purchase_episode_type2(?,?,?,?,?,?);
  `,
    [
      userkey,
      project_id,
      episodeID,
      useCurrency,
      useQuantity,
      currentPurchaseType,
    ]
  );

  if (!purchaseResult.state) {
    logger.error(`purchaseEpisodeType2 Error 3 ${purchaseResult.error}`);
    respondDB(res, 80022, purchaseResult.error);
    return;
  }

  // ! 재화 소모 처리
  // ! 프리패스 이용자는 재화 소모 처리하지 않음.
  if (!hasFreepass || useCurrency !== "none") {
    const consumeResult = await DB(UQ_USE_CURRENCY, [
      userkey,
      useCurrency,
      useQuantity,
      currentPurchaseType,
      project_id,
    ]);

    // DB ERROR
    if (!consumeResult.state) {
      logger.error(`purchaseEpisodeType2 Error 4 ${consumeResult.error}`);
      respondDB(res, 80022, consumeResult.error);
      return;
    }
  }

  // TODO 유저에게 갱신된 episodePurchase 정보와 bank, ProjectProperty 정보를 함께 준다.
  responseData.episodePurchase = await getUserEpisodePurchaseInfo(req.body); // 구매기록
  responseData.bank = await getUserBankInfo(req.body); // bank.
  responseData.userProperty = await getUserProjectProperty(req.body); // 프로젝트 프로퍼티

  res.status(200).json(responseData);

  // 로그
  logAction(userkey, "episode_purchase", req.body);
}; // ? 끝! purchaseEpisodeType2

// ? /////////////////////////////////////////////////////////

// * 랜덤 핀코드 생성하기
const getRandomPIN = () => {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
};

// * 클라이언트 계정 생성
export const registerClientAccount = async (req, res) => {
  logger.info(`registerClientAccount [${JSON.stringify(req.body)}]`);

  const {
    body: { deviceid, gamebaseid = null },
  } = req;

  const pincode = getRandomPIN();

  let result = ``;

  result = await DB(Q_REGISTER_CLIENT_ACCOUNT_WITH_GAMEBASE, [
    deviceid,
    gamebaseid,
    pincode,
  ]);

  if (!result.state) {
    logger.error(`registerClientAccount Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const isLive = process.env.LIVE;
  console.log(`is Live : [${isLive}]`);

  // 임시로직, 신규유저 재화 지급
  // 테스트 서버만 적용할 것.
  //if (isLive < 1) {
  const userResult = await DB(Q_CLIENT_LOGIN_BY_GAMEBASE, [gamebaseid]);
  if (userResult.state && userResult.row.length > 0) {
    await DB(UQ_ACCQUIRE_CURRENCY, [
      userResult.row[0].userkey,
      "countessOneTime",
      1,
      "newbie",
    ]);
    await DB(UQ_ACCQUIRE_CURRENCY, [
      userResult.row[0].userkey,
      "honeybloodOneTime",
      1,
      "newbie",
    ]);
    await DB(UQ_ACCQUIRE_CURRENCY, [
      userResult.row[0].userkey,
      "coin",
      10,
      "newbie",
    ]);
  }
  //}

  // res.redirect(routes.clientApp);
  loginClient(req, res);
};

// ! #클라이언트 로그인 처리
export const loginClient = async (req, res) => {
  const {
    body: { deviceid, gamebaseid = null },
  } = req;

  let result = null;

  if (gamebaseid != null) {
    // 게임베이스로 로그인
    logger.info(`loginClient [ ${gamebaseid} ]`);
    result = await DB(Q_CLIENT_LOGIN_BY_GAMEBASE, [gamebaseid]);
  } else {
    // 구버전.
    logger.info(`loginClient without gamebaseID`);
    result = await DB(Q_CLIENT_LOGIN_BY_DEVICE, [deviceid]);
  }

  const accountInfo = {};

  console.log(result);

  // 계정없으면 생성처리
  if (result.row.length === 0) {
    registerClientAccount(req, res); // 가입시킨다.
  } else {
    // * 로그인 완료 후 데이터 처리
    accountInfo.account = result.row[0];
    const userInfo = { userkey: accountInfo.account.userkey };
    accountInfo.bank = await getUserBankInfo(userInfo);
    accountInfo.unreadMailCount = accountInfo.account.unreadMailCount;

    res.status(200).json(accountInfo);

    // gamebase에서 계정정보 추가로 받아오기.
    const gamebaseResult = await gamebaseAPI.member(gamebaseid);
    if (
      !Object.prototype.hasOwnProperty.call(gamebaseResult, "data") ||
      !Object.prototype.hasOwnProperty.call(gamebaseResult.data, "memberInfo")
    ) {
      return;
    }

    const country = gamebaseResult.data.memberInfo.usimCountryCode;
    const { valid } = gamebaseResult.data.member;

    logger.info(
      `loginClient update(${userInfo.userkey}) : ${country}, ${valid}`
    );
    const userUpdateResult = await DB(Q_UPDATE_CLIENT_ACCOUNT_WITH_GAMEBASE, [
      country,
      valid,
      userInfo.userkey,
    ]);

    // 테이블에 uid 컬럼이 비어있으면,
    if (accountInfo.account.uid === null || accountInfo.account.uid === "") {
      console.log(`UPDATE UID`);
      await DB(`UPDATE table_account SET uid = ? WHERE userkey = ?`, [
        accountInfo.account.pincode,
        accountInfo.account.userkey,
      ]);
    }

    // 로그 쌓기
    logAction(userInfo.userkey, "login", accountInfo.account);
  } // ? 로그인 끝
};

// 계정 변경(게임베이스 기 연동 ID에 대한 처리)
export const changeAccountByGamebase = async (req, res) => {
  const {
    body: { userkey, preGamebaseID },
  } = req;

  logger.info(
    `changeAccountByGamebase userkey:[${userkey}]/[${preGamebaseID}]`
  );

  const result = await DB(Q_CHANGE_USERKEY_GAMEBASE, [userkey, preGamebaseID]);
  if (!result.state || result.row.length === 0) {
    logger.error(`changeAccountByGamebase Error ${result.error}`);
    respondDB(res, 80032, "");
    return;
  }

  const accountInfo = {};
  accountInfo.account = result.row[0][0];
  const userInfo = { userkey: accountInfo.account.userkey };
  accountInfo.bank = await getUserBankInfo(userInfo);
  accountInfo.unreadMailCount = accountInfo.account.unreadMailCount;

  res.status(200).json(accountInfo);

  logAction(userkey, "change_auth_account", req.body);
};

// 신규. 위에 insertUserEpisodeSceneHistory 삭제.
export const updateUserSceneRecord = async (req, res) => {
  const userInfo = req.body;

  logger.info(`updateUserSceneRecord : ${JSON.stringify(userInfo)}`);

  const result = await DB(Q_INSERT_USER_EPISODE_SCENE_HISTORY, [
    userInfo.userkey,
    userInfo.project_id,
    userInfo.episode_id,
    userInfo.scene_id,
  ]);

  const responseData = {};
  responseData.sceneHistory = [];
  responseData.sceneProgress = [];

  if (!result.state) {
    logger.error(`updateUserSceneRecord Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  responseData.sceneProgress = await getUserEpisodeSceneProgress(userInfo); // 유저 사건ID 진행도
  responseData.sceneHistory = await getUserProjectSceneHistory(userInfo); // 유저가 한번이라도 오픈한 프로젝트별 사건ID (신규 입력만, 삭제나 변경 없음)

  //! 해금 사건ID 조회
  responseData.unlockSide = await checkSideUnlockByScene(userInfo);

  //! 미션 해금 조회
  responseData.unlockMission = await checkMissionByScence(userInfo);

  res.status(200).json(responseData);
};

// * drop 미션 해금
export const updateUserScriptMission = async (req, res) => {
  const userInfo = req.body;
  logger.info(`updateUserScriptMission : ${JSON.stringify(userInfo)}`);

  //! 미션 해금 조회
  const result = await checkMissionByDrop(userInfo);

  res.status(200).json(result);
};

// ! 유저 에피소드 진행도 초기화
export const resetUserEpisodeProgress = async (req, res) => {
  logger.info(`resetUserEpisodeProgress [${JSON.stringify(req.body)}]`);

  // * 2021.12.12 : 선택지 로그 추가로 sp_reset_user_episode_progress 프로시저로 일부 수정 - JE

  const {
    body: { userkey, project_id, episodeID, isFree = false },
  } = req;

  const resetResult = await DB(
    `
    CALL sp_reset_user_episode_progress(?, ?, ?);
    `,
    [userkey, project_id, episodeID]
  );

  if (!resetResult.state) {
    logger.error(`resetUserEpisodeProgress Error ${resetResult.error}`);
    respondDB(res, 80026, resetResult.error);
    return;
  }

  // ! 재조회 refresh nextEpisode, currentEpisode, episodeProgress, episodeSceneProgress...
  const responseData = {};

  responseData.episodeProgress = await getUserEpisodeProgress(req.body); // * 유저 에피소드 진행도
  responseData.sceneProgress = await getUserEpisodeSceneProgress(req.body); // * 유저 사건ID 진행도

  // * 2021.08.27
  responseData.projectCurrent = await getUserProjectCurrent(req.body); // 프로젝트 현재 플레이 지점 !
  responseData.selectionProgress = await getUserProjectSelectionProgress(
    req.body
  ); // 프로젝트 선택지 Progress

  res.status(200).json(responseData);

  logAction(userkey, "reset_progress", req.body);
}; // * End of resetUserEpisodeProgress

// 튜토리얼 단계 업데이트2021.09.06
export const updateTutorialStep = async (req, res) => {
  const {
    body: { userkey, tutorial_step },
  } = req;

  const result = await DB(
    `
  UPDATE table_account 
     SET tutorial_step = ?
  WHERE userkey = ?;
  `,
    [tutorial_step, userkey]
  );

  if (!result.state) {
    respondDB(res, 80048, result.error);
    return;
  }

  const responseData = {};
  responseData.new_tutorial_step = tutorial_step;

  res.status(200).json(responseData);

  logAction(userkey, "update_tutorial", req.body);
};

// ? 유저 미니컷 히스토리 업데이트
export const updateUserMinicutHistory = async (req, res) => {
  const {
    body: { userkey, project_id, minicut_id, minicut_type },
  } = req;

  const updateResult = await DB(
    `call sp_update_user_minicut_history(?,?,?,?)`,
    [userkey, minicut_id, minicut_type, project_id]
  );

  if (!updateResult.state) {
    logger.error(`updateUserMinicutHistory Error ${updateResult.error}`);
    respondDB(res, 80020, updateResult.error);
    return;
  }

  const result = {};
  result.illustHistory = await getUserIllustHistory(req.body);

  res.status(200).json(result);
};

// * 프리패스 타임딜 등장시점 체크하기
// userkey, project_id, 작품별 에피소드 구매 기록 파라매터로 받아서 처리
const checkFreepassTimedealAppear = async (
  userkey,
  project_id,
  episodePurchase,
  has_freepass = -1
) => {
  // * 이미 프리패스 구매자의 경우는 체크할 필요 없다.
  if (has_freepass > 0) return [];

  // * has_freepass 파라매터가 없는 경우는 DB조회를 통해 체크한다
  if (await checkUserHasProjectFreepass(userkey, project_id)) {
    return []; // 프리패스 가지고 있으면 true 리턴
  }

  console.log(`checkFreepassTimedealAppear no-freepass user start`);

  // * 이제 프리패스 없는 사람에 대한 처리 시작.
  const freepassProducts = await getProjectFreepassProduct(project_id, userkey); // 작품의 프리패스 상품 리스트 조회
  const timedealPromise = [];

  //
  for (let i = 0; i < freepassProducts.length; i++) {
    // appear_point보다, 작품의 구매 타입에 상관없이 구매 개수가 많으면 timedeal 상품 등장을 위해 데이터 입력
    if (freepassProducts[i].appear_point <= episodePurchase.length) {
      timedealPromise.push(
        DB(UQ_INSERT_USER_TIMEDEAL, [
          userkey,
          "freepass",
          freepassProducts[i].freepass_no,
          freepassProducts[i].timedeal_min,
        ])
      );

      break; // 한번이라도 push 했으면 중단하고 나온다.
    }
  } // ? end of for

  console.log(`timedeal insert count [${timedealPromise.length}]`);

  await Promise.all(timedealPromise)
    .then((values) => {})
    .catch((err) => {
      logger.error(err.error);
      return [];
    });

  // 마지막에 유저에게 등록된 타임들 보여주기
  const userTimedealResult = await DB(`
  SELECT a.timedeal_no
       , a.userkey
       , a.timedeal_type
       , a.target_id
       , DATE_FORMAT(a.end_date, '%Y-%m-%d %T') end_date
       , b.discount
  FROM user_timedeal_limit a
     , com_freepass b
 WHERE a.userkey = ${userkey}
   AND a.end_date > now()
   AND a.timedeal_type = 'freepass'
   AND a.is_end = 0
   AND b.freepass_no = a.target_id
   ORDER BY a.timedeal_no DESC;
  `);

  userTimedealResult.row.forEach((item) => {
    const endDate = new Date(item.end_date);
    item.end_tick = endDate.getTime();
  });

  return userTimedealResult.row;
};

// * 프로젝트 로딩 리스트
const getEpisodeLoadingList = async (project_id) => {
  const result = await DB(`
  SELECT a.loading_id 
     , a.image_id 
     , fn_get_design_info(a.image_id, 'url') image_url
     , fn_get_design_info(a.image_id, 'key') image_key
     , a.loading_name
  FROM list_loading a
 WHERE a.project_id = ${project_id};
  `);

  return result.row;
};

// * 2021.12.19 프로젝트 리소스 한번에 가져오기
// * 쿼리 통합
const getProjectResources = async (project_id, lang, bubbleID) => {
  const responseData = {};

  let query = "";

  query += mysql.format(Q_SELECT_PROJECT_DETAIL, [lang, project_id]); // 0. detail 프로젝트 상세정보
  query += mysql.format(Q_SELECT_PROJECT_DRESS_CODE, [project_id]); // 1. dressCode 의상정보
  query += mysql.format(Q_SELECT_PROJECT_NAME_TAG, [project_id]); // 2. nametag 네임태그
  query += mysql.format(Q_SELECT_PROJECT_BGM, [project_id]); // 3. bgms. BGM
  query += mysql.format(Q_SELECT_PROJECT_ALL_ILLUST, [lang, project_id]); // 4. illusts 일러스트
  query += mysql.format(Q_SELECT_PROJECT_MODEL_ALL_FILES, [project_id]); // 5. models 캐릭터 모델
  query += mysql.format(Q_SELECT_PROJECT_LIVE_OBJECT_ALL_FILES, [project_id]); // 6. liveObjects 라이브 오브제
  query += mysql.format(Q_SELECT_PROJECT_LIVE_ILLUST_ALL_FILES, [project_id]); // 7. liveIllusts 라이브 일러스트
  query += mysql.format(Q_SELECT_PROJECT_BUBBLE_SPRITE, [
    bubbleID,
    bubbleID,
    bubbleID,
    bubbleID,
  ]); // 8. bubbleSprite 말풍선 스프라이트

  const result = await DB(query);

  if (!result.state) {
    logger.error(result.error);
    return null;
  }

  // 캐릭터 모델 파일 포장하기
  const models = {};
  const modelfile = result.row[5];
  modelfile.forEach((item) => {
    if (!Object.prototype.hasOwnProperty.call(models, item.model_name)) {
      models[item.model_name] = [];
    }

    models[item.model_name].push(item); // 배열에 추가
  }); // 캐릭터 모델 포장 끝.

  // 라이브 오브제 파일 포장하기
  const liveObjects = {};
  const liveObjectFile = result.row[6];
  liveObjectFile.forEach((item) => {
    if (
      !Object.prototype.hasOwnProperty.call(liveObjects, item.live_object_name)
    ) {
      liveObjects[item.live_object_name] = [];
    }

    liveObjects[item.live_object_name].push(item); // 배열에 추가
  }); // 라이브 오브제 포장 끝

  // 라이브 일러스트
  const liveIllusts = {};
  const liveIllustFile = result.row[7];
  liveIllustFile.forEach((item) => {
    // 키 없으면 추가해준다.
    if (
      !Object.prototype.hasOwnProperty.call(liveIllusts, item.live_illust_name)
    ) {
      liveIllusts[item.live_illust_name] = [];
    }

    liveIllusts[item.live_illust_name].push(item); // 배열에 추가한다.
  }); // 라이브 일러스트 포장 끝

  responseData.detail = result.row[0];
  responseData.dressCode = result.row[1];
  responseData.nametag = result.row[2];
  responseData.bgms = result.row[3];
  responseData.illusts = result.row[4];
  responseData.models = models;
  responseData.liveObjects = liveObjects;
  responseData.liveIllusts = liveIllusts;
  responseData.bubbleSprite = result.row[8];

  return responseData;
};

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

// * 유저가 선택한 스토리(프로젝트) 정보 가져오기
// * 작품 상세화면에 진입이 정보를 아주 많이! 가져온다.
// ! 중요
// * ## 작품상세정보
export const getUserSelectedStory = async (req, res) => {
  const {
    body: {
      userkey,
      project_id,
      userBubbleVersion = 0,
      clientBubbleSetID = -1,
      lang = "KO",
    },
  } = req;

  // * 유저 정보
  const userInfo = {
    userkey,
    project_id,
    userBubbleVersion,
    clientBubbleSetID,
    lang,
  };

  // 프로젝트에 연결된 BubbleSet ID, Version 정보 추가
  const bubbleMaster = await getProjectBubbleSetVersionID(userInfo);
  console.log(bubbleMaster);

  // 프로젝트와 연결된 말풍선 세트 정보를 따로 갖고 있는다. (아래에서 비교)
  userInfo.bubbleID = bubbleMaster.bubbleID;
  userInfo.bubble_ver = bubbleMaster.bubble_ver;

  logger.info(`>>> getUserSelectedStory [${JSON.stringify(userInfo)}]`);

  const storyInfo = {}; // * 결과값

  // 가장 최신 작업
  storyInfo.freepasProduct = await getProjectFreepassProduct(
    userInfo.project_id,
    userInfo.userkey
  ); // 프리패스 상품 리스트
  storyInfo.freepassPrice = await getProjectFreepassPrice(userInfo); // 프리패스 가격 정보
  storyInfo.projectCurrent = await getUserProjectCurrent(userInfo); // 프로젝트 현재 플레이 지점 !

  storyInfo.episodeLoadingList = await getEpisodeLoadingList(
    userInfo.project_id
  ); // 에피소드 로딩 리스트

  // 유저 소유
  storyInfo.userProperty = await getUserProjectProperty(userInfo);

  storyInfo.selectionProgress = await getUserProjectSelectionProgress(userInfo); // 프로젝트 선택지 Progress
  storyInfo.missions = await getProjectAllMission(userInfo); // 프로젝트의 모든 도전과제
  storyInfo.currency = await getProjectCurrency(userInfo.project_id); // 화폐정보 추가

  const voiceData = await getUserVoiceHistory(userInfo);
  storyInfo.voiceHistory = voiceData.voiceHistory; // 화자별로 포장된 보이스
  storyInfo.rawVoiceHistory = voiceData.rawVoiceHistory; // 리스트 그대로 형태의 보이스

  storyInfo.progress = await getUserCollectionProgress(userInfo); // 수집요소 진행률

  // * 사건 정보
  storyInfo.sceneProgress = await getUserEpisodeSceneProgress(userInfo); // 유저 사건ID 진행도
  storyInfo.sceneHistory = await getUserProjectSceneHistory(userInfo); // 유저가 한번이라도 오픈한 프로젝트별 사건ID (신규 입력만, 삭제나 변경 없음)

  // * 에피소드 정보
  storyInfo.episodeProgress = await getUserEpisodeProgress(userInfo); // ! 유저 에피소드 진행도
  // storyInfo.episodeProgressVer2 = await getUserEpisodeProgressVer2(userInfo); // 유저 에피소드 진행도 버전2
  storyInfo.episodeHistory = await getUserEpisodeHistory(userInfo); // 유저 에피소드 히스토리 (삭제, 변경없음)

  // * 작품 목록
  storyInfo.episodes = await requestMainEpisodeList(userInfo); // 유저의 정규 에피소드 리스트
  storyInfo.sides = await requestSideEpisodeList(userInfo); // 유저의 사이드 에피소드 리스트

  storyInfo.dressProgress = await getUserProjectDressProgress(userInfo); // 유저 의상 정보
  //storyInfo.favorProgress = await getUserFavorHistory(userInfo); // 유저 호감도 진행도
  storyInfo.illustHistory = await getUserIllustHistory(userInfo); // 유저 일러스트 히스토리

  storyInfo.episodePurchase = await getUserEpisodePurchaseInfo(userInfo); // 에피소드 구매 정보

  // * 기준정보

  // 작품 기준정보
  //storyInfo.galleryBanner = await getProjectGalleryBannerInfo(userInfo); // 갤러리 상단 배너
  storyInfo.bgmBanner = await getProjectBgmBannerInfo(userInfo); // BGM 배너
  storyInfo.freepassBanner = await getProjectFreepassBannerInfo(userInfo); // 프리패스 배너
  storyInfo.freepassTitle = await getProjectFreepassTitleInfo(userInfo); // 프리패스 타이틀
  storyInfo.bubbleMaster = bubbleMaster; // 말풍선 마스터 정보

  const projectResources = await getProjectResources(
    userInfo.project_id,
    userInfo.lang,
    userInfo.bubbleID
  );
  if (projectResources == null) {
    respondDB(res, 80026, "프로젝트 리소스 로딩 오류");
    return;
  }

  storyInfo.detail = projectResources.detail; // 상세정보
  storyInfo.dressCode = projectResources.dressCode; // 의상정보
  storyInfo.nametag = projectResources.nametag; // 네임태그
  storyInfo.bgms = projectResources.bgms; // BGM
  storyInfo.illusts = projectResources.illusts; // 이미지 일러스트
  storyInfo.models = projectResources.models; // 캐릭터 모델 정보
  storyInfo.liveObjects = projectResources.liveObjects; // 라이브 오브젝트
  storyInfo.liveIllusts = projectResources.liveIllusts; // 라이브 일러스트
  storyInfo.bubbleSprite = projectResources.bubbleSprite; // 프로젝트 말풍선 스프라이트 정보

  // * 말풍선 상세 정보 (버전체크를 통해서 필요할때만 내려준다)
  // 버전 + 같은 세트 ID인지도 체크하도록 추가.
  if (
    userInfo.userBubbleVersion < userInfo.bubble_ver ||
    userInfo.clientBubbleSetID != userInfo.bubbleID
  ) {
    // logger.info(`!!! Response with BubbleSetDetail`);
    const allBubbleSet = await getProjectBubbleSetDetail(userInfo); // * 프로젝트 말풍선 세트 상세 정보

    // 말풍선 세트를 Variation, Template 별로 정리합니다.
    storyInfo.bubbleSet = arrangeBubbleSet(allBubbleSet);
  } // ? 말풍선 상세정보 끝

  // * 2021.10.01 프리패스 타임딜 처리
  storyInfo.userFreepassTimedeal = await checkFreepassTimedealAppear(
    userInfo.userkey,
    userInfo.project_id,
    storyInfo.episodePurchase,
    storyInfo.userProperty.freepass
  );

  // response
  res.status(200).json(storyInfo);
};

// * 무료충전 처리 요청
// ad_charge 1 증가 후, 코인 7개 지급
export const requestFreeCharge = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  // 현재 유저의 충전 횟수
  const currentChargeCount = (
    await DB(
      `SELECT ad_charge FROM table_account ta WHERE userkey = ${userkey};`
    )
  ).row[0].ad_charge;

  // 서버의 max 충전 횟수
  const chargeLimitCount = (
    await DB(`SELECT max_ad_charge FROM com_server cs LIMIT 1;`)
  ).row[0].max_ad_charge;

  console.log(`${userkey} : ${currentChargeCount}/${chargeLimitCount}`);

  // 현재 횟수가 오버한경우.
  if (currentChargeCount >= chargeLimitCount) {
    respondDB(res, 80085, "충전횟수 초과");
    return;
  }

  // ad_charge 카운트를 1 올린다.
  const updateQuery = `UPDATE table_account 
  SET ad_charge = ad_charge + 1
WHERE userkey = ${userkey};`;

  //const propertyQuery = `CALL sp_send_user_mail (${userkey}, 'ad_charge', 'coin', 7, -1, 30);`;
  // 코인 7개 주기
  const propertyQuery = `CALL sp_insert_user_property (${userkey}, 'coin', 1, 'ad_charge');`;

  const result = await transactionDB(`${updateQuery}${propertyQuery}`);

  if (!result.state) {
    respondDB(res, 80086, "보상 지급 실패");
    return;
  }

  // * 유저 정보 및 뱅크 정보 갱신
  const account = (await DB(Q_CLIENT_LOGIN_BY_USERKEY, [userkey])).row[0];
  const responseData = { account };
  responseData.bank = await getUserBankInfo(req.body);
  responseData.addCoin = 1; // 추가한 코인

  res.status(200).json(responseData);

  logAction(userkey, "ad_charge", { currentChargeCount });
}; // ? 끝!

// * 코인으로 1회권 교환하기
export const requestExchangeOneTimeTicketWithCoin = async (req, res) => {
  const {
    body: { userkey, project_id },
  } = req;

  const userCurrentCoin = await getCurrencyQuantity(userkey, "coin");
  console.log(`current Coin : ${userCurrentCoin}`);

  if (parseInt(userCurrentCoin, 10) < 7) {
    respondDB(res, 80031, "응모권 부족");
    return;
  }

  let onetimeCurrency = "";

  if (project_id == 57) onetimeCurrency = "countessOneTime";
  else if (project_id == 60) onetimeCurrency = "honeybloodOneTime";
  else {
    respondDB(res, 80031, "프로젝트를 알 수 없음");
    return;
  }

  const consumeQuery = `CALL sp_use_user_property (${userkey}, 'coin', 7, 'exchange', ${project_id});`;
  //const mailQuery = `CALL sp_send_user_mail (${userkey}, 'ad_charge', '${onetimeCurrency}', 1, ${project_id}, 30);`;

  // 직접 지급으로 변경
  const propertyQuery = `CALL sp_insert_user_property (${userkey}, '${onetimeCurrency}', 1, 'ad_charge');`;

  const result = await DB(`${consumeQuery} ${propertyQuery}`);
  if (!result.state) {
    respondDB(res, 80086, "보상 지급 실패");
    return;
  }

  // * 유저 정보 및 unreadmailcount 정보 갱신
  const responseData = {};
  responseData.bank = await getUserBankInfo(req.body);
  responseData.unreadMailCount = await getUserUnreadMailCount(userkey);

  res.status(200).json(responseData);

  logAction(userkey, "exchange_charge", req.body);
}; // ? END


// * 유저가 보유한 재화 (꾸미기 가능 재화 한정) 리스트
export const getProfileCurrencyOwnList = async(req, res) =>{
  
  logger.info(`getProfileCurrencyOwnList`); 

  const {
    body:{
      userkey,
      currency_type = "wallpaper", 
    }
  } = req;

  // 재화별로 리스트 가져오기 
  const result = await DB(`
  SELECT 
  a.currency
  , fn_get_design_info(icon_image_id, 'url') icon_url
  , fn_get_design_info(icon_image_id, 'key') icon_key
  , fn_get_design_info(resource_image_id, 'url') currency_url
  , fn_get_design_info(resource_image_id, 'key') currency_key
  FROM user_property a, com_currency b 
  WHERE a.currency = b.currency
  AND userkey = ? 
  AND a.currency LIKE CONCAT('%', ?, '%')
  AND NOW() < expire_date 
  ORDER BY a.currency
  ;`, [userkey, currency_type]);

  res.status(200).json(result.row); 

}; 

// * 유저가 저장한 프로필 꾸미기 저장 정보
export const getProfileCurrencyCurrent = async(req, res) =>{
  logger.info(`getProfileCurrencyCurrent`); 

  const {
    body:{
      userkey, 
    }
  } = req;

  const responseData = {}; 

  let result = await DB(`
  SELECT 
  a.currency
  , fn_get_design_info(resource_image_id, 'url') currency_url
  , fn_get_design_info(resource_image_id, 'key') currency_key
  , sorting_order
  , pos_x
  , pos_y 
  , profile_scale
  , angle 
  FROM user_profile_currency a, com_currency b 
  WHERE userkey = ?
  AND a.currency = b.currency
  ; 
  `, [userkey]);
  responseData.currency = result.row; 

  result = await DB(`
  SELECT 
  text_id 
  , input_text
  , font_size
  , color_rgb
  , sorting_order
  , pos_x
  , pos_y 
  , angle 
  FROM user_profile_text
  WHERE userkey = ?
  ;
  `, [userkey]);
  responseData.text = result.row; 

  res.status(200).json(responseData);
};
