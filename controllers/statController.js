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
  logger.info(`getStatIfyouList`);

  let dau = 0; 
  let nru = 0; 
  let pu = 0; 

  let result = await DB(`
  SELECT ifnull(count(*), 0) dau
  FROM gamelog.log_action la 
  WHERE action_type = 'login'
  AND date(action_date) = ?;
  `, [search_date]);
  dau = result.row[0].dau; 

  result = await DB(`
  SELECT ifnull(count(*), 0) nru
  FROM table_account ta 
  WHERE date(createtime) = ?;
  `, [search_date]);
  nru = result.row[0].nru;

  result = await DB(`
  SELECT ifnull(count(*), 0) pu
  FROM user_purchase up
  WHERE date(purchase_date) = ?;
  `, [search_date]);
  pu = result.row[0].pus;

  result = await DB(`
  INSERT INTO stat_ifyou(dau, nru, pu, search_date) VALUES(?, ?, ?, ?);
  `, [dau, nru, pu, search_date]);
};

//! 튜토리얼
export const getStatTutorialList = async (search_date) =>{
  logger.info(`getStatTutorialList`);

  let result; 

  let tutorial_cancel = 0;
  let tutorial_excute = 0; 
  let tutorial_done = 0; 
  let tutorial_reward = 0; 

  // 튜토리얼 거절
  result = await DB(`
  SELECT ifnull(count(*), 0) tutorial_cancel 
  FROM gamelog.log_action
  WHERE action_type = 'tutorial_cancel'
  AND date(action_date) = ?;
  `, [search_date]);
  tutorial_cancel = result.row[0].tutorial_cancel;
  
  // 튜토리얼 실행 
  result = await DB(`
  SELECT ifnull(count(*), 0) tutorial_excute
  FROM gamelog.log_action
  WHERE action_type = 'update_tutorial'
  AND date(action_date) = ?
  AND JSON_EXTRACT(log_data, '$.tutorial_step') <> 3;
  `, [search_date]);
  tutorial_excute = result.row[0].tutorial_excute;
  
  
  // 튜토리얼 완료 
  result = await DB(`
  SELECT ifnull(count(*), 0) tutorial_done
  FROM gamelog.log_action
  WHERE action_type = 'tutorial_done'
  AND date(action_date) = ?;
  `, [search_date]);
  tutorial_done = result.row[0].tutorial_done;
  

  // 튜토리얼 보상 획득 
  result = await DB(`
  SELECT ifnull(count(*), 0) tutorial_reward 
  FROM user_mail 
  WHERE mail_type = 'tutorial' 
  AND date(receive_date) = ?;
  `, [search_date]);
  tutorial_reward = result.row[0].tutorial_reward;
  
  result = await DB(`
  INSERT INTO stat_tutorial(cancel_count, excute_count, done_count, reward_count, search_date) 
  VALUES(?, ?, ?, ?, ?);
  `, [tutorial_cancel, tutorial_excute, tutorial_done, tutorial_reward, search_date]);

};

//! 작품별 
export const getStatProjectList = async (search_date) =>{
  logger.info(`getStatProjectList`);

  let result; 
  
  let project_enter = 0;
  let project_like = 0; 
  let ad_view = 0; 

  let currentQuery = ``;
  let insertQuery = ``; 

  result = await DB(`SELECT project_id FROM list_project_master WHERE is_depoly = 1;`);
  // eslint-disable-next-line no-restricted-syntax
  for(const item of result.row){
      
    //작품 진입 
    // eslint-disable-next-line no-await-in-loop
    result = await DB(`
    SELECT ifnull(count(*), 0) project_enter
    FROM gamelog.log_action 
    WHERE action_type = 'project_enter'
    AND JSON_EXTRACT(log_data, '$.project_id') = ?
    AND date(action_date) = ?;
    `, [item.project_id, search_date]);
    project_enter = result.row[0].project_enter; 

    //작품 좋아요 
    // eslint-disable-next-line no-await-in-loop
    result = await DB(`
    SELECT ifnull(count(*), 0) project_like 
    FROM user_project_like
    WHERE project_id = ? 
    AND date(create_date) = ?;
    `, [item.project_id, search_date]);
    project_like = result.row[0].project_like; 

    //광고 시청
    // eslint-disable-next-line no-await-in-loop
    result = await DB(`
    SELECT ifnull(count(*), 0) ad_view
    FROM gamelog.log_ad
    WHERE project_id = ? 
    AND date(action_date) = ?;
    `, [item.project_id, search_date]);
    ad_view = result.row[0].ad_view;

    currentQuery = `
    INSERT INTO stat_project(project_id, project_enter_count, project_like_count, ad_view_count, search_date) 
    VALUES(?, ?, ?, ?, ?);
    `;

    insertQuery += mysql.format(currentQuery, [item.project_id, project_enter, project_like, ad_view, search_date]);
    
  }

  result = await transactionDB(insertQuery);

};

//! 에피소드별
export const getStatEpisodeList = async (search_date) =>{
  logger.info(`getStatEpisodeList`);

  let result; 
  
  let free_count = 0;
  let star_count = 0; 
  let premium_count = 0; 

  let clear_count = 0; 
  let reset_count = 0; 
  let clear_total = 0; 

  let premium_change_point_count = 0; 

  let currentQuery = ``;
  let insertQuery = ``; 

  result = await DB(`
  SELECT project_id, episode_id, chapter_number FROM list_episode 
  WHERE project_id IN (SELECT project_id FROM list_project_master WHERE is_depoly = 1)
  ORDER BY project_id, sortkey, episode_id; 
  `);
  // eslint-disable-next-line no-restricted-syntax
  for(const item of result.row){

    // 각 플레이별 
    // eslint-disable-next-line no-await-in-loop
    result = await DB(`
    SELECT currency 
    , purchase_type 
    , ifnull(count(*), 0) play_count
    FROM user_episode_purchase
    WHERE project_id = ? 
    AND episode_id = ?
    AND date(purchase_date) = ?
    GROUP BY currency, purchase_type
    ORDER BY currency, purchase_type; 
    `, [item.project_id, item.episode_id, search_date]);
    if(result.state && result.row.length > 0){
      // eslint-disable-next-line no-restricted-syntax
      for(const element of result.row){
        if(element.purchase_type === 'Permanent'){
          if(element.currency === 'gem'){
            star_count = result.row[0].play_count;
          }else{
            premium_count = result.row[0].play_count; 
          }
        }else{
          free_count = result.row[0].play_count;
        }
      }
    }

    //클리어 
    // eslint-disable-next-line no-await-in-loop
    result = await DB(`
    SELECT 
    ifnull(count(*), 0) episode_clear
    FROM gamelog.log_action
    WHERE action_type = 'episode_clear' 
    AND JSON_EXTRACT(log_data, '$.episode_id') = ?
    AND date(action_date) = ?;
    `, [item.episode_id, search_date]);
    clear_count = result.row[0].episode_clear; 

    //리셋 
    // eslint-disable-next-line no-await-in-loop
    result = await DB(`
    SELECT 
    ifnull(count(*), 0) reset_progress
    FROM gamelog.log_action
    WHERE action_type = 'reset_progress' 
    AND JSON_EXTRACT(log_data, '$.episode_id') = ?
    AND date(action_date) = ?;
    `, [item.episode_id, search_date]);
    reset_count  = result.row[0].reset_progress; 

    //클리어 누적 합산 
    // eslint-disable-next-line no-await-in-loop
    result = await DB(`
    SELECT 
    ifnull(count(*), 0) episode_clear_total
    FROM gamelog.log_action
    WHERE action_type = 'episode_clear' 
    AND JSON_EXTRACT(log_data, '$.episode_id') = ?
    AND date(action_date) >= '2022-02-02' AND date(action_date) <= ?;`, [item.episode_id, search_date]);    
    clear_total = result.row[0].episode_clear_total;

    //프리미엄 패스 전환 시점
    // eslint-disable-next-line no-await-in-loop 
    result = await DB(`
    SELECT 
    ifnull(count(*), 0) premium_change_point_count  
    FROM gamelog.log_action
    WHERE action_type = 'freepass' 
    AND JSON_EXTRACT(log_data, '$.episode_id') = ?
    AND date(action_date) = ?;
    `, [item.episode_id, search_date]);
    premium_change_point_count = result.row[0].premium_change_point_count; 

    currentQuery = `
    INSERT INTO stat_episode(
      project_id
      , episode_id
      , chapter_number
      , free_count
      , star_count
      , premium_count
      , clear_count
      , reset_count
      , clear_total 
      , premium_change_point_count 
      , search_date) 
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);  
    `; 

    insertQuery += mysql.format(currentQuery, [
      item.project_id
      , item.episode_id
      , item.chapter_number
      , free_count 
      , star_count
      , premium_count 
      , clear_count 
      , reset_count 
      , clear_total 
      , premium_change_point_count 
      , search_date]);

  }

  result = await transactionDB(insertQuery); 
};

//! 재화 사용 
export const getStatPropertyList = async (search_date) =>{
  
  logger.info(`getStatPropertyList`);

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
  WHERE date(action_date) = ?
  GROUP BY userkey
  ORDER BY userkey;
  `, [search_date]);
  if(result.state && result.row.length > 0){
    currentQuery = `
    INSERT INTO stat_property(uid, project_id, currency, quantity, property_type, property_path, paid, search_date) 
    VALUES(?, ?, ?, ?, ?, ?, ?, ?);
    `; 
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      insertQuery += mysql.format(currentQuery, [item.uid, item.project_id, item.currency, item.quantity, item.log_type, item.property_path, item.paid, search_date]);
    }
    
    result = await transactionDB(insertQuery);
  }
};

//! 패키지/스타샵
export const getStatInappList = async (search_date) => {

  logger.info(`getStatPropertyList`);

  let result; 
  let currentQuery = ``; 
  let insertQuery = ``;

  result = await DB(`
  SELECT 
  fn_get_userkey_info(userkey) uid 
  , product_id 
  FROM user_purchase a
  WHERE date(purchase_date) = ?;
  `, [search_date]);
  if(result.state && result.row.length > 0){
    currentQuery = `INSERT INTO stat_inapp(uid, product_id, search_date) VALUES(?, ?, ?);`;
    
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      insertQuery += mysql.format(currentQuery, [item.uid, item.product_id, search_date]);
    }

    result = await transactionDB(insertQuery); 
  }

}; 

//! 코인샵 
export const getStatCoinList = async(search_date) => {
  
  logger.info(`getStatCoinList`);
  
  let result; 
  let currentQuery = ``; 
  let insertQuery = ``;

  result = await DB(`
  SELECT 
  fn_get_userkey_info(userkey) uid 
  , coin_product_id
  FROM user_coin_purchase 
  WHERE date(coin_purchase_date) = ?;
  `, [search_date]);
  if(result.state && result.row.length > 0){
    currentQuery = `INSERT INTO stat_coin(uid, coin_product_id, search_date) VALUES(?, ?, ?);`;
    
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){
      insertQuery += mysql.format(currentQuery, [item.uid, item.coin_product_id, search_date]);
    }

    result = await transactionDB(insertQuery);
  }
};
