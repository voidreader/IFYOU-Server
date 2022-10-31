import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { response } from "express";
import { DB, logAction, logDB, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB, respondFail, respondSuccess } from "../respondent";
import { Q_UPDATE_CLIENT_ACCOUNT_WITH_GAMEBASE } from "../QStore";
import { getUserProjectSelectionProgress } from "../com/userProject";
import {
  getProductDetailList,
  getUserPurchaseListVer2,
} from "./shopController";

const getRandomPIN = () => {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
};

// 단일앱 비주얼 노벨타입에서의 프로젝트 정보 조회
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
, ta.energy
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

  // 에너지 정보 추가
  accountInfo.energy = accountInfo.account.energy;

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

// 광고로 에너지 충전하기
export const chargeEnergyByAdvertisement = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  // 최대치를 넘어가지 않도록 변경한다.
  const result = await DB(`
  UPDATE table_account
     SET energy = CASE WHEN energy + 10 > 150 THEN 150 ELSE energy + 10 END 
  WHERE userkey = ${userkey};
  `);

  if (!result.state) {
    logger.error(`${result.error}`);
  }

  res.status(200).json(result.state);
};

// * 선택지로 인해서 20개 소모하기
export const spendEnergyByChoice = async (req, res) => {
  const {
    body: {
      userkey,
      project_id,
      episode_id,
      script_text,
      target_scene_id = -1,
      selection_group = 0,
      selection_no = 0,
    },
  } = req;

  req.body.episodeID = episode_id;

  const currentEnergyRaw = await DB(`
  SELECT a.energy FROM table_account a WHERE a.userkey = ${userkey};
  `);

  if (!currentEnergyRaw.state || currentEnergyRaw.row.length === 0) {
    respondFail(res, {}, "no data", 80019);
    return;
  }

  // 현재 에너지
  const userEnergy = currentEnergyRaw.row[0].energy;

  // 20보다 적으면 실패 전송
  if (userEnergy < 20) {
    respondFail(res, {}, "not enough", 80019);
    return;
  }

  // 20 차감된 에너지를 전달해준다
  const responseData = {};
  responseData.energy = userEnergy - 20; // 현재 에너지

  // table_account 업데이트
  DB(`
  UPDATE table_account
     SET energy = ${responseData.energy}
   WHERE userkey = ${userkey};
  `);

  // 선택지 기록에 저장할것.
  let updateQuery = ``;
  updateQuery += mysql.format(
    `call sp_update_user_selection_progress(?,?,?,?,?);`,
    [userkey, project_id, episode_id, target_scene_id, script_text]
  );
  updateQuery += mysql.format(
    `call sp_update_user_selection_current(?,?,?,?,?,?);`,
    [
      userkey,
      project_id,
      episode_id,
      target_scene_id,
      selection_group,
      selection_no,
    ]
  );

  const updateResult = await DB(updateQuery);
  if (!updateResult.state) {
    logger.error(updateResult.error);
    respondFail(res, {}, "error", 80019);
    return;
  }

  responseData.selectionProgress = await getUserProjectSelectionProgress(
    req.body
  );

  respondSuccess(res, responseData);
};

// * 패키지 프로덕트 조회
export const getPackageProduct = async (req, res) => {
  const {
    body: { lang, pack },
  } = req;

  const result = await slaveDB(
    `    
    SELECT a.product_master_id 
    , a.product_id 
    , fn_get_design_info(lang.banner_id, 'url') product_url
    , fn_get_design_info(lang.banner_id, 'key') product_key
    , fn_get_design_info(lang.detail_image_id, 'url') product_detail_url
    , fn_get_design_info(lang.detail_image_id, 'key') product_detail_key
    , lang.title product_name
    , ifnull(a.bonus_name, '') bonus_name 
    , a.product_type 
    , fn_get_standard_name('product_type', a.product_type) product_type_name 
    , DATE_FORMAT(a.from_date, '%Y-%m-%d %T') from_date
    , DATE_FORMAT(a.to_date, '%Y-%m-%d %T') to_date
    , a.max_count
    , case when a.to_date = '9999-12-31' THEN 0 ELSE 1 END is_event
    , a.is_public
    , a.package
    FROM list_product_master a
        , list_product_lang lang
    WHERE a.is_public > 0
    AND lang.master_id = a.product_master_id 
    AND lang.lang  = '${lang}'
    AND now() BETWEEN a.from_date AND a.to_date
    AND a.package = '${pack}'
    ORDER BY product_type, a.from_date DESC, a.product_id;
    `
  );

  //* 유효한 상품 리스트와 디테일 가져오기
  const responseData = {};
  responseData.productMaster = result.row;
  responseData.productDetail = {};

  const productInfo = {};
  const promise = [];

  responseData.productMaster.forEach(async (item) => {
    const key = item.product_master_id.toString();

    // * product_master_id로 키를 만들어주기
    if (!Object.hasOwnProperty.call(productInfo, key)) {
      productInfo[key] = [];
    }

    // * 상품의 product_type에 따른 디테일 정보를 배열에 푸시해주기(프리미엄 패스 제외)
    // * 프리미엄 패스는 getUserSelectedStory()에서 호출
    if (item.product_type !== "premium_pass") {
      promise.push(
        getProductDetailList(item.product_master_id, item.product_type)
      );
    }
  });

  await Promise.all(promise)
    .then((values) => {
      // * promise에 넣어둔 모든 getProductDetailList 실행이 종료되면, 결과가 한번에 들어온다.
      values.forEach((arr) => {
        //* productInfo의 key랑 arr[i].master_id 가 똑같으면,
        arr.forEach((item) => {
          productInfo[item.master_id.toString()].push(item);
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });

  responseData.productDetail = productInfo;
  respondSuccess(res, responseData);
};

// *  단일 노벨에서의 인앱상품 구매
export const purchaseSingleNovelProduct = async (req, res) => {
  const {
    body: {
      userkey = 0,
      product_id = "",
      product_master_id = 0,
      receipt = "",
      price = 0, // 가격
      currency = "KRW", // 화폐
      paymentSeq = "cruise", // 게임베이스 거래 식별자 1
      purchaseToken = "cruise", // 게임베이스 거래 식별자 2
      os = 0,
    },
  } = req;

  const responseData = {};

  logAction(userkey, `${paymentSeq} purchase call`, {
    product_id,
    receipt,
    paymentSeq,
  });

  // user_purchase 입력을 먼저 한다. purchase_no를 따야함.
  const insertPurchase = await DB(
    `
  INSERT INTO user_purchase(userkey, product_id, receipt, price, product_currency, payment_seq, purchase_token, state, product_master_id) 
  VALUES (${userkey}, ?, ?, ?, ?, ?, ?, 2, ?);
  `,
    [
      product_id,
      receipt,
      price,
      currency,
      paymentSeq,
      purchaseToken,
      product_master_id,
    ]
  );

  if (!insertPurchase.state) {
    logger.error(
      `requestInappProduct : [${JSON.stringify(insertPurchase.error)}]`
    );

    respondFail(res, {}, "insertPurchase.error", 80026);
    return;
  }

  const purchase_no = insertPurchase.row.insertId; // purchase_no 가져오기.

  // 광고제거 패키지나, 프리미엄 패스는 재화 지급이 없다.
  if (
    !product_id.includes("noads_pack") &&
    !product_id.includes("premium_pass")
  ) {
    const productInfo = await slaveDB(
      `
      SELECT b.currency 
           , b.quantity 
           , b.first_purchase
           , b.is_main 
       FROM list_product_master a
           , list_product_detail b
       WHERE a.product_master_id = ${product_master_id}
         AND b.master_id = a.product_master_id
         AND b.is_main > 0
         AND now() BETWEEN a.from_date AND a.to_date;
    `
    );

    // 실패 체크
    if (!productInfo.state || productInfo.row.length === 0) {
      logger.error(`NON-INAPP-PRODUCT : [${productInfo.row.length}]`);
      respondFail(res, {}, "no inapp data", 80049);
      return;
    }

    // 에너지 입력이라서 한 행만 가져온다.
    const addEnergy = productInfo.row[0].quantity;
    responseData.addEnergy = addEnergy;

    // DB에 더해주기.
    await DB(
      `update table_account SET energy = energy + ${addEnergy} WHERE userkey = ${userkey};`
    );

    // 인앱 구매를 통한 에너지는 제한값에 영향을 받지 않는다.
  } // 재화 지급 끝.

  // 응답값 만들기
  responseData.userPurchaseHistory = await getUserPurchaseListVer2(
    req,
    res,
    false
  );

  logger.info(
    `${paymentSeq} purchase_complete :: ${JSON.stringify(responseData)}`
  );

  respondSuccess(res, responseData);
};
