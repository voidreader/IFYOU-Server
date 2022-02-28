import mysql from "mysql2/promise";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";


//! 선택지 구매 처리 
export const purchaseSelection = async (req, res) =>{

    logger.info(`purchaseSelection`);

    const {
        body:{
            userkey, 
            project_id, 
            episodeID, 
            selection_group, 
            selection_no,
            price = 0, 
        }
    } = req;

    let result; 
    
    // 이미 있는지 확인
    result = await DB(`SELECT * FROM user_selection_purchase 
    WHERE userkey = ? 
    AND project_id = ?
    AND episode_id = ? 
    AND selection_group = ? 
    AND selection_no = ?;`, [userkey, project_id, episodeID, selection_group, selection_no]); 
    if(!result.state || result.row.length > 0){
        logger.error(`purchaseSelection error`);
        respondDB(res, 80025);
        return;
    }
   
};