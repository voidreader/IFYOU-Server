// ===================================
// 템플릿 시작
export const Q_SELECT_PROJECT_EXAMPLE = ``;
export const Q_INSERT_PROJECT_EXAMPLE = ``;
export const Q_UPDATE_PROJECT_EXAMPLE = ``;
export const Q_DELETE_PROJECT_EXAMPLE = ``;
// 템플릿 끝
// ===================================

// 말풍선 마스터
export const COM_SELECT_BUBBLE_MASTER = `
SELECT cbm.* 
 FROM com_bubble_master cbm 
 ORDER BY cbm.set_id ;
`;

export const COM_INSERT_BUBBLE_MASTER = `
INSERT INTO com_bubble_master (set_name, remark, sortkey) VALUES(?, ?, 0);
`;

export const COM_UPDATE_BUBBLE_MASTER = `
UPDATE com_bubble_master
SET set_name=?, remark=?
WHERE set_id=?;
`;
export const COM_DELETE_BUBBLE_MASTER = `DELETE FROM com_bubble_master WHERE set_id = ?;`;
//////////////////////////////////////////////

// 공통 말풍선 스프라이트 관리 시작
export const COM_SELECT_COM_BUBBLE_SPRITE = `
SELECT cbs.*
  FROM com_bubble_sprite cbs 
 ORDER BY cbs.bubble_sprite_id desc;
`;
export const COM_INSERT_COM_BUBBLE_SPRITE = `
INSERT INTO com_bubble_sprite (template, image_name, image_url, image_key, sortkey) 
VALUES(?, ?, ?, ?, 0);
`;
export const COM_UPDATE_COM_BUBBLE_SPRITE = `
UPDATE com_bubble_sprite
SET image_name = ?
  , image_url = ifnull(?, image_url)
  , image_key = ifnull(?, image_key)
  , template = ?
  , is_slice = ?
  , border_left = ?
  , border_right = ?
  , border_top = ?
  , border_bottom = ?
WHERE bubble_sprite_id = ?;
`;
export const COM_DELETE_COM_BUBBLE_SPRITE = `DELETE FROM com_bubble_sprite WHERE bubble_sprite_id = ?;`;
// 공통 말풍선 스프라이트 관리 끝
// ===================================

// ===================================
// 말풍선 세트 디테일 시작
export const COM_SELECT_BUBBLE_DETAIL = `
SELECT serial_no
     , set_id
     , variation
     , template
     , a.SIZE size
     , pos
     , bubble_sprite_id
     , fn_get_bubble_sprite_info('name', a.bubble_sprite_id) bubble_sprite_name
     , outline_sprite_id
     , fn_get_bubble_sprite_info('name', a.outline_sprite_id) outline_sprite_name
     , pos_x
     , pos_y
     , textarea_left
     , textarea_right
     , textarea_top
     , textarea_bottom
     , custom_size_x
     , custom_size_y
     , scale_x
     , scale_y
     , tail_sprite_id
     , fn_get_bubble_sprite_info('name', a.tail_sprite_id) tail_sprite_name
     , tail_outline_sprite_id
     , fn_get_bubble_sprite_info('name', a.tail_outline_sprite_id) tail_outline_sprite_name
     , tail_scale_x
     , tail_scale_y
     , tail_pos_x
     , tail_pos_y
     , reverse_tail_sprite_id
     , fn_get_bubble_sprite_info('name', a.reverse_tail_sprite_id) reverse_tail_sprite_name
     , reverse_tail_outline_sprite_id
     , fn_get_bubble_sprite_info('name', a.reverse_tail_outline_sprite_id) reverse_tail_outline_sprite_name
     , reverse_tail_scale_x
     , reverse_tail_scale_y
     , reverse_tail_pos_x
     , reverse_tail_pos_y
     , font_color
     , fill_color
     , outline_color
     , emoticon_pos_x
     , emoticon_pos_y
     , emoticon_scale_x
     , emoticon_scale_y
     , emoticon_width
     , emoticon_height
     , tag_sprite_id
     , fn_get_bubble_sprite_info('name', a.tag_sprite_id) tag_sprite_name
     , tag_pos_x
     , tag_pos_y
FROM com_bubble_group a
WHERE a.set_id = ?
  AND a.variation = ?
ORDER BY a.template, a.size, a.pos;
`;
export const COM_INSERT_BUBBLE_DETAIL = ``;
export const COM_UPDATE_BUBBLE_DETAIL = `
UPDATE com_bubble_group
SET bubble_sprite_id=?
  , pos_x=?
  , pos_y=?
  , textarea_left=?
  , textarea_right=?
  , textarea_top=?
  , textarea_bottom=?
  , tail_sprite_id=?
  , tail_scale_x=?
  , tail_scale_y=?
  , tail_pos_x=?
  , tail_pos_y=?
  , reverse_tail_sprite_id=?
  , reverse_tail_scale_x=?
  , reverse_tail_scale_y=?
  , reverse_tail_pos_x=?
  , reverse_tail_pos_y=?
  , emoticon_scale_x=?
  , emoticon_scale_y=?
  , emoticon_pos_x=?
  , emoticon_pos_y=?
  , custom_size_x=?
  , custom_size_y=?
  , outline_sprite_id=?
  , font_color = ?
  , fill_color = ?
  , outline_color = ?
  , tail_outline_sprite_id = ?
  , reverse_tail_outline_sprite_id = ?
  , scale_x = ? 
  , scale_y = ?
  , emoticon_width = ?
  , emoticon_height = ?
WHERE serial_no = ?
;

`;
export const COM_DELETE_BUBBLE_DETAIL = ``;
// 말풍선 세트 디테일 끝
// ===================================
