import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { response } from "express";
import { DB, logAction, logDB, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { Q_UPDATE_CLIENT_ACCOUNT_WITH_GAMEBASE } from "../QStore";

const getRandomPIN = () => {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
};

export const getPackageProject = async (req, res) => {
  const {
    body: { userkey = 0, country = "ZZ", lang = "EN", project_id },
  } = req;

  const result = await slaveDB(`
  SELECT a.project_id 
  , ifnull(b.title, a.title) title
  , ifnull(b.summary, a.summary) summary 
  , ifnull(b.writer , a.writer) writer 
  , a.sortkey 
  , a.bubble_set_id
  , a.favor_use 
  , a.challenge_use 
  , a.is_credit 
  , fn_get_design_info(b.ifyou_banner_id, 'url') ifyou_image_url
  , fn_get_design_info(b.ifyou_banner_id, 'key') ifyou_image_key
  , fn_get_design_info(a.ifyou_thumbnail_id, 'url') ifyou_thumbnail_url
  , fn_get_design_info(a.ifyou_thumbnail_id, 'key') ifyou_thumbnail_key
  , fn_get_design_info(b.circle_image_id, 'url') circle_image_url
  , fn_get_design_info(b.circle_image_id, 'key') circle_image_key
  , fn_get_design_info(a.episode_finish_id, 'url') episode_finish_url
  , fn_get_design_info(a.episode_finish_id, 'key') episode_finish_key
  , fn_get_design_info(a.coin_banner_id, 'url') coin_banner_url
  , fn_get_design_info(a.coin_banner_id, 'key') coin_banner_key
  , a.banner_model_id -- 메인배너 Live2D 모델ID
  , a.color_rgb
  , fn_check_exists_project_play_record(${userkey}, a.project_id) is_playing
  , b.original
  , fn_get_project_hashtags(a.project_id, '${lang}') hashtags
  , ifnull(b.translator, '') translator
  FROM list_project_master a
  LEFT OUTER JOIN list_project_detail b ON b.project_id = a.project_id AND b.lang ='${lang}'
  WHERE a.project_id = ${project_id};
  `);

  const responseData = {};
  if (!result.state || result.row.length === 0) {
    logger.error(`getPackageProject ${project_id}`);

    res.status(400).json(responseData);
  }

  responseData.project = result.row[0];

  res.status(200).json(responseData);
};

// 패키지 계정 등록
const registerPackageAccount = async (req, res) => {
  const {
    body: { deviceid, packageid, os, lang = "EN" },
  } = req;

  const pincode = getRandomPIN();

  const result = await DB(
    `
  INSERT INTO pier.table_account
    (deviceid, nickname, createtime, lastlogintime, admin, gamebaseid, pincode, package)
    VALUES(?, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, NULL, ?, ?);
  `,
    [deviceid, pincode, packageid]
  );

  if (!result.state) {
    logger.error(`registerPackageAccount Error ${result.error}`);
    respondDB(res, 80026, result.error);

    return;
  }

  loginPackage(req, res);
};

export const loginPackage = async (req, res) => {
  const {
    body: { deviceid, packageid, os, lang = "EN" },
  } = req;

  // 안드로이드 ,아이폰 분류 처리
  let userOS = "";
  if (os === 0) userOS = "Android";
  else userOS = "iOS";

  let result = null;
  const accountInfo = {};

  result = await DB(
    `
  SELECT ta.userkey  
, ta.deviceid 
, ta.nickname 
, ta.admin 
, ta.gamebaseid 
, concat('#', ta.pincode, '-', ta.userkey) pincode 
, fn_get_user_unread_mail_count(ta.userkey) unreadMailCount
, ta.tutorial_step
, ta.uid
, ta.ad_charge
, ta.current_level
, ta.current_experience
, ta.account_link
, ifnull(t.tutorial_selection, 0) tutorial_selection
, t.how_to_play
, ta.intro_done
, ifnull(ta.allpass_expiration, '2022-01-01') allpass_expiration
, datediff(now(), ta.last_rate_date) diff_rate
, ta.rate_result
, ifyou_pass_day
FROM table_account ta 
LEFT OUTER JOIN user_tutorial t ON t.userkey = ta.userkey
WHERE ta.deviceid  = ?
  AND ta.package = ?;
  `,
    [deviceid, packageid]
  );

  if (result.row.length === 0) {
    // 신규 게정에 대한 처리
    registerPackageAccount(req, res);
    return;
  } else {
    accountInfo.account = result.row[0];
  }

  if (accountInfo.account.uid === null || accountInfo.account.uid === "") {
    const uid = `${accountInfo.account.pincode}`;
    await DB(`
    UPDATE table_account
       SET uid = '${uid}'
         , nickname = '${uid}'
     WHERE userkey = ${accountInfo.account.userkey};
    `);

    accountInfo.account.uid = uid;
    accountInfo.account.nickname = uid;
  }

  // 응답처리
  res.status(200).json(accountInfo);

  // 마지막 접속일자, 언어정보 등 갱신처리
  DB(Q_UPDATE_CLIENT_ACCOUNT_WITH_GAMEBASE, [
    "ZZ",
    1,
    userOS,
    lang,
    accountInfo.account.userkey,
  ]);
};
