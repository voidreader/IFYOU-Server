/* eslint-disable no-restricted-syntax */
import mysql from "mysql2/promise";
import { restart } from "nodemon";
import { response } from "express";
import dotenv from "dotenv";
import { DB, logAction, transactionDB, logDB } from "../mysqldb";
import {
  Q_MODEL_RESOURCE_INFO,
  Q_EMOTICON_SLAVE,
  Q_SCRIPT_RESOURCE_BG,
  Q_SCRIPT_RESOURCE_EMOTICON,
  Q_SCRIPT_RESOURCE_ILLUST,
  Q_SCRIPT_RESOURCE_IMAGE,
  Q_SCRIPT_SCENE_IDS,
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
  deleteUserEpisodeSceneProgress,
  insertUserProjectDressProgress,
  updateUserIllustHistory,
  updateUserMissionHistory,
  updateUserFavorHistory,
  changeAccountByGamebase,
  updateUserEpisodePlayRecord,
  updateUserSceneRecord,
  insertUserEpisodeStartRecord,
  resetUserEpisodeProgress,
  accquireUserConsumableCurrency,
  consumeUserCurrency,
  getUserEndingList,
  updateUserMinicutHistory,
  purchaseEpisodeType2,
  updateUserScriptMission,
  updateTutorialStep,
  purchaseFreepass,
  updateWithdrawDate,
  getUserProjectSceneHistory,
  getUserEpisodeHistory,
  requestFreeCharge,
  requestExchangeOneTimeTicketWithCoin,
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
} from "./accountController";
import { logger } from "../logger";
import {
  alignS3Object,
  getServerInfo,
  getLocallizingList,
  getClientLocalizingList,
  getAppCommonResources,
  getServerMasterInfo,
  getPlatformEvents,
} from "./serverController";
import { updateUserVoiceHistory } from "./soundController";
import {
  getUserUnreadMailList,
  requestReceiveAllMail,
  requestReceiveSingleMail,
} from "./mailController";
import { userMissionList, userMisionReceive } from "./missionController";
import { respondDB } from "../respondent";
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
} from "../com/userProject";
import {
  getAllProductList,
  getUserPurchaseList,
  getUserRawPurchaseList,
  userPurchase,
} from "./shopController";
import { getUserPropertyHistory, reportRequestError } from "./logController";
import { useCoupon } from "./couponController";
import { getUserBankInfo, getUserBankInfoWithResponse } from "./bankController";

import { getProjectEpisodeProgressCount, setStatList } from "./statController";
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
} from "./coinController";

import { getLevelList, updateUserLevelProcess } from "./levelController";
import { getUserProjectLikeList, updateProjectLike } from "./likeController";
import {
  getCoinExchangeProductList,
  coinExchangePurchase,
} from "./exchangeController";
import { attendanceList, sendAttendanceReward } from "./attendanceController";
import { updateSnippetPlayCount } from "./snippetController";
import { firstResetAbility, addUserAbility } from "./abilityController";
import {
  updateUserSelectionCurrent,
  purchaseSelection,
} from "./selectionController";

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

// * 클라이언트에서 호출하는 공지사항(이벤트) 리스트
const getClientNoticeList = async (req, res) => {
  const noticeResult = await DB(`
    SELECT cn.*
    FROM com_notice cn  
  WHERE now() BETWEEN cn.start_date AND cn.end_date
    AND cn.is_public = 1
  ORDER BY cn.sortkey;
  `);

  const detailResult = await DB(`
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

  //
  noticeResult.row.forEach((notice) => {
    if (!Object.prototype.hasOwnProperty.call(notice, "detail")) {
      notice.detail = [];
    }

    detailResult.row.forEach((item) => {
      if (item.notice_no === notice.notice_no) {
        notice.detail.push(item);
      }
    });
  }); // ? end of noticeResult forEach

  res.status(200).json(noticeResult.row);
};

//* 프로모션 리스트
export const getPromotionList = async (req, res) => {
  const promotionResult = await DB(
    `
  SELECT 
  promotion_no
  , title
  , start_date
  , end_date
  , promotion_type
  , location
  FROM com_promotion
  WHERE is_public > 0 
  AND NOW() BETWEEN start_date AND end_date 
  ORDER BY sortkey; 
  `,
    []
  );

  const detailResult = await DB(
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

  promotionResult.row.forEach((promotion) => {
    if (!Object.prototype.hasOwnProperty.call(promotion, "detail")) {
      promotion.detail = [];
    }

    detailResult.row.forEach((item) => {
      if (item.promotion_no === promotion.promotion_no) {
        promotion.detail.push(item);
      }
    });
  }); // ? end of noticeResult forEach

  res.status(200).json(promotionResult.row);
};

// * PLOP 전용. 백망되와 허블 1회권 조회
const getUserOneTimeProperty = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  const result = await DB(
    `
  SELECT up.currency 
     , up.current_quantity 
     , TIMESTAMPDIFF(HOUR, now(), up.expire_date) remain_hours
 FROM user_property up
WHERE up.userkey = ${userkey}
  AND currency IN ('countessOneTime', 'honeybloodOneTime')
  AND up.current_quantity > 0
ORDER BY property_no;
  `,
    []
  );

  const responseData = {};
  responseData.bank = await getUserBankInfo(req.body);
  responseData.onetime = result.row;

  res.status(200).json(responseData);

  logAction(userkey, "request_onetime_property", req.body);
};

// ? 갤러리 상단 배너 정보
const getGalleryBannerInfo = async (req, res) => {
  const {
    body: { project_id },
  } = req;

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

  res.status(200).json(result.row);
};

/* clientController는 미들웨어에서 global.user를 통해 body 파라매터가 저장됩니다. */

// 에피소드의 다운로드 필요한 리소스 정보
const getEpisodeDownloadResources = async (req, res, result) => {
  let ret = {};
  const userInfo = req.body;

  if (result !== undefined && result !== null) {
    ret = result;
  }

  // 배경
  const background = await DB(Q_SCRIPT_RESOURCE_BG, [
    userInfo.project_id,
    userInfo.episode_id,
    userInfo.lang,
  ]);
  // 이미지
  const image = await DB(Q_SCRIPT_RESOURCE_IMAGE, [
    userInfo.project_id,
    userInfo.episode_id,
    userInfo.lang,
  ]);
  // 일러스트
  const illust = await DB(Q_SCRIPT_RESOURCE_ILLUST, [
    userInfo.project_id,
    userInfo.episode_id,
    userInfo.lang,
  ]);
  // 이모티콘
  const emoticon = await DB(Q_SCRIPT_RESOURCE_EMOTICON, [
    userInfo.project_id,
    userInfo.episode_id,
    userInfo.lang,
  ]);

  ret.background = background.row;
  ret.image = image.row;
  ret.illust = illust.row;
  ret.emoticon = emoticon.row;

  console.log(ret.background);

  res.status(200).json(ret);
};

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

  const result = {};

  // eslint-disable-next-line prefer-destructuring
  let lang = userInfo.lang;

  // lang이 있는지 확인
  const langCheck = await DB(
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
    logger.error("No episode purchase data");
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
  const background = await DB(Q_SCRIPT_RESOURCE_BG, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);
  // 이미지
  const image = await DB(Q_SCRIPT_RESOURCE_IMAGE, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);
  // 일러스트
  const illust = await DB(Q_SCRIPT_RESOURCE_ILLUST, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);
  // 이모티콘
  const emoticon = await DB(Q_SCRIPT_RESOURCE_EMOTICON, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);

  // BGM
  const bgm = await DB(Q_SCRIPT_RESOURCE_BGM, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);

  // 음성
  const voice = await DB(Q_SCRIPT_RESOURCE_VOICE, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);

  // 효과음
  const se = await DB(Q_SCRIPT_RESOURCE_SE, [
    userInfo.project_id,
    userInfo.episode_id,
    lang,
  ]);

  // 현재 에피소드에서 활성화된 로딩 중 랜덤하게 하나 가져온다.
  const loading = await DB(`
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

const getEmoticonResourceData = async (req, res) => {
  const userInfo = req.body;

  const result = await DB(Q_EMOTICON_SLAVE, [
    userInfo.project_id,
    userInfo.speaker,
    userInfo.data,
  ]);
  if (!result.state) {
    logger.error(`getEmoticonResourceData Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).send(result);
};

// 이미지 리소스 데이터 가져오기 (템플릿 마다 다름..!)
const getImageResourceData = async (req, res) => {
  const userInfo = req.body;
  let querystr = ``;

  if (userInfo.template === "background") {
    // 배경
    querystr = `
            SELECT a.*
              FROM list_bg a
             WHERE a.project_id = ?
               AND a.image_name = ?
        `;
  } else if (userInfo.template === "image") {
    // 미니컷
    querystr = `
        SELECT a.*
          FROM list_minicut a
         WHERE a.project_id = ?
           AND a.image_name = ?
    `;
  } else if (userInfo.template === "illust") {
    // 일러스트
    querystr = `
        SELECT a.*
          FROM list_illust a
         WHERE a.project_id = ?
           AND a.image_name = ?
    `;
  }

  const result = await DB(querystr, [userInfo.project_id, userInfo.data]);
  if (!result.state) {
    logger.error(`getImageResourceData Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).send(result);
}; // getImageResourceData 끝

// * 프로젝트 카테고리
const getDistinctProjectGenre = async (req, res) => {
  const {
    body: {
      userkey = 0,
      build = "pier.make.story",
      country = "KR",
      lang = "KO",
    },
  } = req;

  const result = await DB(
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
  );

  res.status(200).json(result.row);
};

// * 프로젝트의 장르 조회하기
const getProjectGenre = async (project_id, lang) => {
  const result = await DB(`
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

// ! 로비의 프로젝트 리스트 조회
const selectLobbyProjectList = async (req, res) => {
  // build identifier, country 전달
  // 국가와 빌드ID 전달받아서 조건으로 사용
  // 일단 빌드ID만!
  const {
    body: {
      userkey = 0,
      build = "pier.make.story",
      country = "KR",
      lang = "KO",
    },
  } = req;

  // ! 2021.07.06 list_project => list_project_master로 테이블 변경
  // ! 기존에 이미지 직접 업로드에서 id만 가져오는 방식으로 변경
  // ! 클라이언트에서 사용하는 언어는 임시로 한국어로 fix.
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
  , fn_get_design_info(b.ifyou_thumbnail_id, 'url') ifyou_thumbnail_url
  , fn_get_design_info(b.ifyou_thumbnail_id, 'key') ifyou_thumbnail_key
  , fn_get_design_info(b.circle_image_id, 'url') circle_image_url
  , fn_get_design_info(b.circle_image_id, 'key') circle_image_key
  , a.banner_model_id -- 메인배너 Live2D 모델ID
  , a.is_lock
  , a.color_rgb
  , fn_get_episode_progress_value(${userkey}, a.project_id) project_progress
  , fn_check_exists_project_play_record(${userkey}, a.project_id) is_playing
 FROM list_project_master a
LEFT OUTER JOIN list_project_detail b ON b.project_id = a.project_id AND b.lang ='${lang}'
WHERE a.is_public > 0
AND a.service_package LIKE CONCAT('%', ?, '%')
AND (a.service_country IS NULL OR a.service_country = ?)
ORDER BY a.sortkey;
  `;

  const result = await DB(query, [build, country]);
  if (!result.state) {
    logger.error(`selectLobbyProjectList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // * 장르 추가
  for await (const item of result.row) {
    item.genre = await getProjectGenre(item.project_id, lang);
  }

  res.status(200).send(result.row);
}; // ? 끝

// * 이프유 프로젝트 리스트 조회
const getIfYouProjectList = async (req, res) => {
  const {
    body: {
      userkey = 0,
      build = "pier.make.story",
      country = "KR",
      lang = "KO",
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
  , fn_get_design_info(b.ifyou_thumbnail_id, 'url') ifyou_thumbnail_url
  , fn_get_design_info(b.ifyou_thumbnail_id, 'key') ifyou_thumbnail_key
  , fn_get_design_info(b.circle_image_id, 'url') circle_image_url
  , fn_get_design_info(b.circle_image_id, 'key') circle_image_key
  , fn_get_design_info(b.episode_finish_id, 'url') episode_finish_url
  , fn_get_design_info(b.episode_finish_id, 'key') episode_finish_key
  , fn_get_design_info(b.premium_pass_id, 'url') premium_pass_url
  , fn_get_design_info(b.premium_pass_id, 'key') premium_pass_key
  , fn_get_design_info(b.category_thumbnail_id, 'url') category_thumbnail_url
  , fn_get_design_info(b.category_thumbnail_id, 'key') category_thumbnail_key
  , a.banner_model_id -- 메인배너 Live2D 모델ID
  , a.is_lock
  , a.color_rgb
  , fn_get_episode_progress_value(${userkey}, a.project_id) project_progress
  , fn_check_exists_project_play_record(${userkey}, a.project_id) is_playing
  , b.original
  FROM list_project_master a
  LEFT OUTER JOIN list_project_detail b ON b.project_id = a.project_id AND b.lang ='${lang}'
  WHERE a.is_public > 0
  AND a.service_package LIKE CONCAT('%', ?, '%')
  AND (a.service_country IS NULL OR a.service_country = ?)
  ${onlyDeploy ? postfixQuery : ""}
  `;
  // * 위에 베타서버용 추가 쿼리 관련 로직 추가되었음 2022.03.22

  const result = await DB(`${query} ORDER BY a.sortkey;`, [build, country]);
  if (!result.state) {
    logger.error(`selectLobbyProjectList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  console.log(`result of projects count : `, result.row.length);

  // * 장르 추가
  for await (const item of result.row) {
    item.genre = await getProjectGenre(item.project_id, lang);
  }

  const randomPick = await DB(`${query} ORDER BY RAND() LIMIT 4;`, [
    build,
    country,
  ]);

  const responseData = {};
  responseData.all = result.row;
  responseData.recommend = [];

  randomPick.row.forEach((item) => {
    responseData.recommend.push(item.project_id);
  });

  responseData.like = await getUserProjectLikeList(userkey); //좋아요 리스트

  res.status(200).json(responseData);
}; // ? end of getIfYouProjectList

const getCharacterModel = async (req, res) => {
  const userInfo = req.body;
  console.log(`getCharacterModel : ${userInfo}`);

  const result = await DB(Q_MODEL_RESOURCE_INFO, [
    userInfo.project_id,
    userInfo.speaker,
  ]);

  res.status(200).send(result.row);
};

// 에피소드의 상황 ID 리스트 가져오기
const getEpisodeSceneIds = async (req, res) => {
  const userInfo = req.body;
  const result = await DB(Q_SCRIPT_SCENE_IDS, userInfo.episode_id);
  res.status(200).send(result.row);
};

// 프로젝트 모든 이모티콘 정보 요청 (백그라운드 다운로드 용도)
export const getProjectAllEmoticon = async (req, res) => {
  const {
    body: { project_id },
  } = req;

  logger.info(`getProjectAllEmoticon ${project_id}`);

  const result = await DB(
    `
  SELECT DISTINCT ls.image_url, ls.image_key 
  FROM list_emoticon_master lm
     , list_emoticon_slave ls 
 WHERE lm.project_id = ?
   AND lm.emoticon_master_id  = ls.emoticon_master_id 
   AND ls.image_url IS NOT NULL;
  `,
    [project_id]
  );

  res.status(200).json(result.row);
};

//! 메인 로딩 이미지 랜덤 출력
export const getMainLoadingImageRandom = async (req, res) => {
  const {
    body: { lang = "KO" },
  } = req;

  logger.info(`getMainLoadingImageRandom ${lang}`);

  const result = await DB(
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
     AND a.appear_episode > 0;
  
  INSERT INTO user_illust (userkey, project_id, illust_id, illust_type) 
  SELECT ${userkey}, a.project_id, a.live_illust_id, 'live2d'
    FROM list_live_illust a
   WHERE a.project_id = ${project_id}
     AND a.is_public = 1
     AND a.appear_episode > 0;  

  INSERT INTO user_minicut (userkey, minicut_id, minicut_type, project_id)
  SELECT ${userkey}, a.minicut_id , 'image', a.project_id 
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

const normalizeResource = async (req, res) => {
  /*
  const result = await DB(`
  SELECT les.emoticon_slave_id id, les.image_name  FROM list_emoticon_master lem, list_emoticon_slave les  
WHERE lem.project_id = 94
  AND lem.emoticon_master_id = les.emoticon_master_id ;
  `);

  // const query = ``;

  result.row.forEach((item) => {
    DB(
      `
    UPDATE list_emoticon_slave
       set image_name = ?
    WHERE emoticon_slave_id = ?
      AND project_id = 94;
    `,
      [item.image_name.normalize("NFC"), item.id]
    );

    // item.image_name = item.image_name.normalize("NFC");
  });
  */

  const result = await DB(`
  SELECT a.script_no, script_data, sound_effect, emoticon_expression 
  FROM list_script a
 WHERE a.project_id = 94;
  `);

  result.row.forEach((item) => {
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

// clientHome에서 func에 따라 분배
// controller에서 또다시 controller로 보내는것이 옳을까..? ㅠㅠ
export const clientHome = (req, res) => {
  console.log(req.body);
  const { func } = req.body;

  // 스크립트 전체 행 조회
  if (func === "getEpisodeScript") getEpisodeScriptWithResources(req, res);
  // 스크립트의 이미지 리소스 데이터 조회
  else if (func === "getImageResourceData") getImageResourceData(req, res);
  else if (func === "getEmoticonResourceData")
    getEmoticonResourceData(req, res);
  else if (func === "selectLobbyProjectList") selectLobbyProjectList(req, res);
  else if (func === "getCharacterModel") getCharacterModel(req, res);
  else if (func === "loginClient") loginClient(req, res);
  else if (func === "getUserSelectedStory") getUserSelectedStory(req, res);
  else if (func === "clearUserEpisodeSceneHistory")
    clearUserEpisodeSceneProgress(req, res);
  else if (func === "updateUserEpisodeSceneHistory")
    insertUserEpisodeSceneHistory(req, res);
  else if (func === "updateUserEpisodeSceneRecord")
    updateUserSceneRecord(req, res);
  else if (func === "getEpisodeDownloadResources")
    getEpisodeDownloadResources(req, res);
  else if (func === "getEpisodeSceneIds") getEpisodeSceneIds(req, res);
  else if (func === "deleteUserEpisodeSceneHistory")
    deleteUserEpisodeSceneProgress(req, res);
  else if (func === "insertUserProjectDressProgress")
    insertUserProjectDressProgress(req, res);
  else if (func === "updateUserIllustHistory")
    updateUserIllustHistory(req, res);
  else if (func === "updateUserMissionHistory")
    updateUserMissionHistory(req, res);
  else if (func === "updateUserEpisodePlayRecord")
    updateUserEpisodePlayRecord(req, res);
  else if (func === "insertUserEpisodeStartRecord")
    insertUserEpisodeStartRecord(req, res);
  else if (func === "updateUserFavorHistory") updateUserFavorHistory(req, res);
  else if (func === "alignS3Objects") alignS3Objects(req, res);
  else if (func === "changeAccountByGamebase")
    changeAccountByGamebase(req, res);
  else if (func === "resetUserEpisodeProgress")
    resetUserEpisodeProgress(req, res);
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
  else if (func === "getProjectAllEmoticon") getProjectAllEmoticon(req, res);
  else if (func === "getUserEndingList") getUserEndingList(req, res);
  else if (func === "updateUserMinicutHistory")
    updateUserMinicutHistory(req, res);
  else if (func === "getGalleryBannerInfo") getGalleryBannerInfo(req, res);
  //
  else if (func === "mainLoadingImageRandom")
    getMainLoadingImageRandom(req, res);
  else if (func === "updateUserScriptMission")
    updateUserScriptMission(req, res);
  else if (func === "getUserMissionList") userMissionList(req, res);
  else if (func === "getUserMisionReward") userMisionReceive(req, res);
  else if (func === "getServerInfo") getServerInfo(req, res);
  else if (func === "getLocallizingList") getLocallizingList(req, res);
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
  else if (func === "getServerInfo") getServerInfo(req, res);
  else if (func === "getAllProductList") getAllProductList(req, res);
  else if (func === "getUserPurchaseList") getUserPurchaseList(req, res);
  else if (func === "getUserRawPurchaseList") getUserRawPurchaseList(req, res);
  else if (func === "userPurchase") userPurchase(req, res);
  else if (func === "updateTutorialStep") updateTutorialStep(req, res);
  else if (func === "updateTutorialSelection")
    updateTutorialSelection(req, res);
  else if (func === "getUserPropertyHistory") getUserPropertyHistory(req, res);
  else if (func === "getAppCommonResources") getAppCommonResources(req, res);
  else if (func === "useCoupon") useCoupon(req, res);
  else if (func === "getUserOneTimeProperty") getUserOneTimeProperty(req, res);
  else if (func === "purchaseFreepass") purchaseFreepass(req, res);
  else if (func === "getClientNoticeList") getClientNoticeList(req, res);
  else if (func === "reportRequestError") reportRequestError(req, res);
  else if (func === "updateWithdrawDate") updateWithdrawDate(req, res);
  else if (func === "getProjectCreditList") getProjectCreditList(req, res);
  else if (func === "checkUserIdValidation") checkUserIdValidation(req, res);
  else if (func === "makeInsertQuery") makeInsertQuery(req, res);
  else if (func === "makeCopyInsert") makeCopyInsert(req, res);
  else if (func === "concatColumns") concatColumns(req, res);
  else if (func === "UnlockUserAllGalleryImage")
    UnlockUserAllGalleryImage(req, res);
  else if (func === "getUserBankInfoWithResponse")
    getUserBankInfoWithResponse(req, res);
  else if (func === "PrepareMissionData") PrepareMissionData(req, res);
  else if (func === "nestedQuery") nestedQuery(req, res);
  else if (func === "failResponse") failResponse(req, res);
  else if (func === "getProjectEpisodeProgressCount")
    getProjectEpisodeProgressCount(req, res);
  else if (func === "requestFreeCharge") requestFreeCharge(req, res);
  else if (func === "requestExchangeOneTimeTicketWithCoin")
    requestExchangeOneTimeTicketWithCoin(req, res);
  else if (func === "requestPromotionList") getPromotionList(req, res);
  else if (func === "userCoinPurchase") userCoinPurchase(req, res);
  else if (func === "updateUserSelectionCurrent")
    updateUserSelectionCurrent(req, res);
  // 선택지 업데이트
  else if (func === "getTop3SelectionList") getTop3SelectionList(req, res);
  // 선택지 로그 리스트
  else if (func === "getEndingSelectionList") getEndingSelectionList(req, res);
  // 엔딩 선택지 로그 리스트
  else if (func === "getDistinctProjectGenre")
    getDistinctProjectGenre(req, res);
  //작품 장르
  else if (func === "getServerMasterInfo") getServerMasterInfo(req, res);
  // 서버 마스터 정보 및 광고 기준정보
  else if (func === "updateUserMinicutHistoryVer2")
    updateUserMinicutHistoryVer2(req, res);
  else if (func === "getIfYouProjectList") getIfYouProjectList(req, res);
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
  else if (func === "updateUserLevelProcess") updateUserLevelProcess(req, res);
  // 레벨업 처리
  else if (func === "getLevelList") getLevelList(req, res);
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
  else if (func === "requestEpisodeFirstClearReward")
    requestEpisodeFirstClearReward(req, res);
  else if (func === "getAttendanceList") attendanceList(req, res);
  //출석 보상 리스트
  else if (func === "sendAttendanceReward") sendAttendanceReward(req, res);
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
  else if (func === "requestRemoveCurrentAD") requestRemoveCurrentAD(req, res);
  else if (func === "resetPlayingEpisode") resetPlayingEpisode(req, res);
  //과금 선택지 구매
  else if (func === "getSelectionCurrent") getSelectionCurrent(req, res);
  //현재 선택지
  else if (func === "requestUserTutorialProgress")
    requestUserTutorialProgress(req, res);
  else if (func === "getPlatformEvents") getPlatformEvents(req, res);
  else if (func === "requestGalleryShareBonus")
    requestGalleryShareBonus(req, res);
  else if (func === "getUserStoryProfileAndAbility")
    getUserStoryProfileAndAbility(req, res);
  else if (func === "requestGalleryLobbyOpen")
    requestGalleryLobbyOpen(req, res);
  //단계별 튜토리얼 처리
  else if (func === "requestTotalCoinShop")
    requestTotalCoinShop(req, res); 
  //토탈 코인 상점 화면 
  else if (func === "setProjectProgressOrder")
    setProjectProgressOrder(req, res);
  //에피 진행 순서 누적
  else {
    //  res.status(400).send(`Wrong Func : ${func}`);
    logger.error(`clientHome Error ${func}`);
    respondDB(res, 80033, func);
  }
};
