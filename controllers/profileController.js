import mysql from "mysql2/promise";
import { logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { 
  respondDB,
} from "../respondent";
import {
  getProfileCurrencyCurrent,
} from "./accountController";


//! 프로필 꾸미기 저장 
export const userProfileSave = async (req, res) =>{
    
    logger.info(`userProfileSave`);

    const {
        body:{
            userkey, 
            currencyList, 
            textList, 
        }
    } = req;

    let insertQuery = ``; 
    let currentQuery = ``; 

    //* 프로필 재화 저장 
    if(currencyList){
        
        currentQuery = `
        INSERT INTO user_profile_currency(userkey, currency, sorting_order, pos_x, pos_y, width, height, angle)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);
        `;

        // eslint-disable-next-line no-restricted-syntax
        for(const item of currencyList){
            insertQuery += mysql.format(currentQuery, 
            [
            userkey,
            item.currency, 
            item.sorting_order, 
            item.pos_x, 
            item.pos_y, 
            item.width,
            item.height, 
            item.angle
            ]);
        }
    }

    //* 텍스트 저장 
    if(textList){
        
        currentQuery = `
        INSERT INTO user_profile_text(userkey, input_text, font_size, color_rgb, sorting_order, pos_x, pos_y, angle)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);
        `;

        // eslint-disable-next-line no-restricted-syntax
        for(const item of textList){
            
            insertQuery += mysql.format(currentQuery, 
            [
            userkey, 
            item.input_text, 
            item.font_size, 
            item.color_rgb, 
            item.sorting_order, 
            item.pos_x, 
            item.pos_y, 
            item.angle                
            ]);
        }
    }

    //* 기존 데이터를 지우고 새 데이터 insert 
    const result = await transactionDB(`
    DELETE FROM user_profile_currency WHERE userkey = ?; 
    DELETE FROM user_profile_text WHERE userkey =?; 
    ${insertQuery}
    `, [userkey, userkey]);

    if(!result.state){
        logger.error(`userProfileSave error ${result.error}`);
        respondDB(res, 80026, result.error);
        return;
    }

    logAction(userkey, "profile_save", {userkey});
    getProfileCurrencyCurrent(req, res); 
};