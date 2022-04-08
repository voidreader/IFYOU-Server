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
  result = await DB(
    `
  SELECT 
  a.achievement_level 
  , current_result 
  FROM user_achievement a, com_achievement_level b
  WHERE a.achievement_id = b.achievement_id 
  AND a.achievement_level = b.achievement_level 
  AND userkey = ?
  AND a.achievement_id = ?
  AND a.achievement_level = fn_get_user_achievement_max_level(a.userkey, a.achievement_id)
  ;`,
    [userkey, achievement_id]
  );
  if (result.state && result.row.length > 0) {
    const { achievement_level, current_result } = result.row[0];

    totalCount = current_result + 1; //현재값+1
    level = achievement_level; //현재레벨

    //현재값 업데이트
    resultQuery = mysql.format(
      `
    UPDATE user_achievement 
    SET current_result = ? 
    WHERE userkey = ? 
    AND achievement_id = ? 
    AND achievement_level = ?;`,
      [totalCount, userkey, achievement_id, level]
    );
  } else {
    //첫 스타트
    resultQuery = mysql.format(
      `
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
    );`,
      [userkey, achievement_id, level, totalCount]
    );
  }

  return resultQuery;
};

//! 싱글/반복 업적 쿼리
const getAchievementQuery = async (userkey, achievement_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 1;

  //최신 레벨 가져오기
  result = await DB(
    `
  SELECT 
  a.achievement_no
  , current_result 
  FROM user_achievement a, com_achievement b
  WHERE a.achievement_id = b.achievement_id 
  AND userkey = ?
  AND a.achievement_id = ?
  ORDER BY a.achievement_no DESC
  LIMIT 1;`,
    [userkey, achievement_id]
  );
  if (result.state && result.row.length > 0) {
    const { achievement_no, current_result } = result.row[0];

    totalCount = current_result + 1; //현재값+1

    //현재값 업데이트
    resultQuery = mysql.format(
      `
    UPDATE user_achievement 
    SET current_result = ? 
    WHERE achievement_no = ?;`,
      [totalCount, achievement_no]
    );
  } else {
    //첫 스타트
    resultQuery = mysql.format(
      `
    INSERT INTO user_achievement(
      userkey
      , achievement_id
      , current_result
    ) VALUES(
      ?
      , ?
      , ?
    );`,
      [userkey, achievement_id, totalCount]
    );
  }

  return resultQuery;
};

//! 업적 메인 함수
export const requestAchievementMain = async (req, res) => {
  const {
    body: { userkey = -1, achievement_id = -1 },
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

  if (
    // 레벨
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
  } else if (
    // 반복
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
  ) {
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

//! 계정 등급
export const requestUserGradeInfo = async (req, res) => {
  const {
    body: { userkey, lang = "KO" },
  } = req;

  const responseData = {};
  let result = ``;

  //계정 등급 및 혜택
  result = await DB(
    `
  SELECT 
  a.grade
  , fn_get_design_info(grade_icon_id, 'url') grade_icon_url
  , fn_get_design_info(grade_icon_id, 'key') grade_icon_key
  , c.name
  , current_achievement
  , keep_point
  , upgrade_point 
  , abs(TIMESTAMPDIFF(DAY, (SELECT end_date FROM com_grade_season), now())) remain_day
  , store_sale add_star
  , store_limit add_star_limit
  , waiting_sale 
  , preview 
  FROM table_account a, com_grade b, com_grade_lang c 
  WHERE userkey = ?
  AND a.grade = b.grade
  AND b.grade_id = c.grade_id
  AND c.lang = ?; 
  `,
    [userkey, lang]
  );
  responseData.grade = result.row;

  //초심자 업적
  result = await DB(
    `
  SELECT 
  b.achievement_id
  , c.name 
  , achievement_icon_id
  , fn_get_design_info(achievement_icon_id, 'url') achievement_icon_url 
  , fn_get_design_info(achievement_icon_id, 'key') achievement_icon_key
  , CASE WHEN current_result > 0 THEN a.current_result ELSE 0 END current_point 
  , b.achievement_point
  , c.surmmary summary
  , b.gain_point experience
  , ifnull(a.is_clear, 0) is_clear
  FROM user_achievement a RIGHT JOIN com_achievement b ON a.achievement_id = b.achievement_id AND userkey = ? 
  INNER JOIN com_achievement_lang c ON b.achievement_id = c.achievement_id AND lang = ?
  WHERE b.achievement_id < 7 ;
  `,
    [userkey, lang]
  );
  responseData.single = result.row;

  //이프유 업적 - Level
  result = await DB(
    `
    SELECT a.achievement_id 
    , a.achievement_type 
    , fn_get_achievement_level_info(a.achievement_id, ifnull(ua.achievement_level, 1), 'gain_point') experience -- exp
    , fn_get_achievement_level_info(a.achievement_id, ifnull(ua.achievement_level, 1), 'achievement_point') achievement_point
    , fn_get_achievement_info(a.achievement_id, '${lang}', 'name') name
    , CASE WHEN a.achievement_type = 'repeat' THEN 0
           ELSE ifnull(ua.achievement_level, 1) END current_level -- 레벨 
    , ifnull(ua.current_result, 0) current_point
    , ifnull(ua.is_clear, 0) is_clear
    , a.achievement_icon_id 
    , fn_get_design_info(achievement_icon_id, 'url') achievement_icon_url 
    , fn_get_design_info(achievement_icon_id, 'key') achievement_icon_key
    , fn_get_achievement_info(a.achievement_id, '${lang}', 'summary') summary 
 FROM com_achievement a
   LEFT OUTER JOIN user_achievement ua ON a.achievement_id = ua.achievement_id AND ua.userkey = ${userkey} AND ua.achievement_level = fn_get_user_achievement_max_level(ua.userkey, a.achievement_id)
WHERE a.achievement_kind <> 'beginner'
  AND a.achievement_type = 'level'
  ORDER BY a.achievement_id
;
  `
  );
  responseData.level = result.row;

  // IFYOU 업적 - Repeat
  result = await DB(`
  SELECT a.achievement_id 
  , a.achievement_type 
  , a.gain_point experience -- exp
  , a.achievement_point  achievement_point
  , fn_get_achievement_info(a.achievement_id, '${lang}', 'name') name
  , 0 current_level
  , ifnull(ua.current_result, 0) current_point
  , ifnull(ua.is_clear, 0) is_clear
  , a.achievement_icon_id 
  , fn_get_design_info(achievement_icon_id, 'url') achievement_icon_url 
  , fn_get_design_info(achievement_icon_id, 'key') achievement_icon_key
  , fn_get_achievement_info(a.achievement_id, '${lang}', 'summary') summary 
FROM com_achievement a
 LEFT OUTER JOIN user_achievement ua ON a.achievement_id = ua.achievement_id AND ua.userkey = ${userkey} AND ua.achievement_no = fn_get_user_achievement_max_no(ua.userkey, a.achievement_id)
WHERE a.achievement_kind <> 'beginner'
AND a.achievement_type = 'repeat'
ORDER BY a.achievement_id 
;
  `);

  responseData.repeat = result.row;

  res.status(200).json(responseData);
};

//! 업적 처리
export const updateUserAchievement = async (req, res) => {
  const {
    body: { userkey, achievement_id = -1 },
  } = req;
};
