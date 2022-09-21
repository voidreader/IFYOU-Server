import mysql from "mysql2/promise";
import { response } from "express";
import dotenv from "dotenv";
import { DB, logAction, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB, respondFail } from "../respondent";
import { getUserBankInfo, getCurrencyQuantity } from "./bankController";

dotenv.config();

let { CURRENT_UPDATE } = process.env;
if (!CURRENT_UPDATE) CURRENT_UPDATE = 0;

const getAttendanceList = async (userkey) => {
  const responseData = {};
  const attendanceArray = [];

  // 연속 출석 제외
  const result = await DB(
    `
  SELECT a.attendance_id 
  , day_seq
  , b.currency
  , quantity
  , fn_get_design_info(icon_image_id, 'url') icon_image_url
  , fn_get_design_info(icon_image_id, 'key') icon_image_key
  , fn_check_attendance_exists(${userkey}, a.attendance_id, day_seq, fn_get_attendance_max(${userkey}, a.attendance_id)) is_receive -- 보상 수령 여부 
  , fn_check_attendance_past_check(${userkey}, a.attendance_id, b.day_seq) is_past -- 대상 day_seq가 과거인지 체크 
  FROM com_attendance a, com_attendance_daily b, com_currency c
  WHERE a.attendance_id > 0
  AND a.attendance_id = b.attendance_id
  AND b.currency = c.currency
  AND is_public > 0
  AND now() BETWEEN from_date AND to_date
  AND kind <> -1
  ;`
  );

  let isCurrentDecided = false; // 현재 dayseq 결정됨

  // eslint-disable-next-line no-restricted-syntax
  for (const item of result.row) {
    const attendance_id = item.attendance_id.toString();
    if (!Object.prototype.hasOwnProperty.call(responseData, attendance_id)) {
      //attendance_id를 property로 선언
      attendanceArray.push(item.attendance_id);
      responseData.attendance = attendanceArray;
      responseData[attendance_id] = [];
    }

    // is_receive가 0이고 (안받음), is_past 가 0이면 클릭이 가능한데, 회차에서 가장 처음 가능한 day_seq만 !
    if (item.is_past < 1 && !isCurrentDecided) {
      item.current = 1; // 현재 회차다.
      isCurrentDecided = true; // 결정되었다.

      // 보상 받을 수 있는지 여부 (is_receive) 체크
      item.click_check = 0;
      if (item.is_receive < 1) item.click_check = 1;
    } else {
      // 그 외는 다 빵빵.
      item.click_check = 0;
      item.current = 0;
    }

    responseData[attendance_id].push({
      attendance_id: item.attendance_id,
      day_seq: item.day_seq,
      currency: item.currency,
      quantity: item.quantity,
      icon_image_url: item.icon_image_url,
      icon_image_key: item.icon_image_key,
      is_receive: item.is_receive,
      click_check: item.click_check,
      current: item.current,
    });
  }

  return responseData;
};

//! 연속 출석 리스트
export const getContinuousAttendanceList = async (userkey) => {
  const responseData = {};

  //let updateCheck = 0;

  //연속 출석 실패 확인
  // let result = await DB(`
  // SELECT attendance_no
  // , CASE WHEN date(DATE_ADD(attendance_date, INTERVAL 1 DAY)) < date(now()) THEN -1 ELSE 0 END attendance_check
  // FROM user_continuous_attendance
  // WHERE attendance_no = fn_get_max_attendance_id(?, 'user')
  // AND is_attendance = 1;
  // `, [userkey]);
  // if(result.state && result.row.length > 0){
  //   const { attendance_no, attendance_check, } = result.row[0];
  //   if(attendance_check < 0) updateCheck = 1;
  //   //출석일이 현재일보다 이전이면 상태값 업데이트
  //   if(updateCheck) await DB(`UPDATE user_continuous_attendance SET is_attendance = 0 WHERE attendance_no = ?;`, [attendance_no]);
  // }

  // //유저 정보
  // result = await DB(
  //   `
  //   SELECT
  //   DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
  //   , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
  //   , fn_get_continuous_attendance(?, start_date, end_date, 0, 'day') attendance_day
  //   , fn_get_continuous_attendance(?, start_date, end_date, 0, 'check') is_attendance
  //   , DATEDIFF(end_date, now()) remain_day
  //   , CASE WHEN datediff(now(), start_date)+1 > fn_get_continuous_attendance(?, start_date, end_date, 0, 'day') THEN
  // 	  DATEDIFF(now(), start_date)+1-fn_get_continuous_attendance(?, start_date, end_date, 0, 'day')
  //   ELSE 0 END reset_day
  //   FROM com_attendance_season
  //   WHERE season_no = 0;

  // `,
  //   [userkey, userkey, userkey, userkey]
  // );
  // responseData.user_info = result.row;

  // const { start_date, end_date } = result.row[0];

  // //연속 출석
  // result = await DB(
  //   `
  // SELECT
  // day_seq
  // , cc.currency
  // , fn_get_design_info(cc.icon_image_id, 'url') currency_url
  // , fn_get_design_info(cc.icon_image_id, 'key') currency_key
  // , quantity
  // , fn_get_continuous_attendance(?, ?, ?, day_seq, 'reward') reward_check
  // FROM com_attendance_daily cad INNER JOIN com_currency cc ON cad.currency = cc.currency
  // WHERE cad.attendance_id = fn_get_max_attendance_id(-1, 'com');`,
  //   [userkey, start_date, end_date]
  // );
  // if (result.state && result.row.length > 0)
  //   responseData.continuous_attendance = result.row;

  //기존 출석
  const result = await getAttendanceList(userkey);
  responseData.attendance = result;

  return responseData;
};

//! 출석리스트
export const attendanceList = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  const result = await getAttendanceList(userkey);

  res.status(200).json(result);
};

//! 출석 보상
export const sendAttendanceRewardOptimized = async (req, res) => {
  const {
    body: { userkey, attendance_id = 0, day_seq = 0 },
  } = req;

  let responseData = {};
  responseData.result = 1;

  //* 유효한지 확인
  let result = await DB(
    `
    SELECT currency
    , quantity 
    , fn_get_attendance_max(?, a.attendance_id) attendance_max
    FROM com_attendance a, com_attendance_daily b 
    WHERE a.attendance_id = b.attendance_id
    AND is_public > 0 
    AND now() BETWEEN from_date AND to_date
    AND (is_loop > 0 OR ( fn_get_attendance_cnt(?, a.attendance_id, fn_get_attendance_max(?, a.attendance_id)) < kind AND is_loop = 0 ) )
    AND a.attendance_id = ?
    AND day_seq = ?
    ;`,
    [userkey, userkey, userkey, attendance_id, day_seq]
  );
  if (!result.state || result.row.length === 0) {
    logger.error(`sendAttendanceReward Error 1`);
    respondFail(res, responseData, "no data");
    return;
  }

  // 보상 정보 및 라스트 출석
  const { currency, quantity, attendance_max } = result.row[0];

  // console.log(currency, quantity, attendance_max);
  //* 중복 확인
  result = await DB(
    `
    SELECT * FROM user_attendance
    WHERE userkey = ? 
    AND attendance_id = ?
    AND day_seq = ?
    AND loop_cnt = ?;
    `,
    [userkey, attendance_id, day_seq, attendance_max]
  );
  if (!result.state || (result.state && result.row.length > 0)) {
    logger.error(`sendAttendanceReward Error 3`);
    respondFail(res, responseData, "already received");
    return;
  }

  //* 건너 뛰고 보상 받는지 확인
  if (day_seq !== 1) {
    let days = ``;

    //이전 일수 가져오기
    result = await slaveDB(
      `
        SELECT day_seq
        FROM com_attendance_daily 
        WHERE attendance_id = ? 
        AND day_seq < ?;
        `,
      [attendance_id, day_seq]
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      days += `${item.day_seq},`;
    }
    days = days.slice(0, -1);

    //연속으로 출석 보상 받았는지 확인
    result = await DB(
      `
        SELECT * FROM user_attendance
        WHERE userkey = ? 
        AND attendance_id = ? 
        AND loop_cnt = ? 
        AND day_seq IN (${days});
        `,
      [userkey, attendance_id, attendance_max]
    );
    if (!result.state || result.row.length === 0) {
      // 아무것도 없으면
      logger.error(`sendAttendanceReward Error 4-1`);
      respondFail(res, responseData, "no data");
      return;
    } else {
      // eslint-disable-next-line no-lonely-if
      if (parseInt(day_seq - 1, 10) !== result.row.length) {
        //연속으로 출석 보상 받지 않고, 건너뛸 경우
        logger.error(`sendAttendanceReward Error4-2`);
        respondFail(res, responseData, "wrong order");
        return;
      }
    }
  }
  // * 유효성 검증 종료

  // 재화 지급 시작
  let currentQuery = ``;
  let updateQuery = ``;
  // 누적
  currentQuery = `
    INSERT INTO user_attendance(userkey, attendance_id, loop_cnt, day_seq, currency, quantity) 
    VALUES(?, ?, ?, ?, ?, ?);
    `;
  updateQuery += mysql.format(currentQuery, [
    userkey,
    attendance_id,
    attendance_max,
    day_seq,
    currency,
    quantity,
  ]);

  // 즉시 지급으로 변경
  updateQuery += `CALL pier.sp_insert_user_property(${userkey}, '${currency}', ${quantity}, 'attendance');`;

  result = await transactionDB(updateQuery);
  if (!result.state) {
    logger.error(`sendAttendanceReward Error 4 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  responseData.day_seq = day_seq; // 출석일수 일차
  responseData.currency = currency; // 받은 재화
  responseData.quantity = quantity; // 받은 재화 수량
  responseData.bank = await getUserBankInfo(req.body);

  result = await getContinuousAttendanceList(userkey);

  responseData = {
    ...responseData,
    //user_info: result.user_info,
    //continuous_attendance: result.continuous_attendance,
    attendance: result.attendance,
  };

  res.status(200).json(responseData);
  logAction(userkey, "attendance", req.body);
};

//! 출석 보상
export const sendAttendanceReward = async (req, res) => {
  const {
    body: { userkey, attendance_id = 0, day_seq = 0 },
  } = req;

  let responseData = {};

  //* 유효한지 확인
  let result = await DB(
    `
    SELECT currency
    , quantity 
    , fn_get_attendance_max(?, a.attendance_id) attendance_max
    FROM com_attendance a, com_attendance_daily b 
    WHERE a.attendance_id = b.attendance_id
    AND is_public > 0 
    AND now() BETWEEN from_date AND to_date
    AND (is_loop > 0 OR ( fn_get_attendance_cnt(?, a.attendance_id, fn_get_attendance_max(?, a.attendance_id)) < kind AND is_loop = 0 ) )
    AND a.attendance_id = ?
    AND day_seq = ?
    ;`,
    [userkey, userkey, userkey, attendance_id, day_seq]
  );
  if (!result.state || result.row.length === 0) {
    logger.error(`sendAttendanceReward Error 1`);
    respondDB(res, 80019);
    return;
  }

  const { currency, quantity, attendance_max } = result.row[0];

  // console.log(currency, quantity, attendance_max);

  //* 금일 받았는지 확인
  result = await DB(
    `
    SELECT * FROM user_attendance 
    WHERE userkey = ? 
    AND attendance_id = ?
    AND date(now()) = date(action_date);
    `,
    [userkey, attendance_id]
  );
  if (!result.state || (result.state && result.row.length > 0)) {
    logger.error(`sendAttendanceReward Error 2`);
    respondDB(res, 80025);
    return;
  }

  //* 중복 확인
  result = await DB(
    `
    SELECT * FROM user_attendance
    WHERE userkey = ? 
    AND attendance_id = ?
    AND day_seq = ?
    AND loop_cnt = ?;
    `,
    [userkey, attendance_id, day_seq, attendance_max]
  );
  if (!result.state || (result.state && result.row.length > 0)) {
    logger.error(`sendAttendanceReward Error 3`);
    respondDB(res, 80025);
    return;
  }

  //* 건너 뛰고 보상 받는지 확인
  if (day_seq !== 1) {
    let days = ``;

    //이전 일수 가져오기
    result = await DB(
      `
        SELECT day_seq
        FROM com_attendance_daily 
        WHERE attendance_id = ? 
        AND day_seq < ?;
        `,
      [attendance_id, day_seq]
    );
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      days += `${item.day_seq},`;
    }
    days = days.slice(0, -1);

    //연속으로 출석 보상 받았는지 확인
    result = await DB(
      `
        SELECT * FROM user_attendance
        WHERE userkey = ? 
        AND attendance_id = ? 
        AND loop_cnt = ? 
        AND day_seq IN (${days});
        `,
      [userkey, attendance_id, attendance_max]
    );
    if (!result.state || result.row.length === 0) {
      // 아무것도 없으면
      logger.error(`sendAttendanceReward Error 4-1`);
      respondDB(res, 80110);
      return;
    } else {
      // eslint-disable-next-line no-lonely-if
      if (parseInt(day_seq - 1, 10) !== result.row.length) {
        //연속으로 출석 보상 받지 않고, 건너뛸 경우
        logger.error(`sendAttendanceReward Error 4-2`);
        respondDB(res, 80110);
        return;
      }
    }
  }

  let currentQuery = ``;
  let updateQuery = ``;
  // 누적
  currentQuery = `
    INSERT INTO user_attendance(userkey, attendance_id, loop_cnt, day_seq, currency, quantity) 
    VALUES(?, ?, ?, ?, ?, ?);
    `;
  updateQuery += mysql.format(currentQuery, [
    userkey,
    attendance_id,
    attendance_max,
    day_seq,
    currency,
    quantity,
  ]);

  // 메일 발송
  currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
    VALUES(?, 'attendance', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;
  updateQuery += mysql.format(currentQuery, [userkey, currency, quantity]);

  // 연속 출석 처리
  // result = await DB(
  //   `
  // SELECT
  // DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
  // , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
  // , fn_get_max_attendance_id(-1, 'com') continuous_attendance_id
  // , ifnull(fn_get_max_attendance_id(?, 'user'), 0) attendance_no
  // FROM com_attendance_season
  // WHERE season_no = 0;`,
  //   [userkey]
  // );
  // const {
  //   start_date,
  //   end_date,
  //   continuous_attendance_id,
  //   attendance_no,
  // } = result.row[0];
  // if (attendance_no === 0) { //처음 연속 출석하는 경우
  //   currentQuery = `INSERT INTO user_continuous_attendance(attendance_id, userkey, start_date, end_date) VALUES(?, ?, ?, ?);`;
  //   updateQuery += mysql.format(currentQuery, [
  //     continuous_attendance_id,
  //     userkey,
  //     start_date,
  //     end_date,
  //   ]);
  // } else {
  //   result = await DB(
  //   `
  //   SELECT
  //   CASE WHEN date(DATE_ADD(attendance_date, INTERVAL 1 DAY)) = date(now()) THEN 0
  //   WHEN date(DATE_ADD(attendance_date, INTERVAL 1 DAY)) < date(now()) THEN -1
  //   ELSE 1 END attendance_done
  //   , current_result
  //   , day_seq current_day_seq
  //   , fn_get_next_day_seq(attendance_id, day_seq) next_day_seq
  //   FROM user_continuous_attendance
  //   WHERE attendance_no = fn_get_max_attendance_id(?, 'user')
  //   AND is_attendance = 1;`,
  //     [userkey]
  //   );
  //   if (result.state && result.row.length > 0) {
  //     const { attendance_done, current_result, current_day_seq, next_day_seq } =
  //       result.row[0];
  //     if (attendance_done === 0) {
  //       //금일 연속 출석 안하는 경우
  //       if (current_day_seq <= current_result) {
  //         //보상 일자(3,7,10,14일) 충족하는 경우 다음 보상일자 insert
  //         currentQuery = `INSERT INTO user_continuous_attendance(attendance_id, userkey, day_seq, current_result, start_date, end_date) VALUES(?, ?, ?, ?, ?, ?);`;
  //         updateQuery += mysql.format(currentQuery, [
  //           continuous_attendance_id,
  //           userkey,
  //           next_day_seq,
  //           current_result + 1,
  //           start_date,
  //           end_date,
  //         ]);
  //       } else {
  //         //현재 출석일수, 출석일만 업데이트
  //         currentQuery = `
  //         UPDATE user_continuous_attendance
  //         SET current_result = current_result + 1
  //         , attendance_date = now()
  //         WHERE attendance_no = ?;`;
  //         updateQuery += mysql.format(currentQuery, [attendance_no]);
  //       }
  //     } else if (attendance_done === -1) {
  //       //연속 출석을 실패한 경우
  //       currentQuery = `
  //       UPDATE user_continuous_attendance
  //       SET is_attendance = 0
  //       WHERE attendance_no = ?;
  //       `;
  //       updateQuery += mysql.format(currentQuery, [attendance_no]);
  //     }
  //   }
  // }

  result = await transactionDB(updateQuery);
  if (!result.state) {
    logger.error(`sendAttendanceReward Error 4 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  responseData.day_seq = day_seq;

  //* 안 읽은 메일 건수
  const unreadMailResult = await DB(
    `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
    [userkey]
  );

  responseData.unreadMailCount = 0;
  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    responseData.unreadMailCount = unreadMailResult.row[0].cnt;

  result = await getContinuousAttendanceList(userkey);

  responseData = {
    ...responseData,
    //user_info: result.user_info,
    //continuous_attendance: result.continuous_attendance,
    attendance: result.attendance,
  };

  res.status(200).json(responseData);
  logAction(userkey, "attendance", req.body);
};

//? 이프유 플레이 시작

//! 출석 미션 리스트
export const requestAttendanceMission = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  //유저정보, 연속 출석, 기존 출석 리스트
  const result = await getContinuousAttendanceList(userkey);

  res.status(200).json(result);
};

//! 연속 출석 보상 받기
export const receiveAttendanceMissionReward = async (req, res) => {
  const {
    body: { userkey, request_day = 0 },
  } = req;

  let result = ``;
  let currentQuery = ``;
  let updateQuery = ``;

  let responseData = {};

  //유효성 검사 체크
  if (request_day < 1) {
    logger.error(`receiveAttendanceMissionReward Error 1`);
    respondDB(res, 80019, "unvalid value");
    return;
  }

  //보상 리스트 확인
  result = await DB(
    `
  SELECT
  attendance_no
  , currency
  , quantity
  , uca.current_result attendance_day
  , cad.day_seq
  FROM user_continuous_attendance uca, com_attendance_daily cad
  WHERE uca.attendance_id = cad.attendance_id
  AND userkey = ?
  AND cad.day_seq = ?
  AND uca.day_seq = cad.day_seq
  AND now() BETWEEN start_date AND end_date
  AND reward_date IS NULL;
  `,
    [userkey, request_day]
  );
  if (!result.state || result.row.length === 0) {
    logger.error(`receiveAttendanceMissionReward Error 2`);
    respondDB(res, 80025, "already received");
    return;
  } else {
    const { attendance_no, currency, quantity, attendance_day, day_seq } =
      result.row[0];

    //연속 출석일수가 충족하지 않은 경우
    if (attendance_day < day_seq) {
      logger.error(`receiveAttendanceMissionReward Error 3`);
      respondDB(res, 80120, "dismatch attendance day");
      return;
    }

    // 메일 발송
    currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
    VALUES(?, 'continuous_attendance', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;
    updateQuery += mysql.format(currentQuery, [userkey, currency, quantity]);

    // 히스토리 누적 처리
    currentQuery = `UPDATE user_continuous_attendance SET reward_date = now() WHERE attendance_no = ?;`;
    updateQuery += mysql.format(currentQuery, [attendance_no]);

    result = await transactionDB(updateQuery);
    if (!result.state) {
      logger.error(`sendAttendanceReward Error 4 ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  // 안 읽은 메일 건수
  const unreadMailResult = await DB(
    `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
    [userkey]
  );

  responseData.unreadMailCount = 0;
  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    responseData.unreadMailCount = unreadMailResult.row[0].cnt;

  //출석 미션 가져오기
  result = await getContinuousAttendanceList(userkey);
  responseData = {
    ...responseData,
    user_info: result.user_info,
    continuous_attendance: result.continuous_attendance,
    attendance: result.attendance,
  };

  res.status(200).json(responseData);
  logAction(userkey, "continuous_attendance", req.body);
};

//! 연속 출석 보충 처리
export const resetAttendanceMission = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  let result = ``;
  let currentQuery = ``;
  let updateQuery = ``;

  let responseData = {};

  result = await DB(
    `
  SELECT  
  attendance_id
  , is_attendance
  , DATEDIFF(now(), start_date)+1-fn_get_continuous_attendance(?, start_date, end_date, 0, 'day') reset_day
  , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
  , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
  , CASE WHEN is_attendance = 1 THEN 
    DATEDIFF(now(), start_date)
  ELSE 
    DATEDIFF(now(), start_date)+1
  END reset_result
  , ifnull((SELECT DATE_FORMAT(action_date, '%Y-%m-%d %T') FROM user_attendance ua WHERE ua.userkey = ? AND date(action_date) = date(now())), '') action_date
  FROM user_continuous_attendance 
  WHERE attendance_no = fn_get_max_attendance_id(?, 'user');
  `,
    [userkey, userkey, userkey]
  );

  //유효성 검사 체크
  if (!result.state || result.row.length === 0) {
    logger.error(`resetAttendanceMission Error 1`);
    respondDB(res, 80019, "unvalid value");
    return;
  }

  const {
    attendance_id,
    is_attendance,
    reset_day,
    start_date,
    end_date,
    reset_result,
    action_date,
  } = result.row[0];

  //구매 가능한지 확인
  const restCoin = reset_day * 100;
  const userCoin = await getCurrencyQuantity(userkey, "coin");
  if (userCoin < restCoin) {
    logger.error(`resetAttendanceMission Error 2`);
    respondDB(res, 80013, "not enough coin");
    return;
  }

  //구매 처리
  currentQuery = `CALL sp_use_user_property(?, 'coin', ?, 'reset_attendance', ?);`;
  updateQuery += mysql.format(currentQuery, [userkey, restCoin, -1]);

  //현재일자 기준으로 보상일자 셋팅
  let setDaySeq = 0;
  if (reset_result <= 3) {
    setDaySeq = 3;
  } else if (reset_result >= 4 && reset_result <= 7) {
    setDaySeq = 7;
  } else if (reset_result >= 8 && reset_result <= 10) {
    setDaySeq = 10;
  } else if (reset_result >= 11) {
    setDaySeq = 14;
  }

  //보상 리스트 확인
  result = await DB(
    `
  SELECT 
  ifnull(attendance_no, 0) attendance_no
  , cad.day_seq
  FROM com_attendance_daily cad 
  LEFT OUTER JOIN user_continuous_attendance uca
  ON uca.attendance_id = cad.attendance_id 
  AND userkey = ?
  AND now() BETWEEN start_date AND end_date
  AND cad.day_seq = uca.day_seq
  WHERE cad.attendance_id = ?
  AND cad.day_seq <= ?
  AND reward_date IS NULL;
  `,
    [userkey, attendance_id, setDaySeq]
  );
  if (result.state && result.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      const { attendance_no, day_seq } = item;
      let setAttendanceResult = 0;
      let setAttendanceDate = ``; //출석일

      if (is_attendance === 0) {
        setAttendanceResult = reset_result;
        setAttendanceDate = "now()"; //출석 실패
      } else if (action_date) {
        setAttendanceResult = reset_result + 1;
        setAttendanceDate = `'${action_date}'`; //일일 출석한 경우
      } else {
        setAttendanceResult = reset_result;
        setAttendanceDate = "DATE_ADD(now(), INTERVAL -1 DAY)";
      }

      //히스토리 누적 생성/업데이트
      if (attendance_no === 0) {
        currentQuery = `
        INSERT INTO user_continuous_attendance(attendance_id, userkey, day_seq, current_result, attendance_date, start_date, end_date) 
        VALUES(?,?,?,?,${setAttendanceDate},?,?);
        `;

        updateQuery += mysql.format(currentQuery, [
          attendance_id,
          userkey,
          day_seq,
          setAttendanceResult,
          start_date,
          end_date,
        ]);
      } else {
        // eslint-disable-next-line no-lonely-if
        if (is_attendance === 0) {
          //연속 출석 실패(당일날짜 합산해서 업데이트 처리)
          currentQuery = `
          UPDATE user_continuous_attendance 
          SET attendance_date = ${setAttendanceDate}
          , is_attendance = 1
          , current_result = ?
          WHERE attendance_no = ?;
          `;

          updateQuery += mysql.format(currentQuery, [
            setAttendanceResult,
            attendance_no,
          ]);
        } else if (action_date) {
          //시즌 중에 출첵 && 당일날 일일 출석 O(이미 당일 출석했기 때문에 current_result+1)
          currentQuery = `
          UPDATE user_continuous_attendance
          SET current_result = ?
          WHERE attendance_no = ?;
          `;

          updateQuery += mysql.format(currentQuery, [
            setAttendanceResult,
            attendance_no,
          ]);
        } else {
          // 시즌 중에 출첵 && 당일날 일일 출석 X(당일 직전 날짜, current_result 업데이트)
          currentQuery = `
          UPDATE user_continuous_attendance
          SET attendance_date = ${setAttendanceDate}
          , current_result = ?
          WHERE attendance_no = ?;
          `;

          updateQuery += mysql.format(currentQuery, [
            setAttendanceResult,
            attendance_no,
          ]);
        }
      }
    }

    //일일 출석 처리(연속 출석 실패 && 당일 일일 출석 안한 유저에 한해)
    if (is_attendance === 0 && !action_date) {
      // eslint-disable-next-line no-await-in-loop
      result = await DB(
        `
      SELECT 
      day_seq daily_day_seq
      , currency
      , quantity
      , fn_get_attendance_max(?, ca.attendance_id) attendance_max
      , ca.attendance_id daily_attendance_id
      FROM com_attendance ca, com_attendance_daily cad 
      WHERE ca.attendance_id = cad.attendance_id 
      AND ca.is_public > 0 
      AND now() BETWEEN from_date AND to_date 
      AND kind <> -1
      AND cad.day_seq = fn_get_next_day_seq(ca.attendance_id, (
        SELECT day_seq FROM user_attendance ua 
        WHERE userkey = ?
        AND action_date = (SELECT max(action_date) FROM user_attendance ua2 WHERE userkey = ?)
      ))
      AND (is_loop > 0 OR ( fn_get_attendance_cnt(?, ca.attendance_id, fn_get_attendance_max(?, ca.attendance_id)) < kind AND is_loop = 0 ) )
      ;
      `,
        [userkey, userkey, userkey, userkey, userkey]
      );
      if (!result.state || result.row.length === 0) {
        logger.error(`resetAttendanceMission Error 3`);
        respondDB(res, 80019);
        return;
      }

      const {
        daily_day_seq,
        currency,
        quantity,
        attendance_max,
        daily_attendance_id,
      } = result.row[0];

      currentQuery = `
      INSERT INTO user_attendance(userkey, attendance_id, loop_cnt, day_seq, currency, quantity) 
      VALUES(?, ?, ?, ?, ?, ?);
      `;
      updateQuery += mysql.format(currentQuery, [
        userkey,
        daily_attendance_id,
        attendance_max,
        daily_day_seq,
        currency,
        quantity,
      ]);

      // 메일 발송
      currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project)  
        VALUES(?, 'attendance', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;
      updateQuery += mysql.format(currentQuery, [userkey, currency, quantity]);
    }
    console.log(updateQuery);
    result = await transactionDB(updateQuery);
    if (!result.state) {
      logger.error(`resetAttendanceMission Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  //뱅크 정보
  responseData.bank = await getUserBankInfo(req.body);

  //* 안 읽은 메일 건수
  const unreadMailResult = await DB(
    `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
    [userkey]
  );

  responseData.unreadMailCount = 0;
  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    responseData.unreadMailCount = unreadMailResult.row[0].cnt;

  //출석 미션 리스트
  result = await getContinuousAttendanceList(userkey);
  responseData = {
    ...responseData,
    user_info: result.user_info,
    continuous_attendance: result.continuous_attendance,
    attendance: result.attendance,
  };

  res.status(200).json(responseData);
  logAction(userkey, "reset_attendance", req.body);
};
