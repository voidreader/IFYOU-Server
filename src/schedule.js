import mysql from "mysql2/promise";
import schedule from "node-schedule";
import dotenv from "dotenv";
import { DB, transactionDB } from "./mysqldb";
import { logger } from "./logger";
import {
  getStatIfyouList,
  getStatTutorialList,
  getStatProjectList,
  getStatEpisodePlayList,
  getStatEpisodeActionList,
  getStatPropertyList,
  getStatInappList,
  getStatCoinList,
} from "./controllers/statController";

dotenv.config();

//! 가능 유저 조회
export const userkeyCheck = async (send_to, os, reservation_no) => {
  let whereQuery = ``;
  if (parseInt(send_to, 10) !== -1) {
    whereQuery = ` AND userkey IN (${send_to}) `;
  }

  // os 운영기기에 따라 메일 전송
  if (os === "Android" || os === "iOS") whereQuery += ` AND os = '${os}' `;

  const result = await DB(
    `SELECT userkey FROM table_account
    WHERE userkey NOT IN (SELECT userkey FROM user_mail WHERE reservation_no = ?)
    ${whereQuery}
    ORDER BY userkey;`,
    [reservation_no]
  );

  const userkeyArrays = [];

  result.row.forEach((i) => {
    if (!userkeyArrays.includes(i.userkey)) {
      userkeyArrays.push(i.userkey);
    }
  });

  return userkeyArrays;
};

//! 메일 보내기
export const reservationSend = async () => {
  // logger.info("reservationSend Start");

  const isMail = process.env.SCHEDULE_JOB_ON;

  logger.info(`reservationSend isMAIL : [${isMail}]`);

  if (isMail > 0) {
    logger.info(`reservationSend START`);

    // list_reservation 메일 조회
    const mailCheck = await DB(
      `SELECT reservation_no 
      , send_to
      , mail_type 
      , currency
      , quantity
      , DATE_FORMAT(expire_date, '%Y-%m-%d %T') expire_date
      , os
      FROM list_reservation 
      WHERE is_complete = 0 AND send_date <= sysdate()
      limit 1;`,
      []
    );

    if (!mailCheck.state) {
      logger.error(`reservationSend Error 1 ${mailCheck.error}`);
      return;
    }

    if (mailCheck.row.length === 0) {
      // logger.info("reservationSend End - not mail");
      return;
    }

    logger.info(`reserved mail exists`);

    const {
      reservation_no,
      send_to,
      mail_type,
      currency,
      quantity,
      expire_date,
      os,
    } = mailCheck.row[0];

    // 가능 userkey 조회
    const userkey = await userkeyCheck(send_to, os, reservation_no);

    let state = 2;

    if (!userkey) {
      logger.info("not userkey");
      state = 1;
    } else {
      // 전송
      let insertQuery = ``;
      let index = 0;

      userkey.forEach((send) => {
        const queryParams = [];
        const currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project, reservation_no)
              VALUES(?, ?, ?, ?, ?, -1, ?);`;

        queryParams.push(send);
        queryParams.push(mail_type);
        queryParams.push(currency);
        queryParams.push(quantity);
        queryParams.push(expire_date);
        queryParams.push(reservation_no);

        insertQuery += mysql.format(currentQuery, queryParams);

        if (index === 0) console.log(insertQuery);
        index += 1;
      });

      const result = await transactionDB(`${insertQuery}`, []);

      if (!result.state) {
        logger.error(`reservationSend Error 2 ${result.error}`);
        state = 1;
      }
    }

    // 상태 업데이트
    const stateResult = await DB(
      `UPDATE list_reservation SET is_complete = ? WHERE reservation_no = ?;`,
      [state, reservation_no]
    );

    if (!stateResult.state) {
      logger.error(`reservationSend Error 3 ${stateResult.error}`);
    }

    logger.info("reservationSend End");
  } // ? end
};

//! 등급 정산
export const calculateGradeMonth = async () => {
  const isMail = process.env.MAIL_SCHEDULE;

  logger.info(`calculateGradeMonth isMAIL : [${isMail}]`);

  if (isMail > 0) {
    logger.info(`calculateGradeMonth START`);

    let result;
    let currentQuery = ``;
    let updateQuery = ``;

    //기간 계산(시작일/끝일, 다음 시즌 시작일/끝일, 다다음 시즌 시작일/끝일)
    result = await DB(`
    SELECT DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date  
    , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date           
    , DATE_FORMAT(next_start_date, '%Y-%m-%d %T') next_start_date  
    , DATE_FORMAT(next_end_date, '%Y-%m-%d %T') next_end_date
	  , DATE_ADD(next_end_date, INTERVAL 1 HOUR) season_start_date 
	  , DATE_ADD(next_end_date, INTERVAL 30 DAY) season_end_date 
    FROM com_grade_season;`);
    const {
      start_date,
      end_date,
      next_start_date,
      next_end_date,
      season_start_date,
      season_end_date,
    } = result.row[0];

    //시즌, 다음 시즌 업데이트
    //시즌 이후에 가입자는 제외
    result = await DB(`
    SELECT
    userkey 
    , a.grade 
    , next_grade 
    , grade_experience
    , keep_point
    , upgrade_point 
    , fn_check_grade_exists(userkey, '${start_date}', '${end_date}') user_grade_exists
    FROM table_account a, com_grade b
    WHERE a.grade = b.grade
    AND createtime < '${end_date}'
    ORDER BY userkey;`);
    if (result.state && result.row.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of result.row) {
        const { userkey, grade, keep_point, upgrade_point, user_grade_exists } =
          item;
        let { next_grade, grade_experience } = item;
        let grade_state = 0; //등급 상태
        const origin_grade_experience = grade_experience;

        if (next_grade > grade) {
          //시즌 중에 승급이 됐다면
          grade_state = 2;
        } else if (grade_experience < keep_point) {
          //강등
          next_grade -= 1;
          grade_state = -1;
          grade_experience = 0;
        } else if (upgrade_point <= grade_experience) {
          //승급
          next_grade += 1;
          grade_state = 2;
          grade_experience -= upgrade_point;
        } else {
          //유지
          grade_state = 1;
          grade_experience = 0;
        }

        if (next_grade < 0) next_grade = 1; //브론즈로 고정
        if (next_grade > 5) next_grade = 5; //이프유로 고정
        if (grade_experience < 0) grade_experience = 0; //경험치가 마이너스가 되는 경우 0으로 초기화

        //처리되지 않은 것만 업데이트
        if (user_grade_exists < 1) {
          //계정 업데이트
          currentQuery = `
            UPDATE table_account 
            SET grade = ? 
            , next_grade = ? 
            , grade_state = ? 
            , grade_experience = ?  
            WHERE userkey = ?;`;
          updateQuery += mysql.format(currentQuery, [
            next_grade,
            next_grade,
            grade_state,
            grade_experience,
            userkey,
          ]);

          //히스토리 누적
          currentQuery = `
            INSERT INTO user_grade_hist(
            userkey
            , grade
            , next_grade
            , grade_experience
            , next_grade_experience
            , grade_state
            , start_date
            , end_date
            ) VALUES(
            ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            );`;
          updateQuery += mysql.format(currentQuery, [
            userkey,
            grade,
            next_grade,
            origin_grade_experience,
            grade_experience,
            grade_state,
            start_date,
            end_date,
          ]);
        }
      }
    }

    currentQuery = `
    UPDATE com_grade_season 
    SET start_date = ?
    , end_date = ?
    , next_start_date = ?
    , next_end_date = ?;`;
    updateQuery += mysql.format(currentQuery, [
      next_start_date,
      next_end_date,
      season_start_date,
      season_end_date,
    ]);

    //유저 등급 업데이트
    if (updateQuery) {
      result = await transactionDB(updateQuery);
      if (!result.state) {
        logger.error(`calculateGradeMonth Error ${result.error}`); //실패
      } else {
        logger.info("calculateGradeMonth End"); //성공
      }
    }
  } //? if end
};

// 일일 무료충전소 이용횟수 초기화
const resetAdChargeDaily = () => {
  // 스케쥴링을 사용하는 instance에서만 적용한다.
  const isMail = process.env.MAIL_SCHEDULE;

  if (isMail != 1) return;

  //console.log(">>>>> resetAdChargeDaily <<<<<");
  logger.info(">>>>> resetAdChargeDaily <<<<<");
  // DB 업데이트 처리. ad_charge컬럼을 전체다 0으로 초기화
  DB(`UPDATE table_account SET ad_charge = 0 WHERE userkey > 0`);
};

//! 스케줄링(1분마다 호출)
export const scheduleMail = schedule.scheduleJob("*/60 * * * * *", async () => {
  reservationSend();
});

const resetChargeRule = new schedule.RecurrenceRule();
resetChargeRule.hour = 0;
resetChargeRule.minute = 0;

export const scheduleAdCharge = schedule.scheduleJob(resetChargeRule, () => {
  resetAdChargeDaily();
});

//! 통계 데이터(새벽 0시마다 호출)
export const scheduleStatInsert = schedule.scheduleJob(
  "0 0 0 * * *",
  async () => {
    const isMail = process.env.MAIL_SCHEDULE;

    // const now = new Date();
    // const yesterday = new Date(now.setDate(now.getDate() - 1));
    // const year = yesterday.getFullYear();
    // const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    // const day = String(yesterday.getDate()).padStart(2, "0");
    // const setDay = `${year}-${month}-${day}`; //어제 날짜 셋팅

    // logger.info(`scheduleStatInsert [${setDay} : ${isMail}]`);

    if (isMail < 1) return;

    // await getStatIfyouList(setDay);
    // await getStatTutorialList(setDay);
    // await getStatProjectList(setDay);
    // await getStatEpisodePlayList(setDay);
    // await getStatEpisodeActionList(setDay);
    // await getStatPropertyList(setDay);
    // await getStatInappList(setDay);
    // await getStatCoinList(setDay);
    await updateProjectViewCnt();

    logger.info(`scheduleStatInsert End`);
  }
);

//! 등급 정산
//! 6~7시(UTC 기준) 한시간 동안 등급 정산
const gradeRule = new schedule.RecurrenceRule();
gradeRule.tz = "ETC/UTC";
gradeRule.hour = 7;
gradeRule.minute = 0;

export const scheduleGrade = schedule.scheduleJob(gradeRule, async () => {
  let gradeCheck = 0;
  const result = await DB(`
  SELECT
  CASE WHEN date(now()) = date(end_date) THEN 1 ELSE 0 END gradeCheck -- 시즌 끝일
  FROM com_grade_season;
  `);
  if (result.state && result.row.length > 0)
    gradeCheck = result.row[0].gradeCheck;

  if (gradeCheck === 1) calculateGradeMonth(); //시즌 끝일이면, 정산 시작
});

//! 연속 출석 미션 시즌 업데이트
export const scheduleContinuousAttendance = schedule.scheduleJob(
  "0 0 0 * * *",
  async () => {
    const isMail = process.env.MAIL_SCHEDULE;

    logger.info(`scheduleContinuousAttendance Start [${isMail}]`);

    if (isMail < 1) return;

    //시즌 갱신
    const result = await DB(`
    SELECT 
    DATE_FORMAT(next_start_date, '%Y-%m-%d %T') next_start_date
    , DATE_FORMAT(next_end_date, '%Y-%m-%d %T') next_end_date
    , date_add(date_format(next_end_date, '%Y-%m-%d'), INTERVAL 1 DAY) season_start_date
    , date_add(date_add(date_format(next_end_date, '%Y-%m-%d'), INTERVAL 1 DAY), INTERVAL 14 DAY) season_end_date
    , CASE WHEN date(next_start_date) = date(now()) THEN 1 ELSE 0 END season_check
    FROM com_attendance_season WHERE season_no = 0;
    `);
    const {
      next_start_date,
      next_end_date,
      season_start_date,
      season_end_date,
      season_check,
    } = result.row[0];

    if (season_check === 1) {
      await DB(
        `
      UPDATE com_attendance_season
      SET start_date = ?
      , end_date = ?
      , next_start_date = concat(?, ' 00:00:00')  
      , next_end_date = concat(?, ' 23:59:59')  
      WHERE season_no = 0;`,
        [next_start_date, next_end_date, season_start_date, season_end_date]
      );

      logger.info(`scheduleContinuousAttendance End`);
    }
  }
);
