import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { getUserBankInfo, getCurrencyQuantity } from "./bankController";

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

//! 출석리스트
export const attendanceList = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  const result = await getAttendanceList(userkey);
 
  res.status(200).json(result);
};

//! 출석 보상
export const sendAttendanceReward = async (req, res) => {
  const {
    body: { userkey, attendance_id = 0, day_seq = 0 },
  } = req;

  const responseData = {};

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


  //연속 출석 id 가져오기
  let continuous_attendance_id = 0;
  result = await DB(`
  SELECT
  attendance_id continuous_attendance_id
  FROM com_attendance cas 
  WHERE attendance_id = (SELECT max(attendance_id) FROM com_attendance WHERE attendance_id > 0 AND kind = -1);`);
  if(result.state && result.row.length > 0) continuous_attendance_id = result.row[0].continuous_attendance_id;

  //연속 출석 처리
  if(continuous_attendance_id > 0){
    result = await DB(`
    SELECT
    attendance_no
    , CASE WHEN date(DATE_ADD(attendance_date, INTERVAL 1 DAY)) = date(now()) THEN 0 
           WHEN date(DATE_ADD(attendance_date, INTERVAL 1 DAY)) < date(now()) THEN -1   
    ELSE 1 END attendance_done
    , CASE WHEN isnull(reward_date) THEN 0 ELSE 1 END reward_check
    , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
    , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
    , day_seq current_result
    FROM user_continuous_attendance 
    WHERE attendance_no = (
      SELECT max(attendance_no) 
      FROM user_continuous_attendance 
      WHERE userkey = ? 
      AND now() BETWEEN start_date AND end_date
    ) AND is_attendance = 1;`, [userkey]);
    if(result.state){
      if(result.row.length === 0){ 
        //없는 경우, 연속 출석 시작(시즌 시작)
        currentQuery = `
        INSERT INTO user_continuous_attendance(
          attendace_id
          , userkey
          , end_date
        ) 
        VALUES(
          ?
          , ?
          , DATE_ADD(now(), INTERVAL 14 DAY)
        );`;
        updateQuery += mysql.format(currentQuery, [continuous_attendance_id, userkey]);
      }else{
        const { attendance_no, attendance_done, reward_check, start_date, end_date, current_result, } = result.row[0]; 
        if(attendance_done === 0){ //금일 출석 안하는 경우
          if(reward_check === 1){ //보상을 받은 경우 새 데이터 추가
            currentQuery = `
            INSERT INTO user_continuous_attendance(
              attendace_id
              , userkey
              , day_seq
              , start_date
              , end_date
            ) 
            VALUES(
              ?
              , ?
              , now()
              , ?
              , ?
            );`;
            updateQuery += mysql.format(currentQuery, [continuous_attendance_id, userkey, (current_result+1), start_date, end_date]);
          }else{ //보상 받지 않은 경우, 업데이트
            currentQuery = `
            UPDATE user_continuous_attendance 
            SET day_seq = day_seq + 1
            , attendance_date = now()
            WHERE attendance_no = ?;`;
            updateQuery += mysql.format(currentQuery, [attendance_no]);
          } 
        }else if(attendance_done === -1){ //연속 출석을 실패하는 경우
          currentQuery = `
          UPDATE user_continuous_attendance
          SET is_attendance = 0 
          WHERE attendance_no = ?;`;
          updateQuery += mysql.format(currentQuery, [attendance_no]);
        }
      }
    }
  }

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

  res.status(200).json(responseData);
  logAction(userkey, "attendance", req.body);
};

//? 이프유 플레이 시작

//! 연속 출석 리스트
const getContinuousAttendanceList = async (userkey) =>{

  const responseData = {};

  let result = await DB(`
  SELECT 
  cad.day_seq 
  , fn_get_design_info(cc.icon_image_id, 'url') currency_url
  , fn_get_design_info(cc.icon_image_id, 'key') currency_key
  , cad.quantity
  , CASE WHEN uca.reward_date IS NOT NULL THEN 1 ELSE 0 END reward_check
  , ifnull(uca.day_seq, 0) attendance_day
  , ifnull(is_attendance, 1) is_attendance
  , CASE WHEN isnull(uca.end_date) THEN 14 ELSE DATEDIFF(end_date, now()) END remain_day
  , CASE WHEN uca.start_date IS NOT NULL THEN DATEDIFF(now(), uca.start_date)+1-uca.day_seq ELSE 0 END reset_day
  FROM com_attendance_daily cad INNER JOIN com_currency cc ON cad.currency = cc.currency
  LEFT OUTER JOIN user_continuous_attendance uca 
  ON cad.attendance_id = uca.attendance_id 
  AND userkey = ?
  AND now() BETWEEN start_date AND end_date
  WHERE cad.attendance_id = (
    SELECT max(attendance_id) 
    FROM com_attendance ca 
    WHERE ca.attendance_id = cad.attendance_id 
    AND kind = -1
  );
  `, [userkey]);
  if(result.state && result.row.length > 0){
    
    let userObj = {};    
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      //유저 정보 업데이트
      userObj = {
        ...userObj,
        attendance_day: item.attendance_day,
        is_attendance: item.is_attendance, 
        remain_day: item.remain_day, 
        reset_day: item.reset_day,
      }; 

      //필요없는 칼럼 삭제
      delete item.attendance_day;
      delete item.is_attendance; 
      delete item.remain_day; 
      delete item.reset_day;
    }

    responseData.user_info = userObj; //유저 정보
    responseData.continuous_attendance = result.row; //연속 출석
  
  }

  //기존 출석
  result = await getAttendanceList(userkey);
  responseData.attendance = result; 

  return responseData;
};

//! 출석 미션 리스트 
export const requestAttendanceMission = async(req, res) =>{
   
  const {
    body: {
      userkey, 
    }
  } = req;

  //유저정보, 연속 출석, 기존 출석 리스트
  const result = await getContinuousAttendanceList(userkey); 

  res.status(200).json(result);
};

//! 연속 출석 보상 받기
export const receiveAttendanceMissionReward = async(req, res) =>{
  
  const {
    body:{
      userkey,
      request_day = 0,
    }
  } = req;

  let result = ``;
  let currentQuery = ``;
  let updateQuery = ``; 

  let responseData = {}; 
 
  //유효성 검사 체크 
  if(request_day < 1){
    logger.error(`receiveAttendanceMissionReward Error 1-1`);
    respondDB(res, 80019, 'unvalid value');
    return;
  }

  //이전 보상 건너뛰는지 확인
  result = await DB(`
  SELECT * 
  FROM user_continuous_attendance 
  WHERE userkey = ? 
  AND day_seq < ? 
  AND reward_date IS NULL;`, [userkey, request_day]);
  if(result.state && result.row.length > 0){
    logger.error(`receiveAttendanceMissionReward Error 1-2`);
    respondDB(res, 80110, 'not receive a reward yet');
    return;
  }

  //보상 리스트 확인
  result = await DB(`
  SELECT
  attendance_no 
  , currency
  , quantity
  , uca.day_seq attendance_day
  , cad.day_seq
  , CASE WHEN isnull(reward_date) THEN 0 ELSE 1 END reward_check
  FROM user_continuous_attendance uca, com_attendance_daily cad
  WHERE uca.attendance_id = cad.attendance_id
  AND cad.day_seq = ?
  AND attendance_no = (SELECT max(attendance_no) FROM user_continuous_attendance WHERE userkey = ?);
  `, [request_day, userkey]);
  if(!result.state || result.row.length === 0){

    logger.error(`receiveAttendanceMissionReward Error 2`);
    respondDB(res, 80039, 'no data');
    return;

  }else{

    const {
      attendance_no,
      currency, 
      quantity, 
      attendance_day,
      day_seq,
      reward_check,
    } = result.row[0];

    //연속 출석일수가 충족하지 않은 경우
    if(attendance_day < day_seq){
      logger.error(`receiveAttendanceMissionReward Error 3`);
      respondDB(res, 80120, 'dismatch attendance day');
      return;
    }

    //이미 지급 받은 경우
    if(reward_check > 0){
      logger.error(`receiveAttendanceMissionReward Error 4`);
      respondDB(res, 80025, 'already received');
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
      logger.error(`sendAttendanceReward Error 5 ${result.error}`);
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
    result, 
  };

  res.status(200).json(responseData);
  logAction(userkey, "continuous_attendance", req.body);
};

//! 연속 출석 보충 처리 
export const resetAttendanceMission = async (req, res) => {
  const {
    body:{
      userkey,
    }
  } = req;

  let result = ``;
  let currentQuery = ``;
  let updateQuery = ``;

  let responseData = {}; 

  result = await DB(`
  SELECT  
  attendance_id
  , day_seq attendance_day
  , is_attendance
  , CASE WHEN start_date IS NOT NULL THEN DATEDIFF(now(), start_date)+1-day_seq ELSE 0 END reset_day
  , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
  , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
  FROM user_continuous_attendance 
  WHERE attendance_no = (SELECT max(attendance_no) FROM user_continuous_attendance WHERE userkey = ?);
  `, [userkey]);

  //유효성 검사 체크
  if(!result.state || result.row.length === 0 || (result.row.length > 0 && result.row[0].is_attendance === 1)){
    logger.error(`resetAttendanceMission Error 1`);
    respondDB(res, 80019, 'unvalid value');
    return;    
  }

  const { attendance_id, reset_day, start_date, end_date, } = result.row[0]; 

  //구매 가능한지 확인
  const restCoin = reset_day*100;
  const userCoin = await getCurrencyQuantity(userkey, "coin");
  if (userCoin < restCoin) {
    logger.error(`resetAttendanceMission Error 2`);
    respondDB(res, 80013, 'not enough coin');
    return;
  }

  //구매 처리 
  currentQuery = `CALL sp_use_user_property(?, 'coin', ?, 'reset_attendance', ?);`;
  updateQuery+= mysql.format(currentQuery, [userkey, restCoin, -1]);

  //보상 리스트 확인
  result = await DB(`
  SELECT 
  ifnull(attendance_no, 0) attendance_no
  , currency
  , quantity
  , cad.day_seq
  , ifnull(uca.day_seq, 0) current_result
  FROM com_attendance_daily cad 
  LEFT OUTER JOIN user_continuous_attendance uca
  ON uca.attendance_id = cad.attendance_id 
  AND userkey = ?
  AND now() BETWEEN start_date AND end_date
  WHERE cad.attendance_id = ? 
  AND cad.day_seq <= DATEDIFF(now(), ?)+1
  AND reward_date IS NULL;
  `, [userkey, attendance_id, start_date]);
  if(result.state && result.row.length > 0){

    let index = 0;

    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      const { attendance_no, currency, quantity, day_seq, } = item;
      let { current_result } = item;

      //메일 발송
      currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
      VALUES(?, 'reset_attendance', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;
      updateQuery += mysql.format(currentQuery, [userkey, currency, quantity]);

      if(index === result.row.length-1) current_result += reset_day;
      else current_result = day_seq;
      
      //히스토리 누적 생성/업데이트 
      if(attendance_no === 0){
        currentQuery = `
        INSERT INTO user_continuous_attendance(
          attendance_id,
          userkey,
          day_seq,
          reward_date,
          start_date,
          end_date
        ) VALUES(
          ?,
          ?,
          ?,
          now(),
          ?,
          ?
        );
        `;
        updateQuery += mysql.format(currentQuery, [attendance_id, userkey, current_result, start_date, end_date]);
      }else{
        currentQuery = `
        UPDATE user_continuous_attendance 
        SET attendace_date = now()
        , reward_date = now()
        , is_attendance = 1
        , day_seq = ?
        WHERE attendance_no = ?;
        `;
        updateQuery += mysql.format(currentQuery, [current_result, attendance_no]);
      }
      index += 1;
    }

    result = await transactionDB(updateQuery);
    if(!result.state){
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
    result, 
  };

  res.status(200).json(responseData);
  logAction(userkey, "reset_attendance", req.body);

};
