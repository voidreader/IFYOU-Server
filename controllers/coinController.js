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
    getInConditionQuery, 
} from "../com/com";

const getColumn = (kind) =>{

    let result = `, ifnull(fn_get_currency_info(currency, 'type'), 'set') currency_type      
    , CASE WHEN fn_get_currency_info(currency, 'type') = 'portrait' COLLATE utf8mb4_0900_ai_ci THEN '1' 
    WHEN fn_get_currency_info(currency, 'type') = 'frame' COLLATE utf8mb4_0900_ai_ci THEN '2' 
    WHEN fn_get_currency_info(currency, 'type') = 'wallpaper' COLLATE utf8mb4_0900_ai_ci THEN '3' 
    WHEN fn_get_currency_info(currency, 'type') = 'badge' COLLATE utf8mb4_0900_ai_ci THEN '4' 
    WHEN fn_get_currency_info(currency, 'type') = 'standing' COLLATE utf8mb4_0900_ai_ci THEN '5' 
    WHEN fn_get_currency_info(currency, 'type') = 'bubble' COLLATE utf8mb4_0900_ai_ci THEN '6' 
    ELSE '0' END sortkey`;

    if(kind){
        result = `, ifnull(fn_get_currency_info(a.currency, 'type'), '') currency_type
        , CASE WHEN fn_get_currency_info(a.currency, 'type') = 'portrait' COLLATE utf8mb4_0900_ai_ci THEN '1'
        WHEN fn_get_currency_info(a.currency, 'type') = 'frame' COLLATE utf8mb4_0900_ai_ci THEN '2'
        WHEN fn_get_currency_info(a.currency, 'type') = 'wallpaper' COLLATE utf8mb4_0900_ai_ci THEN '3'
        WHEN fn_get_currency_info(a.currency, 'type') = 'badge' COLLATE utf8mb4_0900_ai_ci THEN '4'
        WHEN fn_get_currency_info(a.currency, 'type') = 'standing' COLLATE utf8mb4_0900_ai_ci THEN '5'
        WHEN fn_get_currency_info(a.currency, 'type') = 'bubble' COLLATE utf8mb4_0900_ai_ci THEN '6'
        ELSE '7' END sortkey`;
    }

    return result; 
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
    AND is_public > 0 
    AND sale_price > 0
    AND now() <= end_date
    AND end_date <> '9999-12-31'
    ;`);

    const startDate = result.row[0].start_date; 
    const endDate = result.row[0].end_date; 

    const responseData = {}; 
    responseData.date = {
        start_date : startDate, 
        end_date : endDate,
    };

    const column = getColumn(); 

    result = await DB(`
    SELECT coin_product_id
    , fn_get_coin_product_name(coin_product_id, ?) name  
    , price
    , sale_price
    , sale_kind 
    , thumbnail_id 
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
    ${column}
    FROM com_coin_product
    WHERE coin_product_id > 0
    AND is_public > 0
    AND sale_price > 0 
    AND start_date >= ? 
    AND end_date BETWEEN now() AND ? 
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

    //* 검색어 누적 > 검색어가 다를 경우에만 누적 
    let result = await DB(`SELECT * FROM user_coin_search WHERE userkey = ? AND search_word = ?;`, [userkey, search_word]);
    if(result.row.length === 0) {
        result = await DB(`INSERT INTO user_coin_search(userkey, search_word) VALUES(?, ?);`, [userkey, search_word]);
    }else{
        result = await DB(`UPDATE user_coin_search SET action_date = now() WHERE userkey = ? AND search_word = ?;`, [userkey, search_word]);
    }
    //* 검색어 조건절 걸기 
    let whereQuery = ``; 
    if(search_word){
       
        let projectIds = ``; 
        let coinProductIds = ``; 
        
        // 작품id 찾기 > 작품명
        result = await DB(`SELECT DISTINCT project_id FROM list_project_detail WHERE title LIKE CONCAT('%', ?, '%');`, [search_word]);
        if(result.row.length > 0){
            // eslint-disable-next-line no-restricted-syntax
            for(const item of result.row){
                projectIds += `${item.project_id},`;
            }
            projectIds = projectIds.slice(0, -1);
        }

        // 세트 상품 > 작품과 관련된 코인 재화 있는지 확인 
        if(projectIds){
            result = await DB(`SELECT DISTINCT coin_product_id FROM com_coin_product_set
            WHERE currency IN ( SELECT currency FROM com_currency WHERE connected_project IN (${projectIds}) );`);
            if(result.row.length > 0){
                // eslint-disable-next-line no-restricted-syntax
                for(const item of result.row){
                    coinProductIds += `${item.coin_product_id},`;
                }
            }
        }

        // 코인상품id 찾기 > 상품명 
        result = await DB(`SELECT DISTINCT coin_product_id FROM com_coin_product_detail WHERE name LIKE CONCAT('%', ?, '%');`, [search_word]);
        if(result.row.length > 0){
            // eslint-disable-next-line no-restricted-syntax
            for(const item of result.row){
                coinProductIds += `${item.coin_product_id},`;
            } 
        }
        if(coinProductIds) coinProductIds = coinProductIds.slice(0, -1);

        if(projectIds && coinProductIds){  // 둘 다 있는 경우 > currency or coin_product_id 둘 다 찾기 
            whereQuery = ` AND ( currency IN ( SELECT currency FROM com_currency WHERE connected_project IN (${projectIds}) ) 
            OR coin_product_id IN (${coinProductIds}) ) `;
        }else if(projectIds && !coinProductIds){ // 작품id만 있는 경우 > currency 
            whereQuery = ` AND currency IN ( SELECT currency FROM com_currency WHERE connected_project IN (${projectIds}) )`;
        }else if(!projectIds && coinProductIds){ // 코인상품id만 있는 경우 > coin_product_id 
            whereQuery = ` AND coin_product_id IN (${coinProductIds}) `;
        }

    }

    const responseData = {};
    const total = {};
    const list = {}; 
    const column = getColumn(); 

    //건수 
    result = await DB(`
    SELECT count(*) total 
    ${column}
    FROM com_coin_product
    WHERE coin_product_id > 0
    AND is_public > 0
    AND now() <= end_date
    ${whereQuery}
    GROUP BY currency_type
    ORDER BY sortkey;`);
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
        if (!Object.prototype.hasOwnProperty.call(total, item.currency_type)) {  //재화 타입별로 가져오도록 셋팅 
            total[item.currency_type] = [];
        }
      
        total[item.currency_type].push({
            total : item.total, 
        });             
    }
    responseData.total = total; 

    //리스트 
    result = await DB(`
    SELECT coin_product_id
    , fn_get_coin_product_name(coin_product_id, ?) name  
    , price
    , sale_price
    , sale_kind 
    , thumbnail_id 
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
    ${column}
    FROM com_coin_product
    WHERE coin_product_id > 0
    AND is_public > 0
    AND now() <= end_date
    ${whereQuery}
    ORDER BY sortkey, coin_product_id DESC;
    `, [lang]); 

    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){

        if (!Object.prototype.hasOwnProperty.call(list, item.currency_type)) {  //재화 타입별로 가져오도록 셋팅 
            list[item.currency_type] = [];
        }
      
        list[item.currency_type].push({
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
    responseData.list = list; 
    
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
        else whereQuery += getInConditionQuery('a.currency', `SELECT currency FROM com_currency WHERE currency_type = '${currency_type}'`); 
    }

    const responseData = {}; 
    let list = {}; 
    
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
    AND is_public > 0
    AND ( sale_price > 0 OR create_date BETWEEN DATE_ADD(NOW(),INTERVAL -2 WEEK ) AND NOW() )
    AND NOW() <= end_date
    ${whereQuery}
    ORDER BY coin_product_id DESC;       
    `, [lang]);
    responseData.recommend = result.row;
    
    //* 리스트 
    if(currency_type === "set"){ // 최신순
        result = await DB(`
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
        AND is_public > 0 
        AND NOW() <= end_date
        ${whereQuery}
        ORDER BY coin_product_id DESC;
        `, [lang]);   
    }else{ //작품 관리에 지정된 sortkey순으로 출력
        result = await DB(`
        SELECT coin_product_id
        , fn_get_coin_product_name(coin_product_id, ?) name  
        , price
        , sale_price
        , sale_kind 
        , thumbnail_id 
        , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
        , fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
        , fn_get_project_name_new(connected_project, ?) project_name 
        , (SELECT sortkey FROM list_project_master WHERE project_id = connected_project) sortkey 
        FROM com_coin_product a, com_currency b 
        WHERE a.currency = b.currency
        AND coin_product_id > 0
        AND is_public > 0
        AND NOW() <= end_date
        ${whereQuery}
        ORDER BY sortkey, coin_product_id DESC;    
        `, [lang, lang]); 
    }
    if(currency_type !== "set"){
        // eslint-disable-next-line no-restricted-syntax
        for(const item of result.row){

            if (!Object.prototype.hasOwnProperty.call(list, item.project_name)) {  //작품별로 가져오도록 셋팅 
                list[item.project_name] = [];
            }
        
            list[item.project_name].push({
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
    }else{
        list = result.row; 
    }

    responseData.list = list; 

    res.status(200).json(responseData);     

};  

//! 세트 상품인 경우, 재화별 정보 가져오기 
const getCoinCurrencyInfo = async (userkey, lang, coin_product_id) => {

    const responseData = {}; 

    const column = getColumn(1); 

    const result = await DB(`
    SELECT a.currency 
    , fn_get_localize_text(local_code, ?) currency_name
    , fn_get_user_property(?, a.currency) is_own
    , fn_get_coin_product_price(a.currency, 'price') price
    , fn_get_coin_product_price(a.currency, 'sale') sale_price
    ${column}
    FROM com_coin_product_set a, com_currency b 
    WHERE a.currency = b.currency  
    AND coin_product_id = ?
    ORDER BY sortkey;
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
            price : item.price, 
            sale_price : item.sale_price,
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

    let query = ``; 
    let result = await DB(`SELECT currency FROM com_coin_product WHERE coin_product_id = ?;`, [coin_product_id]);
    if(result.row[0].currency !== "") {
        query = `
        , fn_get_project_name_new((SELECT connected_project FROM com_currency WHERE currency = a.currency), '${lang}') project_name 
        , fn_get_user_property(${userkey}, currency) is_own 
        `;
    }

    result = await DB(`
    SELECT ifnull(fn_get_currency_info(currency, 'type'), 'set') currency_type       
    , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
    , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
    ${query}
    FROM com_coin_product a
    WHERE coin_product_id = ?;
    `, [coin_product_id]);
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
        if(item.currency_type === "set"){
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