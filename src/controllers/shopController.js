import mysql from "mysql2/promise";
import { response } from "express";
import { timeout } from "async";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { gamebaseAPI, inappAPI } from "../com/gamebaseAPI";
import { getUserBankInfo } from "./bankController";
import { cache } from "../init";

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

///////////////////////////함수 처리 끝///////////////////////////////////////////

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

//! 사용 중인 상품 리스트
export const getAllProductList = async (req, res) => {
  logger.info(`getAllProductList`);

  const {
    body: { lang = "KO" },
  } = req;

  // * 캐시데이터 조회로 변경
  res.status(200).json(cache.get("product")[lang]);
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
  logger.info(`userPurchaseConfirm ${JSON.stringify(req.body)}/${purchase_no}`);

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
    logger.info(`productInfo : ${JSON.stringify(item)}`);

    const queryParams = [];
    let firstCheck = true;
    let mailType = "inapp";

    //* 첫구매일 경우 메일 타입 변경
    if (item.first_purchase === 1) {
      mailType = "first_purchase";
    }

    //* 첫 구매 보너스 체크
    if (item.first_purchase_check !== 0) {
      // 이미 첫 구매 보너스 지급됨
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

// 올패스 만료시간 (tick) 구하가ㅣ
export const getUserAllpassExpireTick = async (userkey) => {
  const currentAllpassExpireInfo = await DB(`
  SELECT ifnull(ta.allpass_expiration, '2022-01-01') current_expiration 
  FROM table_account ta
 WHERE ta.userkey = ${userkey};
  `);

  // 올패스 만료시간 tick으로 변경
  const allpassExpireDate = new Date(
    currentAllpassExpireInfo.row[0].current_expiration
  );

  return allpassExpireDate.getTime();
};

// * 인앱 상품 구매 및 확정 처리 2022.06.20
export const purchaseInappProduct = async (req, res) => {
  // 기존에 메일함 수령방식을 구매 후 즉시 지급으로 변경한다.
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

  // * 사전예약 때문에 추가 처리
  if (os === 0 && product_id === null && receipt === null && paymentSeq) {
    product_id = "pre_reward_pack";
    receipt = "pre_reward_pack";

    logger.info(
      `### pre reward userPurchase ${userkey}/${product_id}/${receipt}`
    );
  }

  logger.info(`purchaseInappProduct ${userkey}/${product_id}/${receipt}`);
  //* 유효성 체크
  if (!product_id || userkey === 0) {
    logger.error(`userPurchase Error [${product_id}]/[${userkey}]`);
    respondDB(res, 80019, "Wrong parameters");
    return;
  }

  // 구매 시작전에 로그 만들기
  logAction(userkey, "purchase_call", { product_id, receipt, paymentSeq });

  // 상품 구매 INSERT . state 1로 입력한다.
  let query = ``; // 처리 쿼리 만들기
  query += `INSERT INTO user_purchase(userkey, product_id, receipt, price, product_currency, payment_seq, purchase_token, state, product_master_id) 
            VALUES(${userkey}, '${product_id}', '${receipt}', ${price}, '${currency}', '${paymentSeq}', '${purchaseToken}', 1, fn_get_product_master_id('${product_id}', now()));`;

  // 올패스 상품 처리(올패스는 재화를 지급하지 않는다)
  if (product_id.includes(`allpass`)) {
    let addDay = 0;
    // 1,3,7일차에 대한 처리
    if (product_id === "allpass_1") addDay = 1;
    else if (product_id === "allpass_3") addDay = 3;
    else addDay = 7;

    // 유저 올패스 업데이트 처리, addDay 만큼 더해줘서 업데이트한다.
    // 올패스 기간이 종료되었으면 now() + 일자
    // 올패스 기간이 남았으면 allpass_expiration + 일자
    query += `UPDATE table_account 
    SET allpass_expiration = CASE WHEN ifnull(allpass_expiration, now()) < now() THEN DATE_ADD(now(), INTERVAL ${addDay} DAY)
                                  ELSE DATE_ADD(ifnull(allpass_expiration, now()), INTERVAL ${addDay} DAY) END
    WHERE userkey = ${userkey};`;
  } // 올패스 상품 처리 종료

  // ? 구매한 상품 유저에게 지급처리(임지은 헬프헬프미)
  // query에 + 해서 상품 직접 지급까지 진행해주세요!
  // 임지은 자리
  // 임지은 자리
  // 임지은 자리
  // 임지은 자리

  // query 만들고 실행한다.
  const purchaseResult = await DB(query);
  if (!purchaseResult.state) {
    logger.error(
      `purchaseInappProduct : [${JSON.stringify(purchaseResult.error)}]`
    );
    respondDB(res, 80026, purchaseResult.error);
    return;
  }
  ///////////////////////////////////////////////////////////

  // * 응답값 만들기
  const responseData = {};
  responseData.bank = await getUserBankInfo(req.body); // 뱅크
  responseData.userPurchaseHistory = await getUserPurchaseList(req, res, false); // 구매 히스토리
  responseData.allpass_expire_tick = await getUserAllpassExpireTick(userkey); // 올패스 만료시간
  responseData.product_id = product_id; // 구매한 제품 ID

  res.status(200).json(responseData); // 클라이언트에게 응답처리

  // * 다 처리하고 마지막에 호출!!!
  // 게임베이스 API 통신
  // 구매 상품 소비 처리 (마켓에 전달 )
  logAction(userkey, "purchase_complete", { product_id, receipt, paymentSeq });
  const gamebaseResult = await gamebaseAPI.consume(paymentSeq, purchaseToken);
  console.log(gamebaseResult);
}; // ? purchaseInappProduct END
