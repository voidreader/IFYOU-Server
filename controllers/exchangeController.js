import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { 
  respondDB,
} from "../respondent";
import { getUserBankInfo } from "./bankController";
import { getCurrencyQuantity } from "./accountController"; 

//! 판매 중인 코인 환전상품 리스트 
export const getCoinExchangeProductList = async (req, res) =>{

    const result = await DB(`
    SELECT 
    a.exchange_product_id
    , a.star_quantity
    , a.coin_quantity
    , a.bonus_quantity
    , CASE WHEN a.daily_purchase_cnt < 0 THEN 1
    ELSE 
        CASE WHEN a.daily_purchase_cnt <= fn_get_user_coin_exchange(?, a.exchange_product_id) THEN 0 ELSE 1 END 
    END exchange_check
    FROM com_coin_exchange_product a LEFT OUTER JOIN user_coin_exchange b 
    ON a.exchange_product_id = b.exchange_product_id 
    WHERE is_service > 0 ;
    `, [req.body.userkey]);

    res.status(200).json(result.row); 
};

//! 환전 
export const coinExchangePurchase = async (req, res) =>{

    const {
        body:{
            userkey, 
            exchange_product_id = 0,
        }
    } = req;

    if(exchange_product_id === 0){
        logger.error(`coinExchangePurchase error 1`);
        respondDB(res, 80019);
        return;
    }

    let currentQuery = ``; 
    let exchangeQuery = ``;
    let result = await DB(`SELECT
    star_quantity
    , coin_quantity
    , bonus_quantity
    , CASE WHEN daily_purchase_cnt < 0 THEN 1
    ELSE 
        CASE WHEN daily_purchase_cnt <= fn_get_user_coin_exchange(?, exchange_product_id) THEN 0 ELSE 1 END 
    END exchange_check
    FROM com_coin_exchange_product
    WHERE exchange_product_id = ?;
    `, [userkey, exchange_product_id]);
    if(!result.state || result.row.length === 0){
        
        logger.error(`coinExchangePurchase error 2`);
        respondDB(res, 80097);
        return;

    }else{

        const {
            star_quantity,
            coin_quantity, 
            bonus_quantity,
            exchange_check, 
        } = result.row[0];

        // eslint-disable-next-line no-lonely-if
        if(exchange_check === 0){
            logger.error(`coinExchangePurchase error 3`);
            respondDB(res, 80025);
            return;  
        }

        const userStar = await getCurrencyQuantity(userkey, "gem"); // 유저 보유 스타수
        if(userStar < star_quantity){
            logger.error(`coinExchangePurchase error 4`);
            respondDB(res, 80102);
            return;             
        }

        // 스타 차감 
        currentQuery = `CALL pier.sp_use_user_property(?, 'gem', ?, 'coin_exchange', -1);`; 
        if(star_quantity > 0) exchangeQuery += mysql.format(currentQuery, [userkey, star_quantity]);

        // 코인 획득 
        currentQuery = `CALL pier.sp_insert_user_property(?, 'coin', ?, 'coin_exchange');`; //코인 환전 
        const coin = star_quantity + bonus_quantity;
        if(coin > 0) exchangeQuery += mysql.format(currentQuery, [userkey, coin]);
        
        if(exchangeQuery){

            //환전 내역 
            currentQuery = `
            INSERT INTO user_coin_exchange(userkey, star_quantity, coin_quantity, bonus_quantity, exchange_product_id) 
            VALUES(?, ?, ?, ?, ?);`;
            exchangeQuery += mysql.format(currentQuery, [userkey, star_quantity, coin_quantity, bonus_quantity, exchange_product_id]);

            result = await transactionDB(exchangeQuery); 

            if(!result.state){
                logger.error(`coinExchangePurchase error 5 ${result.error}`);
                respondDB(res, 80026, result.error);
                return;                  
            }
        }
 
    }

    const responseData = {};
    responseData.bank = await getUserBankInfo(req.body);

    res.status(200).json(responseData);

    logAction(userkey, "coin_exchange", {
        userkey,
        exchange_product_id
    });
};