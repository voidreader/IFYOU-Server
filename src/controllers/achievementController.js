import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

//! 레벨 업적 쿼리
export const getLevelQuery = async (userkey, achievement_id) => {
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
export const getAchievementQuery = async (userkey, achievement_id) => {
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
    body: { userkey = -1, achievement_id = -1, project_id = -1 },
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
    // 싱글/반복
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
    //비기너는 끝났으면 업적 누적 처리 X
    if (
      achievement_id === 1 ||
      achievement_id === 2 ||
      achievement_id === 3 ||
      achievement_id === 4 ||
      achievement_id === 5 ||
      achievement_id === 6
    ) {
      result = await DB(
        `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND is_clear = 1;`,
        [userkey, achievement_id]
      );
      if (result.state && result.row.length > 0) validCheck = false;
    }

    if (validCheck) query = await getAchievementQuery(userkey, achievement_id);
  } else {
    //올 클리어(반복)
    result = await DB(
      `SELECT * FROM user_all_clear WHERE userkey = ? AND project_id = ?;`,
      [userkey, project_id]
    );
    if (result.state && result.row.length > 0) validCheck = false;
    if (validCheck) query = await getAchievementQuery(userkey, achievement_id);
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

  //시즌 끝일, 새시즌 끝일
  result = await DB(
    `SELECT
  CASE WHEN now() >= end_date AND now() < next_start_date THEN 1 ELSE 0 END calculate_check 
  FROM com_grade_season where season_no = 0;  
  `
  );
  responseData.season_check = result.row;

  //계정 등급 및 혜택
  result = await DB(
    `
  SELECT 
  a.grade
  , a.next_grade
  , c2.name -- 
  , grade_experience
  , b2.keep_point -- 
  , b.upgrade_point 
  , abs(TIMESTAMPDIFF(DAY, (SELECT end_date FROM com_grade_season where season_no = 0), now())) remain_day
  , b2.store_sale add_star
  , b2.store_limit add_star_limit
  , fn_get_user_star_benefit_count(${userkey}, a.grade) add_star_use
  , b2.waiting_sale 
  , b2.preview 
  FROM table_account a, com_grade b, com_grade_lang c, com_grade b2, com_grade_lang c2 
  WHERE userkey = ${userkey}
  AND a.next_grade = b.grade
  AND b.grade_id = c.grade_id
  AND a.grade = b2.grade
  AND b2.grade_id = c2.grade_id 
  AND c.lang = '${lang}'
  AND c2.lang = c.lang; 
  `
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
  AND ifnull(a.is_clear, 0) = 0
  AND is_use > 0;
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
  AND is_use > 0
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
AND is_use > 0
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
  let calculate_check = 0;

  //정산 중에 보상 받기를 할 경우
  result = await DB(`SELECT
  CASE WHEN now() >= end_date AND now() < next_start_date THEN 1 ELSE 0 END calculate_check 
  FROM com_grade_season where season_no = 0;`);
  if (result.state && result.row.length > 0)
    calculate_check = result.row[0].calculate_check;

  if (calculate_check > 0) {
    logger.error(`updateUserAchievement Error 1`);
    respondDB(res, 80117);
    return;
  }

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
    logger.error(`updateUserAchievement Error 2`);
    respondDB(res, 80019);
    return;
  }

  //경험치 정보
  result = await DB(
    `
  SELECT a.grade, next_grade, grade_experience
  FROM table_account a, com_grade b   
  WHERE a.grade = b.grade  
  AND userkey = ?;`,
    [userkey]
  );

  responseData.experience_info = {
    grade_experience: result.row[0].grade_experience, //기존 경험치
    get_experience: experience, //획득한 경험치
    total_exp: experience + result.row[0].grade_experience, // 획득한 경험치를 반영한 경험치
  };

  let currentGrade = result.row[0].grade; // * 현재 등급
  if (result.row[0].next_grade > result.row[0].grade)
    currentGrade = result.row[0].next_grade; //*시즌 중에 승급을 했으면, 현재 그레이드는 next_grade로 변경

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

  // 경험치 업데이를 하고, 현재 grade의 max 포인트랑 비교를 해서 지금 현재의
  // 경험치가 max 보다 이상이면 등급업을 시켜줘야한다.
  const maxExpResult = await DB(`
    SELECT a.upgrade_point 
    FROM com_grade a
  WHERE a.grade = ${currentGrade};
  `);

  const maxExp = maxExpResult.row[0].upgrade_point; // max exp
  const currentExp = responseData.experience_info.total_exp; // 현재 상태의 exp
  // responseData.grade_info.upgrade_point = maxExp;

  // 현재 경험치가 맥스 이상이되었음. => 등급업.
  if (currentExp >= maxExp) {
    // * 등급업!
    const upgradeResult = await DB(`
    update table_account
       SET next_grade = next_grade + 1
         , grade_experience = grade_experience - ${maxExp}
     WHERE userkey = ${userkey};
    `);

    if (!upgradeResult.state) {
      logger.error(upgradeResult.error);
    }

    // 등급 오른 경우 total_exp 갱신
    const preTotalExp = responseData.experience_info.total_exp;
    responseData.experience_info.total_exp = preTotalExp - maxExp;
  }

  responseData.list = await requestUserGradeInfo(userkey, lang);

  res.status(200).json(responseData);

  logAction(userkey, "clear_achievement", {
    userkey,
    achievement_id,
    experience,
  });
};
