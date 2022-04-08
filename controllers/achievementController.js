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

//! 등급, 업적 정보 리스트
const requestUserGradeInfo = async (userkey, lang) => {
  const responseData = {};
  let result = ``;

  //계정 등급 및 혜택
  result = await DB(
    `
  SELECT 
  a.grade
  , c.name
  , grade_experience
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
  WHERE b.achievement_id < 7 
  AND ifnull(a.is_clear, 0) = 0;
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

  return responseData;
};

//! 계정정보 리스트
export const requestAchievementList = async (req, res) => {
  const {
    body: { userkey, lang = "KO" },
  } = req;

  const result = await requestUserGradeInfo(userkey, lang);

  res.status(200).json(result);
};

//! 업적 정보 가져오기
const getAchievementInfo = async (achievement_id, achivement_level = 0) => {
  let result = ``;

  if (achivement_level === 0) {
    result = await DB(
      `
    SELECT 
    achievement_point
    , gain_point
    , achievement_type
    FROM com_achievement
    WHERE achievement_id = ?;
    `,
      [achievement_id]
    );
  } else {
    result = await DB(
      `
    SELECT 
    achievement_point
    , gain_point
    FROM com_achievement_level
    WHERE achievement_id = ? 
    AND achievement_level = ?;
    `,
      [achievement_id, achivement_level]
    );
  }

  return result.row;
};

//! 업적 처리(한개씩 처리 > 연달아서 처리 X)
export const updateUserAchievement = async (req, res) => {
  const {
    body: { userkey, achievement_id = -1, lang = "KO" },
  } = req;

  const responseData = {};

  let achievementInfo = ``;
  let level = 1;
  let experience = 0;
  let total = 0;
  let result = ``;
  let currentQuery = ``;
  let updateQuery = ``;

  result = await DB(
    `
  SELECT 
  achievement_no
  , current_result 
  , achievement_level 
  FROM user_achievement 
  WHERE userkey = ? 
  AND achievement_id = ? 
  AND is_clear = 0 
  ORDER BY achievement_no DESC 
  LIMIT 1;`,
    [userkey, achievement_id]
  );
  if (result.state && result.row.length > 0) {
    currentQuery = `UPDATE user_achievement SET gain_point = ?, is_clear = 1, clear_date = now() WHERE achievement_no = ?;`;

    const { achievement_no, current_result, achievement_level } = result.row[0];

    if (
      //싱글, 반복
      achievement_id === 1 ||
      achievement_id === 2 ||
      achievement_id === 3 ||
      achievement_id === 4 ||
      achievement_id === 5 ||
      achievement_id === 6 ||
      achievement_id === 7 ||
      achievement_id === 8 ||
      achievement_id === 15 ||
      achievement_id === 16 ||
      achievement_id === 21
    ) {
      achievementInfo = await getAchievementInfo(achievement_id); //업적 정보
      const { achievement_point, gain_point, achievement_type } =
        achievementInfo[0];

      if (current_result >= achievement_point) {
        //클리어 처리
        updateQuery = mysql.format(currentQuery, [gain_point, achievement_no]);

        if (achievement_type === "repeat") {
          //반복

          //업적 새로 생성
          total = current_result - achievement_point;
          currentQuery = `INSERT INTO user_achievement(userkey, achievement_id, current_result) VALUES(?, ?, ?);`;
          updateQuery += mysql.format(currentQuery, [
            userkey,
            achievement_id,
            total,
          ]);
        }

        experience = gain_point;
      }
    } else {
      //레벨

      achievementInfo = await getAchievementInfo(
        achievement_id,
        achievement_level
      ); //업적 정보
      const { achievement_point, gain_point } = achievementInfo[0];

      if (current_result >= achievement_point) {
        //클리어 처리
        updateQuery = mysql.format(currentQuery, [gain_point, achievement_no]);

        //업적 새로 생성
        total = current_result - achievement_point;
        level = achievement_level + 1;
        currentQuery = `INSERT INTO user_achievement(userkey, achievement_id, achievement_level, current_result) VALUES(?, ?, ?, ?);`;
        updateQuery += mysql.format(currentQuery, [
          userkey,
          achievement_id,
          level,
          total,
        ]);

        experience = gain_point;
      }
    }
  }

  if (experience === 0) {
    logger.error(`updateUserAchievement Error`);
    respondDB(res, 80019);
    return;
  }

  //경험치 정보
  result = await DB(
    `
  SELECT grade_experience
  FROM table_account a, com_grade b   
  WHERE a.grade = b.grade  
  AND userkey = ?;`,
    [userkey]
  );
  responseData.experience_info = {
    grade_experience: result.row[0].grade_experience, //기존 경험치
    get_experience: experience, //획득한 경험치
  };

  //경험치 업데이트
  currentQuery = `
  UPDATE table_account 
  SET grade_experience = grade_experience + ?
  WHERE userkey = ?;`;
  updateQuery += mysql.format(currentQuery, [experience, userkey]);

  if (updateQuery) {
    result = await transactionDB(updateQuery);

    if (!result.state) {
      logger.error(`updateUserAchievement Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  responseData.list = await requestUserGradeInfo(userkey, lang);

  res.status(200).json(responseData);

  logAction(userkey, "clear_achievement", {
    userkey,
    achievement_id,
    experience,
  });
};
