import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { 
  respondDB,
} from "../respondent";
import { getUserBankInfo } from "./bankController";


//! 레벨 처리 
export const updateUserLevelProcess = async(req, res) =>{

    const {
      body:{
        userkey, 
        current_level, 
        current_experience,
        experience = 0,  
        route = "", 
        clear_id = -1, 
        project_id = -1, 
      }
    } = req;

    if(experience === 0){
        logger.error(`updateUserLevelProcess error`);
        respondDB(res, 80019);
        return;
    }
  
    const responseData = {};
    let currentQuery = ``; 
    let insertQuery = ``;
    let updateQuery = ``;
    let sendQuery = ``;  
  
  
    //* 다음 레벨 목표 경험치, 재화, 개수 가져오기 
    let result = await DB(`
    SELECT experience 
    , currency
    , quantity 
    FROM com_level_management 
    WHERE next_level = ?;
    `, [current_level+1]);
    const next_experience = result.row[0].experience; 
    const next_currency = result.row[0].currency; 
    const next_quantity = result.row[0].quantity; 
  
    //* 경험치 쌓기, 레벨업 처리 
    let target_level = 0;
    let target_experience = 0;
    let target_currency = ``; 
    if(next_experience <= (current_experience + experience)){ //레벨업 하는 경우
      target_level = current_level + 1; 
      target_experience = (current_experience + experience) - next_experience; 
      target_currency = next_currency; 
    }else{ 
      target_level = current_level; 
      target_experience = current_experience + experience; 
    }
  
    //* 레벨 히스토리 누적
    currentQuery = `
    INSERT INTO user_level_history(userkey, current_level, experience, route, clear_id, project_id, currency ) 
    VALUES(?, ?, ?, ?, ?, ?, ?);`; 
    insertQuery = mysql.format(currentQuery, [userkey, current_level, experience, route, clear_id, project_id, target_currency]); 
  
    //* 계정 테이블 업데이트 
    currentQuery = `
    UPDATE table_account 
    SET current_level = ?
    , current_experience = ? 
    WHERE userkey = ?;`;
    updateQuery = mysql.format(currentQuery, [target_level, target_experience, userkey]);
  
    if(target_currency){
      //* 메일 발송(레벨업이면 메일 발송)
      currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
      VALUES(?, 'levelup', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), ?);`;
      sendQuery = mysql.format(currentQuery, [userkey, target_currency, next_quantity, project_id]);
    }
  
    result = await transactionDB(`
    ${insertQuery}
    ${updateQuery}
    ${sendQuery}
    `); 
    if(!result.state){
      logger.error(`updateUserLevelProcess ${result.error}`);
      respondDB(res, 80026, result.error);
      return;    
    }
  
    //* 현재 레벨, 경험치
    result = await DB(`SELECT current_level, current_experience FROM table_account WHERE userkey = ?;`, [userkey]); 
    responseData.current = {
      level : result.row[0].current_level, 
      experience : result.row[0].current_experience,
    };
  
    //* 변경 전 레벨, 경험치 
    responseData.before = {  
      level : current_level, 
      experience : current_experience,
    };
  
    if(target_currency){ //레벨업을 하는 경우, 보상 재화 전달 
      responseData.reward = {
        currency : next_currency, 
        quantity : next_quantity,
      };
    }
    
    //* 안 읽은 메일 건수 
    const unreadMailResult = await DB(
      `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
      [userkey]
    );
  
    responseData.unreadMailCount = 0;
    if (unreadMailResult.state && unreadMailResult.row.length > 0)
      responseData.unreadMailCount = unreadMailResult.row[0].cnt;
  
    responseData.bank = await getUserBankInfo(req.body);
  
    res.status(200).json(responseData);
  
    logAction(userkey, "levelup", { userkey, 
      current_level, 
      current_experience,
      experience,  
      route, 
      clear_id, 
      project_id,  });
  
};
  

//! 레벨 리스트 
export const getLevelList = async(req, res) =>{


    const result = await DB(`
    SELECT 
    next_level
    , experience
    , currency 
    , quantity 
    FROM com_level_management
    ORDER BY next_level; 
    `);

    res.status(200).json(result.row);
};