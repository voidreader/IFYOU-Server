/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
import mysql from "mysql2/promise";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import {
  UQ_ACCQUIRE_CURRENCY,
  UQ_GET_USER_STORY_PROFILE,
  UQ_SAVE_STORY_PROFILE,
} from "../USERQStore";

// * 유저가 보유한 재화 (작품 꾸미기 가능 재화 한정) 리스트 (2022.02.21)
export const getUserStoryProfileCurrencyList = async (req, res) => {
  logger.info(`getUserStoryProfileCurrencyList`);

  const {
    body: { userkey, project_id },
  } = req;

  const responseData = {};
  // 재화별로 리스트 가져오기
  const result = await DB(
    `
  SELECT a.currency
       , fn_get_design_info(icon_image_id, 'url') icon_url
       , fn_get_design_info(icon_image_id, 'key') icon_key
       , CASE WHEN currency_type = 'wallpaper' THEN fn_get_bg_info(resource_image_id, 'url') 
              ELSE fn_get_design_info(resource_image_id, 'url') 
              END currency_url
       , CASE WHEN currency_type = 'wallpaper' THEN fn_get_bg_info(resource_image_id, 'key') 
              ELSE fn_get_design_info(resource_image_id, 'key') 
              END currency_key
       , currency_type
       , b.model_id
       , fn_get_currency_model_name(b.currency_type, ${project_id}, b.model_id) model_name
       , fn_get_currency_origin_name(b.currency_type, ${project_id}, b.resource_image_id) origin_name
       , fn_get_user_property(${userkey}, a.currency) total_cnt
       , (SELECT ifnull(count(*), 0) FROM user_story_profile WHERE userkey = ${userkey} AND project_id = ${project_id} AND currency = a.currency) current_cnt
   FROM user_property a, com_currency b 
  WHERE a.currency = b.currency
    AND b.connected_project = ${project_id} 
    AND userkey = ${userkey}
    AND NOW() < expire_date 
  GROUP BY a.currency
  ORDER BY a.currency;
  `
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const item of result.row) {
    if (
      !Object.prototype.hasOwnProperty.call(responseData, item.currency_type)
    ) {
      responseData[item.currency_type] = [];
    }

    responseData[item.currency_type].push({
      currency: item.currency,
      currency_type: item.currency_type,
      model_id: item.model_id,
      model_name: item.model_name,
      origin_name: item.origin_name,
      icon_url: item.icon_url,
      icon_key: item.icon_key,
      currency_url: item.currency_url,
      currency_key: item.currency_key,
      total_cnt: item.total_cnt,
      current_cnt: item.current_cnt,
    });
  }

  res.status(200).json(responseData);
}; // ? getUserStoryProfileCurrencyList

// * 유저 작품별 꾸미기 조회
export const getUserStoryProfile = async (req, res, needResponse = true) => {
  const {
    body: { userkey, project_id },
  } = req;

  // * 현재 작품 프로필 상태 조회
  let currentProfile = await DB(UQ_GET_USER_STORY_PROFILE, [
    userkey,
    project_id,
  ]);

  // * 최종 결과 값.
  let storyProfile = [];

  // currentProfile에 입력된 데이터가 없으면 작품의 default 꾸미기 아이템을 지급한다.
  // 데이터가 있으면 currentProfile의 데이터만 전달하고 끝!

  // * 작품 프로필이 비어있는 경우.
  if (currentProfile.row.length === 0) {
    // * 작품의 default profile property 조회
    const defaultItems = await DB(`
    SELECT a.currency
         , a.sorting_order 
      FROM list_default_property a 
     WHERE a.project_id = ${project_id}
     ORDER BY a.sorting_order;    
    `);

    // * default item 없는 경우
    if (defaultItems.row.length === 0) {
      logger.error(`디폴트 프로필 아이템 없음 [${project_id}]`);

      storyProfile = []; // empty array
    } else {
      // * default item 있음!!
      // 디폴트 아이템을 유저에게 지급하고, 프로필로 저장한다.
      let queryDefaultProfile = ``;

      defaultItems.row.forEach((item) => {
        queryDefaultProfile += mysql.format(UQ_ACCQUIRE_CURRENCY, [
          userkey,
          item.currency,
          1,
          "default_profile",
        ]);

        // 프로필 정보 저장시, 좌표는 0, 가로세로 비율은 1로 설정.
        queryDefaultProfile += mysql.format(UQ_SAVE_STORY_PROFILE, [
          userkey,
          project_id,
          item.currency,
          item.sorting_order,
          0, // pos_x
          0, // pos_y
          1, // width
          1, // height
          0, // angle
        ]);
      });

      const defaultResult = await transactionDB(queryDefaultProfile);
      if (defaultResult.state) {
        // * 입력 완료 후 재조회
        currentProfile = await DB(UQ_GET_USER_STORY_PROFILE, [
          userkey,
          project_id,
        ]);
      } else {
        // * 입력 실패했음.
        logger.error(defaultResult.error);
        storyProfile = []; // empty array
      }
    }
  } // ? 기본 프로필 아이템 지급 및 설정 완료

  storyProfile = currentProfile.row;

  // response 응답해주는 경우,
  if (needResponse) {
    res.status(200).json(storyProfile);
    return;
  }

  // 값만 리턴하는 경우.
  return storyProfile;
};

// * 유저가 저장한 프로필 꾸미기 저장 정보
export const getProfileCurrencyCurrent = async (
  req,
  res,
  needResponse = true
) => {
  logger.info(`getProfileCurrencyCurrent`);

  const {
    body: { userkey },
  } = req;

  const responseData = {};

  console.log(
    mysql.format(
      `  SELECT 
                a.currency
                , CASE WHEN currency_type = 'wallpaper' THEN
                  fn_get_bg_info(resource_image_id, 'url')
                ELSE 
                  fn_get_design_info(resource_image_id, 'url')
                END currency_url
                , CASE WHEN currency_type = 'wallpaper' THEN
                  fn_get_bg_info(resource_image_id, 'key')
                ELSE 
                  fn_get_design_info(resource_image_id, 'key')
                END currency_key
                , sorting_order
                , pos_x
                , pos_y 
                , width
                , height
                , angle 
                , currency_type
                FROM user_profile_currency a, com_currency b 
                WHERE userkey = ?
                AND a.currency = b.currency
                ORDER BY sorting_order;`,
      [userkey]
    )
  );
  let result = await DB(
    `
  SELECT 
  a.currency
  , CASE WHEN currency_type = 'wallpaper' THEN
    fn_get_bg_info(resource_image_id, 'url')
  ELSE 
    fn_get_design_info(resource_image_id, 'url')
  END currency_url
  , CASE WHEN currency_type = 'wallpaper' THEN
    fn_get_bg_info(resource_image_id, 'key')
  ELSE 
    fn_get_design_info(resource_image_id, 'key')
  END currency_key
  , sorting_order
  , pos_x
  , pos_y 
  , width
  , height
  , angle 
  , currency_type
  FROM user_profile_currency a, com_currency b 
  WHERE userkey = ?
  AND a.currency = b.currency
  ORDER BY sorting_order; 
  ; 
  `,
    [userkey]
  );
  responseData.currency = result.row;
  console.log(
    mysql.format(
      `    SELECT 
  text_id 
  , input_text
  , font_size
  , color_rgb
  , sorting_order
  , pos_x
  , pos_y 
  , angle 
  FROM user_profile_text
  WHERE userkey = ?
  ORDER BY sorting_order; `,
      [userkey]
    )
  );
  result = await DB(
    `
  SELECT 
  text_id 
  , input_text
  , font_size
  , color_rgb
  , sorting_order
  , pos_x
  , pos_y 
  , angle 
  FROM user_profile_text
  WHERE userkey = ?
  ORDER BY sorting_order; 
  ;
  `,
    [userkey]
  );
  responseData.text = result.row;

  // 다른곳에서 쓸때는 그냥 response 없이 응답만.
  if (!needResponse) {
    return responseData;
  }

  res.status(200).json(responseData);
};

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

  if (!kind) {
    logger.error(`userProfileSave error`);
    respondDB(res, 80019);
    return;
  }

  //* 기존 데이터 삭제
  if (kind === "profile") {
    //프로필
    currentQuery = `
    DELETE FROM user_profile_currency
    WHERE userkey = ? 
    AND currency IN ( SELECT currency FROM com_currency WHERE currency_type IN ('portrait', 'frame') );
    `;
  } else if (kind === "deco") {
    //꾸미기
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
  if (kind !== "profile") {
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

//!프로필 꾸미기 저장 뉴버전
export const userProfileSaveVer2 = async (req, res) => {
  const {
    body: { userkey, currencyList = "" },
  } = req;

  let result = ``;
  let currentQuery = ``;
  let updateQuery = ``;

  //재화 리스트
  if (currencyList) {
    currentQuery = `INSERT INTO user_profile_currency(userkey, currency, sorting_order, pos_x, pos_y, width, height, angle)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?);`;

    // eslint-disable-next-line no-restricted-syntax
    for (const item of currencyList) {
      updateQuery += mysql.format(currentQuery, [
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

  //텍스트
  /*if(textList){
    currentQuery = `INSERT INTO user_profile_text(userkey, input_text, font_size, color_rgb, sorting_order, pos_x, pos_y, angle)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?);`;

    // eslint-disable-next-line no-restricted-syntax
    for (const item of textList) {
      updateQuery += mysql.format(currentQuery, [
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
  }*/

  result = await transactionDB(
    `
  DELETE FROM user_profile_currency WHERE userkey = ?; 
  ${updateQuery} 
  `,
    [userkey]
  );

  if (!result.state) {
    logger.error(`userProfileSaveVer2 error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  logAction(userkey, "profile_save_ver2", { userkey });
  getProfileCurrencyCurrent(req, res);
};

// * 유저 작품별 꾸미기 저장하기
export const saveUserStoryProfile = async (req, res) => {
  const {
    body: { userkey, project_id, currencyList = [] },
  } = req;

  let result = ``;
  let updateQuery = ``;

  // 저장 쿼리 생성
  currencyList.forEach((item) => {
    updateQuery += mysql.format(UQ_SAVE_STORY_PROFILE, [
      userkey,
      project_id,
      item.currency,
      item.sorting_order,
      item.pos_x,
      item.pos_y,
      item.width,
      item.height,
      item.angle,
    ]);
  });

  // 삭제하고 진행.
  result = await transactionDB(`
  DELETE FROM user_story_profile WHERE userkey = ${userkey} AND project_id = ${project_id};
  ${updateQuery}
  `);

  if (!result.state) {
    logger.error(`saveUserStoryProfile error ${result.error}`);
    respondDB(res, 80113, result.error);
    return;
  }

  // 저장했으면 작품별 꾸미기 재조회
  getUserStoryProfile(req, res, true);
};
