import unzipper from "unzipper";
import mysql from "mysql2/promise";
import { awsAccessInfo, RecordPrviousS3Object } from "../com/com";
import { logger } from "../logger";
import { DB } from "../mysqldb";
import { 
  respondError,
  respondRedirect, 
  respondDB, 
  adminLogInsert, 
  respondAdminSuccess,
} from "../respondent";
import { Q_SELECT_REPLACED_S3_ILLUST } from "../QStore";

// ! 라이브 일러스트, 일러스트를 담당합니다!

// * 일러스트 조회
export const requestIllustList = async (req, res) => {
  const {
    params: { id },
    body: { lang = "KO" },
  } = req;

  logger.info(`requestIllustList [${JSON.stringify(req.body)}]`);

  const querystr = `
    SELECT a.illust_id 
       , a.project_id 
       , a.image_name 
       , a.image_url 
       , a.image_key
       , a.bucket 
       , a.sortkey 
       , a.thumbnail_id 
       , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
       , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
       , ifnull(fn_get_illust_localized_text(a.illust_id, 'illust', '${lang}', 'name'), a.image_name) public_name
       , fn_get_illust_localized_text(a.illust_id, 'illust', '${lang}', 'summary') summary
       , a.is_public
       , a.appear_episode
  FROM list_illust a 
  WHERE a.project_id = ?
  ORDER BY a.sortkey, a.illust_id;
    `;

  const result = await DB(querystr, [id]);

  res.status(200).json(result.row);
}; // END

// * 신규 등록
export const postInsertIllust = async (req, res) => {
  // console.log(req);

  const {
    params: { id },
    body: { title, thumbnail_id = -1, lang = "KO" },
    file: { location, key, bucket },
  } = req;

  // * 라이브 일러스트 체크
  // 라이브 일러스트와 일러스트는 스크립트에서 같은 템플릿을 사용하기 때문에 같은 이름을 사용하지 못하게 막는다.
  const checkExists = await DB(
    `SELECT EXISTS (SELECT lli.live_illust_id FROM list_live_illust lli WHERE lli.project_id = ? AND lli.live_illust_name = ?) existCheck FROM DUAL;`,
    [id, title]
  );

  if (checkExists.state && checkExists.row.length > 0) {
    if (checkExists.row[0].existCheck === 1) {
      logger.error(`postInsertIllust Error 1`);
      respondDB(res, 80003, "");
      return;
    }
  } // end 동일 이름 체크

  const querystr = `
    INSERT INTO list_illust(project_id, image_name, image_url, image_key, thumbnail_id, bucket)
    VALUES (?, ?, ?, ?, ?, ?);
    `;

  // ! insert, 일러스트는 이미지 포함해서 신규 등록이 필수.
  const result = await DB(querystr, [
    id,
    title,
    location,
    key,
    thumbnail_id,
    bucket,
  ]);

  console.log(result.row);

  // false 일때.
  if (!result.state) {
    logger.error(`postInsertIllust Error 2 ${result.error}`);
    respondDB(res, 80004, result.error);
    return;
  }

  // ! 2021.07.12 HJ - 신규 입력시에 list_illust_lang에 입력처리 추가
  const langInsert = await DB(
    `
  INSERT INTO list_illust_lang (illust_id, illust_type, lang)
  VALUES (?, ?, ?);
  `,
    [result.row.insertId, "illust", lang]
  );

  adminLogInsert(req, "illust_insert"); 

  respondRedirect(
    req,
    res,
    requestIllustList,
    langInsert,
    "postInsertIllust",
    80004
  );
}; // 신규 등록 끝

// * 일러스트 업데이트 처리
export const postUpdateIllust = async (req, res) => {
  const {
    params: { id },
    body: {
      illust_id,
      title,
      thumbnail_id = -1,
      public_name = null,
      summary = null,
      lang = "KO",
      is_public = 1,
      appear_episode = -1,
    },
  } = req;

  let file;

  if (req.file) file = req.file;
  else file = { location: null, key: null, bucket: null }; // bucket 추가

  logger.info(`postUpdateIllust [${JSON.stringify(req.body)}]`);

  // 이전 s3 업로드 정보를 업데이트 전에 갖고 있는다.
  const previousS3 = await DB(Q_SELECT_REPLACED_S3_ILLUST, [illust_id]);

  const querystr = `
    UPDATE list_illust 
       SET image_name = ?
         , image_url = ifnull(?, image_url)
         , image_key = ifnull(?, image_key)
         , bucket = ifnull(?, bucket)
         , thumbnail_id = ?
         , is_public = ?
         , appear_episode = ?  
    WHERE project_id = ? 
     AND illust_id = ?
    `;

  const result = await DB(querystr, [
    title,
    file.location,
    file.key,
    file.bucket,
    thumbnail_id,
    is_public,
    appear_episode,
    id,
    illust_id,
  ]);

  if (!result.state) {
    logger.error(`postUpdateIllust Error 1 ${result.error}`);
    respondDB(res, 80001, result.error);
    return;
  }

  // 신규 이미지를 받은 경우에는 이전 S3 오브젝트를 정리대상으로 처리한다.
  if (
    file.key != null &&
    previousS3.state &&
    previousS3.row.length > 0 &&
    previousS3.row[0].bucket != null
  ) {
    // 과거 S3 정보 기록
    RecordPrviousS3Object(previousS3.row[0]);
  }

  // 로컬라이징 필요한 텍스트 추가 업데이트
  const updateLocalizedText = await DB(
    `
  CALL sp_update_illust_localized_text('${illust_id}', 'illust', '${public_name}', '${summary}', '${lang}')
  `,
    []
  );

  if (!updateLocalizedText.state) {
    logger.error(`postUpdateIllust Error 2 ${updateLocalizedText.error}`);
    respondDB(res, 80002, updateLocalizedText.error);
    return;
  }

  respondAdminSuccess(req, res, null, "illust_update", requestIllustList);

}; // 업데이트 처리 끝

// 삭제 처리
export const postDeleteIllust = async (req, res) => {
  const {
    body: { illust_id },
  } = req;

  // 이전 s3 업로드 정보를 업데이트 전에 갖고 있는다.
  const previousS3 = await DB(Q_SELECT_REPLACED_S3_ILLUST, [illust_id]);

  const deleteResult = await DB(
    `
  DELETE FROM list_illust WHERE illust_id = ?;
  DELETE FROM list_illust_lang WHERE illust_id = ? AND illust_type = 'illust';
  `,
    [illust_id, illust_id]
  );

  if (
    deleteResult.state &&
    previousS3.state &&
    previousS3.row.length > 0 &&
    previousS3.row[0].bucket != null
  ) {
    // 과거 S3 정보 기록
    RecordPrviousS3Object(previousS3.row[0]);
  }

  respondAdminSuccess(req, res, null, "illust_delete", requestIllustList);

}; // ? 업데이트 끝!

//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////

// ! 여기서부터는 라이브 일러스트 구역!
// 라이브 일러스트 마스터 조회
export const postSelectLiveIllustMaster = async (req, res) => {
  const {
    params: { id },
    body: { lang = "KO" },
  } = req;

  const result = await DB(
    `
      SELECT a.live_illust_id
       , a.project_id 
       , a.live_illust_name
       , a.offset_x 
       , a.offset_y 
       , a.game_scale 
       , a.illust_ver 
       , a.thumbnail_id
       , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
       , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
       , ifnull(fn_get_illust_localized_text(a.live_illust_id, 'live2d', '${lang}', 'name'), a.live_illust_name) public_name
       , fn_get_illust_localized_text(a.live_illust_id, 'live2d', '${lang}', 'summary') summary
       , a.is_public
       , a.appear_episode
    FROM list_live_illust a
  WHERE a.project_id = ?
  ORDER BY a.live_illust_id;
      `,
    [id]
  );

  res.status(200).json(result.row);
};

// 라이브 일러스트 디테일 조회
export const postSelectLiveIllustDetail = async (req, res) => {
  const {
    body: { live_illust_id },
  } = req;

  logger.info(`postSelectLiveIllustDetail [${live_illust_id}]`);

  const result = await DB(
    `SELECT a.*
      FROM list_live_illust_detail a
     WHERE a.live_illust_id = ?;`,
    [live_illust_id]
  );

  res.status(200).json(result.row);
};

// 라이브 일러스트 버전 처리
export const updateLiveIllustVersion = async (live_illust_id) => {
  await DB(
    `UPDATE list_live_illust SET illust_ver = illust_ver + 1 WHERE live_illust_id = ?;`,
    [live_illust_id]
  );
};

// 라이브 일러스트 등록
export const postRegisterLiveIllust = async (req, res) => {
  const {
    params: { id },
    body: { live_illust_name },
  } = req;

  // 일러스트 테이블에 동일 이름 체크
  const checkExists = await DB(
    `SELECT EXISTS (SELECT z.illust_id FROM list_illust z WHERE z.project_id = ? AND z.image_name = ?) existCheck FROM DUAL;`,
    [id, live_illust_name]
  );

  if (checkExists.state && checkExists.row.length > 0) {
    if (checkExists.row[0].existCheck === 1) {
      logger.error(`postRegisterLiveIllust Error 1`);
      respondDB(res, 80007, "");
      return;
    }
  } // end 동일 이름 체크

  const result = await DB(
    `INSERT INTO list_live_illust (project_id, live_illust_name) VALUES (? ,?);`,
    [id, live_illust_name]
  );

  if (!result.state) {
    logger.error(`postRegisterLiveIllust Error 2 ${result.error}`);
    respondDB(res, 80015, result.error);
    return;
  }

  // ! 2021.07.12 HJ - 신규 입력시에 list_illust_lang에 입력처리 추가
  const langInsert = await DB(
    `
    INSERT INTO list_illust_lang (illust_id, illust_type, lang)
    VALUES (?, ?, ?);
    `,
    [result.row.insertId, "live2d", "KO"]
  );

  adminLogInsert(req, "live_illust_insert"); 

  respondRedirect(
    req,
    res,
    postSelectLiveIllustMaster,
    langInsert,
    "postRegisterLiveIllust",
    80015
  );
};

// 라이브 일러스트 업로드
export const postUploadLiveIllust = async (req, res) => {
  const {
    // 올라간 원본 zip파일의 위치와 키
    file: { location, key },
    params: { id },
    body: { live_illust_id = -1 }, // default값
  } = req;

  const s3param = {
    Bucket: "pierstorystore/live_illusts",
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
  logger.info(`postUploadLiveIllust ${location}`);

  // eslint-disable-next-line no-restricted-syntax
  for await (const e of zip) {
    const entry = e;

    // console.log(entry);

    const fileName = entry.path;
    const { type } = entry;

    if (type === "File") {
      const uploadParams = {
        Bucket: "pierstorystore/live_illusts",
        ACL: "public-read",
        Key: `${id}/${live_illust_id}/${fileName}`,
        Body: entry,
      };

      promises.push(awsAccessInfo.upload(uploadParams).promise());
    } else {
      entry.autodrain(); // file 이 아니면 stream을 dispose. ..파일이 아닌게 올 수 도 있나..?
    }
  } // end of for

  logger.info(`End unzip in postUploadLiveIllust`);

  await Promise.all(promises)
    .then((values) => {
      resultUnzip = values;
      console.log(resultUnzip);
    })
    .catch((err) => logger.error(`postUploadLiveIllust Error 1 ${err}`));

  // 업로드 종료 후 올라간 파일들 DB로 insert
  // 먼저 기존 파일들 전부 삭제
  await DB(`DELETE FROM list_live_illust_detail WHERE live_illust_id = ?;`, [
    live_illust_id,
  ]);

  let insertSQL = "";
  let motionName = "";

  resultUnzip.map((item) => {
    const keySplits = item.Key.split("/"); // 순수 파일명!
    motionName = null;

    // 모션 자동 지정
    if (item.Key.includes(`start.motion3.json`)) motionName = "시작";
    else if (item.Key.includes(`loop.motion3.json`)) motionName = "루프";

    insertSQL += mysql.format(
      `INSERT INTO list_live_illust_detail
        (live_illust_id, file_url, file_key, file_name, motion_name)
        VALUES(?, ?, ?, ?, ?);`,
      [
        live_illust_id,
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
    logger.error(`postUploadLiveIllust Error 2 ${slaveInsertResult.error}`);
    respondDB(res, 80026, slaveInsertResult.error);
  } else {
    // 잘 들어갔으면  slave 조회 처리
    adminLogInsert(req, "live_illust_zip"); 

    postSelectLiveIllustDetail(req, res);
    updateLiveIllustVersion(live_illust_id);
  }
};

// 삭제
export const postDeleteLiveIllust = async (req, res) => {
  const {
    body: { live_illust_id },
  } = req;

  logger.info(`postDeleteLiveIllust [${live_illust_id}]`);

  const result = await DB(
    `
      DELETE FROM list_live_illust WHERE live_illust_id = ?;
      DELETE FROM list_live_illust_detail WHERE live_illust_id = ?;
      DELETE FROM list_illust_lang WHERE illust_id = ? AND illust_type ='live2d';
    `,
    [live_illust_id, live_illust_id, live_illust_id]
  );

  adminLogInsert(req, "live_illust_delete"); 

  respondRedirect(
    req,
    res,
    postSelectLiveIllustMaster,
    result,
    "postDeleteLiveIllust"
  );
};

// 라이브 일러스트 마스터 (파일 제외 업데이트)
export const updateLiveIllustMaster = async (req, res) => {
  const {
    body: {
      live_illust_id,
      live_illust_name,
      thumbnail_id = -1,
      public_name = null,
      summary = null,
      lang = "KO",
      offset_x = 0,
      offset_y = 0,
      game_scale = 15,
      is_public = 1,
      appear_episode = -1,
    },
  } = req;

  const result = await DB(
    `
  UPDATE list_live_illust
    SET thumbnail_id = ?
      , live_illust_name = ?
      , offset_x = ?
      , offset_y = ?
      , game_scale = ?
      , is_public = ?
      , appear_episode = ?
  WHERE live_illust_id = ?
  `,
    [
      thumbnail_id,
      live_illust_name,
      offset_x,
      offset_y,
      game_scale,
      is_public,
      appear_episode,
      live_illust_id,
    ]
  );

  if (!result.state) {
    logger.error(`updateLiveIllustMaster Error 1 ${result.error}`);
    respondDB(res, 80008, result.error);
    return;
  }

  // public_name, summary 업데이트
  // 로컬라이징 필요한 텍스트 추가 업데이트
  const updateLocalizedText = await DB(
    `
    CALL sp_update_illust_localized_text('${live_illust_id}', 'live2d', '${public_name}', '${summary}', '${lang}')
  `,
    []
  );

  if (!updateLocalizedText.state) {
    logger.error(`updateLiveIllustMaster Error 2 ${updateLocalizedText.error}`);
    respondDB(res, 80002, updateLocalizedText.error);
    return;
  }

  respondAdminSuccess(req, res, null, "live_illust_update", postSelectLiveIllustMaster);

};

///////////////////// 여기까지 라이브 일러스트 끝 ///////////////////////
