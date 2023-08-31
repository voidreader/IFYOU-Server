// 쿼리 저장소입니다!

/////////// 스크립트 관련 종료 /////////////////

export const Q_UPDATE_CLIENT_ACCOUNT_WITH_INFO = `
UPDATE pier.table_account 
   SET country = ?
     , valid = ?
     , lastlogintime = now() 
     , os = ?
     , current_lang = ?
     , current_culture = ?
     , client_ver = ?
     , deviceid = ?
 WHERE userkey = ?;
`;

// 이미지 업로드(있으면 교체, 없으면 생성)
//! ije90 - list_minicut_lang 추가(2021.07.08)
//TODO: 파라미터 추가(minicut_id, minicut_type, lang)
export const Q_CREATE_OR_REPLACE_IMAGE = `
CALL sp_update_image_zip(?,?,?,?,?,?,?,?);
`;

export const Q_SCRIPT = `
SELECT ls.script_no   
     , ls.episode_id 
     , ls.scene_id 
     , ls.template 
     , ls.speaker origin_speaker
     , substring_index(ls.speaker, ':', 1) speaker 
     , CASE WHEN ls.speaker IS NOT NULL AND instr(ls.speaker, ':') > 0 THEN substring_index(ls.speaker, ':', -1) 
            WHEN ls.speaker IS NULL OR ls.speaker = '' THEN ''
       ELSE 'C' END direction
     , CASE WHEN ls.template = 'dress' THEN fn_get_custom_user_dress(substring_index(ls.speaker, ':', 1), ls.script_data, ls.project_id, ?)
            ELSE ls.script_data END script_data
     , ls.target_scene_id
     , ls.requisite 
     , ls.character_expression 
     , ls.emoticon_expression 
     , ls.in_effect 
     , ls.out_effect 
     , ls.bubble_size
     , ls.bubble_pos
     , ls.bubble_hold
     , ls.bubble_reverse
     , ls.emoticon_size 
     , ls.voice 
     , ls.sound_effect
     , ls.autoplay_row 
     , ls.dev_comment
     , ls.project_id
     , ifnull(ls.control, '') control
     , ls.selection_group
     , ls.selection_no
 FROM list_script ls
WHERE ls.episode_id = ?
  AND ls.lang = ?
ORDER BY script_no;
`;

// 스크립트에서 사용하는 리소스들
export const Q_SCRIPT_RESOURCE_BG = `
SELECT DISTINCT lb.bg_id
, lb.image_name
, lb.image_url 
, lb.image_key 
, lb.game_scale
FROM list_script ls
, list_bg lb 
WHERE ls.project_id = ?
AND ls.episode_id = ?
AND ls.lang = ?
AND lb.project_id = ls.project_id 
AND ls.template IN ('background', 'move_in')
AND substring_index(ls.script_data, ':', 1) = lb.image_name;
`;

export const Q_SCRIPT_RESOURCE_IMAGE = `
SELECT DISTINCT lm.minicut_id 
, lm.image_name
, lm.image_url 
, lm.image_key 
, ifnull(lm.offset_x, 0) offset_x
, ifnull(lm.offset_y, 0) offset_y
, ifnull(lm.game_scale, 1) game_scale
, lm.is_resized
FROM list_script ls
, list_minicut lm 
WHERE ls.project_id = ?
AND ls.episode_id = ?
AND ls.lang = ?
AND lm.project_id = ls.project_id 
AND ls.template IN ('image', 'message_image', 'image_selection')
AND ls.script_data = lm.image_name;
`;

export const Q_SCRIPT_RESOURCE_ILLUST = `
SELECT DISTINCT li.illust_id 
, li.image_name
, li.image_url 
, li.image_key 
FROM list_script ls
, list_illust li 
WHERE ls.project_id = ?
AND ls.episode_id = ?
AND ls.lang = ?
AND li.project_id = ls.project_id 
AND ls.template = 'illust'
AND ls.script_data = li.image_name;
`;

export const Q_SCRIPT_RESOURCE_EMOTICON = `
SELECT DISTINCT lem.emoticon_owner
, les.emoticon_slave_id 
, les.image_name
, les.image_url 
, les.image_key 
, les.emoticon_master_id 
FROM list_script ls
, list_emoticon_master lem 
, list_emoticon_slave les 
WHERE ls.project_id = ?
AND ls.episode_id = ?
AND ls.lang = ?
AND (ls.emoticon_expression IS NOT NULL AND ls.emoticon_expression <> '')
AND (ls.speaker IS NOT NULL AND ls.speaker <> '')
AND ls.template IN (SELECT z.code FROM list_standard z WHERE z.standard_class IN ('talking_template', 'message_template'))
AND ls.project_id = lem.project_id 
AND lem.emoticon_owner = ls.speaker
AND les.emoticon_master_id = lem.emoticon_master_id 
AND les.image_name = ls.emoticon_expression 
;
`;

// 스크립트에서 사용되는 보이스 리스트
export const Q_SCRIPT_RESOURCE_VOICE = `
SELECT DISTINCT sound.sound_id 
     , sound.sound_name
     , sound.sound_url 
     , sound.sound_key
     , sound.game_volume
     , sound.sound_type
  FROM list_script ls 
     , list_sound sound
 WHERE ls.project_id = ?
   AND ls.episode_id = ?
   AND ls.lang = ?
   AND (ls.voice IS NOT NULL AND ls.voice <> '') 
   AND sound.project_id = ls.project_id 
   AND sound.sound_type = 'voice'
   AND sound.sound_name = ls.voice 
   AND sound.sound_url IS NOT NULL;
`;

// 스크립트에서 사용되는 효과음 리스트
export const Q_SCRIPT_RESOURCE_SE = `
SELECT DISTINCT sound.sound_id 
     , sound.sound_name
     , sound.sound_url 
     , sound.sound_key
     , sound.game_volume
     , sound.sound_type
  FROM list_script ls 
     , list_sound sound
 WHERE ls.project_id = ?
   AND ls.episode_id = ?
   AND ls.lang = ?
   AND (ls.sound_effect IS NOT NULL AND ls.sound_effect <> '') 
   AND sound.project_id = ls.project_id 
   AND sound.sound_type = 'se'
   AND sound.sound_name = ls.sound_effect
   AND sound.sound_url IS NOT NULL;
`;

// 스크립트에서 사용되는 배경음 리스트
export const Q_SCRIPT_RESOURCE_BGM = `
SELECT DISTINCT sound.sound_id 
     , sound.sound_name
     , sound.sound_url 
     , sound.sound_key
     , sound.game_volume
     , sound.sound_type
  FROM list_script ls 
     , list_sound sound
 WHERE ls.project_id = ?
   AND ls.episode_id = ?
   AND ls.lang = ?
   AND ls.template = 'bgm'
   AND sound.project_id = ls.project_id 
   AND sound.sound_type = 'bgm'
   AND sound.sound_name = ls.script_data 
   AND sound.sound_url IS NOT NULL;
`;

/////////////// 여기까지 /////////////////////////

////////////// 에피소드 관련 처리 끝 /////////////////////

// * 드레스 관련
// =============================================

export const Q_SELECT_PROJECT_MODEL = `
SELECT model_id , model_name 
  FROM list_model_master lmm 
 WHERE lmm.project_id = ?
 ORDER BY lmm.model_name ;
`;

// * 드레스 끝
// =============================================

// ===================================

// 프로젝트 모델파일 모두 조회 (getUSerSelectedStory)
export const Q_SELECT_PROJECT_MODEL_ALL_FILES = `
SELECT m.model_name
     , lms.*
     , fn_get_motion_name(lms.model_id, lms.file_key) motion_name
     , m.offset_x
     , m.offset_y
     , m.game_scale
     , m.model_ver
     , m.direction
     , m.tall_grade
  FROM list_model_master m
    LEFT OUTER JOIN list_model_slave lms ON lms.model_id = m.model_id 
 WHERE m.project_id = ?
 ORDER BY m.model_id , lms.sortkey, lms.model_slave_id; 
`;

// 프로젝트 라이브 오브젝트 파일 모두 조회
export const Q_SELECT_PROJECT_LIVE_OBJECT_ALL_FILES = `
SELECT a.live_object_id 
     , a.live_object_name
     , a.offset_x 
     , a.offset_y 
     , a.game_scale 
     , a.object_ver
     , b.*
  FROM list_live_object a
     , list_live_object_detail b
WHERE a.project_id = ?
  AND b.live_object_id = a.live_object_id
ORDER BY a.live_object_id;
`;

// 프로젝트 라이브 일러스트 파일 모두 조회
export const Q_SELECT_PROJECT_LIVE_ILLUST_ALL_FILES = `
SELECT a.live_illust_id 
     , a.live_illust_name
     , a.offset_x 
     , a.offset_y 
     , a.game_scale 
     , a.scale_offset
     , a.illust_ver 
     , b.*
  FROM list_live_illust a
     , list_live_illust_detail b
WHERE a.project_id = ?
 AND b.live_illust_id = a.live_illust_id
ORDER BY a.live_illust_id;
`;

// ===================================

// 사운드 관리 끝
// ===================================

export const Q_SELECT_PROJECT_BGM = `
SELECT a.sound_id   
, a.sound_url 
, a.sound_key 
, a.game_volume
, b.public_name sound_name
FROM list_sound a, list_sound_lang b  
WHERE a.project_id = ?
AND a.sound_type  = 'bgm'
AND a.is_public = 1
AND a.sound_id = b.sound_id 
AND b.lang = ? 
ORDER BY sound_id;
`;

export const Q_SELECT_PROJECT_NAME_TAG = `
SELECT nt.speaker 
, nt.main_color 
, nt.sub_color 
, nt.KO 
, nt.EN 
, nt.JA 
, nt.ZH
, nt.SC 
, nt.AR
, nt.MS
, nt.ES
, nt.RU
, fn_get_design_info(nt.voice_banner_id, 'url') banner_url
, fn_get_design_info(nt.voice_banner_id, 'key') banner_key
FROM list_nametag nt
WHERE nt.project_id = ?;
`;

export const Q_SELECT_PROJECT_DETAIL = `
SELECT a.project_id 
, ifnull(b.title, a.title) title
, ifnull(b.summary, a.summary) summary 
, ifnull(b.writer , a.writer) writer 
, a.sortkey 
, a.bubble_set_id
, a.favor_use 
, a.challenge_use 
, a.is_credit 
, a.is_complete
, fn_get_main_episode_count(a.project_id) episode_count
, fn_get_design_info(b.ifyou_banner_id, 'url') ifyou_image_url
, fn_get_design_info(b.ifyou_banner_id, 'key') ifyou_image_key
, fn_get_design_info(b.ifyou_thumbnail_id, 'url') ifyou_thumbnail_url
, fn_get_design_info(b.ifyou_thumbnail_id, 'key') ifyou_thumbnail_key
, a.color_rgb
, b.original
FROM list_project_master a
LEFT OUTER JOIN list_project_detail b ON b.project_id = a.project_id AND b.lang = ?
WHERE a.project_id = ?;
`;

export const Q_SELECT_PROJECT_VOICE = `
SELECT ls.sound_id
, ls.sound_name 
, ls.speaker
, ls.sound_url 
, ls.sound_key 
, script.script_data 
, le.episode_id 
, le.title
, le.sortkey
, le.episode_type
, fn_check_voice_unlock(?, ls.project_id, ls.sound_id) is_open
FROM list_sound ls 
, list_script script
, list_episode le 
WHERE ls.project_id = ?
AND ls.is_public = 1
AND script.project_id = ls.project_id 
AND (script.voice <> '' AND script.voice IS NOT NULL)
AND script.voice = ls.sound_name 
AND le.episode_id = script.episode_id 
ORDER BY ls.speaker, le.episode_type, le.sortkey;
`;

// ===================================
// 템플릿 시작
export const Q_SELECT_PROJECT_EXAMPLE = ``;
export const Q_INSERT_PROJECT_EXAMPLE = ``;
export const Q_UPDATE_PROJECT_EXAMPLE = ``;
export const Q_DELETE_PROJECT_EXAMPLE = ``;
// 템플릿 끝
// ===================================

export const Q_SELECT_OTOME_ITEM = `
SELECT a.currency
, a.local_code
, fn_get_design_info(a.icon_image_id, 'url') icon_url
, fn_get_design_info(a.icon_image_id, 'key') icon_key
, fn_get_design_info(a.resource_image_id, 'url') resource_url
, fn_get_design_info(a.resource_image_id, 'key') resource_key
, a.is_ability 
, a.model_id 
, fn_get_model_speaker(a.model_id) speaker
, ccp.product_type 
, ccp.connected_bg 
, ifnull(bg.image_name, '') connected_bg_name
, ifnull(cca.ability_id, -1) ability_id
, ifnull(cca.add_value, 0) add_value
, fn_get_user_property(?, a.currency) hasCurrency
, fn_get_currency_model_name('standing', ?, a.model_id) origin_model_name
, ccp.price
, ccp.sale_price
FROM com_currency a
LEFT OUTER JOIN com_currency_ability cca ON cca.currency = a.currency 
LEFT OUTER JOIN com_ability ca ON ca.ability_id = cca.ability_id
, com_coin_product ccp
LEFT OUTER JOIN list_bg bg ON bg.bg_id = ccp.connected_bg 
WHERE a.connected_project = ?
AND a.currency_type = 'standing'
AND ccp.currency = a.currency 
AND ccp.is_public  > 0
ORDER BY a.sortkey;
`;

export const Q_SELECT_OTOME_USER_DRESS = `
SELECT upd.speaker
, upd.current_currency
, upd.is_main
FROM user_project_dress upd 
WHERE upd.project_id = ?
AND upd.userkey = ?;
`;

// 유저 미수신 메일 리스트(만료일 지나지 않은 것들)
export const Q_PACKAGE_UNREAD_MAIL_LIST = `
SELECT a.mail_no
, a.userkey
, a.mail_type
, fn_get_standard_text_id('mail_type', a.mail_type) mail_type_textid
, a.currency
, a.quantity
, a.is_receive
, a.connected_project
, fn_get_project_name_new(a.connected_project, ?) connected_project_title
, TIMESTAMPDIFF(HOUR, now(), a.expire_date) remain_hours
, TIMESTAMPDIFF(MINUTE, now(), a.expire_date) remain_mins
, cc.local_code
, a.purchase_no 
, fn_get_design_info(cc.icon_image_id, 'url') icon_image_url
, fn_get_design_info(cc.icon_image_id, 'key') icon_image_key
, ifnull(a.contents, '') contents
FROM user_mail a
LEFT OUTER JOIN com_currency cc ON cc.currency = a.currency 
WHERE a.userkey = ?
AND a.is_receive = 0 
AND a.expire_date > now()
AND a.connected_project in (-1, ?)
ORDER BY a.mail_no desc;
`;

// 계정 에너지 개수 조회
export const Q_USER_ENERGY = `SELECT a.energy FROM table_account a WHERE a.userkey = ?;`;
export const Q_USER_PACKAGE_PROPERTY = `
SELECT DISTINCT up.currency 
FROM user_property up
  , com_currency cc 
WHERE userkey = ?
AND cc.currency = up.currency
AND up.current_quantity > 0
and cc.connected_project IN (-1, ?)
AND cc.consumable = 0;  
`;
