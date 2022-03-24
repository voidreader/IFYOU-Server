import aws from "aws-sdk";
import { response } from "express";
import { respondRedirect, respondError, respondDB } from "../respondent";
import { logger } from "../logger";
import { DB } from "../mysqldb";
import { getComModelMainBannerClientList } from "./designController";
import { getLevelListNoResponse } from "./levelController";

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
  // responseData.models = await getComModelMainBannerClientList();

  // * 2021.01.03 재화 아이콘
  const currencyIcons = await DB(`
  SELECT DISTINCT a.currency 
       , fn_get_design_info(a.icon_image_id, 'url') icon_url
       , fn_get_design_info(a.icon_image_id, 'key') icon_key
  FROM com_currency a 
 WHERE a.is_use > 0
   AND a.local_code > -1
   AND a.icon_image_id > 0
   AND a.currency_type IN ('consumable', 'nonconsumable')
 ORDER BY a.currency_type ;
  `);

  console.log(`currencyIcons length : `, currencyIcons.row.length);

  responseData.currency = {};

  currencyIcons.row.forEach((item) => {
    if (
      !Object.prototype.hasOwnProperty.call(
        responseData.currency,
        item.currency
      )
    ) {
      responseData.currency[item.currency] = {
        image_url: item.icon_url,
        image_key: item.icon_key,
      };
    }
  });

  // responseData.currencyIcons = currencyIcons.row;
  responseData.levelList = await getLevelListNoResponse();

  res.status(200).json(responseData);
};

// * 서버 마스터 정보 (2021.12.22)
export const getServerMasterInfo = async (req, res) => {
  const responseData = {};

  let query = ``;
  query += `SELECT * FROM com_server cs WHERE server_no > 0 LIMIT 1;`;
  query += `SELECT a.* FROM com_ad a LIMIT 1;`;

  const result = await DB(query);

  responseData.master = result.row[0][0]; // 마스터 정보
  responseData.ad = result.row[1][0]; // 광고 정보

  res.status(200).json(responseData);
};

// * 플랫폼에서 진행중인 이벤트 정보 조회
export const getPlatformEvents = async (req, res) => {
  const {
    body: {
      userkey = 0,
      build = "pier.make.story",
      country = "KR",
      lang = "KO",
    },
  } = req;

  const responseData = {};

  // * 프로모션 정보
  const promotionMaster = await DB(`
  SELECT promotion_no
      , title
      , start_date
      , end_date
      , promotion_type
      , location
  FROM com_promotion
  WHERE is_public > 0 
  AND NOW() BETWEEN start_date AND end_date 
  ORDER BY sortkey; 
  `); // ? 프로모션 끝

  const promotionDetail = await DB(
    `
  SELECT 
  b.promotion_no 
  , lang
  , design_id 
  , fn_get_design_info(design_id, 'url') promotion_banner_url
  , fn_get_design_info(design_id, 'key') promotion_banner_key
  FROM com_promotion a, com_promotion_detail b
  WHERE a.promotion_no = b.promotion_no 
  AND is_public > 0 
  AND NOW() BETWEEN start_date AND end_date
  ORDER BY sortkey;  
  `,
    []
  );

  promotionMaster.row.forEach((promotion) => {
    if (!Object.prototype.hasOwnProperty.call(promotion, "detail")) {
      promotion.detail = [];
    }

    promotionDetail.row.forEach((item) => {
      if (item.promotion_no === promotion.promotion_no) {
        promotion.detail.push(item);
      }
    });
  }); // ? 프로모션 끝

  // * 공지사항 정보
  const noticeMaster = await DB(`
    SELECT cn.*
    FROM com_notice cn  
  WHERE now() BETWEEN cn.start_date AND cn.end_date
    AND cn.is_public = 1
  ORDER BY cn.sortkey;
  `);

  const noticeDetail = await DB(`
    SELECT b.notice_no
    , b.lang 
    , b.title 
    , b.contents 
    , fn_get_design_info(b.design_id, 'url') banner_url
    , fn_get_design_info(b.design_id, 'key') banner_key
    , fn_get_design_info(b.detail_design_id, 'url') detail_banner_url
    , fn_get_design_info(b.detail_design_id, 'key') detail_banner_key
    , b.url_link 
  FROM com_notice cn
    , com_notice_detail b
  WHERE now() BETWEEN cn.start_date AND cn.end_date
  AND cn.is_public = 1
  AND b.notice_no = cn.notice_no 
  ORDER BY cn.sortkey
  ;  
  `);

  noticeMaster.row.forEach((notice) => {
    if (!Object.prototype.hasOwnProperty.call(notice, "detail")) {
      notice.detail = [];
    }

    noticeDetail.row.forEach((item) => {
      if (item.notice_no === notice.notice_no) {
        notice.detail.push(item);
      }
    });
  }); // ? 공지사항 끝

  // * 장르
  const genre = await DB(
    `
  SELECT DISTINCT fn_get_localize_text(ls.text_id, ?) genre_name
       , fn_get_localize_text(ls.text_id, ?) origin_name
    FROM list_project_genre genre
      , list_project_master ma
      , list_standard ls 
  WHERE ma.project_id = genre.project_id
    AND ma.is_public > 0
    AND ls.standard_class = 'genre'
    AND ls.code = genre.genre_code 
    AND ma.service_package LIKE CONCAT('%', ?, '%')
  ;`,
    [lang, lang, build]
  ); // ? 장르

  responseData.promotion = promotionMaster.row; // 프로모션 정보
  responseData.notice = noticeMaster.row; // 공지사항
  responseData.genre = genre.row;

  res.status(200).json(responseData);
};
