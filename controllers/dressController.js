import mysql from "mysql2/promise";
import routes from "../routes";
import { DB } from "../mysqldb";
import {
  Q_SELECT_DRESS_MASTER,
  Q_INSERT_DRESS_MASTER,
  Q_SELECT_DRESS_DETAIL,
  Q_INSERT_DRESS,
  Q_UPDATE_DRESS_MASTER,
  Q_DELETE_DRESS_MASTER,
  Q_UPDATE_DRESS_DEFAULT_STEP1,
  Q_UPDATE_DRESS_DEFAULT_STEP2,
  Q_UPDATE_DRESS_DETAIL,
  Q_DELETE_DRESS,
} from "../QStore";
import { logger } from "../logger";
import { 
  respondDB,
  respondAdminSuccess,
} from "../respondent";

// 의상 디폴트 처리
export const postUpdateDressDefault = async (req, res) => {
  const {
    params: { id },
    body: { dressmodel_id, dress_id },
  } = req;

  let result = await DB(Q_UPDATE_DRESS_DEFAULT_STEP1, [dressmodel_id]);

  result = await DB(Q_UPDATE_DRESS_DEFAULT_STEP2, [dress_id]);

  respondAdminSuccess(req, res, null, "dress_default", postDressList);

};

// 드레스 리스트 조회
export const postDressList = async (req, res) => {
  const {
    params: { id },
    body: { dressmodel_id },
  } = req;

  const result = await DB(Q_SELECT_DRESS_DETAIL, [dressmodel_id]);

  res.status(200).json(result.row);
};

// 드레스 상세 입력.
export const postInsertDressDetail = async (req, res) => {
  const {
    params: { id },
    body: { model_id, dress_name, dressmodel_id },
  } = req;

  const result = await DB(Q_INSERT_DRESS, [
    dress_name,
    model_id,
    dressmodel_id,
  ]);

  if (!result.state) {
    logger.error(`postInsertDressDetail Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "dress_detail_insert", postDressList);
};

export const postUpdateDressDetail = async (req, res) => {
  console.log(`postUpdateDressDetail ${JSON.stringify(req.body)}`);

  const {
    params: { id },
    body: { model_id, dress_name, dress_id, sortkey },
  } = req;

  const result = await DB(Q_UPDATE_DRESS_DETAIL, [
    dress_name,
    model_id,
    sortkey,
    dress_id,
  ]);

  if (!result.state) {
    //res.status(400).send(`${dress_name}으로 등록된 다른 의상이 있어요!`); > 이와 같은 오류가 발생하면 차후에 수정할 예정
    logger.error(`postUpdateDressDetail Error`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "dress_detail_update", postDressList);
};

export const postDeleteDressDetail = async (req, res) => {
  const {
    params: { id },
    body: { dress_id },
  } = req;

  const result = await DB(Q_DELETE_DRESS, [dress_id]);

  respondAdminSuccess(req, res, null, "dress_detail_delete", postDressList);
};

// 드레스마스터 조회
export const getDressMaster = async (req, res) => {
  const {
    params: { id },
  } = req;

  const result = await DB(Q_SELECT_DRESS_MASTER, [id]);

  res.status(200).json(result.row);
};

/// 드레스 마스터 입력
export const postInsertDressMaster = async (req, res) => {
  const {
    params: { id },
    body: { dressmodel_name },
  } = req;

  const result = await DB(Q_INSERT_DRESS_MASTER, [dressmodel_name, id]);

  if (!result.state) {
    logger.error(`postInsertDressMaster Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "dress_master_insert", getDressMaster);
};

// 드레스 마스터 업데이트
export const postUpdateDressMaster = async (req, res) => {
  const {
    params: { id },
    body: { dressmodel_name, dressmodel_id },
  } = req;

  const result = await DB(Q_UPDATE_DRESS_MASTER, [
    dressmodel_name,
    dressmodel_id,
  ]);

  if (!result.state) {
    //res
    //  .status(400)
    //  .send(`이미 같은 이름 ${dressmodel_name} 등록되어 있습니다.`); > 이와 같은 오류가 발생하면 차후에 수정할 예정
    logger.error(`postUpdateDressMaster Error`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "dress_master_update", getDressMaster);
};

// 드레스 마스터 삭제
export const postDeleteDressMaster = async (req, res) => {
  const {
    params: { id },
    body: { dressmodel_id },
  } = req;

  const result = await DB(Q_DELETE_DRESS_MASTER, [dressmodel_id]);

  if (!result.state) {
    logger.error(`postDeleteDressMaster Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "dress_master_delete", getDressMaster);
};
