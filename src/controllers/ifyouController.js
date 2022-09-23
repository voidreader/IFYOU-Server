import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, logAD, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB, respondFail } from "../respondent";
import { getContinuousAttendanceList } from "./attendanceController";
import { getUserBankInfo } from "./bankController";
import { getUserUnreadMailCount } from "./clientController";
import { UQ_ACCQUIRE_CURRENCY } from "../USERQStore";

//? 이프유 플레이 시작
//* 연속 출석 관리는 이미 attendanceController에 이미 작업을 해서 그대로 두고
//* 그 이후의 이프유 플레이는 여기 파일에서 관리

// * 일일 미션 리스트 신규 버전(2022.09.15)
const getDailyMissionListOptimized = async (userkey, lang) => {
  const result = await DB(`
  SELECT cdm.mission_no
        , cdm.currency 
        , quantity
        , fn_get_localize_text(content_id, '${lang}') content
        , ifnull(current_result, 0) current_result
        , cdm.limit_count
        , CASE WHEN ifnull(current_result, 0) >= cdm.limit_count THEN 1 ELSE 0 END state
        , ifnull(udm.received, 0) received
        , concat(DATE_FORMAT(now(), '%Y-%m-%d'), ' 23:59:59') end_date
  FROM com_daily_mission cdm
  INNER JOIN com_currency cc ON cdm.currency = cc.currency 
  LEFT OUTER JOIN user_daily_mission_record udm ON userkey = ${userkey}
  AND cdm.mission_no = udm.mission_no
  WHERE is_active > 0
  ORDER BY mission_no ;
  `);

  // tick 작업한다.
  if (result.state && result.row.length > 0) {
    const { end_date } = result.row[0];
    const endDate = new Date(end_date);
    const end_date_tick = endDate.getTime();

    result.row.forEach((item) => {
      item.end_date_tick = end_date_tick;
    });
  } // tick 작업 종료

  return result.row;
};

// * 일일 미션 누적 신규 버전(2022.09.15)
export const increaseDailyMissionCountOptimized = async (req, res) => {
  const {
    body: { userkey, lang = "KO", mission_no = -1 },
  } = req;

  // 무조건 1씩 증가 처리
  const insertResult = await DB(`
  INSERT INTO user_daily_mission_record (userkey, mission_no, current_result) VALUES (${userkey}, ${mission_no}, 1) ON DUPLICATE KEY UPDATE  current_result = current_result + 1;
  `);

  if (!insertResult.state) {
    logger.error(
      `increaseDailyMissionCountOptimized Error [${insertResult.error}]`
    );
  }

  const responseData = {};

  responseData.dailyMission = await getDailyMissionListOptimized(userkey, lang);
  res.status(200).json(responseData);

  logAction(userkey, "ifyou_mission", req.body);
};

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

//! 광고 보고 보상
const getAdRewardList = async (userkey, lang, ad_no) => {
  let query = ``;
  if (ad_no === 1) {
    //미션 광고 보상
    query = `
    , fn_get_max_ad_reward_value(${userkey}, 1, 'clear') first_clear
    , second_currency 
    , second_quantity
    , fn_get_max_ad_reward_value(${userkey}, 2, 'clear') second_clear
    , third_currency 
    , third_quantity
    , fn_get_max_ad_reward_value(${userkey}, 3, 'clear') third_clear
    , ifnull(step, 1) AS step 
    , ifnull(current_result, 0) AS current_result
    , CASE WHEN step = 2 THEN second_count 
           WHEN step = 3 THEN third_count 
    ELSE first_count END AS total_count
    , concat(DATE_FORMAT(now(), '%Y-%m-%d'), ' 23:59:59') remain_date    
    `;
  } else {
    //타이머 광고 보상
    query = `
    , fn_get_localize_text(car.content, '${lang}') content
    , DATE_FORMAT(DATE_ADD(ifnull(clear_date, '2022-01-01'), INTERVAL min_time MINUTE), '%Y-%m-%d %T') remain_date    
    `;
  }

  const result = await DB(
    `
  SELECT 
  fn_get_localize_text(car.name, '${lang}') name
  , first_currency 
  , first_quantity 
  , DATE_FORMAT(clear_date, '%Y-%m-%d %T') clear_date
  ${query}
  FROM com_ad_reward car
  LEFT OUTER JOIN user_ad_reward_history uarh 
  ON car.ad_no = uarh.ad_no
  AND uarh.userkey = ?
  AND uarh.history_no = fn_get_max_ad_reward_value(?, car.ad_no, 'id')
  WHERE car.ad_no = ?
  AND is_public > 0;
  `,
    [userkey, userkey, ad_no]
  );
  if (result.state && result.row.length > 0) {
    const { remain_date } = result.row[0];
    const remainDate = new Date(remain_date);
    result.row[0].remain_date_tick = remainDate.getTime(); // tick 넣어주기!
  }

  return result.row;
};

// * 일일 미션 보상 받기 수정버전 2022.09.15
export const requestDailyMissionRewardOptimized = async (req, res) => {
  const {
    body: { userkey, lang = "EN", mission_no = -1, by_ad = 0 },
  } = req;

  const responseData = {};
  responseData.result = 1;

  const validCheck = await slaveDB(`
  SELECT cdm.mission_no, cdm.currency, cdm.quantity, udm.received 
  FROM user_daily_mission_record udm, com_daily_mission cdm
  WHERE udm.mission_no = cdm.mission_no 
  AND userkey = ${userkey}
  AND cdm.mission_no = ${mission_no}
  AND current_result >= limit_count
  AND is_active > 0;
  `);

  // 유효성 체크 통과 못함!
  if (!validCheck.state || validCheck.row.length === 0) {
    logger.error(`Invalid request of daily mission ${req.body}`);
    responseData.result = 0; // 결과값을 0으로 전달
    responseData.message = "no data";
    res.status(200).json(responseData);
    return;
  }

  const { currency, quantity, received } = validCheck.row[0];

  // 이미 받은 경우
  if (received > 0) {
    responseData.result = 0;
    responseData.message = "received"; //
    return;
  }

  // 처리 쿼리 생성
  let query = ``;

  // 보상 즉시 지급
  query += `CALL pier.sp_insert_user_property(${userkey}, '${currency}', ${quantity}, 'ifyou_mission');`;

  // 수신 처리
  query += `UPDATE user_daily_mission_record SET received = 1 WHERE userkey = ${userkey} AND mission_no = ${mission_no};`;

  // 보상받는 미션이 1번 미션이 아닌 경우에 1번 미션의 진행도를 올려준다.
  if (mission_no !== 1) {
    query += `INSERT INTO user_daily_mission_record (userkey, mission_no, current_result) VALUES (${userkey}, 1, 1) ON DUPLICATE KEY UPDATE  current_result = current_result + 1;`;
  }

  const result = await transactionDB(query);

  if (!result.state) {
    logger.error(`requestDailyMissionRewardOptimized Error ${result.error}`);
    respondDB(res, 80026, result.error);
  }

  // 뱅크, 일일 미션 갱신 받는다.
  responseData.bank = await getUserBankInfo(req.body);
  responseData.dailyMission = await getDailyMissionListOptimized(userkey, lang);

  // 받은 재화 정보도 받는다
  responseData.currency = currency;
  responseData.quantity = quantity;

  res.status(200).json(responseData); // 응답

  logAction(userkey, "ifyou_mission_reward", req.body);
};

//! 일일 미션 보상 받기
export const requestDailyMissionReward = async (req, res) => {
  const {
    body: { userkey, lang = "KO", mission_no = -1 },
  } = req;

  const responseData = {};

  //유효성 검사
  let result = await slaveDB(
    `
    SELECT * 
    FROM user_daily_mission udm, com_daily_mission cdm
    WHERE udm.mission_no = cdm.mission_no 
    AND userkey = ? 
    AND cdm.mission_no = ?
    AND udm.create_date BETWEEN concat(DATE_FORMAT(now(), '%Y-%m-%d'), ' 00:00:00') AND concat(DATE_FORMAT(now(), '%Y-%m-%d'), ' 23:59:59')
    AND current_result >= limit_count
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
  if (mission_done === 0) {
    result = await DB(`CALL pier.sp_update_user_daily_mission(?, ?, 1);`, [
      userkey,
      mission_no,
    ]);
    if (!result.state) {
      logger.error(`increaseDailyMissionCount Error 2 ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  //연속 출석
  responseData.attendanceMission = await getContinuousAttendanceList(userkey);

  //일일 미션
  responseData.dailyMission = await getDailyMissionList(userkey, lang);

  //미션 광고 보상
  responseData.missionAdReward = await getAdRewardList(userkey, lang, 1);

  //타이머 광고 보상
  responseData.timerAdReward = await getAdRewardList(userkey, lang, 2);

  res.status(200).json(responseData);
  logAction(userkey, "ifyou_mission", req.body);
};

//! 미션 광고 보상 카운트 누적 처리 (삭제대상)
export const increaseMissionAdReward = async (req, res) => {
  const {
    body: { userkey, lang = "KO" },
  } = req;

  const responseData = {};
  let currentQuery = ``;
  let updateQuery = ``;

  let result = await DB(`
  SELECT 
  ifnull(history_no, 0) AS history_no 
  , clear_date
  FROM com_ad_reward car
  LEFT OUTER JOIN user_ad_reward_history uarh 
  ON car.ad_no = uarh.ad_no 
  And uarh.userkey = ${userkey}
  AND uarh.history_no = fn_get_max_ad_reward_value(${userkey}, car.ad_no, 'id')
  WHERE car.ad_no = 1
  AND is_public > 0;`);
  if (result.state && result.row.length > 0) {
    const { history_no, clear_date } = result.row[0];

    //이미 지급 받았으면 리턴
    if (clear_date) {
      logger.error(`increaseMissionAdReward Error`);
      respondDB(res, 80025, "already done");
      return;
    }

    //누적 데이터가 없으면 새데이터, 있으면 업데이트
    if (history_no === 0) {
      currentQuery = `INSERT INTO user_ad_reward_history(userkey, ad_no, step, current_result) VALUES(?, 1, 1, 1);`;
      updateQuery += mysql.format(currentQuery, [userkey]);
    } else {
      currentQuery = `UPDATE user_ad_reward_history SET current_result = current_result + 1 WHERE history_no = ?;`;
      updateQuery += mysql.format(currentQuery, [history_no]);
    }

    //카운트 누적
    result = await DB(updateQuery);
    if (!result.state) {
      logger.error(`increaseMissionAdReward Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  //연속 출석
  responseData.attendanceMission = await getContinuousAttendanceList(userkey);

  //일일 미션
  responseData.dailyMission = await getDailyMissionList(userkey, lang);

  //미션 광고 보상
  responseData.missionAdReward = await getAdRewardList(userkey, lang, 1);

  //타이머 광고 보상
  responseData.timerAdReward = await getAdRewardList(userkey, lang, 2);

  res.status(200).json(responseData);
  logAction(userkey, "ifyou_ad_count", req.body);
};

//! 미션 광고 보상 카운트 누적 처리 2022.09.16 수정버전
export const increaseMissionAdRewardOptimized = async (req, res) => {
  const {
    body: { userkey, lang = "KO" },
  } = req;

  const responseData = {};
  let currentQuery = ``;
  let updateQuery = ``;

  let result = await DB(`
  SELECT 
  ifnull(history_no, 0) AS history_no 
  , clear_date
  FROM com_ad_reward car
  LEFT OUTER JOIN user_ad_reward_history uarh 
  ON car.ad_no = uarh.ad_no 
  And uarh.userkey = ${userkey}
  AND uarh.history_no = fn_get_max_ad_reward_value(${userkey}, car.ad_no, 'id')
  WHERE car.ad_no = 1
  AND is_public > 0;`);
  if (result.state && result.row.length > 0) {
    const { history_no, clear_date } = result.row[0];

    //이미 지급 받았으면 리턴
    if (clear_date) {
      logger.error(`increaseMissionAdReward Error`);
      respondDB(res, 80025, "already done");
      return;
    }

    //누적 데이터가 없으면 새데이터, 있으면 업데이트
    if (history_no === 0) {
      currentQuery = `INSERT INTO user_ad_reward_history(userkey, ad_no, step, current_result) VALUES(?, 1, 1, 1);`;
      updateQuery += mysql.format(currentQuery, [userkey]);
    } else {
      currentQuery = `UPDATE user_ad_reward_history SET current_result = current_result + 1 WHERE history_no = ?;`;
      updateQuery += mysql.format(currentQuery, [history_no]);
    }

    //카운트 누적
    result = await DB(updateQuery);
    if (!result.state) {
      logger.error(`increaseMissionAdReward Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  //미션 광고 보상
  responseData.missionAdReward = await getAdRewardList(userkey, lang, 1);

  // 광고 때문에 데일리 미션도 증가시켜준다.
  responseData.dailyMission = await getDailyMissionListOptimized(userkey, lang);

  res.status(200).json(responseData);

  logAction(userkey, "ifyou_ad_count", req.body);
  logAD(userkey, -1, -1, "ifyou_ad_count");
};

//! 미션, 타이머 광고 보상 처리 2022.09.16 수정 버전
export const requestAdRewardOptimized = async (req, res) => {
  const {
    body: { userkey, ad_no = -1, lang = "KO" },
  } = req;

  // ad_no 1 : 누적형, 2: 시간형

  const responseData = {};
  responseData.result = 1;

  let whereQuery = ``;
  let currentQuery = ``;
  let updateQuery = ``;

  //달성 횟수 초과된 경우
  if (ad_no === 1) {
    whereQuery = `
    AND current_result >= fn_get_max_ad_reward_value(${userkey}, step, 'total') 
    AND clear_date IS NULL
    `;
  } else if (ad_no === 2) {
    whereQuery = `
    AND ifnull(date_add(uarh.clear_date, INTERVAL car.min_time MINUTE), '2022-01-01 00:00:00') < now()
    `;
  }

  let result = await DB(`
  SELECT history_no
        , step
        , clear_date
        , CASE WHEN step = 2 THEN second_currency 
              WHEN step = 3 THEN third_currency 
        ELSE first_currency END AS currency 
        , CASE WHEN step = 2 THEN second_quantity 
              WHEN step = 3 THEN third_quantity 
        ELSE first_quantity END AS quantity
        , ifnull(current_result, 0) AS current_result
        , CASE WHEN step = 2 THEN second_count 
              WHEN step = 3 THEN third_count 
        ELSE first_count END total_count
  FROM com_ad_reward car 
    LEFT OUTER JOIN user_ad_reward_history uarh ON car.ad_no = uarh.ad_no 
  AND uarh.userkey = ${userkey}
  AND uarh.history_no = fn_get_max_ad_reward_value(${userkey}, car.ad_no, 'id')
  WHERE car.ad_no = ${ad_no}
  ${whereQuery}
  AND is_public > 0;
  `);

  if (result.state && result.row.length > 0) {
    // 기준정보 유효성 체크 완료.
    const { history_no, clear_date, currency, quantity, step } = result.row[0];

    if (clear_date && ad_no === 1) {
      // 이미 수신된 상태를 또 수신하려고 하는 경우
      respondFail(res, responseData, "received");
      return;
    }

    // 보상 즉시 지급으로 변경

    responseData.currency = currency;
    responseData.quantity = quantity;

    updateQuery += mysql.format(UQ_ACCQUIRE_CURRENCY, [
      userkey,
      currency,
      quantity,
      `ifyou_ad_reward_${ad_no}`,
    ]);

    if (ad_no === 1) {
      //미션 광고 보상
      currentQuery = `UPDATE user_ad_reward_history SET clear_date = now() WHERE history_no = ?;`;
      updateQuery += mysql.format(currentQuery, [history_no]);

      //다음 단계 insert(마지막 단계 제외)
      if (step < 3) {
        currentQuery = `INSERT INTO user_ad_reward_history(userkey, ad_no, step, current_result) VALUES(?, ?, ?, 0);`;
        updateQuery += mysql.format(currentQuery, [userkey, ad_no, step + 1]);
      }
    } else {
      //타이머 광고 보상
      currentQuery = `
      INSERT INTO user_ad_reward_history(userkey, ad_no, clear_date) VALUES(?, ?, now());
      `;
      updateQuery += mysql.format(currentQuery, [userkey, ad_no]);
    }

    result = await transactionDB(updateQuery); // * 실행.

    if (!result.state) {
      logger.error(`requestAdReward Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  } else {
    // 기준 정보 없음
    respondFail(res, responseData, "no data");
    return;
  }

  if (ad_no === 1)
    //미션 광고 보상
    responseData.missionAdReward = await getAdRewardList(userkey, lang, 1);
  //타이머 광고 보상
  else responseData.timerAdReward = await getAdRewardList(userkey, lang, 2);

  responseData.bank = await getUserBankInfo(req.body);

  responseData.dailyMission = await getDailyMissionListOptimized(userkey, lang);

  res.status(200).json(responseData);

  logAction(userkey, `ifyou_ad_reward_${ad_no}`, req.body);
  logAD(userkey, -1, -1, "ifyou_timer_ad");
};

//! 미션, 타이머 광고 보상 처리
export const requestAdReward = async (req, res) => {
  const {
    body: { userkey, ad_no = -1, lang = "KO" },
  } = req;

  const responseData = {};
  let whereQuery = ``;
  let currentQuery = ``;
  let updateQuery = ``;
  let mailType = `mission_ad_reward`;

  //달성 횟수 초과된 경우
  if (ad_no === 1) {
    whereQuery = `
    AND current_result >= fn_get_max_ad_reward_value(${userkey}, step, 'total') 
    AND clear_date IS NULL
    `;
  } else if (ad_no === 2) {
    whereQuery = `
    AND ifnull(date_add(uarh.clear_date, INTERVAL car.min_time MINUTE), '2022-01-01 00:00:00') < now()
    `;
  }

  //메인 타입 변경
  if (ad_no === 2) {
    mailType = `timer_ad_reward`;
  }

  let result = await DB(`
  SELECT
  history_no
  , step
  , clear_date
  , CASE WHEN step = 2 THEN second_currency 
         WHEN step = 3 THEN third_currency 
  ELSE first_currency END AS currency 
  , CASE WHEN step = 2 THEN second_quantity 
         WHEN step = 3 THEN third_quantity 
  ELSE first_quantity END AS quantity
  , ifnull(current_result, 0) AS current_result
  , CASE WHEN step = 2 THEN second_count 
         WHEN step = 3 THEN third_count 
  ELSE first_count END total_count
  FROM com_ad_reward car 
  LEFT OUTER JOIN user_ad_reward_history uarh
  ON car.ad_no = uarh.ad_no 
  AND uarh.userkey = ${userkey}
  AND uarh.history_no = fn_get_max_ad_reward_value(${userkey}, car.ad_no, 'id')
  WHERE car.ad_no = ${ad_no}
  ${whereQuery}
  AND is_public > 0;`);
  if (result.state && result.row.length > 0) {
    const { history_no, clear_date, currency, quantity, step } = result.row[0];

    if (clear_date && ad_no === 1) {
      logger.error(`requestAdReward Error`);
      respondDB(res, 80025, "already done");
      return;
    }

    //메일 전송
    currentQuery = `
    INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
    VALUES(?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;
    updateQuery += mysql.format(currentQuery, [
      userkey,
      mailType,
      currency,
      quantity,
    ]);

    if (ad_no === 1) {
      //미션 광고 보상

      currentQuery = `UPDATE user_ad_reward_history SET clear_date = now() WHERE history_no = ?;`;
      updateQuery += mysql.format(currentQuery, [history_no]);

      //다음 단계 insert(마지막 단계 제외)
      if (step < 3) {
        currentQuery = `INSERT INTO user_ad_reward_history(userkey, ad_no, step, current_result) VALUES(?, ?, ?, 0);`;
        updateQuery += mysql.format(currentQuery, [userkey, ad_no, step + 1]);
      }
    } else {
      //타이머 광고 보상
      currentQuery = `
      INSERT INTO user_ad_reward_history(userkey, ad_no, clear_date) VALUES(?, ?, now());
      `;
      updateQuery += mysql.format(currentQuery, [userkey, ad_no]);
    }

    result = await transactionDB(updateQuery);
    if (!result.state) {
      logger.error(`requestAdReward Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  //연속 출석
  responseData.attendanceMission = await getContinuousAttendanceList(userkey);

  //일일 미션
  responseData.dailyMission = await getDailyMissionList(userkey, lang);

  //미션 광고 보상
  responseData.missionAdReward = await getAdRewardList(userkey, lang, 1);

  //타이머 광고 보상
  responseData.timerAdReward = await getAdRewardList(userkey, lang, 2);

  responseData.unreadMailCount = await getUserUnreadMailCount(userkey);

  res.status(200).json(responseData);
  logAction(userkey, "ifyou_ad_reward", req.body);
};

//! 이프유 플레이 전체 리스트(42버전 이후 삭제 대상)
export const requestIfyouPlayList = async (req, res) => {
  const {
    body: { userkey, lang = "KO" },
  } = req;

  const responseData = {};

  //연속 출석
  responseData.attendanceMission = await getContinuousAttendanceList(userkey);

  //일일 미션
  responseData.dailyMission = await getDailyMissionList(userkey, lang);

  //미션 광고 보상
  responseData.missionAdReward = await getAdRewardList(userkey, lang, 1);

  //타이머 광고 보상
  responseData.timerAdReward = await getAdRewardList(userkey, lang, 2);

  res.status(200).json(responseData);
};

//! 이프유 플레이 전체 리스트
export const requestIfyouPlayListOptimized = async (req, res) => {
  const {
    body: { userkey, lang = "EN" },
  } = req;

  const responseData = {};

  //연속 출석
  responseData.attendanceMission = await getContinuousAttendanceList(userkey);

  //일일 미션
  responseData.dailyMission = await getDailyMissionListOptimized(userkey, lang);

  //미션 광고 보상
  responseData.missionAdReward = await getAdRewardList(userkey, lang, 1);

  //타이머 광고 보상
  responseData.timerAdReward = await getAdRewardList(userkey, lang, 2);

  res.status(200).json(responseData);
};
