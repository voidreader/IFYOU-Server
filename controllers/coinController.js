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

    let result = `
    coin_product_id
    , fn_get_coin_product_name(coin_product_id, ?) name  
    , price
    , sale_price
    , sale_kind 
    , CASE WHEN sale_price > 0 THEN 
        CASE WHEN NOW() <= end_date THEN '1' ELSE '0' END
    ELSE '0' END sale_check     
    , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
    , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
    , thumbnail_id 
    , fn_get_design_info(thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(thumbnail_id, 'key') thumbnail_key 
    , CASE WHEN currency <> '' THEN fn_get_user_property(?, currency) ELSE 0 END quantity
    , CASE WHEN currency <> '' THEN CAST(fn_get_currency_info(currency, 'unique') AS signed integer) ELSE 0 END is_unique   
    , ifnull(fn_get_currency_info(currency, 'type'), 'set') currency_type      
    , CASE WHEN fn_get_currency_info(currency, 'type') = 'portrait' COLLATE utf8mb4_0900_ai_ci THEN '1' 
    WHEN fn_get_currency_info(currency, 'type') = 'frame' COLLATE utf8mb4_0900_ai_ci THEN '2' 
    WHEN fn_get_currency_info(currency, 'type') = 'wallpaper' COLLATE utf8mb4_0900_ai_ci THEN '3' 
    WHEN fn_get_currency_info(currency, 'type') = 'badge' COLLATE utf8mb4_0900_ai_ci THEN '4' 
    WHEN fn_get_currency_info(currency, 'type') = 'standing' COLLATE utf8mb4_0900_ai_ci THEN '5' 
    WHEN fn_get_currency_info(currency, 'type') = 'bubble' COLLATE utf8mb4_0900_ai_ci THEN '6' 
    WHEN fn_get_currency_info(currency, 'type') = 'sticker' COLLATE utf8mb4_0900_ai_ci THEN '7' 
    ELSE '0' END sortkey`;

    if(kind){
        result = `
        
        , ifnull(fn_get_currency_info(a.currency, 'type'), '') currency_type
        , CASE WHEN fn_get_currency_info(a.currency, 'type') = 'portrait' COLLATE utf8mb4_0900_ai_ci THEN '1'
        WHEN fn_get_currency_info(a.currency, 'type') = 'frame' COLLATE utf8mb4_0900_ai_ci THEN '2'
        WHEN fn_get_currency_info(a.currency, 'type') = 'wallpaper' COLLATE utf8mb4_0900_ai_ci THEN '3'
        WHEN fn_get_currency_info(a.currency, 'type') = 'badge' COLLATE utf8mb4_0900_ai_ci THEN '4'
        WHEN fn_get_currency_info(a.currency, 'type') = 'standing' COLLATE utf8mb4_0900_ai_ci THEN '5'
        WHEN fn_get_currency_info(a.currency, 'type') = 'bubble' COLLATE utf8mb4_0900_ai_ci THEN '6'
        WHEN fn_get_currency_info(a.currency, 'type') = 'sticker' COLLATE utf8mb4_0900_ai_ci THEN '7'
        ELSE '8' END sortkey`;
    }

    return result; 
};

//! 코인 재화 드롭다운 목록 
export const getCoinCurreyTypeList = async(req, res) =>{
    
    logger.info(`getCoinCurreyTypeList`);

    const result = await DB(`
    SELECT code, code_name FROM list_standard ls 
    WHERE standard_class = 'currency_type' 
    AND code NOT in('ticket', 'nonconsumable', 'consumable') 
    ORDER BY sortkey;`);

    res.status(200).json(result.row); 
};

//! 세트 상품인 경우, 재화별 정보 가져오기 
const getCoinCurrencyInfo = async (userkey, lang, coin_product_id) => {

    const responseData = {}; 

    const column = getColumn(1); 
    let price = 0;

    const result = await DB(`
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
    `, [lang, userkey, coin_product_id]);
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
        if(item.is_unique > 0 && item.quantity > 0) price += item.price; //소유하고 있으면 그 금액만큼 더함        
    }
    responseData.list = result.row;
    responseData.price = price; //합산 금액

    return responseData; 
};

//! 메인 상품 목록 
export const getCoinProductMainList = async (req, res) =>{
    logger.info(`getCoinProductMainList`);

    const {
        body: {
            userkey, 
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
    let set = [];
    let payPrice = 0; 

    responseData.date = {
        start_date : startDate, 
        end_date : endDate,
    };

    const column = getColumn(); 
    result = await DB(`
    SELECT 
    ${column}
    FROM com_coin_product
    WHERE coin_product_id > 0
    AND is_public > 0
    AND sale_price > 0 
    AND start_date >= ? 
    AND end_date BETWEEN now() AND ? 
    ORDER BY sortkey, coin_product_id DESC;
    `, [lang, userkey, startDate, endDate]); 
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){

        payPrice = item.price;
        if(item.sale_check === "1") payPrice = item.sale_price;
        if(item.currency_type === "set"){
            // eslint-disable-next-line no-await-in-loop
            set = await getCoinCurrencyInfo(userkey, lang, item.coin_product_id);

            // eslint-disable-next-line no-restricted-syntax
            for (const key of Object.keys(set)) {   
                if(key === "price"){
                    payPrice -= set[key];   //소유한 재화 금액만큼 빼기 
                }
            }
            delete set['price'];
            item.set = set;
        }

        item.pay_price = payPrice;
    }
    responseData.list = result.row; 

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
    let set = [];
    let payPrice = 0; 

    const column = getColumn(); 

    if(whereQuery){
        responseData.result = "OK";
    }else{
        responseData.result = "FAIL";
    }

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
    responseData.total = result.row; 

    //리스트 
    result = await DB(`
    SELECT 
    ${column}
    FROM com_coin_product
    WHERE coin_product_id > 0
    AND is_public > 0
    AND now() <= end_date
    ${whereQuery}
    ORDER BY sortkey, coin_product_id DESC;
    `, [lang, userkey]); 
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){

        payPrice = item.price;
        if(item.sale_check === "1") payPrice = item.sale_price;
        if(item.currency_type === "set"){
            // eslint-disable-next-line no-await-in-loop
            set = await getCoinCurrencyInfo(userkey, lang, item.coin_product_id);
    
            // eslint-disable-next-line no-restricted-syntax
            for (const key of Object.keys(set)) {   
                if(key === "price"){
                    payPrice -= set[key];   //소유한 재화 금액만큼 빼기 
                }
            }
            delete set['price'];
            item.set = set;
        }
    
        item.pay_price = payPrice;
    }
    responseData.list = result.row; 
    
    res.status(200).json(responseData);

};

//! 검색어 삭제 
export const coinProductSearchDelete = async(req, res) =>{
    logger.info(`coinProductSearchDelete`); 

    const {
        body:{
            userkey, 
            kind = "", 
            search_word = "",
        }
    } = req;

    let result = ``; 
    if(kind === "all"){
        
        result = await DB(`DELETE FROM user_coin_search WHERE userkey = ?;`, [userkey]);
        if(!result.state){
            logger.error(`coinProductSearchDelete Error 1 ${result.error}`);
            respondDB(res, 80026, result.error);
            return;            
        }

    }else{
        result = await DB(`SELECT * FROM user_coin_search WHERE userkey = ? AND search_word = ?;`, [userkey, search_word]);
        if(!result.state || result.row.length === 0){
            logger.error(`coinProductSearchDelete Error 2`);
            respondDB(res, 80019);
            return; 
        }
    
        result = await DB(`DELETE FROM user_coin_search WHERE userkey = ? AND search_word = ?;`, [userkey, search_word]);
        if(!result.state){
            logger.error(`coinProductSearchDelete Error 3 ${result.error}`);
            respondDB(res, 80026, result.error);
            return;            
        }
    }

    getCoinProductSearch(req, res); 
};

//! 탭별 목록 
export const getCoinProductTypeList = async(req, res) =>{
    
    logger.info(`getCoinProductTypeList`);

    const {
        body:{
            userkey, 
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
    , fn_get_user_property(?, currency) quantity
    , CASE WHEN currency <> '' THEN CAST(fn_get_currency_info(currency, 'unique') AS signed integer) ELSE 0 END is_unique
    FROM com_coin_product a
    WHERE coin_product_id > 0
    AND is_public > 0
    AND ( sale_price > 0 OR create_date BETWEEN DATE_ADD(NOW(),INTERVAL -2 WEEK ) AND NOW() )
    AND NOW() <= end_date
    ${whereQuery}
    ORDER BY coin_product_id DESC;       
    `, [lang, userkey]);
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
        , 0 quantity
        , 0 is_unique
        FROM com_coin_product a 
        WHERE coin_product_id > 0
        AND is_public > 0 
        AND NOW() <= end_date
        ${whereQuery}
        ORDER BY coin_product_id DESC;
        `, [lang, userkey]);   
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
        , fn_get_user_property(?, a.currency)  quantity
        , CAST(fn_get_currency_info(a.currency, 'unique') AS signed integer) is_unique
        FROM com_coin_product a, com_currency b 
        WHERE a.currency = b.currency
        AND coin_product_id > 0
        AND is_public > 0
        AND NOW() <= end_date
        ${whereQuery}
        ORDER BY sortkey, coin_product_id DESC;    
        `, [lang, lang, userkey]); 
    }
    responseData.list = result.row; 

    res.status(200).json(responseData);     

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
    if(result.row[0].currency !== "") {  //세트 상품이 아니면 작품명 전달
        query = `
        fn_get_project_name_new((SELECT connected_project FROM com_currency WHERE currency = a.currency), '${lang}') project_name
        , CAST(fn_get_currency_info(a.currency, 'unique') AS signed integer) is_unique
        , fn_get_user_property(${userkey}, a.currency) quantity
        `;
    }

    let payPrice = 0; 
    result = await DB(`
    SELECT ifnull(fn_get_currency_info(currency, 'type'), 'set') currency_type       
    , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
    , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
    , ifnull(price, 0) price
    , ifnull(sale_price, 0) sale_price 
    , CASE WHEN sale_price > 0 THEN 
        CASE WHEN NOW() <= end_date TEHN '1' ELSE '0' END
    ELSE '0' END sale_check 
    ${query}
    FROM com_coin_product a
    WHERE coin_product_id = ?;
    `, [coin_product_id]);

    payPrice = result.row[0].price; 
    if(result.row[0].sale_check === '1') payPrice = result.row[0].sale_price; // 할인 중이면 할인가로 

    if(result.row[0].currency_type === "set"){ // 소유한 재화는 금액에서 제외
        const set = await getCoinCurrencyInfo(userkey, lang, coin_product_id);
        // eslint-disable-next-line no-restricted-syntax
        for (const key of Object.keys(set)) {   
            if(key === "price"){
                payPrice -= set[key];   //소유한 재화 금액만큼 빼기 
            }
        }
        // eslint-disable-next-line dot-notation
        delete set['price'];  // price 키 삭제 
        result.row[0].set = set; // price 삭제한 나머지 출력(재화 리스트)
    }else{
        if(result.row[0].is_unique > 0 && result.row[0].quantity > 0) payPrice = 0;
    }

    result.row[0].pay_price = payPrice < 0 ? 0 : payPrice;  //결제금액(판매금액 === 결제금액 소유재화/할인 X, 판매금액 !== 결제 금액 소유재화/할인 O)

    res.status(200).json(result.row); 
};

//! 구매 
export const userCoinPurchase = async (req, res) => {
    const {
        body: {
            userkey = 0,
            coin_product_id = 0,
            currency = "", 
            sell_price = 0, 
            pay_price = 0, 
        },
    } = req;

    logger.info(`userCoinPurchase`);

    if(userkey === 0 || coin_product_id === 0 || pay_price === 0 || !currency){
        logger.error(`userCoinPurchase Error 1-1`);
        respondDB(res, 80019, req.body);
        return;        
    }

    //* 판매 중인 상품인지 확인
    let result = await DB(`SELECT ifnull(fn_get_currency_info(currency, 'type'), 'set') currency_type       
    FROM com_coin_product 
    WHERE coin_product_id = ?
    AND is_public > 0 
    AND NOW() <= end_date;
    `, [coin_product_id]);
    if(!result.state || result.row.length === 0){
        logger.error(`userCoinPurchase Error 1-2`);
        respondDB(res, 80097);
        return;         
    } 

    //* 해당 상품 개수 확인 
    let productCount = 1; 
    let quantityCount = 0; 
    if(result.row[0].currency_type === "set"){
        result = await DB(`SELECT count(*) cnt FROM com_coin_product_set WHERE coin_product_id = ?;`, [coin_product_id]);
        productCount = result.row[0].cnt; 
    }  

    //* 유니크와 소유재화수 셋팅 
    // eslint-disable-next-line no-restricted-syntax
    for(const item of currency){

        // eslint-disable-next-line no-await-in-loop
        const currencyResult = await DB(`SELECT is_unique, connected_project FROM com_currency WHERE currency = ?;`, [item.currency]);  //유니크
        item.project_id = currencyResult.row[0].connected_project; 
        item.is_unique = currencyResult.row[0].is_unique; 
        
        // eslint-disable-next-line no-await-in-loop
        item.quantity = await getCurrencyQuantity(userkey, item.currency); // 재화 소유여부 한번 더 확인 

        if(item.is_unique > 0 && item.quantity > 0) quantityCount += item.quantity; 
    } 

    if(productCount <= quantityCount){
        logger.error(`userCoinPurchase Error 2`);
        respondDB(res, 80025);
        return;
    }

    //* 구매 가능한지 확인
    const userCoin = await getCurrencyQuantity(userkey, "coin");
    if(userCoin < pay_price){
        logger.error(`userCoinPurchase Error 3`);
        respondDB(res, 80013);
        return;           
    }

    //* 구매 처리(코인 사용)
    let purchaseQuery = ``;
    let insertQuery = ``;
    let currencyText = ``;
    // eslint-disable-next-line no-restricted-syntax
    for(const item of currency){
        // 유니크 아닌 상품과 유니크면서 아직 보유하지 않으면 메일 전송 
        if(item.is_unique === 0 || (item.is_unique === 1 && item.quantity === 0) ){
            purchaseQuery = mysql.format(`CALL sp_use_user_property(?, 'coin', ?, 'coin_purchase', ?);`, [userkey, pay_price, item.project_id]);
            insertQuery += mysql.format(`CALL sp_insert_user_property(?, 1, ?, 'coin_purchase');`, [userkey, item.currency]);
            currencyText +=`${item.currency},`;
        }
    }
    currencyText = currencyText.slice(0,-1);
    const userHistoryQuery = mysql.format(`INSERT INTO user_coin_purchase(userkey, coin_product_id, sell_price, pay_price, currency) VALUES(?, ?, ?, ?, ?);`,
    [userkey, coin_product_id, sell_price, pay_price, currencyText]);

    const purchaseResult = await transactionDB(`
    ${purchaseQuery}
    ${insertQuery}
    ${userHistoryQuery}   
    `); 

    if(!purchaseResult.state){
        logger.error(`userCoinPurchase Error 4 ${purchaseResult.error}`);
        respondDB(res, 80026, purchaseResult.error);
        return;         
    }

    //* 방금 구매한 내역 가져오기 
    const maxnoResult = await DB(`SELECT max(coin_purchase_no) coin_purchase_no FROM user_coin_purchase WHERE userkey = ?;`, [userkey]);
    const maxNo = maxnoResult.row[0].coin_purchase_no;
    
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