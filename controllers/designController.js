import aws from "aws-sdk";
import unzipper from "unzipper";
import il from "iconv-lite";
import mysql from "mysql2/promise";
import { DB } from "../mysqldb";
import {
  respond,
  respondRedirect,
  respondDB,
  respondError,
  respondAdminSuccess,
  adminLogInsert,
} from "../respondent";
import { logger } from "../logger";
import { DeleteS3Object, RecordPrviousS3Object } from "../com/com";
import { Q_SELECT_REPLACED_S3_DESIGN } from "../QStore";

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

// 버킷!
const bucketName = `pierstore/assets`;

// 프리패스 뱃지 정보
export const getProjectFreepassBadge = async ({ project_id }) => {
  const result = await DB(`
  SELECT fn_get_design_info(a.resource_image_id, 'url') image_url
  , fn_get_design_info(a.resource_image_id, 'key') image_key
FROM com_currency a
WHERE a.connected_project = ${project_id}
AND a.currency_type = 'badge'
AND a.currency LIKE '%premiumpass%';
  `);

  if (result.row.length === 0) return { image_url: "", image_key: "" };
  return result.row[0];
};

export const getProjectFreepassTitleInfo = async ({ project_id }) => {
  const result = await DB(
    `
  SELECT ld.image_url, ld.image_key 
  FROM list_design ld
 WHERE ld.project_id = ?
   AND ld.design_type ='freepass_title'
ORDER BY design_id 
LIMIT 1;
  `,
    [project_id]
  );

  if (result.row.length === 0) return { image_url: "", image_key: "" };

  return result.row[0];
};
export const getProjectFreepassBannerInfo = async ({ project_id }) => {
  const result = await DB(
    `
  SELECT ld.image_url, ld.image_key 
  FROM list_design ld
 WHERE ld.project_id = ?
   AND ld.design_type ='freepass_banner'
ORDER BY design_id 
LIMIT 1;
  `,
    [project_id]
  );

  if (result.row.length === 0) return { image_url: "", image_key: "" };

  return result.row[0];
};

export const getProjectGalleryBannerInfo = async ({ project_id }) => {
  console.log(`getProjectGalleryBannerInfo : `, project_id);

  const result = await DB(
    `
  SELECT ld.image_url, ld.image_key 
  FROM list_design ld
 WHERE ld.project_id = ?
   AND ld.design_type ='gallery_top_banner'
ORDER BY design_id 
LIMIT 1;
  `,
    [project_id]
  );

  if (result.row.length === 0) return { image_url: "", image_key: "" };

  return result.row[0];
};

// ? 프로젝트 BGM 배너 정보
export const getProjectBgmBannerInfo = async ({ project_id }) => {
  const result = await DB(
    `
  SELECT ld.image_url, ld.image_key 
  FROM list_design ld
 WHERE ld.project_id = ?
   AND ld.design_type ='bgm_banner'
ORDER BY design_id 
LIMIT 1;
  `,
    [project_id]
  );

  if (result.row.length === 0) return { image_url: "", image_key: "" };

  return result.row[0];
};

// 일반 디자인 파일 조회
export const selectGraphicDesign = async (req, res) => {
  const {
    params: { id },
    body: { design_type },
  } = req;

  const result = await DB(
    `SELECT ld.*
      FROM list_design ld 
     WHERE ld.project_id = ?
       AND ld.design_type  = ?;`,
    [id, design_type]
  );

  res.status(200).json(result.row);
};

// 일반 디자인 파일 업로드
export const insertGraphicDesign = async (req, res) => {
  const {
    params: { id },
    body: { image_name, design_type },
    file: { location, key, bucket },
  } = req;

  console.log(req.body);

  const result = await DB(
    `INSERT INTO list_design
    (project_id, design_type, image_name, image_url, image_key, bucket)
    VALUES(?, ?, ?, ?, ?, ?);
    `,
    [id, design_type, image_name, location, key, bucket]
  );

  if (!result.state) {
    logger.error(`insertGraphicDesign Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  adminLogInsert(req, "design_insert");

  respondRedirect(req, res, selectGraphicDesign, result, "insertGraphicDesign");
};

// * 교체된 S3 오브젝트를 기록해놓는다. (삭제하지 않음)
const recordPreviousDesignS3Object = async (design_id) => {
  const result = await DB(Q_SELECT_REPLACED_S3_DESIGN, [design_id]);

  // 유효한 이미지 정보 존재시에만 기록
  if (result.state && result.row.length > 0 && result.row[0].bucket != null) {
    RecordPrviousS3Object(result.row[0]);
  }
};

// 삭제
export const deleteGraphicDesign = async (req, res) => {
  const {
    params: { id },
    body: { design_id, design_type },
  } = req; // ! 삭제지만 재조회를 위해서 id, design_type 함께 줄 것.

  logger.info(`deleteGraphicDesign [${JSON.stringify(req.body)}]`);

  // 이전 S3 정보 기록
  recordPreviousDesignS3Object(design_id);

  const result = await DB(
    `
  DELETE FROM list_design WHERE design_id = ?;
  `,
    [design_id]
  );

  adminLogInsert(req, "design_delete");

  // 완료 후 redirect
  respondRedirect(req, res, selectGraphicDesign, result, "deleteGraphicDesign");
};

// 이미지 수정
export const updateGraphicDesign = async (req, res) => {
  logger.info(`updateGraphicDesign [${JSON.stringify(req.body)}]`);

  const {
    params: { id },
    body: { design_id, design_type, image_name },
  } = req;

  let file = null;

  if (req.file) file = req.file;
  else file = { location: null, key: null, bucket: null };

  //
  await recordPreviousDesignS3Object(design_id);

  // ? 업데이트 하고
  const updateResult = await DB(
    `
  UPDATE list_design 
   SET design_type = ?
     , image_name = ?
     , image_url = ifnull(?, image_url)
     , image_key = ifnull(?, image_key)
     , bucket = ifnull(?, bucket) 
 WHERE design_id  = ?
  `,
    [design_type, image_name, file.location, file.key, file.bucket, design_id]
  );

  if (!updateResult.state) {
    logger.error(`updateGraphicDesign Error 1 ${updateResult.error}`);
    respondDB(res, 80026, updateResult.error);
    return;
  }

  adminLogInsert(req, "design_update");

  // ? 재조회
  respondRedirect(
    req,
    res,
    selectGraphicDesign,
    updateResult,
    "updateGraphicDesign"
  );
};

const CreateOrReplaceDesign = async (req, res, query) => {
  const result = await DB(query);
  if (!result.state) {
    logger.error(`CreateOrReplaceDesign Error ${result.error}`);
    respondDB(res, 80034, result.error);
  } else {
    // 잘 넣었으면 재조회 해줘야한다.
    respondAdminSuccess(req, res, null, "design_zip", selectGraphicDesign);
  }
};

// 한번에 올리기
export const uploadGraphicDesignZip = async (req, res) => {
  const {
    // 올라간 원본 zip파일의 위치와 키
    file: { location, key, bucket, acl },
    params: { id },
    body: { design_type }, // default값
  } = req;

  logger.info(`uploadGraphicDesignZip [${JSON.stringify(req.body)}]`);
  console.log(`file : ${decodeURI(encodeURI(JSON.stringify(req.file)))}`);

  let resultUnzip = null;

  const s3param = {
    Bucket: bucket,
    Key: key,
  };

  // 원본 압축 파일을 가져와서 압축 해제를 시작!
  // TODO 이부분은 늘 똑같아.. 같게 할 수 없을까
  const zip = s3
    .getObject(s3param)
    .createReadStream()
    .pipe(unzipper.Parse({ forceStream: true }));

  const promises = [];
  const origins = []; // zip 파일내의 오리지널 파일 정보
  let i = 1;

  // eslint-disable-next-line no-restricted-syntax
  for await (const e of zip) {
    const entry = e;

    // 한글파일명이 깨져서 압축해제할때 디코딩 해야한다.
    const { isUnicode } = entry.props.flags;
    // decode "non-unicode" filename from OEM Cyrillic character set
    const fileName = isUnicode
      ? entry.path
      : il.decode(entry.props.pathBuffer, "cp949");
    const { type } = entry;

    console.log(fileName);

    const fileLength = fileName.length;
    const lastDot = fileName.lastIndexOf(".");
    const fileExtension = fileName.substring(lastDot + 1, fileLength);
    const obfuscated = `${Date.now()}_${i}`; // 난독화

    // 확장자가 잘못되어있으면 업로드 대상에서 뺀다.
    if (!fileExtension.includes("png") && !fileExtension.includes("jpg")) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // 압축해제한 파일을 업로드 하기 위해 난독화와 이름을 처리한다.
    // middlewares의 multerBackground와 동일하게 사용한다.
    const originObj = {};

    originObj.obfuscated = `${obfuscated}.${fileExtension}`;
    // eslint-disable-next-line prefer-destructuring
    originObj.title = fileName.split(".")[0];

    origins.push(originObj);

    if (type === "File") {
      // bucket, key 주의!
      const uploadParams = {
        Bucket: bucketName,
        ACL: acl,
        Key: `${id}/com/${obfuscated}.${fileExtension}`,
        Body: entry,
      };

      promises.push(s3.upload(uploadParams).promise());
    } else {
      entry.autodrain(); // file 이 아니면 stream을 dispose. ..파일이 아닌게 올 수 도 있나..?
    }
    i += 1;
  } // end of for await

  // 모든 파일 업로드 후 DB 처리
  await Promise.all(promises)
    .then((values) => {
      resultUnzip = values;
      // console.log(resultUnzip);

      // values는 object의 배열로 받는다.
      let insertstr = "";

      resultUnzip.forEach((item) => {
        // origins 에서 title을 가져와야한다.
        let title = "";
        origins.forEach((origin) => {
          if (item.Key.includes(origin.obfuscated)) {
            title = origin.title;
          }
        });

        // zip으로 올리면 bucket과 키가 의도와 달라서 편집해서 전달.
        insertstr += mysql.format(
          `
        CALL sp_update_design_zip(?, ?, ?, ?, ?, ?);
        `,
          [
            id,
            design_type,
            title,
            item.Location,
            item.Key.replaceAll(`assets/`, ``),
            bucketName,
          ]
        );
      });

      console.log(`>>> query made ${insertstr}`);

      CreateOrReplaceDesign(req, res, insertstr);
    })
    .catch((err) => {
      logger.error(`uploadGraphicDesignZip Error ${err}`);
      respondDB(res, 80041, "");
    });

  // zip파일은 삭제.
  DeleteS3Object(bucket, key);
};

// * 공용 애니메이션 모델링 처리

// * 공용 모델 마스터 조회
export const getComModelMaster = async (req, res) => {
  const {
    body: { model_type },
  } = req;

  const result = await DB(
    `SELECT a.* FROM com_model a WHERE a.model_type = ?`,
    [model_type]
  );
  res.status(200).json(result.row);
};

// * 공용 모델 등록
export const registerComModel = async (req, res) => {
  console.log(req.body);

  const {
    body: { model_name, model_type },
  } = req;

  const result = await DB(
    `INSERT INTO com_model (model_name, model_type) VALUES (?, ?)`,
    [model_name, model_type]
  );

  // false 일때.
  if (!result.state) {
    logger.error(`postRegisterComModel Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
  }

  respondAdminSuccess(req, res, null, "com_model_insert", getComModelMaster);
};

// * 공통 모델 버전 업데이트
// ! 파일이 교체될때만 버전을 바꿔줄것
const updateComModelVersion = async (model_id) => {
  await DB(
    `UPDATE com_model SET model_ver = model_ver + 1 WHERE model_id = ${model_id}`
  );
};

// * 공용 모델 디테일 조회
export const getComModelDetail = async (req, res) => {
  const {
    body: { model_id },
  } = req;

  logger.info(`postComModelDetail [${model_id}]`);

  const result = await DB(
    `SELECT a.*
    FROM com_model_detail a
   WHERE a.model_id = ${model_id};`
  );

  res.status(200).json(result.row);
};

// * 모델 zip 파일 업로드
export const uploadComModelZipFile = async (req, res) => {
  const {
    // 올라간 원본 zip파일의 위치와 키
    file: { location, key },
    params: { id },
    body: { model_id = -1 }, // default값
  } = req;

  const s3param = {
    Bucket: bucketName,
    Key: key,
  };

  // 원본 압축 파일을 가져와서 압축 해제를 시작!
  const zip = s3
    .getObject(s3param)
    .createReadStream()
    .pipe(unzipper.Parse({ forceStream: true }));

  // async 이기 때문에 promise 사용할게
  const promises = [];
  let resultUnzip = null;
  logger.info(`postUploadComModel ${location}`);

  // eslint-disable-next-line no-restricted-syntax
  for await (const e of zip) {
    const entry = e;

    // console.log(entry);

    const fileName = entry.path;
    const { type } = entry;

    if (type === "File") {
      const uploadParams = {
        Bucket: bucketName,
        ACL: "public-read",
        Key: `com/models/${model_id}/${fileName}`,
        Body: entry,
      };

      promises.push(s3.upload(uploadParams).promise());
    } else {
      entry.autodrain(); // file 이 아니면 stream을 dispose. ..파일이 아닌게 올 수 도 있나..?
    }
  } // end of for

  logger.info(`End unzip in postUploadComModel`);

  await Promise.all(promises)
    .then((values) => {
      resultUnzip = values;
      console.log(resultUnzip);
    })
    .catch((err) => logger.error(`postUploadComModel Error 1 ${err}`));

  // 기존 디테일 모두 삭제
  await DB(`DELETE FROM com_model_detail WHERE model_id = ${model_id}`);

  let insertSQL = "";
  let motionName = "";

  resultUnzip.map((item) => {
    const keySplits = item.Key.split("/"); // 순수 파일명!
    motionName = null;

    // 모션 자동 지정
    // * 2021.09.14 루프밖에 없음.
    if (item.key.includes(`loop.motion3.json`)) motionName = "루프";

    insertSQL += mysql.format(
      `INSERT INTO com_model_detail
      (model_id, file_url, file_key, file_name, motion_name)
      VALUES(?, ?, ?, ?, ?);`,
      [
        model_id,
        item.Location,
        item.Key.replaceAll(`assets/`, ``),
        keySplits[keySplits.length - 1],
        motionName,
      ]
    );

    return true;
  });

  const slaveInsertResult = await DB(insertSQL);
  if (!slaveInsertResult.state) {
    logger.error(`postUploadComModel Error 2 ${slaveInsertResult.error}`);
    respondDB(res, 80026, slaveInsertResult.error);
  } else {
    // 잘 들어갔으면  slave 조회 처리

    adminLogInsert(req, "com_model_zip");

    getComModelDetail(req, res);
    updateComModelVersion(model_id);
  }
}; // ? end of upload com model zip;

// * 공용 모델 삭제
export const deleteComModel = async (req, res) => {
  const {
    body: { model_id, model_type },
  } = req;

  await DB(`DELETE FROM com_model WHERE model_id = ${model_id}`);

  respondAdminSuccess(req, res, null, "com_model_delete", getComModelMaster);
};

// * 공요 모델 업데이트
export const updateComModel = async (req, res) => {
  const {
    body: { model_name, offset_x, offset_y, game_scale, model_type, model_id },
  } = req;

  const result = await DB(`
  UPDATE com_model
    SET model_name = '${model_name}'
      , offset_x = ${offset_x}
      , offset_y = ${offset_y}
      , game_scale = ${game_scale}
      , model_type = '${model_type}'
  WHERE model_id = ${model_id}
  `);

  if (!result.state) {
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "com_model_update", getComModelMaster);
};

// * 클라이언트에서 사용하는 공용 모델 리스트
// * 클라이언트에서 사용합니다!!!
export const getComModelMainBannerClientList = async () => {
  const master = await DB(
    `SELECT a.* FROM com_model a WHERE a.model_type = 'main_banner'`
  );

  const detail = await DB(`
  SELECT b.*
    FROM com_model a
      , com_model_detail b
  WHERE a.model_type = 'main_banner'
    AND b.model_id = a.model_id;
   `);

  const models = {};
  const masterArray = master.row;
  const detailArray = detail.row;

  masterArray.forEach((item) => {
    const key = item.model_id.toString();

    /// 키를 id로 잡아서 넣어준다.
    if (!Object.prototype.hasOwnProperty.call(models, key)) {
      models[key] = [];
    }

    detailArray.forEach((motion) => {
      if (motion.model_id === item.model_id) models[key].push(motion); // 배열에 추가해주기.
    });
  });

  return models;
};
