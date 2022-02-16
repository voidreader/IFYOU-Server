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
export const userkeyCheck = async (send_to, reservation_no) => {
  let whereQuery = ``;
  if (parseInt(send_to, 10) !== -1) {
    whereQuery = ` AND userkey IN (${send_to}) `;
  }

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

  const isMail = process.env.MAIL_SCHEDULE;

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
    } = mailCheck.row[0];

    // 가능 userkey 조회
    const userkey = await userkeyCheck(send_to, reservation_no);

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


//! 통계 데이터(새벽 5시마다 호출)
export const scheduleStatInsert = schedule.scheduleJob("0 0 5 * * *", async () => { 
  
  const isMail = process.env.MAIL_SCHEDULE;

  const now = new Date(); 
  const yesterday = new Date(now.setDate(now.getDate() - 1));
  const year = yesterday.getFullYear(); 
  const month = String(yesterday.getMonth()+1).padStart(2, "0"); 
  const day = String(yesterday.getDate()).padStart(2, "0"); 
  const setDay = `${year}-${month}-${day}`; 

  logger.info(`scheduleStatInsert [${isMail}]`);
 
  if(isMail !== 1) return;
 
  await getStatIfyouList(setDay);
  await getStatTutorialList(setDay);
  await getStatProjectList(setDay);
  await getStatEpisodePlayList(setDay);
  await getStatEpisodeActionList(setDay);
  await getStatPropertyList(setDay);
  await getStatInappList(setDay);
  await getStatCoinList(setDay);
  
  logger.info(`scheduleStatInsert End`);
});