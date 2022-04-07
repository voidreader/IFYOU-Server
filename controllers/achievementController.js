import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

//! 업적 정보 가져오기
const getAchievementInfo = async (achievement_id) => {
  const result = await DB(
    `
    SELECT
    achievement_type
    , achievement_point
    , gain_point 
    FROM com_achievement
    WHERE achievement_id = ? 
    AND is_use > 0;
    `,
    [achievement_id]
  );

  return result.row;
};

//! 계정 연동
const checkAccountLink = async (userkey, achievement_id) => {
  let resultQuery = ``;

  let result = await DB(
    `SELECT * FROM table_account WHERE userkey = ? AND account_link='link';`,
    [userkey]
  );
  if (result.state && result.row.length > 0) {
    //업적 정보 가져오기
    const achievementInfo = await getAchievementInfo(achievement_id);
    const { gain_point } = achievementInfo[0];

    //클리어 여부 확인
    result = await DB(
      `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ?;`,
      [userkey, achievement_id]
    );
    if (result.state) {
      if (result.row.length === 0) {
        resultQuery = mysql.format(
          `INSERT INTO user_achievement(userkey, achievement_id, gain_point, is_clear, clear_date) VALUES(?, ?, ?, 1, now());`,
          [userkey, achievement_id, gain_point]
        );
      } else if (result.row[0].is_clear === 0) {
        resultQuery = mysql.format(
          `UPDATE user_achievement SET gain_point = ?, is_clear = 1, clear_date = now() WHERE userkey = ? AND achievement_id = ?;`,
          [gain_point, userkey, achievement_id]
        );
      }
    }
  }

  return resultQuery;
};

//! 누적 출석일
const checkLogin = async (userkey, achievement_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  //업적 정보 가져오기
  const achievementInfo = await getAchievementInfo(achievement_id);
  const { achievement_point, gain_point } = achievementInfo[0];

  //시즌 시작했을 때, 출석 체크 초기화
  result = await DB(
    `
    SELECT *
    FROM user_attendance
    WHERE userkey = ? 
    AND (SELECT start_date FROM com_grade_season) <= action_date;
    `,
    [userkey]
  );
  if (result.state) totalCount = result.row.length;

  if (totalCount >= achievement_point) {
    //클리어 여부 확인
    result = await DB(
      `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND is_clear = 0;`,
      [userkey, achievement_id]
    );
    if (result.state) {
      if (result.row.length === 0) {
        resultQuery = mysql.format(
          `INSERT INTO user_achievement(userkey, achievement_id, gain_point, is_clear, clear_date, current_result) VALUES(?, ?, ?, 1, now(), ?);`,
          [userkey, achievement_id, gain_point, totalCount]
        );
      } else if (result.row[0].is_clear === 0) {
        resultQuery = mysql.format(
          `UPDATE user_achievement SET gain_point = ?, is_clear = 1, clear_date = now(), current_result = ? WHERE userkey = ? AND achievement_id = ?;`,
          [gain_point, totalCount, userkey, achievement_id]
        );
      }
    }
  }

  return resultQuery;
};

//! 코인샵 구매
const checkCoinshop = async (userkey, achievement_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  //코인샵 구매 건수
  result = await DB(
    `
    SELECT * 
    FROM user_coin_purchase a, com_currency b
    WHERE a.currency = b.currency
    AND userkey = ?
    AND is_use > 0
    AND b.currency_type in ('bubble', 'standing', 'sticker', 'wallpaper')
    ;`,
    [userkey]
  );
  if (result.state) totalCount = result.row.length;

  if (achievement_id === 3) {
    //비기너

    //업적 정보 가져오기
    const achievementInfo = await getAchievementInfo(achievement_id);
    const { achievement_point, gain_point } = achievementInfo[0];

    if (totalCount >= achievement_point) {
      result = await DB(
        `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ?;`,
        [userkey, achievement_id]
      );
      if (result.state) {
        if (result.row.length === 0) {
          resultQuery = mysql.format(
            `INSERT INTO user_achievement(userkey, achievement_id, gain_point, is_clear, clear_date, current_result) VALUES(?, ?, ?, 1, now(), ?);`,
            [userkey, achievement_id, gain_point, totalCount]
          );
        } else {
          resultQuery = mysql.format(
            `UPDATE user_achievement SET gain_point = ?, is_clear = 1, clear_date = now(), current_result = ? WHERE userkey = ? AND achievement_id = ?;`,
            [gain_point, totalCount, userkey, achievement_id]
          );
        }
      }
    }
  } else {
    //이프유

    result = await DB(
      `
        SELECT 
        achievement_level
        , gain_point 
        FROM com_achievement_level  
        WHERE achievement_id = ? 
        AND achievement_level NOT IN (SELECT achievement_level FROM user_achievement WHERE userkey = ? AND achievement_id = ?)
        AND achievement_point <= ?;
        `,
      [achievement_id, userkey, achievement_id, totalCount]
    );
    if (result.state) {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of result.row) {
        // eslint-disable-next-line no-await-in-loop
        result = await DB(
          `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND achievement_level = ?;`,
          [userkey, achievement_id, item.achievement_level]
        );
        if (result.state) {
          if (result.row.length === 0) {
            resultQuery += mysql.format(
              `
                        INSERT INTO user_achievement(
                            userkey
                            , achievement_id
                            , gain_point
                            , achievement_level
                            , is_clear
                            , clear_date
                            , current_result
                        ) VALUES(
                            ?
                            , ?
                            , ?
                            , ?
                            , 1
                            , now()
                            , ?
                        );`,
              [
                userkey,
                achievement_id,
                item.gain_point,
                item.achievement_level,
                totalCount,
              ]
            );
          } else {
            resultQuery += mysql.format(
              `
                        UPDATE user_achievement 
                        SET gain_point = ?
                        , achievement_level = ?
                        , is_clear = 1
                        , clear_date = now()
                        , current_result = ? 
                        WHERE userkey = ? 
                        AND achievement_id = ?
                        AND achievement_level = ?;`,
              [
                item.gain_point,
                item.achievement_level,
                totalCount,
                userkey,
                achievement_id,
                item.achievement_level,
              ]
            );
          }
        }
      }
    }
  }

  return resultQuery;
};

//! 첫 라이브 일러스트
const checkFirstLiveIllust = async (userkey, achievement_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  //업적 정보 가져오기
  const achievementInfo = await getAchievementInfo(achievement_id);
  const { achievement_point, gain_point } = achievementInfo[0];

  //라이브 일러스트 개수 확인
  result = await DB(
    `SELECT * FROM user_illust WHERE userkey = ? AND illust_type = 'live2d';`,
    [userkey]
  );
  if (result.state) totalCount = result.row.length;

  if (totalCount >= achievement_point) {
    result = await DB(
      `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ?;`,
      [userkey, achievement_id]
    );
    if (result.state) {
      if (result.row.length === 0) {
        resultQuery = mysql.format(
          `
                INSERT INTO user_achievement(
                    userkey
                    , achievement_id
                    , gain_point
                    , is_clear
                    , clear_date
                    , current_result
                ) VALUES(
                    ?
                    , ?
                    , ?
                    , 1
                    , now()
                    , ?
                );`,
          [userkey, achievement_id, gain_point, totalCount]
        );
      } else {
        resultQuery = mysql.format(
          `
                UPDATE user_achievement 
                SET gain_point = ?
                , is_clear = 1
                , clear_date = now()
                , current_result = ?
                WHERE userkey = ? 
                AND achievement_id = ?;`,
          [gain_point, totalCount, userkey, achievement_id]
        );
      }
    }
  }

  return resultQuery;
};

//! 과금 선택지 구매
const checkPurchaseSelection = async (userkey, achievement_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  //과금 선택지 구매 건수 확인
  result = await DB(
    `SELECT * FROM user_selection_purchase WHERE userkey = ?;`,
    [userkey]
  );
  if (result.state) totalCount = result.row.length;

  if (achievement_id === 5) {
    //비기너

    //업적 정보 가져오기
    const achievementInfo = await getAchievementInfo(achievement_id);
    const { achievement_point, gain_point } = achievementInfo[0];

    if (totalCount >= achievement_point) {
      result = await DB(
        `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ?;`,
        [userkey, achievement_id]
      );
      if (result.state) {
        if (result.row.length === 0) {
          resultQuery = mysql.format(
            `
                    INSERT INTO user_achievement(
                        userkey
                        , achievement_id
                        , gain_point
                        , is_clear
                        , clear_date
                        , current_result
                    ) VALUES(
                        ?
                        , ?
                        , ?
                        , 1
                        , now()
                        , ?
                    );`,
            [userkey, achievement_id, gain_point, totalCount]
          );
        } else {
          resultQuery = mysql.format(
            `
                    UPDATE user_achievement 
                    SET gain_point = ?
                    , current_result = ?
                    , is_clear = 1
                    , clear_date = now() 
                    WHERE userkey = ? 
                    AND achievement_id = ?;`,
            [gain_point, totalCount, userkey, achievement_id]
          );
        }
      }
    }
  } else {
    //이프유

    result = await DB(
      `
        SELECT 
        achievement_level
        , gain_point 
        FROM com_achievement_level  
        WHERE achievement_id = ? 
        AND achievement_level NOT IN (SELECT achievement_level FROM user_achievement WHERE userkey = ? AND achievement_id = ?)
        AND achievement_point <= ?;
        `,
      [achievement_id, userkey, achievement_id, totalCount]
    );
    if (result.state) {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of result.row) {
        // eslint-disable-next-line no-await-in-loop
        result = await DB(
          `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND achievement_level = ?;`,
          [userkey, achievement_id, item.achievement_level]
        );
        if (result.state) {
          if (result.row.length === 0) {
            resultQuery += mysql.format(
              `
                        INSERT INTO user_achievement(
                            userkey
                            , achievement_id
                            , gain_point
                            , achievement_level
                            , is_clear
                            , clear_date
                            , current_result
                        ) VALUES(
                            ?
                            , ?
                            , ?
                            , ?
                            , 1
                            , now()
                            , ?
                        );`,
              [
                userkey,
                achievement_id,
                item.gain_point,
                item.achievement_level,
                totalCount,
              ]
            );
          } else {
            resultQuery += mysql.format(
              `
                        UPDATE user_achievement 
                        SET gain_point = ?
                        , achievement_level = ?
                        , is_clear = 1
                        , clear_date = now()
                        , current_result = ? 
                        WHERE userkey = ? 
                        AND achievement_id = ?
                        AND achievement_level = ?;`,
              [
                item.gain_point,
                item.achievement_level,
                totalCount,
                userkey,
                achievement_id,
                item.achievement_level,
              ]
            );
          }
        }
      }
    }
  }

  return resultQuery;
};

//! 기다무 단축
const checkWaitingCoin = async (userkey, achievement_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  //기다무 단축 건수 확인
  result = await DB(
    `
    SELECT * 
    FROM gamelog.log_action 
    WHERE userkey = ? 
    AND action_type ='waitingOpenCoin'
    AND CAST(JSON_EXTRACT(log_data, '$.price') AS UNSIGNED integer) <> 0;`,
    [userkey]
  );
  if (result.state) totalCount = result.row.length;

  if (achievement_id === 6) {
    //비기너

    //업적 정보 가져오기
    const achievementInfo = await getAchievementInfo(achievement_id);
    const { achievement_point, gain_point } = achievementInfo[0];

    if (totalCount >= achievement_point) {
      result = await DB(
        `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ?;`,
        [userkey, achievement_id]
      );
      if (result.state) {
        if (result.row.length === 0) {
          resultQuery = mysql.format(
            `
                    INSERT INTO user_achievement(
                        userkey
                        , achievement_id
                        , gain_point
                        , is_clear
                        , clear_date
                        , current_result
                    ) VALUES(
                        ?
                        , ?
                        , ?
                        , 1
                        , now()
                        , ?
                    );`,
            [userkey, achievement_id, gain_point, totalCount]
          );
        } else {
          resultQuery = mysql.format(
            `
                    UPDATE user_achievement 
                    SET gain_point = ?
                    , current_result = ?
                    , is_clear = 1
                    , clear_date = now() 
                    WHERE userkey = ? 
                    AND achievement_id = ?;`,
            [gain_point, totalCount, userkey, achievement_id]
          );
        }
      }
    }
  } else {
    //이프유

    result = await DB(
      `
        SELECT 
        achievement_level
        , gain_point 
        FROM com_achievement_level  
        WHERE achievement_id = ? 
        AND achievement_level NOT IN (SELECT achievement_level FROM user_achievement WHERE userkey = ? AND achievement_id = ?)
        AND achievement_point <= ?;
        `,
      [achievement_id, userkey, achievement_id, totalCount]
    );
    if (result.state) {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of result.row) {
        // eslint-disable-next-line no-await-in-loop
        result = await DB(
          `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND achievement_level = ?;`,
          [userkey, achievement_id, item.achievement_level]
        );
        if (result.state) {
          if (result.row.length === 0) {
            resultQuery += mysql.format(
              `
                        INSERT INTO user_achievement(
                            userkey
                            , achievement_id
                            , gain_point
                            , achievement_level
                            , is_clear
                            , clear_date
                            , current_result
                        ) VALUES(
                            ?
                            , ?
                            , ?
                            , ?
                            , 1
                            , now()
                            , ?
                        );`,
              [
                userkey,
                achievement_id,
                item.gain_point,
                item.achievement_level,
                totalCount,
              ]
            );
          } else {
            resultQuery += mysql.format(
              `
                        UPDATE user_achievement 
                        SET gain_point = ?
                        , achievement_level = ?
                        , is_clear = 1
                        , clear_date = now()
                        , current_result = ? 
                        WHERE userkey = ? 
                        AND achievement_id = ?
                        AND achievement_level = ?;`,
              [
                item.gain_point,
                item.achievement_level,
                totalCount,
                userkey,
                achievement_id,
                item.achievement_level,
              ]
            );
          }
        }
      }
    }
  }

  return resultQuery;
};

//! 올클리어
const checkAllClear = async (userkey, achievement_id, project_id) => {
  let resultQuery = ``;
  let result = ``;

  //업적 정보 가져오기
  const achievementInfo = await getAchievementInfo(achievement_id);
  const { gain_point } = achievementInfo[0];

  result = await DB(
    `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND is_clear = 0;`,
    [userkey, achievement_id]
  );
  if (result.state) {
    if (result.row.length === 0) {
      resultQuery += mysql.format(
        `INSERT INTO user_achievement(userkey, achievement_id, gain_point, current_result, is_clear, clear_date) VALUES(?, ?, ?, 1, now());`,
        [userkey, achievement_id, gain_point, project_id]
      );
    } else {
      resultQuery += mysql.format(
        `UPDATE user_achievement SET gain_point = ?, current_result = ?, is_clear = 1, clear_date = now() WHERE userkey = ? AND achievement_id = ?;`,
        [gain_point, project_id, userkey, achievement_id]
      );
    }
  }

  return resultQuery;
};

//! 히든 엔딩 도달 횟수
const checkHiddenEndingCount = async (userkey, achievement_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  //히든 엔딩 도달 횟수
  result = await DB(
    `
    SELECT * FROM user_ending 
    WHERE userkey = ? 
    AND episode_id IN (SELECT episode_id FROM list_episode WHERE episode_type = 'ending' AND ending_type = 'hidden');`,
    [userkey]
  );
  if (result.state) totalCount = result.row.length;

  result = await DB(
    `
    SELECT 
    achievement_level
    , gain_point 
    FROM com_achievement_level  
    WHERE achievement_id = ? 
    AND achievement_level NOT IN (SELECT achievement_level FROM user_achievement WHERE userkey = ? AND achievement_id = ?)
    AND achievement_point <= ?;
    `,
    [achievement_id, userkey, achievement_id, totalCount]
  );
  if (result.state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      // eslint-disable-next-line no-await-in-loop
      result = await DB(
        `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND achievement_level = ?;`,
        [userkey, achievement_id, item.achievement_level]
      );
      if (result.state) {
        if (result.row.length === 0) {
          resultQuery += mysql.format(
            `
                    INSERT INTO user_achievement(
                        userkey
                        , achievement_id
                        , gain_point
                        , achievement_level
                        , is_clear
                        , clear_date
                        , current_result
                    ) VALUES(
                        ?
                        , ?
                        , ?
                        , ?
                        , 1
                        , now()
                        , ?
                    );`,
            [
              userkey,
              achievement_id,
              item.gain_point,
              item.achievement_level,
              totalCount,
            ]
          );
        } else {
          resultQuery += mysql.format(
            `
                    UPDATE user_achievement 
                    SET gain_point = ?
                    , achievement_level = ?
                    , is_clear = 1
                    , clear_date = now()
                    , current_result = ? 
                    WHERE userkey = ? 
                    AND achievement_id = ?
                    AND achievement_level = ?;`,
            [
              item.gain_point,
              item.achievement_level,
              totalCount,
              userkey,
              achievement_id,
              item.achievement_level,
            ]
          );
        }
      }
    }
  }

  return resultQuery;
};

//! 스타/코인 소모
const checkCurrencyUse = async (userkey, achievement_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;
  let currency = ``;

  if (achievement_id === 10) currency = "gem";
  else currency = "coin";

  //소모량 확인
  result = await DB(
    `SELECT ifnull(sum(quantity), 0) total FROM gamelog.log_property WHERE userkey = ? AND log_type = 'use' AND currency = ?;`,
    [userkey, currency]
  );
  if (result.state) totalCount = result.row[0].totalCount;

  result = await DB(
    `
    SELECT 
    achievement_level
    , gain_point 
    FROM com_achievement_level  
    WHERE achievement_id = ? 
    AND achievement_level NOT IN (SELECT achievement_level FROM user_achievement WHERE userkey = ? AND achievement_id = ?)
    AND achievement_point <= ?;
    `,
    [achievement_id, userkey, achievement_id, totalCount]
  );
  if (result.state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      // eslint-disable-next-line no-await-in-loop
      result = await DB(
        `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND achievement_level = ?;`,
        [userkey, achievement_id, item.achievement_level]
      );
      if (result.state) {
        if (result.row.length === 0) {
          resultQuery += mysql.format(
            `
                    INSERT INTO user_achievement(
                        userkey
                        , achievement_id
                        , gain_point
                        , achievement_level
                        , is_clear
                        , clear_date
                        , current_result
                    ) VALUES(
                        ?
                        , ?
                        , ?
                        , ?
                        , 1
                        , now()
                        , ?
                    );`,
            [
              userkey,
              achievement_id,
              item.gain_point,
              item.achievement_level,
              totalCount,
            ]
          );
        } else {
          resultQuery += mysql.format(
            `
                    UPDATE user_achievement 
                    SET gain_point = ?
                    , achievement_level = ?
                    , is_clear = 1
                    , clear_date = now()
                    , current_result = ? 
                    WHERE userkey = ? 
                    AND achievement_id = ?
                    AND achievement_level = ?;`,
            [
              item.gain_point,
              item.achievement_level,
              totalCount,
              userkey,
              achievement_id,
              item.achievement_level,
            ]
          );
        }
      }
    }
  }

  return resultQuery;
};

//! 에피소드 클리어
const checkEpisodeClear = async (userkey, achievement_id, episode_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  //에피소듣 클리어 건수 확인
  result = await DB(
    `
    SELECT * 
    FROM gamelog.log_action
    WHERE userkey = ?
    AND action_type = 'episode_clear';
    ;`,
    [userkey]
  );
  if (result.state) totalCount = result.row.length;

  //레벨별 달성 확인
  result = await DB(
    `
    SELECT 
    achievement_level
    , gain_point 
    FROM com_achievement_level  
    WHERE achievement_id = ? 
    AND achievement_level NOT IN (SELECT achievement_level FROM user_achievement WHERE userkey = ? AND achievement_id = ?)
    AND achievement_point <= ?;
    `,
    [achievement_id, userkey, achievement_id, totalCount]
  );
  if (result.state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      // eslint-disable-next-line no-await-in-loop
      result = await DB(
        `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND achievement_level = ?;`,
        [userkey, achievement_id, item.achievement_level]
      );
      if (result.state) {
        if (result.row.length === 0) {
          resultQuery += mysql.format(
            `
                    INSERT INTO user_achievement(
                        userkey
                        , achievement_id
                        , gain_point
                        , achievement_level
                        , is_clear
                        , clear_date
                        , current_result
                    ) VALUES(
                        ?
                        , ?
                        , ?
                        , ?
                        , 1
                        , now()
                        , ?
                    );`,
            [
              userkey,
              achievement_id,
              item.gain_point,
              item.achievement_level,
              episode_id,
            ]
          );
        } else {
          resultQuery += mysql.format(
            `
                    UPDATE user_achievement 
                    SET gain_point = ?
                    , achievement_level = ?
                    , is_clear = 1
                    , clear_date = now()
                    , current_result = ? 
                    WHERE userkey = ? 
                    AND achievement_id = ?
                    AND achievement_level = ?;`,
            [
              item.gain_point,
              item.achievement_level,
              episode_id,
              userkey,
              achievement_id,
              item.achievement_level,
            ]
          );
        }
      }
    }
  }

  return resultQuery;
};

//선택지 고른 횟수
const checkSelectionCount = async (userkey, achievement_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  //현재 선택지, 과거 선택지 개수
  result = await DB(
    `
    SELECT 
    userkey, project_id, play_count, count(*) total
    FROM user_selection_current
    WHERE userkey = ?
    UNION
    SELECT 
    userkey, project_id, play_count, count(*) total
    from user_selection_ending
    WHERE userkey = ?
    GROUP BY userkey, project_id, play_count; 
    ;`,
    [userkey, userkey]
  );
  if (result.state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      totalCount += item.total;
    }
  }

  //레벨별 달성 확인
  result = await DB(
    `
    SELECT 
    achievement_level
    , gain_point 
    FROM com_achievement_level  
    WHERE achievement_id = ? 
    AND achievement_level NOT IN (SELECT achievement_level FROM user_achievement WHERE userkey = ? AND achievement_id = ?)
    AND achievement_point <= ?;
    `,
    [achievement_id, userkey, achievement_id, totalCount]
  );
  if (result.state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      // eslint-disable-next-line no-await-in-loop
      result = await DB(
        `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND achievement_level = ?;`,
        [userkey, achievement_id, item.achievement_level]
      );
      if (result.state) {
        if (result.row.length === 0) {
          resultQuery += mysql.format(
            `
                    INSERT INTO user_achievement(
                        userkey
                        , achievement_id
                        , gain_point
                        , achievement_level
                        , is_clear
                        , clear_date
                        , current_result
                    ) VALUES(
                        ?
                        , ?
                        , ?
                        , ?
                        , 1
                        , now()
                        , ?
                    );`,
            [
              userkey,
              achievement_id,
              item.gain_point,
              item.achievement_level,
              totalCount,
            ]
          );
        } else {
          resultQuery += mysql.format(
            `
                    UPDATE user_achievement 
                    SET gain_point = ?
                    , achievement_level = ?
                    , is_clear = 1
                    , clear_date = now()
                    , current_result = ? 
                    WHERE userkey = ? 
                    AND achievement_id = ?
                    AND achievement_level = ?;`,
            [
              item.gain_point,
              item.achievement_level,
              totalCount,
              userkey,
              achievement_id,
              item.achievement_level,
            ]
          );
        }
      }
    }
  }

  return resultQuery;
};

//! 프리미엄패스 구매
const checkPremium = async (userkey, achievement_id, project_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  //업적 정보 가져오기
  const achievementInfo = await getAchievementInfo(achievement_id);
  const { achievement_point, gain_point } = achievementInfo[0];

  result = await DB(
    `
    SELECT *
    FROM user_property
    WHERE userkey = ? 
    AND currency = 'Free${project_id}';
    `,
    [userkey]
  );
  if (result.state) totalCount = result.row.length;

  if (totalCount === achievement_point) {
    result = await DB(
      `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND is_clear = 0;`,
      [userkey, achievement_id]
    );
    if (result.state) {
      if (result.row.length === 0)
        resultQuery = mysql.format(
          `
                INSERT INTO user_achievement(
                    userkey
                    , achievement_id
                    , gain_point
                    , is_clear
                    , clear_date 
                    , current_result
                ) VALUES(
                    ?
                    , ?
                    , ?
                    , 1
                    , now()
                    , ?
                );`,
          [userkey, achievement_id, gain_point, project_id]
        );
      else
        resultQuery = mysql.format(
          `
                UPDATE user_achievement 
                SET gain_point = ?
                , is_clear = 1 
                , clear_date = now()
                , current_result = ?
                WHERE userkey = ? 
                AND achievement_id = ?
                AND is_clear = 0;`,
          [gain_point, project_id, userkey, achievement_id]
        );
    }
  }

  return resultQuery;
};

//! 리셋
const checkReset = async (userkey, achievement_id, episode_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  if (achievement_id === 16) {
    //처음부터 리셋

    //업적 정보 가져오기
    const achievementInfo = await getAchievementInfo(achievement_id);
    const { gain_point } = achievementInfo[0];

    result = await DB(
      `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND is_clear = 0;`,
      [userkey, achievement_id]
    );
    if (result.state) {
      if (result.row.length === 0) {
        resultQuery = mysql.format(
          `INSERT INTO user_achievement(userkey, achievement_id, gain_point, current_result, is_clear, clear_date) VALUES(?, ?, ?, 1, now());`,
          [userkey, achievement_id, gain_point, episode_id]
        );
      } else {
        resultQuery = mysql.format(
          `UPDATE user_achievement SET gain_point = ?, current_result = ?, is_clear = 1, clear_date = now() WHERE userkey = ? AND achievement_id = ?;`,
          [gain_point, episode_id, userkey, achievement_id]
        );
      }
    }
  } else {
    //그냥 리셋

    result = await DB(
      `
        SELECT * 
        FROM gamelog.log_action 
        WHERE userkey = ? 
        AND action_type ='reset_progress';`,
      [userkey]
    );
    if (result.state) totalCount = result.row.length;

    result = await DB(
      `
        SELECT 
        achievement_level
        , gain_point 
        FROM com_achievement_level  
        WHERE achievement_id = ? 
        AND achievement_level NOT IN (SELECT achievement_level FROM user_achievement WHERE userkey = ? AND achievement_id = ?)
        AND achievement_point <= ?;
        `,
      [achievement_id, userkey, achievement_id, totalCount]
    );
    if (result.state) {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of result.row) {
        // eslint-disable-next-line no-await-in-loop
        result = await DB(
          `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND achievement_level = ?;`,
          [userkey, achievement_id, item.achievement_level]
        );
        if (result.state) {
          if (result.row.length === 0) {
            resultQuery += mysql.format(
              `
                        INSERT INTO user_achievement(
                            userkey
                            , achievement_id
                            , gain_point
                            , achievement_level
                            , is_clear
                            , clear_date
                            , current_result
                        ) VALUES(
                            ?
                            , ?
                            , ?
                            , ?
                            , 1
                            , now()
                            , ?
                        );`,
              [
                userkey,
                achievement_id,
                item.gain_point,
                item.achievement_level,
                totalCount,
              ]
            );
          } else {
            resultQuery += mysql.format(
              `
                        UPDATE user_achievement 
                        SET gain_point = ?
                        , achievement_level = ?
                        , is_clear = 1
                        , clear_date = now()
                        , current_result = ? 
                        WHERE userkey = ? 
                        AND achievement_id = ?
                        AND achievement_level = ?;`,
              [
                item.gain_point,
                item.achievement_level,
                totalCount,
                userkey,
                achievement_id,
                item.achievement_level,
              ]
            );
          }
        }
      }
    }
  }

  return resultQuery;
};

//! 스탠딩 구매 횟수
export const checkStanding = async (userkey, achievement_id) => {
  let resultQuery = ``;
  let result = ``;
  let totalCount = 0;

  //업적 정보 가져오기
  const achievementInfo = await getAchievementInfo(achievement_id);
  const { gain_point } = achievementInfo[0];

  //스탠딩 구매 건수
  result = await DB(
    `
    SELECT * FROM user_coin_purchase 
    WHERE userkey = ? 
    AND currency IN (SELECT currency FROM com_currency WHERE currency_type = 'standing' AND is_use = 1);
    `,
    [userkey]
  );
  totalCount = result.row.length;

  result = await DB(
    `SELECT * FROM user_achievement WHERE userkey = ? AND achievement_id = ? AND is_clear = 0;`,
    [userkey, achievement_id]
  );
  if (result.state) {
    if (result.row.length === 0)
      resultQuery = mysql.format(
        `
            INSERT INTO user_achievement(
                userkey
                , achievement_id
                , gain_point
                , is_clear
                , clear_date
                , current_result
            ) VALUES(
                ?
                , ?
                , ?
                , 1
                , now()
                , ?
            );`,
        [userkey, achievement_id, gain_point, totalCount]
      );
    else
      resultQuery = mysql.format(
        `
            UPDATE user_achievement 
            SET gain_point = ?
            , is_clear = 1 
            , clear_date = now()
            , current_result = ?
            WHERE userkey = ? 
            AND achievement_id = ?
            AND is_clear = 0;`,
        [gain_point, totalCount, userkey, achievement_id]
      );
  }

  return resultQuery;
};

//! 업적 메인 함수
export const requestAchievementMain = async (req, res) => {
  const {
    body: {
      userkey = -1,
      achievement_id = -1,
      project_id = -1,
      episode_id = -1,
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

  if (achievement_id === 1) {
    //계정 연동
    if (validCheck) query = await checkAccountLink(userkey, achievement_id);
  } else if (achievement_id === 2 || achievement_id === 7) {
    //누적 출석일
    if (validCheck) query = await checkLogin(userkey, achievement_id);
  } else if (achievement_id === 3 || achievement_id === 19) {
    //코인샵 아이템(3회, 레벨)
    if (validCheck) query = await checkCoinshop(userkey, achievement_id);
  } else if (achievement_id === 4) {
    //첫 라이브 일러스트 발견
    if (validCheck) query = await checkFirstLiveIllust(userkey, achievement_id);
  } else if (achievement_id === 5 || achievement_id === 20) {
    //과금 선택지 구매(5회, 레벨)
    if (validCheck)
      query = await checkPurchaseSelection(userkey, achievement_id);
  } else if (achievement_id === 6 || achievement_id === 14) {
    //기다무 시간 단축(싱글, 레벨, 튜토리얼 제외)
    if (validCheck) query = await checkWaitingCoin(userkey, achievement_id);
  } else if (achievement_id === 8) {
    //올 클리어
    query = await checkAllClear(userkey, achievement_id, project_id);
  } else if (achievement_id === 9) {
    //히든 엔딩 도달 횟수
    query = await checkHiddenEndingCount(userkey, achievement_id);
  } else if (achievement_id === 10 || achievement_id === 11) {
    //코인/스타 누적 소모
    query = await checkCurrencyUse(userkey, achievement_id);
  } else if (achievement_id === 12) {
    //에피소드 클리어
    query = await checkEpisodeClear(userkey, achievement_id, episode_id);
  } else if (achievement_id === 13) {
    //선택지 고른 횟수
    query = await checkSelectionCount(userkey, achievement_id);
  } else if (achievement_id === 15) {
    //프리미엄 패스 구매
    query = await checkPremium(userkey, achievement_id, project_id);
  } else if (achievement_id === 16 || achievement_id === 17) {
    //리셋(처음부터, 그냥 리셋)
    query = await checkReset(userkey, achievement_id, episode_id);
  } else if (achievement_id === 21) {
    //스탠딩 구매 횟수
    query = await checkStanding(userkey, achievement_id);
  }

  console.log(query);

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
        body:{
            userkey, 
            lang = "KO", 
        }
    } = req;

    const responseData = {};
    let result = ``;

    //계정 등급 및 혜택 
    result = await DB(`
    SELECT 
    grade 
    , grade_state
    , store_sale add_star
    , store_limit add_star_limit
    , waiting_sale 
    , preview 
    , c.name
    , fn_get_design_info(grade_icon_id, 'url') grade_icon_url
    , fn_get_design_info(grade_icon_id, 'key') grade_icon_key
    FROM table_account a, com_grade b, com_grade_lang c 
    WHERE userkey = ?
    AND a.grade = b.grade
    AND b.grade_id = c. grade_id
    AND c.lang = ?; 
    `, [userkey, lang]);


    //초심자 업적

    //이프유 업적

};

//! 업적 처리 
export const updateUserAchievement = async (req, res) => {

    const {
        body:{
            userkey, 
            achievement_id = -1, 
        }
    } = req;
};
