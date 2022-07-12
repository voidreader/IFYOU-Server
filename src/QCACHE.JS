


export const CACHE_BUBBLE_MASTER= `
SELECT 
DISTINCT lp.bubble_set_id AS bubbleID 
, cbm.*
FROM list_project_master lp, com_bubble_master cbm 
WHERE lp.project_id > 0
AND cbm.set_id = lp.bubble_set_id
AND lp.is_public > 0;
`;

export const CACHE_BUBBLE_SET = `
SELECT a.set_id 
, a.serial_no
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

export const CACHE_BUBBLE_SPRITE = `
SELECT DISTINCT cbg.set_id 
	 , cbs.bubble_sprite_id
     , cbs.image_name
     , cbs.is_slice 
     , cbs.border_left 
     , cbs.border_right 
     , cbs.border_top
     , cbs.border_bottom 
  FROM com_bubble_sprite cbs, com_bubble_group cbg 
  WHERE ( cbs.bubble_sprite_id = cbg.bubble_sprite_id OR cbs.bubble_sprite_id = cbg.outline_sprite_id )
 AND cbg.set_id = ?
 AND cbs.bubble_sprite_id > 0; 
`;