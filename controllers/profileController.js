/* eslint-disable no-await-in-loop */
import mysql from "mysql2/promise";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { getProfileCurrencyCurrent } from "./accountController";

//! 프로필 꾸미기 저장
//* 2022.01.07 JE 초상화, 테두리 / 나머지 재화에 따라 지우고 새 데이터로 업데이트
export const userProfileSave = async (req, res) => {
  logger.info(`userProfileSave`);

  const {
    body: { userkey, kind = "", currencyList = "", textList = "" },
  } = req;

  let result = ``;
  let currentQuery = ``;
  let currencyQuery = ``;
  let textQuery = ``;

  if(!kind){
    logger.error(`userProfileSave error`);
    respondDB(res, 80019);
    return;        
  }

  //* 기존 데이터 삭제 
  if(kind === "profile"){ //프로필
    currentQuery = `
    DELETE FROM user_profile_currency
    WHERE userkey = ? 
    AND currency IN ( SELECT currency FROM com_currency WHERE currency_type IN ('portrait', 'frame') );
    `;
  }else{  //꾸미기
    currentQuery = `
    DELETE FROM user_profile_currency
    WHERE userkey = ? 
    AND currency NOT IN ( SELECT currency FROM com_currency WHERE currency_type IN ('portrait', 'frame') );
    `;
  }
  currencyQuery = mysql.format(currentQuery, [userkey]); 

  //* 프로필 재화 저장
  if (currencyList) {
    // 새 데이터 삽입
    currentQuery = `
        INSERT INTO user_profile_currency(userkey, currency, sorting_order, pos_x, pos_y, width, height, angle)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);
        `;
    // eslint-disable-next-line no-restricted-syntax
    for (const item of currencyList) {
      currencyQuery += mysql.format(currentQuery, [
        userkey,
        item.currency,
        item.sorting_order,
        item.pos_x,
        item.pos_y,
        item.width,
        item.height,
        item.angle,
      ]);
    }
  }

  //* 기존 데이터 삭제
  if(kind !== "profile"){
    currentQuery = `DELETE FROM user_profile_text WHERE userkey = ?;`;
    textQuery = mysql.format(currentQuery, [userkey]);
  }

  //* 텍스트 저장
  if (textList) {

    //새 데이터 삽입
    currentQuery = `
        INSERT INTO user_profile_text(userkey, input_text, font_size, color_rgb, sorting_order, pos_x, pos_y, angle)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);
        `;

    // eslint-disable-next-line no-restricted-syntax
    for (const item of textList) {
      textQuery += mysql.format(currentQuery, [
        userkey,
        item.input_text,
        item.font_size,
        item.color_rgb,
        item.sorting_order,
        item.pos_x,
        item.pos_y,
        item.angle,
      ]);
    }
  }

  //* 기존 데이터를 지우고 새 데이터 insert
  result = await transactionDB(`
  ${currencyQuery}
  ${textQuery}
  `);

  if (!result.state) {
    logger.error(`userProfileSave error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }


  logAction(userkey, "profile_save", { userkey });
  getProfileCurrencyCurrent(req, res);
};
