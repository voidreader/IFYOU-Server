import mysql from "mysql2/promise";
import { response } from "express";
import { DB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

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
export const getStatIfyouList = async (search_date) =>{

  let dau = 0; 
  let nru = 0; 
  let pu = 0; 

  // 일 사용자
  let result = await DB(`
  SELECT *
  FROM gamelog.log_action la 
  WHERE action_type = 'login'
  AND action_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if(result.state) dau = result.row.length; 

  //신규 가입자
  result = await DB(`
  SELECT *
  FROM table_account ta 
  WHERE createtime BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if(result.state) nru = result.row.length;

  //유료 결제자
  result = await DB(`
  SELECT *
  FROM user_purchase up
  WHERE purchase_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if(result.state) pu = result.row.length;

  result = await DB(`
  INSERT INTO stat_ifyou(dau, nru, pu, search_date) VALUES(?, ?, ?, ?);
  `, [dau, nru, pu, search_date]);

  if(!result.state){
    logger.error(`getStatIfyouList error`);
  }

};

//! 튜토리얼
export const getStatTutorialList = async (search_date) =>{

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
  if(result.state) tutorial_cancel = result.row.length;
  
  // 튜토리얼 실행 
  result = await DB(`
  SELECT *
  FROM gamelog.log_action
  WHERE action_type = 'update_tutorial'
  AND action_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59'
  AND JSON_EXTRACT(log_data, '$.tutorial_step') <> '3';`);
  if(result.state) tutorial_excute = result.row.length;
  
  
  // 튜토리얼 완료 
  result = await DB(`
  SELECT *
  FROM gamelog.log_action
  WHERE action_type = 'tutorial_done'
  AND action_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if(result.state) tutorial_done = result.row.length;
  

  // 튜토리얼 보상 획득 
  result = await DB(`
  SELECT *
  FROM user_mail 
  WHERE mail_type = 'tutorial' 
  AND receive_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';`);
  if(result.state) tutorial_reward = result.row.length;
  
  result = await DB(`
  INSERT INTO stat_tutorial(cancel_count, excute_count, done_count, reward_count, search_date) 
  VALUES(?, ?, ?, ?, ?);
  `, [tutorial_cancel, tutorial_excute, tutorial_done, tutorial_reward, search_date]);

  if(!result.state){
    logger.error(`getStatTutorialList error`);
  }

};

//! 작품별 
export const getStatProjectList = async (search_date) =>{

  let result; 
  
  let currentQuery = ``;
  let insertQuery = ``; 

  result = await DB(`  
  SELECT project_id 
  , fn_get_project_cnt(project_id, '${search_date} 00:00:00', 'project_enter') project_enter
  , fn_get_project_cnt(project_id, '${search_date} 00:00:00', 'project_like') project_like
  , fn_get_project_cnt(project_id, '${search_date} 00:00:00', 'ad_view') ad_view
  FROM list_project_master WHERE project_id > 0 AND is_deploy = 1;`);
  if(result.state && result.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
        
      currentQuery = `
      INSERT INTO stat_project(project_id, project_enter_count, project_like_count, ad_view_count, search_date) 
      VALUES(?, ?, ?, ?, ?);
      `;
      insertQuery += mysql.format(currentQuery, [item.project_id, item.project_enter, item.project_like, item.ad_view, search_date]);  
    }

    if(insertQuery){
      result = await transactionDB(insertQuery);
      if(!result.state){
        logger.error(`getStatProjectList error`);
      }
    }

  }

};

//! 에피소드별 플레이
export const getStatEpisodePlayList = async (search_date) =>{

  let result; 

  let insertQuery = ``; 
  const currentQuery = `
  INSERT INTO stat_episode(project_id, episode_id, free_count, star_count, premium_count, clear_count, reset_count, clear_total, premium_change_point_count, search_date) 
  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

  result = await DB(`
  SELECT
  project_id
  , episode_id 
  , fn_get_episode_cnt(episode_id, '${search_date} 00:00:00', 'free_count') free_count
  , fn_get_episode_cnt(episode_id, '${search_date} 00:00:00', 'star_count') star_count
  , fn_get_episode_cnt(episode_id, '${search_date} 00:00:00', 'premium_count') premium_count
  , fn_get_episode_cnt(episode_id, '${search_date} 00:00:00', 'episode_clear') clear_count
  , fn_get_episode_cnt(episode_id, '${search_date} 00:00:00', 'reset_progress') reset_count
  , fn_get_episode_cnt(episode_id, '${search_date} 00:00:00', 'freepass') premium_change_point_count
  FROM user_episode_purchase
  WHERE data(purchase_date) = ?;`, [search_date]); 
  if(result.state && result.row.length > 0){
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      insertQuery += mysql.format(currentQuery, [
        item.project_id
        , item.episode_id
        , item.free_count
        , item.star_count
        , item.premium_count
        , item.clear_count
        , item.reset_count
        , item.clear_total
        , item.premium_change_point_count
      ]);
    }
  }

  console.log(insertQuery);

  /*if(insertQuery){
    result = await transactionDB(insertQuery); 
    if(!result.state){
      logger.error(`getStatEpisodeList error`);
    }
  }*/

};

//! 에피소드별 클리어 
export const getStatEpisodeClearList = async (search_date) =>{

  let result; 
  let currentQuery = ``;
  let insertQuery = ``; 

  result = await DB(`
  SELECT JSON_EXTRACT(log_data, '$.project_id') project_id
  , JSON_EXTRACT(log_data, '$.episode_id') episode_id
  , fn_get_episode_cnt(episode_id, '${search_date} 00:00:00', 'episode_clear') clear_count
  , fn_get_episode_cnt(episode_id, '${search_date} 00:00:00', 'episode_clear') reset_count
  , fn_get_episode_cnt(episode_id, '${search_date} 00:00:00', 'episode_clear') premium_change_point_count
  FROM gamelog.log_action 
  WHERE action_type IN ('episode_clear', 'reset_progress', 'freepass')
  AND date(action_date) = ?;`, [search_date]);
  if(result.state && result.row.length > 0){
    
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      // eslint-disable-next-line no-await-in-loop
      const episodeResult = await DB(`SELECT * FROM stat_episode WHERE episode_id = ?;`, [item.episode_id]);
      if(result.state && result.row.length === 0){
        currentQuery = `INSERT INTO stat_episode(project_id, episode_id, free_count, star_count, premium_count, clear_count, reset_count, clear_total, premium_change_point_count, search_date) 
        VALUES(?, ?, 0, 0, 0, ?, ?, ?, ?, ?);`;
      }
    }
    
  }
};

//! 재화 사용 
export const getStatPropertyList = async (search_date) =>{
  
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
  GROUP BY userkey
  ORDER BY userkey;
  `);
  if(result.state && result.row.length > 0){
    currentQuery = `
    INSERT INTO stat_property(uid, project_id, currency, quantity, property_type, property_path, paid, search_date) 
    VALUES(?, ?, ?, ?, ?, ?, ?, ?);
    `; 
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      insertQuery += mysql.format(currentQuery, [item.uid, item.project_id, item.currency, item.quantity, item.log_type, item.property_path, item.paid, search_date]);
    }
    
    if(insertQuery){
      result = await transactionDB(insertQuery);
      if(!result.state){
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
  WHERE purchase_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';
  `, [search_date]);
  if(result.state && result.row.length > 0){
    currentQuery = `INSERT INTO stat_inapp(uid, product_id, search_date) VALUES(?, ?, ?);`;
    
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      insertQuery += mysql.format(currentQuery, [item.uid, item.product_id, search_date]);
    }

    if(insertQuery){
      result = await transactionDB(insertQuery); 
      if(!result.state){
        logger.error(`getStatInappList error`);
      }
    }
  }
}; 

//! 코인샵 
export const getStatCoinList = async(search_date) => {
  
  let result; 
  let currentQuery = ``; 
  let insertQuery = ``;

  result = await DB(`
  SELECT 
  fn_get_userkey_info(userkey) uid 
  , coin_product_id
  FROM user_coin_purchase 
  WHERE coin_purchase_date BETWEEN '${search_date} 00:00:00' AND '${search_date} 23:59:59';
  `);
  if(result.state && result.row.length > 0){
    currentQuery = `INSERT INTO stat_coin(uid, coin_product_id, search_date) VALUES(?, ?, ?);`;
    
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      insertQuery += mysql.format(currentQuery, [item.uid, item.coin_product_id, search_date]);
    }

    if(insertQuery){  
      result = await transactionDB(insertQuery);
      if(!result.state){
        logger.error(`getStatCoinList error`);
      }
    }
  }
};

export const setStatList = async (req, res) => {

  const {
    body: {
      mode = "", 
      search_date = "",
    }
  } = req;

  if(mode === "getStatIfyouList")  await getStatIfyouList(search_date);
  else if (mode === "getStatTutorialList") await getStatTutorialList(search_date);
  else if (mode === "getStatProjectList") await getStatProjectList(search_date);
  else if (mode === "getStatEpisodeList") await getStatEpisodeList(search_date);
  else if (mode === "getStatPropertyList") await getStatPropertyList(search_date);
  else if (mode === "getStatInappList") await getStatInappList(search_date);
  else if (mode === "getStatCoinList") await getStatCoinList(search_date);
  
  res.status(200).json("done");

};
