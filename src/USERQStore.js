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
