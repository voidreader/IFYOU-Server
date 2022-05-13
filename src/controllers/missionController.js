// 미션 컨트롤
import mysql from "mysql2/promise";

import { DB, logAction, transactionDB } from "../mysqldb";
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

  const responseData = {};

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

  if (!missionRewardResult.state || missionRewardResult.row.length === 0) {
    logger.error("No Mission reward data");
    respondDB(res, 80025, "미션 보상 정보가 없습니다");
    return;
  } // ? 미션 보상 정보 조회 종료

  let insertQuery = ``;
  const { reward_currency, reward_quantity, reward_exp } =
    missionRewardResult.row[0];

  //! quantity가 0이 아닌 경우
  if (reward_quantity !== 0) {
    insertQuery = `CALL sp_insert_user_property(?, ?, ?, ?);`;
  }

  // * 등급 경험치 처리
  let result = await DB(
    `
  SELECT a.grade, next_grade, grade_experience
  FROM table_account a, com_grade b   
  WHERE a.grade = b.grade  
  AND userkey = ?;
  `,
    [userkey]
  );

  let currentGrade = result.row[0].grade; // * 현재 등급
  if (result.row[0].next_grade > result.row[0].grade)
    currentGrade = result.row[0].next_grade; //*시즌 중에 승급을 했으면, 현재 그레이드는 next_grade로 변경
  responseData.grade_info = {
    current_grade: currentGrade,
    next_grade: currentGrade,
  };

  responseData.experience_info = {
    grade_experience: result.row[0].grade_experience, //기존 경험치
    get_experience: reward_exp, //획득한 경험치
    total_exp: reward_exp + result.row[0].grade_experience,
  };

  //! sp_insert_user_property 부여 및 상태값 업데이트
  result = await transactionDB(
    `
  ${insertQuery}
  ${MQ_CLIENT_UPDATE_MISSION}
  UPDATE table_account SET grade_experience = grade_experience + ? WHERE userkey = ?;
  `,
    [
      userkey,
      reward_currency,
      reward_quantity,
      "mission",
      mission_id,
      reward_exp,
      userkey,
    ]
  );

  if (!result.state) {
    logger.error(`userMisionReceive Error 3 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 경험치 업데이를 하고, 현재 grade의 max 포인트랑 비교를 해서 지금 현재의
  // 경험치가 max 보다 이상이면 등급업을 시켜줘야한다.
  const maxExpResult = await DB(`
    SELECT a.upgrade_point 
    FROM com_grade a
  WHERE a.grade = ${currentGrade};
  `);

  const maxExp = maxExpResult.row[0].upgrade_point; // max exp
  const currentExp = responseData.experience_info.total_exp; // 현재 상태의 exp
  responseData.grade_info.upgrade_point = maxExp;

  // 현재 경험치가 맥스 이상이되었음. => 등급업.
  if (currentExp >= maxExp) {
    // * 등급업!
    const upgradeResult = await DB(`
    update table_account
       SET next_grade = next_grade + 1
         , grade_experience = grade_experience - ${maxExp}
     WHERE userkey = ${userkey};
    `);

    if (!upgradeResult.state) {
      logger.error(upgradeResult.error);
    }

    //  등급업
    responseData.grade_info.next_grade = currentGrade + 1;

    // 등급 오른 경우 total_exp 갱신
    const preTotalExp = responseData.experience_info.total_exp;
    responseData.experience_info.total_exp = preTotalExp - maxExp;

    // 올라간 등급의 max 경험치를 다시 구해야한다.
    const newMaxExpResult = await DB(`
      SELECT a.upgrade_point 
      FROM com_grade a
    WHERE a.grade = ${responseData.grade_info.next_grade};
    `);
    responseData.grade_info.upgrade_point =
      newMaxExpResult.row[0].upgrade_point;
  }

  logAction(userkey, "mission", {
    userkey,
    mission_id,
    grade: currentGrade,
    total_exp: currentExp,
    get_exp: reward_exp,
    max_exp: maxExp,
  });

  //! 갱신된 bank, userProperty, 미션 리스트 전달
  responseData.bank = await getUserBankInfo(req.body);
  res.status(200).json(responseData);
};

//! 전체 미션 보상
export const requestMissionAllReward = async (req, res) => {
  const {
    body: { userkey, project_id = -1, lang = "KO" },
  } = req;

  const responseData = {};
  let all_clear = 0;
  let result = ``;
  let currentQuery = ``;
  let updateQuery = ``;

  //이미 전체 보상을 받은 경우
  result = await DB(
    `SELECT * FROM user_mission_all_clear WHERE userkey = ? AND project_id = ?;`,
    [userkey, project_id]
  );
  if (result.state && result.row.length > 0) {
    logger.error(`requestMissionAllReward Error`);
    respondDB(res, 80025, "already received reward.");
    return;
  }

  //전체 미션 달성 확인
  result = await DB(
    `
  SELECT 
  fn_check_mission_all_clear_simple(?, ?) all_clear
  FROM DUAL;
  `,
    [userkey, project_id]
  );
  if (result.state && result.row.length > 0)
    all_clear = result.row[0].all_clear;

  //전체 보상 재화
  result = await DB(
    `
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
  `,
    [project_id]
  );
  responseData.reward = result.row;

  responseData.bank = {};
  console.log(`all_clear : ${userkey}/${project_id}/${all_clear}`);
  if (all_clear === 1) {
    currentQuery = `CALL sp_insert_user_property(?, ?, ?, ?);`;
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      updateQuery += mysql.format(currentQuery, [
        userkey,
        item.currency,
        item.quantity,
        "mission_all",
      ]);
    }

    currentQuery = `INSERT INTO user_mission_all_clear(userkey, project_id) VALUES(?, ?);`;
    updateQuery += mysql.format(currentQuery, [userkey, project_id]);

    result = await transactionDB(updateQuery);
    if (!result.state) {
      logger.error(`requestMissionAllReward Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }

    responseData.bank = await getUserBankInfo(req.body);
  }

  logAction(userkey, "mission_all", req.body);

  res.status(200).json(responseData);
};

////////// 클라이언트 호출 종료 /////////////////
