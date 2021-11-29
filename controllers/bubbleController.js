import mysql from "mysql2/promise";
import { query } from "winston";
import routes from "../routes";
import { DB } from "../mysqldb";
import {
  respond,
  respondError,
  respondRedirect,
  respondDB,
  adminLogInsert, 
  respondAdminSuccess, 
} from "../respondent";
import { logger } from "../logger";
import {
  COM_SELECT_BUBBLE_MASTER,
  COM_INSERT_BUBBLE_MASTER,
  COM_UPDATE_BUBBLE_MASTER,
  COM_DELETE_BUBBLE_MASTER,
  COM_SELECT_COM_BUBBLE_SPRITE,
  COM_INSERT_COM_BUBBLE_SPRITE,
  COM_UPDATE_COM_BUBBLE_SPRITE,
  COM_DELETE_COM_BUBBLE_SPRITE,
  COM_SELECT_BUBBLE_DETAIL,
  COM_UPDATE_BUBBLE_DETAIL,
} from "../COMQStore";
import { uploadZipResources } from "../com/com";

// 말풍선 마스터 리스트
export const getBubbleMasterList = async (req, res) => {
  const result = await DB(COM_SELECT_BUBBLE_MASTER);
  respond(result, res, "getBubbleMasterList");
};

// 말풍선 마스터 등록
export const registerBubbleMaster = async (req, res) => {
  const { body } = req;

  logger.info(`registerBubbleMaster`, body);

  const result = await DB(COM_INSERT_BUBBLE_MASTER, [
    body.set_name,
    body.remark,
  ]);

  if (!result.state) {
    logger.error(`registerBubbleMaster Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 방금 입력한 말풍선 세트의 id를 구한다.
  const querystr = `SELECT set_id FROM com_bubble_master WHERE set_name = ?`;
  const result2 = await DB(querystr, [body.set_name]);
  const { set_id } = result2.row[0];
  logger.info(`Making ${set_id} preset`);
  const sp = `CALL sp_make_bubble_set(?)`;
  const result3 = await DB(sp, [set_id]);

  adminLogInsert(req, "bubble_master_insert"); 

  respondRedirect(
    req,
    res,
    getBubbleMasterList,
    result3,
    "registerBubbleMaster"
  );
};

// 말풍선 마스터 업데이트
export const updateBubbleMaster = async (req, res) => {
  const {
    params: { id },
  } = req;
  const { body } = req;
  logger.info(`updateBubbleMaster`, body);

  const result = await DB(COM_UPDATE_BUBBLE_MASTER, [
    body.set_name,
    body.remark,
    id,
  ]);

  adminLogInsert(req, "bubble_master_update"); 

  respondRedirect(req, res, getBubbleMasterList, result, "updateBubbleMaster");
};

export const deleteBubbleMaster = async (req, res) => {
  const {
    params: { id },
  } = req;
  const { body } = req;
  logger.info(`deleteBubbleMaster`, body);

  const result = await DB(COM_DELETE_BUBBLE_MASTER, [id]);

  adminLogInsert(req, "bubble_master_delete"); 

  respondRedirect(req, res, getBubbleMasterList, result, "deleteBubbleMaster");
};

/////////////////////////////////////////////////////////////////

// 플랫폼 말풍선 스프라이트 등록정보 조회
export const getPlatformBubbleSprite = async (req, res) => {
  const result = await DB(COM_SELECT_COM_BUBBLE_SPRITE, []);
  respond(result, res, "getPlatformBubbleSprite");
};

// 플랫폼 말풍선 스프라이트 등록
export const postInsertBubbleSprite = async (req, res) => {
  const {
    body: { template, image_name },
    file: { location, key },
  } = req;

  console.log(`${template} / ${image_name} / ${location} / ${key}`);

  // 이미지 등록이 필수이기 때문에 location, key가 안들어올 수 없다.
  const result = await DB(COM_INSERT_COM_BUBBLE_SPRITE, [
    template,
    image_name,
    location,
    key,
  ]);

  adminLogInsert(req, "bubble_sprite_insert"); 

  respondRedirect(
    req,
    res,
    getPlatformBubbleSprite,
    result,
    "postInsertBubbleSprite"
  );
};

// 말풍선 스프라이트 업데이트
export const postUpdateBubbleSprite = async (req, res) => {
  const { body } = req;
  let file = null;

  if (req.file) file = req.file;
  else file = { location: null, key: null };

  logger.info(`postUpdateBubbleSprite ${JSON.stringify(body)}`);

  const result = await DB(COM_UPDATE_COM_BUBBLE_SPRITE, [
    body.image_name,
    file.location,
    file.key,
    body.template,
    body.is_slice,
    body.border_left,
    body.border_right,
    body.border_top,
    body.border_bottom,
    body.bubble_sprite_id,
  ]);

  adminLogInsert(req, "bubble_sprite_update"); 

  respondRedirect(
    req,
    res,
    getPlatformBubbleSprite,
    result,
    "postUpdateBubbleSprite"
  );
};

// 말풍선 스프라이트 삭제
export const postDeleteBubbleSprite = async (req, res) => {
  const { body } = req;
  const result = await DB(COM_DELETE_COM_BUBBLE_SPRITE, [
    body.bubble_sprite_id,
  ]);

  adminLogInsert(req, "bubble_sprite_delete"); 

  respondRedirect(
    req,
    res,
    getPlatformBubbleSprite,
    result,
    "postDeleteBubbleSprite"
  );
};

// 말풍선 세트 디테일
export const getBubbleDetailSelect = async (req, res) => {
  const {
    params: { id },
    body: { variation },
  } = req;

  const result = await DB(COM_SELECT_BUBBLE_DETAIL, [id, variation]);

  respond(result, res, "getBubbleDetailSelect");
};

// 말풍선 세트 상세정보 디폴트 값 체크하고 넣기
const SetBubbleDetailDefault = (item) => {
  const detail = item;

  //#region 네임태그
  if (
    !Object.prototype.hasOwnProperty.call(detail, `tag_sprite_id`) ||
    !detail.tag_sprite_id
  ) {
    detail.tag_sprite_id = -1;
  }
  if (
    !Object.prototype.hasOwnProperty.call(detail, `tag_pos_x`) ||
    !detail.tag_sprite_id
  ) {
    detail.tag_pos_x = 0;
  }
  if (
    !Object.prototype.hasOwnProperty.call(detail, `tag_pos_y`) ||
    !detail.tag_sprite_id
  ) {
    detail.tag_pos_y = 0;
  }
  //#endregion

  ////////

  //#region bubble_sprite_id ~ custom_size_y
  if (
    !Object.prototype.hasOwnProperty.call(detail, `bubble_sprite_id`) ||
    !detail.bubble_sprite_id
  ) {
    detail.bubble_sprite_id = -1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `outline_sprite_id`) ||
    !detail.outline_sprite_id
  ) {
    detail.outline_sprite_id = -1;
  }

  if (!Object.prototype.hasOwnProperty.call(detail, `pos_x`) || !detail.pos_x) {
    detail.pos_x = 0;
  }

  if (!Object.prototype.hasOwnProperty.call(detail, `pos_y`) || !detail.pos_y) {
    detail.pos_y = 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `textarea_left`) ||
    !detail.textarea_left
  ) {
    detail.textarea_left = 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `textarea_right`) ||
    !detail.textarea_right
  ) {
    detail.textarea_right = 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `textarea_top`) ||
    !detail.textarea_top
  ) {
    detail.textarea_top = 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `textarea_bottom`) ||
    !detail.textarea_bottom
  ) {
    detail.textarea_bottom = 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `custom_size_x`) ||
    !detail.custom_size_x
  ) {
    detail.custom_size_x = 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `custom_size_y`) ||
    !detail.custom_size_y
  ) {
    detail.custom_size_y = 0;
  }

  //#endregion

  //#region tail, reverse tail
  if (
    !Object.prototype.hasOwnProperty.call(detail, `scale_x`) ||
    !detail.scale_x
  ) {
    detail.scale_x = 1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `scale_y`) ||
    !detail.scale_y
  ) {
    detail.scale_y = 1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `tail_sprite_id`) ||
    !detail.tail_sprite_id
  ) {
    detail.tail_sprite_id = -1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `tail_outline_sprite_id`) ||
    !detail.tail_outline_sprite_id
  ) {
    detail.tail_outline_sprite_id = -1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `tail_scale_x`) ||
    !detail.tail_scale_x
  ) {
    detail.tail_scale_x = 1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `tail_scale_y`) ||
    !detail.tail_scale_y
  ) {
    detail.tail_scale_y = 1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `tail_pos_x`) ||
    !detail.tail_pos_x
  ) {
    detail.tail_pos_x = 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `tail_pos_y`) ||
    !detail.tail_pos_y
  ) {
    detail.tail_pos_y = 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `reverse_tail_sprite_id`) ||
    !detail.reverse_tail_sprite_id
  ) {
    detail.reverse_tail_sprite_id = -1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      detail,
      `reverse_tail_outline_sprite_id`
    ) ||
    !detail.reverse_tail_outline_sprite_id
  ) {
    detail.reverse_tail_outline_sprite_id = -1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `reverse_tail_scale_x`) ||
    !detail.reverse_tail_scale_x
  ) {
    detail.reverse_tail_scale_x = 1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `reverse_tail_scale_y`) ||
    !detail.reverse_tail_scale_y
  ) {
    detail.reverse_tail_scale_y = 1;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `reverse_tail_pos_x`) ||
    !detail.reverse_tail_pos_x
  ) {
    detail.reverse_tail_pos_x = 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(detail, `reverse_tail_pos_y`) ||
    !detail.reverse_tail_pos_y
  ) {
    detail.reverse_tail_pos_y = 0;
  }

  //#endregion

  return detail;
};

// 말풍선 세트 excel 형태로 업데이트 하기 (현재 사용중인 버전은 이거!)
export const postBubbleDetailScriptableUpdate = async (req, res) => {
  const {
    body: { rows },
  } = req;

  // logger.info(`postBubbleDetailScriptableUpdate`);

  if (rows === undefined || rows === null || rows.length === 0) {
    logger.error(`postBubbleDetailScriptableUpdate Error 1`);
    respondDB(res, 80019);
    return;
  }

  logger.info(`postBubbleDetailScriptableUpdate ${JSON.stringify(rows[0])}`);
  // logger.info(`postBubbleDetailScriptableUpdate ${rows.length}`);

  const setID = rows[0].set_id; // 세트 ID 받아놓고 ..
  req.body.variation = rows[0].variation; // 재조회 때문에 따로 빼놓는다.

  let updateQuery = ``;
  let queryIndex = 0;

  rows.forEach((row) => {
    // 초기화 처리하고 !
    const element = SetBubbleDetailDefault(row);

    // 쿼리 편집하기
    const query = `
    UPDATE com_bubble_group
    SET bubble_sprite_id = ${element.bubble_sprite_id}
      , pos_x = ${element.pos_x}
      , pos_y = ${element.pos_y}
      , textarea_left = ${element.textarea_left}
      , textarea_right = ${element.textarea_right}
      , textarea_top = ${element.textarea_top}
      , textarea_bottom = ${element.textarea_bottom}
      , tail_sprite_id = ${element.tail_sprite_id}
      , tail_scale_x = ${element.tail_scale_x}
      , tail_scale_y = ${element.tail_scale_y}
      , tail_pos_x = ${element.tail_pos_x}
      , tail_pos_y = ${element.tail_pos_y}
      , reverse_tail_sprite_id = ${element.reverse_tail_sprite_id}
      , reverse_tail_scale_x = ${element.reverse_tail_scale_x}
      , reverse_tail_scale_y = ${element.reverse_tail_scale_y}
      , reverse_tail_pos_x = ${element.reverse_tail_pos_x}
      , reverse_tail_pos_y = ${element.reverse_tail_pos_y}
      , emoticon_scale_x = ${element.emoticon_scale_x}
      , emoticon_scale_y = ${element.emoticon_scale_y}
      , emoticon_pos_x = ${element.emoticon_pos_x}
      , emoticon_pos_y = ${element.emoticon_pos_y}
      , custom_size_x = ${element.custom_size_x}
      , custom_size_y = ${element.custom_size_y}
      , outline_sprite_id = ${element.outline_sprite_id}
      , font_color = '${element.font_color}'
      , fill_color = '${element.fill_color}'
      , outline_color = '${element.outline_color}'
      , tail_outline_sprite_id = ${element.tail_outline_sprite_id}
      , reverse_tail_outline_sprite_id = ${element.reverse_tail_outline_sprite_id}
      , scale_x = ${element.scale_x}
      , scale_y = ${element.scale_y}
      , emoticon_width = ${element.emoticon_width}
      , emoticon_height = ${element.emoticon_height}
      , tag_sprite_id = ${element.tag_sprite_id}
      , tag_pos_x = ${element.tag_pos_x}
      , tag_pos_y = ${element.tag_pos_y}
    WHERE serial_no = ${element.serial_no};
    `;

    if (queryIndex === 0) console.log(query);

    queryIndex += 1;

    updateQuery += query; // 쿼리 처리
  });

  // logger.info(logQuery);

  const result = await DB(updateQuery);
  if (!result.state) {
    logger.error(`postBubbleDetailScriptableUpdate Error 2 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 말풍선 버전 업데이트
  if (result.state) {
    await DB(
      `
    UPDATE com_bubble_master
      SET bubble_ver = bubble_ver + 1
      WHERE set_id = ?;
    `,
      [setID]
    );
  }

  adminLogInsert(req, "bubble_sprite_script_update_all"); 

  respondRedirect(
    req,
    res,
    getBubbleDetailSelect,
    result,
    "postBubbleDetailScriptableUpdate"
  );

  // getBubbleDetailSelect(req, res);
};

// 입력 및 수정 쿼리 실행!
const CreateOrReplaceBubbleImage = async (req, res, query) => {
  const result = await DB(query);
  if (!result.state) {
    logger.error(`CreateOrReplaceBubbleImage Error ${result.error}`);
    respondDB(res, 80016, result.error);
  } else {
    // 잘 넣었으면 재조회 해줘야한다.
    respondAdminSuccess(req, res, null, "bubble_sprite_zip", getPlatformBubbleSprite);
  }
};

// 쿼리 만드는 친구
const createOrReplaceBubbleZipQuery = (
  id,
  title,
  location,
  key,
  bucket,
  body
) => {
  return mysql.format(
    `
  CALL sp_update_bubble_zip(?, ?, ?, ?, ?);
  `,
    [body.template, title, location, key, bucket]
  );
};

// 말풍선 한번에 올리기
export const uploadBubbleZip = async (req, res) => {
  if (!req.body.template) {
    logger.error(`uploadBubbleZip Error`);
    respondDB(res, 80040, "");
    return;
  }

  req.body.folder = `bubble`;

  await uploadZipResources(
    req,
    res,
    `bubble`,
    createOrReplaceBubbleZipQuery,
    CreateOrReplaceBubbleImage
  );
};
