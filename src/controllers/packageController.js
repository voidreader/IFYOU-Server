import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { response } from "express";
import { DB, logAction, logDB, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB, respondFail, respondSuccess } from "../respondent";
import { Q_UPDATE_CLIENT_ACCOUNT_WITH_GAMEBASE } from "../QStore";
import {
  getUserProjectCurrent,
  getUserProjectSelectionProgress,
} from "../com/userProject";
import {
  getProductDetailList,
  getUserPurchaseListVer2,
} from "./shopController";
import { checkBuildValidation } from "../com/com";
import {
  getUserGalleryHistory,
  getCurrentLoadingData,
  requestMainEpisodeList,
  arrangeBubbleSet,
  getUserStorySelectionHistory,
  getOtomeProjectResources,
} from "./accountController";
import { cache } from "../init";
import { getUserVoiceHistory } from "./soundController";
import {
  getOtomeProfileLines,
  getUserProjectAbilityCurrent,
  getUserStoryAbilityRawList,
} from "./abilityController";
import { getUserSelectionPurchaseInfo } from "./selectionController";

// 유저 미수신 메일 리스트(만료일 지나지 않은 것들)
const QUERY_NOVEL_USER_UNREAD_MAIL_LIST = `
SELECT a.mail_no
, a.userkey
, a.mail_type
, fn_get_standard_text_id('mail_type', a.mail_type) mail_type_textid
, a.currency
, a.quantity
, a.is_receive
, a.connected_project
, fn_get_project_name_new(a.connected_project, ?) connected_project_title
, TIMESTAMPDIFF(HOUR, now(), a.expire_date) remain_hours
, TIMESTAMPDIFF(MINUTE, now(), a.expire_date) remain_mins
, cc.local_code
, a.purchase_no 
, fn_get_design_info(cc.icon_image_id, 'url') icon_image_url
, fn_get_design_info(cc.icon_image_id, 'key') icon_image_key
, ifnull(a.contents, '') contents
FROM user_mail a
LEFT OUTER JOIN com_currency cc ON cc.currency = a.currency 
WHERE a.userkey = ?
AND a.is_receive = 0 
AND a.expire_date > now()
ORDER BY a.mail_no desc;
`;

const QUERY_CONSUME_ENERGY = `
UPDATE table_account
   SET energy = ?
 WHERE userkey = ?;
`;

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
    body: { deviceid, packageid, os, lang = "EN", ugsid = null },
  } = req;

  const pincode = getRandomPIN();

  const result = await DB(
    `
  INSERT INTO pier.table_account
    (deviceid, nickname, createtime, lastlogintime, admin, gamebaseid, pincode, package)
    VALUES(?, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, ?, ?, ?);
  `,
    [deviceid, ugsid, pincode, packageid]
  );

  if (!result.state) {
    logger.error(`registerPackageAccount Error ${result.error}`);
    respondDB(res, 80026, result.error);

    return;
  }

  loginPackage(req, res);
};

export const loginPackage = async (req, res) => {
  // 2022.11.11 유니티 게임서비스 ID 추가
  const {
    body: {
      deviceid,
      packageid,
      os,
      lang = "EN",
      ugsid = null,
      tokenMeta = "",
      token64 = "",
      token7 = "",
      version = 0,
    },
  } = req;

  logger.info(`loginPackage : ${JSON.stringify(req.body)}`);

  // 안드로이드 ,아이폰 분류 처리
  let userOS = "";
  if (os === 0) userOS = "Android";
  else if (os === 1) userOS = "iOS";
  else userOS = "Android";

  // 유니티 게임서비스 ID 여부에 따라 분기
  let conditionQuery = ``;
  if (ugsid) {
    conditionQuery = ` AND ta.gamebaseid = '${ugsid}' `;
  } else {
    conditionQuery = ` AND ta.deviceid  = '${deviceid}' `;
  }

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
     WHERE ta.package = ?
     ${conditionQuery}
    ;
  `,
    [packageid]
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
    "ZZ",
    accountInfo.account.userkey,
  ]);
};

// * 유저의 현재 에너지 구하기
const getUserEnergy = async (userkey) => {
  const energyQuery = await DB(
    `SELECT a.energy FROM table_account a WHERE a.userkey = ${userkey};`
  );
  const currentEnergy = energyQuery.row[0].energy;
  return currentEnergy;
};

// 광고로 에너지 충전하기
export const chargeEnergyByAdvertisement = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  const responseData = {};
  const energyQuery = await slaveDB(
    `SELECT a.energy FROM table_account a WHERE a.userkey = ${userkey};`
  );
  let currentEnergy = energyQuery.row[0].energy;
  let addEnergy = 8;

  // 최대치를 넘어가지 않도록 한다.
  if (currentEnergy < 150 && currentEnergy + addEnergy > 150) {
    addEnergy = 150 - currentEnergy;
    currentEnergy = 150;
  } else if (currentEnergy + addEnergy <= 150) {
    currentEnergy += addEnergy;
  } else {
    addEnergy = 0;
  }

  responseData.energy = currentEnergy;
  responseData.addEnergy = addEnergy;
  respondSuccess(res, responseData); // 응답처리

  // 응답 후 DB 처리
  DB(`UPDATE table_account
       SET energy = ${currentEnergy}
    WHERE userkey = ${userkey};
  `);
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
      price = 0,
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

// * 에너지로 선택지 선택
export const chooseChoiceWithEnergy = async (req, res) => {
  const {
    body: {
      userkey,
      project_id,
      episode_id,
      script_text,
      target_scene_id = -1,
      selection_group = 0,
      selection_no = 0,
      price = 0,
    },
  } = req;

  req.body.episodeID = episode_id;
  let isPassUser = false;

  // 에너지 소모량이 0으로 왔으면 프리미엄 패스 체크
  if (price === 0) {
    const checkPassQueryResult = await slaveDB(`
    SELECT a.purchase_no, a.product_id 
      FROM user_purchase a
    WHERE a.userkey = ${userkey}
      AND a.product_id LIKE '%premium_pass%';
    `);

    if (checkPassQueryResult.state && checkPassQueryResult.row.length > 0) {
      isPassUser = true;
    } else {
      respondFail(res, {}, `suspicious user`, 80019);
      logger.error(`chooseChoiceWithEnergy - suspicious user [${userkey}]`);
      return;
    }
  }

  const userEnergy = await getUserEnergy(userkey);

  if (userEnergy < price) {
    respondFail(res, {}, "not enough energy", 80019);
    // logger.error()
  }

  // 결과전달값
  const responseData = {};
  responseData.energy = userEnergy - price; // 현재 에너지

  if (price > 0) {
    // table_account 업데이트
    DB(`
    UPDATE table_account
      SET energy = ${responseData.energy}
    WHERE userkey = ${userkey};
    `);
  }

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
  logAction(userkey, "energy_choice", req.body);
}; // ? chooseChoiceWithEnergy END

//! 상품 구매 리스트 - 패키지 유저
export const getPackUserPurchaseList = async (req, res, isResponse = true) => {
  const responseData = {};

  const {
    body: { userkey, pack },
  } = req;

  // 일반 상품(이프유 패스도 포함)
  const result = await DB(
    `
  SELECT up.purchase_no
  , up.product_id 
  , up.receipt
  , up.state
  , DATE_FORMAT(up.purchase_date, '%Y-%m-%d %T') purchase_date
  , lpm.product_master_id
  FROM user_purchase up
     , list_product_master lpm 
  WHERE userkey = ${userkey}
    AND lpm.product_id = up.product_id 
    AND up.purchase_date BETWEEN lpm.from_date AND lpm.to_date
    AND lpm.package  = '${pack}'
  ORDER BY purchase_no DESC;
  `
  );
  responseData.normal = result.row;

  responseData.oneday_pass = [];

  responseData.premium_pass = [];

  if (isResponse) {
    res.status(200).json(responseData);
  } else {
    return responseData;
  }
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

  const responseData = { product_id };
  logger.info(`purchaseSingleNovelProduct ${JSON.stringify(req.body)}`);

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
      receipt.length > 2000 ? "" : receipt,
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
  responseData.userPurchaseHistory = await getPackUserPurchaseList(
    req,
    res,
    false
  );

  logger.info(
    `${paymentSeq} purchase_complete :: ${JSON.stringify(responseData)}`
  );

  respondSuccess(res, responseData);
};

export const checkPackageVersion = async (req, res) => {
  const {
    body: { pack, version },
  } = req;

  const result = await slaveDB(
    `SELECT cp.version, cp.test_url, cp.live_url, cp.limit_version  FROM com_package cp WHERE cp.package  = '${pack}';`
  );

  const liveVersion = result.row[0].version;
  const responseData = {};

  // 클라이언트의 버전이 큰 경우, 실패처리
  if (liveVersion < version) {
    responseData.url = result.row[0].test_url;
  } else {
    // 작거나 같으면 성공
    responseData.url = result.row[0].live_url;
  }

  respondSuccess(res, responseData);
};

// * 노벨 패키지 유저 메일 리스트 조회
export const getNovelPackageUserUnreadMailList = async (req, res) => {
  const {
    body: { userkey, lang = "KO" },
  } = req;

  const responseData = {};

  // 조회 쿼리 QUERY_USER_UNREAD_MAIL_LIST
  const result = await DB(QUERY_NOVEL_USER_UNREAD_MAIL_LIST, [lang, userkey]);

  // console.log(result.row);

  responseData.mailList = result.row;
  const unreadMailResult = await DB(
    `
    SELECT fn_get_user_unread_mail_count(?) cnt
    FROM dual
    `,
    [userkey]
  );

  responseData.unreadMailCount = 0;
  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    responseData.unreadMailCount = unreadMailResult.row[0].cnt;

  // 에너지 업데이트
  responseData.energy = await getUserEnergy(userkey);

  console.log(responseData);

  res.status(200).json(responseData);
};

// * 노벨 패키지 메일 실제 읽기 처리하기!
export const readNovelPackageUserSingleMail = async (req, res, next) => {
  const {
    body: { mail_no, userkey },
  } = req;

  logger.info(`readPackageUserSingleMail [${JSON.stringify(req.body)}]`);

  const mailInfo = await slaveDB(
    `
    SELECT a.mail_no
    , a.mail_type 
    , a.currency 
    , a.quantity 
    , a.purchase_no
    , a.paid
    , ta.energy 
 FROM user_mail a 
    , table_account ta 
WHERE a.mail_no = ?
  AND a.is_receive = 0
  AND ta.userkey = a.userkey 
  AND a.expire_date > now();
  `,
    [mail_no]
  );

  if (!mailInfo.state || mailInfo.row.length === 0) {
    logger.error(`readPackageUserSingleMail Error 1 ${mailInfo.error}`);
    respondFail(res, {}, "Invalid Mail");
    return;
  }

  const currentMail = mailInfo.row[0];
  // 일반 메일 처리
  // 메일에 재화가 energy만 온다.
  if (currentMail.currency != "energy") {
    respondFail(res, {}, "it is not energy");
    return;
  }

  let currentEnergy = currentMail.energy;
  let addEnergy = currentMail.quantity;

  // 최대치를 넘어가지 않도록 한다.
  if (currentEnergy < 150 && currentEnergy + addEnergy > 150) {
    addEnergy = 150 - currentEnergy;
    currentEnergy = 150;
  } else if (currentEnergy + addEnergy <= 150) {
    currentEnergy += addEnergy;
  } else {
    addEnergy = 0;
  }

  // 받는 에너지가 0이 넘을때만
  if (addEnergy > 0) {
    await DB(`UPDATE table_account
                  SET energy = ${currentEnergy}
                  WHERE userkey = ${userkey};`);

    // 3. 메일 수신 처리
    const updateMail = await DB(
      `
          UPDATE user_mail 
          SET is_receive = 1
            , receive_date = now()
          WHERE mail_no = ?;
      `,
      [mail_no]
    );

    if (!updateMail.state) {
      logger.error(`readPackageUserSingleMail Error 3 ${updateMail.error}`);
      respondFail(res, {}, "fail receive");
      return;
    }
  }

  // 다했으면 ! next 불러주세요.
  if (next) {
    next(req, res);
  }
}; // ? 유저 단일  메일 수신 처리 끝!

// * 노벨 패키지 유저 단일 메일 수신 처리
export const requestNovelPackageReceiveSingleMail = (req, res) => {
  readNovelPackageUserSingleMail(req, res, getNovelPackageUserUnreadMailList);
};

// * 노벨 패키지 유저 모든 메일 수신 처리
export const requestNovelPackageReceiveAllMail = async (req, res) => {
  const {
    body: { userkey, lang = "KO" },
  } = req;

  // 에러가 발견되면 지울 예정
  logger.info(
    `requestNovelPackageReceiveAllMail [${JSON.stringify(req.body)}]`
  );

  // 유저의 모든 미수신 메일 정보를 읽어온다.
  const result = await slaveDB(QUERY_NOVEL_USER_UNREAD_MAIL_LIST, [
    lang,
    userkey,
  ]);

  for await (const item of result.row) {
    req.body.mail_no = item.mail_no;
    await readNovelPackageUserSingleMail(req, res, null);
  }

  getNovelPackageUserUnreadMailList(req, res);
};

// * 일일 에너지 보상 받을 수 있는지 체크 및 받기
export const checkDailyEnergy = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  const responseData = { addEnergy: 0, energy: 0 };

  const checkResult = await slaveDB(`
  SELECT EXISTS (SELECT z.userkey 
    FROM user_daily_energy z 
   WHERE z.userkey = ${userkey}
     AND date_format(now(), '%Y-%m-%d') <= z.receive_date) is_exists 
  FROM DUAL;
  `);

  if (!checkResult.state || checkResult.row.length === 0) {
    respondFail(res, responseData, `can't check`, 0);
    return;
  }

  const { is_exists } = checkResult.row[0];

  if (is_exists === 0) {
    // 오늘 받은게 없음
    // 에너지 입력해줄것.
    responseData.addEnergy = 150;

    // 제한없이 150 더한다.
    await DB(`
    UPDATE table_account
       SET energy = energy + 150
      WHERE userkey = ${userkey};
    `);

    // daily 테이블에 입력.
    DB(
      `INSERT INTO user_daily_energy (userkey) VALUES (${userkey}) ON DUPLICATE KEY UPDATE receive_date = now();`
    );
  }

  responseData.energy = await getUserEnergy(userkey);

  respondSuccess(res, responseData);
};

// * 패키지 작품의 상세 정보 가져오기
export const requestPackageStoryInfo = async (req, res) => {
  const {
    body: {
      userkey,
      project_id,
      userBubbleVersion = 0,
      clientBubbleSetID = -1,
      lang = "KO",
    },
  } = req;

  //로그용으로 쌓기 위해 추가
  logAction(userkey, "package_enter", req.body);

  // 유저 정보
  const userInfo = {
    userkey,
    project_id,
    userBubbleVersion,
    clientBubbleSetID,
    lang,
  };

  // 프로젝트에 연결된 BubbleSet ID, Version 정보 추가
  let ProjectBubbleSetId = parseInt(clientBubbleSetID, 10);
  const result = await slaveDB(
    "SELECT * FROM list_project_master WHERE project_id = ?;",
    [project_id]
  );
  if (result.state && result.row.length > 0) {
    if (ProjectBubbleSetId !== result.row[0].bubble_set_id)
      ProjectBubbleSetId = result.row[0].bubble_set_id;
  }

  //버전 셋팅
  let bubbleMaster = "";
  const bubbleMasterCache = cache.get("bubble").bubbleMaster;
  bubbleMasterCache.forEach((item) => {
    if (item.bubbleID === ProjectBubbleSetId) bubbleMaster = item;
  });
  if (bubbleMaster === "") bubbleMaster = { bubbleID: 25, bubble_ver: 1 }; //없으면 디폴트로

  // 프로젝트와 연결된 말풍선 세트 정보를 따로 갖고 있는다. (아래에서 비교)
  userInfo.bubbleID = bubbleMaster.bubbleID;
  userInfo.bubble_ver = bubbleMaster.bubble_ver;

  const storyInfo = {}; // * 결과값

  storyInfo.projectCurrent = await getUserProjectCurrent(userInfo); // 프로젝트 현재 플레이 지점 !
  storyInfo.galleryImages = await getUserGalleryHistory(userInfo); // 갤러리 공개 이미지

  // 로딩정보
  const currentLoadingData = await getCurrentLoadingData(
    userInfo.project_id,
    storyInfo.projectCurrent[0].episode_id,
    userInfo.lang
  );
  storyInfo.loading = currentLoadingData.loading;
  storyInfo.loadingDetail = currentLoadingData.loadingDetail;

  storyInfo.selectionProgress = await getUserProjectSelectionProgress(userInfo); // 프로젝트 선택지 Progress
  // voice
  const voiceData = await getUserVoiceHistory(userInfo);
  storyInfo.voiceHistory = voiceData.voiceHistory; // 화자별로 포장된 보이스
  storyInfo.rawVoiceHistory = voiceData.rawVoiceHistory; // 리스트 그대로 형태의 보이스
  storyInfo.episodes = await requestMainEpisodeList(userInfo); // 유저의 정규 에피소드 리스트
  storyInfo.sides = [];

  storyInfo.bubbleMaster = bubbleMaster; // 말풍선 마스터 정보
  // * 말풍선 상세 정보 (버전체크를 통해서 필요할때만 내려준다)
  // 버전 + 같은 세트 ID인지도 체크하도록 추가.
  if (
    userInfo.userBubbleVersion != userInfo.bubble_ver ||
    userInfo.clientBubbleSetID != userInfo.bubbleID
  ) {
    // logger.info(`!!! Response with BubbleSetDetail`);
    const allBubbleSet =
      cache.get("bubble").bubbleSet[userInfo.bubbleID.toString()];

    // 말풍선 세트를 Variation, Template 별로 정리합니다.
    storyInfo.bubbleSet = arrangeBubbleSet(allBubbleSet);
  } // ? 말풍선 상세정보 끝

  storyInfo.ability = await getUserProjectAbilityCurrent(userInfo); //유저의 현재 능력치 정보
  storyInfo.rawStoryAbility = await getUserStoryAbilityRawList(req.body); // 스토리에서 획득한 능력치 Raw 리스트
  storyInfo.profileLine = await getOtomeProfileLines(userInfo);
  storyInfo.selectionPurchase = await getUserSelectionPurchaseInfo(userInfo); // 과금 선택지 정보
  storyInfo.selectionHistory = await getUserStorySelectionHistory(req.body); // 선택지 히스토리

  const projectResources = await getOtomeProjectResources(
    userInfo.project_id,
    userInfo.lang,
    userInfo.userkey
  );

  if (projectResources == null) {
    logger.error(`Otome resource loading error ${JSON.stringify(userInfo)}`);
    respondFail(res, {}, "Error in requestPackageStoryInfo", 80019);
    return;
  }

  storyInfo.backgrounds = projectResources.backgrounds;
  storyInfo.emoticons = projectResources.emoticons;
  storyInfo.detail = projectResources.detail; // 상세정보
  storyInfo.dressCode = projectResources.dressCode; // 의상정보
  storyInfo.nametag = projectResources.nametag; // 네임태그
  storyInfo.bgms = projectResources.bgms; // BGM
  storyInfo.illusts = projectResources.illusts; // 이미지 일러스트
  storyInfo.minicuts = projectResources.minicuts; // 미니컷
  storyInfo.models = projectResources.models; // 캐릭터 모델 정보
  storyInfo.liveObjects = projectResources.liveObjects; // 라이브 오브젝트
  storyInfo.liveIllusts = projectResources.liveIllusts; // 라이브 일러스트
  storyInfo.bubbleSprite =
    cache.get("bubble").bubbleSprite[userInfo.bubbleID.toString()]; // 프로젝트 말풍선 스프라이트 정보
  storyInfo.episodeLoadingList = projectResources.episodeLoadingList; // 에피소드 로딩 리스트

  storyInfo.sceneProgress = projectResources.sceneProgress; // 유저 사건ID 진행도
  storyInfo.sceneHistory = projectResources.sceneHistory; // 유저가 한번이라도 오픈한 프로젝트별 사건ID (신규 입력만, 삭제나 변경 없음)
  storyInfo.episodeProgress = projectResources.episodeProgress; // ! 유저 에피소드 진행도
  storyInfo.episodeHistory = projectResources.episodeHistory; // 유저 에피소드 히스토리
  storyInfo.episodePurchase = projectResources.episodePurchase; // 에피소드 구매 정보

  // 응답
  respondSuccess(res, storyInfo);
}; // ? requestPackageStoryInfo

export const purchaseOtomeChoice = async (req, res) => {
  logger.info(`purchaseOtomeChoice : ${JSON.stringify(req.body)}`);

  const {
    body: {
      userkey,
      project_id,
      episode_id,
      selection_group,
      selection_no,
      price = 0,
      lang = "KO",
    },
  } = req;

  let hasPurchaseHistory = false;
  let energy = 0;
  let realPrice = price;

  const responseData = {};

  if (price <= 0) {
    logger.error(`purchaseOtomeChoice error in price [${userkey}]`);
    respondFail(res, {}, "price", 80019);
    return;
  }

  const historyCheckResult = await DB(`
  SELECT a.userkey 
  FROM user_selection_purchase a
 WHERE a.userkey = ${userkey}
   AND a.project_id = ${project_id}
   AND a.episode_id = ${episode_id}
   AND a.selection_group = ${selection_group}
   AND a.selection_no  = ${selection_no};
  `);

  // 히스토리 체크
  if (historyCheckResult.state && historyCheckResult.row.length > 0) {
    hasPurchaseHistory = true;
    realPrice = 0;
  }

  energy = await getUserEnergy(userkey);
  if (energy < price) {
    logger.error(`not enough energy ${energy}`);
    respondFail(res, {}, "no energy", 80019);
    return;
  }

  // 입력 쿼리 생성
  let currentQuery = ``;
  let finalEnergy = 0;

  finalEnergy = energy - realPrice;

  // 신규 구매만 처리한다.
  if (!hasPurchaseHistory) {
    //
    currentQuery += mysql.format(
      `INSERT INTO user_selection_purchase(userkey, project_id, episode_id, selection_group, selection_no, price) 
      VALUES(?, ?, ?, ?, ?, ?);`,
      [
        userkey,
        project_id,
        episode_id,
        selection_group,
        selection_no,
        realPrice,
      ]
    );

    currentQuery += mysql.format(QUERY_CONSUME_ENERGY, [finalEnergy, userkey]);

    const updateResult = await transactionDB(currentQuery);
    if (!updateResult.state) {
      logger.error(`purchaseOtomeChoice [${updateResult.error}]`);
      respondFail(res, {}, "error", 80019);
      return;
    }
  } // ?

  // 구매내역 전달
  const result = await DB(
    `
    SELECT episode_id
    , selection_group
    , selection_no
    , price 
    FROM user_selection_purchase
    WHERE userkey = ? 
    AND project_id = ? 
    AND episode_id = ? 
    ORDER BY selection_group, selection_no;
    `,
    [userkey, project_id, episode_id]
  );

  responseData.list = result.row;
  responseData.energy = finalEnergy;

  respondSuccess(res, responseData);

  // 로그 추가
  logAction(userkey, "paid_selection", req.body);
};
