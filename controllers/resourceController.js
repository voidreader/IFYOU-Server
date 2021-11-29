import unzipper from "unzipper";
import il from "iconv-lite";
import mysql from "mysql2/promise";
import routes from "../routes";
import { DB } from "../mysqldb";
import {
  Q_CREATE_OR_REPLACE_BG,
  Q_UPDATE_MINICUT,
  Q_CREATE_OR_REPLACE_IMAGE,
  Q_SELECT_MINICUT_S3,
  Q_SELECT_REPLACED_S3_BG,
} from "../QStore";
import {
  respond,
  respondRedirect,
  respondDB,
  adminLogInsert, 
  respondAdminSuccess,
} from "../respondent";
import { logger } from "../logger";
import {
  awsAccessInfo,
  mainBucketName,
  DeleteS3Object,
  RecordPrviousS3Object,
} from "../com/com";

const CreateOrReplaceImage = async (req, res, query) => {
  const result = await DB(query);
  if (!result.state) {
    logger.error(`CreateOrReplaceImage Error ${result.error}`);
    respondDB(res, 80034, result.error);
  } else {
    // 잘 넣었으면 재조회 해줘야한다.
    respondAdminSuccess(req, res, null, "minicut_zip", getMinicut);
  }
};

//////////////////// S3 처리 끝  //////////////////////

// 배경 리스트 조회
export const getBG = async (req, res) => {
  const {
    params: { id },
  } = req;

  const querystr =
    "SELECT a.* " +
    "FROM list_bg a " +
    "WHERE a.is_valid = 1 AND a.project_id = ? " +
    "ORDER BY a.sortkey, a.bg_id";

  const result = await DB(querystr, [id]);

  res.status(200).json(result.row);
}; // 배경 리스트 조회 끝

// 배경 신규 등록
export const postInsertBG = async (req, res) => {
  // console.log(req);

  const {
    params: { id },
    body: { title },
    file: { location, key, bucket },
  } = req;

  // 체크 해보려고..
  console.log(req.file);

  const querystr =
    "INSERT INTO list_bg(project_id, image_name, image_url, image_key, bucket) " +
    "VALUES (?, ?, ?, ?, ?)";

  const result = await DB(querystr, [id, title, location, key, bucket]);
  // console.log(result);

  // false 일때.
  if (!result.state) {
    logger.error(`postInsertBG Error ${result.error}`);
    respondDB(res, 80026, result.error);
    DeleteS3Object(bucket, key); // * 실패했을때 삭제한다.
    return;
  }

  respondAdminSuccess(req, res, null, "bg_insert", getBG);
}; // 배경 신규 등록 끝

// 배경 리소스 업데이트 처리
export const postUpdateBG = async (req, res) => {
  logger.info(`postUpdateBG`);

  const {
    params: { id },
    body: { title, bg_id, game_scale = 1 },
  } = req;
  let file;

  if (req.file) file = req.file;
  else file = { location: null, key: null, bucket: null };

  // 이전 S3
  const previousS3 = await DB(Q_SELECT_REPLACED_S3_BG, [bg_id]);

  // 업데이트 쿼리
  const updateQuery = `
    UPDATE list_bg 
       SET image_name = ?
         , image_url = ifnull(?, image_url)
         , image_key = ifnull(?, image_key) 
         , bucket = ifnull(?, bucket)
         , game_scale = ?
     WHERE project_id = ? AND bg_id = ?
     ;
  `;

  const result = await DB(updateQuery, [
    title,
    file.location,
    file.key,
    file.bucket,
    game_scale,
    id,
    bg_id,
  ]);

  console.log(result);

  if (!result.state) {
    logger.error(`postUpdateBG Error ${result.error}`);
    respondDB(res, 80026, result.error);

    // * 실패했으면 이번에 업로드한 S3 오브젝트 삭제
    if (file.bucket != null) DeleteS3Object(file.bucket, file.key);
    return;
  }

  // 이미지 업데이트 성공시 이전 저장된 파일이 있는 경우 삭제 처리
  if (
    file.key != null &&
    previousS3.row.length > 0 &&
    previousS3.row[0].bucket != null
  ) {
    RecordPrviousS3Object(previousS3.row[0]);
  }

  respondAdminSuccess(req, res, null, "bg_update", getBG);
}; // 배경 리소스 업데이트 처리 끝

// 배경 리소스 삭제 처리
export const postDeleteBG = async (req, res) => {
  const {
    params: { id },
    body: { bg_id },
  } = req;

  // 이전 S3
  const previousS3 = await DB(Q_SELECT_REPLACED_S3_BG, [bg_id]);

  if (previousS3.row.length > 0 && previousS3.row[0].bucket != null) {
    RecordPrviousS3Object(previousS3.row[0]);
  }

  await DB(`DELETE FROM list_bg WHERE bg_id = ?`, [bg_id]);

  //
  respondAdminSuccess(req, res, null, "bg_delete", getBG);
}; // 배경 리소스 삭제 처리 종료

///////////// 배경 리소스 처리 끝 ////////////////////////////////////

///////////// 미니컷 리소스 처리 시작 ////////////////////////////////////
export const getMinicut = async (req, res) => {
  //! ije90 - 미니컷 필드 추가(2021.07.05)

  // es6 문법에 따라서
  const {
    params: { id },
    body: { lang = "KO" },
  } = req;

  //TODO : is_public, public_name, summary 필드 추가
  const querystr = `SELECT a.*
    , ifnull(fn_get_minicut_localized_text(a.minicut_id, 'minicut', '${lang}', 'name'), a.image_name) public_name
    , fn_get_minicut_localized_text(a.minicut_id, 'minicut', '${lang}', 'summary') summary
    , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
    FROM list_minicut a
    WHERE a.is_valid = 1 AND a.project_id = ?
    ORDER BY a.sortkey, a.minicut_id;`;

  const result = await DB(querystr, [id]);

  if (!result.state) {
    logger.error(`getMinicut Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
}; // END

// 신규 등록
export const postInsertMinicut = async (req, res) => {
  //! ije90 - 파일 첨부 시, list_minicut_lang 삽입(2021.07.07)

  //TODO: req를 params, body로 나뉜 걸 합쳐서 object 선언
  const {
    params: { id },
    body: {
      title,
      minicut_type = "minicut",
      summary = "",
      lang = "KO",
      thumbnail_id = -1,
    },
  } = req;

  let file;
  if (req.file) file = req.file;
  else file = { location: null, key: null, bucket: null };

  // 아이고 여긴 저장할때 minicut이네 .... 스크립트에서는 image.. .ㅠㅠ

  const querystr = `INSERT INTO list_minicut(project_id, image_name, image_url, image_key, bucket, thumbnail_id)
    VALUES (?, ?, ?, ?, ?, ?);`;

  const result = await DB(querystr, [
    id,
    title,
    file.location,
    file.key,
    file.bucket,
    thumbnail_id,
  ]);

  // false 일때.
  if (!result.state) {
    logger.error(`postInsertMinicut Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  //TODO: 로컬라이징텍스트 추가
  if (file.location) {
    // ! insert라서 title을 public_name으로 일단 그대로 사용
    const updateLocalizedText = await DB(
      `CALL sp_update_minicut_localized_text('${result.row.insertId}', '${minicut_type}', '${title}', '${summary}', '${lang}')`,
      []
    );

    if (!updateLocalizedText.state) {
      logger.error(`postInsertMinicut Error 2 ${updateLocalizedText.error}`);
      respondDB(res, 80026, updateLocalizedText.error);
      return;
    }
  }

  // res.redirect(routes.miniList(id));
  respondAdminSuccess(req, res, null, "minicut_insert", getMinicut);
}; // 신규 등록 끝

// 업데이트 처리
export const postUpdateMinicut = async (req, res) => {
  console.log(`postUpdateMinicut`);

  //! ije90 - 파일 첨부 시, list_minicut_lang 수정(2021.07.07)

  //TODO: req를 params, body로 나뉜 걸 합쳐서 object 선언
  const {
    params: { id },
    body: {
      title,
      minicut_id,
      offset_x,
      offset_y,
      game_scale,
      is_public = 0,
      public_name = "",
      summary = "",
      lang = "KO",
      thumbnail_id = -1,
      appear_episode = -1,
    },
  } = req;

  let file = null;
  if (req.file) file = req.file;
  else file = { location: null, key: null, bucket: null };

  // console.log(file);

  const s3Result = await DB(Q_SELECT_MINICUT_S3, [minicut_id]);

  //TODO: is_public 필드 추가
  const result = await DB(Q_UPDATE_MINICUT, [
    title,
    file.location,
    file.key,
    file.bucket,
    offset_x,
    offset_y,
    game_scale,
    is_public,
    thumbnail_id,
    appear_episode,
    id,
    minicut_id,
  ]);

  if (!result.state) {
    logger.error(`postUpdateMinicut Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 신규 이미지를 받은 경우에는 이전 S3 오브젝트 삭제 처리
  if (
    file.key != null &&
    s3Result.state &&
    s3Result.row.length > 0 &&
    s3Result.row[0].bucket != null
  ) {
    RecordPrviousS3Object(s3Result.row[0]);
  }

  //TODO: 로컬라이징텍스트 추가
  // ! HJ 멀티라인이 입력되는 텍스트는 ? 를 파라매터로 치환하는게 안전해서 수정했음
  // ! JE 파일이 있든 없든 업데이트 되도록 변경
  const updateLocalizedText = await DB(
    `CALL sp_update_minicut_localized_text('${minicut_id}', 'minicut', '${public_name}', ?, '${lang}')`,
    [summary]
  );

  if (!updateLocalizedText.state) {
    logger.error(`postUpdateMinicut Error 2 ${updateLocalizedText.error}`);
    respondDB(res, 80026, updateLocalizedText.error);
    return;
  }

  // res.redirect(routes.miniList(id));
  respondAdminSuccess(req, res, null, "minicut_update", getMinicut);
}; // 미니컷 이미지 업데이트 처리 끝

// 삭제 처리
export const postDeleteMinicut = async (req, res) => {
  //! ije90 - list_minicut_lang 삭제(2021.07.08)

  //TODO: minicut_type 추가
  const {
    params: { id },
    body: { minicut_id, minicut_type = "minicut" },
  } = req;

  // 미니컷 S3 정보 가져오기.
  const s3Result = await DB(Q_SELECT_MINICUT_S3, [minicut_id]);

  //TODO: 로컬라이징텍스트 추가
  const result = await DB(
    `
  DELETE FROM list_minicut WHERE minicut_id = ?;
  DELETE FROM list_minicut_lang WHERE minicut_id = ? AND minicut_type = ?;
   `,
    [minicut_id, minicut_id, minicut_type]
  );

  //TODO: 오류 발생 추가
  if (!result.state) {
    logger.error(`postDeleteMinicut Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 제대로 안지워졌는데 S3 오브젝트 지우면 안됨..
  if (
    result.state &&
    s3Result.state &&
    s3Result.row.length > 0 &&
    s3Result.row[0].bucket != null
  ) {
    RecordPrviousS3Object(s3Result.row[0]);
  }

  // res.redirect(routes.miniList(id));
  respondAdminSuccess(req, res, null, "minicut_delete", getMinicut);
}; // END

// 미니컷 zip 파일 업로드
export const postUploadImageZip = async (req, res) => {
  //! ije90 - list_minicut_lang 추가(2021.07.08)

  //TODO: 필요없는 변수 제거
  const {
    // 올라간 원본 zip파일의 위치와 키
    file: { key, bucket, acl },
    params: { id },
  } = req;

  console.log(`file : ${decodeURI(encodeURI(JSON.stringify(req.file)))}`);

  let resultUnzip = null;

  const s3param = {
    Bucket: bucket,
    Key: key,
  };

  // 원본 압축 파일을 가져와서 압축 해제를 시작!
  const zip = awsAccessInfo
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
        Bucket: mainBucketName,
        ACL: acl,
        Key: `${id}/image/${obfuscated}.${fileExtension}`,
        Body: entry,
      };

      promises.push(awsAccessInfo.upload(uploadParams).promise());
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
        insertstr += mysql.format(Q_CREATE_OR_REPLACE_IMAGE, [
          id,
          title,
          item.Location,
          item.Key.replaceAll(`assets/`, ``),
          mainBucketName,
          0,
          "minicut",
          "KO",
        ]);
      });

      console.log(`>>> query made ${insertstr}`);

      CreateOrReplaceImage(req, res, insertstr);
    })
    .catch((err) => {
      logger.error(`postUploadImageZip Error ${err}`);
      respondDB(res, 80041, "");
    });

  // * zip 파일 제거
  DeleteS3Object(bucket, key);
}; // zip 파일 업로드 제거
///////////// 미니컷 리소스 처리 종료 ////////////////////////////////////

///////////// 이모티콘 리소스 처리 시작 ////////////////////////////////////
export const getEmoticonMaster = async (req, res) => {
  // emoticon master 리스트 조회
  const {
    params: { id },
  } = req;

  const result = await DB(
    `SELECT lem.* FROM list_emoticon_master lem WHERE lem.project_id = ?`,
    [id]
  );

  res.status(200).json(result.row);
};

// 이모티콘 마스터 신규 등록
export const postInsertEmoticonMaster = async (req, res) => {
  const {
    params: { id },
    body: { emoticon_owner },
  } = req;

  console.log(req.body);

  const querystr = `insert into list_emoticon_master (emoticon_owner, project_id) VALUES(?,?)`;
  const result = await DB(querystr, [emoticon_owner, id]);

  if (!result.state) {
    logger.error(`postInsertEmoticonMaster Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(
    req,
    res,
    null,
    "emoticon_master_insert",
    getEmoticonMaster
  );
};

export const postUpdateEmoticonMaster = async (req, res) => {
  const {
    params: { id },
    body: { emoticon_owner, emoticon_master_id },
  } = req;

  const querystr = `
    update list_emoticon_master 
       set emoticon_owner = ?
     WHERE emoticon_master_id = ?
  `;

  const result = await DB(querystr, [emoticon_owner, emoticon_master_id]);

  if (!result.state) {
    logger.error(`postUpdateEmoticonMaster Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(
    req,
    res,
    null,
    "emoticon_master_update",
    getEmoticonMaster
  );
};

// 이모티콘 마스터 리스트에서 삭제
export const postDeleteEmoticonMaster = async (req, res) => {
  const {
    params: { id },
    body: { emoticon_master_id },
  } = req;

  const querystr = `
  DELETE FROM list_emoticon_master WHERE emoticon_master_id = ?;
  DELETE FROM list_emoticon_slave WHERE emoticon_master_id = ?;
  `;

  const result = await DB(querystr, [emoticon_master_id, emoticon_master_id]);

  if (!result.state) {
    logger.error(`postDeleteEmoticonMaster Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(
    req,
    res,
    null,
    "emoticon_master_delete",
    getEmoticonMaster
  );
};

// 이모티콘 슬레이브 조회
export const postEmoticonSlave = async (req, res) => {
  console.log(req.body);

  const {
    params: { id },
    body: { emoticon_master_id },
  } = req;

  const querystr = `
    SELECT a.*
      FROM list_emoticon_slave a
     WHERE a.project_id = ? 
       AND a.emoticon_master_id = ?
      ORDER BY sortkey, emoticon_slave_id
  `;

  const result = await DB(querystr, [id, emoticon_master_id]);

  res.status(200).json(result.row);
};

// 이모티콘 슬레이브 추가
export const postInsertEmoticonSlave = async (req, res) => {
  const {
    params: { id },
    body: { emoticon_master_id, emoticon_name },
    file: { location, key },
  } = req;

  // console.log(req);

  const querystr = `

    insert into list_emoticon_slave (emoticon_master_id, project_id, image_name, image_url, image_key)
    VALUES (?, ?, ?, ?, ?)

  `;

  const result = await DB(querystr, [
    emoticon_master_id,
    id,
    emoticon_name,
    location,
    key,
  ]);

  if (!result.state) {
    logger.error(`postInsertEmoticonSlave Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(
    req,
    res,
    null,
    "emoticon_slave_insert",
    postEmoticonSlave
  );
};

// 이모티콘 슬레이브 레코드 업데이트
export const postUpdateEmoticonSlave = async (req, res) => {
  const { params } = req;
  const { body } = req;
  let file;

  if (req.file) file = req.file;
  else file = { location: null, key: null };

  console.log(body);

  const querystr = `
    UPDATE list_emoticon_slave 
       SET image_name = ?
         , image_url = ifnull(?, image_url)
         , image_key = ifnull(?, image_key) 
     WHERE emoticon_slave_id = ?
  `;

  const result = await DB(querystr, [
    body.emoticon_name,
    file.location,
    file.key,
    body.emoticon_slave_id,
  ]);

  console.log(result);

  if (!result.state) {
    logger.error(`postUpdateEmoticonSlave Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(
    req,
    res,
    null,
    "emoticon_slave_update",
    postEmoticonSlave
  );
};

// 이모티콘 슬레이브 레코드 삭제
export const postDeleteEmoticonSlave = async (req, res) => {
  const {
    params: { id },
    body: { emoticon_slave_id },
  } = req;

  console.log(`postDeleteEmoticonSlave with ${emoticon_slave_id}`);

  const result = await DB(
    "DELETE FROM list_emoticon_slave WHERE emoticon_slave_id = ?",
    [emoticon_slave_id]
  );

  if (!result.state) {
    logger.error(`postDeleteEmoticonSlave Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(
    req,
    res,
    null,
    "emoticon_slave_delete",
    postEmoticonSlave
  );
};

// 배경 교체!
const CreateOrReplaceBG = async (req, res, query) => {
  const result = await DB(query);
  if (!result.state) {
    logger.error(`CreateOrReplaceBG Error ${result.error}`);
    respondDB(res, 80037, result.error);
  } else {
    // 잘 넣었으면 재조회 해줘야한다.
    respondAdminSuccess(req, res, null, "bg_zip", getBG);
  }
};

// 배경 파일 zip 업로드
export const postUploadBackgroundZip = async (req, res) => {
  const {
    // 올라간 원본 zip파일의 위치와 키
    file: { location, key, bucket, acl },
    params: { id },
    body: { model_id = -1 }, // default값
  } = req;

  console.log(`file : ${decodeURI(encodeURI(JSON.stringify(req.file)))}`);

  let resultUnzip = null;

  // 업로드한 zip 파일에서 사용한다.
  const s3param = {
    Bucket: bucket,
    Key: key,
  };

  // 원본 압축 파일을 가져와서 압축 해제를 시작!
  const zip = awsAccessInfo
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
    // cb(null, `${req.params.id}/bg/${Date.now()}.${fileExtension}`);
    const originObj = {};
    originObj.obfuscated = `${obfuscated}.${fileExtension}`;
    // eslint-disable-next-line prefer-destructuring
    originObj.title = fileName.split(".")[0];
    console.log(originObj.title);

    origins.push(originObj);

    if (type === "File") {
      // key 용도별 주의할것.
      const uploadParams = {
        Bucket: mainBucketName,
        ACL: acl,
        Key: `${id}/bg/${obfuscated}.${fileExtension}`,
        Body: entry,
      };

      promises.push(awsAccessInfo.upload(uploadParams).promise());
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
        console.log(item);
        // origins 에서 title을 가져와야한다.
        let title = "";
        origins.forEach((origin) => {
          if (item.Key.includes(origin.obfuscated)) {
            title = origin.title;
          }
        });

        insertstr += mysql.format(Q_CREATE_OR_REPLACE_BG, [
          id,
          title,
          item.Location,
          item.Key.replaceAll(`assets/`, ``),
          mainBucketName,
        ]);
      });

      console.log(`>>> query made ${insertstr}`);

      // 모아진 query 한번에 실행
      CreateOrReplaceBG(req, res, insertstr);
    })
    .catch((err) => {
      logger.error(`postUploadBackgroundZip Error ${err}`);
      respondDB(res, 80041, "");
    });

  // * zip 파일은 삭제.
  DeleteS3Object(bucket, key);
};

///////////////////// 라이브 오브젝트(미니컷) 시작 /////////////////////

// 라이브 오브젝트 마스터 조회
//! JE - is_public, public_name, summary 필드 추가
//! JE - 썸네일 추가
export const postSelectLiveObjectMaster = async (req, res) => {
  const {
    params: { id },
    body: { lang = "KO" },
  } = req;

  const result = await DB(
    `SELECT a.*
    , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
    , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
    , ifnull(fn_get_minicut_localized_text(a.live_object_id, 'live2d', '${lang}', 'name'), a.live_object_name) public_name
    , fn_get_minicut_localized_text(a.live_object_id, 'live2d', '${lang}', 'summary') summary
    FROM list_live_object a WHERE a.project_id = ?;`,
    [id]
  );

  res.status(200).json(result.row);
};

// 라이브 오브젝트 디테일 조회
export const postSelectLiveObjectDetail = async (req, res) => {
  const {
    params: { id },
    body: { live_object_id },
  } = req;

  logger.info(`postSelectLiveObjectDetail [${live_object_id}]`);

  const result = await DB(
    `SELECT a.*
    FROM list_live_object_detail a
   WHERE a.live_object_id = ?;`,
    [live_object_id]
  );

  res.status(200).json(result.row);
};

// 라이브 오브젝트 버전 처리
export const updateLiveObjectVersion = async (live_object_id) => {
  await DB(
    `UPDATE list_live_object SET object_ver = object_ver + 1 WHERE live_object_id = ?;`,
    [live_object_id]
  );
};

// 라이브 오브젝트 등록
//! JE - 로컬라이징텍스트 추가
export const postRegisterLiveObject = async (req, res) => {
  const {
    params: { id },
    body: {
      live_object_name,
      minicut_type = "live2d",
      lang = "KO",
      summary = "",
    },
  } = req;

  const result = await DB(
    `INSERT INTO list_live_object (project_id, live_object_name) VALUES (? ,?);`,
    [id, live_object_name]
  );

  // false 일때.
  if (!result.state) {
    logger.error(`postRegisterLiveObject Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // ! JE - insert라서 live_object_name을 public_name으로 일단 그대로 사용
  const updateLocalizedText = await DB(
    `CALL sp_update_minicut_localized_text('${result.row.insertId}', '${minicut_type}', '${live_object_name}', '${summary}', '${lang}')`,
    []
  );

  if (!updateLocalizedText.state) {
    logger.error(`postRegisterLiveObject Error 2 ${updateLocalizedText.error}`);
    respondDB(res, 80026, updateLocalizedText.error);
    return;
  }

  adminLogInsert(req, "live_object_insert"); 

  respondRedirect(
    req,
    res,
    postSelectLiveObjectMaster,
    updateLocalizedText,
    "postRegisterLiveObject"
  );
};

// 삭제
//! JE - 로컬라이징텍스트 삭제 추가
export const postDeleteLiveObject = async (req, res) => {
  const {
    body: { live_object_id, minicut_type = "live2d" },
  } = req;

  logger.info(`postDeleteLiveObject [${live_object_id}]`);

  const result = await DB(
    `
    DELETE FROM list_live_object WHERE live_object_id = ?;
    DELETE FROM list_live_object_detail WHERE live_object_id = ?;
    DELETE FROM list_minicut_lang WHERE minicut_id = ? AND minicut_type = ?; 
  `,
    [live_object_id, live_object_id, live_object_id, minicut_type]
  );

  adminLogInsert(req, "live_object_delete"); 

  respondRedirect(
    req,
    res,
    postSelectLiveObjectMaster,
    result,
    "postDeleteLiveObject"
  );
};

//! 라이브 오브제 마스터 (파일 제외 업데이트)
//! JE - offset_x, offset_y, game_scale, thumbnail_id 추가
export const postUpdateLiveObject = async (req, res) => {
  const {
    params: { id },
    body: {
      live_object_id,
      live_object_name,
      offset_x = 0,
      offset_y = 0,
      game_scale = 15,
      is_public = 0,
      thumbnail_id = -1,
      public_name = "",
      summary = "",
      lang = "KO",
      appear_episode = -1,
    },
  } = req;

  const result = await DB(
    `UPDATE list_live_object 
    SET live_object_name = ?, 
    offset_x = ?, 
    offset_y = ?, 
    game_scale = ?,  
    is_public = ?, 
    thumbnail_id = ?,
    appear_episode = ?
    WHERE project_id = ? AND live_object_id = ?;     
    `,
    [
      live_object_name,
      offset_x,
      offset_y,
      game_scale,
      is_public,
      thumbnail_id,
      appear_episode,
      id,
      live_object_id,
    ]
  );

  if (!result.state) {
    logger.error(`postUpdateLiveObject Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const updateLocalizedText = await DB(
    `CALL sp_update_minicut_localized_text('${live_object_id}', 'live2d', '${public_name}', ?, '${lang}')`,
    [summary]
  );

  if (!updateLocalizedText.state) {
    logger.error(`postUpdateLiveObject Error 2 ${updateLocalizedText.error}`);
    respondDB(res, 80026, updateLocalizedText.error);
    return;
  }

  adminLogInsert(req, "live_object_update"); 

  respondRedirect(
    req,
    res,
    postSelectLiveObjectMaster,
    updateLocalizedText,
    "postUpdateLiveObject"
  );
};

// 라이브 일러스트 업로드
export const postUploadLiveObject = async (req, res) => {
  const {
    // 올라간 원본 zip파일의 위치와 키
    file: { location, key },
    params: { id },
    body: { live_object_id = -1 }, // default값
  } = req;

  const s3param = {
    Bucket: "pierstorystore/live_objects",
    Key: key,
  };

  // 원본 압축 파일을 가져와서 압축 해제를 시작!
  const zip = awsAccessInfo
    .getObject(s3param)
    .createReadStream()
    .pipe(unzipper.Parse({ forceStream: true }));

  // async 이기 때문에 promise 사용할게
  const promises = [];

  let resultUnzip = null;
  logger.info(`postUploadLiveObject ${location}`);

  // eslint-disable-next-line no-restricted-syntax
  for await (const e of zip) {
    const entry = e;

    // console.log(entry);

    const fileName = entry.path;
    const { type } = entry;

    if (type === "File") {
      const uploadParams = {
        Bucket: "pierstorystore/live_objects",
        ACL: "public-read",
        Key: `${id}/${live_object_id}/${fileName}`,
        Body: entry,
      };

      promises.push(awsAccessInfo.upload(uploadParams).promise());
    } else {
      entry.autodrain(); // file 이 아니면 stream을 dispose. ..파일이 아닌게 올 수 도 있나..?
    }
  } // end of for

  logger.info(`End unzip in postUploadLiveObject`);

  await Promise.all(promises)
    .then((values) => {
      resultUnzip = values;
      console.log(resultUnzip);
    })
    .catch((err) => logger.error(`postUploadLiveObject Error 1 ${err}`));

  // 업로드 종료 후 올라간 파일들 DB로 insert
  // 먼저 기존 파일들 전부 삭제
  await DB(`DELETE FROM list_live_object_detail WHERE live_object_id = ?;`, [
    live_object_id,
  ]);

  let insertSQL = "";
  let motionName = "";

  resultUnzip.map((item) => {
    const keySplits = item.Key.split("/"); // 순수 파일명!
    motionName = null;

    // 모션 자동 지정
    if (item.key.includes(`start.motion3.json`)) motionName = "시작";
    else if (item.key.includes(`loop.motion3.json`)) motionName = "루프";

    insertSQL += mysql.format(
      `INSERT INTO list_live_object_detail
      (live_object_id, file_url, file_key, file_name, motion_name)
      VALUES(?, ?, ?, ?, ?);`,
      [
        live_object_id,
        item.Location,
        item.Key,
        keySplits[keySplits.length - 1],
        motionName,
      ]
    );

    return true;
  });

  const slaveInsertResult = await DB(insertSQL);

  if (!slaveInsertResult.state) {
    logger.error(`postUploadLiveObject Error 2 ${slaveInsertResult.error}`);
    respondDB(res, 80026, slaveInsertResult.error);
  } else {
    // 잘 들어갔으면  slave 조회 처리
    adminLogInsert(req, "live_object_zip"); 
    postSelectLiveObjectDetail(req, res);
    updateLiveObjectVersion(live_object_id);
  }
};

///////////////////// 라이브 오브젝트 끝 ///////////////////////
