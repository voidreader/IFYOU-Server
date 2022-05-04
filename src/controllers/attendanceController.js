import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

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

const getAttendanceMission = async (userkey) =>{
  const responseData= {};
  let result=``;

  //유저 정보 
  result = await DB(`
  SELECT 
  datediff(end_date, now()) remain_day 
  , fn_get_continuous_attendance(?, start_date, end_date, 0, 'day') attendance_day 
  , fn_get_continuous_attendance(?, start_date, end_date, 0, 'check') is_attendance
  , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
  , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
  FROM com_attendance_season cas WHERE season_no = 0;
  `, [userkey, userkey]);
  if(result.state) responseData.user_info = result.row;
  
  const {
    start_date, 
    end_date,
  } = result.row[0];
 
  //연속 출석 리스트
  result = await DB(`
  SELECT 
  day_seq 
  , fn_get_design_info(cc.icon_image_id, 'url') currency_url
  , fn_get_design_info(cc.icon_image_id, 'key') currency_key
  , cad.quantity
  , fn_get_continuous_attendance(?, ?, ?, @rownum:=@rownum+1, 'reward') reward_date
  FROM com_attendance_daily cad, com_currency cc 
  WHERE cad.currency = cc.currency 
  AND cad.attendance_id  = (SELECT max(attendance_id) FROM com_attendance ca WHERE attendance_id > 0 AND kind = -1)
  AND (@rownum:=0)=0;
  `, [userkey, start_date, end_date]);
  if(result.state) responseData.continuous_attendance = result.row; 

  //데일리 출석 리스트
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

  const result = await getAttendanceMission(userkey);
  res.status(200).json(result);
};

//! 연속 출석 보상 받기
export const receiveAttendanceMissionReward = async(req, res) =>{
  
  const {
    body:{
      userkey,
    }
  } = req;

  let result = ``;
  let currentQuery = ``;
  let updateQuery = ``; 

  let attendance_day = 0; 
  let is_attendance = 0;
  let attendance_id = 0; 
  let attendance_no = 0; 

  const responseData = {}; 

  result = await DB(`
  SELECT 
  fn_get_continuous_attendance(?, start_date, end_date, 0, 'day') attendance_day 
  , fn_get_continuous_attendance(?, start_date, end_date, 0, 'check') is_attendance
  , (SELECT ifnull(max(attendance_id), 0) FROM user_continuous_attendance ca WHERE userkey = ?) attendance_id
  , (SELECT ifnull(max(attendance_no), 0) FROM user_continuous_attendance WHERE userkey = ?) attendance_no
  FROM com_attendance_season cas WHERE season_no = 0;
  `, [userkey, userkey, userkey, userkey]);
  if(result.state && result.row.length > 0){
    attendance_day = result.row[0].attendance_day;
    is_attendance = result.row[0].is_attendance;
    attendance_id = result.row[0].attendance_id; 
    attendance_no = result.row[0].attendance_no;
  }

  //유효성 검사 체크 
  if(is_attendance === 0 || attendance_id === 0){ // 연속 출석 실패인 경우 
    logger.error(`receiveAttendanceMissionReward Error`);
    respondDB(res, 80019);
    return;
  }

  result = await DB(`
  SELECT 
  currency
  , quantity
  , @rownum:=@rownum+1 row_num
  FROM com_attendance_daily
  WHERE attendance_id = ?
  AND day_seq = ?
  AND (@rownum:=0)=0;
  , 
  `, [attendance_id, attendance_day]);
  if(!result.state || result.row.length > 0){

    logger.error(`receiveAttendanceMissionReward Error`);
    respondDB(res, 80019);
    return;

  }else{

    const {
      currency, 
      quantity, 
      row_num,
    } = result.row[0];

    let clear_date = ``; 

    if(row_num === 1){
      clear_date = `first_reward_date`;
    }else if(row_num === 2){
      clear_date = `second_reward_date`;
    }else if (row_num === 3){
      clear_date = `third_reward_date`;
    }else if (row_num === 4){
      clear_date = `forth_reward_date`;
    }

    // 메일 발송
    currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
    VALUES(?, 'continuous_attendance', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;
    updateQuery += mysql.format(currentQuery, [userkey, currency, quantity]);

    // 히스토리 누적 처리
    currentQuery = `UPDATE user_continuous_attendance SET ${clear_date} = now() WHERE userkey = ? AND attendance_no = ?;`; 
    updateQuery += mysql.format(currentQuery, [userkey, attendance_no]);

    result = await transactionDB(updateQuery);
    if (!result.state) {
      logger.error(`sendAttendanceReward Error 4 ${result.error}`);
      respondDB(res, 80026, result.error);
      return;  
    }

    //* 안 읽은 메일 건수
    const unreadMailResult = await DB(
    `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
    [userkey]
    );

    responseData.unreadMailCount = 0;
    if (unreadMailResult.state && unreadMailResult.row.length > 0)
      responseData.unreadMailCount = unreadMailResult.row[0].cnt;

  }

  //result = await getAttendanceMission(userkey);


  res.status(200).json(responseData);
  logAction(userkey, "continuous_attendance", req.body);
};

//! 연속 출석 보충 처리 
export const resetAttendanceMission = async (req, res) =>{
  const {
    body:{
      userkey, 
    }
  } = req;

};
