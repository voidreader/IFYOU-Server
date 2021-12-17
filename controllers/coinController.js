import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { 
  respondDB,
} from "../respondent";
import { getUserBankInfo } from "./bankController";
import { getCurrencyQuantity } from "./accountController";

const currencyQuery = `SELECT currency 
, local_code
, is_unique
, fn_get_user_property(?, currency) is_own 
FROM com_currency `;

//! 세트 상품 정보 가져오기 
const getCurrencyInfo = async (userkey, currencys) =>{
    const result = await DB(`
    ${currencyQuery}
    WHERE currency IN (${currencys});`, [userkey]);
    return result.row; 
};

//! 재화 정보 처리 
const modifyCoinProductInfo = async (userkey, row) => {
    let result = ``; 
    if(parseInt(row.is_set, 10) === 0){      //단품
        result = await DB(`
        ${currencyQuery}
        WHERE currency = ?`, [userkey, row.currency]);
        row.currency = result.row; 
    }else{                                  //세트
        let currencys = ``; 
        const setResult = await DB(`SELECT currency FROM com_coin_product_set WHERE coin_product_id = ?;`, [row.coin_product_id]);
        setResult.row.forEach((item) => {
            currencys += `'${item.currency}',`; 
        });
        currencys = currencys.slice(0, -1); 
        const currencyList = await getCurrencyInfo(userkey, currencys);
        row.currency = currencyList;u
    }

    const langResult = await DB(`SELECT lang, name FROM com_coin_product_detail WHERE coin_product_id = ?;`, [row.coin_product_id]);
    row.lang = langResult.row;

    return row;
};

const getCurrencyList = async (lang, startData, endDate, currency) =>{

    let whereQuery = ``; 
    if(currency === "set"){
        whereQuery += ` AND currency = '' `; 
    }else{
        whereQuery += ` AND currency LIKE '%${currency}%' `; 
    }
    const result = await DB(`
    SELECT coin_product_id 
    , fn_get_coin_product_name(coin_product_id, ?) name 
    , price
    , sale_price
    , sale_kind 
    , thumbnail_id 
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
    FROM com_coin_product 
    WHERE coin_product_id > 0  
    AND is_public > 0 
    AND sale_price > 0
    AND start_date >= ? AND end_date <= ? 
    ${whereQuery}
    ORDER BY coin_product_id DESC;
    `, [lang, startData, endDate]); 

    return result.row; 
};

//! 메인화면 
export const getCoinProductMainList = async (req, res) =>{
    logger.info(`coinMainList`);

    const {
        body: {
            lang = "KO", 
        }
    } = req;

    const responseData = {}; 

    //* 기간 한정 시작일, 끝일 가져오기 
    const result = await DB(`
    SELECT 
    ifnull(DATE_FORMAT(min(start_date), '%Y-%m-%d %T'), now()) start_date
    , ifnull(DATE_FORMAT(max(end_date), '%Y-%m-%d %T'), now()) end_date
    FROM com_coin_product
    WHERE coin_product_id > 0 
    AND is_public > 0 
    AND sale_price > 0
    AND now() <= end_date 
    AND end_date <> '9999-12-31';
    `, []);

    const startDate = result.row[0].start_date; 
    const endDate = result.row[0].end_date; 

    responseData.set = await getCurrencyList(lang, startDate, endDate, 'set'); //세트상품
    responseData.photo = await getCurrencyList(lang, startDate, endDate, 'photo'); //프로필사진
    responseData.frame = await getCurrencyList(lang, startDate, endDate, 'frame'); //프로필 테두리
    responseData.background = await getCurrencyList(lang, startDate, endDate, 'background');  //프로필 배경
    responseData.badge = await getCurrencyList(lang, startDate, endDate, 'badge'); //프로필 뱃지

    res.status(200).json(responseData); 

};

//! 검색 리스트 
export const getCoinProductSearch = async(req, res) =>{
    logger.info(`getCoinProductSearch`);

    const {
        body: {
            userkey, 
        }
    } = req;    

    const result = await DB(`
    SELECT search_word
    FROM user_coin_search
    WHERE userkey = ? 
    ORDER BY update_date DESC
    LIMIT 10;
    `, [userkey]);

    res.status(200).json(result.row); 
};

//! 검색 상세 
export const getCoinProductSearchDetail = async(req, res) =>{
    logger.info(`getCoinProductSearchDetail`);

    const {
        body: {
            lang = "KO", 
        }
    } = req;   

    const responseData = {};
    const startDate = 'now()'; 
    const endDate = '9999-12-31';

    //세트상품 
    let result = await getCurrencyList(lang, startDate, endDate, 'set');
    responseData.setCount = result.row.length; 
    responseData.set = result;  

    //프로필사진
    result = await getCurrencyList(lang, startDate, endDate, 'photo');
    responseData.photoCount = result.row.length; 
    responseData.photo = result; 

    //프로필 테두리
    result = await getCurrencyList(lang, startDate, endDate, 'frame');
    responseData.frameCount = result.row.length; 
    responseData.frame = result; 

    //프로필 배경
    result = await getCurrencyList(lang, startDate, endDate, 'background');
    responseData.bgCount = result.row.length; 
    responseData.bg = result;  

    //프로필 뱃지
    result = await getCurrencyList(lang, startDate, endDate, 'badge');
    responseData.badgeCount = result.row.length; 
    responseData.badge = result;

    res.status(200).json(responseData); 
};

//! 판매중인 리스트 
export const getCoinProductList = async (req, res) => {
    logger.info(`getCoinProductList`);

    const {
        body:{userkey = 0}
    } = req;
    
    const result = await DB(`
    SELECT coin_product_id
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key
    , fn_get_design_info(detail_page_id, 'url') detail_page_url
    , fn_get_design_info(detail_page_id, 'key') detail_page_key 
    , price 
    , sale_price 
    , sale_kind.
    , currency 
    , CASE WHEN currency = '' THEN '1' ELSE '0' END is_set 
    FROM com_coin_product 
    WHERE is_public > 0 
    AND NOW() BETWEEN start_date AND end_date
    ORDER BY coin_product_id DESC;
    `, []);

    const promise = [];
    let finalResult = ``; 
    result.row.forEach(async (item) => {
        promise.push(modifyCoinProductInfo(userkey, item)); 
    });

    await Promise.all(promise)
    .then((values) => {
      finalResult = values;
    })
    .catch((err) => {
      console.log(err);
    });
  
    res.status(200).json(finalResult);

};


//! 서치 

//! 서치 상세 

//! 서브 페이지 


//! 구매 
export const userCoinPurchase = async (req, res) => {
    const {
        body: {
            userkey = 0,
            coin_product_id = 0,
            currency = "", 
            price = 0, 
        },
    } = req;

    logger.info(`userCoinPurchase`);

    if(userkey === 0 || coin_product_id === 0 || price === 0 || !currency){
        logger.error(`userCoinPurchase Error 1`);
        respondDB(res, 80019, req.body);
        return;        
    }

    let purchaseCheck = false;
    // eslint-disable-next-line no-restricted-syntax
    for(const item of currency){
        // eslint-disable-next-line no-await-in-loop
        const quantity = await getCurrencyQuantity(userkey, item.currency); //* 재화 소유여부 한번 더 확인 
        if(quantity > 0) item.is_own = 1; 

        if(item.is_unique === 0 || (item.is_unique === 1 && item.is_own === 0)) purchaseCheck = true; 
    }
    
    //* 구매할 재화가 한개도 없으면 에러 처리 
    if(!purchaseCheck){ 
        logger.error(`userCoinPurchase Error 2`);
        respondDB(res, 80092, "이미 구입한 상품입니다.");
        return;         
    }

    const userCoin = await getCurrencyQuantity(userkey, "coin");
    if(userCoin < price){
        logger.error(`userCoinPurchase Error 3`);
        respondDB(res, 80092, "코인이 부족합니다.");
        return;           
    }

    const purchaseQuery = mysql.format(`CALL sp_use_user_property(?, 'coin', ?, 'coin_purchase', -1);`, [userkey, price]);
    const userHistoryQuery = mysql.format(`INSERT INTO user_coin_purchase(userkey, coin_product_id, price) VALUES(?, ?, ?);`,[userkey, coin_product_id, price]);

    const purchaseResult = await transactionDB(`
    ${purchaseQuery}
    ${userHistoryQuery}
    `);
    if(!purchaseResult.state){
        logger.error(`userCoinPurchase Error 4 ${purchaseResult.error}`);
        respondDB(res, 80026, purchaseResult.error);
        return;         
    }

    const maxnoResult = await DB(`SELECT max(coin_purchase_no) coin_purchase_no FROM user_coin_purchase WHERE userkey = ?;`, [userkey]);
    const maxNo = maxnoResult.row[0].coin_purchase_no;
    
    const currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project, coin_purchase_no) 
    VALUES(?, 'coin_purchase', ?, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1, ?);`; 
    let sendQuery = ``;
 
    // eslint-disable-next-line no-restricted-syntax
    for(const item of currency){
        // 유니크 아닌 상품과 유니크면서 아직 보유하지 않으면 메일 전송 
        if(item.is_unique === 0 || (item.is_unique === 1 && item.is_own === 0) )
            sendQuery += mysql.format(`${currentQuery}`, [userkey, item.currency, maxNo]);
    }

    if(sendQuery){
        const result = await transactionDB(`${sendQuery}`, []);
        if(!result.state){
            logger.error(`userCoinPurchase Error 5 ${result.error}`);
            respondDB(res, 80026, result.error);
            return;        
        }
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
 
   res.status(200).json(responseData);
   logAction(userkey, "coin_purchase", { userkey, coin_product_id, coin_purchase_no: maxNo });   
};