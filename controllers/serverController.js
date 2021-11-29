import aws from "aws-sdk";
import { respondRedirect, respondError, respondDB } from "../respondent";
import { logger } from "../logger";
import { DB } from "../mysqldb";
import { getComModelMainBannerClientList } from "./designController";

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

// S3 정리 로직..
export const alignS3Objects = async (req, res) => {
  const awsParamas = {
    Bucket: "pierstorystore",
    // Delimiter: "/",
    Prefix: "assets/",
  };

  const s3Object = [];
  const insertQuery = `INSERT INTO list_s3(s3_key, s3_class) VALUES (? ,?)`;

  s3.listObjectsV2(awsParamas, (err, data) => {
    if (err) {
      logger.error(`alignS3Objects Error ${err}`);
    }

    data.Contents.forEach((element) => {
      s3Object.push(element);
      DB(insertQuery, [element.Key, element.StorageClass]);
    });

    console.log(`total count : ${s3Object.length}`);
    res.status(200).send("OK");
  });
};

//! 다국어 로컬 라이징 (어드민)
export const getLocallizingList = async (req, res) => {
  logger.info(`getLocallizingList`);

  const result = await DB(`SELECT * FROM com_localize;`, []);

  if (!result.state) {
    logger.error(`getLocallizingList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
};

// ! 클라이언트에서 요청해서 받는 로컬라이징 텍스트
export const getClientLocalizingList = async (req, res) => {
  logger.info(`getClientLocalizingList`);

  const result = await DB(
    `
  SELECT cl.id
     , cl.KO
     , ifnull(cl.EN, 'NO TEXT') EN
     , ifnull(cl.JA, 'NO TEXT') JA
     , ifnull(cl.ZH, 'NO TEXT') ZH
  FROM com_localize cl 
 WHERE id >0;
  `,
    []
  );

  if (!result.state) {
    logger.error(`getLocallizingList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const responseData = {};

  // ID를 키로 해서 사용하기 위해 재포장!
  result.row.forEach((item) => {
    responseData[item.id.toString()] = { ...item };
  });

  res.status(200).json(responseData);
};

//! 서버 정보
export const getServerInfo = async (req, res) => {
  logger.info(`getServerInfo`);

  const result = await DB(
    `SELECT * FROM com_server cs WHERE server_no > 0 LIMIT 1;`,
    []
  );

  res.status(200).json(result.row[0]);
};

// * 앱 공용 리소스 주기.
export const getAppCommonResources = async (req, res) => {
  const responseData = {};

  // * 2021.09.14 공용 모델 정보 추가
  responseData.models = await getComModelMainBannerClientList();

  res.status(200).json(responseData);
};
