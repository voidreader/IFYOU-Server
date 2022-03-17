import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB, responDBCoinShop } from "../respondent";
import { getUserBankInfo } from "./bankController";
import { getCurrencyQuantity } from "./accountController";
import { getEqualConditionQuery, getInConditionQuery } from "../com/com";

const getColumn = (kind, lang) => {
  let result = `   
    , ifnull(fn_get_currency_info(currency, 'type'), 'set') currency_type  
    , fn_get_localize_text(ifnull(fn_get_standard_text_id('currency_type', fn_get_currency_info(currency, 'type')), 5123), '${lang}') currency_type_name
    , CASE WHEN fn_get_currency_info(currency, 'type') = 'portrait' COLLATE utf8mb4_0900_ai_ci THEN 1 
    WHEN fn_get_currency_info(currency, 'type') = 'frame' COLLATE utf8mb4_0900_ai_ci THEN 2 
    WHEN fn_get_currency_info(currency, 'type') = 'wallpaper' COLLATE utf8mb4_0900_ai_ci THEN 3 
    WHEN fn_get_currency_info(currency, 'type') = 'badge' COLLATE utf8mb4_0900_ai_ci THEN 4 
    WHEN fn_get_currency_info(currency, 'type') = 'standing' COLLATE utf8mb4_0900_ai_ci THEN 5 
    WHEN fn_get_currency_info(currency, 'type') = 'bubble' COLLATE utf8mb4_0900_ai_ci THEN 6 
    WHEN fn_get_currency_info(currency, 'type') = 'sticker' COLLATE utf8mb4_0900_ai_ci THEN 7 
    ELSE 0 END sortkey`;

  if (kind) {
    result = `
        , ifnull(fn_get_currency_info(a.currency, 'type'), '') currency_type
        , fn_get_localize_text(ifnull(fn_get_standard_text_id('currency_type', fn_get_currency_info(a.currency, 'type')), ''), '${lang}') currency_type_name
        , CASE WHEN fn_get_currency_info(a.currency, 'type') = 'portrait' COLLATE utf8mb4_0900_ai_ci THEN 1
        WHEN fn_get_currency_info(a.currency, 'type') = 'frame' COLLATE utf8mb4_0900_ai_ci THEN 2
        WHEN fn_get_currency_info(a.currency, 'type') = 'wallpaper' COLLATE utf8mb4_0900_ai_ci THEN 3
        WHEN fn_get_currency_info(a.currency, 'type') = 'badge' COLLATE utf8mb4_0900_ai_ci THEN 4
        WHEN fn_get_currency_info(a.currency, 'type') = 'standing' COLLATE utf8mb4_0900_ai_ci THEN 5
        WHEN fn_get_currency_info(a.currency, 'type') = 'bubble' COLLATE utf8mb4_0900_ai_ci THEN 6
        WHEN fn_get_currency_info(a.currency, 'type') = 'sticker' COLLATE utf8mb4_0900_ai_ci THEN 7
        ELSE 8 END sortkey`;
  }

  return result;
};

//! 세트 상품인 경우, 재화별 정보 가져오기
const getCoinCurrencyInfo = async (userkey, lang, coin_product_id) => {
  const responseData = {};

  const column = getColumn(1, lang);
  let price = 0;
  const result = await DB(
    `
    SELECT 
    a.currency 
    , fn_get_localize_text(local_code, ?) currency_name
    , CAST(fn_get_currency_info(a.currency, 'unique') AS signed integer) is_unique
    , fn_get_user_property(?, a.currency) quantity
    , fn_get_coin_product_price(a.currency, 'price') price
    ${column}
    FROM com_coin_product_set a, com_currency b 
    WHERE a.currency = b.currency  
    AND coin_product_id = ?
    ORDER BY sortkey;
    `,
    [lang, userkey, coin_product_id]
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const item of result.row) {
    if (item.is_unique > 0 && item.quantity > 0) price += item.price; //소유하고 있으면 그 금액만큼 더함
  }
  responseData.list = result.row;
  responseData.price = price; //합산 금액

  return responseData;
};

//! 리스트 출력
const getCoinProductList = async (userkey, lang, result) => {
  let payPrice = 0;
  let set = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const item of result) {
    payPrice = item.price; //원 가격
    if (item.sale_check === 1) payPrice = item.sale_price; //할인 가격이 있으면 할인 가격으로 변경
    if (item.currency_type === "set") {
      //세트상품인경우
      // eslint-disable-next-line no-await-in-loop
      set = await getCoinCurrencyInfo(userkey, lang, item.coin_product_id); //해당 세트상품의 코인 재화 가져오기

      // eslint-disable-next-line no-restricted-syntax
      for (const key of Object.keys(set)) {
        if (key === "price") {
          payPrice -= set[key]; //소유한 재화 금액만큼 빼기
        }
      }
      delete set.price; //price 키 삭제
      item.set = set;
    }

    item.pay_price = payPrice < 0 ? 0 : payPrice; //결제금액
  }

  return result;
};

//재화에 대한 능력치 리스트 가져오기
const getAbilityList = async (row, speaker) => {

  let whereQuery = ``;
  if(speaker){
    whereQuery = ` AND speaker = ? `;
  }

  // eslint-disable-next-line no-restricted-syntax
  for(const item of row){
    item.ability = ``;
    // eslint-disable-next-line no-await-in-loop
    const result = await DB(`
    SELECT fn_get_design_info(icon_design_id, 'url') icon_image_url 
    , fn_get_design_info(icon_design_id, 'key') icon_image_key  
    , add_value
    FROM com_currency_ability a, com_ability b 
    WHERE a.ability_id = b.ability_id
    ${whereQuery}
    AND currency = ?; 
    `, [item.currency]);
    if(result.state && result.row.length > 0){
      item.ability = result.row; 
    }
  }

  return row; 
};

const coinProductListQuery = `
SELECT coin_product_id  
, a.currency
, price origin_price
, CASE WHEN NOW() <= end_date AND sale_price > 0 THEN 
  sale_price
ELSE 
  price
END pay_price 
, CASE WHEN a.currency <> '' THEN fn_get_user_property(?, a.currency) ELSE 0 END quantity
, CASE WHEN a.currency <> '' THEN b.is_unique ELSE 0 END is_unique     
, fn_get_design_info(thumbnail_id, 'url') thumbnail_url
, fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
, CASE WHEN currency_type = 'wallpaper' THEN 
  fn_get_bg_info(resource_image_id, 'url')
ELSE 
  fn_get_design_info(resource_image_id, 'url')
END resource_image_url 
, CASE WHEN currency_type = 'wallpaper' THEN 
  fn_get_bg_info(resource_image_id, 'key')
ELSE 
  fn_get_design_info(resource_image_id, 'key')
END resource_image_key
FROM com_coin_product a, com_currency b
WHERE a.currency = b.currency
AND connected_project = ?
AND currency_type = ? 
AND coin_product_id > 0
AND is_public > 0
AND now() <= end_date
`;

const speakerCoinProudctQuery = `

`;

/*
  //코인샵 배너 
  let result = await DB(`
  SELECT 
  fn_get_design_info(coin_banner_id, 'url') coin_banner_url
  ,fn_get_design_info(coin_banner_id, 'key') coin_banner_key
  FROM list_project_detail 
  WHERE project_id = ? 
  AND lang = ?; 
  `, [project_id, lang]);
  responseData.coin_banner = result.row;

*/

//! 메인 상품 목록
export const getCoinProductMainList = async (req, res) => {
  logger.info(`getCoinProductMainList`);

  const {
    body: { userkey, lang = "KO", project_id = -1, },
  } = req;

  const responseData = {};

  //스탠딩
  let result = await DB(
  `${coinProductListQuery} 
  ORDER BY price DESC
  LIMIT 5;`, [userkey, project_id, 'standing']);
  responseData.standing = await getAbilityList(result.row);

  //배경
  result = await DB(
  `${coinProductListQuery} 
  ORDER BY price DESC
  LIMIT 5;`, [userkey, project_id, 'wallpaper']);
  responseData.wallpaper = await getAbilityList(result.row);

  //스티커
  result = await DB(
  `${coinProductListQuery} 
  ORDER BY price DESC
  LIMIT 5;`, [userkey, project_id, 'sticker']);
  responseData.sticker = await getAbilityList(result.row);

  //대사
  result = await DB(
  `${coinProductListQuery} 
  ORDER BY price DESC
  LIMIT 5;`, [userkey, project_id, 'bubble']);
  responseData.script = await getAbilityList(result.row);
  

  res.status(200).json(responseData);
};

//! 검색 목록
export const getCoinProductSearch = async (req, res) => {
  logger.info(`getCoinProductSearch`);

  const {
    body: { userkey },
  } = req;

  const result = await DB(
    `
    SELECT search_word
    FROM user_coin_search
    WHERE userkey = ? 
    ORDER BY action_date DESC
    LIMIT 10;
    `,
    [userkey]
  );

  res.status(200).json(result.row);
};

//! 검색 상세
export const getCoinProductSearchDetail = async (req, res) => {
  logger.info(`getCoinProductSearchDetail`);

  const {
    body: { userkey, lang = "KO", search_word = "", project_id = -1, },
  } = req;

  const responseData = {};

  //* 검색어 누적 > 검색어가 다를 경우에만 누적
  let result = await DB(
    `SELECT * FROM user_coin_search WHERE userkey = ? AND search_word = ?;`,
    [userkey, search_word]
  );
  if (result.row.length === 0) {
    result = await DB(
      `INSERT INTO user_coin_search(userkey, search_word) VALUES(?, ?);`,
      [userkey, search_word]
    );
  } else {
    result = await DB(
      `UPDATE user_coin_search SET action_date = now() WHERE userkey = ? AND search_word = ?;`,
      [userkey, search_word]
    );
  }

  //* 검색어 조건절 걸기 
  let whereQuery = ``;
  if(search_word){

    let currencys = ``; 
    let coinProductIds = ``;

    // 캐릭터명으로 ability_id 찾기 
    result = await DB(`
    SELECT 
    DISTINCT currency 
    FROM com_currency_ability a, com_ability b, list_nametag c 
    WHERE a.ability_id = b.ability_id
    AND b.speaker = c.speaker
    AND ${lang} LIKE CONCAT('%', ?, '%')
    AND c.project_id = ?;
    `, [search_word, project_id]);
    if (result.state){
      // eslint-disable-next-line no-restricted-syntax
      for (const item of result.row) {
        currencys += `'${item.currency}',`;
      }
    }
    if(currencys) currencys = currencys.slice(0, -1);

    // 코인상품id 찾기 > 상품명
    result = await DB(
      `SELECT DISTINCT coin_product_id FROM com_coin_product_detail WHERE name LIKE CONCAT('%', ?, '%') AND lang = ?;`,
      [search_word, lang]
    );
    if (result.state) {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of result.row) {
        coinProductIds += `${item.coin_product_id},`;
      }
    }
    if (coinProductIds) coinProductIds = coinProductIds.slice(0, -1);    

    if(currencys && coinProductIds){
      whereQuery  = ` AND ( a.currency IN (${currencys}) OR coin_product_id IN ( ${coinProductIds} ) ) `; 
    }else if(currencys && !coinProductIds){
      whereQuery  = ` AND a.currency IN (${currencys}) `; 
    }else if (!currencys && coinProductIds){
      whereQuery  = ` AND coin_product_id IN ( ${coinProductIds} ) `; 
    }
  }

  //스탠딩
  result = await DB(`${coinProductListQuery} ${whereQuery} ORDER BY pirce DESC;`, [userkey, project_id, 'standing']);
  responseData.standing = await getAbilityList(result.row);

  //배경
  result = await DB(`${coinProductListQuery} ${whereQuery} ORDER BY pirce DESC;`, [userkey, project_id, 'wallpaper']);
  responseData.wallpaper = await getAbilityList(result.row);

  //스티커
  result = await DB(`${coinProductListQuery} ${whereQuery} ORDER BY pirce DESC;`, [userkey, project_id, 'sticker']);
  responseData.sticker = await getAbilityList(result.row);

  //대사
  result = await DB(`${coinProductListQuery} ${whereQuery} ORDER BY pirce DESC;`, [userkey, project_id, 'bubble']);
  responseData.script = await getAbilityList(result.row);
  
  res.status(200).json(responseData);
  
};

//! 검색어 삭제
export const coinProductSearchDelete = async (req, res) => {
  logger.info(`coinProductSearchDelete`);

  const {
    body: { userkey, kind = "", search_word = "", lang = "KO", },
  } = req;

  let result = ``;
  if (kind === "all") {
    //전체 삭제
    result = await DB(`DELETE FROM user_coin_search WHERE userkey = ?;`, [
      userkey,
    ]);
    if (!result.state) {
      logger.error(`coinProductSearchDelete Error 1 ${result.error}`);
      responDBCoinShop(res, 80026, lang, result.error);
      return;
    }
  } else {
    result = await DB(
      `SELECT * FROM user_coin_search WHERE userkey = ? AND search_word = ?;`,
      [userkey, search_word]
    );
    if (!result.state || result.row.length === 0) {
      logger.error(`coinProductSearchDelete Error 2`);
      responDBCoinShop(res, 80019, lang);
      return;
    }

    result = await DB(
      `DELETE FROM user_coin_search WHERE userkey = ? AND search_word = ?;`,
      [userkey, search_word]
    );
    if (!result.state) {
      logger.error(`coinProductSearchDelete Error 3 ${result.error}`);
      responDBCoinShop(res, 80026, lang, result.error);
      return;
    }
  }

  getCoinProductSearch(req, res);
};

//! 카테고리별 목록
export const getCoinProductTypeList = async (req, res) => {
  logger.info(`getCoinProductTypeList`);

  const {
    body: { userkey, lang = "KO", project_id = -1, currency_type = "", character = "", },
  } = req;

  let whereQuery = ``; 
  if(character){
    whereQuery = ` AND ${lang} = '${character}' `;
  }

  const responseData = {};

  const result = await DB(`
  SELECT coin_product_id
  , a.currency
  , price origin_price
  , CASE WHEN NOW() <= end_date AND sale_price > 0 THEN
    sale_price
  ELSE
    price
  END pay_price
  , CASE WHEN a.currency <> '' THEN fn_get_user_property(?, a.currency) ELSE 0 END quantity
  , CASE WHEN a.currency <> '' THEN c.is_unique ELSE 0 END is_unique
  , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
  , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
  , CASE WHEN c.currency_type = 'wallpaper' THEN
    fn_get_bg_info(c.resource_image_id, 'url')
  ELSE
    fn_get_design_info(c.resource_image_id, 'url')
  END resource_image_url
  , CASE WHEN c.currency_type = 'wallpaper' THEN
    fn_get_bg_info(c.resource_image_id, 'key')
  ELSE
    fn_get_design_info(c.resource_image_id, 'key')
  END resource_image_key
  , ifnull(${lang}, 'common') speaker 
  , d.ability_id
  , fn_get_design_info(d.icon_design_id, 'url') ability_icon_url
  , fn_get_design_info(d.icon_design_id, 'key') ability_icon_key
  FROM com_coin_product a
  LEFT OUTER JOIN com_currency_ability b ON a.currency = b.currency
  INNER JOIN com_currency c ON a.currency = c.currency
  INNER JOIN com_ability d ON b.ability_id = d.ability_id AND d.project_id = connected_project
  INNER JOIN list_nametag e ON d.speaker = e.speaker AND e.project_id = connected_project
  WHERE connected_project = ?
  AND currency_type = ?
  AND coin_product_id > 0
  AND is_public > 0
  AND now() <= end_date
  ${whereQuery};`, [userkey, project_id, currency_type]);
  if(result.state){

    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){


      // 화자 기준으로 구성
      if (!Object.prototype.hasOwnProperty.call(responseData, item.speaker)) {
        responseData[item.speaker] = [];
      }

      responseData[item.speaker].push(item);

    }

  }
  
  res.status(200).json(responseData);
};

//! 상품 상세
export const coinProductDetail = async (req, res) => {
  logger.info(`coinProductDetail`);

  const {
    body: { userkey, lang = "KO", coin_product_id },
  } = req;

  const result = await DB(
    `
    SELECT coin_product_id 
    , fn_get_coin_product_name(coin_product_id, ?) name  
    , price
    , sale_price
    , CASE WHEN sale_price > 0 THEN 
        CASE WHEN NOW() <= end_date THEN 1 ELSE 0 END
    ELSE 0 END sale_check     
    , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
    , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key
    , currency 
    , ifnull(fn_get_currency_info(currency, 'type'), 'set') currency_type 
    , fn_get_localize_text(ifnull(fn_get_standard_text_id('currency_type', fn_get_currency_info(currency, 'type')), 5123), '${lang}') currency_type_name
    , CASE WHEN currency <> '' THEN fn_get_user_property(?, currency) ELSE 0 END quantity
    , CASE WHEN currency <> '' THEN CAST(fn_get_currency_info(currency, 'unique') AS signed integer) ELSE 0 END is_unique
    , CASE WHEN currency <> '' THEN 
        fn_get_project_name_new((SELECT connected_project FROM com_currency WHERE currency = a.currency), ?) 
    ELSE '' END project_name
    FROM com_coin_product a
    WHERE coin_product_id = ?;
    `,
    [lang, userkey, lang, coin_product_id]
  );
  const list = await getCoinProductList(userkey, lang, result.row);

  res.status(200).json(list);
};

//! 구매
//* 2022.01.19 코인 사용할 시에 작품id 포함해서 전달(유/무료 스타 구분에 따른 후속 수정)
//* 작품id는 com_currency의 connected_proejct에서 전달 
//* 단일상품 : connected_proejct에서, 세트상품 : 모두 같은 작품일 경우 connected_proejct, 아닌 경우 -1 
export const userCoinPurchase = async (req, res) => {
  const {
    body: {
      userkey = 0,
      coin_product_id = 0,
      currency = "",
      sell_price = 0,
      pay_price = 0,
      lang = "KO",
    },
  } = req;

  logger.info(`userCoinPurchase`);

  if (userkey === 0 || coin_product_id === 0 || pay_price === 0 || !currency) {
    logger.error(`userCoinPurchase Error 1-1`);
    responDBCoinShop(res, 80019, lang, req.body);
    return;
  }

  //* 판매 중인 상품인지 확인
  let result = await DB(
    `SELECT ifnull(fn_get_currency_info(currency, 'type'), 'set') currency_type
    , CASE WHEN currency = '' THEN 
      fn_get_currency_set(coin_product_id)
    ELSE 
      currency 
    END currency_list
    FROM com_coin_product 
    WHERE coin_product_id = ?
    AND is_public > 0 
    AND NOW() <= end_date;
    `,
    [coin_product_id]
  );
  if (!result.state || result.row.length === 0) {
    logger.error(`userCoinPurchase Error 1-2`);
    responDBCoinShop(res, 80097, lang);
    return;
  }

  const { currency_type, currency_list, } = result.row[0];
  const currencyList = currency_list.split(',');

  //* 해당 상품 개수 확인
  let productCount = 1;
  let quantityCount = 0;
  if (currency_type === "set") {
    result = await DB(
      `SELECT count(*) cnt FROM com_coin_product_set WHERE coin_product_id = ?;`,
      [coin_product_id]
    );
    productCount = result.row[0].cnt;
  }

  //* 작품 체크
  let projectId = -1; 
  result = await DB(`SELECT connected_project FROM com_currency WHERE currency IN (?);`, [currencyList]);
  if(result.state && result.row.length > 0){
    projectId = result.row[0].connected_project; //초기값
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      if(projectId !== item.connected_project) projectId = -1; //세트 상품 안에서 다른 작품이 있는 경우, -1로 변경 
    }
  }

  //* 유니크와 소유재화수 셋팅
  // eslint-disable-next-line no-restricted-syntax
  for (const item of currency) {
    // eslint-disable-next-line no-await-in-loop
    const currencyResult = await DB(
      `SELECT is_unique FROM com_currency WHERE currency = ?;`,
      [item.currency]
    ); //유니크
    item.is_unique = currencyResult.row[0].is_unique;

    // eslint-disable-next-line no-await-in-loop
    item.quantity = await getCurrencyQuantity(userkey, item.currency); // 재화 소유여부 한번 더 확인

    if (item.is_unique > 0 && item.quantity > 0) quantityCount += item.quantity;
  }

  if (productCount <= quantityCount) {
    logger.error(`userCoinPurchase Error 2`);
    responDBCoinShop(res, 80025, lang);
    return;
  }

  //* 구매 가능한지 확인
  const userCoin = await getCurrencyQuantity(userkey, "coin");
  if (userCoin < pay_price) {
    logger.error(`userCoinPurchase Error 3`);
    responDBCoinShop(res, 80013, lang);
    return;
  }

  //* 구매 처리(코인 사용)
  let insertQuery = ``;
  let currencyText = ``;
  // eslint-disable-next-line no-restricted-syntax
  for (const item of currency) {
    // 유니크 아닌 상품과 유니크면서 아직 보유하지 않으면 메일 전송
    if (item.is_unique === 0 || (item.is_unique === 1 && item.quantity === 0)) {
      insertQuery += mysql.format(
        `CALL sp_insert_user_property(?, ?, 1, 'coin_purchase');`,
        [userkey, item.currency]
      );
      currencyText += `${item.currency},`;
    }
  }
  currencyText = currencyText.slice(0, -1); //세트 상품인 경우, 소유재화에 따라 코인 재화 리스트가 달라짐
  const purchaseQuery = mysql.format(
    `CALL sp_use_user_property(?, 'coin', ?, 'coin_purchase', ?);`,
    [userkey, pay_price, projectId]
  );
  const userHistoryQuery = mysql.format(
    `
    INSERT INTO user_coin_purchase(userkey, coin_product_id, sell_price, pay_price, currency) VALUES(?, ?, ?, ?, ?);`,
    [userkey, coin_product_id, sell_price, pay_price, currencyText]
  );

  const purchaseResult = await transactionDB(`
    ${purchaseQuery}
    ${insertQuery}
    ${userHistoryQuery}   
    `);

  if (!purchaseResult.state) {
    logger.error(`userCoinPurchase Error 4 ${purchaseResult.error}`);
    responDBCoinShop(res, 80026, lang, purchaseResult.error);
    return;
  }

  //* 방금 구매한 내역 가져오기
  const maxnoResult = await DB(
    `SELECT max(coin_purchase_no) coin_purchase_no FROM user_coin_purchase WHERE userkey = ?;`,
    [userkey]
  );
  const maxNo = maxnoResult.row[0].coin_purchase_no;

  //* bankInfo 리턴
  const responseData = {};
  responseData.bank = await getUserBankInfo(req.body);

  res.status(200).json(responseData);
  logAction(userkey, "coin_purchase", {
    userkey,
    coin_product_id,
    coin_purchase_no: maxNo,
  });
};

//! 구매 내역 리스트
export const getCoinProductPurchaseList = async (req, res) => {
  logger.info(`getCoinProductPurchaseList`);

  const {
    body: { userkey, lang = "KO" },
  } = req;

  const result = await DB(
    `
    SELECT fn_get_coin_product_name(a.coin_product_id, ?) name  
    , sell_price 
    , pay_price 
    , CASE WHEN b.currency = '' THEN 
        a.currency
    ELSE 
        fn_get_localize_text((SELECT local_code FROM com_currency WHERE currency = a.currency), ?)
    END currency_name
    , ifnull(fn_get_currency_info(b.currency, 'type'), 'set') currency_type
    , fn_get_localize_text(ifnull(fn_get_standard_text_id('currency_type', fn_get_currency_info(b.currency, 'type')), 5123), '${lang}') currency_type_name
    , CASE WHEN fn_get_currency_info(b.currency, 'type') = 'portrait' COLLATE utf8mb4_0900_ai_ci THEN 1 
    WHEN fn_get_currency_info(b.currency, 'type') = 'frame' COLLATE utf8mb4_0900_ai_ci THEN 2 
    WHEN fn_get_currency_info(b.currency, 'type') = 'wallpaper' COLLATE utf8mb4_0900_ai_ci THEN 3 
    WHEN fn_get_currency_info(b.currency, 'type') = 'badge' COLLATE utf8mb4_0900_ai_ci THEN 4 
    WHEN fn_get_currency_info(b.currency, 'type') = 'standing' COLLATE utf8mb4_0900_ai_ci THEN 5 
    WHEN fn_get_currency_info(b.currency, 'type') = 'bubble' COLLATE utf8mb4_0900_ai_ci THEN 6 
    WHEN fn_get_currency_info(b.currency, 'type') = 'sticker' COLLATE utf8mb4_0900_ai_ci THEN 7 
    ELSE 0 END sortkey
    , DATE_FORMAT(coin_purchase_date, '%Y-%m-%d %T') coin_purchase_date
    FROM user_coin_purchase a, com_coin_product b 
    WHERE userkey = ?
    AND a.coin_product_id = b.coin_product_id 
    ORDER BY sortkey, coin_purchase_no DESC; 
    `,
    [lang, lang, userkey]
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const item of result.row) {
    if (item.currency_type === "set") {
      const whereQuery = getInConditionQuery(
        "currency",
        item.currency_name,
        true
      );

      // eslint-disable-next-line no-await-in-loop
      const currencyResult = await DB(
        `SELECT 
            group_concat(fn_get_localize_text(local_code, ?)) currency_name 
            FROM com_currency  
            ${whereQuery} 
            ;`,
        [lang]
      );
      item.currency_name = currencyResult.row[0].currency_name;
    }
  }

  res.status(200).json(result.row);
};
