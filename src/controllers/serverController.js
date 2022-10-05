import aws from "aws-sdk";
import { response } from "express";
import { respondRedirect, respondError, respondDB } from "../respondent";
import { logger } from "../logger";
import { DB, slaveDB } from "../mysqldb";
import { getComModelMainBannerClientList } from "./designController";
import { getLevelListNoResponse } from "./levelController";
import { cache } from "../init";

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

// ! 클라이언트에서 요청해서 받는 로컬라이징 텍스트
export const getClientLocalizingList = (req, res) => {
  logger.info(`getClientLocalizingList`);

  res.status(200).json(cache.get("localize"));
};

// * 앱 공용 리소스 주기.
export const getAppCommonResources = async (req, res) => {
  const responseData = {};

  // * 2021.09.14 공용 모델 정보 추가
  // responseData.models = await getComModelMainBannerClientList();

  // * 2021.01.03 재화 아이콘
  const currencyIcons = await slaveDB(`
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
  responseData.levelList = []; // 삭제대상

  res.status(200).json(responseData);
};

// * 서버 마스터 정보 (2021.12.22)
export const getServerMasterInfo = (req, res) => {
  const responseData = {};

  // 캐시에서 불러오도록 처리
  responseData.master = cache.get("serverMaster");
  responseData.ad = cache.get("ad");
  responseData.timedeal = cache.get("timedeal");
  responseData.baseCurrency = cache.get("baseCurrency");

  res.status(200).json(responseData);
};

// * 플랫폼에서 진행중인 이벤트 정보 조회 (삭제대상)
export const getPlatformEvents = async (req, res) => {
  const {
    body: {
      userkey = 0,
      build = "pier.make.story",
      country = "KR",
      lang = "KO",
      os = 0,
    },
  } = req;

  const responseData = {};
  let userOS = "all";

  // 안드로이드 ,아이폰 분류 처리
  if (os === 0) userOS = "Android";
  else userOS = "iOS";

  // * 장르
  const genre = await DB(
    `
  SELECT DISTINCT fn_get_localize_text(ls.text_id, ?) genre_name
       , fn_get_localize_text(ls.text_id, 'KO') origin_name
    FROM list_project_genre genre
      , list_project_master ma
      , list_standard ls 
  WHERE ma.project_id = genre.project_id
    AND ma.is_public > 0
    AND ls.standard_class = 'genre'
    AND ls.code = genre.genre_code 
    AND ma.service_package LIKE CONCAT('%', ?, '%')
    ORDER BY ls.sortkey
  ;`,
    [lang, build]
  ); // ? 장르

  // 캐시에서 프로모션 가져오기 (os 필터링)
  responseData.promotion = cache.get("promotion").filter((item) => {
    return item.os.includes("all") || item.os.includes(userOS);
  });

  // 캐시에서 공지사항 가져오기 (os 필터링)
  responseData.notice = cache.get("notice").filter((item) => {
    return item.os.includes("all") || item.os.includes(userOS);
  });

  // 장르
  responseData.genre = genre.row;

  // 인트로 (캐시)
  responseData.intro = cache.get("intro");

  res.status(200).json(responseData);
};

// * 플랫폼에서 진행중인 공지사항 프로모션 정보 조회
export const getPlatformNoticePromotion = async (req, res) => {
  const {
    body: {
      userkey = 0,
      build = "pier.make.story",
      country = "KR",
      lang = "KO",
      os = 0,
      culture = "ZZ",
    },
  } = req;

  const responseData = {};
  let userOS = "all";

  // 안드로이드 ,아이폰 분류 처리
  if (os === 0) userOS = "Android";
  else userOS = "iOS";

  // * 장르
  const genre = await DB(
    `
  SELECT DISTINCT fn_get_localize_text(ls.text_id, ?) genre_name
       , fn_get_localize_text(ls.text_id, 'KO') origin_name
    FROM list_project_genre genre
      , list_project_master ma
      , list_standard ls 
  WHERE ma.project_id = genre.project_id
    AND ma.is_public > 0
    AND ls.standard_class = 'genre'
    AND ls.code = genre.genre_code 
    AND ma.service_package LIKE CONCAT('%', ?, '%')
    AND ma.project_type = 0
    ORDER BY ls.sortkey
  ;`,
    [lang, build]
  ); // ? 장르

  // 캐시에서 프로모션 가져오기 (os, 문화권 필터링)
  responseData.promotion = cache.get("promotion").filter((item) => {
    console.log(item);
    return (
      (item.os.includes("all") || item.os.includes(userOS)) &&
      !item.exception_culture.includes(culture)
    );
  });

  // 캐시에서 공지사항 가져오기 (os, 문화권 필터링)
  responseData.notice = cache.get("notice").filter((item) => {
    return (
      (item.os.includes("all") || item.os.includes(userOS)) &&
      !item.exception_culture.includes(culture)
    );
  });

  // 장르
  responseData.genre = genre.row;

  // 인트로 (캐시)
  responseData.intro = cache.get("intro");

  res.status(200).json(responseData);
};
