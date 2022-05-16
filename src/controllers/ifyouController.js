import mysql from "mysql2/promise";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { getContinuousAttendanceList } from "./attendanceController";
import { getUserBankInfo } from "./bankController";

//? 이프유 플레이 시작
//* 연속 출석 관리는 이미 attendanceController에 이미 작업을 해서 그대로 두고
//* 그 이후의 이프유 플레이는 여기 파일에서 관리

//! 일일 미션 리스트
const getDailyMissionList = async (userkey, lang) => {
  const responseData = {};

  //전체 일일 미션 클리어
  let result = await DB(
    `
    SELECT
    cdm.mission_no
    , concat(DATE_FORMAT(now(), '%Y-%m-%d'), ' 23:59:59') end_date
    , ifnull(current_result, 0) current_result
    , limit_count
    , cdm.currency
    , fn_get_design_info(icon_image_id, 'url') icon_image_url
    , fn_get_design_info(icon_image_id, 'key') icon_image_key
    , quantity
    , CASE WHEN isnull(reward_date) THEN 
        CASE WHEN ifnull(current_result, 0) >= limit_count THEN 1 ELSE 0 END 
    ELSE 2 END state
    FROM com_daily_mission cdm
    INNER JOIN com_currency cc ON cdm.currency = cc.currency 
    LEFT OUTER JOIN user_daily_mission udm 
    ON userkey = ? 
    AND udm.create_date BETWEEN concat(DATE_FORMAT(now(), '%Y-%m-%d'), ' 00:00:00') AND concat(DATE_FORMAT(now(), '%Y-%m-%d'), ' 23:59:59')
    AND cdm.mission_no = udm.mission_no
    WHERE cdm.mission_no = 1
    AND is_active > 0;
    `,
    [userkey]
  );
  if (result.state && result.row.length > 0) {
    const { end_date } = result.row[0];
    const endDate = new Date(end_date);
    result.row[0].end_date_tick = endDate.getTime(); // tick 넣어주기!
  }
  responseData.all = result.row;

  //일일 미션 리스트
  result = await DB(
    `
    SELECT 
    cdm.mission_no
    , cdm.currency 
    , fn_get_design_info(icon_image_id, 'url') icon_image_url
    , fn_get_design_info(icon_image_id, 'key') icon_image_key
    , quantity
    , fn_get_localize_text(content_id, ?) content
    , ifnull(current_result, 0) current_result
    , limit_count
    , CASE WHEN isnull(reward_date) THEN 
        CASE WHEN ifnull(current_result, 0) >= limit_count THEN 1 ELSE 0 END 
    ELSE 2 END state
    FROM com_daily_mission cdm
    INNER JOIN com_currency cc ON cdm.currency = cc.currency 
    LEFT OUTER JOIN user_daily_mission udm 
    ON userkey = ? 
    AND udm.create_date BETWEEN concat(DATE_FORMAT(now(), '%Y-%m-%d'), ' 00:00:00') AND concat(DATE_FORMAT(now(), '%Y-%m-%d'), ' 23:59:59')
    AND cdm.mission_no = udm.mission_no
    WHERE is_active > 0
    AND cdm.mission_no <> 1;
    `,
    [lang, userkey]
  );
  responseData.single = result.row;

  return responseData;
};

//! 일일 미션 보상 받기
export const requestDailyMissionReward = async (req, res) => {
  const {
    body: { userkey, lang = "KO", mission_no = -1 },
  } = req;

  const responseData = {};

  //유효성 검사
  let result = await DB(
    `
    SELECT * 
    FROM user_daily_mission udm, com_daily_mission cdm
    WHERE udm.mission_no = cdm.mission_no 
    AND userkey = ? 
    AND cdm.mission_no = ?
    AND now() BETWEEN create_date AND concat(DATE_FORMAT(now(), '%Y-%m-%d'), ' 23:59:59')
    AND current_result = limit_count
    AND is_active > 0;`,
    [userkey, mission_no]
  );
  if (!result.state || result.row.length === 0) {
    logger.error(`requestDailyMissionReward Error 1`);
    respondDB(res, 80019);
    return;
  }

  const { mission_id, currency, quantity, reward_date } = result.row[0];

  if (reward_date) {
    logger.error(`requestDailyMissionReward Error 2`);
    respondDB(res, 6123, "already received");
    return;
  }

  //보상 다이렉트로 지급
  result = await transactionDB(
    `
    CALL pier.sp_insert_user_property(?, ?, ?, 'ifyou_mission');
    UPDATE user_daily_mission SET reward_date = now() WHERE mission_id = ?;
    `,
    [userkey, currency, quantity, mission_id]
  );
  if (!result.state) {
    logger.error(`requestDailyMissionReward Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  //뱅크 정보
  responseData.bank = await getUserBankInfo(req.body);

  //연속 출석
  responseData.attendanceMission = await getContinuousAttendanceList(userkey);

  //일일 미션
  responseData.dailyMission = await getDailyMissionList(userkey, lang);

  res.status(200).json(responseData);
  logAction(userkey, "ifyou_mission", req.body);
};

//! 일일 미션 누적 처리하기
export const increaseDailyMissionCount = async (req, res) => {
  const {
    body: { userkey, lang = "KO", mission_no = -1 },
  } = req;

  const responseData = {};

  //해당하는 일일 미션 체크
  let result = await DB(
    `
    SELECT 
    fn_check_daily_mission_done(?, mission_no) mission_done
    FROM com_daily_mission 
    WHERE mission_no = ?
    AND is_active > 0
    AND mission_no <> 1;
    `,
    [userkey, mission_no]
  );
  if (!result.state || result.row.length === 0) {
    logger.error(`increaseDailyMissionCount Error 1`);
    respondDB(res, 80019, "unvaild value");
    return;
  }

  const { mission_done } = result.row[0];
  if (mission_done === 1) {
    logger.error(`increaseDailyMissionCount Error 2-1`);
    respondDB(res, 80078, "already done");
    return;
  } else {
    result = await DB(`CALL pier.sp_update_user_daily_mission(?, ?, 1);`, [
      userkey,
      mission_no,
    ]);
    if (!result.state) {
      logger.error(`increaseDailyMissionCount Error 2-2 ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  //연속 출석
  responseData.attendanceMission = await getContinuousAttendanceList(userkey);

  //일일 미션
  responseData.dailyMission = await getDailyMissionList(userkey, lang);

  res.status(200).json(responseData);
  logAction(userkey, "ifyou_mission", req.body);
};

//! 이프유 플레이 전체 리스트
export const requestIfyouPlayList = async (req, res) => {
  const {
    body: { userkey, lang = "KO" },
  } = req;

  const responseData = {};

  //연속 출석
  responseData.attendanceMission = await getContinuousAttendanceList(userkey);

  //일일 미션
  responseData.dailyMission = await getDailyMissionList(userkey, lang);

  res.status(200).json(responseData);
};
