import aws from "aws-sdk";
import unzipper from "unzipper";
import il from "iconv-lite";
import mysql from "mysql2/promise";

import { DB, } from "../mysqldb";
import { respond, respondRedirect, respondDB } from "../respondent";
import { logger } from "../logger";

// aws s3 엑세스 정보
export const awsAccessInfo = new aws.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

// 버킷!
export const mainBucketName = `pierstore/assets`;

// 이전 S3 오브젝트 기록하기
export const RecordPrviousS3Object = ({ project_id, object_key, bucket }) => {
  // ! 이제까지는 (2021.07.12 기준) 리소스 교체시에는 즉시 과거 S3를 삭제했지만,
  // ! 추후 테스트 - 라이브 서버를 분리하게 되면, 즉시 삭제하는 경우
  // ! 라이브 서버에서 과거 S3 오브젝트를 참조하는 경우에 문제가 발생한다. (없으니까...)
  // ! 그래서 교체시에 즉각적으로 삭제하지 않고, 특정 테이블에 정보를 기록해놓고,
  // ! 변경 사항이 라이브로 반영된 시점에 수동으로 정리하도록 처리하자.

  // * 테이블 교체 : 기존 list_previous_s3, target_delete_s3 사용하지 않음. (삭제)
  DB(
    `INSERT INTO table_stashed_s3 (project_id, object_key, bucket) VALUES (?,?,?)`,
    [project_id, object_key, bucket]
  );
};

// S3 오브젝트 삭제 메소드
// ! 함부로 호출하지 말것.
export const DeleteS3Object = (bucket, key) => {
  awsAccessInfo.deleteObject(
    {
      Bucket: bucket,
      Key: key,
    },
    (err, data) => {
      if (err) {
        logger.err(`DeleteS3Object Error ${err}`);
        return;
      }
      console.log("s3 deleteObject ", key);
    }
  );
};

// S3 버려진것들 한번에 정리하기.
// ! 함부로 호출하지 말것
// ! 프로젝트별로 처리하도록 변경
export const DeleteStashedS3Objects = async (project_id) => {
  const query = `
    SELECT a.object_key, a.bucket
      FROM table_stashed_s3 a
    WHERE a.project_id = ${project_id}
  `;

  // S3에서 삭제처리
  const result = await DB(query);
  if (result.state && result.row.length > 0) {
    result.row.forEach((item) => {
      DeleteS3Object(item.bucket, item.object_key);
    });
  }

  // S3 삭제 후 테이블에서 제거
  const deleteQuery = `DELETE FROM table_stashed_s3 WHERE project_id = ${project_id}`;
  await DB(deleteQuery);

  // 끝
};
// ? s3 정리 부분 끝

// * zip 업로드 (공통 메소드)
// zipType : image, live2d, sound 등 zip 파일이 담고있는 파일 형식
// queryMaker : Insert Query 만드는 함수
// createOrReplace : 실제 쿼리 실행하는 함수
export const uploadZipResources = async (
  req,
  res,
  zipType,
  queryMaker,
  createOrReplace
) => {
  const {
    // 올라간 원본 zip파일의 위치와 키
    file: { location, key, bucket, acl }, // zip 파일 기본
    params: { id }, // 프로젝트
  } = req;

  // ! body를 따로 저장
  const { body } = req;

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

    console.log(fileName); // filename 체크해보고..

    const fileLength = fileName.length;
    const lastDot = fileName.lastIndexOf(".");
    const fileExtension = fileName.substring(lastDot + 1, fileLength);
    const obfuscated = `${Date.now()}_${i}`; // 난독화

    // ! 확장자가 잘못되어있으면 업로드 대상에서 뺀다. (image, live2d, sound, bubble)
    // ! 계속 추가할것!
    if (zipType === "image" || zipType === "bubble") {
      if (!fileExtension.includes("png") && !fileExtension.includes("jpg")) {
        // eslint-disable-next-line no-continue
        continue;
      }
    } else if (zipType === "sound") {
      if (!fileExtension.includes("wav") && !fileExtension.includes("mp3")) {
        // eslint-disable-next-line no-continue
        continue;
      }
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
      // ! id/body.folder/... 로 진행한다.
      // ! bubble은 공통 리소스라서 폴더가 다르다.
      let savedFolder = `${id}/${body.folder}/${obfuscated}.${fileExtension}`;

      if (zipType === "bubble")
        savedFolder = `${body.folder}/${obfuscated}.${fileExtension}`;

      const uploadParams = {
        Bucket: mainBucketName,
        ACL: acl,
        Key: savedFolder,
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
        // queryMaker에게 query를 받아오도록 처리
        insertstr += queryMaker(
          id,
          title,
          item.Location,
          item.Key.replaceAll(`assets/`, ``),
          mainBucketName,
          body
        );
        /*
        insertstr += mysql.format(Q_CREATE_OR_REPLACE_IMAGE, [
          id,
          title,
          item.Location,
          item.Key.replaceAll(`assets/`, ``),
          mainBucketName,
        ]);
        */
      });

      console.log(`>>> query made ${insertstr}`);
      createOrReplace(req, res, insertstr);
    })
    .catch((err) => {
      logger.error(`uploadZipResources Error ${err.error}`);
      respondDB(res, 80041, err.error);
    });

  // * zip 파일 삭제
  DeleteS3Object(bucket, key);
};

// * 페이지네이션용 쿼리
export const getPagenationQuery = (page, page_size) => {
  // page < 0 이면 페이징 하지 않음
  if (parseInt(page, 10) < 0) return ` LIMIT 500`;

  // * start, end 처리
  const start =
    parseInt(page, 10) * parseInt(page_size, 10) + page == 0 ? 0 : 1;
  const end = start + parseInt(page_size, 10);

  return ` LIMIT ${start}, ${end}`;
};

// * LIKE 조건 쿼리 구하기
export const getLikeConditionQuery = (
  col,
  word,
  isStart = false,
  isUpperCase = false,
  oper = "AND"
) => {
  let query = "";

  if (isStart) {
    query += ` WHERE ${col} LIKE '%${
      isUpperCase ? word.toUpperCase() : word
    }%'`;
  } else {
    query += ` ${oper} ${col} LIKE '%${
      isUpperCase ? word.toUpperCase() : word
    }%'`;
  }

  return query;
};

//* IN 조건 쿼리 구하기
export const getInConditionQuery = (col, word, isStart = false) => {
  let query = "";
  let start = " AND ";
  let setWord = ``;

  if (isStart) start = " WHERE";

  if (word.includes("SELECT")) {
    // 구문에 SELECT가 있으면 ''(중괄호) 해제
    setWord = word;
  } else {
    const wordArray = word.split(",");
    // eslint-disable-next-line no-restricted-syntax
    for (const item of wordArray) {
      setWord += `'${item}',`;
    }
    setWord = setWord.slice(0, -1);
  }

  query += ` ${start} ${col} IN (${setWord}) `;

  return query;
};

//* = 조건 쿼리 구하기
export const getEqualConditionQuery = (col, word, isEqual, isStart = false) => {
  let query = "";
  let start = " AND";
  let equal = " <> ";

  if (isStart) start = " WHERE";
  if (isEqual) equal = " = ";

  query += ` ${start} ${col} ${equal} '${word}' `;

  return query;
};

//* 날짜 쿼리 구하기
export const getDateConditionQuery = (
  col,
  startDate,
  endDate,
  isStart = false
) => {
  let query = "";
  let start = " AND ";

  if (isStart) start = " WHERE";

  query += ` ${start}  ${col} BETWEEN DATE_FORMAT('${startDate}', '%Y-%m-%d 00:00:00') AND DATE_FORMAT('${endDate}', '%Y-%m-%d 23:59:59') `;

  return query;
};

//* 비교 쿼리 구하기
export const getCompareConditionQuery = (
  col,
  compare,
  col2,
  isStart = false
) => {
  let query = "";
  let start = "AND";

  if (isStart) start = "WHERE";

  query += ` ${start} ${col} ${compare} ${col2} `;

  return query;
};
