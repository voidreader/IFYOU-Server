// 쿼리 저장소입니다!

export const Q_SELECT_MINICUT_S3 = `
SELECT lm.project_id
  , lm.image_key object_key
  , lm.bucket 
FROM list_minicut lm
WHERE lm.minicut_id = ?; 
`;

// 미니컷 업데이트
//! ije90 - is_public 필드 추가(2021.07.07)
export const Q_UPDATE_MINICUT = `
UPDATE list_minicut 
   SET image_name = ?
     , image_url = ifnull(?, image_url)
     , image_key = ifnull(?, image_key) 
     , bucket = ifnull(?, bucket)
     , offset_x = ?
     , offset_y = ?
     , game_scale = ?
     , is_public = ?
     , thumbnail_id = ?
     , appear_episode = ?
WHERE project_id = ? AND minicut_id = ?;
`;

// 모델 마스터 조회
export const Q_MODEL_MASTER_GET = `
SELECT a.*
FROM list_model_master a
WHERE a.project_id = ?
ORDER BY a.sortkey, a.model_id
`;

export const Q_MODEL_SLAVE_CLEAR = `
DELETE FROM list_model_slave where model_id = ?;
`;

export const Q_MODEL_SLAVE_INSERT = `
INSERT INTO list_model_slave (model_id, file_url, file_key, is_motion, file_name) 
VALUES (?, ?, ?, ?, ?);
`;

// 모션 슬레이브와 모션의 outer join 모션 파일 세부 정보 리스트
export const Q_MODEL_SLAVE_LIST = `
SELECT lms.*, lmm.motion_name
  FROM list_model_slave lms
   LEFT OUTER JOIN list_model_motion lmm on lms.model_id = lmm.model_id AND lms.file_key = lmm.file_key 
WHERE lms.model_id = ?
;
`;

// 클라이언트에서 호출하는 모델 리소스 정보
export const Q_MODEL_RESOURCE_INFO = `
SELECT lms.*, lmm.motion_name, m.offset_x , m.offset_y , m.game_scale, m.model_ver, m.direction
  FROM list_model_master m
     , list_model_slave lms
   LEFT OUTER JOIN list_model_motion lmm on lms.model_id = lmm.model_id AND lms.file_key = lmm.file_key
WHERE lms.model_id = m.model_id
  AND m.project_id = ?
  AND m.model_name = ?
;
`;

export const SP_MODEL_MOTION_UPDATE = `
CALL sp_update_model_motion(?, ?, ?);
`;

export const Q_MODEL_MOTION_DELETE = `
DELETE FROM list_model_motion WHERE model_id = ? AND file_key = ?;
`;

export const Q_SCRIPT_SELECT = `
SELECT a.scene_id 
, fn_get_standard_name('script_template', a.template) template
, a.speaker 
, a.script_data 
, a.target_scene_id 
, a.requisite 
, a.character_expression 
, a.emoticon_expression 
, fn_get_standard_name('in_effect', a.in_effect) in_effect
, fn_get_standard_name('out_effect', a.out_effect) out_effect
, a.bubble_size 
, a.bubble_pos 
, a.bubble_hold 
, a.bubble_reverse 
, a.emoticon_size 
, a.voice 
, a.autoplay_row 
, a.dev_comment 
, a.project_id 
, a.episode_id
, a.sound_effect
, a.control
FROM list_script a
WHERE a.project_id = ?
AND a.episode_id = ?
AND a.lang = ?
ORDER BY a.sortkey, a.script_no;  
`;

// 스크립트 복원 테이블에 데이터 있는지 체크
export const Q_CHECK_SCRIPT_RECOVER_EXISTS = `
SELECT EXISTS (SELECT a.script_no FROM list_script_recover a WHERE a.episode_id = ? AND a.lang = ifnull(?, 'KO')) is_exists
  FROM DUAL;
`;

export const Q_DELETE_SCRIPT_RECOVER = `
DELETE FROM list_script_recover WHERE episode_id = ? AND lang = ?;
`;

export const Q_DELETE_SCRIPT_RECOVER_ALL = `
DELETE FROM list_script_recover WHERE episode_id = ?;
`;

// 스크립트 신규 입력
export const Q_SCRIPT_UPDATE = `
INSERT INTO pier.list_script (scene_id, template, speaker, script_data, target_scene_id, requisite, character_expression, emoticon_expression, in_effect, out_effect, bubble_size, bubble_pos, bubble_hold, bubble_reverse, emoticon_size, voice, sound_effect, autoplay_row, dev_comment, project_id, episode_id, lang)
VALUES 
(?, fn_get_standard_code('script_template', ?), 
 ?, ?, ?, ?, ?, ?, 
 fn_get_standard_code('in_effect', ?), fn_get_standard_code('out_effect', ?), 
 nullif(?, ''), nullif(?, ''), nullif(?, ''), nullif(?, ''), nullif(?, ''), 
 ?, ?, nullif(?, ''), ?, ?, ?, ifnull(?, 'KO'));
`;

export const Q_SCRIPT_UPDATE_NO_LANG = `
INSERT INTO pier.list_script (scene_id, template, speaker, script_data, target_scene_id, requisite, character_expression, emoticon_expression, in_effect, out_effect, bubble_size, bubble_pos, bubble_hold, bubble_reverse, emoticon_size, voice, sound_effect, autoplay_row, dev_comment, project_id, episode_id)
VALUES 
(?, fn_get_standard_code('script_template', ?), 
 ?, ?, ?, ?, ?, ?, 
 fn_get_standard_code('in_effect', ?), fn_get_standard_code('out_effect', ?), 
 nullif(?, ''), nullif(?, ''), nullif(?, ''), nullif(?, ''), nullif(?, ''), 
 ?, ?, nullif(?, ''), ?, ?, ?);
`;

export const SCRIPT_OBJECT = {
  episode_id: null,
  scene_id: null,
  template: null,
  speaker: null,
  script_data: null,
  target_scene_id: null,
};

// 어드민 스크립트의 캐릭터 표현 드롭다운 리스트
export const Q_SCRIPT_CHARACTER_EXPRESSION_DROPDOWN = `
SELECT lmm.model_name speaker
     , lmm2.motion_name
  FROM list_model_master lmm
     , list_model_motion lmm2 
 WHERE lmm.project_id = ?
   AND lmm2.model_id = lmm.model_id 
   ORDER BY lmm2.motion_id;
`;

// 스크립트에 scene_id 리스트 가져오기
export const Q_SCRIPT_SCENE_IDS = `

SELECT DISTINCT scene_id FROM list_script ls 
 WHERE episode_id  = ? 
 AND (scene_id IS NOT NULL AND scene_id  <> '')
ORDER BY scene_id ;

`;

/////////// 스크립트 관련 종료 /////////////////

// 캐릭터 모델 마스터 테이블 업데이트 하기.
export const Q_MODEL_MASTER_UPDATE = `
UPDATE list_model_master 
   SET offset_x  = ?
     , offset_y  = ?
     , game_scale  = ?
     , direction = ifnull(?, direction)
 WHERE model_id = ?;

`;

// 모델 버전 업데이트
export const Q_UPDATE_MODEL_VERSION = `

UPDATE list_model_master 
   set model_ver = model_ver + 1
 WHERE model_id = ?
`;

// 디바이스로 로그인
export const Q_CLIENT_LOGIN_BY_DEVICE = `
SELECT ta.*
  FROM table_account ta 
 WHERE ta.deviceid  = ?;
`;

// 게임베이스로 로그인
export const Q_CLIENT_LOGIN_BY_GAMEBASE = `
SELECT ta.userkey  
, ta.deviceid 
, ta.nickname 
, ta.admin 
, ta.gamebaseid 
, concat('#', ta.pincode, '-', ta.userkey) pincode 
, fn_get_user_unread_mail_count(ta.userkey) unreadMailCount
, ta.tutorial_step
, ta.uid
, ta.ad_charge
, ta.current_level
, ta.current_experience
, ta.account_link
, ifnull(t.tutorial_selection, 0) tutorial_selection
, t.how_to_play
, ta.intro_done
, ifnull(ta.allpass_expiration, '2022-01-01') allpass_expiration
, datediff(now(), ta.last_rate_date) diff_rate
, ta.rate_result
, ifyou_pass_day
, ta.current_culture
FROM table_account ta 
LEFT OUTER JOIN user_tutorial t ON t.userkey = ta.userkey
WHERE ta.gamebaseid  = ?;
`;

export const Q_CLIENT_LOGIN_BY_USERKEY = `
SELECT ta.userkey  
, ta.deviceid 
, ta.nickname 
, ta.admin 
, ta.gamebaseid 
, concat('#', ta.pincode, '-', ta.userkey) pincode 
, fn_get_user_unread_mail_count(ta.userkey) unreadMailCount
, ta.tutorial_step
, ta.uid
, ta.ad_charge
, ta.current_level
, ta.current_experience
, ta.account_link
, ifnull(t.tutorial_selection, 0) tutorial_selection
, t.how_to_play
, ta.intro_done
, ifnull(ta.allpass_expiration, '2022-01-01') allpass_expiration 
, datediff(now(), ta.last_rate_date) diff_rate
, ta.rate_result
, ifyou_pass_day
, ta.current_culture
FROM table_account ta 
LEFT OUTER JOIN user_tutorial t ON t.userkey = ta.userkey
WHERE ta.userkey = ?;
`;

// 클라이언트에서 계정 생성
export const Q_REGISTER_CLIENT_ACCOUNT = `
INSERT INTO pier.table_account
(deviceid, nickname, createtime, lastlogintime, admin, gamebaseid, pincode)
VALUES(?, 'GUEST', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, NULL, ?);
`;

export const Q_REGISTER_CLIENT_ACCOUNT_WITH_GAMEBASE = `
INSERT INTO pier.table_account
(deviceid, nickname, createtime, lastlogintime, admin, gamebaseid, pincode)
VALUES(?, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, ?, ?);
`;

export const Q_UPDATE_CLIENT_ACCOUNT_WITH_GAMEBASE = `
UPDATE pier.table_account 
   SET country = ?
     , valid = ?
     , lastlogintime = now() 
     , os = ?
     , current_lang = ?
     , current_culture = ?
 WHERE userkey = ?;
`;

export const Q_EMOTICON_SLAVE = `
SELECT les.* 
  FROM list_emoticon_slave les 
     , list_emoticon_master lem
 WHERE lem.project_id  = ?
   AND lem.emoticon_owner  = ?
   AND lem.emoticon_master_id  = les.emoticon_master_id 
   AND les.image_name  = ?
;
`;

// 배경 업로드(있으면 교체, 없으면 생성)
export const Q_CREATE_OR_REPLACE_BG = `
CALL sp_update_bg(?,?,?,?,?);
`;

// 이미지 업로드(있으면 교체, 없으면 생성)
//! ije90 - list_minicut_lang 추가(2021.07.08)
//TODO: 파라미터 추가(minicut_id, minicut_type, lang)
export const Q_CREATE_OR_REPLACE_IMAGE = `
CALL sp_update_image_zip(?,?,?,?,?,?,?,?);
`;

export const Q_SCRIPT_SELECT_WITH_DIRECTION = `
SELECT ls.script_no   
     , ls.episode_id 
     , ls.scene_id 
     , ls.template 
     , ls.speaker origin_speaker
     , substring_index(ls.speaker, ':', 1) speaker 
--      , substring_index(ls.speaker, ':', -1) direction
     , CASE WHEN ls.speaker IS NOT NULL AND instr(ls.speaker, ':') > 0 THEN substring_index(ls.speaker, ':', -1) 
            WHEN ls.speaker IS NULL OR ls.speaker = '' THEN ''
       ELSE 'C' END direction
     , ls.script_data 
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
     , CASE WHEN ls.template IN ('illust', 'image') THEN fn_get_live_pair_id(ls.project_id, ls.template, ls.script_data) 
            ELSE -1 END live_pair_id
 FROM list_script ls
WHERE ls.episode_id = ?
  AND ls.lang = ?
ORDER BY script_no;
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
     , CASE WHEN ls.template = 'dress' THEN fn_get_custom_user_dress(substring_index(ls.speaker, ':', 1), ls.script_data, ls.project_id, 2332)
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
AND ls.template IN ('image', 'message_image')
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

export const Q_SCRIPT_RESOURCE_MODEL = `
`;
/////////////// 여기까지 /////////////////////////

////////////// 에피소드 관련 처리 끝 /////////////////////

// * 드레스 관련
// =============================================

// 드레스 마스터 입력 (의상)
export const Q_INSERT_DRESS_MASTER = `
INSERT INTO list_dress_model (dressmodel_name, project_id) VALUES (?, ?);
`;

// 드레스 마스터 조회
export const Q_SELECT_DRESS_MASTER = `
SELECT ldm.*
  FROM list_dress_model ldm
 WHERE ldm.project_id  = ?
 ORDER BY ldm.sortkey, ldm.dressmodel_id;
`;

export const Q_UPDATE_DRESS_MASTER = `
UPDATE list_dress_model 
  SET dressmodel_name = ?
 WHERE dressmodel_id = ?;
`;

export const Q_DELETE_DRESS_MASTER = `
DELETE FROM list_dress_model WHERE dressmodel_id = ?;
`;

export const Q_INSERT_DRESS = `
CALL sp_insert_dress(?,?,?);
`;

export const Q_SELECT_DRESS_DETAIL = `
SELECT ld.* 
  FROM list_dress ld
 WHERE ld.dressmodel_id  = ?
 ORDER BY ld.sortkey ;
`;

export const Q_SELECT_PROJECT_MODEL = `
SELECT model_id , model_name 
  FROM list_model_master lmm 
 WHERE lmm.project_id = ?
 ORDER BY lmm.model_name ;
`;

// 드레스 디테일 업데이트
export const Q_UPDATE_DRESS_DETAIL = `
UPDATE list_dress 
  SET dress_name = ?
    , model_id = ?
    , sortkey = ?
 WHERE dress_id = ?
;
`;

// 드레스 디폴트 값 변경하기 - 소속된 모드 의상의 디폴트 값 초기화
export const Q_UPDATE_DRESS_DEFAULT_STEP1 = `
UPDATE list_dress 
  SET is_default = 0
 WHERE dressmodel_id = ?;
`;

// 대상이 되는 의상만 디폴트 처리.
export const Q_UPDATE_DRESS_DEFAULT_STEP2 = `
UPDATE list_dress 
  SET is_default = 1
 WHERE dress_id = ?;
`;

// 드레스 삭제
export const Q_DELETE_DRESS = `
DELETE FROM list_dress WHERE dress_id = ?;
`;

// * 드레스 끝
// =============================================

// ===================================

// 프로젝트에서 사용되는 말풍선 스프라이트 모음
export const Q_SELECT_PROJECT_BUBBLE_SPRITE = `
SELECT cbs.bubble_sprite_id
     , cbs.image_name
     , cbs.is_slice 
     , cbs.border_left 
     , cbs.border_right 
     , cbs.border_top
     , cbs.border_bottom 
  FROM com_bubble_sprite cbs 
 WHERE ( cbs.bubble_sprite_id IN (SELECT DISTINCT z.bubble_sprite_id FROM com_bubble_group z WHERE z.set_id = ?)
         OR cbs.bubble_sprite_id IN (SELECT DISTINCT z.outline_sprite_id _sprite_id FROM com_bubble_group z WHERE z.set_id = ?)
       )
;
`;

// 프로젝트 말풍선 세트 정보 조회
export const Q_SELECT_PROJECT_BUBBLE_SET = `
SELECT a.serial_no
      , a.variation 
      , a.template 
      , a.SIZE size
      , a.pos 
      , a.bubble_sprite_id
      , fn_get_bubble_sprite_info('url', a.bubble_sprite_id) bubble_sprite_url
      , fn_get_bubble_sprite_info('key', a.bubble_sprite_id) bubble_sprite_key
      , a.outline_sprite_id
      , fn_get_bubble_sprite_info('url', a.outline_sprite_id) outline_sprite_url
      , fn_get_bubble_sprite_info('key', a.outline_sprite_id) outline_sprite_key
      , a.pos_x 
      , a.pos_y 
      , a.textarea_left 
      , a.textarea_right 
      , a.textarea_top 
      , a.textarea_bottom 
      , a.scale_x 
      , a.scale_y 
      , a.tail_sprite_id
      , fn_get_bubble_sprite_info('url', a.tail_sprite_id) tail_sprite_url
      , fn_get_bubble_sprite_info('key', a.tail_sprite_id) tail_sprite_key 
      , a.tail_outline_sprite_id 
      , fn_get_bubble_sprite_info('url', a.tail_outline_sprite_id) tail_outline_sprite_url
      , fn_get_bubble_sprite_info('key', a.tail_outline_sprite_id) tail_outline_sprite_key
      , a.tail_pos_x
      , a.tail_pos_y 
      , a.tail_scale_x 
      , a.tail_scale_y 
      , a.reverse_tail_sprite_id
      , fn_get_bubble_sprite_info('url', a.reverse_tail_sprite_id) reversed_tail_sprite_url
      , fn_get_bubble_sprite_info('key', a.reverse_tail_sprite_id) reversed_tail_sprite_key
      , a.reverse_tail_outline_sprite_id 
      , fn_get_bubble_sprite_info('url', a.reverse_tail_outline_sprite_id) reverse_tail_outline_sprite_url
      , fn_get_bubble_sprite_info('key', a.reverse_tail_outline_sprite_id) reverse_tail_outline_sprite_key 
      , a.reverse_tail_pos_x 
      , a.reverse_tail_pos_y 
      , a.reverse_tail_scale_x 
      , a.reverse_tail_scale_y 
      , a.emoticon_pos_x 
      , a.emoticon_pos_y 
      , a.emoticon_scale_x 
      , a.emoticon_scale_y 
      , a.font_color 
      , a.fill_color 
      , a.outline_color 
      , a.custom_size_x 
      , a.custom_size_y
      , a.emoticon_width
      , a.emoticon_height
      , a.tag_sprite_id
      , fn_get_bubble_sprite_info('url', a.tag_sprite_id) tag_sprite_url
      , fn_get_bubble_sprite_info('key', a.tag_sprite_id) tag_sprite_key
      , a.tag_pos_x
      , a.tag_pos_y
  FROM com_bubble_group a
 WHERE a.set_id = ?
 ORDER BY a.template, a.variation, a.SIZE, a.pos;
`;

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

export const Q_SELECT_REPLACED_S3_ILLUST = `
SELECT a.project_id
     , a.image_key object_key
     , a.bucket 
FROM list_illust a
WHERE a.illust_id = ?;
`;

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

// 코인 환전
export const Q_SELECT_COIN_EXCHANGE = `
SELECT 
a.exchange_product_id
, a.star_quantity
, a.coin_quantity
, a.bonus_quantity
, CASE WHEN a.daily_purchase_cnt < 0 THEN 1
ELSE 
    CASE WHEN a.daily_purchase_cnt <= fn_get_user_coin_exchange(?, a.exchange_product_id) THEN 0 ELSE 1 END 
END exchange_check
FROM com_coin_exchange_product a
WHERE is_service > 0;
`;
