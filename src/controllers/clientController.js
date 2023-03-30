/* eslint-disable no-restricted-syntax */
import mysql from "mysql2/promise";
import { response } from "express";
import dotenv from "dotenv";
import { DB, logAction, transactionDB, logDB, slaveDB } from "../mysqldb";
import {
  Q_MODEL_RESOURCE_INFO,
  Q_SCRIPT_RESOURCE_BG,
  Q_SCRIPT_RESOURCE_EMOTICON,
  Q_SCRIPT_RESOURCE_ILLUST,
  Q_SCRIPT_RESOURCE_IMAGE,
  Q_SCRIPT_SELECT_WITH_DIRECTION,
  Q_SCRIPT_RESOURCE_BGM,
  Q_SCRIPT_RESOURCE_VOICE,
  Q_SCRIPT_RESOURCE_SE,
} from "../QStore";
import {
  getUserSelectedStory,
  loginClient,
  clearUserEpisodeSceneProgress,
  insertUserEpisodeSceneHistory,
  updateUserIllustHistory,
  updateUserMissionHistory,
  changeAccountByGamebase,
  updateUserEpisodePlayRecord,
  updateUserSceneRecord,
  accquireUserConsumableCurrency,
  consumeUserCurrency,
  updateUserMinicutHistory,
  updateUserScriptMission,
  updateTutorialStep,
  updateWithdrawDate,
  getUserProjectSceneHistory,
  getUserEpisodeHistory,
  getProfileCurrencyOwnList,
  updateUserMinicutHistoryVer2,
  insertUserProperty,
  requestTutorialReward,
  updateTutorialSelection,
  requestEpisodeFirstClearReward,
  updateTutorialHowToPlay,
  resetPlayingEpisode,
  resetUserEpisodeProgressType2,
  requestUserTutorialProgress,
  requestGalleryShareBonus,
  requestGalleryLobbyOpen,
  updateUserIntroDone,
  getUserActiveTimeDeal,
  purchasePremiumPass,
  requestSelectionHint,
  requestRecommendProject,
  getPremiumReward,
  updateUserProjectSceneHist,
} from "./accountController";
import { logger } from "../logger";

import {
  alignS3Object,
  getClientLocalizingList,
  getAppCommonResources,
  getServerMasterInfo,
  getPlatformEvents,
  getPlatformNoticePromotion,
} from "./serverController";
import {
  updateUserVoiceCheck,
  updateUserVoiceHistory,
} from "./soundController";
import {
  getUserUnreadMailList,
  requestReceiveAllMail,
  requestReceiveSingleMail,
} from "./mailController";
import {
  userMissionList,
  userMisionReceive,
  requestMissionAllReward,
} from "./missionController";
import { respondDB, respondFail, respondSuccess } from "../respondent";
import {
  updateSelectionProgress,
  updateUserProjectCurrent,
  getSelectionCurrent,
  getTop3SelectionList,
  getEndingSelectionList,
  checkUserIdValidation,
  updateUserNickname,
  requestWaitingEpisodeWithCoin,
  requestWaitingEpisodeWithAD,
  requestRemoveCurrentAD,
  setProjectProgressOrder,
  purchaseEpisodeType2,
  setUserProjectNotification,
  updateRateHistory,
  getUserProjectCurrent,
  requestUserProjectCurrent,
} from "../com/userProject";
import {
  getAllProductList,
  getUserPurchaseList,
  getUserRawPurchaseList,
  purchaseInappProduct,
  updatePassTimeDeal,
  userPurchase,
  purchaseInappProductByMail,
  getUserPurchaseListVer2,
  requestInappProduct,
  requestIfYouPass,
} from "./shopController";
import { getUserPropertyHistory, reportRequestError } from "./logController";
import { requestSingleGameCoupon, useCoupon } from "./couponController";
import { getUserBankInfo, getUserBankInfoWithResponse } from "./bankController";

import {
  collectAllProjectRetention,
  collectProjectRetention,
  getProjectEpisodeProgressCount,
  setStatList,
} from "./statController";
import {
  getUserStoryProfileCurrencyList,
  saveUserStoryProfile,
  userProfileSave,
  userProfileSaveVer2,
  getProfileCurrencyCurrent,
  getUserStoryProfileAndAbility,
} from "./profileController";
import {
  userCoinPurchase,
  getCoinProductMainList,
  getCoinProductSearch,
  getCoinProductSearchDetail,
  coinProductSearchDelete,
  getCoinProductTypeList,
  coinProductDetail,
  getCoinProductPurchaseList,
  requestTotalCoinShop,
  requestLocalizingCoinShop,
  requestCoinExchangeListByCoinShop,
} from "./coinController";

import { getLevelList, updateUserLevelProcess } from "./levelController";
import { getUserProjectLikeList, updateProjectLike } from "./likeController";
import {
  getCoinExchangeProductList,
  coinExchangePurchase,
} from "./exchangeController";
import {
  attendanceList,
  sendAttendanceReward,
  requestAttendanceMission,
  receiveAttendanceMissionReward,
  resetAttendanceMission,
  sendAttendanceRewardOptimized,
} from "./attendanceController";
import { updateSnippetPlayCount } from "./snippetController";
import { firstResetAbility, addUserAbility } from "./abilityController";
import {
  updateUserSelectionCurrent,
  purchaseSelection,
} from "./selectionController";
import {
  requestAchievementMain,
  requestAchievementList,
  updateUserAchievement,
} from "./achievementController";
import { getIFyouWebMainPageInfo, receiveInquiry } from "./webController";
import {
  requestCompleteEpisodeOptimized,
  requestEpisodeFirstClear,
  requestUnlockMission,
  requestUnlockSpecialEpisode,
} from "./playingStoryAPI";
import {
  requestIfyouPlayList,
  requestDailyMissionReward,
  increaseDailyMissionCount,
  increaseMissionAdReward,
  requestAdReward,
  increaseDailyMissionCountOptimized,
  requestIfyouPlayListOptimized,
  requestDailyMissionRewardOptimized,
  requestAdRewardOptimized,
  increaseMissionAdRewardOptimized,
} from "./ifyouController";
import {
  refreshCacheLocalizedText,
  refreshCachePlatformEvent,
  refreshCacheProduct,
  refreshCacheServerMaster,
  refreshCacheFixedData,
} from "../com/cacheLoader";
import {
  createArabicGlossary,
  createComGlossary,
  createJapanGlossary,
  deleteGlossary,
  translateComLocalize,
  translateProjectDataWithGlossary,
  translateProjectDataWithoutGlossary,
  translateProjectSpecificDataWithGlossary,
  translateScriptWithGlossary,
  translateScriptWithoutGlossary,
  translateSingleEpisode,
  translateSingleEpisodeWithoutGlossary,
  translateText,
  translateWithGlossary,
  updateSelectionConfirm,
} from "../com/com";
import {
  getSurveyMain,
  getSurveyDetail,
  receiveSurveyReward,
  requestLocalizingSurvey,
} from "./surveyController";
import {
  chargeEnergyByAdvertisement,
  checkDailyEnergy,
  checkPackageVersion,
  chooseChoiceWithEnergy,
  getDetailDLC,
  getNovelPackageUserUnreadMailList,
  getPackageDLC,
  getPackageProduct,
  getPackageProject,
  getPackUserPurchaseList,
  getSingleGameScriptWithResources,
  loginPackage,
  purchaseDLC,
  purchaseOtomeChoice,
  purchaseOtomeItem,
  purchaseSingleNovelProduct,
  requestNovelPackageReceiveAllMail,
  requestNovelPackageReceiveSingleMail,
  requestOtomeAdReward,
  requestOtomeTimerReward,
  requestPackageStoryInfo,
  resetOtomeGameProgress,
  spendEnergyByChoice,
  updateAlterName,
  updateChangeOtomeDress,
  updateMainOtomeDress,
} from "./packageController";
import { initializeClient } from "../com/centralControll";

dotenv.config();

// * 클라이언트에서 호출하는 프로젝트 크레딧 리스트
const getProjectCreditList = async (req, res) => {
  const {
    body: { project_id },
  } = req;

  const creditResult = await DB(`
  SELECT a.tier, a.nickname
  FROM list_credit a 
 WHERE a.project_id = ${project_id}
  ORDER BY a.tier, a.sortkey, a.nickname;
  `);

  res.status(200).json(creditResult.row);
};

/* clientController는 미들웨어에서 global.user를 통해 body 파라매터가 저장됩니다. */

const getLivePairScriptInfo = async (project_id, template, pair_id) => {
  let result;

  if (template === "illust") {
    result = await DB(`
    SELECT 'live_illust' template
         , a.live_illust_name image_name
    FROM list_live_illust a
    WHERE a.project_id = ${project_id}
      AND a.live_illust_id = ${pair_id};
    `);
  } else {
    result = await DB(`
    SELECT 'live_object' template
         , a.live_object_name image_name
    FROM list_live_object a
    WHERE a.project_id = ${project_id}
      AND a.live_object_id = ${pair_id};
    `);
  }

  if (!result.state || result.row.length === 0) return null;

  // return!
  return result.row[0];
};

// 하나의 에피소드 스크립트 및 필요한 리소스 조회
// ! # 중요합니다!
const getEpisodeScriptWithResources = async (req, res) => {
  const userInfo = req.body;

  logger.info(`getEpisodeScriptWithResources ${JSON.stringify(userInfo)}`);

  // 에피소드 ID 없는 경우 받아오기.
  if (!userInfo.episode_id || userInfo.episode_id === "") {
    logger.error(
      `getEpisodeScriptWithResources empty episode_id ${JSON.stringify(
        userInfo
      )}`
    );
    const projectCurrent = await getUserProjectCurrent(userInfo);
    if (projectCurrent && projectCurrent.length > 0) {
      userInfo.episode_id = projectCurrent[0].episode_id;
    }
  }

  const result = {};

  // eslint-disable-next-line prefer-destructuring
  let lang = userInfo.lang;

  // lang이 있는지 확인
  const langCheck = await slaveDB(
    `
  SELECT * FROM list_script 
  WHERE episode_id = ? 
  AND lang = ?; 
  `,
    [userInfo.episode_id, lang]
  );
  if (!langCheck.state || langCheck.row.length === 0) lang = "KO";

  const purchaseInfo = await DB(
    `
  SELECT a.purchase_type 
  FROM user_episode_purchase a
 WHERE a.userkey = ?
   AND a.episode_id = ?
  `,
    [userInfo.userkey, userInfo.episode_id]
  );

  console.log(purchaseInfo.row);
  let purchaseType = "";

  if (!purchaseInfo.state || purchaseInfo.row.length === 0) {
    // respondDB(res, 80094, "에피소드 구매 정보가 없습니다.");
    // logger.error("No episode purchase data");
    purchaseType = "Permanent";
    //return;
  } else {
    purchaseType = purchaseInfo.row[0].purchase_type;
  }

  console.log("current episode purchase type is .... ", purchaseType);

  // 스크립트
  const sc = await DB(Q_SCRIPT_SELECT_WITH_DIRECTION, [
    userInfo.episode_id,
    lang,
  ]);

  console.log("script count : ", sc.row.length);

  if (purchaseType !== "AD") {
    console.log("Change to pay");

    for await (const item of sc.row) {
      // live_pair_id가 있을때만 처리한다.
      if (item.live_pair_id > 0) {
        const pair = await getLivePairScriptInfo(
          item.project_id,
          item.template,
          item.live_pair_id
        );

        // 페어정보 존재시에 교체해준다.
        if (pair != null) {
          item.template = pair.template;
          item.script_data = pair.image_name;
          item.live_pair_id = -1;
        }
      }
    }
  }

  // 배경
  const background = await slaveDB(Q_SCRIPT_RESOURCE_BG, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);
  // 이미지
  const image = await slaveDB(Q_SCRIPT_RESOURCE_IMAGE, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);
  // 일러스트
  const illust = await slaveDB(Q_SCRIPT_RESOURCE_ILLUST, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);
  // 이모티콘
  const emoticon = await slaveDB(Q_SCRIPT_RESOURCE_EMOTICON, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);

  // BGM
  const bgm = await slaveDB(Q_SCRIPT_RESOURCE_BGM, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);

  // 음성
  const voice = await slaveDB(Q_SCRIPT_RESOURCE_VOICE, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);

  // 효과음
  const se = await slaveDB(Q_SCRIPT_RESOURCE_SE, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);

  // 현재 에피소드에서 활성화된 로딩 중 랜덤하게 하나 가져온다.
  const loading = await slaveDB(`
  SELECT a.loading_id
     , a.loading_name
     , a.image_id 
     , fn_get_design_info(a.image_id, 'url') image_url
     , fn_get_design_info(a.image_id, 'key') image_key
  FROM list_loading a
     , list_loading_appear b
WHERE a.project_id = ${userInfo.project_id}
  AND b.loading_id = a.loading_id
  AND b.episode_id = ${userInfo.episode_id}
  AND b.is_use = 1
ORDER BY rand() LIMIT 1;
  `);

  result.loading = loading.row;
  result.loadingDetail = [];

  if (loading.row.length > 0) {
    const loadingID = loading.row[0].loading_id;
    const loadingDetail = await DB(`
      SELECT a.detail_no
          , a.lang 
          , a.loading_text 
        FROM list_loading_detail a
      WHERE a.loading_id = ${loadingID}
      AND a.lang = '${lang}'
      ORDER BY rand();
    `);

    result.loadingDetail = loadingDetail.row;
  }

  result.script = sc.row;
  result.background = background.row;
  result.image = image.row;
  result.illust = illust.row;
  result.emoticon = emoticon.row;
  result.bgm = bgm.row;
  result.voice = voice.row;
  result.se = se.row;

  res.status(200).send(result);

  logAction(userInfo.userkey, "episode_start", userInfo);
};

// * 에피소드 플레이
const startEpisodePlay = async (req, res) => {
  const userInfo = req.body;
  logger.info(`startEpisodePlay ${JSON.stringify(userInfo)}`);

  const result = {}; // 결과

  let { lang } = userInfo; // 유저가 선택한 언어
  let purchaseType = ""; // 에피소드 구매 타입

  // 유저가 선택한 언어로 스크립트가 있는지 체크한다.
  const ScriptLangCheck = await slaveDB(`
  SELECT episode_id FROM list_script 
  WHERE episode_id = ${userInfo.episode_id} 
  AND lang = '${userInfo.lang}'; 
  `);

  // 유저의 언어로 작성된 스크립트가 없다.
  if (ScriptLangCheck.row.length <= 0) {
    // 영어 체크
    const EnglishScriptCheck = await slaveDB(`
    SELECT episode_id FROM list_script 
    WHERE episode_id = ${userInfo.episode_id} 
    AND lang = 'EN'; 
    `);

    // 언어 체크 종료. 최종적으로 없으면 KO
    if (EnglishScriptCheck.row.length > 0) lang = "EN";
    // 영어 스크립트 있으면 영어로.
    else lang = "KO";
  } // ? 언어 체크 종료

  // * 에피소드 구매 기록 조회
  const purchaseInfo = await DB(
    `
  SELECT a.purchase_type 
  FROM user_episode_purchase a
 WHERE a.userkey = ?
   AND a.episode_id = ?
  `,
    [userInfo.userkey, userInfo.episode_id]
  );

  // 에피소드 구매 기록이 없으면 Permanent로 처리. (1화에 해당한다.)
  if (!purchaseInfo.state || purchaseInfo.row.length === 0) {
    // respondDB(res, 80094, "에피소드 구매 정보가 없습니다.");
    // logger.error("No episode purchase data");
    // logger.info("No episode purchase data");
    purchaseType = "Permanent";
    //return;
  } else {
    purchaseType = purchaseInfo.row[0].purchase_type;
  }

  logger.info(`current episode purchase type is [${purchaseType}]`);

  // * 스크립트 및 스크립트 리소스 조회
  let query = ``;
  query += mysql.format(Q_SCRIPT_SELECT_WITH_DIRECTION, [
    userInfo.episode_id,
    lang,
  ]); // 0. 스크립트
  query += mysql.format(Q_SCRIPT_RESOURCE_BG, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]); // 1. 배경
  query += mysql.format(Q_SCRIPT_RESOURCE_IMAGE, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]); // 2. 이미지
  query += mysql.format(Q_SCRIPT_RESOURCE_ILLUST, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]); // 3. 일러스트
  query += mysql.format(Q_SCRIPT_RESOURCE_EMOTICON, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]); // 4. 이모티콘
  query += mysql.format(Q_SCRIPT_RESOURCE_BGM, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]); // 5. BGM
  query += mysql.format(Q_SCRIPT_RESOURCE_VOICE, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]); // 6. 음성
  query += mysql.format(Q_SCRIPT_RESOURCE_SE, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]); // 7. 효과음

  const combinationResult = await slaveDB(query); // 모인 쿼리 실행

  if (!combinationResult.state) {
    logger.error(combinationResult.error);
  }

  // combinationResult.row
  result.script = combinationResult.row[0];
  result.background = combinationResult.row[1];
  result.image = combinationResult.row[2];
  result.illust = combinationResult.row[3];
  result.emoticon = combinationResult.row[4];
  result.bgm = combinationResult.row[5];
  result.voice = combinationResult.row[6];
  result.se = combinationResult.row[7];

  // 현재 에피소드에서 활성화된 로딩 중 랜덤하게 하나 가져온다.
  const loading = await slaveDB(`
  SELECT a.loading_id
     , a.loading_name
     , a.image_id 
     , fn_get_design_info(a.image_id, 'url') image_url
     , fn_get_design_info(a.image_id, 'key') image_key
    FROM list_loading a
      , list_loading_appear b
  WHERE a.project_id = ${userInfo.project_id}
    AND b.loading_id = a.loading_id
    AND b.episode_id = ${userInfo.episode_id}
    AND b.is_use = 1
  ORDER BY rand() LIMIT 1;
  `);

  result.loading = loading.row;
  result.loadingDetail = [];

  if (loading.row.length > 0) {
    const loadingID = loading.row[0].loading_id;
    const loadingDetail = await slaveDB(`
      SELECT a.detail_no
          , a.lang 
          , a.loading_text 
        FROM list_loading_detail a
      WHERE a.loading_id = ${loadingID}
      AND a.lang = '${lang}'
      ORDER BY rand();
    `);

    result.loadingDetail = loadingDetail.row;
  }
  // ? 로딩 정보 불러오기 종료

  // * 응답
  res.status(200).json(result);

  logAction(userInfo.userkey, "episode_start", userInfo);
}; // ? END of startEpisodePlay

// * 프로젝트의 장르 조회하기
const getProjectGenre = async (project_id, lang) => {
  const result = await slaveDB(`
  SELECT lpg.genre_code
       , fn_get_localize_text(ls.text_id, '${lang}') genre_name
    FROM list_project_genre lpg
      , list_standard ls
    WHERE ls.standard_class = 'genre'
    AND ls.code  = lpg.genre_code
    AND lpg.project_id = ${project_id}
    ORDER BY lpg.sortkey;  
  `);

  const responseData = [];

  result.row.forEach((item) => {
    responseData.push(item.genre_name);
  });

  return responseData;
};

//? 메인 카테고리 시작
const getMainCategoryList = async (lang, country, is_beta, build) => {
  //메인 카테고리
  const result = await slaveDB(`
  SELECT 
  category_id
  , fn_get_localize_text(name, '${lang}') name_text
  , project_kind 
  , array_kind
  , project_cnt 
  , is_favorite 
  , is_view
  , CASE WHEN project_kind = 'genre' THEN fn_get_localize_text((SELECT z.text_id  FROM list_standard z WHERE z.standard_class ='genre' AND z.code = cmc.genre LIMIT 1), '${lang}')
  		ELSE '' END genre
  , fn_get_main_category(category_id, '${lang}', '${country}', ${is_beta}, '${build}') project_list
  FROM com_main_category cmc
  WHERE category_id > 0 
  AND is_public > 0
  ORDER BY sortkey;
  `);

  return result.row;
};

const getCultureMainCategoryList = async (lang, culture, is_beta) => {
  //메인 카테고리
  const result = await slaveDB(`
  SELECT 
  category_id
  , fn_get_localize_text(name, '${lang}') name_text
  , project_kind 
  , array_kind
  , project_cnt 
  , is_favorite 
  , is_view
  , CASE WHEN project_kind = 'genre' THEN fn_get_localize_text((SELECT z.text_id  FROM list_standard z WHERE z.standard_class ='genre' AND z.code = cmc.genre LIMIT 1), '${lang}')
  		ELSE '' END genre
  , fn_get_main_category_culture(category_id, '${lang}', '${culture}', ${is_beta}) project_list
  FROM com_main_category cmc
  WHERE category_id > 0 
  AND is_public > 0
  ORDER BY sortkey;
  `);

  return result.row;
};

//? 메인 카테고리 끝

// * 이프유 프로젝트 리스트 조회 (2022.10.05)
const requestPlatformProjectList = async (req, res) => {
  const {
    body: {
      userkey = 0,
      build = "pier.make.story",
      country = "US",
      lang = "KO",
      culture = "ZZ",
    },
  } = req;

  const isBETA = process.env.BETA;
  console.log(`isBETA : [${isBETA}]`);

  const postfixQuery = `AND a.is_deploy = 1`;

  let onlyDeploy = false;
  // 숫자를 입력해도 스트링으로 받는다.
  if (isBETA === "1") {
    onlyDeploy = true;
  }

  console.log("onlyDeploy : ", onlyDeploy);

  // 2022.06.16 조회수(hit_count), 선호작(like_count) 카운트 추가
  const query = `
  SELECT a.project_id 
  , ifnull(b.title, a.title) title
  , ifnull(b.summary, a.summary) summary 
  , ifnull(b.writer , a.writer) writer 
  , a.sortkey 
  , a.bubble_set_id
  , a.favor_use 
  , a.challenge_use 
  , a.is_credit 
  , fn_get_design_info(b.ifyou_banner_id, 'url') ifyou_image_url
  , fn_get_design_info(b.ifyou_banner_id, 'key') ifyou_image_key
  , fn_get_design_info(a.ifyou_thumbnail_id, 'url') ifyou_thumbnail_url
  , fn_get_design_info(a.ifyou_thumbnail_id, 'key') ifyou_thumbnail_key
  , fn_get_design_info(b.circle_image_id, 'url') circle_image_url
  , fn_get_design_info(b.circle_image_id, 'key') circle_image_key
  , fn_get_design_info(a.episode_finish_id, 'url') episode_finish_url
  , fn_get_design_info(a.episode_finish_id, 'key') episode_finish_key
  , fn_get_design_info(a.premium_pass_id, 'url') premium_pass_url
  , fn_get_design_info(a.premium_pass_id, 'key') premium_pass_key
  , fn_get_design_info(a.premium_badge_id, 'url') premium_badge_url
  , fn_get_design_info(a.premium_badge_id, 'key') premium_badge_key
  , fn_get_design_info(b.category_thumbnail_id, 'url') category_thumbnail_url
  , fn_get_design_info(b.category_thumbnail_id, 'key') category_thumbnail_key
  , fn_get_design_info(a.coin_banner_id, 'url') coin_banner_url
  , fn_get_design_info(a.coin_banner_id, 'key') coin_banner_key
  , fn_get_design_info(b.introduce_image_id, 'url') introduce_image_url
  , fn_get_design_info(b.introduce_image_id, 'key') introduce_image_key
  , a.banner_model_id -- 메인배너 Live2D 모델ID
  , a.is_lock
  , a.color_rgb
  , fn_get_episode_progress_value(${userkey}, a.project_id) project_progress
  , fn_check_exists_project_play_record(${userkey}, a.project_id) is_playing
  , b.original
  , ifnull(a.serial_day, -1) serial_day
  , ifnull(fn_get_origin_pass_price (a.project_id), 100) pass_price
  , fn_get_discount_pass_price(${userkey}, a.project_id) discount_pass_price
  , ROUND(0.1, 2) pass_discount
  , fn_get_user_project_notification(${userkey}, a.project_id) is_notify
  , ifnull(sps.hit_count, 0) hit_count
  , ifnull(sps.like_count, 0) like_count
  , fn_get_project_hashtags(a.project_id, '${lang}') hashtags
  , ifnull(DATE_FORMAT(DATE_ADD(uop.purchase_date, INTERVAL 24 HOUR), '%Y-%m-%d %T'), '') oneday_pass_expire
  , ifnull(upp.purchase_no, 0) premium_pass_exist
  , ifnull(cpm.product_id, '') premium_product_id 
  , ifnull(cpm.sale_id, '') premium_sale_id
  , ifnull(b.translator, '') translator
  FROM list_project_master a
  LEFT OUTER JOIN list_project_detail b ON b.project_id = a.project_id AND b.lang ='${lang}'
  LEFT OUTER JOIN gamelog.stat_project_sum sps ON sps.project_id = a.project_id
  LEFT OUTER JOIN user_oneday_pass uop ON a.project_id = uop.project_id AND uop.userkey = ${userkey}
  LEFT OUTER JOIN user_premium_pass upp ON a.project_id = upp.project_id AND upp.userkey = ${userkey}
  LEFT OUTER JOIN com_premium_master cpm ON a.project_id = cpm.project_id
  WHERE a.project_id > 0 
  AND a.is_public > 0
  AND a.project_type = 0
  AND (locate('${culture}', a.exception_culture) IS NULL OR locate('${culture}', a.exception_culture) < 1)
    ${onlyDeploy ? postfixQuery : ""}
  `;
  // * 위에 베타서버용 추가 쿼리 관련 로직 추가되었음 2022.03.22

  const result = await slaveDB(`${query} ORDER BY a.sortkey;`, [
    build,
    country,
  ]);
  if (!result.state) {
    logger.error(`getIfYouProjectList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }
  // 원데이 완료시간 tick 추가
  result.row.forEach((item) => {
    const { oneday_pass_expire } = item;
    if (!oneday_pass_expire) item.oneday_pass_expire_tick = 0;
    else {
      const expireDate = new Date(oneday_pass_expire);
      item.oneday_pass_expire_tick = expireDate.getTime();
    }
  });

  console.log(`result of projects count : `, result.row.length);

  // * 장르 추가
  for await (const item of result.row) {
    item.genre = await getProjectGenre(item.project_id, lang);
  }

  // * 가장 마지막에 플레이한 프로젝트 가져오기
  const latestProject = await slaveDB(`
  SELECT 
  a.project_id
  , a.episode_id
  , le.chapter_number 
  , le.episode_type 
  FROM user_project_current a
     , list_project_master lpm
     , list_episode le 
 WHERE a.userkey = ${userkey}
   AND a.is_special = 0
   AND lpm.project_id = a.project_id 
   AND a.project_id = le.project_id 
   AND a.episode_id = le.episode_id 
   AND lpm.project_type = 0
   AND (locate('${culture}', lpm.exception_culture) IS NULL OR locate('${culture}', lpm.exception_culture) < 1)
 ORDER BY a.update_date DESC
 LIMIT 1;  
  `);

  const responseData = {};
  responseData.all = result.row;
  responseData.mainCategory = await getCultureMainCategoryList(
    lang,
    culture,
    isBETA
  );
  responseData.recommend = []; // 사용하지 않도록 변경
  responseData.like = await getUserProjectLikeList(userkey); //좋아요 리스트
  responseData.latest = latestProject.row;

  res.status(200).json(responseData);
}; // ? end of requestPlatformProjectList

// * 이프유 프로젝트 리스트 조회(삭제 대상)
const getIfYouProjectList = async (req, res) => {
  const {
    body: {
      userkey = 0,
      build = "pier.make.story",
      country = "US",
      lang = "KO",
      culture = "ZZ",
    },
  } = req;

  const isBETA = process.env.BETA;
  console.log(`isBETA : [${isBETA}]`);

  const postfixQuery = `AND a.is_deploy = 1`;

  let onlyDeploy = false;
  // 숫자를 입력해도 스트링으로 받는다.
  if (isBETA === "1") {
    onlyDeploy = true;
  }

  console.log("onlyDeploy : ", onlyDeploy);

  // 2022.06.16 조회수(hit_count), 선호작(like_count) 카운트 추가
  const query = `
  SELECT a.project_id 
  , ifnull(b.title, a.title) title
  , ifnull(b.summary, a.summary) summary 
  , ifnull(b.writer , a.writer) writer 
  , a.sortkey 
  , a.bubble_set_id
  , a.favor_use 
  , a.challenge_use 
  , a.is_credit 
  , fn_get_design_info(b.ifyou_banner_id, 'url') ifyou_image_url
  , fn_get_design_info(b.ifyou_banner_id, 'key') ifyou_image_key
  , fn_get_design_info(a.ifyou_thumbnail_id, 'url') ifyou_thumbnail_url
  , fn_get_design_info(a.ifyou_thumbnail_id, 'key') ifyou_thumbnail_key
  , fn_get_design_info(b.circle_image_id, 'url') circle_image_url
  , fn_get_design_info(b.circle_image_id, 'key') circle_image_key
  , fn_get_design_info(a.episode_finish_id, 'url') episode_finish_url
  , fn_get_design_info(a.episode_finish_id, 'key') episode_finish_key
  , fn_get_design_info(a.premium_pass_id, 'url') premium_pass_url
  , fn_get_design_info(a.premium_pass_id, 'key') premium_pass_key
  , fn_get_design_info(a.premium_badge_id, 'url') premium_badge_url
  , fn_get_design_info(a.premium_badge_id, 'key') premium_badge_key
  , fn_get_design_info(b.category_thumbnail_id, 'url') category_thumbnail_url
  , fn_get_design_info(b.category_thumbnail_id, 'key') category_thumbnail_key
  , fn_get_design_info(a.coin_banner_id, 'url') coin_banner_url
  , fn_get_design_info(a.coin_banner_id, 'key') coin_banner_key
  , fn_get_design_info(b.introduce_image_id, 'url') introduce_image_url
  , fn_get_design_info(b.introduce_image_id, 'key') introduce_image_key
  , a.banner_model_id -- 메인배너 Live2D 모델ID
  , a.is_lock
  , a.color_rgb
  , fn_get_episode_progress_value(${userkey}, a.project_id) project_progress
  , fn_check_exists_project_play_record(${userkey}, a.project_id) is_playing
  , b.original
  , ifnull(a.serial_day, -1) serial_day
  , ifnull(fn_get_origin_pass_price (a.project_id), 100) pass_price
  , fn_get_discount_pass_price(${userkey}, a.project_id) discount_pass_price
  , ROUND(0.1, 2) pass_discount
  , fn_get_user_project_notification(${userkey}, a.project_id) is_notify
  , ifnull(sps.hit_count, 0) hit_count
  , ifnull(sps.like_count, 0) like_count
  , fn_get_project_hashtags(a.project_id, '${lang}') hashtags
  , ifnull(DATE_FORMAT(DATE_ADD(uop.purchase_date, INTERVAL 24 HOUR), '%Y-%m-%d %T'), '') oneday_pass_expire
  , ifnull(upp.purchase_no, 0) premium_pass_exist
  , ifnull(cpm.product_id, '') premium_product_id 
  , ifnull(cpm.sale_id, '') premium_sale_id
  , ifnull(b.translator, '') translator
  FROM list_project_master a
  LEFT OUTER JOIN list_project_detail b ON b.project_id = a.project_id AND b.lang ='${lang}'
  LEFT OUTER JOIN gamelog.stat_project_sum sps ON sps.project_id = a.project_id
  LEFT OUTER JOIN user_oneday_pass uop ON a.project_id = uop.project_id AND uop.userkey = ${userkey}
  LEFT OUTER JOIN user_premium_pass upp ON a.project_id = upp.project_id AND upp.userkey = ${userkey}
  LEFT OUTER JOIN com_premium_master cpm ON a.project_id = cpm.project_id
  WHERE a.project_id > 0 
  AND a.is_public > 0
  AND a.service_package LIKE CONCAT('%', ?, '%')
  AND (locate('${lang}', a.exception_lang) IS NULL OR locate('${lang}', a.exception_lang) < 1)
  AND (locate('${country}', a.exception_country) IS NULL OR locate('${country}', a.exception_country) < 1)
    ${onlyDeploy ? postfixQuery : ""}
  `;
  // * 위에 베타서버용 추가 쿼리 관련 로직 추가되었음 2022.03.22

  const result = await slaveDB(`${query} ORDER BY a.sortkey;`, [
    build,
    country,
  ]);
  if (!result.state) {
    logger.error(`getIfYouProjectList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }
  // 원데이 완료시간 tick 추가
  result.row.forEach((item) => {
    const { oneday_pass_expire } = item;
    if (!oneday_pass_expire) item.oneday_pass_expire_tick = 0;
    else {
      const expireDate = new Date(oneday_pass_expire);
      item.oneday_pass_expire_tick = expireDate.getTime();
    }
  });

  console.log(`result of projects count : `, result.row.length);

  // * 장르 추가
  for await (const item of result.row) {
    item.genre = await getProjectGenre(item.project_id, lang);
  }

  // * 가장 마지막에 플레이한 프로젝트 가져오기
  const latestProject = await slaveDB(`
  SELECT 
  a.project_id
  , a.episode_id
  , le.chapter_number 
  , le.episode_type 
  FROM user_project_current a
     , list_project_master lpm
     , list_episode le 
 WHERE a.userkey = ${userkey}
   AND a.is_special = 0
   AND lpm.project_id = a.project_id 
   AND a.project_id = le.project_id 
   AND a.episode_id = le.episode_id 
   AND (locate('${lang}', lpm.exception_lang) IS NULL OR locate('${lang}', lpm.exception_lang) < 1)
 ORDER BY a.update_date DESC
 LIMIT 1;  
  `);

  const responseData = {};
  responseData.all = result.row;
  responseData.mainCategory = await getMainCategoryList(
    lang,
    country,
    isBETA,
    build
  );
  responseData.recommend = []; // 사용하지 않도록 변경
  responseData.like = await getUserProjectLikeList(userkey); //좋아요 리스트
  responseData.latest = latestProject.row;

  res.status(200).json(responseData);
}; // ? end of getIfYouProjectList

//! 메인 로딩 이미지 랜덤 출력
export const getMainLoadingImageRandom = async (req, res) => {
  const {
    body: { lang = "KO" },
  } = req;

  logger.info(`getMainLoadingImageRandom ${lang}`);

  const result = await slaveDB(
    `
    SELECT fn_get_design_info(b.image_id, 'url') image_url 
         , fn_get_design_info(b.image_id, 'key') image_key
      FROM list_main_loading a
         , list_main_loading_lang b
     WHERE a.main_loading_id = b.main_loading_id
       AND b.lang = ?
       AND now() BETWEEN a.start_date AND a.end_date
       AND a.is_public = 1;
  `,
    [lang]
  );

  console.log(result.state, result.row);

  res.status(200).json(result.row);
};

// 게임베이스에 연결된 계정이 있는지 체크
const checkAccountExistsByGamebase = async (req, res) => {
  const {
    body: { gamebaseID },
  } = req;

  const result = await DB(
    `
  SELECT a.userkey, a.gamebaseid
    FROM table_account a
  WHERE a.gamebaseid  = ?;  
  `,
    [gamebaseID]
  );

  res.status(200).json(result.row);
};

// 유저의 미수신 메일 개수 조회
export const getUserUnreadMailCount = async (userkey) => {
  let unreadCount = 0;

  const unreadMailResult = await DB(
    `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
    [userkey]
  );

  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    unreadCount = unreadMailResult.row[0].cnt;

  return unreadCount;
};

// 현재 계정의 gamebase ID 정보를 업데이트
// 최초 연동때 사용한다.
const updateAccountWithGamebaseID = async (req, res) => {
  const {
    body: { userkey, gamebaseID },
  } = req;

  // * 최초 연동시에 스타 7개 지급 2022.01
  const result = await DB(
    `
  UPDATE table_account 
   SET gamebaseid = ?
     , account_link = 'link'
   WHERE userkey = ?;
   
   CALL sp_send_user_mail(${userkey}, 'account_link', 'gem', 7, -1, 30);
  `,
    [gamebaseID, userkey]
  );

  if (result.error) {
    logger.error(result.error);
    res.status(400);
    return;
  }

  const unreadMailCount = await getUserUnreadMailCount(userkey);
  const responseData = { unreadMailCount };

  res.status(200).json(responseData);
};

// * 쿼리 만들기
export const makeInsertQuery = async (req, res) => {
  const {
    body: { target },
  } = req;

  const columns = await DB(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS c WHERE TABLE_NAME =?;`,
    [target]
  );

  let insertQuery = `INSERT INTO ${target} (`;
  let colIndex = 0;
  const colCount = columns.row.length;

  columns.row.forEach((item) => {
    if (colIndex === 0) insertQuery += `${item.COLUMN_NAME}`;
    else insertQuery += `, ${item.COLUMN_NAME}`;

    colIndex += 1;
  });

  insertQuery += `) VALUES (`;

  for (let i = 0; i < colCount; i++) {
    if (i === 0) insertQuery += `?`;
    else insertQuery += `, ?`;
  }

  insertQuery += `);`;

  res.status(200).send(insertQuery);
};

// 테이블 카피하기
export const makeCopyInsert = async (req, res) => {
  const {
    body: { target, target_project, current_project },
  } = req;

  const columns = await DB(
    `SELECT COLUMN_NAME, COLUMN_KEY FROM information_schema.COLUMNS c WHERE TABLE_NAME =? ORDER BY ORDINAL_POSITION;`,
    [target]
  );

  let insertQuery = `INSERT INTO ${target} (`;
  let colIndex = 0;

  columns.row.forEach((item) => {
    // 프라이머리 키는 하지 않음
    if (item.COLUMN_KEY.includes("PRI")) return;

    if (colIndex === 0) insertQuery += `${item.COLUMN_NAME}`;
    else insertQuery += `, ${item.COLUMN_NAME}`;

    colIndex += 1;
  });

  insertQuery += `) SELECT `;
  colIndex = 0;
  columns.row.forEach((item) => {
    // 프라이머리 키는 하지 않음
    if (item.COLUMN_KEY.includes("PRI")) return;

    if (item.COLUMN_NAME.includes(`project_id`)) {
      insertQuery += `${target_project} `;
    } else {
      insertQuery += `${item.COLUMN_NAME} `;
    }

    colIndex += 1;

    if (colIndex < columns.row.length - 1) insertQuery += `,`;
  });

  insertQuery += ` FROM ${target} WHERE project_id = ${current_project};`;

  res.status(200).send(insertQuery);
};

export const makeLangInsert = async (req, res) => {
  const {
    body: { target, source_lang = "EN", target_lang },
  } = req;

  // target : 대상 테이블
  // source_lang : 디폴트 언어
  // target_lang : 타겟 언어

  const columns = await DB(
    `SELECT COLUMN_NAME, COLUMN_KEY FROM information_schema.COLUMNS c WHERE TABLE_NAME =? ORDER BY ORDINAL_POSITION;`,
    [target]
  );

  let insertQuery = `INSERT INTO ${target} (`;
  let colIndex = 0;

  columns.row.forEach((item) => {
    if (colIndex === 0) insertQuery += `${item.COLUMN_NAME}`;
    else insertQuery += `, ${item.COLUMN_NAME}`;

    colIndex += 1;
  });

  insertQuery += `) SELECT `;
  colIndex = 0;
  columns.row.forEach((item) => {
    if (item.COLUMN_NAME === "lang") {
      if (colIndex === 0) insertQuery += `'${target_lang}'`;
      else insertQuery += `, '${target_lang}'`;
    } else if (colIndex === 0) insertQuery += `${item.COLUMN_NAME}`;
    else insertQuery += `, ${item.COLUMN_NAME}`;

    colIndex += 1;
  });

  insertQuery += ` FROM ${target} WHERE lang = '${source_lang}';`;

  res.status(200).send(insertQuery);
};

// * 유틸리티
const concatColumns = async (req, res) => {
  const result = await DB(`
  SELECT DISTINCT target_scene_id 
  FROM list_script a
 WHERE a.episode_id IN (SELECT z.episode_id FROM list_episode z WHERE z.project_id = 57 AND z.episode_type ='chapter')
   AND a.template = 'selection'
ORDER BY cast(target_scene_id as UNSIGNED)
;
  `);

  let concatString = "";
  result.row.forEach((item) => {
    concatString += `${item.target_scene_id},`;
  });

  res.status(200).send(concatString);
};

// 대상 유저의 모든 갤러리 이미지 해금처리
const UnlockUserAllGalleryImage = async (req, res) => {
  const {
    body: { userkey, project_id },
  } = req;

  let unlockQuery = ``;
  unlockQuery += `
  DELETE FROM user_illust WHERE userkey = ${userkey} AND project_id = ${project_id};
  DELETE FROM user_minicut WHERE userkey = ${userkey} AND project_id = ${project_id};

  INSERT INTO user_illust (userkey, project_id, illust_id, illust_type) 
  SELECT ${userkey}, a.project_id, a.illust_id, 'illust'
    FROM list_illust a
   WHERE a.project_id = ${project_id}
     AND a.is_public = 1
     AND a.appear_episode > 0
     ;
  
  INSERT INTO user_illust (userkey, project_id, illust_id, illust_type) 
  SELECT ${userkey}, a.project_id, a.live_illust_id, 'live2d'
    FROM list_live_illust a
   WHERE a.project_id = ${project_id}
     AND a.is_public = 1
     AND a.appear_episode > 0;  

  INSERT INTO user_minicut (userkey, minicut_id, minicut_type, project_id)
  SELECT ${userkey}, a.minicut_id , 'minicut', a.project_id 
    FROM list_minicut a
  WHERE a.project_id = ${project_id}
    AND a.appear_episode > 0
    AND a.is_public = 1;
    
 
  
  INSERT INTO user_minicut (userkey, minicut_id, minicut_type, project_id)
  SELECT ${userkey}, a.live_object_id, 'live2d', a.project_id 
    FROM list_live_object a
  WHERE a.project_id = ${project_id}
    AND a.appear_episode > 0
    AND a.is_public = 1;     
  
  `;

  const result = await DB(unlockQuery);
  res.status(200).json(result);
};

// * 미션 데이터 준비하기(운영 및 테스트 용도)
export const PrepareMissionData = async (req, res) => {
  const {
    body: { userkey, mission_id, project_id },
  } = req;

  const missionInfo = await DB(
    `SELECT a.* FROM list_mission a WHERE a.mission_id = ${mission_id}`
  );
  if (missionInfo.row.length < 1) {
    respondDB(res, 80026, "미션정보 없음");
    return;
  }

  // * 배열로 받는 유저의 현 시점 정보
  const userScene = await getUserProjectSceneHistory(req.body); // 사건
  const userEpisode = await getUserEpisodeHistory(req.body); // 에피소드

  const mission = missionInfo.row[0];
  const { mission_type, id_condition } = mission;
  const arrayCondition = id_condition.split(`,`);

  console.log(`Total condition count : ${arrayCondition.length}`);

  // 사건 ID rlqks
  if (mission_type === "event") {
    // userScene배열과 비교해서 없는것만 insert 처리
    for (let i = 0; i < arrayCondition.length; i++) {
      if (!userScene.includes(arrayCondition[i])) {
        DB(
          `INSERT INTO user_scene_hist (userkey, project_id, scene_id) VALUES (${userkey}, ${project_id}, ${arrayCondition[i]})`
        );
      }
    }
  } else if (mission_type === "episode") {
    // 에피소드 기반
  }

  res.status(200).json("end");
}; // ? 미션 데이터 준비하기 끝!

// * 쿼리를 한번에 여러개 사용했을때 어떻게 가져오는지 알고 싶어.
const nestedQuery = async (req, res) => {
  // 쿼리 작성순서대로
  const query = `
  SELECT ld.* FROM list_design ld WHERE design_id = 582;
  SELECT aa.* FROM admin_account aa WHERE email = 'radiogaga.jin@gmail.com';
  SELECT a.* FROM list_project_master a WHERE a.project_id in (57,60);
  `;

  const result = await DB(query);

  // console.log(result);

  // result는 2차원 배열이다. result[0][N], result[1][N], result[2][N] 이런식으로  들어간다.
  console.log("query count : ", result.row.length);
  result.row.forEach((item) => {
    console.log("each query rows : ", item.length);
  });

  res.status(200).json(result.row);
};

const failResponse = (req, res) => {
  respondDB(res, 80033, "에러메세지");
};

//! 라이브 스크립트 업데이트
export const livePairScriptUpdate = async (req, res) => {
  logger.info(`livePairScriptUpdate`);

  const {
    body: { project_id = -1 },
  } = req;

  if (project_id === -1) {
    logger.error(`livePairScriptUpdate 1`);
    respondDB(res, 80019);
    return;
  }

  let result = ``;
  let currentQuery = ``;
  let updateQuery = ``;
  let recoveryQuery = ``;

  //* 라이브 일러스트
  result = await DB(
    `
  SELECT 
  image_name
  , live_illust_name 
  FROM list_illust a, list_live_illust b
  WHERE a.project_id = ?   
  AND a.live_pair_id = b.live_illust_id
  AND a.illust_id > 0 AND b.live_illust_id > 0
  
  ;`,
    [project_id]
  );
  if (result.row.length > 0) {
    for (const item of result.row) {
      // eslint-disable-next-line no-await-in-loop
      result = await DB(
        `
      SELECT 
      script_no
      , episode_id
      , lang
      , template
      , script_data 
      FROM list_script 
      WHERE project_id = ? 
      AND template = 'illust' 
      AND script_data = ?
      AND episode_id IN ( SELECT episode_id FROM list_episode WHERE project_id = ? )
      ;`,
        [project_id, item.live_illust_name, project_id]
      );
      if (result.state && result.row.length > 0) {
        for (const element of result.row) {
          currentQuery = `INSERT INTO admin_live_pair_script_history(script_no, project_id, episode_id, lang, origin_template, origin_script_data, update_template, update_script_data) 
          VALUES(?, ?, ?, ?, ?, ?, ?, ?);`;
          recoveryQuery += mysql.format(currentQuery, [
            element.script_no,
            project_id,
            element.episode_id,
            element.lang,
            element.template,
            element.script_data,
            element.template,
            item.image_name,
          ]);

          currentQuery = `UPDATE list_script SET script_data = ? WHERE script_no = ?;`;
          updateQuery += mysql.format(currentQuery, [
            item.image_name,
            element.script_no,
          ]);
        }
      }
    }
  }

  //* 라이브 오브제
  result = await DB(
    `
  SELECT 
  image_name
  , live_object_name
  FROM list_minicut a, list_live_object b 
  WHERE a.project_id = ?
  AND a.live_pair_id = b.live_object_id 
  AND a.minicut_id > 0 AND b.live_object_id > 0
  
  ;`,
    [project_id]
  );
  if (result.row.length > 0) {
    for (const item of result.row) {
      if (item.image_name === item.live_object_name) {
        // eslint-disable-next-line no-await-in-loop
        result = await DB(
          `
        SELECT 
        script_no
        , episode_id
        , lang
        , template
        , script_data
        FROM list_script 
        WHERE project_id = ? 
        AND template = 'live_object'
        AND script_data = ?
        AND episode_id IN ( SELECT episode_id FROM list_episode WHERE project_id = ? )
        ;
        `,
          [project_id, item.image_name, project_id]
        );
        if (result.state && result.row.length > 0) {
          for (const element of result.row) {
            currentQuery = `INSERT INTO admin_live_pair_script_history(script_no, project_id, episode_id, lang, origin_template, origin_script_data, update_template, update_script_data) 
            VALUES(?, ?, ?, ?, ?, ?, ?, ?);`;
            recoveryQuery += mysql.format(currentQuery, [
              element.script_no,
              project_id,
              element.episode_id,
              element.lang,
              element.template,
              element.script_data,
              "image",
              element.script_data,
            ]);

            currentQuery = `UPDATE list_script SET template = 'image' WHERE script_no = ?;`;
            updateQuery += mysql.format(currentQuery, [element.script_no]);
          }
        }
      }

      if (item.image_name !== item.live_object_name) {
        // eslint-disable-next-line no-await-in-loop
        result = await DB(
          `
        SELECT 
        script_no
        , episode_id
        , lang
        , template
        , script_data
        FROM list_script 
        WHERE project_id = ? 
        AND template = 'live_object'
        AND script_data = ?
        AND episode_id IN ( SELECT episode_id FROM list_episode WHERE project_id = ? )
        ;
        `,
          [project_id, item.live_object_name, project_id]
        );
        if (result.state && result.row.length > 0) {
          for (const element of result.row) {
            currentQuery = `INSERT INTO admin_live_pair_script_history(script_no, project_id, episode_id, lang, origin_template, origin_script_data, update_template, update_script_data) 
            VALUES(?, ?, ?, ?, ?, ?, ?, ?);`;
            recoveryQuery += mysql.format(currentQuery, [
              element.script_no,
              project_id,
              element.episode_id,
              element.lang,
              element.template,
              element.script_data,
              "image",
              item.image_name,
            ]);

            currentQuery = `UPDATE list_script SET template = 'image', script_data = ? WHERE script_no = ?;`;
            updateQuery += mysql.format(currentQuery, [
              item.image_name,
              element.script_no,
            ]);
          }
        }
      }
    }
  }

  if (recoveryQuery) {
    result = await transactionDB(`
    ${recoveryQuery}
    ${updateQuery}
    `);
    if (!result.state || result.row.length === 0) {
      logger.error(`livePairScriptUpdate ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  } else {
    logger.error(`livePairScriptUpdate 2`);
    respondDB(res, 80026, "데이터없음");
    return;
  }

  res.status(200).json({ code: "OK", koMessage: "성공" });
};

//! 유저별 광고 보기 히스토리
export const insertUserAdHistory = async (req, res) => {
  const {
    body: { userkey, project_id = -1, episode_id = -1, ad_type = "" },
  } = req;

  const result = await logDB(
    `
  INSERT INTO log_ad(
    userkey
    , project_id
    , episode_id
    , ad_type
  ) VALUES(
    ?
    ,?
    ,?
    ,?
  );
  `,
    [userkey, project_id, episode_id, ad_type]
  );

  res.status(200).json({ code: "OK", koMessage: "성공" });
};

//! 커밍순 리스트
export const getCommingList = async (req, res) => {
  const result = await DB(
    `
  SELECT a.comming_id 
  , image_url
  , image_key 
  , title
  FROM com_comming a, com_comming_lang b 
  WHERE a.comming_id = b.comming_id 
  AND lang = ?
  AND now() BETWEEN from_date AND to_date
  AND is_public > 0; 
  `,
    [req.body.lang]
  );

  res.status(200).json(result.row);
};

// * 맥북에서 업로드된 리소스들 때문에.. 이름 일괄 변경 처리 */
const normalizeResource = async (req, res) => {
  const {
    body: { project_id },
  } = req;

  // 배경
  const result = await DB(`
  select lb.bg_id id, lb.image_name
    FROM list_bg lb
  WHERE lb.project_id = ${project_id};
  `);

  result.row.forEach((item) => {
    DB(
      `
    UPDATE list_bg
       set image_name = ?
    WHERE bg_id = ?
      AND project_id = ${project_id};
    `,
      [item.image_name.normalize("NFC"), item.id]
    );

    // item.image_name = item.image_name.normalize("NFC");
  });

  const minicutResult = await DB(`
  select a.minicut_id id, a.image_name 
    from list_minicut a
  WHERE a.project_id = ${project_id};
  `);

  minicutResult.row.forEach((item) => {
    DB(
      `
    UPDATE list_minicut
       set image_name = ?
    WHERE minicut_id = ?
      AND project_id = ${project_id};
    `,
      [item.image_name.normalize("NFC"), item.id]
    );
  });

  const emoticonResult = await DB(`
  SELECT les.emoticon_slave_id id, les.image_name  FROM list_emoticon_master lem, list_emoticon_slave les  
WHERE lem.project_id = ${project_id}
  AND lem.emoticon_master_id = les.emoticon_master_id ;
  `);

  // const query = ``;

  emoticonResult.row.forEach((item) => {
    DB(
      `
    UPDATE list_emoticon_slave
       set image_name = ?
    WHERE emoticon_slave_id = ?
      AND project_id = ${project_id};
    `,
      [item.image_name.normalize("NFC"), item.id]
    );
  });

  // * 스크립트 처리
  const scriptResult = await DB(`
  SELECT a.script_no, script_data, sound_effect, emoticon_expression 
  FROM list_script a
 WHERE a.project_id = ${project_id};
  `);

  scriptResult.row.forEach((item) => {
    DB(
      `UPDATE list_script
           SET script_data = ?
             , sound_effect = ?
             , emoticon_expression = ?
        WHERE script_no = ?
    `,
      [
        item.script_data.normalize("NFC"),
        item.sound_effect.normalize("NFC"),
        item.emoticon_expression.normalize("NFC"),
        item.script_no,
      ]
    );
  });

  res.status(200).json(result);
};

//! 인트로 캐릭터 리스트
const getIntroCharacterList = async (req, res) => {
  const {
    body: { lang = "KO" },
  } = req;

  const result = await DB(`
  SELECT 
  ci.*
  , ifnull(fn_get_localize_text(ci.character_msg, '${lang}'), '') character_msg_text
  , ifnull(fn_get_localize_text(ci.public_msg, '${lang}'), '') public_msg_text
  , fn_get_design_info(ci.image_id, 'key') image_key
  , fn_get_design_info(ci.image_id, 'url') image_url
  FROM com_intro ci;
  `);

  res.status(200).json(result.row);
};

// 이전 인앱상품 구매자 환불  처리하기
const refundPreviousInappStar = async (req, res) => {
  const targets = await DB(`
  SELECT userkey, sum(current_quantity) quantity  
    FROM user_property up WHERE currency IN ('gem') AND current_quantity  > 0 AND paid > 0 
     AND current_quantity <> 77
   GROUP BY userkey;
  `);

  let sendQuery = ``;

  targets.row.forEach((user) => {
    sendQuery += mysql.format(`CALL sp_send_user_mail(?, ?, ?, ?, ?, ?);`, [
      user.userkey,
      "refund",
      "gem",
      user.quantity,
      -1,
      90,
    ]);
  });

  const result = await DB(sendQuery);

  res.status(200).json(result.state);
};

// * 작품의 히든 요소 강제로 열기
const unlockProjectHiddenElements = async (req, res) => {
  const {
    body: { userkey, project_id },
  } = req;

  // 엔딩 오픈
  await DB(`INSERT IGNORE user_ending (userkey, episode_id, project_id) 
  SELECT ${userkey}
       , le.episode_id
       , le.project_id 
    FROM list_episode le
   WHERE le.episode_type = 'ending'
     AND le.project_id = ${project_id};`);

  // 사이드
  await DB(`
  INSERT IGNORE user_side (userkey, episode_id, project_id) 
  SELECT ${userkey}
       , le.episode_id
       , le.project_id 
    FROM list_episode le
   WHERE le.episode_type = 'side'
     AND le.project_id = ${project_id};`);

  // 갤러리 이미지
  let unlockQuery = ``;
  unlockQuery += `
     DELETE FROM user_illust WHERE userkey = ${userkey} AND project_id = ${project_id};
     DELETE FROM user_minicut WHERE userkey = ${userkey} AND project_id = ${project_id};
   
     INSERT INTO user_illust (userkey, project_id, illust_id, illust_type) 
     SELECT ${userkey}, a.project_id, a.illust_id, 'illust'
       FROM list_illust a
      WHERE a.project_id = ${project_id}
        AND a.is_public = 1
        AND a.appear_episode > 0
        ;
     
     INSERT INTO user_illust (userkey, project_id, illust_id, illust_type) 
     SELECT ${userkey}, a.project_id, a.live_illust_id, 'live2d'
       FROM list_live_illust a
      WHERE a.project_id = ${project_id}
        AND a.is_public = 1
        AND a.appear_episode > 0;  
   
     INSERT INTO user_minicut (userkey, minicut_id, minicut_type, project_id)
     SELECT ${userkey}, a.minicut_id , 'minicut', a.project_id 
       FROM list_minicut a
     WHERE a.project_id = ${project_id}
       AND a.appear_episode > 0
       AND a.is_public = 1;
       
    
     
     INSERT INTO user_minicut (userkey, minicut_id, minicut_type, project_id)
     SELECT ${userkey}, a.live_object_id, 'live2d', a.project_id 
       FROM list_live_object a
     WHERE a.project_id = ${project_id}
       AND a.appear_episode > 0
       AND a.is_public = 1;     
     
     `;

  await DB(unlockQuery); // 실행

  res.status(200).send("done");
};

// * 관리자 계정 전환
const changeAdminAccountStatus = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  await DB(`
    UPDATE table_account 
    SET admin = CASE WHEN admin = 0 THEN 1 ELSE 0 END
   WHERE userkey = ${userkey};
  `);

  const result = await DB(`
  SELECT a.admin FROM table_account a WHERE a.userkey = ${userkey};
  `);

  if (result.row.length <= 0) {
    res.status(400).send("fail");
  } else {
    res.status(200).json(result.row[0]);
  }
};

// * 등급 정산
const rewardGradeUsers = async (req, res) => {
  const silver = []; // 실버
  const gold = []; // 골드
  const platinum = []; // 플래티넘

  const result = await DB(`
  select userkey, grade from table_account WHERE userkey >= 500;
  `);

  result.row.forEach((user) => {
    if (user.grade === 2) silver.push(user);
    else if (user.grade === 3) gold.push(user);
    else if (user.grade === 4) platinum.push(user);
  });

  console.log(`silver user : [${silver.length}]`);
  console.log(`gold user : [${gold.length}]`);
  console.log(`platinum user : [${platinum.length}]`);

  // 실버 200
  silver.forEach((user) => {
    DB(`
    CALL sp_send_user_mail(${user.userkey}, 'grade_bonus', 'gem', 200, -1, 90);
    `);
  });

  // 골드 400
  gold.forEach((user) => {
    DB(`
    CALL sp_send_user_mail(${user.userkey}, 'grade_bonus', 'gem', 400, -1, 90);
    `);
  });

  // 플레 70000
  platinum.forEach((user) => {
    DB(`
    CALL sp_send_user_mail(${user.userkey}, 'grade_bonus', 'gem', 700, -1, 90);
    `);
  });

  res.status(200).send("ok");
};

// * 오퍼월 크레딧 요청
const requestOfferwallCredit = async (req, res) => {
  const {
    body: { userkey, credit = 0 },
  } = req;

  if (credit <= 0) {
    respondFail(res, {}, "No credit");
    return;
  }

  await DB(
    `CALL sp_send_user_mail(${userkey}, 'offerwall', 'gem', ${credit}, -1, 30);`
  );

  const responseData = {};
  responseData.unreadMailCount = await getUserUnreadMailCount(userkey);

  respondSuccess(res, responseData);
  logAction(userkey, "offerwall", req.body);
};

// clientHome에서 func에 따라 분배
// controller에서 또다시 controller로 보내는것이 옳을까..? ㅠㅠ
export const clientHome = (req, res) => {
  // console.log(req.body);
  const { func } = req.body;

  if (!func) {
    logger.error(`no func ${JSON.stringify(req.body)}`);
    respondFail(req, {}, "no func", 80019);
    return;
  }

  // func로 분류하자..!
  switch (func) {
    case "InitializeClient": // 패키지 연동된 경우 호출
      initializeClient(req, res);
      return;

    case "startEpisodePlay":
      startEpisodePlay(req, res);
      return;

    case "loginClient":
      loginClient(req, res);
      return;

    case "loginPackage":
      loginPackage(req, res);
      return;

    case "loginSinglePackage":
      loginPackage(req, res);
      return;
    case "getPackageProject":
      getPackageProject(req, res);
      return;
    case "getUserSelectedStory":
      getUserSelectedStory(req, res);
      return;
    case "requestPackageStoryInfo":
      requestPackageStoryInfo(req, res);
      return;
    case "clearUserEpisodeSceneHistory":
      clearUserEpisodeSceneProgress(req, res);
      return;
    case "updateUserEpisodeSceneHistory":
      insertUserEpisodeSceneHistory(req, res);
      return;
    case "updateUserEpisodeSceneRecord":
      updateUserSceneRecord(req, res);
      return;
    case "updateUserProjectSceneHist":
      updateUserProjectSceneHist(req, res);
      return;
    case "resetOtomeGameProgress":
      resetOtomeGameProgress(req, res);
      return;
    case "updateMainOtomeDress":
      updateMainOtomeDress(req, res);
      return;
    case "updateChangeOtomeDress":
      updateChangeOtomeDress(req, res);
      return;
    case "requestOtomeAdReward": // 오토메 광고 보상 요청
      requestOtomeAdReward(req, res);
      return;
    case "requestOtomeTimerReward": // 오토메 타이머 보상 요청
      requestOtomeTimerReward(req, res);
      return;
    case "updateAlterName": // 오토메 이름 수정
      updateAlterName(req, res);
      return;
    case "purchaseOtomeItem": // 오토메 아이템 구매하기
      purchaseOtomeItem(req, res);
      return;

    case "getPackageDLC": // 패키지 DLC 정보
      getPackageDLC(req, res);
      return;

    case "purchaseDLC": // DLC 구매 (싱글 오토메)
      purchaseDLC(req, res);
      return;
    case "getDetailDLC": // DLC 상세 정보(싱글 오토메)
      getDetailDLC(req, res);
      return;
    case "useCoupon": // 이프유 플랫폼 쿠폰 사용 처리
      useCoupon(req, res);
      return;
    case "requestSingleGameCoupon": // 싱글 오토메 게임 쿠폰 사용 처리
      requestSingleGameCoupon(req, res);
      return;

    case "getSurveyMain": // 설문조사(이프유)
      getSurveyMain(req, res);
      return;
    case "getSurveyDetail": // 설문조사 상세정보(이프유)
      getSurveyDetail(req, res);
      return;
    case "receiveSurveyReward": // 설문조사 리워드 처리(이프유)
      receiveSurveyReward(req, res);
      return;
    case "getEpisodeScript": // 에피소드 스크립트 조회(이프유)
      getEpisodeScriptWithResources(req, res);
      return;

    case "getSingleGameScript": // 에피소드 스크립트 조회(싱글오토메)
      getSingleGameScriptWithResources(req, res);
      return;

    default:
      break;
  }
  // else if (func === "useCoupon") useCoupon(req, res);

  if (func === "updateUserIllustHistory") updateUserIllustHistory(req, res);
  else if (func === "updateUserMissionHistory")
    updateUserMissionHistory(req, res);
  else if (func === "updateUserEpisodePlayRecord")
    updateUserEpisodePlayRecord(req, res);
  else if (func === "changeAccountByGamebase")
    changeAccountByGamebase(req, res);
  else if (func === "resetUserEpisodeProgressType2")
    resetUserEpisodeProgressType2(req, res);
  else if (func === "accquireUserConsumableCurrency")
    // 재화 획득
    accquireUserConsumableCurrency(req, res);
  // 재화 소모
  else if (func === "consumeUserCurrency") consumeUserCurrency(req, res);
  else if (func === "purchaseEpisodeType2") purchaseEpisodeType2(req, res);
  else if (func === "updateUserVoiceHistory") updateUserVoiceHistory(req, res);
  // 메일 처리
  else if (func === "getUserUnreadMailList") getUserUnreadMailList(req, res);
  else if (func === "requestReceiveSingleMail")
    requestReceiveSingleMail(req, res);
  else if (func === "requestReceiveAllMail") requestReceiveAllMail(req, res);
  else if (func === "updateUserMinicutHistory")
    updateUserMinicutHistory(req, res);
  else if (func === "mainLoadingImageRandom")
    getMainLoadingImageRandom(req, res);
  else if (func === "updateUserScriptMission")
    updateUserScriptMission(req, res);
  else if (func === "getUserMissionList") userMissionList(req, res);
  else if (func === "rewardGradeUsers") rewardGradeUsers(req, res);
  else if (func === "getUserMisionReward") userMisionReceive(req, res);
  else if (func === "getClientLocallizingList")
    getClientLocalizingList(req, res);
  else if (func === "updateAccountWithGamebaseID")
    updateAccountWithGamebaseID(req, res);
  else if (func === "checkAccountExistsByGamebase")
    checkAccountExistsByGamebase(req, res);
  else if (func === "updateUserProjectCurrent")
    updateUserProjectCurrent(req, res);
  else if (func === "updateSelectionProgress")
    updateSelectionProgress(req, res);
  else if (func === "getAllProductList") getAllProductList(req, res);
  else if (func === "getPackageProduct") getPackageProduct(req, res);
  // 패키지 인앱 상품 조회
  else if (func === "getUserPurchaseList") getUserPurchaseList(req, res);
  else if (func === "getUserRawPurchaseList") getUserRawPurchaseList(req, res);
  else if (func === "purchaseSingleNovelProduct")
    purchaseSingleNovelProduct(req, res);
  else if (func === "updateTutorialStep") updateTutorialStep(req, res);
  else if (func === "updateTutorialSelection")
    updateTutorialSelection(req, res);
  else if (func === "getUserPropertyHistory") getUserPropertyHistory(req, res);
  else if (func === "getAppCommonResources") getAppCommonResources(req, res);
  else if (func === "reportRequestError") reportRequestError(req, res);
  else if (func === "updateWithdrawDate") updateWithdrawDate(req, res);
  else if (func === "getProjectCreditList") getProjectCreditList(req, res);
  else if (func === "checkUserIdValidation") checkUserIdValidation(req, res);
  else if (func === "makeInsertQuery") makeInsertQuery(req, res);
  else if (func === "makeCopyInsert") makeCopyInsert(req, res);
  else if (func === "makeLangInsert") makeLangInsert(req, res);
  else if (func === "concatColumns") concatColumns(req, res);
  else if (func === "unlockProjectHiddenElements")
    unlockProjectHiddenElements(req, res);
  else if (func === "changeAdminAccountStatus")
    changeAdminAccountStatus(req, res);
  else if (func === "UnlockUserAllGalleryImage")
    UnlockUserAllGalleryImage(req, res);
  else if (func === "getUserBankInfoWithResponse")
    getUserBankInfoWithResponse(req, res);
  else if (func === "PrepareMissionData") PrepareMissionData(req, res);
  else if (func === "nestedQuery") nestedQuery(req, res);
  else if (func === "failResponse") failResponse(req, res);
  else if (func === "getProjectEpisodeProgressCount")
    getProjectEpisodeProgressCount(req, res);
  else if (func === "userCoinPurchase") userCoinPurchase(req, res);
  else if (func === "updateUserSelectionCurrent")
    updateUserSelectionCurrent(req, res);
  // 선택지 업데이트
  else if (func === "getTop3SelectionList") getTop3SelectionList(req, res);
  // 선택지 로그 리스트
  else if (func === "getEndingSelectionList") getEndingSelectionList(req, res);
  // 엔딩 선택지 로그 리스트
  else if (func === "getServerMasterInfo") getServerMasterInfo(req, res);
  // 서버 마스터 정보 및 광고 기준정보
  else if (func === "updateUserMinicutHistoryVer2")
    updateUserMinicutHistoryVer2(req, res);
  else if (func === "getIfYouProjectList") getIfYouProjectList(req, res);
  // 삭제 대상
  else if (func === "requestPlatformProjectList")
    requestPlatformProjectList(req, res);
  // 서버 마스터 정보 및 광고 기준정보
  else if (func === "getProfileCurrencyOwnList")
    getProfileCurrencyOwnList(req, res);
  //소유한 프로필 재화 리스트
  else if (func === "getProfileCurrencyCurrent")
    getProfileCurrencyCurrent(req, res);
  //현재 저장된 프로필 재화 정보
  else if (func === "userProfileSave") userProfileSave(req, res);
  //프로필 꾸미기 저장
  else if (func === "getCoinProductMainList") getCoinProductMainList(req, res);
  //코인 상점 메인
  else if (func === "getCoinProductSearch") getCoinProductSearch(req, res);
  //코인 상점 검색
  else if (func === "getCoinProductSearchDetail")
    getCoinProductSearchDetail(req, res);
  //코인 상점 검색 상세
  else if (func === "getCoinProductTypeList") getCoinProductTypeList(req, res);
  //탭별 목록
  else if (func === "coinProductDetail") coinProductDetail(req, res);
  //상품 상세
  else if (func === "coinProductSearchDelete")
    coinProductSearchDelete(req, res);
  //검색어 삭제
  else if (func === "getCoinProductPurchaseList")
    getCoinProductPurchaseList(req, res);
  // 코인 재화 구매 내역
  else if (func === "insertUserProperty") insertUserProperty(req, res);
  // 레벨 리스트
  else if (func === "updateProjectLike") updateProjectLike(req, res);
  // 작품 좋아요 등록/해제
  else if (func === "updateUserNickname") updateUserNickname(req, res);
  // 닉네임 변경
  else if (func === "getCoinExchangeProductList")
    getCoinExchangeProductList(req, res);
  // 코인 상품 환전 리스트
  else if (func === "coinExchangePurchase") coinExchangePurchase(req, res);
  else if (func === "requestTutorialReward") requestTutorialReward(req, res);
  else if (func === "livePairScriptUpdate") livePairScriptUpdate(req, res);
  //라이브 페어 일괄 업데이트
  else if (func === "insertUserAdHistory") insertUserAdHistory(req, res);
  //유저별 광고 히스토리
  else if (func === "getCommingList") getCommingList(req, res);
  else if (func === "getAttendanceList") attendanceList(req, res);
  //출석 보상 리스트
  else if (func === "sendAttendanceReward") sendAttendanceReward(req, res);
  else if (func === "sendAttendanceRewardOptimized")
    sendAttendanceRewardOptimized(req, res);
  else if (func === "updateSnippetPlayCount") updateSnippetPlayCount(req, res);
  else if (func === "updateTutorialHowToPlay")
    updateTutorialHowToPlay(req, res);
  //출석 보상
  else if (func === "userProfileSaveVer2") userProfileSaveVer2(req, res);
  // 통합 프로필 저장Ver2
  else if (func === "saveUserStoryProfile") saveUserStoryProfile(req, res);
  else if (func === "getUserStoryProfileCurrencyList")
    getUserStoryProfileCurrencyList(req, res);
  // * 작품별 프로필 저장
  else if (func === "setStatList") setStatList(req, res);
  //통계
  else if (func === "firstResetAbility") firstResetAbility(req, res);
  //처음부터 능력치 리셋
  else if (func === "addUserAbility") addUserAbility(req, res);
  else if (func === "requestWaitingEpisodeWithCoin")
    requestWaitingEpisodeWithCoin(req, res);
  else if (func === "requestWaitingEpisodeWithAD")
    requestWaitingEpisodeWithAD(req, res);
  //능력치 추가
  else if (func === "purchaseSelection") purchaseSelection(req, res);
  else if (func === "purchaseOtomeChoice") purchaseOtomeChoice(req, res);
  else if (func === "requestRemoveCurrentAD") requestRemoveCurrentAD(req, res);
  else if (func === "resetPlayingEpisode") resetPlayingEpisode(req, res);
  //과금 선택지 구매
  else if (func === "getSelectionCurrent") getSelectionCurrent(req, res);
  //현재 선택지
  else if (func === "requestUserTutorialProgress")
    requestUserTutorialProgress(req, res);
  else if (func === "getPlatformEvents") getPlatformEvents(req, res);
  // 삭제대상
  else if (func === "getPlatformNoticePromotion")
    getPlatformNoticePromotion(req, res);
  else if (func === "requestGalleryShareBonus")
    requestGalleryShareBonus(req, res);
  else if (func === "getUserStoryProfileAndAbility")
    getUserStoryProfileAndAbility(req, res);
  else if (func === "requestGalleryLobbyOpen")
    requestGalleryLobbyOpen(req, res);
  //단계별 튜토리얼 처리
  else if (func === "requestTotalCoinShop") requestTotalCoinShop(req, res);
  //토탈 코인 상점 화면
  else if (func === "setProjectProgressOrder")
    //에피 진행 순서 누적
    setProjectProgressOrder(req, res);
  else if (func === "updateUserVoiceCheck") updateUserVoiceCheck(req, res);
  else if (func === "requestAchievementMain") requestAchievementMain(req, res);
  else if (func === "updateUserIntroDone") updateUserIntroDone(req, res);
  else if (func === "getIFyouWebMainPageInfo")
    getIFyouWebMainPageInfo(req, res);
  else if (func === "requestUserGradeInfo") requestAchievementList(req, res);
  //등급 및 업적 리스트
  else if (func === "updateUserAchievement") updateUserAchievement(req, res);
  else if (func === "receiveInquiry") receiveInquiry(req, res);
  else if (func === "collectProjectRetention")
    collectProjectRetention(req, res);
  else if (func === "collectAllProjectRetention")
    collectAllProjectRetention(req, res);
  else if (func === "requestCompleteEpisodeOptimized")
    requestCompleteEpisodeOptimized(req, res);
  // 신규
  //신규 2022.07.27
  else if (func === "requestEpisodeFirstClear")
    requestEpisodeFirstClear(req, res);
  // 타임딜 생성 처리
  else if (func === "updatePassTimeDeal") updatePassTimeDeal(req, res);
  // 유저의 활성화된 타임딜 가져오기
  else if (func === "getUserActiveTimeDeal") getUserActiveTimeDeal(req, res);
  else if (func === "purchasePremiumPass") purchasePremiumPass(req, res);
  else if (func === "requestSelectionHint") requestSelectionHint(req, res);
  // 선택지 힌트
  else if (func === "requestMissionAllReward")
    requestMissionAllReward(req, res);
  // 미션 전체 클리어 보상
  else if (func === "requestLocalizingCoinShop")
    requestLocalizingCoinShop(req, res);
  //코인샵 다국어
  else if (func === "normalizeResource") normalizeResource(req, res);
  else if (func === "requestAttendanceMission")
    requestAttendanceMission(req, res);
  //연속 출석 미션
  else if (func === "receiveAttendanceMissionReward")
    receiveAttendanceMissionReward(req, res);
  //연속 출석 미션 보상 받기
  else if (func === "resetAttendanceMission") resetAttendanceMission(req, res);
  //연속 출석 미션 보충
  else if (func === "requestIfyouPlayList") requestIfyouPlayList(req, res);
  else if (func === "requestIfyouPlayListOptimized")
    requestIfyouPlayListOptimized(req, res);
  //이프유 플레이 리스트
  else if (func === "requestDailyMissionReward")
    requestDailyMissionReward(req, res);
  else if (func === "requestDailyMissionRewardOptimized")
    requestDailyMissionRewardOptimized(req, res);
  //일일 미션 보상 받기
  else if (func === "requestDailyMissionCount")
    increaseDailyMissionCount(req, res);
  else if (func === "increaseDailyMissionCount")
    increaseDailyMissionCountOptimized(req, res);
  //일일미션 누적처리
  else if (func === "requestCoinExchangeListByCoinShop")
    requestCoinExchangeListByCoinShop(req, res);
  //환전 리스트(코인샵)
  else if (func === "setUserProjectNotification")
    setUserProjectNotification(req, res);
  // 유저 프로젝트 알림설정(2022.05.20)
  else if (func === "updateRateHistory") updateRateHistory(req, res);
  // 유저 평가팝업 기록 저장 (2022.06.02)
  else if (func === "refreshCachePlatformEvent")
    refreshCachePlatformEvent(req, res);
  // 공지사항, 프로모션 캐시 리프레시
  else if (func === "refreshCacheLocalizedText")
    refreshCacheLocalizedText(req, res);
  // 로컬라이즈 텍스트
  else if (func === "refreshCacheServerMaster")
    refreshCacheServerMaster(req, res);
  // 서버 마스터, 광고기준, 타임딜
  else if (func === "refreshCacheProduct") refreshCacheProduct(req, res);
  else if (func === "translateText") translateText(req, res);
  else if (func === "translateWithGlossary") translateWithGlossary(req, res);
  else if (func === "translateProjectDataWithoutGlossary")
    translateProjectDataWithoutGlossary(req, res);
  else if (func === "createArabicGlossary") createArabicGlossary(req, res);
  else if (func === "createJapanGlossary") createJapanGlossary(req, res);
  else if (func === "createComGlossary") createComGlossary(req, res);
  else if (func === "translateComLocalize") translateComLocalize(req, res);
  // 인앱상품 정보 캐시 재조회
  else if (func === "getIntroCharacterList") getIntroCharacterList(req, res);
  else if (func === "deleteGlossary") deleteGlossary(req, res);
  else if (func === "translateScriptWithGlossary")
    translateScriptWithGlossary(req, res);
  else if (func === "translateScriptWithoutGlossary")
    translateScriptWithoutGlossary(req, res);
  else if (func === "updateSelectionConfirm") updateSelectionConfirm(req, res);
  else if (func === "requestRecommendProject")
    requestRecommendProject(req, res);
  // 추천 작품 리스트
  else if (func === "purchaseInappProduct") purchaseInappProduct(req, res);
  // 삭제 대상
  else if (func === "requestInappProduct") requestInappProduct(req, res);
  // 신규버전
  else if (func === "translateProjectDataWithGlossary")
    translateProjectDataWithGlossary(req, res);
  else if (func === "translateProjectSpecificDataWithGlossary")
    translateProjectSpecificDataWithGlossary(req, res);
  else if (func === "increaseMissionAdReward")
    increaseMissionAdReward(req, res);
  else if (func === "increaseMissionAdRewardOptimized")
    increaseMissionAdRewardOptimized(req, res);
  // 미션 광고 보상 카운트 누적
  else if (func === "requestAdReward") requestAdReward(req, res);
  else if (func === "requestAdRewardOptimized")
    requestAdRewardOptimized(req, res);
  // 광고 보상 처리
  else if (func === "translateSingleEpisode") translateSingleEpisode(req, res);
  else if (func === "translateSingleEpisodeWithoutGlossary")
    translateSingleEpisodeWithoutGlossary(req, res);
  else if (func === "refundPreviousInappStar")
    refundPreviousInappStar(req, res);
  else if (func === "refreshCacheFixedData") refreshCacheFixedData(req, res);
  else if (func === "requestOfferwallCredit") requestOfferwallCredit(req, res);
  else if (func === "requestIfYouPass") requestIfYouPass(req, res);
  // 이프유패스 구매
  else if (func === "requestUserProjectCurrent")
    requestUserProjectCurrent(req, res);
  else if (func === "requestLocalizingSurvey")
    //설문조사
    requestLocalizingSurvey(req, res);
  else if (func === "purchaseInappProductByMail")
    //우편 구매
    purchaseInappProductByMail(req, res);
  else if (func === "getUserPurchaseListVer2")
    //구매 내역(뉴버전)
    getUserPurchaseListVer2(req, res);
  else if (func === "getPackUserPurchaseList")
    // 패키지 유저 구매내역
    getPackUserPurchaseList(req, res);
  else if (func === "getPremiumReward")
    //프리미엄 챌린지 보상
    getPremiumReward(req, res);
  else if (func === "requestUnlockSpecialEpisode")
    // 스페셜 에피소드 해금
    requestUnlockSpecialEpisode(req, res);
  else if (func === "requestUnlockMission")
    // 미션 해금
    requestUnlockMission(req, res);
  else if (func === "spendEnergyByChoice") {
    // ! 선택지 선택 후 에너지 소모 (단일 비주얼 노벨) 삭제대상 2022.12.22
    spendEnergyByChoice(req, res);
  } else if (func === "chooseChoiceWithEnergy") {
    // 신규 에너지로 선택지 선택
    chooseChoiceWithEnergy(req, res);
  } else if (func === "chargeEnergyByAdvertisement")
    //광고보고 선택지 충전하기
    chargeEnergyByAdvertisement(req, res);
  else if (func === "checkPackageVersion")
    // 패키지 버전 체크
    checkPackageVersion(req, res);
  else if (func === "getNovelPackageUserUnreadMailList")
    // 노벨 패키지 메일함 리스트
    getNovelPackageUserUnreadMailList(req, res);
  else if (func === "requestNovelPackageReceiveSingleMail")
    // 노벨 패키지 단일 메일 수신
    requestNovelPackageReceiveSingleMail(req, res);
  else if (func === "requestNovelPackageReceiveAllMail")
    // 노벨 패키지 모든 메일 수신
    requestNovelPackageReceiveAllMail(req, res);
  else if (func === "checkDailyEnergy")
    // 노벨 패키지의 일일 에너지 보상 체크 및 받기
    checkDailyEnergy(req, res);
  else if (func === "InitializeClient") {
    initializeClient(req, res); // 패키지 마스터
  } else {
    //  res.status(400).send(`Wrong Func : ${func}`);
    logger.error(`clientHome Error ${func}`);
    respondDB(res, 80033, func);
  }
};
