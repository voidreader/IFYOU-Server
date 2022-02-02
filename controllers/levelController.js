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
      ver = 0,
    },
  } = req;

  if (experience === 0) {
    logger.error(`updateUserLevelProcess error`);
    respondDB(res, 80019);
    return;
  }

  const responseData = {};
  const rewardList = [];
  let currentQuery = ``;
  let insertQuery = ``;
  let updateQuery = ``;
  let sendQuery = ``;

  let total_experience = current_experience + experience;
  let level_bonus_check = 0;
  let target_level = 0;
  let target_experience = 0;
  let target_currency = ``;
  let target_quantity = 0;
  let icon_image_url = ``;
  let icon_image_key = ``;
  let currency_type = ``;
  let type_name = ``;
  let currency_name = ``;

  //* 다음 레벨 목표 경험치, 재화, 개수 가져오기
  let result = await DB(
    `SELECT next_level 
    , experience 
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
    AND next_level > ${current_level}
    AND experience <= ${total_experience};`
  );
  if (result.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      total_experience -= item.experience;
      if (total_experience >= 0) {
        if (ver >= 10) {
          // version 1.1.10부터 메일지급
          currentQuery = `CALL sp_send_user_mail(?,?,?,?,?,?);`;
          sendQuery += mysql.format(currentQuery, [
            userkey,
            "levelup",
            item.currency,
            item.quantity,
            -1,
            365,
          ]);
        } else {
          // 1.1.10 미만 버전에서는 바로지급

          currentQuery = `CALL sp_insert_user_property(?,?,?,?);`;
          sendQuery += mysql.format(currentQuery, [
            userkey,
            item.currency,
            item.quantity,
            "levelup",
          ]);
        }

        //* 2022.01.13 JE - 레벨업 이벤트 추가 보상(단발성 : 2022.01.19 ~ 02.16일 23시 59분)
        //* 해당 되는 레벨(5, 8, 11, 15)들은 메일 발송 처리
        // eslint-disable-next-line no-await-in-loop
        result = await DB(`
        SELECT CASE WHEN ${item.next_level} = 5 OR ${item.next_level} = 8 OR ${item.next_level} = 11 OR ${item.next_level} = 15 THEN 1 ELSE 0 END level_bonus_check
        FROM DUAL WHERE now() between '2022-01-19 00:00:00' AND '2022-02-16 23:59:59';`);
        if (result.state && result.row.length > 0) {
          level_bonus_check = result.row[0].level_bonus_check;
          currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
          VALUES(?, 'event', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;
          if (level_bonus_check === 1) {
            if (item.next_level === 5) {
              sendQuery += mysql.format(currentQuery, [userkey, "gem", "3"]);
            } else if (item.next_level === 8) {
              sendQuery += mysql.format(currentQuery, [userkey, "gem", "3"]);
              sendQuery += mysql.format(currentQuery, [userkey, "coin", "500"]);
            } else if (item.next_level === 11) {
              sendQuery += mysql.format(currentQuery, [userkey, "gem", "5"]);
              sendQuery += mysql.format(currentQuery, [
                userkey,
                "coin",
                "1000",
              ]);
            } else if (item.next_level === 15) {
              sendQuery += mysql.format(currentQuery, [userkey, "gem", "5"]);
              sendQuery += mysql.format(currentQuery, [
                userkey,
                "coin",
                "1500",
              ]);
            }
          }
        }

        target_level = item.next_level;
        target_currency = item.currency;
        target_quantity = item.quantity;
        target_experience = total_experience;
        icon_image_url = item.icon_image_url;
        icon_image_key = item.icon_image_key;
        currency_type = item.currency_type;
        type_name = item.type_name;
        currency_name = item.currency_name;

        rewardList.push({
          level: target_level,
          currency: target_currency,
          quantity: target_quantity,
          icon_image_url,
          icon_image_key,
        });
      }
    }
  } else {
    target_level = current_level;
    target_experience = total_experience;
  }

  //* 레벨 히스토리 누적 > 최종 currency로 히스토리 누적
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
    target_experience < 0 ? 0 : target_experience,
    userkey,
  ]);

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
      currency: target_currency,
      quantity: target_quantity,
      icon_image_url,
      icon_image_key,
      currency_type,
      type_name,
      currency_name,
    };
    responseData.rewardList = rewardList;
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
