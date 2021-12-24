import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { 
  respondDB,
} from "../respondent";
import { getUserBankInfo } from "./bankController";
import { getCurrencyQuantity } from "./accountController";
import {
    getEqualConditionQuery, 
    getLikeConditionQuery, 
} from "../com/com";

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
        row.currency = currencyList;
    }

    const langResult = await DB(`SELECT lang, name FROM com_coin_product_detail WHERE coin_product_id = ?;`, [row.coin_product_id]);
    row.lang = langResult.row;

    return row;
};

//! 메인 상품 목록 
export const getCoinProductMainList = async (req, res) =>{
    logger.info(`getCoinProductMainList`);

    const {
        body: {
            lang = "KO", 
        }
    } = req;

    //* 기간 한정 시작일, 끝일 가져오기 
    let result = await DB(`
    SELECT 
    ifnull(DATE_FORMAT(min(start_date), '%Y-%m-%d %T'), now()) start_date
    , ifnull(DATE_FORMAT(max(end_date), '%Y-%m-%d %T'), now()) end_date
    FROM com_coin_product
    WHERE coin_product_id > 0 
    -- AND is_public > 0 
    -- AND sale_price > 0
    AND now() <= end_date
    -- AND end_date <> '9999-12-31'
    ;`, []);

    const startDate = result.row[0].start_date; 
    const endDate = result.row[0].end_date; 

    const responseData = {}; 
    responseData.date = {
        start_date : startDate, 
        end_date : endDate,
    };

    result = await DB(`
    SELECT coin_product_id
    , fn_get_coin_product_name(coin_product_id, ?) name  
    , price
    , sale_price
    , sale_kind 
    , thumbnail_id 
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
    , CASE WHEN currency LIKE '%portrait%' THEN 'portrait' 
    WHEN currency LIKE '%frame%' THEN 'frame' 
    WHEN currency LIKE '%wallpaper%' THEN 'wallpaper' 
    WHEN currency LIKE '%badge%' THEN 'badge' 
    WHEN currency LIKE '%standing%' THEN 'standing' 
    WHEN currency LIKE '%bubble%' THEN 'bubble' 
    ELSE 'set' 
    END currency_type      
    , CASE WHEN currency LIKE '%portrait%' THEN '1' 
    WHEN currency LIKE '%frame%' THEN '2' 
    WHEN currency LIKE '%wallpaper%' THEN '3' 
    WHEN currency LIKE '%badge%' THEN '4' 
    WHEN currency LIKE '%standing%' THEN '5' 
    WHEN currency LIKE '%bubble%' THEN '6' 
    ELSE '0' 
    END sortkey            
    FROM com_coin_product
    WHERE coin_product_id > 0
    -- AND is_public > 0
    -- AND sale_price > 0 
    AND start_date >= ?, now()) AND end_date <= ? 
    ORDER BY sortkey, coin_product_id DESC;
    `, [lang, startDate, endDate]); 
    
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){

        if (!Object.prototype.hasOwnProperty.call(responseData, item.currency_type)) {  //재화 타입별로 가져오도록 셋팅 
            responseData[item.currency_type] = [];
        }
      
        responseData[item.currency_type].push({
            coin_product_id: item.coin_product_id,
            name  : item.name,
            price: item.price,
            sale_price: item.sale_price,
            sale_kind : item.sale_kind,
            thumbnail_id  : item.thumbnail_id, 
            thumbnail_url : item.thumbnail_url, 
            thumbnail_key : item.thumbnail_key, 
        });                        
    }

    res.status(200).json(responseData); 

};

//! 검색 목록
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
    ORDER BY action_date DESC
    LIMIT 10;
    `, [userkey]);

    res.status(200).json(result.row); 
};

//! 검색 상세 
export const getCoinProductSearchDetail = async(req, res) =>{
    
    logger.info(`getCoinProductSearchDetail`);

    const {
        body: {
            userkey, 
            lang = "KO", 
            search_word = "", 
        }
    } = req;   

    //* 검색어 누적 
    let result = await DB(`INSERT INTO user_coin_search(userkey, search_word) VALUES(?, ?);`, [userkey, search_word]);

    const responseData = {};
    result = await DB(`
    SELECT coin_product_id
    , fn_get_coin_product_name(coin_product_id, ?) name  
    , price
    , sale_price
    , sale_kind 
    , thumbnail_id 
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
    , CASE WHEN currency LIKE '%portrait%' THEN 'portrait' 
    WHEN currency LIKE '%frame%' THEN 'frame' 
    WHEN currency LIKE '%wallpaper%' THEN 'wallpaper' 
    WHEN currency LIKE '%badge%' THEN 'badge' 
    WHEN currency LIKE '%standing%' THEN 'standing' 
    WHEN currency LIKE '%bubble%' THEN 'bubble' 
    ELSE 'set' 
    END currency_type      
    , CASE WHEN currency LIKE '%portrait%' THEN '1' 
    WHEN currency LIKE '%frame%' THEN '2' 
    WHEN currency LIKE '%wallpaper%' THEN '3' 
    WHEN currency LIKE '%badge%' THEN '4' 
    WHEN currency LIKE '%standing%' THEN '5' 
    WHEN currency LIKE '%bubble%' THEN '6' 
    ELSE '0' 
    END sortkey            
    FROM com_coin_product
    WHERE coin_product_id > 0
    -- AND is_public > 0
    AND now() <= end_date
    ORDER BY sortkey, coin_product_id DESC;
    `, [lang]); 

    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){

        if (!Object.prototype.hasOwnProperty.call(responseData, item.currency_type)) {  //재화 타입별로 가져오도록 셋팅 
            responseData[item.currency_type] = [];
        }
      
        responseData[item.currency_type].push({
            coin_product_id: item.coin_product_id,
            name  : item.name,
            price: item.price,
            sale_price: item.sale_price,
            sale_kind : item.sale_kind,
            thumbnail_id  : item.thumbnail_id, 
            thumbnail_url : item.thumbnail_url, 
            thumbnail_key : item.thumbnail_key, 
        });                        
    }

    res.status(200).json(responseData);

};

//! 탭별 목록 
export const getCoinProductTypeList = async(req, res) =>{
    
    logger.info(`getCoinProductTypeList`);

    const {
        body:{
            lang = "KO", 
            currency_type = "",
        }
    } = req;

    let whereQuery = ``; 
    if(currency_type){
        if(currency_type === "set") whereQuery += getEqualConditionQuery('a.currency', '', true);
        else whereQuery += getLikeConditionQuery('a.currency', currency_type); 
    }

    const responseData = {}; 
    const project = {}; 
    
    //* 추천 상품(할인 중인 상품, 신규상품(2주 이내))
    let result = await DB(`
    SELECT coin_product_id
    , fn_get_coin_product_name(coin_product_id, ?) name  
    , price
    , sale_price
    , sale_kind 
    , thumbnail_id 
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
    FROM com_coin_product a
    WHERE coin_product_id > 0
    -- AND is_public > 0
    -- AND sale_price > 0 
    AND create_date BETWEEN DATE_ADD(NOW(),INTERVAL -2 WEEK ) AND NOW()
    AND NOW() <= end_date
    ${whereQuery}
    ORDER BY coin_product_id DESC;       
    `, [lang]);
    responseData.recommend = result.row;
    
    //* 작품별 리스트 
    result = await DB(`
    SELECT coin_product_id
    , fn_get_coin_product_name(coin_product_id, ?) name  
    , price
    , sale_price
    , sale_kind 
    , thumbnail_id 
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
    , connected_project 
    , fn_get_project_name_new(connected_project, ?) project_name 
    , (SELECT sortkey FROM list_project_master WHERE project_id = connected_project) sortkey 
    FROM com_coin_product a, com_currency b 
    WHERE coin_product_id > 0
    -- AND is_public > 0
    AND NOW() <= end_date
    ${whereQuery}
    AND a.currency = b.currency
    ORDER BY sortkey, coin_product_id DESC;    
    `, [lang, lang]); 

    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){

        if (!Object.prototype.hasOwnProperty.call(project, item.project_name)) {  //작품별로 가져오도록 셋팅 
            project[item.project_name] = [];
        }
      
        project[item.project_name].push({
            coin_product_id: item.coin_product_id,
            name  : item.name,
            price: item.price,
            sale_price: item.sale_price,
            sale_kind : item.sale_kind,
            thumbnail_id  : item.thumbnail_id, 
            thumbnail_url : item.thumbnail_url, 
            thumbnail_key : item.thumbnail_key, 
        });                        
    }
    responseData.project = project; 

    res.status(200).json(responseData);     

};  


const getCoinCurrencyInfo = async (userkey, lang, coin_product_id) => {

    const responseData = {}; 

    const result = await DB(`
    SELECT currency 
    , fn_get_localize_text((SELECT id FROM com_localize WHERE currency = a.currency), ?) currency_name
    , fn_get_user_property(?, a.currency) is_own
    , CASE WHEN currency LIKE '%portrait%' THEN 'portrait' 
           WHEN currency LIKE '%frame%' THEN 'frame' 
           WHEN currency LIKE '%wallpaper%' THEN 'wallpaper' 
           WHEN currency LIKE '%badge%' THEN 'badge' 
           WHEN currency LIKE '%standing%' THEN 'standing' 
           WHEN currency LIKE '%bubble%' THEN 'bubble' 
       ELSE '' END currency_type 
    FROM com_coin_product_set a
    WHERE coin_product_id = ?;
    `, [lang, userkey, coin_product_id]);
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){

        if (!Object.prototype.hasOwnProperty.call(responseData, item.currency_type)) {  //재화 타입별로 가져오도록 셋팅 
            responseData[item.currency_type] = [];
        }
      
        responseData[item.currency_type].push({
            currency: item.currency,
            currency_name  : item.currency_name,
            is_own: item.is_own,
        });                        
    }


    return responseData; 
};

//! 상품 상세 
export const coinProductDetail = async(req, res) =>{
    logger.info(`coinProductDetail`);

    const {
        body:{
            coin_product_id, 
            userkey, 
            lang = "KO", 
        }
    } = req;
    
    const result = await DB(`
    SELECT fn_get_coin_product_name(coin_product_id, ?) name  
    , price
    , sale_price
    , sale_kind 
    , thumbnail_id 
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
    , detail_page_id 
    , fn_get_design_info(detail_page_id, 'url') detail_page_url
    , fn_get_design_info(detail_page_id, 'key') detail_page_key
    , CASE WHEN currency LIKE '%portrait%' THEN '초상화' 
           WHEN currency LIKE '%frame%' THEN '테두리' 
           WHEN currency LIKE '%wallpaper%' THEN '배경' 
           WHEN currency LIKE '%badge%' THEN '뱃지' 
           WHEN currency LIKE '%standing%' THEN '캐릭터 스탠딩' 
           WHEN currency LIKE '%bubble%' THEN '말풍선' 
      ELSE '세트' END currency_type          
    , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
    , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
    FROM com_coin_product 
    WHERE coin_product_id = ?;
    `, [lang, coin_product_id]);
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
        if(item.currency_type === "세트"){
            // eslint-disable-next-line no-await-in-loop
            item.set = await getCoinCurrencyInfo(userkey, lang, coin_product_id); 
        }
    }

    res.status(200).json(result.row); 
};

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