/* eslint-disable no-restricted-syntax */
import aws from "aws-sdk";
import unzipper from "unzipper";
import mysql from "mysql2/promise";
import routes from "../routes";
import { DB } from "../mysqldb";
import {
  Q_MODEL_MASTER_GET,
  Q_MODEL_MOTION_DELETE,
  Q_MODEL_SLAVE_CLEAR,
  Q_MODEL_SLAVE_INSERT,
  Q_MODEL_SLAVE_LIST,
  SP_MODEL_MOTION_UPDATE,
  Q_MODEL_MASTER_UPDATE,
  Q_UPDATE_MODEL_VERSION,
} from "../QStore";
import { logger } from "../logger";
import { 
  respondDB,
  adminLogInsert, 
  respondAdminSuccess,
 } from "../respondent";

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

// 모델 정보 입력
export const postInsertModelDetail = (req, res) => {
  res.status(200).send("ok");
};

// 프로젝트 캐릭터 모델 리스트 조회
export const postModelMasterList = async (req, res) => {
  const {
    params: { id },
  } = req;

  const result = await DB(Q_MODEL_MASTER_GET, [id]);

  res.status(200).json(result.row);
};

// 모델의 슬레이브 리스트 불러오기!
export const postModelSlaveList = async (req, res) => {
  const {
    params: { id },
    body: { model_id },
  } = req;

  const result = await DB(Q_MODEL_SLAVE_LIST, [model_id]);

  res.status(200).json(result.row);
};

export const postModelMasterUpdate = async (req, res) => {
  const {
    params: { id },
    body: { offset_x, offset_y, game_scale, model_id, direction },
  } = req;

  const result = await DB(Q_MODEL_MASTER_UPDATE, [
    offset_x,
    offset_y,
    game_scale,
    direction,
    model_id,
  ]);
  if (result.state) {
    respondAdminSuccess(req, res, null, "model_master_update", postModelMasterList);
  } else {
    logger.error(`postModelMasterUpdate Error ${result.error}`);
    respondDB(res, 80026, result.error);
  }
};

// * 모델 모션만 전체 다 삭제 처리
export const clearModelMotion = async (req, res) => {
  const {
    body: { model_id },
  } = req;

  const result = await DB(
    `DELETE FROM list_model_motion WHERE model_id = ${model_id}`
  );

  if (!result.state) {
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "model_motion_clear", postModelSlaveList);
};

// 모델 모션 삭제 처리
export const postModelMotionDelete = async (req, res) => {
  const {
    params: { id },
    body: { model_id, file_key },
  } = req;

  const result = await DB(Q_MODEL_MOTION_DELETE, [model_id, file_key]);

  if (result.state) {
    respondAdminSuccess(req, res, null, "model_motion_delete", postModelSlaveList);
  } else {
    logger.error(`postModelMotionDelete Error ${result.error}`);
    respondDB(res, 80026, result.error);
  }
};

// 모션 모델 업데이트
export const postModelMotionUpdate = async (req, res) => {
  const {
    params: { id },
    body: { model_id, file_key, motion_name },
  } = req;

  console.log(`postModelMotionUpdate : `, req.body);

  const result = await DB(SP_MODEL_MOTION_UPDATE, [
    model_id,
    file_key,
    motion_name,
  ]);

  if (result.state) {
    respondAdminSuccess(req, res, null, "model_motion_update", postModelSlaveList);
  } else {
    logger.error(`postModelMotionUpdate Error ${result.error}`);
    respondDB(res, 80026, result.error);
  }
};

// 최초 신규 모델 등록
export const postRegisterModel = async (req, res) => {
  const {
    params: { id },
    body: { model_type = "live2d", model_name = "" },
  } = req;

  if (model_name === "") {
    logger.error(`postRegisterModel Error`);
    respondDB(res, 80036, "");
    return;
  }

  let querystr = `
    INSERT INTO list_model_master (project_id, model_name, model_type)
    VALUES (?,?,?);
  `;

  const insertResult = await DB(querystr, [id, model_name, model_type]);
  if (!insertResult.state) {
    logger.error(`postRegisterModel Error ${insertResult.error}`);
    respondDB(res, 80026, insertResult.error);
  } else {
    // 잘 들어갔으면  마스터 리스트 재조회
    querystr = `
      SELECT a.*
        FROM list_model_master a
       WHERE a.project_id = ?
       ORDER BY a.sortkey, a.model_id
    `;

    adminLogInsert(req, "model_master_insert"); 

    const result = await DB(querystr, [id]);

    res.status(200).json(result.row);
  }
};

// model version 업데이트
export const updateModelVersion = (model_id) => {
  DB(Q_UPDATE_MODEL_VERSION, [model_id]);
};

// liv2d zip파일을 받아서 압축을 해제하고 해제한 파일을 업로드 한다.
export const postUploadLive2D = async (req, res) => {
  const {
    // 올라간 원본 zip파일의 위치와 키
    file: { location, key },
    params: { id },
    body: { model_id = -1 }, // default값
  } = req;

  let resultUnzip = null;

  const s3param = {
    Bucket: "pierstorystore/models",
    Key: key,
  };

  // 원본 압축 파일을 가져와서 압축 해제를 시작!
  const zip = s3
    .getObject(s3param)
    .createReadStream()
    .pipe(unzipper.Parse({ forceStream: true }));

  // async 이기 때문에 promise 사용할게
  const promises = [];

  for await (const e of zip) {
    const entry = e;

    // console.log(entry);

    const fileName = entry.path;
    const { type } = entry;

    if (type === "File") {
      // 압축 해제한 파일을 업로드할 장소
      // 다른 이미지와는 다르게 model은 models에서 처리하자.
      // live2d 는 여러 모델을 한 폴더에 몰아놓으면 파일 이름이 겹칠 수가 있다.
      // 그래서 각 모델별로 분리하는거야.
      // 다른 이미지 리소스 처럼 이름을 난독화는 안할래. 귀찮....
      // 클라이언트에서 저장할때 암호화하는 과정만 처리한다.
      const uploadParams = {
        Bucket: "pierstorystore/models",
        ACL: "public-read",
        Key: `${id}/${model_id}/${fileName}`,
        Body: entry,
      };

      promises.push(s3.upload(uploadParams).promise());
    } else {
      entry.autodrain(); // file 이 아니면 stream을 dispose. ..파일이 아닌게 올 수 도 있나..?
    }
  }

  await Promise.all(promises)
    .then((values) => {
      resultUnzip = values;
      console.log(resultUnzip);
    })
    .catch((err) => logger.error(`postUploadLive2D Error 1 ${err}`));

  // 업로드 종료 후 올라간 파일들 DB로 insert
  // 먼저 기존 모델 ID를 전부 삭제한다.
  await DB(Q_MODEL_SLAVE_CLEAR, [model_id]);

  let insertSQL = "";

  resultUnzip.map((item) => {
    const keySplits = item.Key.split("/"); // 순수 파일명!

    insertSQL += mysql.format(Q_MODEL_SLAVE_INSERT, [
      model_id,
      item.Location,
      item.Key,
      item.Key.includes(".motion3.json") === true ? 1 : 0,
      keySplits[keySplits.length - 1],
    ]);
    // item.Key.split("/").length > 3 ? item.Key.split("/")[3] : item.Key,

    return true;
  });

  // console.log(insertSQL);
  const slaveInsertResult = await DB(insertSQL);

  if (!slaveInsertResult.state) {
    logger.error(`postUploadLive2D Error 2 ${slaveInsertResult.error}`);
    respondDB(res, 80026, slaveInsertResult.error);
  } else {

    adminLogInsert(req, "model_zip"); 
    // 잘 들어갔으면  slave 조회 처리
    postModelSlaveList(req, res);
    // res.status(200).send("GOOD");

    updateModelVersion(model_id);
  }
};
