import aws from "aws-sdk";
import { response } from "express";
import {
  respondRedirect,
  respondError,
  respondDB,
  respondSuccess,
} from "../respondent";
import { logger } from "../logger";
import { DB, slaveDB } from "../mysqldb";
import { cache } from "../init";

// ! 클라이언트에서 요청해서 받는 로컬라이징 텍스트 (Deprecated)
export const getClientLocalizingList = (req, res) => {
  logger.info(`getClientLocalizingList`);

  res.status(200).json(cache.get("localize"));
};

// * 패키지 클라이언트 텍스트 정보
export const getPackageClientTextList = (req, res) => {
  logger.info(`getPackageClientTextList`);
  const responseData = cache.get("pack_localize");

  // console.log(responseData);

  respondSuccess(res, responseData);
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
