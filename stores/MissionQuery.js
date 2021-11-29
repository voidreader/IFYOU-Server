// 어드민 미션 조회
export const MQ_ADMIN_SELECT_MISSION = `
SELECT lm.mission_id
     , fn_get_mission_lang(lm.mission_id, ?, 'name') mission_name
     , fn_get_mission_lang(lm.mission_id, ?, 'hint') mission_hint
     , fn_check_mission_lang_exists(lm.mission_id, ?) lang_exists
     , lm.mission_type
     , lm.is_hidden
     , lm.project_id
     , lm.mission_condition
     , lm.mission_figure
     , lm.id_condition
     , lm.reward_exp
     , lm.reward_currency
     , lm.reward_quantity
     , lm.image_url
     , lm.image_key
     , date_format(lm.start_date, '%Y-%m-%d %T') start_date 
     , date_format(lm.end_date , '%Y-%m-%d %T') end_date 
  FROM list_mission lm
 WHERE lm.project_id = ?
 ORDER BY lm.mission_id
;
`;

// 어드민, 미션 업데이트 (13개 파라매터)
export const MQ_ADMIN_UPDATE_MISSION = `
CALL sp_update_mission(?,?,?,?, ?,?,?,?, ?,?,?,?, ?,?);
`;

// 어드민. 미션 신규 입력 13개 파라매터
export const MQ_ADMIN_INSERT_MISSION = `
CALL sp_insert_mission (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

// 미션 삭제
export const MQ_ADMIN_DELETE_MISSION = `
DELETE FROM list_mission
WHERE mission_id  = ?;

DELETE FROM list_mission_lang
WHERE mission_id  = ?;
`;

export const MQ_CLIENT_SELECT_MISSION = `
SELECT a.mission_id, mission_name, mission_hint, is_hidden, reward_currency, reward_quantity, reward_exp, 
image_url, image_key, unlock_state
FROM list_mission a LEFT OUTER JOIN user_mission b ON a.mission_id = b.mission_id AND userkey = ?
WHERE project_id = ?;
`;

export const MQ_CLIENT_UPDATE_MISSION = `
UPDATE user_mission SET unlock_state = 1, receive_date = sysdate() WHERE mission_id = ?;
`;

export const MQ_CLIENT_CHECK_MISSION = `
SELECT * FROM user_mission WHERE mission_id = ? AND unlock_state = 1 AND userkey = ?; 
`;
