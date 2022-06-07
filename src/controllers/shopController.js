import mysql from "mysql2/promise";
import { response } from "express";
import { timeout } from "async";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB, adminLogInsert, respondAdminSuccess } from "../respondent";
import { gamebaseAPI, inappAPI } from "../com/gamebaseAPI";
import { getUserBankInfo } from "./bankController";

//* 상품 시작
const queryUserPurchaseHistory = `
SELECT purchase_no
  , product_id 
  , ifnull(fn_get_standard_name('product', product_id), '') product_name 
  , receipt
  , state
  , DATE_FORMAT(purchase_date, '%Y-%m-%d %T') purchase_date
  FROM user_purchase
  WHERE userkey = ?
  ORDER BY purchase_no DESC;
`;
///////////////////////////함수 처리 시작///////////////////////////////////////////

//! 상품 정보 가져오기
export const getProductMaster = async (masterId) => {
  const result = await DB(
    `SELECT product_id
  , fn_get_standard_name('product', product_id) product_name
  , product_type 
  , fn_get_standard_name('product_type', product_type) product_type_name 
  , DATE_FORMAT(from_date, '%Y-%m-%d %T') from_date
  , DATE_FORMAT(to_date, '%Y-%m-%d %T') to_date
  , max_count 
  , ifnull(bonus_name, '') bonus_name
  , is_public 
  FROM list_product_master 
  WHERE product_master_id = ?;`,
    [masterId]
  );

  return result.row;
};

//! 상품 상세 가져오기
export const getProductDetailList = async (masterId, product_type) => {
  let result = ``;
  if (product_type === "daily") {
    //console.log('daily',  masterId);

    result = await DB(
      `SELECT master_id
    , day_seq
    , currency
    , fn_get_currency_info(currency, 'name') as currency_name
    , quantity 
    FROM list_product_daily WHERE master_id = ?;`,
      [masterId]
    );
  } else {
    // console.log('general',  masterId);
    result = await DB(
      `SELECT master_id
    , currency
    , fn_get_currency_info(currency, 'name') as currency_name
    , is_main 
    , quantity 
    , first_purchase 
    FROM list_product_detail WHERE master_id = ?;`,
      [masterId]
    );
  }

  // console.log(result);

  return result.row;
};

//! 상품 언어 가져오기
export const getProductLangList = async (masterId) => {
  const result = await DB(
    `SELECT a.*
  , fn_get_design_info(a.banner_id, 'url') banner_url
  , fn_get_design_info(a.banner_id, 'key') banner_key  
  , fn_get_design_info(a.detail_image_id, 'url') detail_url
  , fn_get_design_info(a.detail_image_id, 'key') detail_key  
  FROM list_product_lang a 
  WHERE master_id = ?;`,
    [masterId]
  );

  return result.row;
};

//! 상품 상세 처리
export const detailInsertOrUpdate = async (
  masterId,
  product_type,
  detailList
) => {
  let currentQuery = ``;
  let singleQuery = ``;

  if (product_type === "daily") {
    singleQuery = `CALL sp_update_product_daily(?, ?, ?, ?);`;
    detailList.forEach((item) => {
      currentQuery += mysql.format(singleQuery, [
        masterId,
        item.day_seq,
        item.currency,
        item.quantity,
      ]);
    });
  } else {
    singleQuery = `CALL sp_update_product_detail(?, ?, ?, ?, ?);`;
    detailList.forEach((item) => {
      currentQuery += mysql.format(singleQuery, [
        masterId,
        item.currency,
        item.is_main,
        item.quantity,
        item.first_purchase,
      ]);
    });
  }

  const result = await transactionDB(currentQuery, []);
  if (!result.state) {
    return result.error;
  }

  return "OK";
};

//! 상품 언어 처리
export const langInsertOrUpdate = async (masterId, langList) => {
  let currentQuery = ``;
  let singleQuery = ``;

  singleQuery = `CALL sp_update_product_lang(?, ?, ?, ?, ?);`;
  langList.forEach((item) => {
    currentQuery += mysql.format(singleQuery, [
      masterId,
      item.lang,
      item.title,
      item.banner_id,
      item.detail_image_id,
    ]);
  });

  const result = await transactionDB(currentQuery, []);
  if (!result.state) {
    return result.error;
  }

  return "OK";
};

///////////////////////////함수 처리 끝///////////////////////////////////////////

//! 상품 전체 리스트
export const productAllList = async (req, res) => {
  logger.info(`productList`);

  //! 상품에 등록된 배너/상세 이미지 가져오기
  const subQuery = `(SELECT banner_id FROM list_product_lang WHERE master_id = a.product_master_id AND lang = 'KO')`;

  const result = await DB(
    `SELECT product_master_id
    , fn_get_design_info(${subQuery}, 'url') product_url
    , fn_get_design_info(${subQuery}, 'key') product_key
    , product_id
    , fn_get_standard_name('product', product_id) product_name
    , ifnull(bonus_name, '') bonus_name
    , product_type
    , fn_get_standard_name('product_type', product_type) product_type_name 
    , DATE_FORMAT(from_date, '%Y-%m-%d %T') from_date
    , DATE_FORMAT(to_date, '%Y-%m-%d %T') to_date
    , CASE WHEN product_type = 'daily' THEN 
        '기간제'
      ELSE 
        fn_get_product_detail_info(a.product_master_id) 
      END product_detail_list
    , max_count 
    , is_public 
    , DATE_FORMAT(create_date, '%Y-%m-%d %T') create_date 
    FROM list_product_master a 
    ORDER BY product_master_id DESC;`,
    []
  );

  res.status(200).json(result.row);
};

//! 상품 상세
export const productDetail = async (req, res) => {
  logger.info(`productDetail`);

  const {
    params: { id },
    body: { product_type },
  } = req;

  const responseData = {};
  responseData.productMaster = await getProductMaster(id);
  responseData.productDetail = await getProductDetailList(id, product_type);
  responseData.productLang = await getProductLangList(id);

  res.status(200).json(responseData);
};

//! 판매중인 상품 있는지 확인
export const productPrieodSearch = async (req, res) => {
  logger.info(`productPrieodSearch`);

  const {
    body: {
      product_master_id = 0,
      product_id = "",
      from_date = "",
      to_date = "",
    },
  } = req;

  if (!product_id || !from_date || !to_date) {
    logger.error("productPrieodSearch Error");
    respondDB(res, 80019);
    return;
  }

  const result = await DB(
    `SELECT product_master_id
  , product_type
  , fn_get_standard_name('product_type', product_type) product_type_name 
  , DATE_FORMAT(from_date, '%Y-%m-%d %T') from_date
  , DATE_FORMAT(to_date, '%Y-%m-%d %T') to_date
  , bonus_name
  , is_public 
  FROM list_product_master 
  WHERE product_master_id <> ? 
  AND product_id = ? 
  AND ( (? BETWEEN DATE_FORMAT(from_date, '%Y-%m-%d 00:00:00') AND DATE_FORMAT(to_date, '%Y-%m-%d 23:59:59') ) 
  OR (? BETWEEN DATE_FORMAT(from_date, '%Y-%m-%d 00:00:00') AND DATE_FORMAT(to_date, '%Y-%m-%d 23:59:59') ) )
  `,
    [product_master_id, product_id, from_date, to_date]
  );

  res.status(200).json(result.row);
};

//! 상품 등록/수정
export const productInsertOrUpdate = async (req, res) => {
  const {
    body: {
      product_master_id = 0,
      product_id = "",
      product_type = "",
      max_count = 0,
      from_date = "",
      to_date = "",
      bonus_name = "",
      is_public = 0,
      detailList = "",
      langList = "",
      user_id = "",
    },
  } = req;

  //! 유효성 체크
  if (!product_id || max_count === 0 || !product_type || !user_id) {
    logger.error("productInsertOrUpdate Error 1");
    respondDB(res, 80019);
    return;
  }

  if (!from_date || !to_date) {
    logger.error("productInsertOrUpdate Error 2");
    respondDB(res, 80019);
    return;
  }

  //! 기간 중복 체크
  const fromCheck = await DB(
    `SELECT fn_check_date_exists(?, ?, ?) is_exists FROM DUAL;`,
    [product_id, product_master_id, from_date]
  );
  if (!fromCheck.state) {
    logger.error(`productInsertOrUpdate Error 3 ${fromCheck.error}`);
    respondDB(res, 80026, fromCheck.error);
    return;
  }

  if (fromCheck.row[0].is_exists === 1) {
    logger.error("productInsertOrUpdate Error 4");
    respondDB(res, 80047);
    return;
  }

  const toCheck = await DB(
    `SELECT fn_check_date_exists(?, ?, ?) is_exists FROM DUAL;`,
    [product_id, product_master_id, to_date]
  );
  if (!toCheck.state) {
    logger.error(`productInsertOrUpdate Error 5 ${toCheck.error}`);
    respondDB(res, 80026, toCheck.error);
    return;
  }

  if (toCheck.row[0].is_exists === 1) {
    logger.error("productInsertOrUpdate Error 6");
    respondDB(res, 80047);
    return;
  }

  //! 상세 중복 체크 >> 보낸 데이터에 중복이 있는지를 체크
  if (detailList.length > 0) {
    let detailCheck = true;
    const detailArray = [];

    detailList.forEach((item) => {
      let detailText = ``;
      if (product_type === "daily") detailText = item.day_seq;
      else
        detailText = `${item.currency}:${item.is_main}:${item.first_purchase}`;
      if (!detailArray.includes(detailText)) {
        detailArray.push(detailText);
      } else {
        detailCheck = false;
      }
    });

    if (!detailCheck) {
      logger.error("productInsertOrUpdate Error 7");
      respondDB(res, 80050);
      return;
    }
  }

  //! 언어 중복 체크 >> 보낸 데이터에 중복이 있는지를 체크
  if (langList.length > 0) {
    let langCheck = true;
    const langArray = [];
    langList.forEach((item) => {
      if (!langArray.includes(item.lang)) {
        langArray.push(item.lang);
      } else {
        langCheck = false;
      }
    });

    if (!langCheck) {
      logger.error("productInsertOrUpdate Error 8");
      respondDB(res, 80051);
      return;
    }
  }

  const responseData = {};
  const result = await DB(
    `CALL sp_update_product_master(?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      product_master_id,
      product_id,
      product_type,
      from_date,
      to_date,
      max_count,
      bonus_name,
      is_public,
      user_id,
    ]
  );
  if (!result.state) {
    logger.error(`productInsertOrUpdate Error 9 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  //! masterId 설정
  let masterId = product_master_id;
  if (product_master_id === 0) {
    const masterResult = await DB(
      `SELECT max(product_master_id) product_master_id FROM list_product_master;`,
      []
    );
    masterId = masterResult.row[0].product_master_id;
  }
  responseData.productMaster = await getProductMaster(masterId);

  //! 상품 상세 리스트 처리 및 가져오기
  if (detailList.length > 0) {
    const detailResult = await detailInsertOrUpdate(
      masterId,
      product_type,
      detailList
    );
    if (detailResult !== "OK") {
      logger.error(`productInsertOrUpdate Error 10 ${detailResult}`);
      responseData.detailError = detailResult;
    }
  }
  responseData.productDetail = await getProductDetailList(
    masterId,
    product_type
  );

  //! 상품 언어 리스트 처리 및 가져오기
  if (langList.length > 0) {
    const langResult = await langInsertOrUpdate(masterId, langList);
    if (langResult !== "OK") {
      logger.error(`productInsertOrUpdate Error 11 ${langResult}`);
      responseData.langError = langResult;
    }
  }
  responseData.productLang = await getProductLangList(masterId);
  adminLogInsert(req, "product_update");
  res.status(200).json(responseData);
};

//! 상품 상세 삭제
export const productDetailDelete = async (req, res) => {
  logger.info(`productDetailDelete`);

  const {
    params: { id },
    body: { currency = "", is_main = 0, product_type = "", first_purchase = 0 },
  } = req;

  if (!product_type || product_type === "daily") {
    logger.error(`productDetailDelete Error 1`);
    respondDB(res, 80019);
    return;
  }

  const validCheck = await DB(
    `SELECT * FROM list_product_detail WHERE master_id = ? AND currency = ? AND is_main = ? AND first_purchase = ?;`,
    [id, currency, is_main, first_purchase]
  );

  if (!validCheck.state) {
    logger.error(`productDetailDelete Error 2 ${validCheck.error}`);
    respondDB(res, 80026, validCheck.error);
    return;
  }

  if (validCheck.row.length === 0) {
    logger.error(`productDetailDelete Error 3`);
    respondDB(res, 80019);
    return;
  }

  const result = await DB(
    `DELETE FROM list_product_detail WHERE master_id = ? AND currency = ? AND is_main = ? AND first_purchase = ?;`,
    [id, currency, is_main, first_purchase]
  );
  if (!result.state) {
    logger.error(`productDetailDelete Error 4 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const detailList = await getProductDetailList(id, product_type);
  respondAdminSuccess(req, res, detailList, "product_detail_delete");
};

//! 상품 전체 삭제
export const productAllDelete = async (req, res) => {
  logger.info(`productAllDelete`);

  const {
    params: { id },
    body: { product_type = "" },
  } = req;

  if (!product_type) {
    logger.error(`productAllDelete Error 1`);
    respondDB(res, 80019);
    return;
  }

  let langQuery = ``;
  const langCheck = await DB(
    `SELECT * FROM list_product_lang WHERE master_id = ?;`,
    [id]
  );
  if (!langCheck.state) {
    logger.error(`productAllDelete Error 2`);
    respondDB(res, 80019);
    return;
  }

  if (langCheck.row.length > 0) {
    langQuery = `DELETE FROM list_product_lang WHERE master_id = ?;`;
  }

  let detailQuery = ``;
  if (product_type === "daily") {
    detailQuery = `DELETE FROM list_product_daily WHERE master_id = ?;`;
  } else {
    detailQuery = `DELETE FROM list_product_detail WHERE master_id = ?;`;
  }

  const result = await transactionDB(
    `
  ${langQuery}
  ${detailQuery}
  DELETE FROM list_product_master WHERE product_master_id = ?; 
  `,
    [id, id, id]
  );

  if (!result.state) {
    logger.error(`productAllDelete Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "product_delete", productAllList);
};

//* 상품 끝

//* 클라이언트 호출 시작

//! 사용 중인 상품 리스트
export const getAllProductList = async (req, res) => {
  logger.info(`getAllProductList`);

  const {
    body: { lang = "KO" },
  } = req;

  const result = await DB(
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
  FROM list_product_master a
      , list_product_lang lang
  WHERE a.is_public = 1
    AND lang.master_id = a.product_master_id 
    AND lang.lang  = '${lang}'
    AND now() BETWEEN a.from_date AND a.to_date
  ORDER BY product_type, product_id;
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

    // * 상품의 product_type에 따른 디테일 정보를 배열에 푸시해주기
    promise.push(
      getProductDetailList(item.product_master_id, item.product_type)
    );
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

  res.status(200).json(responseData);
};

// ! 유저 상품 구매 내역 조회
export const getUserRawPurchaseList = async (req, res) => {
  logger.info(`getUserPurchaseList`);

  // 그냥 리스트가 필요하다.
  const result = await DB(queryUserPurchaseHistory, [req.body.userkey]);

  res.status(200).json(result.row);
};

//! 상품 구매 리스트
export const getUserPurchaseList = async (req, res, isResponse = true) => {
  logger.info(`getUserPurchaseList`);

  const responseData = {};
  responseData.userPurchaseHistory = {};

  const result = await DB(
    `
    SELECT up.purchase_no
  , up.product_id 
  , ifnull(fn_get_standard_name('product', up.product_id), '') product_name 
  , up.receipt
  , up.state
  , DATE_FORMAT(up.purchase_date, '%Y-%m-%d %T') purchase_date
  , lpm.product_master_id 
  FROM user_purchase up
     , list_product_master lpm 
  WHERE userkey = ?
    AND lpm.product_id = up.product_id 
    AND up.purchase_date BETWEEN lpm.from_date AND lpm.to_date 
  ORDER BY purchase_no DESC;
    `,
    [req.body.userkey]
  );

  if (isResponse) {
    res.status(200).json(result.row);
  } else {
    return result.row;
  }
};

//! 상품 구매 및 구매 확정 메일 보내기
export const userPurchase = async (req, res) => {
  let {
    body: {
      userkey = 0,
      product_id = "",
      receipt = "",
      price = 0, // 가격
      currency = "KRW", // 화폐
      paymentSeq = "", // 게임베이스 거래 식별자 1
      purchaseToken = "", // 게임베이스 거래 식별자 2
      os = 0,
    },
  } = req;

  logger.info(`userPurchase ${userkey}/${product_id}/${receipt}`);

  // * 사전예약 때문에 추가 처리
  if (os === 0 && product_id === null && receipt === null && paymentSeq) {
    product_id = "pre_reward_pack";
    receipt = "pre_reward_pack";

    logger.info(
      `### pre reward userPurchase ${userkey}/${product_id}/${receipt}`
    );
  }

  //* 유효성 체크
  if (!product_id || userkey === 0) {
    logger.error(`userPurchase Error`);
    respondDB(res, 80019, "Wrong parameters");
    return;
  }

  logAction(userkey, "purchase_call", { product_id, receipt, paymentSeq });

  //* 상품 구매 insert
  // 2022.06.07 product_master_id 컬럼 추가
  const result = await DB(
    `INSERT INTO user_purchase(userkey, product_id, receipt, price, product_currency, payment_seq, purchase_token, product_master_id) 
    VALUES(${userkey}, '${product_id}', '${receipt}', ${price}, '${currency}', '${paymentSeq}', '${purchaseToken}', fn_get_product_master_id('${product_id}', now()));`
  );

  if (!result.state) {
    logger.error(`userPurchase Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // * 2022.05.23 올패스 상품에 대한 예외처리
  // 올패스는 유저 메일로 구매 확정을 보내지 않음.
  if (product_id.includes(`allpass`)) {
    let addDay = 0;
    // 1,3,7일차에 대한 처리
    if (product_id === "allpass_1") addDay = 1;
    else if (product_id === "allpass_3") addDay = 3;
    else addDay = 7;

    // 유저 올패스 업데이트 처리, addDay 만큼 더해줘서 업데이트한다.
    // 올패스 기간이 종료되었으면 now() + 일자
    // 올패스 기간이 남았으면 allpass_expiration + 일자
    const allpassUpdate = await DB(`
    UPDATE table_account 
    SET allpass_expiration = CASE WHEN ifnull(allpass_expiration, now()) < now() THEN DATE_ADD(now(), INTERVAL ${addDay} DAY)
                                  ELSE DATE_ADD(ifnull(allpass_expiration, now()), INTERVAL ${addDay} DAY) END
    WHERE userkey = ${userkey};
    `);

    // 실패
    if (!allpassUpdate.state) {
      logger.error(`userPurchase Error #2-1 ${allpassUpdate.error}`);
      respondDB(res, 80026, allpassUpdate.error);
      return;
    }
  } else {
    //* 구매 확정 메일 보내기
    const sendResult = await DB(
      `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project, purchase_no) 
    VALUES(?, 'inapp_origin', '', 0, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1, ?);`,
      [userkey, result.row.insertId]
    );

    if (!sendResult.state) {
      logger.error(`userPurchase Error #2 ${sendResult.error}`);
      respondDB(res, 80026, sendResult.error);
      return;
    }
  }

  // * 응답정보 생성하기
  // * 안읽은 메일 count와 bankInfo 리턴, 올패스 정보 및 구매 히스토리
  const responseData = {};

  // 메일정보
  const unreadMailResult = await DB(
    `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
    [userkey]
  );

  responseData.unreadMailCount = 0;
  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    responseData.unreadMailCount = unreadMailResult.row[0].cnt;

  // 뱅크 정보
  responseData.bank = await getUserBankInfo(req.body);

  // 구매 히스토리
  responseData.userPurchaseHistory = await getUserPurchaseList(req, res, false);

  // 현재의 올패스 만료 시간
  const currentAllpassExpireInfo = await DB(`
  SELECT ifnull(ta.allpass_expiration, '2022-01-01') current_expiration 
  FROM table_account ta
 WHERE ta.userkey = ${userkey};
  `);

  // 만료시간이 설마 없진 않겠지
  if (!currentAllpassExpireInfo.state || currentAllpassExpireInfo.row === 0) {
    logger.error(`userPurchase Error #3 ${currentAllpassExpireInfo.error}`);
    respondDB(res, 80026, currentAllpassExpireInfo.error);
    return;
  }

  // 올패스 만료시간 tick 전달해주기
  const allpassExpireDate = new Date(
    currentAllpassExpireInfo.row[0].current_expiration
  );
  responseData.allpass_expire_tick = allpassExpireDate.getTime();
  responseData.product_id = product_id; // 구매한 제품 ID

  res.status(200).json(responseData);
  logAction(userkey, "purchase_complete", { product_id, receipt, paymentSeq });

  // 게임베이스 API 통신
  // 소비처리
  const gamebaseResult = await gamebaseAPI.consume(paymentSeq, purchaseToken);
  console.log(gamebaseResult);
}; // ? end of userPurchase

//! 구매 확정
export const userPurchaseConfirm = async (req, purchase_no, res, next) => {
  logger.info(`userPurchaseConfirm`);

  const {
    body: { mail_no = 0, userkey = 0 },
  } = req;

  const currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project, purchase_no, paid) 
  VALUES(?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1, ?, ?);`;

  //! 유효성 체크
  if (mail_no === 0 || purchase_no === 0 || userkey === 0) {
    logger.error(`userPurchaseConfirm Error 1`);
    respondDB(res, 80019);
    return;
  }

  const userGradeResult = await DB(`
  SELECT ta.grade
       , cg.store_sale
       , cg.store_limit
       , fn_get_user_star_benefit_count(ta.userkey, ta.grade) current_count
  FROM table_account ta
     , com_grade cg 
 WHERE userkey = ${userkey}
   AND cg.grade = ta.grade ;
  `);

  // 유저의 등급, 혜택 정보 가져온다.
  const { grade, store_sale, store_limit, current_count } =
    userGradeResult.row[0];

  const bonusStarPercentage = parseFloat(store_sale) * 0.01; // 보너스 스타 계산하기.
  let isBonusAVailable = false;
  if (store_limit > current_count)
    // 보너스 제한 카운트 체크
    isBonusAVailable = true;

  logger.info(
    `### userGrade : [${userkey}]/[${grade}]/[${bonusStarPercentage}]/[${isBonusAVailable}/[${current_count}]`
  );

  //! 상품 조회
  const product = await DB(
    `SELECT product_id, purchase_date FROM user_purchase a WHERE purchase_no = ?;`,
    [purchase_no]
  );
  if (!product.state) {
    logger.error(`userPurchaseConfirm Error 2 ${product.error}`);
    respondDB(res, 80026, product.error);
    return;
  }

  //! 등록된 재화 확인(사용중인 상품 내에서 확인)
  const productInfo = await DB(
    `
  SELECT currency
       , quantity 
       , CASE WHEN first_purchase = '1' THEN  fn_check_first_purchase_master_id(${userkey}, a.product_master_id)
         ELSE 0 END first_purchase_check
       , first_purchase
       , b.is_main is_main
   FROM list_product_master a 
        INNER JOIN list_product_detail b ON a.product_master_id = b.master_id
  WHERE product_id = ? AND ? BETWEEN DATE_FORMAT(from_date, '%Y-%m-%d 00:00:00') AND DATE_FORMAT(to_date, '%Y-%m-%d 23:59:59')
  UNION ALL 
  SELECT currency
       , quantity
       , 0 first_purchase_check
       , 0 first_purchase
       , 1 is_main
  FROM list_product_master a 
       INNER JOIN list_product_daily b ON a.product_master_id = b.master_id
  WHERE product_id = ? 
    AND ? BETWEEN DATE_FORMAT(from_date, '%Y-%m-%d 00:00:00') AND DATE_FORMAT(to_date, '%Y-%m-%d 23:59:59');`,
    [
      product.row[0].product_id,
      product.row[0].purchase_date,
      product.row[0].product_id,
      product.row[0].purchase_date,
    ]
  );
  if (!productInfo.state) {
    logger.error(`userPurchaseConfirm Error 3 ${productInfo.error}`);
    respondDB(res, 80026, productInfo.error);
    return;
  }

  if (productInfo.row.length === 0) {
    logger.error(`userPurchaseConfirm Error 4`);
    respondDB(res, 80049);
    return;
  }

  //* 메일 생성
  let insertQuery = ``;
  let index = 0;

  let totalGem = 0;

  productInfo.row.forEach((item) => {
    const queryParams = [];
    let firstCheck = true;
    let mailType = "inapp";

    //* 첫구매일 경우 메일 타입 변경
    if (item.first_purchase === "1") {
      mailType = "first_purchase";
    }

    //* 첫 구매 보너스 체크
    if (item.first_purchase_check > 0) {
      firstCheck = false;
    }

    if (firstCheck) {
      queryParams.push(userkey);
      queryParams.push(mailType);
      queryParams.push(item.currency);
      queryParams.push(item.quantity);
      queryParams.push(purchase_no);
      queryParams.push(item.is_main); // 유료 재화 여부 추가

      // 스타를 몇개 주는지 합산해놓는다.
      if (item.currency === "gem") {
        totalGem += item.quantity;
      }

      insertQuery += mysql.format(currentQuery, queryParams);
    }

    if (index === 0) console.log(insertQuery);
    index += 1;
  });

  // 등급 보너스에 대한 처리 추가
  if (isBonusAVailable && totalGem > 0) {
    let bonusGem = totalGem * bonusStarPercentage;

    // 0보다 작은 수라면 1로 처리
    if (bonusGem < 1) bonusGem = 1;
    bonusGem = Math.round(bonusGem);

    // 보너스 스타 존재시에 쿼리에 추가해놓는다.
    if (bonusGem > 0) {
      insertQuery += mysql.format(currentQuery, [
        userkey,
        "grade_bonus",
        "gem",
        bonusGem,
        purchase_no,
        0,
      ]);

      // user_grade_benefit 입력한다.
      insertQuery += mysql.format(
        `
      INSERT INTO user_grade_benefit (userkey, grade, purchase_date, bonus_star) VALUES (?, ?, now(), ?);
      `,
        [userkey, grade, bonusGem]
      );
    }
  } // ? 등급 보너스 처리 끝.

  //! 메일 수신, 구매확정, 메일 발송
  const result = await transactionDB(
    `
  UPDATE user_mail SET is_receive = 1, receive_date = now() WHERE mail_no = ?;
  UPDATE user_purchase SET state = 1 WHERE purchase_no = ?; 
  ${insertQuery}
  `,
    [mail_no, purchase_no]
  );

  if (!result.state) {
    logger.error(`userPurchaseConfirm Error 5 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  if (next != null) {
    next(req, res);
  }
};
//* 클라이언트 호출 끝

// * 프리미엄 패스 타임딜.
export const updatePassTimeDeal = async (req, res) => {
  const {
    body: { userkey, project_id, timedeal_id, deadline, discount },
  } = req;

  const responseData = { hasNew: 0 };

  // * 동일 타임딜 있는지 확인한다.
  const existsCheck = await DB(`
  SELECT z.*
  FROM user_pass_timedeal z
 WHERE z.userkey = ${userkey}
   AND z.project_id = ${project_id}
   AND z.timedeal_id = ${timedeal_id};
  `);

  // 없으면 insert
  if (existsCheck.row.length === 0) {
    // 없으면 insert 해준다.
    const insertResult = await DB(`
    INSERT INTO user_pass_timedeal (userkey, project_id, timedeal_id, end_date, discount)
    VALUES (${userkey}, ${project_id}, ${timedeal_id}, DATE_ADD(now(), INTERVAL ${deadline} MINUTE), ${discount});
    `);

    if (!insertResult.state) {
      logger.error(
        `updatePassTimeDeal : ${JSON.stringify(insertResult.error)}`
      );
    }

    responseData.hasNew = 1; // 새로운거 있음
  } // insert 종료

  // 타임딜 갱신
  const selectResult = await DB(`
  SELECT a.project_id
  , a.timedeal_id 
  , date_format(a.end_date, '%Y-%m-%d %T') end_date
  , a.discount 
  FROM user_pass_timedeal a
  WHERE a.userkey = ${userkey}
  AND now() < end_date 
  AND a.end_date = (SELECT max(z.end_date) FROM user_pass_timedeal z WHERE z.userkey = a.userkey AND z.project_id = a.project_id);
  `);

  selectResult.row.forEach((item) => {
    const endDate = new Date(item.end_date);
    item.end_date_tick = endDate.getTime(); // tick 넣어주기!
  });

  responseData.timedeal = selectResult.row;

  res.status(200).json(responseData);
};
