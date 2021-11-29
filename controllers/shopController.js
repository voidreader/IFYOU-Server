import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { 
  respondDB,
  adminLogInsert,
  respondAdminSuccess, 
} from "../respondent";
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

  const bannerQuery = `(SELECT banner_id FROM list_product_lang WHERE master_id = a.product_master_id AND lang = 'KO')`;
  const detailImageQuery = `(SELECT detail_image_id FROM list_product_lang WHERE master_id = a.product_master_id AND lang = 'KO')`;

  const result = await DB(
    `SELECT product_master_id
    , fn_get_design_info(${bannerQuery}, 'url') product_url
    , fn_get_design_info(${bannerQuery}, 'key') product_key
    , fn_get_design_info(${detailImageQuery}, 'url') product_detail_url
    , fn_get_design_info(${detailImageQuery}, 'key') product_detail_key 
    , product_id
    , fn_get_standard_name('product', product_id) product_name
    , ifnull(bonus_name, '') bonus_name
    , product_type
    , fn_get_standard_name('product_type', product_type) product_type_name 
    , DATE_FORMAT(from_date, '%Y-%m-%d %T') from_date
    , DATE_FORMAT(to_date, '%Y-%m-%d %T') to_date
    , max_count
    FROM list_product_master a WHERE is_public = 1 AND sysdate() BETWEEN from_date AND to_date;`,
    []
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
    `SELECT purchase_no
  , product_id 
  , ifnull(fn_get_standard_name('product', product_id), '') product_name 
  , receipt
  , state
  , DATE_FORMAT(purchase_date, '%Y-%m-%d %T') purchase_date
  FROM user_purchase
  WHERE userkey = ?
  ORDER BY purchase_no DESC;`,
    [req.body.userkey]
  );

  /*
  result.row.forEach((item) => {
    if (
      !Object.hasOwnProperty.call(
        responseData.userPurchaseHistory,
        item.purchase_no.toString()
      )
    ) {
      responseData.userPurchaseHistory[item.purchase_no.toString()] = [];
    }

    responseData.userPurchaseHistory[item.purchase_no.toString()].push({
      product_id: item.product_id,
      product_name: item.product_name,
      receipt: item.receipt,
      state: item.state,
      purchase_date: item.purchase_date,
    });
  });
  */

  if (isResponse) {
    res.status(200).json(result.row);
  } else {
    return result.row;
  }
};

//! 상품 구매 및 구매 확정 메일 보내기
export const userPurchase = async (req, res) => {
  const {
    body: {
      userkey = 0,
      product_id = "",
      receipt = "",
      price = 0, // 가격
      currency = "KRW", // 화폐
      paymentSeq = "", // 게임베이스 거래 식별자 1
      purchaseToken = "", // 게임베이스 거래 식별자 2
    },
  } = req;

  logger.info(`userPurchase ${userkey}/${product_id}/${receipt}`);

  //* 유효성 체크
  if (!product_id || userkey === 0) {
    logger.error(`userPurchase Error`);
    respondDB(res, 80019, "Wrong parameters");
    return;
  }

  logAction(userkey, "purchase_call", { product_id, receipt, paymentSeq });

  //* 상품 구매 insert
  const result = await DB(
    `INSERT INTO user_purchase(userkey, product_id, receipt, price, product_currency, payment_seq, purchase_token) 
    VALUES(?, ?, ?, ?, ?, ?, ?);`,
    [userkey, product_id, receipt, price, currency, paymentSeq, purchaseToken]
  );

  if (!result.state) {
    logger.error(`userPurchase Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

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

  //* 안읽은 메일 count와 bankInfo 리턴
  const responseData = {};
  const unreadMailResult = await DB(
    `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
    [userkey]
  );

  responseData.unreadMailCount = 0;
  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    responseData.unreadMailCount = unreadMailResult.row[0].cnt;

  responseData.bank = await getUserBankInfo(req.body);

  responseData.userPurchaseHistory = await getUserPurchaseList(req, res, false);

  res.status(200).json(responseData);
  logAction(userkey, "purchase_complete", { product_id, receipt, paymentSeq });

  // 게임베이스 API 통신
  // 소비처리
  const gamebaseResult = await gamebaseAPI.consume(paymentSeq, purchaseToken);
  console.log(gamebaseResult);
};

//! 구매 확정
export const userPurchaseConfirm = async (req, purchase_no, res, next) => {
  logger.info(`userPurchaseConfirm`);

  const {
    body: { mail_no = 0, userkey = 0 },
  } = req;

  //! 유효성 체크
  if (mail_no === 0 || purchase_no === 0 || userkey === 0) {
    logger.error(`userPurchaseConfirm Error 1`);
    respondDB(res, 80019);
    return;
  }

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
  SELECT currency, quantity 
  , CASE WHEN first_purchase = '1' THEN 
  fn_check_first_purchase(?, a.product_id, ?, a.from_date, a.to_date)
  ELSE 0
  END first_purchase_check
  , first_purchase
  FROM list_product_master a 
  INNER JOIN list_product_detail b
  ON a.product_master_id = b.master_id
  WHERE product_id = ? AND ? BETWEEN DATE_FORMAT(from_date, '%Y-%m-%d 00:00:00') AND DATE_FORMAT(to_date, '%Y-%m-%d 23:59:59')
  UNION ALL 
  SELECT currency, quantity, 0 first_purchase_check, 0 first_purchase
  FROM list_product_master a 
  INNER JOIN list_product_daily b
  ON a.product_master_id = b.master_id
  WHERE product_id = ? AND ? BETWEEN DATE_FORMAT(from_date, '%Y-%m-%d 00:00:00') AND DATE_FORMAT(to_date, '%Y-%m-%d 23:59:59')
  ;`,
    [
      userkey,
      purchase_no,
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
      const currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project, purchase_no) 
      VALUES(?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1, ?);`;

      queryParams.push(userkey);
      queryParams.push(mailType);
      queryParams.push(item.currency);
      queryParams.push(item.quantity);
      queryParams.push(purchase_no);

      insertQuery += mysql.format(currentQuery, queryParams);
    }

    if (index === 0) console.log(insertQuery);
    index += 1;
  });

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

// * 프리패스
// 프로젝트의 프리패스 상품 리스트 (project_id, userkey)
export const getProjectFreepassProduct = async (project_id, userkey) => {
  // * 한번 타임딜이 등장했던건 리스트에서 빼주기 위해서 NOT IN 조건 추가
  const result = await DB(`
    SELECT a.freepass_no
    , a.appear_point
    , a.discount
    , a.timedeal_min
  FROM com_freepass a 
  WHERE a.project_id = ${project_id}
  AND now() BETWEEN start_date AND end_date
  AND a.freepass_no NOT IN (SELECT z.target_id FROM user_timedeal_limit z WHERE z.userkey = ${userkey} AND z.timedeal_type = 'freepass')
  ORDER BY a.appear_point;
  `);

  return result.row;
};
