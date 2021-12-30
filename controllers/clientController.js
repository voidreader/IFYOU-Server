/* eslint-disable no-restricted-syntax */
import { restart } from "nodemon";
import { DB, logAction } from "../mysqldb";
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
  getProfileCurrencyCurrent,
  updateUserMinicutHistoryVer2,
} from "./accountController";
import { logger } from "../logger";
import {
  alignS3Object,
  getServerInfo,
  getLocallizingList,
  getClientLocalizingList,
  getAppCommonResources,
  getServerMasterInfo,
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
  updateUserSelectionCurrent,
  getTop3SelectionList,
  getEndingSelectionList,
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
import {
  applyPrize,
  checkUserIdValidation,
  getClientPrizeTicketList,
  getClientUserPrizeHistory,
  userAddressList,
  deleteAddress,
  insertOrUpdateAddress,
  addressDetail,
} from "./prizeController";
import { getProjectEpisodeProgressCount } from "./statController";
import { userProfileSave } from "./profileController";
import {
  userCoinPurchase,
  getCoinProductMainList,
  getCoinProductSearch,
  getCoinProductSearchDetail,
  coinProductSearchDelete,
  getCoinProductTypeList,
  coinProductDetail,
} from "./coinController";

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
    userInfo.project_id,
    userInfo.episode_id,
  ]);
  // 이미지
  const image = await DB(Q_SCRIPT_RESOURCE_IMAGE, [
    userInfo.project_id,
    userInfo.episode_id,
  ]);
  // 일러스트
  const illust = await DB(Q_SCRIPT_RESOURCE_ILLUST, [
    userInfo.project_id,
    userInfo.episode_id,
  ]);
  // 이모티콘
  const emoticon = await DB(Q_SCRIPT_RESOURCE_EMOTICON, [
    userInfo.project_id,
    userInfo.episode_id,
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
       , fn_get_localize_text(ls.text_id, 'KO') origin_name
    FROM list_project_genre genre
      , list_project_master ma
      , list_standard ls 
  WHERE ma.project_id = genre.project_id
    AND ma.is_public > 0
    AND ls.standard_class = 'genre'
    AND ls.code = genre.genre_code 
    AND ma.service_package LIKE CONCAT('%', ?, '%')
  ;`,
    [lang, build]
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
  `;

  const result = await DB(`${query} ORDER BY a.sortkey;`, [build, country]);
  if (!result.state) {
    logger.error(`selectLobbyProjectList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

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
    SELECT 
    ifnull(fn_get_design_info(image_id, 'url'), '') image_url 
    , ifnull(fn_get_design_info(image_id, 'key'), '') image_key
    FROM list_main_loading a
    WHERE lang = 'KO' 
    AND sysdate() BETWEEN start_date AND end_date
    AND is_public = 1 
    AND image_id in(SELECT design_id FROM list_design WHERE design_id = a.image_id AND design_type = 'main_loading');
  `
  );

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

// 현재 계정의 gamebase ID 정보를 업데이트
// 최초 연동때 사용한다.
const updateAccountWithGamebaseID = async (req, res) => {
  const {
    body: { userkey, gamebaseID },
  } = req;

  const result = await DB(
    `
  UPDATE table_account 
   SET gamebaseid = ?
   WHERE userkey = ?;
  `,
    [gamebaseID, userkey]
  );

  if (result.error) {
    logger.error(result.error);
    res.status(400);
    return;
  }

  res.status(200).send("ok");
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
  else if (func === "applyPrize") applyPrize(req, res);
  else if (func === "concatColumns") concatColumns(req, res);
  else if (func === "UnlockUserAllGalleryImage")
    UnlockUserAllGalleryImage(req, res);
  else if (func === "getClientUserPrizeHistory")
    getClientUserPrizeHistory(req, res);
  else if (func === "getClientPrizeTicketList")
    getClientPrizeTicketList(req, res);
  else if (func === "addressDetail") addressDetail(req, res);
  else if (func === "userAddressList") userAddressList(req, res);
  else if (func === "deleteAddress") deleteAddress(req, res);
  else if (func === "insertAddress") insertOrUpdateAddress(req, res);
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
  else {
    //  res.status(400).send(`Wrong Func : ${func}`);
    logger.error(`clientHome Error`);
    respondDB(res, 80033, func);
  }
};
