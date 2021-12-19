export const Q_USER_ENDING_COUNT = `
SELECT count(c.episode_id) cnt
FROM list_episode a
, user_ending b
, list_episode_detail c
WHERE a.project_id = ?
AND b.userkey = ?
AND b.episode_id = a.episode_id
AND a.episode_type ='ending'
AND a.episode_id = c.episode_id 
AND c.lang = ?
ORDER BY sortkey ;
`;

export const Q_PROJECT_ENDING_COUNT = `
SELECT count(*) cnt FROM list_episode le WHERE project_id = ? AND episode_type ='ending';
`;

// 게임베이스 연동(userkey, previous GameBase ID) 신규 계정정보 까지 불러온다.
export const Q_CHANGE_USERKEY_GAMEBASE = `
CALL sp_change_account_gamebase(?, ?);
`;

// 유저 에피소드 구매 정보
export const Q_USER_EPISODE_PURCHASE = `
SELECT uep.episode_id 
     , uep.permanent 
     , uep.purchase_type
     , uep.onetime_playable
     , CASE WHEN uep.purchase_type = 'Rent' THEN TIMESTAMPDIFF(MINUTE, now(), expire_date)
       ELSE 0 END min_diff
     , date_format(uep.expire_date, '%Y-%m-%d %T') expire_date
  FROM user_episode_purchase uep 
 WHERE uep.userkey = ? AND uep.project_id = ?
ORDER BY purchase_date;
`;

// 유저 사건 ID 진행도 조회 (progress)
export const Q_USER_EPISODE_SCENE_PROGRESS = `
SELECT usp.scene_id
  FROM user_scene_progress usp 
 WHERE usp.userkey = ? AND usp.project_id = ? ORDER BY usp.project_id, usp.episode_id;
 `;

// 유저 에피소드별 사건ID 진행도 클리어
export const Q_USER_EPISODE_SCENE_CLEAR = `
DELETE FROM user_scene_progress WHERE userkey = ? AND episode_id = ?;
`;

// 마주친 사건 ID 수집
export const Q_INSERT_USER_EPISODE_SCENE_HISTORY = `
CALL sp_update_user_episode_scene_hist(?,?,?,?);
`;

// 유저 에피소드 진행도 정보 삭제
export const Q_DELETE_USER_EPISODE_SCENE_PROGRESS = `
DELETE FROM user_scene_progress WHERE userkey = ? AND scene_id = ?;
`;

// 프로젝트의 드레스 - 모델 연결 정보
export const Q_SELECT_PROJECT_DRESS_CODE = `
SELECT ldm.dressmodel_id
     , ldm.dressmodel_name 
     , ld.dress_id
     , ld.dress_name 
     , ld.model_id 
     , lmm.model_name 
     , ld.is_default
  FROM list_dress_model ldm 
     , list_dress ld
     , list_model_master lmm 
 WHERE ldm.project_id  = ?
   AND ld.dressmodel_id  = ldm.dressmodel_id
   AND lmm.project_id = ldm.project_id 
   AND lmm.model_id = ld.model_id 
  ORDER BY ldm.dressmodel_id, ld.dress_id;
`;

// 유저의 프로젝트 의상 진행정보 입력 (userkey, project_id, speaker, dress_id)
export const Q_INSERT_USER_DRESS_PROGRESS = `
call sp_insert_user_project_dress_progress(?,?,?,?);
`;

// 유저의 프로젝트 의상 진행정보 조회
export const Q_SELECT_USER_DRESS_PROGRESS = `
SELECT upd.*, lmm.model_id, lmm.model_name 
FROM user_project_dress upd
   , list_dress_model ldm 
   , list_dress ld 
   , list_model_master lmm 
WHERE upd.userkey = ?
 AND upd.project_id = ?
 AND ldm.project_id  = upd.project_id
 AND ldm.dressmodel_id = ld.dressmodel_id 
 AND ld.dress_id = upd.default_dress_id 
 AND lmm.project_id  = upd.project_id
 AND lmm.model_id = ld.model_id ;
`;

////////// ! 유저 앨범, 도전과제, 호감도 /////////////
export const Q_SELECT_USER_MISSION_HISTORY = `
SELECT lm.*
  FROM list_mission lm 
     , user_mission um 
 WHERE um.userkey = ?
   AND lm.project_id = ?
   AND um.mission_id = lm.mission_id;
`;

// userkey, project_id, chhallenge_no
export const Q_UPDATE_USER_MISSION_HISTORY = `
CALL sp_update_user_mission_hist(?, ?);
`;

// 호감도
export const Q_SELECT_USER_FAVOR_HISTORY = `
SELECT a.favor_hist_no 
     , a.userkey 
     , a.project_id 
     , a.favor_name 
     , a.score
     , a.update_date 
  FROM user_favor a
 WHERE a.userkey = ?
   AND a.project_id = ?;
`;

//userkey project_id, favor_name, score
export const Q_UPDATE_USER_FAVOR_UPDATE = `CALL sp_update_user_favor(?, ?, ? ,?);`;
export const Q_INIT_USER_FAVOR = ``;

export const UQ_SELECT_USER_MINICUT_HISTORY = `
SELECT z.minicut_type
     , z.minicut_id
     , z.minicut_name
     , ifnull(z.public_name, z.minicut_name) public_name
     , ifnull(z.summary, '입력되지 않았음') summary
     , fn_check_user_minicut_exists(?, z.minicut_type, z.minicut_id) minicut_open
     , z.image_url
     , z.image_key
  FROM (
SELECT 'image' minicut_type
     , lm.minicut_id
     , lm.image_name minicut_name
     , fn_get_minicut_localized_text(lm.minicut_id, 'minicut', 'KO', 'name') public_name
     , fn_get_minicut_localized_text(lm.minicut_id, 'minicut', 'KO', 'summary') summary
     , lm.image_url
     , lm.image_key
  FROM list_minicut lm 
 WHERE lm.project_id = ?
   AND lm.is_public = 1
UNION ALL
SELECT 'live2d' minicut_type
     , lo.live_object_id minicut_id
     , lo.live_object_name minicut_name
     , fn_get_minicut_localized_text(lo.live_object_id , 'live2d', 'KO', 'name') public_name
     , fn_get_minicut_localized_text(lo.live_object_id, 'live2d', 'KO', 'summary') summary
     , '' image_url
     , '' image_key
  FROM list_live_object lo
 WHERE lo.project_id = ?
   AND lo.is_public = 1
) z;
`;

// 일러스트
// ! 2021.08 미니컷과 라이브 오브제도 포함되도록 변경
export const Q_SELECT_USER_ILLUST_HISTORY = `
SELECT z.illust_type
     , z.illust_id
     , z.illust_name
     , z.thumbnail_url
     , z.thumbnail_key
     , ifnull(z.public_name, z.illust_name) public_name
     , ifnull(z.summary, '입력되지 않았음') summary
     , CASE WHEN is_minicut = 0 THEN fn_check_user_illust_exists(?, z.illust_type, z.illust_id)
            ELSE fn_check_user_minicut_exists(?, z.illust_type, z.illust_id) END illust_open
     , z.is_minicut
     , z.is_public
     , z.image_url
     , z.image_key
     , z.appear_episode
     , fn_get_episode_type(z.appear_episode) appear_episode_type
  FROM (
SELECT 'illust' illust_type
     , li.illust_id illust_id
     , li.image_name  illust_name
     , fn_get_design_info(li.thumbnail_id, 'url') thumbnail_url
     , fn_get_design_info(li.thumbnail_id, 'key') thumbnail_key
     , fn_get_illust_localized_text(li.illust_id, 'illust', 'KO', 'name') public_name
     , fn_get_illust_localized_text(li.illust_id, 'illust', 'KO', 'summary') summary
     , 0 is_minicut
     , li.is_public
     , li.image_url
     , li.image_key
     , li.appear_episode
  FROM list_illust li
 WHERE li.project_id = ?
   AND li.is_public > 0
   AND li.appear_episode > 0
UNION ALL
SELECT 'live2d' illust_type
    , lli.live_illust_id  illust_id
    , lli.live_illust_name  illust_name
    , fn_get_design_info(lli.thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(lli.thumbnail_id, 'key') thumbnail_key
    , fn_get_illust_localized_text(lli.live_illust_id , 'live2d', 'KO', 'name') public_name
    , fn_get_illust_localized_text(lli.live_illust_id, 'live2d', 'KO', 'summary') summary    
    , 0 is_minicut
    , lli.is_public
    , '' image_url
    , '' image_key
    , lli.appear_episode
  FROM list_live_illust lli
 WHERE lli.project_id = ?
   AND lli.is_public > 0
   AND lli.appear_episode > 0
 UNION ALL 
SELECT 'live2d' illust_type
    , a.live_object_id  illust_id
    , a.live_object_name  illust_name
    , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
    , fn_get_minicut_localized_text(a.live_object_id, 'live2d', 'KO', 'name') public_name
    , fn_get_minicut_localized_text(a.live_object_id, 'live2d', 'KO', 'summary') summary
    , 1 is_minicut
    , a.is_public
    , '' image_url
    , '' image_key
    , a.appear_episode
  FROM list_live_object a 
 WHERE a.project_id = ?
   AND a.is_public > 0
   AND a.appear_episode > 0
 UNION ALL
 SELECT 'minicut' illust_type
    , a.minicut_id  illust_id
    , a.image_name  illust_name
    , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
    , fn_get_minicut_localized_text(a.minicut_id, 'minicut', 'KO', 'name') public_name
    , fn_get_minicut_localized_text(a.minicut_id, 'minicut', 'KO', 'summary') summary
    , 1 is_minicut
    , a.is_public
    , a.image_url
    , a.image_key
    , a.appear_episode
  FROM list_minicut a 
 WHERE a.project_id = ?
   AND a.appear_episode > 0
   AND a.is_public > 0
  ) z, list_episode le 
  WHERE z.appear_episode = le.episode_id
 ORDER BY le.sortkey, z.illust_name;
`;

// userkey, project_id, illust_id
export const Q_UPDATE_USER_ILLUST_HISTORY = `
CALL sp_update_user_illust_hist(?, ?, ?, ?);
`;

// 프로젝트 모든 일러스트 조회
export const Q_SELECT_PROJECT_ALL_ILLUST = `
SELECT a.illust_id
     , a.image_name
     , a.image_url
     , a.image_key
     , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
     , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
     , a.is_public 
     , a.appear_episode
     , fn_get_illust_localized_text(a.illust_id, 'illust', ?, 'name') public_name
  FROM list_illust a
 WHERE a.project_id = ?
 ORDER BY sortkey, illust_id ;
`;

// 유저의 프로젝트 메인 에피소드 (CHAPTER, ENDING) 조회
export const UQ_SELECT_USER_MAIN_EPISODE = `
SELECT a.episode_id 
     , a.project_id 
     , a.episode_type
     , TRIM(fn_get_episode_title_lang(a.episode_id, 'KO')) title 
     , fn_check_episode_lang_exists(a.episode_id, 'KO') lang_exists
     , a.episode_status 
     , a.currency
     , a.price 
     , a.ending_type 
     , a.depend_episode
     , TRIM(fn_get_episode_title_lang(a.depend_episode, 'KO')) depend_episode_title
     , a.unlock_style 
     , a.unlock_episodes 
     , a.unlock_scenes 
     , a.unlock_coupon 
     , a.sale_price
     , a.one_currency
     , a.one_price
     , a.first_reward_currency
     , a.first_reward_quantity
     , a.sortkey 
     , a.chapter_number
     , fn_check_episode_in_progress(?, a.episode_id) in_progress
     , fn_check_episode_in_history(?, a.episode_id) in_history
     , fn_get_design_info(a.square_image_id, 'url') title_image_url
     , fn_get_design_info(a.square_image_id, 'key') title_image_key
     , fn_get_design_info(a.popup_image_id, 'url') popup_image_url
     , fn_get_design_info(a.popup_image_id, 'key') popup_image_key
     , TRIM(fn_get_episode_summary_lang(a.episode_id, 'KO')) summary
     , fn_get_count_scene_in_history(?, a.episode_id, 'KO', 'total') total_scene_count
     , fn_get_count_scene_in_history(?, a.episode_id, 'KO', 'played') played_scene_count
     , CASE WHEN a.episode_type = 'ending' THEN fn_check_user_ending(?, a.episode_id) 
            ELSE 0 END ending_open
FROM list_episode a
WHERE a.project_id = ?
  AND a.episode_type IN ('chapter', 'ending')
ORDER BY a.episode_type, a.sortkey 
;
`;

export const UQ_SELECT_USER_SIDE_EPISODE = `
SELECT a.episode_id 
     , a.project_id 
     , a.episode_type
     , TRIM(fn_get_episode_title_lang(a.episode_id, 'KO')) title 
     , fn_check_episode_lang_exists(a.episode_id, 'KO') lang_exists
     , a.episode_status 
     , a.currency
     , a.price 
     , a.ending_type 
     , a.depend_episode
     , TRIM(fn_get_episode_title_lang(a.depend_episode, 'KO')) depend_episode_title
     , a.unlock_style 
     , a.unlock_episodes 
     , a.unlock_scenes 
     , a.unlock_coupon 
     , a.sale_price 
     , a.one_currency
     , a.one_price
     , a.first_reward_currency
     , a.first_reward_quantity
     , a.sortkey 
     , a.chapter_number
     , 0 in_progress
     , TRIM(fn_get_episode_title_lang(a.episode_id, 'KO')) indexed_title
     , fn_get_design_info(a.square_image_id, 'url') title_image_url
     , fn_get_design_info(a.square_image_id, 'key') title_image_key
     , fn_get_design_info(a.popup_image_id, 'url') popup_image_url
     , fn_get_design_info(a.popup_image_id, 'key') popup_image_key
     , TRIM(fn_get_episode_summary_lang(a.episode_id, 'KO')) summary
     , fn_get_count_scene_in_history(?, a.episode_id, 'KO', 'total') total_scene_count
     , fn_get_count_scene_in_history(?, a.episode_id, 'KO', 'played') played_scene_count     
     , fn_check_special_episode_open(?, a.episode_id) is_open
FROM list_episode a
WHERE a.project_id = ?
  AND a.episode_type = 'side'
ORDER BY a.episode_type, a.sortkey 
;
`;

// 재화 획득 userkey, currency, quantity, path_code, expire
export const UQ_ACCQUIRE_CURRENCY = `
CALL sp_insert_user_property(?, ?, ?, ?);
`;

// 재화 소모 userkey, currency, quantity, reason
export const UQ_USE_CURRENCY = `
CALL sp_use_user_property(?, ?, ?, ?, ?);
`;

// 연결된 대여권 티켓에 대한 이름!
export const UQ_GET_CONNECTED_TICKET = `
SELECT cc.currency
  FROM com_currency cc
 WHERE cc.currency_type  = 'ticket'
   AND cc.connected_project = ?;
`;

// 에피소드 가격 구하기
export const UQ_GET_EPISODE_PRICE = `
SELECT le.episode_type
     , le.price
     , le.sale_price 
  FROM list_episode le
 WHERE le.episode_id = ?;
`;

export const UQ_CHECK_EPISODE_PERMANENT_PURCHASE = `
SELECT uep.* 
FROM user_episode_purchase uep 
WHERE uep.userkey = ?
 AND uep.episode_id =  ?
 AND uep.permanent = 1;
`;

// 유저가 보유한 작품 프리패스 체크용 쿼리
export const UQ_CHECK_PROJECT_USER_FREEPASS = `
SELECT up.*
  FROM user_property up
 WHERE up.userkey = ?
   AND currency = fn_get_project_freepass(?);
   
`;

// 유저가 보유한 작품 1회권 개수 조회 쿼리
export const UQ_GET_PROJECT_USER_ONETIME_COUNT = `
SELECT fn_get_user_property(?, fn_get_project_onetime(?)) onetime_count
FROM DUAL;
`;

// 유저의 작품과 관련된 재화 모두 조회
export const UQ_GET_PROJECT_USER_PROPERTY = `
SELECT fn_get_user_property(?, fn_get_project_freepass(?)) freepass
     , fn_get_user_property(?, fn_get_project_ticket(?)) ticket
     , fn_get_user_property(?, fn_get_project_onetime(?)) onetime
FROM DUAL;
`;

export const UQ_INSERT_USER_TIMEDEAL = `
INSERT INTO user_timedeal_limit (userkey, timedeal_type, target_id, end_date, is_end) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0);
`;
