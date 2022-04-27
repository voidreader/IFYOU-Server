// 미션 컨트롤
import mysql from "mysql2/promise";

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

////////// 클라이언트 호출 시작 /////////////////

//! 미션 리스트
export const userMissionList = async (req, res) => {
  const result = await getUserMissionList(req.body);
  respond(result, res, "userMissionList");
};

//! 미션 받기
export const userMisionReceive = async (req, res) => {
  const {
    body: { project_id, mission_id, userkey },
  } = req;

  // * 유저가 대상 미션에 대해 보상을 받은적이 있는지 체크한다.
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
  // ? 보상 히스토리 조회 종료

  // * 대상 미션의 경험치, 보상 조회
  const missionRewardResult = await DB(`
    SELECT lm.reward_exp 
    , lm.reward_currency 
    , lm.reward_quantity 
  FROM list_mission lm 
  WHERE lm.mission_id = ${mission_id};
  `);

  if (!missionRewardResult.state || missionRewardResult.row.length == 0) {
    logger.error("No Mission reward data");
    respondDB(res, 80025, "미션 보상 정보가 없습니다");
    return;
  } // ? 미션 보상 정보 조회 종료

  let insertQuery = ``;
  const { reward_currency, reward_quantity, reward_exp } =
    missionRewardResult.row[0];

  // * 경험치는 추후 처리

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
  responseData.userProperty = {};

  // 리스트 줄 필요 없을듯.
  //responseData.userMissionList = (await getUserMissionList(req.body)).row;

  res.status(200).json(responseData);
};


//! 전체 미션 보상 
export const requestMissionAllReward = async(req, res) => {
  
  const {
    body:{
      userkey, 
      project_id = -1, 
      lang = "KO",
    }
  } = req;

  const responseData = {};
  let all_clear = 0;
  let result = ``;
  let currentQuery = ``; 
  let updateQuery = ``;


  //이미 전체 보상을 받은 경우 
  result = await DB(`SELECT * FROM user_mission_all_clear WHERE userkey = ? AND project_id = ?;`, [userkey, project_id]);
  if(result.state && result.row.length > 0){
    logger.error(`requestMissionAllReward Error`);
    respondDB(res, 80025, "already received reward.");
    return;
  }

  //전체 미션 달성 확인 
  result= await DB(`
  SELECT 
  fn_check_mission_all_clear(?, ?, ?) all_clear
  FROM DUAL;
  `, [userkey, project_id, lang]);
  if(result.state && result.row.length > 0) all_clear = result.row[0].all_clear;

  //전체 보상 경험치 
  result = await DB(`SELECT ifnull(mission_exp, 0) mission_exp FROM list_project_master WHERE project_id = ?;`, [project_id]);
  responseData.mission_exp = result.row[0].mission_exp;

  //전체 보상 재화 
  result = await DB(`
  SELECT 
  a.currency
  , a.quantity
  , b.icon_image_id
  , fn_get_design_info(b.icon_image_id, 'url') icon_image_url 
  , fn_get_design_info(b.icon_image_id, 'key') icon_image_key
  FROM list_project_mission a, com_currency b
  WHERE a.currency = b.currency
  AND a.project_id = ? 
  ORDER BY a.sortkey; 
  `, [project_id]);
  responseData.reward = result.row; 

  responseData.bank = {};
  console.log(`all_clear : ${all_clear}`);
  if(all_clear === 1){
    currentQuery = `CALL sp_insert_user_property(?, ?, ?, ?);`;
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      updateQuery += mysql.format(currentQuery, [userkey, item.currency, item.quantity, 'mission_all']);
    }

    currentQuery = `INSERT INTO user_mission_all_clear(userkey, project_id) VALUES(?, ?);`;
    updateQuery += mysql.format(currentQuery, [userkey, project_id]);

    result = await transactionDB(updateQuery); 
    if(!result.state){
      logger.error(`requestMissionAllReward Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;      
    }

    responseData.bank = await getUserBankInfo(req.body);
  }
 
  res.status(200).json(responseData);

};

////////// 클라이언트 호출 종료 /////////////////
