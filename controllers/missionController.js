// 미션 컨트롤
import mysql from "mysql2/promise";
import routes from "../routes";
import { DB, transactionDB } from "../mysqldb";
import {
  respond,
  respondRedirect,
  respondError,
  respondDB,
  adminLogInsert,
} from "../respondent";
import { logger } from "../logger";
import {
  MQ_ADMIN_DELETE_MISSION,
  MQ_ADMIN_INSERT_MISSION,
  MQ_ADMIN_SELECT_MISSION,
  MQ_ADMIN_UPDATE_MISSION,
  MQ_CLIENT_SELECT_MISSION,
  MQ_CLIENT_UPDATE_MISSION,
  MQ_CLIENT_CHECK_MISSION,
} from "../stores/MissionQuery";

import { getUserProjectProperty } from "./accountController";
import { getUserBankInfo } from "./bankController";

const getUserMissionList = async (userInfo) => {
  const result = await DB(MQ_CLIENT_SELECT_MISSION, [
    userInfo.userkey,
    userInfo.project_id,
  ]);
  return result;
};

// 어드민 미션 리스트 조회
export const selectAdminMissionList = async (req, res) => {
  const {
    params: { id },
    body: { lang = "KO" },
  } = req;

  logger.info(`selectAdminMissionList with [${lang}]`);

  const result = await DB(MQ_ADMIN_SELECT_MISSION, [lang, lang, lang, id]);

  respond(result, res, "selectAdminMissionList");
};

// 미션 신규 입력
export const insertMission = async (req, res) => {
  const {
    params: { id },
    body: {
      mission_name,
      mission_hint,
      mission_type,
      is_hidden,
      mission_condition,
      mission_figure,
      id_condition,
      reward_exp,
      reward_currency,
      reward_quantity,
    },
  } = req;

  // 이미지 파일 관련 처리
  let file;
  if (req.file) file = req.file;
  else file = { location: null, key: null };

  logger.info(`insertMission [${JSON.stringify(req.body)}]`);

  const result = await DB(MQ_ADMIN_INSERT_MISSION, [
    mission_name,
    mission_hint,
    mission_type,
    is_hidden,
    id,
    mission_condition,
    mission_figure,
    id_condition,
    reward_exp,
    reward_currency,
    reward_quantity,
    file.location,
    file.key,
  ]);

  adminLogInsert(req, "mission_insert"); 
  respondRedirect(req, res, selectAdminMissionList, result, "insertMission");
};

// 미션 수정
export const updateMission = async (req, res) => {
  const {
    params: { id },
    body: {
      mission_id,
      mission_name,
      mission_hint,
      mission_type,
      is_hidden,
      mission_condition = null,
      mission_figure,
      id_condition,
      reward_exp,
      reward_currency,
      reward_quantity,
      lang = "KO",
    },
  } = req;

  logger.info(`updateMission [${JSON.stringify(req.body)}]`);

  // 이미지 파일 관련 처리
  let file;
  if (req.file) file = req.file;
  else file = { location: null, key: null };

  const result = await DB(MQ_ADMIN_UPDATE_MISSION, [
    mission_id,
    mission_name,
    mission_hint,
    mission_type,
    is_hidden,
    mission_condition,
    mission_figure,
    id_condition,
    reward_exp,
    reward_currency,
    reward_quantity,
    file.location,
    file.key,
    lang,
  ]);

  adminLogInsert(req, "mission_update"); 
  respondRedirect(req, res, selectAdminMissionList, result, "updateMission");
}; // 미션 수정 끝!

// 미션 지우기
export const deleteMission = async (req, res) => {
  const {
    params: { id },
    body: { mission_id },
  } = req;

  const result = await DB(MQ_ADMIN_DELETE_MISSION, [mission_id, mission_id]);

  adminLogInsert(req, "mission_delete"); 
  respondRedirect(req, res, selectAdminMissionList, result, "deleteMission");
};

export const selectMissionRewardCurrency = async (req, res) => {};

////////// 클라이언트 호출 시작 /////////////////

//! 미션 리스트
export const userMissionList = async (req, res) => {
  const result = await getUserMissionList(req.body);
  respond(result, res, "userMissionList");
};

//! 미션 받기
export const userMisionReceive = async (req, res) => {
  const {
    body: { project_id, mission_id, userkey, reward_currency, reward_quantity },
  } = req;

  const checkResult = await DB(MQ_CLIENT_CHECK_MISSION, [mission_id, userkey]);

  if (!checkResult.state) {
    logger.error(`userMisionReceive Error 1 ${checkResult.error}`);
    respondDB(res, 80026, checkResult.error);
    return;
  }

  if (checkResult.row.length > 0) {
    logger.error(`userMisionReceive Error 2`);
    respondDB(res, 80025, "이미 미션 보상을 받았습니다.");
    return;
  }

  let insertQuery = ``;

  //! quantity가 0이 아닌 경우
  if (reward_quantity !== 0) {
    insertQuery = `CALL sp_insert_user_property(?, ?, ?, ?);`;
  }

  //! sp_insert_user_property 부여 및 상태값 업데이트
  const result = await transactionDB(
    `
  ${insertQuery}
  ${MQ_CLIENT_UPDATE_MISSION}
  `,
    [userkey, reward_currency, reward_quantity, "mission", mission_id]
  );

  if (!result.state) {
    logger.error(`userMisionReceive Error 3 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  //! 갱신된 bank, userProperty, 미션 리스트 전달
  const responseData = {};
  responseData.bank = await getUserBankInfo(req.body);
  responseData.userProperty = await getUserProjectProperty(req.body);
  responseData.userMissionList = (await getUserMissionList(req.body)).row;

  res.status(200).json(responseData);
};

////////// 클라이언트 호출 종료 /////////////////
