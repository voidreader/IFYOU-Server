import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";


//! 업적 정보 가져오기
const getAchievementInfo = async (achievement_id, achievement_level = 0) => {

    let result = ``;
    if(achievement_level === 0){
        result = await DB(`
        SELECT
        achievement_type
        , achievement_point
        , gain_point 
        FROM com_achievement
        WHERE achievement_id = ? 
        AND is_use > 0;
        `, [achievement_id]);
    }else{
        result = await DB(`
        SELECT 
        achievement_point
        , gain_point
        FROM com_achievement_level 
        WHERE achievement_id = ? 
        AND achievement_level = ?;
        `, [achievement_id, achievement_level]);
    }

    return result.row;
};

//! 계정 연동 
const checkAccountLink = async(userkey, achievement_id) => {

    let resultQuery = ``;

    let result = await DB(`SELECT * FROM table_account WHERE userkey = ? AND account_link='link';`, [userkey]);
    if(result.state && result.row.length > 0){

        //업적 정보 가져오기
        const achievementInfo = await getAchievementInfo(achievement_id); 
        const {
            gain_point,
        } = achievementInfo;

        //클리어 여부 확인
        result = await DB(`SELECT is_clear FROM user_achievement WHERE userkey = ? AND achievement_id = ?;`, [userkey, achievement_id]);
        if(result.state){
            if(result.row.length === 0){
                resultQuery = mysql.format(`INSERT INTO user_achievement(userkey, achievement_id, gain_point, is_clear) VALUES(?, ?, ?, 1);`, [userkey, achievement_id, gain_point]);
            }else if(result.row[0].is_clear === 0){
                resultQuery = mysql.format(`UPDATE user_achievement SET gain_point = ?, is_clear = 1, clear_date = now() WHERE userkey = ? AND achievement_id = ?;`, [gain_point, userkey, achievement_id]);
            }
        }
    } 

    return resultQuery;
};

//! 누적 출석일
const checkLogin = async (userkey, achievement_id) => {

    let resultQuery = ``;
    let result = ``;

    //업적 정보 가져오기
    const achievementInfo = await getAchievementInfo(achievement_id); 
    const {
        achievement_point, 
        gain_point,
    } = achievementInfo;

    //날짜 셋팅
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    let achievement_date = `${year}-${month}-${day}`;

    let dataCheck = false; //데이터 유무

    //업적 데이터 있는지 확인
    result = await DB(`SELECT date(achievement_date) achievement_date FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND is_clear = 0;`, [userkey, achievement_id]);
    if(result.state && result.row.length > 0) {
        achievement_date = result.row[0].achievement_date;
        dataCheck = true;
    }

    //출석 체크 처리 
    if(!dataCheck){ 
        resultQuery = mysql.format(`INSERT INTO user_achievement(userkey, achievement_id) VALUES(?, ?);`, [userkey, achievement_id]);
    }else{

        //출석 건수 확인
        result = await DB(`
        SELECT DISTINCT date(action_date) login_date
        FROM gamelog.log_action
        WHERE userkey = ? 
        AND action_type = 'login'
        AND action_date BETWEEN '${achievement_date} 00:00:00' AND now();
        `, [userkey]);
        if(result.state && result.row.length >= achievement_point) {
            resultQuery = mysql.format(`
            UPDATE user_achievement 
            SET gain_point = ?
            , is_clear = 1 
            , clear_date = now()
            WHERE userkey = ? 
            AND achievement_id = ?;`, [
                gain_point
                , userkey
                , achievement_id
            ]);
        }

    }

    return resultQuery;
};

//! 코인샵 구매 
const checkCoinshop = async (userkey, achievement_id) => {
    
    let resultQuery = ``;
    let result = ``;
    
    let achievementInfo = ``;
    let achievement_point = 0;
    let achievement_level = 1; 
    let gain_point = 0;

    let coinPurchaseCnt = 0;

    //업적 정보 가져오기
    if(achievement_id === 3){
        achievementInfo = await getAchievementInfo(achievement_id); 
        achievement_point = achievementInfo.achievement_point;
        gain_point = achievementInfo.gain_point;
    }else{

        //현재 레벨 가져오기 
        result = await DB(`SELECT ifnull(max(achievement_level), 1) current_level FROM user_achievement WHERE userkey = ? AND achievement_id = ?;`, [userkey, achievement_id]);
        if(result.state) achievement_level = result.row[0].current_level;

        achievementInfo = await getAchievementInfo(achievement_id, achievement_level); 
        achievement_point = achievementInfo.achievement_point;
        gain_point = achievementInfo.gain_point;
    }

    //코인샵 구매 건수
    result = await DB(`SELECT * FROM user_coin_purchase WHERE userkey = ?;`, [userkey]);
    if(result.state) coinPurchaseCnt = result.row.length;

    return resultQuery;
};

//! 프리미엄패스 구매
const checkPremium = async (userkey, achievement_id) => {
    
    let resultQuery = ``;
    let result = ``;

    //업적 정보 가져오기
    const achievementInfo = await getAchievementInfo(achievement_id); 
    const {
        achievement_point, 
        gain_point,
    } = achievementInfo;
    
    let dataCheck = false; //데이터 유무

    //업적 데이터 있는지 확인
    result = await DB(`
    SELECT currenet_result 
    FROM user_achievement 
    WHERE userkey = ? 
    AND achievement_id = ?
    ORDER BY achievement_no DESC
    LIMIT 1;
    ;`, [userkey, achievement_id]);
    if(result.state && result.row.length > 0) {
        dataCheck = true;
    }
    
    //프리미엄 구매 처리 
    if(!dataCheck){ 
        resultQuery = mysql.format(`INSERT INTO user_achievement(userkey, achievement_id) VALUES(?, ?);`, [userkey, achievement_id]);
    }else{

    }

    return resultQuery;    
}

//! 업적 메인 함수 
export const requestAchievementMain = async(req, res) =>{

    const {
        body:{
            userkey = -1, 
            achievement_id = -1,
        }
    } = req;

    if(userkey === -1 || achievement_id === -1){
        logger.error(`requestAchievementMain Error`);
        respondDB(res, 80019);
        return;        
    }

    const responseData = {};

    let validCheck = true;
    let query = ``;
    let result = ``;

    if(achievement_id === 1){ //계정 연동          
        query = await checkAccountLink(userkey, achievement_id);
    }else if(achievement_id === 2 || achievement_id === 7){ //누적 출석일 
        
        if(achievement_id === 2){ //클리어 했는지 확인
            result = await DB(`SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND is_clear = 1;`, [userkey, achievement_id]);
            if(result.state && result.row.length > 0) validCheck = false;
        }
        if(validCheck) query = await checkLogin(userkey, achievement_id);
    }else if(achievement_id === 3 || achievement_id === 19){ //코인샵 아이템(3회, 레벨)  

        if(achievement_id === 3){
            result = await DB(`SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND is_clear = 1;`, [userkey, achievement_id]);
            if(result.state && result.row.length > 0) validCheck = false;            
        }
        if(validCheck) query = await checkCoinshop(userkey, achievement_id);
    }else if(achievement_id === 4){ //첫 라이브 일러스트 발견

    }else if(achievement_id === 5 || achievement_id === 20){ //과금 선택지 구매(5회, 레벨)

    }else if(achievement_id === 6 || achievement_id === 14){ //기다무 시간 단축(싱글, 레벨, 튜토리얼 제외)

    }else if(achievement_id === 8){ //올 클리어

    }else if(achievement_id === 9){ //히든 엔딩 도달 횟수

    }else if(achievement_id === 10 || achievement_id === 11){ //코인/스타 누적 소모

    }else if(achievement_id === 12){ //에피소드 클리어

    }else if(achievement_id === 13){ //선택지 고른 횟수

    }else if(achievement_id === 15){ //프리미엄 패스 구매
        query = await checkPremium(userkey, achievement_id);
    }else if(achievement_id === 16 || achievement_id === 17){ //리셋(처음부터, 그냥 리셋)

    }else if(achievement_id === 21){ //스탠딩 구매 횟수

    }

    if(query){
        result = await DB(query); 
        if(!result.state){
            logger.error(`requestAchievementMain Error ${result.error}`);
            respondDB(res, 80026, result.error);
            return;         
        }
    
        responseData.achievement = {
            achievement_id
        };
    }

    res.status(200).json(responseData);
};