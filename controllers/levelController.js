import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { getUserBankInfo } from "./bankController";

//! 레벨 처리
export const updateUserLevelProcess = async (req, res) => {
  const {
    body: {
      userkey,
      current_level,
      current_experience,
      experience = 0,
      route = "",
      clear_id = -1,
      project_id = -1,
      lang = "KO",
    },
  } = req;

  if (experience === 0) {
    logger.error(`updateUserLevelProcess error`);
    respondDB(res, 80019);
    return;
  }

  const responseData = {};
  let currentQuery = ``;
  let insertQuery = ``;
  let updateQuery = ``;
  let sendQuery = ``;

  //* 다음 레벨 목표 경험치, 재화, 개수 가져오기
  let result = await DB(
    `
    SELECT experience 
    , a.currency
    , quantity 
    , fn_get_design_info(icon_image_id, 'url') icon_image_url
    , fn_get_design_info(icon_image_id, 'key') icon_image_key
    , b.currency_type 
    , fn_get_localize_text(ls.text_id , '${lang}') type_name
    , fn_get_localize_text(b.local_code, '${lang}') currency_name
    FROM com_level_management a, com_currency b, list_standard ls 
    WHERE a.currency = b.currency 
     AND ls.standard_class = 'currency_type'
     AND ls.code = b.currency_type
     AND next_level = ?;
    `,
    [current_level + 1]
  );
  const next_experience = result.row[0].experience;
  const next_currency = result.row[0].currency;
  const next_quantity = result.row[0].quantity;
  const {
    icon_image_url,
    icon_image_key,
    currency_type,
    type_name,
    currency_name,
  } = result.row[0];

  //* 경험치 쌓기, 레벨업 처리
  let target_level = 0;
  let target_experience = 0;
  let target_currency = ``;
  if (next_experience <= current_experience + experience) {
    //레벨업 하는 경우
    target_level = current_level + 1;
    target_experience = current_experience + experience - next_experience;
    target_currency = next_currency;
  } else {
    target_level = current_level;
    target_experience = current_experience + experience;
  }

  //* 2022.01.13 JE - 레벨업 이벤트 추가 보상(단발성 : 2022.01.19 ~ 25일 23시 59분)
  //* 해당 되는 레벨(5, 8, 11, 14)들은 메일 발송 처리 
  let level_bonus_check = 0; 
  result = await DB(`
  SELECT CASE WHEN ${target_level} = 5 OR ${target_level} = 8 OR ${target_level} = 11 OR ${target_level} = 14 THEN 1 ELSE 0 END level_bonus_check
  FROM DUAL WHERE now() between '2022-01-19 00:00:00' AND '2022-01-25 23:59:59';`);
  if(result.row.length > 0){
    level_bonus_check = result.row[0].level_bonus_check; 
  }

  //* 레벨 히스토리 누적
  currentQuery = `
    INSERT INTO user_level_history(userkey, current_level, experience, route, clear_id, project_id, currency, is_event ) 
    VALUES(?, ?, ?, ?, ?, ?, ?, ?);`;
  insertQuery = mysql.format(currentQuery, [
    userkey,
    current_level,
    experience,
    route,
    clear_id,
    project_id,
    target_currency,
    level_bonus_check, 
  ]);

  //* 계정 테이블 업데이트
  currentQuery = `
    UPDATE table_account 
    SET current_level = ?
    , current_experience = ? 
    WHERE userkey = ?;`;
  updateQuery = mysql.format(currentQuery, [
    target_level,
    target_experience,
    userkey,
  ]);

  if (target_currency) {
    // * 직접 입력
    /*
    currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
      VALUES(?, 'levelup', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), ?);`;
    */

    currentQuery = `CALL sp_insert_user_property(?,?,?,?);`;

    sendQuery = mysql.format(currentQuery, [
      userkey,
      target_currency,
      next_quantity,
      "levelup",
    ]);
  }

  //* 이벤트 기간(단발성) - 보너스 재화 
  if(level_bonus_check > 0){
    currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
    VALUES(?, 'event', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;
    if(target_level === 5){

      sendQuery += mysql.format(currentQuery, [
        userkey,
        "gem",
        "3",
      ]);

    }else if(target_level === 8){

      sendQuery += mysql.format(currentQuery, [
        userkey,
        "gem",
        "3",
      ]);
      sendQuery += mysql.format(currentQuery, [
        userkey,
        "coin",
        "500",
      ]);

    }else if(target_level === 11){

      sendQuery += mysql.format(currentQuery, [
        userkey,
        "gem",
        "5",
      ]);
      sendQuery += mysql.format(currentQuery, [
        userkey,
        "coin",
        "1000",
      ]);      

    }else if(target_level === 14){

      sendQuery += mysql.format(currentQuery, [
        userkey,
        "gem",
        "5",
      ]);
      sendQuery += mysql.format(currentQuery, [
        userkey,
        "coin",
        "1500",
      ]);

    }
  }

  result = await transactionDB(`
    ${insertQuery}
    ${updateQuery}
    ${sendQuery}
    `);
  if (!result.state) {
    logger.error(`updateUserLevelProcess ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  //* 현재 레벨, 경험치
  result = await DB(
    `SELECT current_level, current_experience FROM table_account WHERE userkey = ?;`,
    [userkey]
  );
  responseData.current = {
    level: result.row[0].current_level,
    experience: result.row[0].current_experience,
  };

  //* 변경 전 레벨, 경험치
  responseData.before = {
    level: current_level,
    experience: current_experience,
  };

  // 획득 경험치를 추가
  responseData.before.get_experience = experience;

  if (target_currency) {
    //레벨업을 하는 경우, 보상 재화 전달
    responseData.reward = {
      currency: next_currency,
      quantity: next_quantity,
      icon_image_url,
      icon_image_key,
      currency_type,
      type_name,
      currency_name,
    };
  }

  //* 안 읽은 메일 건수
  const unreadMailResult = await DB(
    `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
    [userkey]
  );

  responseData.unreadMailCount = 0;
  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    responseData.unreadMailCount = unreadMailResult.row[0].cnt;

  responseData.bank = await getUserBankInfo(req.body);
  responseData.event = level_bonus_check; //레벨업 이벤츠 추가 보상 메일 발송 여부 

  res.status(200).json(responseData);

  logAction(userkey, "levelup", {
    userkey,
    current_level,
    current_experience,
    experience,
    route,
    clear_id,
    project_id,
  });
};

//! 레벨 리스트
export const getLevelList = async (req, res) => {
  const result = await DB(`
    SELECT 
    next_level
    , experience
    , currency 
    , quantity 
    FROM com_level_management
    ORDER BY next_level; 
    `);

  res.status(200).json(result.row);
};

export const getLevelListNoResponse = async () => {
  const result = await DB(`
  SELECT 
  next_level
  , experience
  , currency 
  , quantity 
  FROM com_level_management
  ORDER BY next_level; 
  `);

  return result.row;
};
