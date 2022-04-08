import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

//! 레벨 업적 쿼리 
const getLevelQuery = async (userkey, achievement_id) => {

  let resultQuery = ``;
  let result = ``;
  let totalCount = 1;
  let level = 1;

  //최신 레벨 가져오기 
  result = await DB(`
  SELECT 
  a.achievement_level 
  , current_result 
  FROM user_achievement a, com_achievement_level b
  WHERE a.achievement_id = b.achievement_id 
  AND a.achievement_level = b.achievement_level 
  AND userkey = ?
  AND a.achievement_id = ?
  AND a.achievement_level = fn_get_user_achievement_max_level(a.userkey, a.achievement_id)
  ;`, [userkey, achievement_id]);
  if(result.state && result.row.length > 0) {
      
    const { achievement_level, current_result, } = result.row[0];
      
    totalCount = current_result + 1;  //현재값+1
    level = achievement_level;      //현재레벨

    //현재값 업데이트
    resultQuery = mysql.format(`
    UPDATE user_achievement 
    SET current_result = ? 
    WHERE userkey = ? 
    AND achievement_id = ? 
    AND achievement_level = ?;`, [ totalCount, userkey, achievement_id, level ]);      

  }else{
      
    //첫 스타트
    resultQuery = mysql.format(`
    INSERT INTO user_achievement(
      userkey
      , achievement_id
      , achievement_level
      , current_result
    ) VALUES(
      ?
      , ?
      , ?
      , ?
    );`, [ userkey, achievement_id, level, totalCount]);

  }

  return resultQuery;
};

//! 싱글/반복 업적 쿼리 
const getAchievementQuery = async ( userkey, achievement_id ) => {
  
  let resultQuery = ``;
  let result = ``;
  let totalCount = 1;

  //최신 레벨 가져오기 
  result = await DB(`
  SELECT 
  a.achievement_no
  , current_result 
  FROM user_achievement a, com_achievement b
  WHERE a.achievement_id = b.achievement_id 
  AND userkey = ?
  AND a.achievement_id = ?
  ORDER BY a.achievement_no DESC
  LIMIT 1;`, [userkey, achievement_id]);
  if(result.state && result.row.length > 0) {
      
    const { achievement_no, current_result, } = result.row[0];
      
    totalCount = current_result + 1;  //현재값+1

    //현재값 업데이트
    resultQuery = mysql.format(`
    UPDATE user_achievement 
    SET current_result = ? 
    WHERE achievement_no = ?;`, [ totalCount, achievement_no ]);      

  }else{
      
    //첫 스타트
    resultQuery = mysql.format(`
    INSERT INTO user_achievement(
      userkey
      , achievement_id
      , current_result
    ) VALUES(
      ?
      , ?
      , ?
      , ?
    );`, [ userkey, achievement_id, totalCount]);

  }

  return resultQuery;
};

//! 업적 메인 함수
export const requestAchievementMain = async (req, res) => {
  const {
    body: {
      userkey = -1,
      achievement_id = -1,
    },
  } = req;

  if (userkey === -1 || achievement_id === -1) {
    logger.error(`requestAchievementMain Error`);
    respondDB(res, 80019);
    return;
  }

  const responseData = {};

  let validCheck = true;
  let query = ``;
  let result = ``;

  if ( // 레벨
    achievement_id === 9 || 
    achievement_id === 10 || 
    achievement_id === 11 || 
    achievement_id === 12 || 
    achievement_id === 13 || 
    achievement_id === 14 || 
    achievement_id === 17 || 
    achievement_id === 19 || 
    achievement_id === 20 
  ) {
    query = await getLevelQuery(userkey, achievement_id);
  }else if (  // 반복
    achievement_id === 1 || 
    achievement_id === 2 || 
    achievement_id === 3 || 
    achievement_id === 4 || 
    achievement_id === 5 || 
    achievement_id === 6 ||
    achievement_id === 7 || 
    achievement_id === 15 || 
    achievement_id === 16 || 
    achievement_id === 21 
  ){
    query = await getAchievementQuery(userkey, achievement_id);
  }

  //console.log(query);

  if (query) {
    result = await transactionDB(query);
    if (!result.state) {
      logger.error(`requestAchievementMain Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  } else validCheck = false;

  responseData.achievement = {
    achievement_id,
    is_success: !validCheck ? 0 : 1, // 업적누적 성공/실패여부
  };

  res.status(200).json(responseData);
};