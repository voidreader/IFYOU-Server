export const MQ_CLIENT_SELECT_MISSION = `
SELECT a.mission_id, mission_name, mission_hint, is_hidden, reward_currency, reward_quantity, reward_exp, 
image_url, image_key, unlock_state
, fn_get_design_info((SELECT icon_image_id FROM com_currency WHERE currency = reward_currency), 'url') icon_image_url
, fn_get_design_info((SELECT icon_image_id FROM com_currency WHERE currency = reward_currency), 'key') icon_image_key
FROM list_mission a LEFT OUTER JOIN user_mission b ON a.mission_id = b.mission_id AND userkey = ?
WHERE project_id = ?;
`;

export const MQ_CLIENT_UPDATE_MISSION = `
UPDATE user_mission SET unlock_state = 1, receive_date = sysdate() WHERE mission_id = ?;
`;

export const MQ_CLIENT_CHECK_MISSION = `
SELECT * FROM user_mission WHERE mission_id = ? AND unlock_state = 1 AND userkey = ?; 
`;
