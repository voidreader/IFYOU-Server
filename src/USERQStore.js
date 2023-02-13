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
SELECT 
  lm.mission_id 
  , fn_get_mission_name(lm.mission_id, ?) mission_name
  , fn_get_mission_hint(lm.mission_id, ?) mission_hint
  , mission_type
  , is_hidden
  , project_id
  , mission_condition
  , mission_figure
  , id_condition
  , reward_exp
  , reward_currency
  , reward_quantity
  , image_url
  , image_key
  , start_date
  , end_date
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

// * 2021.12.23 유저 갤러리 이미지 리스트 리뉴얼
export const Q_SELECT_USER_GALLERY_IMAGES = `
SELECT z.illust_type
     , z.illust_id
     , z.illust_name
     , z.thumbnail_url
     , z.thumbnail_key
     , ifnull(z.public_name, z.illust_name) public_name
     , ifnull(z.summary, '입력되지 않았음') summary
     , CASE WHEN is_minicut = 0 THEN fn_check_user_illust_exists(?, z.origin_type, z.illust_id)
            ELSE fn_check_user_minicut_exists_new(?, z.origin_type, z.illust_id) END illust_open
     , z.is_public
     , z.image_url
     , z.image_key
     , z.appear_episode
     , fn_get_episode_type(z.appear_episode) appear_episode_type
     , z.live_pair_id
  FROM (
SELECT 'illust' illust_type
     , li.illust_id illust_id
     , li.image_name  illust_name
     , fn_get_design_info(li.thumbnail_id, 'url') thumbnail_url
     , fn_get_design_info(li.thumbnail_id, 'key') thumbnail_key
     , fn_get_illust_localized_text(li.illust_id, 'illust', ?, 'name') public_name
     , fn_get_illust_localized_text(li.illust_id, 'illust', ?, 'summary') summary
     , 0 is_minicut
     , li.is_public
     , li.image_url
     , li.image_key
     , li.appear_episode
     , li.live_pair_id
     , 'illust' origin_type
  FROM list_illust li
 WHERE li.project_id = ?
   AND li.is_public > 0
   AND li.appear_episode > 0
UNION ALL
SELECT 'live_illust' illust_type
    , lli.live_illust_id  illust_id
    , lli.live_illust_name  illust_name
    , fn_get_design_info(lli.thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(lli.thumbnail_id, 'key') thumbnail_key
    , fn_get_illust_localized_text(lli.live_illust_id , 'live2d', ?, 'name') public_name
    , fn_get_illust_localized_text(lli.live_illust_id, 'live2d', ?, 'summary') summary    
    , 0 is_minicut
    , lli.is_public
    , '' image_url
    , '' image_key
    , lli.appear_episode
    , -1 live_pair_id
    , 'live2d' origin_type
  FROM list_live_illust lli
 WHERE lli.project_id = ?
   AND lli.is_public > 0
   AND lli.appear_episode > 0
 UNION ALL 
SELECT 'live_object' illust_type
    , a.live_object_id  illust_id
    , a.live_object_name  illust_name
    , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
    , fn_get_minicut_localized_text(a.live_object_id, 'live2d', ?, 'name') public_name
    , fn_get_minicut_localized_text(a.live_object_id, 'live2d', ?, 'summary') summary
    , 1 is_minicut
    , a.is_public
    , '' image_url
    , '' image_key
    , a.appear_episode
    , -1 live_pair_id
    , 'live2d' origin_type
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
    , fn_get_minicut_localized_text(a.minicut_id, 'minicut', ?, 'name') public_name
    , fn_get_minicut_localized_text(a.minicut_id, 'minicut', ?, 'summary') summary
    , 1 is_minicut
    , a.is_public
    , a.image_url
    , a.image_key
    , a.appear_episode
    , a.live_pair_id
    , 'minicut' origin_type
  FROM list_minicut a 
 WHERE a.project_id = ?
   AND a.appear_episode > 0
   AND a.is_public > 0
  ) z, list_episode le 
  WHERE z.appear_episode = le.episode_id
 ORDER BY le.sortkey, z.illust_name;
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
     , z.live_pair_id
  FROM (
SELECT 'illust' illust_type
     , li.illust_id illust_id
     , li.image_name  illust_name
     , fn_get_design_info(li.thumbnail_id, 'url') thumbnail_url
     , fn_get_design_info(li.thumbnail_id, 'key') thumbnail_key
     , fn_get_illust_localized_text(li.illust_id, 'illust', ?, 'name') public_name
     , fn_get_illust_localized_text(li.illust_id, 'illust', ?, 'summary') summary
     , 0 is_minicut
     , li.is_public
     , li.image_url
     , li.image_key
     , li.appear_episode
     , li.live_pair_id
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
    , fn_get_illust_localized_text(lli.live_illust_id , 'live2d', ?, 'name') public_name
    , fn_get_illust_localized_text(lli.live_illust_id, 'live2d', ?, 'summary') summary    
    , 0 is_minicut
    , lli.is_public
    , '' image_url
    , '' image_key
    , lli.appear_episode
    , -1 live_pair_id
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
    , fn_get_minicut_localized_text(a.live_object_id, 'live2d', ?, 'name') public_name
    , fn_get_minicut_localized_text(a.live_object_id, 'live2d', ?, 'summary') summary
    , 1 is_minicut
    , a.is_public
    , '' image_url
    , '' image_key
    , a.appear_episode
    , -1 live_pair_id
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
    , fn_get_minicut_localized_text(a.minicut_id, 'minicut', ?, 'name') public_name
    , fn_get_minicut_localized_text(a.minicut_id, 'minicut', ?, 'summary') summary
    , 1 is_minicut
    , a.is_public
    , a.image_url
    , a.image_key
    , a.appear_episode
    , a.live_pair_id
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
     , a.live_pair_id
  FROM list_illust a
 WHERE a.project_id = ?
 ORDER BY sortkey, illust_id ;
`;

export const Q_SELECT_PROJECT_ALL_MINICUT = `
SELECT a.minicut_id 
     , a.image_name 
     , a.image_url 
     , a.image_key
     , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
     , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
     , a.offset_x 
     , a.offset_y 
     , a.game_scale 
     , a.is_resized 
     , a.is_public 
     , a.appear_episode 
     , fn_get_minicut_localized_text(a.minicut_id, 'minicut', ?, 'name') public_name
     , a.live_pair_id
  FROM list_minicut a
 WHERE a.project_id = ?;
`;

// * 프로제트 모든 배경 리소스
export const Q_SELECT_PROJECT_ALL_BG = `
SELECT lb.bg_id
     , lb.image_name
     , lb.image_url
     , lb.image_key
     , lb.game_scale
     , lb.live_pair_id
  FROM list_bg lb
 WHERE lb.project_id = ?;
`;

// * 프로젝트의 모든 이모티콘 리소스
export const Q_SELECT_PROJECT_ALL_EMOTICONS = `
SELECT lem.emoticon_owner
     , les.emoticon_slave_id
     , les.image_name
     , les.image_url
     , les.image_key
  FROM list_emoticon_master lem
     , list_emoticon_slave les 
 WHERE lem.project_id = ?
   AND les.emoticon_master_id = lem.emoticon_master_id;
`;

export const Q_SELECT_EPISODE_LOADING = `
SELECT 
a.loading_id 
, a.image_id 
, fn_get_design_info(a.image_id, 'url') image_url
, fn_get_design_info(a.image_id, 'key') image_key
, a.loading_name
FROM list_loading a
WHERE a.project_id = ?;`;

export const Q_SELECT_MISSION_ALL = `
SELECT a.mission_id
  , fn_get_mission_name(a.mission_id, ?) mission_name
  , fn_get_mission_hint(a.mission_id, ?) mission_hint
  , a.mission_type
  , ifnull(a.id_condition, '') id_condition
  , a.is_hidden 
  , a.reward_currency 
  , a.reward_quantity 
  , a.reward_exp 
  , a.image_url 
  , a.image_key 
  , b.unlock_state 
  , fn_get_design_info((SELECT icon_image_id FROM com_currency WHERE currency = reward_currency), 'url') icon_image_url
  , fn_get_design_info((SELECT icon_image_id FROM com_currency WHERE currency = reward_currency), 'key') icon_image_key
  , fn_get_mission_name(a.mission_id, 'KO') origin_name
  , detail_hint
  , CASE WHEN mission_type = 'episode' OR mission_type = 'event' THEN
    fn_get_unlock_mission(?, ?, a.project_id, a.mission_id, mission_type)
  ELSE '' END hint    
  FROM list_mission a 
  LEFT OUTER JOIN user_mission b ON a.mission_id = b.mission_id AND b.userkey = ? 
  WHERE a.project_id = ?;
`;

export const Q_SELECT_SCENE_HISTORY = `
SELECT hist.scene_id
  FROM user_scene_hist hist
  WHERE hist.userkey = ?
  AND hist.project_id = ?;
`;

export const Q_SELECT_SIDE_STORY = `
SELECT a.episode_id 
, a.project_id 
, a.episode_type
, TRIM(fn_get_episode_title_lang(a.episode_id, ?)) title 
, fn_check_episode_lang_exists(a.episode_id, ?) lang_exists
, a.episode_status 
, a.currency
, a.price 
, a.ending_type 
, a.depend_episode
, TRIM(fn_get_episode_title_lang(a.depend_episode, ?)) depend_episode_title
, a.unlock_style 
, ifnull(a.unlock_episodes, '') unlock_episodes
, ifnull(a.unlock_scenes, '') unlock_scenes
, a.unlock_coupon 
, a.sale_price 
, a.one_currency
, a.one_price
, a.first_reward_currency
, a.first_reward_quantity
, a.sortkey 
, a.chapter_number
, 0 in_progress
, TRIM(fn_get_episode_title_lang(a.episode_id, ?)) indexed_title
, fn_get_design_info(a.square_image_id, 'url') title_image_url
, fn_get_design_info(a.square_image_id, 'key') title_image_key
, fn_get_design_info(a.popup_image_id, 'url') popup_image_url
, fn_get_design_info(a.popup_image_id, 'key') popup_image_key
, TRIM(fn_get_episode_summary_lang(a.episode_id, ?)) summary
, fn_get_count_scene_in_history(?, a.episode_id, ?, 'total') total_scene_count
, fn_get_count_scene_in_history(?, a.episode_id, ?, 'played') played_scene_count     
, fn_check_special_episode_open(?, a.episode_id) is_open
, a.next_open_min
, CASE WHEN ifnull(a.publish_date, '2020-01-01') > now() THEN 1 ELSE 0 END is_serial -- 
, date_format(ifnull(a.publish_date, '2020-01-01'), '%Y-%m-%d %T') publish_date
, CASE WHEN unlock_style = 'episode' THEN fn_get_unlock_list(?, a.project_id, a.episode_id, ?, a.unlock_style) 
       WHEN unlock_style = 'event' THEN fn_get_unlock_list(?, a.project_id, a.episode_id, ?, a.unlock_style)
ELSE '' END side_hint
, ifnull(ueh.episode_id, 0) is_clear
FROM list_episode a
LEFT OUTER JOIN user_episode_hist ueh ON ueh.userkey = ? AND ueh.project_id = a.project_id AND ueh.episode_id = a.episode_id
WHERE a.project_id = ?
AND a.episode_type = 'side'
AND a.unlock_style <> 'coupon'
AND a.dlc_id = -1
ORDER BY a.episode_type, a.sortkey;  
`;

export const Q_SELECT_EPISODE_PROGRESS = `
SELECT a.episode_id
FROM user_episode_progress a 
WHERE a.userkey = ?
AND a.project_id = ?
ORDER BY open_date DESC;
`;

export const Q_SELECT_EPISODE_HISTORY = `
SELECT a.episode_id
FROM user_episode_hist a 
WHERE a.userkey = ?
AND a.project_id = ?
ORDER BY first_play DESC;
`;

// 재화 획득 userkey, currency, quantity, path_code, expire
export const UQ_ACCQUIRE_CURRENCY = `
CALL sp_insert_user_property(?, ?, ?, ?);
`;

// 재화 소모 userkey, currency, quantity, reason
export const UQ_USE_CURRENCY = `
CALL sp_use_user_property(?, ?, ?, ?, ?);
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

// 가입 시에 디폴트 재화 바로 적용
export const UQ_SAVE_USER_PROFILE = `
INSERT INTO user_profile_currency ( userkey, currency, sorting_order, pos_x, pos_y, width, height, angle ) 
VALUES( ?, ?, ?, ?, ?, ?, ?, ? );
`;

export const UQ_SEND_MAIL_NEWBIE = `INSERT INTO user_mail( userkey, mail_type, currency, quantity, expire_date, connected_project ) 
VALUES(?, 'newbie', ?, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;

export const UQ_SEND_MAIL_NEWBIE_GEM = `INSERT INTO user_mail( userkey, mail_type, currency, quantity, expire_date, connected_project ) 
VALUES(?, 'newbie', 'gem', 100, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;

// 작품별 꾸미기 저장 쿼리
export const UQ_SAVE_STORY_PROFILE = `
INSERT INTO user_story_profile ( userkey, project_id, currency, sorting_order, pos_x, pos_y, width, height, angle ) 
VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ? );
`;

// 작품별 꾸미기 조회 쿼리
export const UQ_GET_USER_STORY_PROFILE = `
SELECT a.currency
, CASE WHEN currency_type = 'wallpaper' THEN fn_get_bg_info(resource_image_id, 'url')
       ELSE fn_get_design_info(resource_image_id, 'url') END currency_url
, CASE WHEN currency_type = 'wallpaper' THEN fn_get_bg_info(resource_image_id, 'key')
       ELSE fn_get_design_info(resource_image_id, 'key') END currency_key
, sorting_order
, pos_x
, pos_y 
, width
, height
, angle 
, currency_type
, b.model_id
, fn_get_currency_model_name(b.currency_type, a.project_id, b.model_id) model_name
, CASE WHEN b.currency_type = 'bubble' THEN fn_get_currency_bubble_text(a.currency, ?) 
       ELSE fn_get_currency_origin_name(b.currency_type, a.project_id, b.resource_image_id) END origin_name
FROM user_story_profile a
, com_currency b 
WHERE a.userkey = ?
  AND a.project_id = ?
  AND a.currency = b.currency
ORDER BY sorting_order;  
`;

//엔딩 힌트 리스트
export const Q_SELECT_ENDING_HINT = `
SELECT ending_id 
, a.unlock_scenes
, a.ability_condition
, a.currency
, a.price
FROM com_ending_hint a, list_episode b 
WHERE a.ending_id = b.episode_id
AND a.project_id = ?
ORDER BY sortkey, episode_id;
`;

//선택지 힌트 구매 리스트
export const Q_SELECT_SELECTION_HINT_PURCHASE = `
SELECT 
a.episode_id 
, scene_id
, selection_group 
, selection_no 
, a.price 
FROM user_selection_hint_purchase a, list_episode b 
WHERE a.episode_id = b.episode_id 
AND a.project_id = ? 
AND userkey = ?
ORDER BY sortkey, episode_id; 
`;

//프리미엄 패스 챌린지 리스트
export const Q_SELECT_PREMIUM_PASS_REWARD = `
SELECT 
cpm.premium_id
, cpm.product_id
, cpm.product_price
, cpm.sale_id
, cpm.sale_price
, cpm.step
, cpd.detail_no
, cpd.chapter_number 
, cpd.free_currency
, cpd.free_quantity
, ifnull(upr.free_reward_date, '') AS free_reward_date
, cpd.premium_currency
, cpd.premium_quantity
, ifnull(upr.premium_reward_date, '') AS premium_reward_date
FROM com_premium_master cpm
INNER JOIN com_premium_detail cpd ON cpm.premium_id = cpd.premium_id 
LEFT OUTER JOIN user_premium_reward upr ON cpd.premium_id = upr.premium_id AND upr.userkey = ? AND upr.project_id = ? AND cpd.chapter_number = upr.chapter_number 
WHERE cpm.project_id = ?;
`;
