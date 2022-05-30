/* eslint-disable no-restricted-syntax */
import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

// * 서비스 중인 모든 라이브 프로젝트의 잔존율 수집
export const collectAllProjectRetention = async (req, res) => {
  const {
    body: { start_date, end_date },
  } = req;

  // 모든 프로젝트 조회
  const projects = await DB(
    `select a.project_id from list_project_master a order BY a.project_id;`
  );

  // 기준 유저 데이터 삭제
  // retention 테이블 삭제
  await DB(`
  DELETE FROM gamelog.log_first_episode_user WHERE project_id >= 0;
  DELETE FROM gamelog.log_project_retention WHERE project_id >= 0;
  `);

  // * 작품별
  for await (const item of projects.row) {
    // 대상군 수집
    // 기간내 작품 진입자 먼저 집계
    // 에피소드별 클리어 이용자 집계
    const result = await DB(`
    
    
    INSERT INTO gamelog.log_first_episode_user(project_id, userkey) 
    SELECT DISTINCT CAST(JSON_EXTRACT(la.log_data, '$.project_id') AS UNSIGNED ), la.userkey 
    FROM gamelog.log_action la 
       , list_project_master lpm 
   WHERE la.action_date BETWEEN '${start_date}' AND '${end_date}'
     AND la.action_type = 'project_enter'
     AND lpm.project_id = CAST(JSON_EXTRACT(la.log_data, '$.project_id') AS UNSIGNED )
     AND lpm.project_id = ${item.project_id}
    ; 

       
      
       INSERT INTO gamelog.log_project_retention(project_id, title, episode_id, cnt, start_date, end_date)
       VALUES (${item.project_id}, '작품 로비 진입', -1, fn_get_project_action_unique_user('${start_date}', '${end_date}', 'project_enter', ${item.project_id}), '${start_date}', '${end_date}');
    
    
    
    
    INSERT INTO gamelog.log_project_retention(project_id, title, episode_id, cnt, start_date, end_date)
    SELECT ${item.project_id}
         , CASE WHEN le.episode_type IN ('chapter', 'ending') THEN concat('[',le.episode_type ,'] ', le.chapter_number, '. ', le.title)
                ELSE concat('[',le.episode_type ,'] ', le.title) END title
         , le.episode_id 
         , gamelog.fn_episode_play_unique_user_retention(le.project_id, le.episode_id) user_count
         , '${start_date}'
         , '${end_date}'
    FROM list_episode le 
    WHERE le.project_id = ${item.project_id}
    ORDER BY le.episode_type, le.chapter_number;    
    `);
  } // ? end of for

  res.status(200).send("OK");
};

// * 작품의 에피소드별 리텐션 구하기
export const collectProjectRetention = async (req, res) => {
  const {
    body: { project_id, start_date, end_date },
  } = req;

  let query = ``;

  // 1. 수집 대상 유저 정보 테이블 초기화
  await DB(
    `DELETE FROM gamelog.log_first_episode_user WHERE project_id = ${project_id};`
  );

  // 2. 기간내 대상 프로젝트의 1화 플레이 유저 수집
  const targetUsers = await DB(`
  INSERT INTO gamelog.log_first_episode_user(project_id, userkey) 
  SELECT DISTINCT ueh.project_id, ueh.userkey 
    FROM user_episode_hist ueh
       , list_episode le 
   WHERE ueh.project_id = ${project_id}
     AND ueh.project_id = le.project_id 
     AND ueh.episode_id = le.episode_id 
     AND le.episode_type = 'chapter'
     AND le.chapter_number = 1
     AND ueh.first_play BETWEEN '${start_date}' AND '${end_date} 23:59:59';
  `);

  // 3. 대상 프로젝트의 정규 에피소드 마지막 순번을 구한다.
  const maxChapterNumberResult = await DB(`
  SELECT max(chapter_number) last_number
    FROM list_episode le
   WHERE le.project_id = ${project_id}
     AND le.episode_type = 'chapter';
  `);

  const lastNumber = maxChapterNumberResult.row[0].last_number;

  // 지우고 한다.
  query += mysql.format(
    `DELETE FROM gamelog.log_project_retention a WHERE a.project_id = ${project_id};`
  );

  for (let i = 1; i <= lastNumber; i++) {
    query += mysql.format(
      `
      insert into gamelog.log_project_retention(project_id, start_date, end_date, episode_no, cnt)
      SELECT ${project_id}
            , '${start_date}' start_date
            , '${end_date}' end_date
            , ${i}
           , count(DISTINCT ueh.userkey) cnt
        FROM user_episode_hist ueh
          , list_episode le 
      WHERE ueh.project_id = ${project_id}
        AND ueh.project_id = le.project_id 
        AND ueh.episode_id = le.episode_id 
        AND le.episode_type = 'chapter'
        AND le.chapter_number = ${i}
        AND ueh.userkey IN (SELECT z.userkey FROM gamelog.log_first_episode_user z WHERE z.project_id = ueh.project_id );
    `
    );
  }

  await transactionDB(query);

  res.status(200).send("ok");
};

// * 통계 정보를 편하게 수집하기 위한 기능들을 모았습니다.
// * 모았다는건 사실 훼이크고 1개밖에 없음..

const episodeHistCountQuery = `
SELECT userkey, count(*) cnt
FROM user_episode_hist hist
WHERE hist.episode_id IN (SELECT z.episode_id FROM list_episode z WHERE z.project_id= ? AND z.episode_type ='chapter')
AND hist.first_play between ? and ?
GROUP BY userkey;
`;

// * 정규 에피소드 1화부터 끝까지 유저수 카운트
export const getProjectEpisodeProgressCount = async (req, res) => {
  const {
    body: { start_date, end_date, project_id },
  } = req;

  // 기간, 프로젝트 ID를 파라매터로 받는다.

  // 작품에 있는 정규 에피소드(엔딩제외) 가져오기
  const chapters = (
    await DB(`
    SELECT a.*
    FROM list_episode a
    WHERE a.project_id = ${project_id}
    AND a.episode_type ='chapter'
    ORDER BY a.sortkey ;
    `)
  ).row;

  console.log("chapters : ", chapters.length);

  // 에피소드 개수
  const maxCount = chapters.length;

  // 에피소드 화별로 키, 초기화
  const responseData = {};
  for (let i = 1; i <= maxCount; i++) {
    responseData[i.toString()] = 0;
  }

  const result = await DB(episodeHistCountQuery, [
    project_id,
    start_date,
    end_date,
  ]);

  console.log(`total user count : `, result.row.length);

  result.row.forEach((item) => {
    const current = item.cnt;

    // * ex: 5화까지 봤으면 1,2,3,4,5 다 더해준다. (5화를 클리어한 사람은 1,2,3,4,5 다 본사람이니까!)
    for (let i = 1; i <= current; i++) {
      responseData[i.toString()] = responseData[i.toString()] + 1;
    }
  });

  // 통계 테이블 삭제
  await DB(`DELETE FROM stat_episode_progress WHERE episode_no > 0`);

  let insertQuery = ``;
  for (let i = 1; i <= maxCount; i++) {
    insertQuery += mysql.format(
      `INSERT INTO stat_episode_progress(episode_no, cnt) values (?, ?);`,
      [i, responseData[i.toString()]]
    );
  }

  // 통계 테이블 입력stat_episode_progress. 편하게 복사하고싶다!
  await DB(insertQuery);

  // 예의상 response
  res.status(200).json(responseData);
};

//? 스케줄러용 통계 데이터

//! 이프유
export const getStatIfyouList = async (search_date) => {
  let dau = 0;
  let nru = 0;
  let pu = 0;

  // 일 사용자
  let result = await DB(`
  SELECT *
  FROM gamelog.log_action la 
  WHERE action_type = 'login'
  AND action_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if (result.state) dau = result.row.length;

  //신규 가입자
  result = await DB(`
  SELECT *
  FROM table_account ta 
  WHERE createtime BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if (result.state) nru = result.row.length;

  //유료 결제자
  result = await DB(`
  SELECT *
  FROM user_purchase up
  WHERE purchase_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if (result.state) pu = result.row.length;

  result = await DB(
    `
  INSERT INTO stat_ifyou(dau, nru, pu, search_date) VALUES(?, ?, ?, ?);
  `,
    [dau, nru, pu, search_date]
  );

  if (!result.state) {
    logger.error(`getStatIfyouList error`);
  }
};

//! 튜토리얼
export const getStatTutorialList = async (search_date) => {
  let result;

  let tutorial_cancel = 0;
  let tutorial_excute = 0;
  let tutorial_done = 0;
  let tutorial_reward = 0;

  // 튜토리얼 거절
  result = await DB(`
  SELECT *
  FROM gamelog.log_action
  WHERE action_type = 'tutorial_cancel'
  AND action_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if (result.state) tutorial_cancel = result.row.length;

  // 튜토리얼 실행
  result = await DB(`
  SELECT *
  FROM gamelog.log_action
  WHERE action_type = 'update_tutorial'
  AND action_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59'
  AND JSON_EXTRACT(log_data, '$.tutorial_step') <> '3';`);
  if (result.state) tutorial_excute = result.row.length;

  // 튜토리얼 완료
  result = await DB(`
  SELECT *
  FROM gamelog.log_action
  WHERE action_type = 'tutorial_done'
  AND action_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if (result.state) tutorial_done = result.row.length;

  // 튜토리얼 보상 획득
  result = await DB(`
  SELECT *
  FROM user_mail 
  WHERE mail_type = 'tutorial' 
  AND receive_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if (result.state) tutorial_reward = result.row.length;

  result = await DB(
    `
  INSERT INTO stat_tutorial(cancel_count, excute_count, done_count, reward_count, search_date) 
  VALUES(?, ?, ?, ?, ?);
  `,
    [
      tutorial_cancel,
      tutorial_excute,
      tutorial_done,
      tutorial_reward,
      search_date,
    ]
  );

  if (!result.state) {
    logger.error(`getStatTutorialList error`);
  }
};

//! 작품별
export const getStatProjectList = async (search_date) => {
  let result;
  const start_date = `${search_date} 00:00:00`; //시작일
  const end_date = `${search_date} 23:59:59`; //끝일

  let currentQuery = ``;
  let insertQuery = ``;

  result = await DB(
    `  
  SELECT project_id 
  , fn_get_project_cnt(project_id, ?, ?, 'project_enter') project_enter
  , fn_get_project_cnt(project_id, ?, ?, 'project_like') project_like
  , fn_get_project_cnt(project_id, ?, ?, 'ad_view') ad_view
  FROM list_project_master WHERE project_id > 0 AND is_deploy = 1;`,
    [start_date, end_date, start_date, end_date, start_date, end_date]
  );
  if (result.state && result.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      currentQuery = `
      INSERT INTO stat_project(project_id, project_enter_count, project_like_count, ad_view_count, search_date) 
      VALUES(?, ?, ?, ?, ?);
      `;
      insertQuery += mysql.format(currentQuery, [
        item.project_id,
        item.project_enter,
        item.project_like,
        item.ad_view,
        search_date,
      ]);
    }

    if (insertQuery) {
      result = await transactionDB(insertQuery);
      if (!result.state) {
        logger.error(`getStatProjectList error`);
      }
    }
  }
};

//! 에피소드별 플레이
export const getStatEpisodePlayList = async (search_date) => {
  let result;
  const start_date = `${search_date} 00:00:00`; //시작일
  const end_date = `${search_date} 23:59:59`; //끝일

  let insertQuery = ``;
  const currentQuery = `
  INSERT INTO stat_episode_play(project_id, episode_id, free_count, star_count, premium_count, search_date) 
  VALUES(?, ?, ?, ?, ?, ?);`;

  result = await DB(
    `
  SELECT
  project_id
  , episode_id 
  , fn_get_episode_cnt(episode_id, ?, ?, 'free_count') free_count
  , fn_get_episode_cnt(episode_id, ?, ?, 'star_count') star_count
  , fn_get_episode_cnt(episode_id, ?, ?, 'premium_count') premium_count
  FROM user_episode_purchase
  WHERE purchase_date BETWEEN ? AND ?
  GROUP BY project_id, episode_id 
  ORDER BY project_id, episode_id
  ;`,
    [
      start_date,
      end_date,
      start_date,
      end_date,
      start_date,
      end_date,
      start_date,
      end_date,
    ]
  );
  if (result.state && result.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      insertQuery += mysql.format(currentQuery, [
        item.project_id,
        item.episode_id,
        item.free_count,
        item.star_count,
        item.premium_count,
        search_date,
      ]);
    }
  }

  if (insertQuery) {
    result = await transactionDB(insertQuery);
    if (!result.state) {
      logger.error(`getStatEpisodeList error`);
    }
  }
};

//! 에피소드별 활동 타입
export const getStatEpisodeActionList = async (search_date) => {
  let result;
  const start_date = `${search_date} 00:00:00`; //시작일
  const end_date = `${search_date} 23:59:59`; //끝일
  const base_date = "2022-02-02 00:00:00"; //어플 개시일

  const currentQuery = `
  INSERT INTO stat_episode_action(project_id, episode_id, clear_count, reset_count, clear_total, premium_change_point_count, search_date) 
  VALUES(?, ?, ?, ?, ?, ?, ?);`;
  let insertQuery = ``;

  result = await DB(
    `
  SELECT CAST(JSON_EXTRACT(log_data, '$.project_id') AS UNSIGNED) project_id
  , CAST(JSON_EXTRACT(log_data, '$.episodeID') AS UNSIGNED) episode_id
  , fn_get_episode_cnt(CAST(JSON_EXTRACT(log_data, '$.episodeID') AS UNSIGNED), ?, ?, 'episode_clear') clear_count
  , fn_get_episode_cnt(CAST(JSON_EXTRACT(log_data, '$.episodeID') AS UNSIGNED), ?, ?, 'reset_progress') reset_count
  , fn_get_episode_cnt(CAST(JSON_EXTRACT(log_data, '$.episodeID') AS UNSIGNED), ?, ?, 'episode_clear') clear_total
  , fn_get_episode_cnt(CAST(JSON_EXTRACT(log_data, '$.episode_id') AS UNSIGNED), ?, ?, 'freepass') premium_change_point_count
  FROM gamelog.log_action
  WHERE action_type IN ('episode_clear', 'reset_progress', 'freepass')
  AND action_date BETWEEN ? AND ?
  GROUP BY project_id, episode_id
  ORDER BY project_id, episode_id;`,
    [
      start_date,
      end_date,
      start_date,
      end_date,
      base_date,
      end_date,
      start_date,
      end_date,
      start_date,
      end_date,
    ]
  );
  if (result.state && result.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      insertQuery += mysql.format(currentQuery, [
        item.project_id,
        item.episode_id,
        item.clear_count,
        item.reset_count,
        item.clear_total,
        item.premium_change_point_count,
        search_date,
      ]);
    }
  }

  if (insertQuery) {
    result = await transactionDB(insertQuery);
    if (!result.state) {
      logger.error(`getStatEpisodeActionList error`);
    }
  }
};

//! 재화 사용
export const getStatPropertyList = async (search_date) => {
  let result;
  let currentQuery = ``;
  let insertQuery = ``;

  result = await DB(`
  SELECT 
  fn_get_userkey_info(userkey) uid 
  , project_id
  , currency
  , quantity
  , log_type 
  , fn_get_standard_name('property_path_code', log_code) property_path
  , paid
  FROM gamelog.log_property
  WHERE action_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59'
  ORDER BY userkey;`);
  if (result.state && result.row.length > 0) {
    currentQuery = `
    INSERT INTO stat_property(uid, project_id, currency, quantity, property_type, property_path, paid, search_date) 
    VALUES(?, ?, ?, ?, ?, ?, ?, ?);
    `;
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      insertQuery += mysql.format(currentQuery, [
        item.uid,
        item.project_id,
        item.currency,
        item.quantity,
        item.log_type,
        item.property_path,
        item.paid,
        search_date,
      ]);
    }

    if (insertQuery) {
      result = await transactionDB(insertQuery);
      if (!result.state) {
        logger.error(`getStatPropertyList error`);
      }
    }
  }
};

//! 패키지/스타샵
export const getStatInappList = async (search_date) => {
  let result;
  let currentQuery = ``;
  let insertQuery = ``;

  result = await DB(`
  SELECT 
  fn_get_userkey_info(userkey) uid 
  , product_id 
  FROM user_purchase a
  WHERE purchase_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if (result.state && result.row.length > 0) {
    currentQuery = `INSERT INTO stat_inapp(uid, product_id, search_date) VALUES(?, ?, ?);`;

    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      insertQuery += mysql.format(currentQuery, [
        item.uid,
        item.product_id,
        search_date,
      ]);
    }

    if (insertQuery) {
      result = await transactionDB(insertQuery);
      if (!result.state) {
        logger.error(`getStatInappList error`);
      }
    }
  }
};

//! 코인샵
export const getStatCoinList = async (search_date) => {
  let result;
  let currentQuery = ``;
  let insertQuery = ``;

  result = await DB(`
  SELECT 
  fn_get_userkey_info(userkey) uid 
  , coin_product_id
  FROM user_coin_purchase 
  WHERE coin_purchase_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if (result.state && result.row.length > 0) {
    currentQuery = `INSERT INTO stat_coin(uid, coin_product_id, search_date) VALUES(?, ?, ?);`;

    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      insertQuery += mysql.format(currentQuery, [
        item.uid,
        item.coin_product_id,
        search_date,
      ]);
    }

    if (insertQuery) {
      result = await transactionDB(insertQuery);
      if (!result.state) {
        logger.error(`getStatCoinList error`);
      }
    }
  }
};

export const setStatList = async (req, res) => {
  const {
    body: { mode = "", search_date = "" },
  } = req;

  if (mode === "getStatIfyouList") await getStatIfyouList(search_date);
  else if (mode === "getStatTutorialList")
    await getStatTutorialList(search_date);
  else if (mode === "getStatProjectList") await getStatProjectList(search_date);
  else if (mode === "getStatEpisodePlayList")
    await getStatEpisodePlayList(search_date);
  else if (mode === "getStatEpisodeActionList")
    await getStatEpisodeActionList(search_date);
  else if (mode === "getStatPropertyList")
    await getStatPropertyList(search_date);
  else if (mode === "getStatInappList") await getStatInappList(search_date);
  else if (mode === "getStatCoinList") await getStatCoinList(search_date);

  res.status(200).json("done");
};
