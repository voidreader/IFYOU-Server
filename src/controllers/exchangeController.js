import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { Q_SELECT_COIN_EXCHANGE } from "../QStore";
import { getUserBankInfo, getCurrencyQuantity } from "./bankController";

//! 판매 중인 코인 환전상품 리스트
export const getCoinExchangeProductList = async (req, res) => {
  const result = await DB(Q_SELECT_COIN_EXCHANGE, [req.body.userkey]);

  res.status(200).json(result.row);
};

//! 환전
export const coinExchangePurchase = async (req, res) => {
  const {
    body: { userkey, exchange_product_id = 0, lang = "KO" },
  } = req;

  if (exchange_product_id === 0) {
    logger.error(`coinExchangePurchase error 1`);
    respondDB(res, 80019, "", lang);
    return;
  }

  let coin = 0;
  let currentQuery = ``;
  let exchangeQuery = ``;
  let result = await slaveDB(
    `SELECT
    star_quantity
    , coin_quantity
    , bonus_quantity
    , CASE WHEN daily_purchase_cnt < 0 THEN 1
    ELSE 
        CASE WHEN daily_purchase_cnt <= fn_get_user_coin_exchange(?, exchange_product_id) THEN 0 ELSE 1 END 
    END exchange_check
    FROM com_coin_exchange_product
    WHERE exchange_product_id = ?;
    `,
    [userkey, exchange_product_id]
  );

  // * 실패시..
  if (!result.state || result.row.length === 0) {
    logger.error(`coinExchangePurchase error 2`);
    respondDB(res, 80097, "", lang);
    return;
  }

  const { star_quantity, coin_quantity, bonus_quantity, exchange_check } =
    result.row[0];

  // coin = coin_quantity + bonus_quantity;

  // eslint-disable-next-line no-lonely-if
  if (exchange_check === 0) {
    // 교환 여부
    logger.error(`coinExchangePurchase error 3`);
    respondDB(res, 80025, "", lang);
    return;
  }

  // * 재화 부족
  const userStar = await getCurrencyQuantity(userkey, "gem"); // 유저 보유 스타수
  if (userStar < star_quantity) {
    logger.error(`coinExchangePurchase error 4`);
    respondDB(res, 80102, "", lang);
    return;
  }

  // ! 스타, 코인의 유&무료를 따로 관리하기 위해 환전시 소모된 유료 스타의 비율을 확인할 필요가 있다.
  // * 소모처리를 먼저 진행한다.
  const consumeResult = await DB(
    `CALL pier.sp_use_user_property(${userkey}, 'gem', ?, 'coin_exchange', -1);`,
    [star_quantity]
  );

  if (!consumeResult.state) {
    logger.error(
      `coinExchangePurchase consume error : ${JSON.stringify(
        consumeResult.state.error
      )}`
    );
    respondDB(res, 80102, "", lang);
    return;
  }

  console.log(consumeResult.row[0][0]); // paid_sum, free_sum 가져온다.
  const { paid_sum, free_sum } = consumeResult.row[0][0];
  const ratePaidStar = Math.floor((paid_sum / star_quantity) * 100); // 내림 처리.

  // 소모되는 스타중에서 유료 스타의 비율을 구한다.
  console.log(`rate of paid star : [${ratePaidStar}]%`);

  // 비율에 따라서 유료, 무료 코인을 나눈다.
  // coin_quantity 로 구한다. bonus_quantity는 무료 코인이다.
  let paidCoin = Math.floor((coin_quantity * ratePaidStar) / 100);
  let freeCoin = bonus_quantity + (coin_quantity - paidCoin); // 프리코인 : 보너스코인 + 메인코인 - 유료 코인.

  if (paid_sum === 0 && free_sum === 0) {
    console.log(`it's free exchange`);
    paidCoin = 0;
    freeCoin = bonus_quantity + coin_quantity;
  }

  coin = paidCoin + freeCoin;

  console.log(`paid coin : [${paidCoin}], free coin : [${freeCoin}]`);

  // paid Coin
  if (paidCoin > 0) {
    // 코인 획득 처리
    exchangeQuery += mysql.format(
      `CALL sp_insert_user_property_paid(${userkey}, 'coin', ${paidCoin}, 'coin_exchange', 1);`
    ); // 유료
  }

  // free Coin
  if (freeCoin > 0) {
    exchangeQuery += mysql.format(
      `CALL sp_insert_user_property_paid(${userkey}, 'coin', ${freeCoin}, 'coin_exchange', 0);`
    ); // 무료
  }

  if (exchangeQuery) {
    //환전 내역 추가
    currentQuery = `
          INSERT INTO user_coin_exchange(userkey, star_quantity, coin_quantity, bonus_quantity, exchange_product_id) 
          VALUES(?, ?, ?, ?, ?);`;
    exchangeQuery += mysql.format(currentQuery, [
      userkey,
      star_quantity,
      coin_quantity,
      bonus_quantity,
      exchange_product_id,
    ]);

    result = await transactionDB(exchangeQuery);

    if (!result.state) {
      logger.error(`coinExchangePurchase error 5 ${result.error}`);
      respondDB(res, 80026, result.error, lang);

      // ! 선 소모 처리하기때문에 여기서 오류 났으면 소모된 스타 복구시켜야한다.
      // 복구 해준다... ㅠ
      exchangeQuery = ``;

      if (paid_sum > 0) {
        exchangeQuery += mysql.format(
          `CALL sp_insert_user_property_paid(${userkey}, 'gem', ${paid_sum}, 'recover', 1);`
        );
      }

      if (free_sum > 0) {
        exchangeQuery += mysql.format(
          `CALL sp_insert_user_property_paid(${userkey}, 'gem', ${free_sum}, 'recover', 0);`
        );
      }

      await DB(exchangeQuery);
      return;
    }
  } // ? 코인 입력 및 환전 처리 완료

  const responseData = {};
  responseData.gotCoin = coin;
  responseData.bank = await getUserBankInfo(req.body);

  const coinExchangeProduct = await DB(`
  SELECT 
  a.exchange_product_id
  , a.star_quantity
  , a.coin_quantity
  , a.bonus_quantity
  , CASE WHEN a.daily_purchase_cnt < 0 THEN 1
  ELSE 
      CASE WHEN a.daily_purchase_cnt <= fn_get_user_coin_exchange(${userkey}, a.exchange_product_id) THEN 0 ELSE 1 END 
  END exchange_check
  FROM com_coin_exchange_product a
  WHERE is_service > 0 ;`);

  responseData.coinExchangeProduct = coinExchangeProduct.row;

  res.status(200).json(responseData);

  logAction(userkey, "coin_exchange", {
    userkey,
    exchange_product_id,
  });
};
