/* eslint-disable prefer-destructuring */
/* eslint-disable no-plusplus */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { response } from "express";
import { DB, logAction, logDB, slaveDB, transactionDB } from "../mysqldb";
import {
  Q_SELECT_PROJECT_MODEL_ALL_FILES,
  Q_SELECT_PROJECT_LIVE_OBJECT_ALL_FILES,
  Q_SELECT_PROJECT_LIVE_ILLUST_ALL_FILES,
  Q_SELECT_PROJECT_BGM,
  Q_SELECT_PROJECT_NAME_TAG,
  Q_SELECT_PROJECT_DETAIL,
  Q_SELECT_OTOME_ITEM,
  Q_SELECT_OTOME_USER_DRESS,
} from "../QStore";

import {
  Q_SELECT_PROJECT_ALL_ILLUST,
  Q_SELECT_PROJECT_DRESS_CODE,
  Q_SELECT_USER_ILLUST_HISTORY,
  Q_UPDATE_USER_ILLUST_HISTORY,
  Q_USER_EPISODE_SCENE_CLEAR,
  Q_USER_EPISODE_SCENE_PROGRESS,
  UQ_ACCQUIRE_CURRENCY,
  UQ_USE_CURRENCY,
  Q_SELECT_USER_MISSION_HISTORY,
  Q_SELECT_PROJECT_ALL_MINICUT,
  Q_SELECT_EPISODE_LOADING,
  Q_SELECT_SCENE_HISTORY,
  Q_SELECT_EPISODE_PROGRESS,
  Q_SELECT_EPISODE_HISTORY,
  Q_SELECT_PROJECT_ALL_BG,
  Q_SELECT_PROJECT_ALL_EMOTICONS,
} from "../USERQStore";

import { logger } from "../logger";
import { checkMissionByDrop } from "./storyController";
import { respondDB, respondError } from "../respondent";
import {
  getUserProjectCurrent,
  getUserProjectSelectionProgress,
} from "../com/userProject";
import { getUserBankInfo, getCurrencyQuantity } from "./bankController";

import {
  getUserProjectAbilityCurrent,
  createQueryResetAbility,
  getUserStoryAbilityRawList,
} from "./abilityController";
import { cache } from "../init";

dotenv.config();

let { CURRENT_UPDATE } = process.env;
if (!CURRENT_UPDATE) CURRENT_UPDATE = 0;

////////// ! 재화 소모와 획득에 대한 처리 부분

// * 유저 재화 입력
const addUserProperty = async (userkey, currency, quantity, pathCode) => {
  const result = await DB(UQ_ACCQUIRE_CURRENCY, [
    userkey,
    currency,
    quantity,
    pathCode,
  ]);

  if (!result.state) {
    logger.error(result.error);
  }
};

// * 유저가 프로젝트의 프리패스를 가지고 있는지 체크.
export const checkUserHasProjectFreepass = async (userkey, project_id) => {
  const result = await DB(`
   SELECT fn_get_user_property(${userkey}, fn_get_project_freepass(${project_id})) freepass
    FROM DUAL;
   `);

  if (result.row > 0 && result.row[0].freepass > 0) return true;
  else return false;
};

// ? /////////////////////////////////////////////////////////////////////////////////////////////////

// 유저 에피소드 상황 History
export const getUserEpisodeSceneProgress = async (userInfo) => {
  const result = await DB(Q_USER_EPISODE_SCENE_PROGRESS, [
    userInfo.userkey,
    userInfo.project_id,
  ]);

  if (!result.state) {
    logger.error(`getUserEpisodeSceneProgress Error ${result.error}`);
    return [];
  }

  // console.log(result);

  const scenes = [];

  result.row.forEach((item) => {
    scenes.push(item.scene_id);
  });

  // console.log(scenes);

  return scenes;
};

// 선택한 에피소드의 사건ID 진행도 초기화
export const clearUserEpisodeSceneProgress = async (req, res) => {
  const userInfo = req.body;

  logger.info(`clearUserEpisodeSceneProgress [${JSON.stringify(userInfo)}]`);

  // 에피소드 ID 없는 경우 받아오기.
  if (!userInfo.episode_id || userInfo.episode_id === "") {
    logger.error(
      `clearUserEpisodeSceneProgress empty episode_id ${JSON.stringify(
        userInfo
      )}`
    );
    const projectCurrent = await getUserProjectCurrent(userInfo);
    if (projectCurrent && projectCurrent.length > 0) {
      userInfo.episode_id = projectCurrent[0].episode_id;
    }
  }

  const result = await DB(Q_USER_EPISODE_SCENE_CLEAR, [
    userInfo.userkey,
    userInfo.episode_id,
  ]);

  if (!result.state) {
    logger.error(`clearUserEpisodeSceneProgress Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const list = await getUserEpisodeSceneProgress(userInfo);
  res.status(200).json(list);
};

// 앱에서 사용되는 메인 에피소드 리스트
export const requestMainEpisodeList = async (userInfo) => {
  // 유저의 메인 에피소드 리스트
  const regularEpisodes = await DB(`
  SELECT a.episode_id 
  , a.project_id 
  , a.episode_type
  , TRIM(fn_get_episode_title_lang(a.episode_id, '${userInfo.lang}')) title 
  , a.episode_status 
  , a.currency
  , a.price 
  , a.ending_type 
  , a.depend_episode
  , TRIM(fn_get_episode_title_lang(a.depend_episode, '${userInfo.lang}')) depend_episode_title
  , a.unlock_style 
  , ifnull(a.unlock_episodes, '') unlock_episodes
  , ifnull(a.unlock_scenes, '') unlock_scenes 
  , a.unlock_coupon 
  , a.sale_price
  , a.one_currency
  , a.one_price
  , a.first_reward_currency
  , a.first_reward_quantity
  , a.sortkey 
  , a.chapter_number
  , 0 in_progress
  , 0 in_history
  , 0 total_scene_count
  , 0 played_scene_count
  , fn_get_design_info(a.popup_image_id, 'url') popup_image_url
  , fn_get_design_info(a.popup_image_id, 'key') popup_image_key
  , TRIM(fn_get_episode_summary_lang(a.episode_id, '${userInfo.lang}')) summary
  , CASE WHEN a.episode_type = 'ending' THEN fn_check_user_ending(${userInfo.userkey}, a.episode_id) 
         ELSE 0 END ending_open
  , a.next_open_min
  , ifnull(ueh.episode_id, 0) is_clear
  , ifnull(a.speaker, '') speaker
  , a.dlc_id
FROM list_episode a
LEFT OUTER JOIN user_episode_hist ueh ON ueh.userkey = ${userInfo.userkey} AND ueh.project_id = a.project_id AND ueh.episode_id = a.episode_id
WHERE a.project_id = ${userInfo.project_id}
  AND a.dlc_id = -1
  AND a.episode_type IN ('chapter', 'ending')
ORDER BY a.episode_type, a.chapter_number, a.episode_id;  
`);

  const mainEpisodes = []; // 메인 에피소드

  const endingEpisodes = []; // 엔딩
  const sides = []; // 사이드 (임시)
  const organized = []; // 정렬된

  // 에피소드 type에 따라서 각 배열로 따로 정리
  regularEpisodes.row.forEach((element) => {
    // 에피소드 형태별 수집하기
    if (element.episode_type === "chapter") {
      mainEpisodes.push(element);
    } else if (element.episode_type === "ending") {
      element.indexed_title = `[엔딩] ${element.title}`;
      endingEpisodes.push(element);
    } else if (element.episode_type === "side") {
      element.indexed_title = `[사이드] ${element.title}`;
      sides.push(element);
    }
  }); // 분류 끝.

  /*
  logger.info(
    `Each Episodes Count [${mainEpisodes.length}] / [${endingEpisodes.length}]`
  );
  */

  let mainIndex = 1;
  // 정규 에피소드부터 쌓기 시작한다.
  // title은 그대로 두고 색인 타이틀 indexed_title 을 추가한다.
  mainEpisodes.forEach((item) => {
    item.indexed_title = `[${mainIndex}] ${item.title}`;
    item.episode_no = mainIndex;
    mainIndex += 1;

    organized.push(item);

    // ending쪽에서 연결된거 찾는다. (리스트 순서 떄문에!)
    endingEpisodes.forEach((ending) => {
      if (ending.depend_episode === item.episode_id) organized.push(ending);
    });
  }); // 메인과 연결된 엔딩 집어넣기.

  // 연결되지 않은 엔딩 집어넣기
  endingEpisodes.forEach((item) => {
    if (item.depend_episode < 0) {
      item.indexed_title = `[X]${item.title}`;
      // 연결되지 않은 것만
      organized.push(item);
    }
  });

  // 사이드 에피소드 임시로 집어넣기
  sides.forEach((item) => {
    organized.push(item);
  });

  return organized;
};

const initBubbleSetObject = () => {
  const bubbleSet = {};
  // 말풍선 세트 초기화
  bubbleSet.talk = {}; // 대화
  bubbleSet.whisper = {}; // 속삭임
  bubbleSet.feeling = {}; // 속마음
  bubbleSet.yell = {}; // 외침
  bubbleSet.monologue = {}; // 독백
  bubbleSet.speech = {}; // 중요대사

  // 템플릿 별로 variation 초기화.
  // 템플릿 2종 추가됨! 2021.06.29
  bubbleSet.talk.normal = [];
  bubbleSet.talk.emoticon = [];
  bubbleSet.talk.reverse_emoticon = [];
  bubbleSet.talk.double = [];

  bubbleSet.whisper.normal = [];
  bubbleSet.whisper.emoticon = [];
  bubbleSet.whisper.reverse_emoticon = [];
  bubbleSet.whisper.double = [];

  bubbleSet.feeling.normal = [];
  bubbleSet.feeling.emoticon = [];
  bubbleSet.feeling.reverse_emoticon = [];
  bubbleSet.feeling.double = [];

  bubbleSet.yell.normal = [];
  bubbleSet.yell.emoticon = [];
  bubbleSet.yell.reverse_emoticon = [];
  bubbleSet.yell.double = [];

  bubbleSet.monologue.normal = [];
  bubbleSet.monologue.emoticon = [];
  bubbleSet.monologue.reverse_emoticon = [];
  bubbleSet.monologue.double = [];

  bubbleSet.speech.normal = [];
  bubbleSet.speech.emoticon = [];
  bubbleSet.speech.reverse_emoticon = [];
  bubbleSet.speech.double = [];

  return bubbleSet;
};

// * 갤러리에 들어가는 공개된, 미니컷, 일러스트, 라이브 오브제, 라이브 일러스트 리스트 조회
export const getUserGalleryHistory = async (userInfo) => {
  // 공개된 이미지들.
  const publicImages = await DB(
    `
  
    SELECT z.illust_type
    , z.illust_id
    , z.illust_name
    , z.thumbnail_url
    , z.thumbnail_key
    , ifnull(z.public_name, z.illust_name) public_name
    , ifnull(z.summary, '입력되지 않았음') summary
    , CASE WHEN z.is_minicut = 0 THEN fn_check_user_illust_exists(${userInfo.userkey}, z.origin_type, z.illust_id)
          ELSE fn_check_user_minicut_exists_new(${userInfo.userkey}, z.origin_type, z.illust_id) END illust_open
    , CASE WHEN z.is_minicut = 0 THEN fn_check_gallery_share_bonus(${userInfo.userkey}, 'illust', z.origin_type, z.illust_id)
          ELSE fn_check_gallery_share_bonus(${userInfo.userkey}, 'minicut', z.origin_type, z.illust_id) END share_bonus
    , CASE WHEN z.is_minicut = 0 THEN fn_check_gallery_real_open(${userInfo.userkey}, 'illust', z.origin_type, z.illust_id)
          ELSE fn_check_gallery_real_open(${userInfo.userkey}, 'minicut', z.origin_type, z.illust_id) END gallery_open
    , z.is_public
    , z.image_url
    , z.image_key
    , z.appear_episode
    , fn_get_episode_type(z.appear_episode) appear_episode_type
    , z.live_pair_id
    , ifnull(z.speaker, '') speaker
    , le.dlc_id
  FROM (
      SELECT 'illust' illust_type
        , li.illust_id illust_id
        , li.image_name  illust_name
        , fn_get_design_info(li.thumbnail_id, 'url') thumbnail_url
        , fn_get_design_info(li.thumbnail_id, 'key') thumbnail_key
        , fn_get_illust_localized_text(li.illust_id, 'illust', '${userInfo.lang}', 'name') public_name
        , fn_get_illust_localized_text(li.illust_id, 'illust', '${userInfo.lang}', 'summary') summary
        , 0 is_minicut
        , li.is_public
        , li.image_url
        , li.image_key
        , li.appear_episode
        , li.live_pair_id
        , li.speaker
        , 'illust' origin_type
      FROM list_illust li
      WHERE li.project_id = ${userInfo.project_id}
      AND li.is_public > 0
      AND li.appear_episode > 0
      UNION ALL
      SELECT 'live_illust' illust_type
      , lli.live_illust_id  illust_id
      , lli.live_illust_name  illust_name
      , fn_get_design_info(lli.thumbnail_id, 'url') thumbnail_url
      , fn_get_design_info(lli.thumbnail_id, 'key') thumbnail_key
      , fn_get_illust_localized_text(lli.live_illust_id , 'live2d', '${userInfo.lang}', 'name') public_name
      , fn_get_illust_localized_text(lli.live_illust_id, 'live2d', '${userInfo.lang}', 'summary') summary    
      , 0 is_minicut
      , lli.is_public
      , '' image_url
      , '' image_key
      , lli.appear_episode
      , -1 live_pair_id
      , lli.speaker
      , 'live2d' origin_type
      FROM list_live_illust lli
      WHERE lli.project_id = ${userInfo.project_id}
      AND lli.is_public > 0
      AND lli.appear_episode > 0
      UNION ALL 
      SELECT 'live_object' illust_type
      , a.live_object_id  illust_id
      , a.live_object_name  illust_name
      , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
      , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
      , fn_get_minicut_localized_text(a.live_object_id, 'live2d', '${userInfo.lang}', 'name') public_name
      , fn_get_minicut_localized_text(a.live_object_id, 'live2d', '${userInfo.lang}', 'summary') summary
      , 1 is_minicut
      , a.is_public
      , '' image_url
      , '' image_key
      , a.appear_episode
      , -1 live_pair_id
      , a.speaker
      , 'live2d' origin_type
      FROM list_live_object a 
      WHERE a.project_id = ${userInfo.project_id}
      AND a.is_public > 0
      AND a.appear_episode > 0
      UNION ALL
      SELECT 'minicut' illust_type
      , a.minicut_id  illust_id
      , a.image_name  illust_name
      , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
      , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
      , fn_get_minicut_localized_text(a.minicut_id, 'minicut', '${userInfo.lang}', 'name') public_name
      , fn_get_minicut_localized_text(a.minicut_id, 'minicut', '${userInfo.lang}', 'summary') summary
      , 1 is_minicut
      , a.is_public
      , a.image_url
      , a.image_key
      , a.appear_episode
      , a.live_pair_id
      , a.speaker
      , 'minicut' origin_type
      FROM list_minicut a 
      WHERE a.project_id = ${userInfo.project_id}
      AND a.appear_episode > 0
      AND a.is_public > 0
  ) z, list_episode le 
  WHERE z.appear_episode = le.episode_id
  ORDER BY le.dlc_id, le.sortkey, z.illust_name;  
  `
  );

  const images = publicImages.row;

  // console.log("!!! gallery total images count : ", images.length);

  // * illust_type이 illust, minicut인 경우 live_pair_id가 존재하는 경우
  // * live개체 오픈 이력 있음 => illust or minicut 제거
  // * live개체의 오픈 이력이 없음 => live 개체를 목록에서 제거
  // 체크 시작한다.
  images.forEach((item) => {
    if (!Object.prototype.hasOwnProperty.call(item, "valid")) {
      item.valid = 1;
    }

    // 미니컷, 일러스트 타입이면서 live 페어 정보가 있다.
    if (item.illust_type === "minicut" && item.live_pair_id > 0) {
      // 대상 live_pair_id의 오픈 이력이 있는 체크한다.
      for (let i = 0; i < images.length; i++) {
        // live2d, is_minicut
        if (
          images[i].illust_type === "live_object" &&
          item.live_pair_id === images[i].illust_id
        ) {
          // 오픈 여부 체크
          if (images[i].illust_open > 0) {
            // 라이브 개체의 오픈이력이 있다.
            item.valid = 0;
            images[i].valid = 1;
          } else {
            // 라이브 개체의 오픈 이력이 없다.
            item.valid = 1;
            images[i].valid = 0;
          }
          break;
        }
      }
    } // ? end minicut check
    else if (item.illust_type === "illust" && item.live_pair_id > 0) {
      // * 일러스트 시작
      for (let i = 0; i < images.length; i++) {
        // live2d, 미니컷 아님.
        if (
          images[i].illust_type === "live_illust" &&
          item.live_pair_id === images[i].illust_id
        ) {
          // 오픈 여부 체크
          if (images[i].illust_open > 0) {
            // 라이브 개체의 오픈이력이 있다.
            item.valid = 0;
            images[i].valid = 1;
          } else {
            // 라이브 개체의 오픈 이력이 없다.
            item.valid = 1;
            images[i].valid = 0;
          }
          break;
        }
      }
    } // ? end of illust check
  }); // ? end of foreach

  /*
  for (let i = 0; i < images.length; i++) {
    if (images[i].valid) finalResult.push(images[i]);
  }
  */

  // console.log("!!! gallery finalResult count : ", finalResult.length);
  return images;
}; // ? End getUserGalleryHistory

// * 갤러리 공유 보너스 요청
export const requestGalleryShareBonus = async (req, res) => {
  const {
    body: { userkey, illust_type, illust_id, project_id, lang = "KO" },
  } = req;

  logger.info(`requestGalleryShareBonus : ${JSON.stringify(req.body)}`);

  // illust, minicut, live_object, live_illust

  let query = "";
  let image_type = illust_type;

  if (illust_type === "live_object" || illust_type === "live_illust")
    image_type = "live2d";

  // * 미니컷과 일러스트가 서로 다른 테이블을 사용한다
  if (illust_type === "minicut" || illust_type === "live_object") {
    //
    // user_minicut
    query = mysql.format(
      `
    UPDATE user_minicut 
      SET share_bonus = 1 
    WHERE userkey = ?
      AND minicut_type = ?
      AND minicut_id = ?;
    `,
      [userkey, image_type, illust_id]
    );
  } else {
    // user_illust
    query = mysql.format(
      `
    UPDATE user_illust 
      SET share_bonus = 1 
    WHERE userkey = ?
      AND illust_type = ?
      AND illust_id = ?;
    `,
      [userkey, image_type, illust_id]
    );
  }

  // 재화 획득
  query += mysql.format(UQ_ACCQUIRE_CURRENCY, [userkey, "gem", 1, "share"]);

  const result = await transactionDB(query);

  if (!result.state) {
    logger.error(`requestGalleryShareBonus : ${JSON.stringify(result.error)}`);
    res.status(400).json(result.error);
    return;
  }

  const responseData = {};
  responseData.currency = "gem"; // 받은 보상 정보
  responseData.quantity = 1;
  responseData.bank = await getUserBankInfo(req.body);
  responseData.galleryImages = await getUserGalleryHistory(req.body);

  console.log("done share bonus");
  res.status(200).json(responseData);
};

// * 갤러리 로비에서 일러스트를 오픈했다!
export const requestGalleryLobbyOpen = async (req, res) => {
  const {
    body: { userkey, illust_type, illust_id, project_id, lang = "KO" },
  } = req;

  logger.info(`requestGalleryLobbyOpen : ${JSON.stringify(req.body)}`);

  let query = "";
  let image_type = illust_type;

  if (illust_type === "live_object" || illust_type === "live_illust")
    image_type = "live2d";

  // * 미니컷과 일러스트가 서로 다른 테이블을 사용한다
  if (illust_type === "minicut" || illust_type === "live_object") {
    //
    // user_minicut
    query = mysql.format(
      `
    UPDATE user_minicut 
      SET gallery_open = 1 
    WHERE userkey = ?
      AND minicut_type = ?
      AND minicut_id = ?;
    `,
      [userkey, image_type, illust_id]
    );
  } else {
    // user_illust
    query = mysql.format(
      `
    UPDATE user_illust 
      SET gallery_open = 1 
    WHERE userkey = ?
      AND illust_type = ?
      AND illust_id = ?;
    `,
      [userkey, image_type, illust_id]
    );
  }

  const result = await DB(query);

  if (!result.state) {
    logger.error(`requestGalleryLobbyOpen : ${JSON.stringify(result.error)}`);
    res.status(400).json(result.error);
    return;
  }

  const responseData = {};
  responseData.galleryImages = await getUserGalleryHistory(req.body);
  res.status(200).json(responseData);
}; // ? END OF requestGalleryLobbyOpen

// 유저, 프로젝트에서 경험한 모든 사건ID 목록 (삭제나 수정되지 않음)
export const getUserProjectSceneHistory = async (userInfo) => {
  const result = await DB(
    `
  SELECT hist.scene_id
    FROM user_scene_hist hist
   WHERE hist.userkey = ?
    AND hist.project_id = ?
    ;
  `,
    [userInfo.userkey, userInfo.project_id]
  );

  const scenes = [];

  if (result.state) {
    result.row.forEach((item) => {
      scenes.push(item.scene_id);
    });

    return scenes;
  } else return [];
};

// 유저 에피소드 진행도 조회
export const getUserEpisodeProgress = async (userInfo) => {
  const result = await DB(
    `SELECT a.episode_id
  FROM user_episode_progress a 
 WHERE a.userkey = ?
   AND a.project_id = ?
 ORDER BY open_date DESC;`,
    [userInfo.userkey, userInfo.project_id]
  );

  if (result.state) {
    // 배열로 리턴
    const rValue = [];
    result.row.forEach((item) => {
      rValue.push(item.episode_id);
    });

    return rValue;
  } else return [];
};

// 유저 에피소드 플레이 히스토리
export const getUserEpisodeHistory = async (userInfo) => {
  const result = await DB(
    `SELECT a.episode_id
  FROM user_episode_hist a 
 WHERE a.userkey = ?
   AND a.project_id = ?
 ORDER BY first_play DESC;`,
    [userInfo.userkey, userInfo.project_id]
  );

  if (result.state) {
    // 배열로 리턴
    const rValue = [];
    result.row.forEach((item) => {
      rValue.push(item.episode_id);
    });

    return rValue;
  } else return [];
};

///////////////
///////////////

// 에피소드 첫 클리어 보상 가져오기
const getEpisodeFisrtClearReward = async (userkey, episodeID) => {
  const existsCheck = await DB(`
  SELECT EXISTS (SELECT z.userkey FROM user_episode_hist z WHERE z.userkey = ${userkey} AND z.episode_id = ${episodeID}) is_exists 
  FROM dual;  
  `);

  // 이미 히스토리에 있으면 보상 없다.
  if (existsCheck.row[0].is_exists > 0) return [];

  // 없으면, 첫클리어 보상 정보 가져오기
  // 재화의 아이콘 URL 추가
  const rewardResult = await slaveDB(`
  SELECT le.first_reward_currency currency
       , le.first_reward_quantity quantity
       , fn_get_design_info(cc.icon_image_id, 'url') icon_url
       , fn_get_design_info(cc.icon_image_id, 'key') icon_key
       , le.first_reward_exp
  FROM list_episode le 
     , com_currency cc 
  WHERE episode_id = ${episodeID}
    AND cc.currency = le.first_reward_currency;  
    `);

  // 없을리가 없는데 일치하는 에피소드 없으면..  오류 기록은 남긴다.
  if (!rewardResult.state || rewardResult.row === 0) {
    logger.error(
      `Wrong episode ID in getEpisodeFisrtClearReward [${episodeID}]`
    );
    return [];
  }

  return rewardResult.row;
};

/////////////////////////////////////////////////////////////////////

// 말풍선 세트 재배열
export const arrangeBubbleSet = (allBubbleSet) => {
  const bubbleSet = initBubbleSetObject(); // 말풍선 초기화

  // 말풍선 세트는 복잡하니까 분할해서 처리
  // 대분류를 template으로 변경해서 정리합니다.
  allBubbleSet.forEach((item) => {
    switch (item.template) {
      case "talk": // 대화
        if (item.variation === "normal") bubbleSet.talk.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.talk.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.talk.reverse_emoticon.push(item);
        else if (item.variation === "double") bubbleSet.talk.double.push(item);
        break;

      case "whisper": // 속삭임
        if (item.variation === "normal") bubbleSet.whisper.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.whisper.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.whisper.reverse_emoticon.push(item);
        else if (item.variation === "double")
          bubbleSet.whisper.double.push(item);
        break;

      case "feeling": // 속마음
        if (item.variation === "normal") bubbleSet.feeling.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.feeling.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.feeling.reverse_emoticon.push(item);
        else if (item.variation === "double")
          bubbleSet.feeling.double.push(item);
        break;

      case "yell": // 외침
        if (item.variation === "normal") bubbleSet.yell.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.yell.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.yell.reverse_emoticon.push(item);
        else if (item.variation === "double") bubbleSet.yell.double.push(item);
        break;

      case "monologue": // 독백
        if (item.variation === "normal") bubbleSet.monologue.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.monologue.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.monologue.reverse_emoticon.push(item);
        else if (item.variation === "double")
          bubbleSet.monologue.double.push(item);
        break;

      case "speech": // 중요대사
        if (item.variation === "normal") bubbleSet.speech.normal.push(item);
        else if (item.variation === "emoticon")
          bubbleSet.speech.emoticon.push(item);
        else if (item.variation === "reverse_emoticon")
          bubbleSet.speech.reverse_emoticon.push(item);
        else if (item.variation === "double")
          bubbleSet.speech.double.push(item);
        break;

      default:
        break;
    }
  }); // end of forEach

  return bubbleSet;
};

// 현재 튜토리얼 정보
const getUserTutorialCurrent = async (userInfo) => {
  const result = await DB(
    `
  SELECT 
  ifnull(step, 0) tutorial_step 
  , ifnull(is_clear, 0) tutorial_clear
  FROM user_tutorial_ver2 
  WHERE userkey = ? 
  ORDER BY step DESC 
  LIMIT 1; 
  `,
    [userInfo.userkey]
  );

  return result.row;
};

// * 유저 소모성 재화의 사용 처리
export const consumeUserCurrency = async (req, res) => {
  const {
    body: { userkey, quantity, currency, reason = `none` },
  } = req;

  // ! reason은 사용 코드 : consume_code

  logger.info(`consumeUserCurrency [${JSON.stringify(req.body)}]`);
  const responseData = {}; // 응답 데이터

  // 사용할 재화에 대한 수량을 체크한다.
  const currentQuantity = await getCurrencyQuantity(userkey, currency);
  // 소모하려는 개수가 보유한 개수보다 많을때.
  if (currentQuantity < currency) {
    logger.error(`consumeUserCurrency Error not enough currnecy`);
    respondDB(res, 80031, "not enough your property");
  } else {
    // 소모 처리
    const consumeResult = await (UQ_USE_CURRENCY,
    [userkey, currency, quantity, reason, -1]);

    // DB ERROR
    if (!consumeResult.state) {
      logger.error(`consumeUserCurrency Error ${consumeResult.error}`);
      respondDB(res, 80026, consumeResult.error);
      return;
    }

    // * 재화 갱신 및 응답
    responseData.currency = currency; // 사용한 재화
    responseData.currentQuantity = await getCurrencyQuantity(userkey, currency); // 개수
    res.status(200).json(responseData);

    logAction(userkey, "consume_currency", req.body);
  }
}; // * end of 유저 소모성 재화 소모 처리

// * 유저 소모성 재화의 획득 처리
export const accquireUserConsumableCurrency = async (req, res) => {
  const {
    body: { userkey, quantity, currency, reason = `none` },
  } = req;

  logger.info(`accquireUserConsumableCurrency [${JSON.stringify(req.body)}]`);
  const responseData = {}; // 응답 데이터

  // ! reason은 획득 코드 : accquire_code
  const accquireResult = await DB(UQ_ACCQUIRE_CURRENCY, [
    userkey,
    currency,
    quantity,
    reason,
  ]);

  if (!accquireResult.state) {
    logger.error(
      `accquireUserConsumableCurrency Error ${accquireResult.error}`
    );
    respondDB(res, 80026, accquireResult.error);
  } else {
    // * 재화 갱신 및 응답
    responseData.currency = currency; // 사용한 재화
    responseData.currentQuantity = await getCurrencyQuantity(userkey, currency); // 개수
    res.status(200).json(responseData);

    logAction(userkey, "accuire_currency", req.body);
  }
};

// ! 재화 소모와 획득에 대한 처리 끝! //////////////////////

// * 2022.07.26 신규  유저 작품별 사건ID 기록 업데이트
export const updateUserProjectSceneHist = async (req, res) => {
  const {
    body: { userkey, project_id, episode_id, scene_id },
  } = req;

  logger.info(`updateUserProjectSceneHist : ${JSON.stringify(req.body)}`);

  // user_scene_progress, user_scene_hist에 데이터 입력
  let currentQuery = ``;
  currentQuery += `INSERT IGNORE INTO user_scene_progress (userkey, project_id, episode_id, scene_id) VALUES (${userkey}, ${project_id}, ${episode_id}, '${scene_id}');`;
  currentQuery += `INSERT IGNORE INTO user_scene_hist (userkey, project_id, episode_id, scene_id) VALUES (${userkey}, ${project_id}, ${episode_id}, '${scene_id}');`;

  res.status(200).send("");

  // await 쓰지 않고 처리
  const result = await DB(currentQuery);
  if (!result.state) {
    logger.error(`updateUserProjectSceneHist Error ${result.error}`);
    respondDB(res, 80026, result.error);
  }
}; // ? end of updateUserProjectSceneHist

// * drop 미션 해금
export const updateUserScriptMission = async (req, res) => {
  const userInfo = req.body;
  logger.info(`updateUserScriptMission : ${JSON.stringify(userInfo)}`);

  //! 미션 해금 조회
  const result = await checkMissionByDrop(userInfo);

  res.status(200).json(result);
};

// * 에피소드 플레이 도중 처음으로 돌아가기 호출시 동작.
export const resetPlayingEpisode = async (req, res) => {
  logger.info(`resetPlayingEpisode [${JSON.stringify(req.body)}]`);

  const {
    body: { userkey, episode_id, project_id, dlc_id = -1 },
  } = req;

  //능력치 리셋 쿼리 가져오기
  const abilityResetQuery = await createQueryResetAbility({
    userkey,
    project_id,
    episode_id,
  });

  const resetResult = await transactionDB(
    `
  CALL sp_reset_user_episode_progress(?, ?, ?, ?);
  ${abilityResetQuery}
  `,
    [userkey, project_id, episode_id, dlc_id]
  );

  if (!resetResult.state) {
    logger.error(`resetPlayingEpisode Error 1 ${resetResult.error}`);
    respondDB(res, 80026, resetResult.error);
  }

  // 재조회 refresh
  const responseData = {};
  responseData.sceneProgress = await getUserEpisodeSceneProgress(req.body); // * 유저 사건ID 진행도
  responseData.projectCurrent = await getUserProjectCurrent(req.body); // 프로젝트 현재 플레이 지점 !
  responseData.selectionProgress = await getUserProjectSelectionProgress(
    req.body
  ); // 프로젝트 선택지 Progress

  // 능력치 2개 추가
  responseData.ability = await getUserProjectAbilityCurrent(req.body);
  responseData.rawStoryAbility = await getUserStoryAbilityRawList(req.body);
  res.status(200).json(responseData);

  if (
    !responseData.projectCurrent ||
    responseData.projectCurrent.length === 0
  ) {
    logger.error(
      `resetPlayingEpisode projectCurrent Error ${JSON.stringify(req.body)}`
    );
  }

  logAction(userkey, "startover_episode", req.body);
};

// * 유저 미니컷 히스토리 업데이트 (IFYOU 버전)
export const updateUserMinicutHistoryVer2 = async (req, res) => {
  const {
    body: { userkey, project_id, minicut_id, minicut_type, lang = "KO" },
  } = req;

  const updateResult = await DB(
    `call sp_update_user_minicut_history(?,?,?,?)`,
    [userkey, minicut_id, minicut_type, project_id]
  );

  if (!updateResult.state) {
    logger.error(`updateUserMinicutHistory Error ${updateResult.error}`);
    respondDB(res, 80020, updateResult.error);
    return;
  }

  const result = {};
  result.galleryImages = await getUserGalleryHistory(req.body);

  res.status(200).json(result);
};

// 유저 일러스트 히스토리 업데이트
export const updateUserIllustHistory = async (req, res) => {
  logger.info(`updateUserIllustHistory ${JSON.stringify(req.body)}`);

  const {
    body: { project_id, userkey, illust_id, illust_type, lang = "KO" },
  } = req;

  const result = await DB(Q_UPDATE_USER_ILLUST_HISTORY, [
    userkey,
    project_id,
    illust_id,
    illust_type,
  ]);

  if (!result.state) {
    logger.error(`updateUserIllustHistory Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const responseData = {};
  responseData.galleryImages = await getUserGalleryHistory(req.body);

  res.status(200).send(responseData);
};

// * 이모티콘 raw 데이터 포장하기
const collectEmoticonData = (rawEmoticons) => {
  const emoticons = {};
  rawEmoticons.forEach((item) => {
    // 화자 - 이모티콘 이름으로 포장한다.
    if (!Object.prototype.hasOwnProperty.call(emoticons, item.emoticon_owner)) {
      emoticons[item.emoticon_owner] = {};
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        emoticons[item.emoticon_owner],
        item.image_name
      )
    ) {
      emoticons[item.emoticon_owner][item.image_name] = {
        image_url: item.image_url,
        image_key: item.image_key,
      };
    }
  });

  return emoticons;
}; // ? collectEmoticonData END

// 모델 데이터 재포장
const collectModelData = (rawModels) => {
  const models = {};
  rawModels.forEach((item) => {
    if (!Object.prototype.hasOwnProperty.call(models, item.model_name)) {
      models[item.model_name] = [];
    }

    models[item.model_name].push(item); // 배열에 추가
  }); // 캐릭터 모델 포장 끝.

  return models;
}; // ? collectModelData

const collectLiveObjectData = (rawArray) => {
  const liveObjects = {};

  rawArray.forEach((item) => {
    if (
      !Object.prototype.hasOwnProperty.call(liveObjects, item.live_object_name)
    ) {
      liveObjects[item.live_object_name] = [];
    }

    liveObjects[item.live_object_name].push(item); // 배열에 추가
  }); // 라이브 오브제 포장 끝

  return liveObjects;
}; // ? collectLiveObjectData
const collectLiveIllustData = (rawArray) => {
  const liveIllusts = {};

  rawArray.forEach((item) => {
    // 키 없으면 추가해준다.
    if (
      !Object.prototype.hasOwnProperty.call(liveIllusts, item.live_illust_name)
    ) {
      liveIllusts[item.live_illust_name] = [];
    }

    liveIllusts[item.live_illust_name].push(item); // 배열에 추가한다.
  }); // 라이브 일러스트 포장 끝

  return liveIllusts;
}; // ? collectLiveIllustData

const collectSceneID = (rawArray) => {
  const result = [];

  for (const item of rawArray) {
    result.push(item.scene_id);
  }

  return result;
}; // ? collectSceneID

const collectEpisodeID = (rawArray) => {
  const result = [];

  for (const item of rawArray) {
    result.push(item.episode_id);
  }

  return result;
}; // ? collectEpisodeID

// * 2023.01 오토메 프로젝트 리소스 가져오기
export const getOtomeProjectResources = async (project_id, lang, userkey) => {
  // 2023.05.23 episodePurchase 노드 제거

  const responseData = {};
  let query = "";

  query += mysql.format(Q_SELECT_PROJECT_DETAIL, [lang, project_id]); // 0. detail 프로젝트 상세정보
  query += mysql.format(Q_SELECT_PROJECT_DRESS_CODE, [project_id]); // 1. dressCode 의상정보
  query += mysql.format(Q_SELECT_PROJECT_NAME_TAG, [project_id]); // 2. nametag 네임태그
  query += mysql.format(Q_SELECT_PROJECT_BGM, [project_id, lang]); // 3. bgms. BGM
  query += mysql.format(Q_SELECT_PROJECT_ALL_ILLUST, [lang, project_id]); // 4. illusts 일러스트
  query += mysql.format(Q_SELECT_PROJECT_MODEL_ALL_FILES, [project_id]); // 5. models 캐릭터 모델
  query += mysql.format(Q_SELECT_PROJECT_LIVE_OBJECT_ALL_FILES, [project_id]); // 6. liveObjects 라이브 오브제
  query += mysql.format(Q_SELECT_PROJECT_LIVE_ILLUST_ALL_FILES, [project_id]); // 7. liveIllusts 라이브 일러스트
  query += mysql.format(Q_SELECT_PROJECT_ALL_MINICUT, [lang, project_id]); // 8. minicuts 미니컷
  query += mysql.format(Q_SELECT_EPISODE_LOADING, [project_id]); // [9]. 에피소드 로딩 리스트
  query += mysql.format(Q_USER_EPISODE_SCENE_PROGRESS, [userkey, project_id]); // [10] 유저별 에피소드 상황 히스토리 Progress
  query += mysql.format(Q_SELECT_SCENE_HISTORY, [userkey, project_id]); // [11] 유저, 프로젝트에서 경험한 모든 사건 ID 목록

  //////
  query += mysql.format(Q_SELECT_EPISODE_PROGRESS, [userkey, project_id]); //  [12]. 에피소드 progress
  query += mysql.format(Q_SELECT_EPISODE_HISTORY, [userkey, project_id]); // [13]. 에피소드 히스토리
  query += mysql.format(Q_SELECT_PROJECT_ALL_BG, [project_id]); // [14] 프로젝트 모든 배경
  query += mysql.format(Q_SELECT_PROJECT_ALL_EMOTICONS, [project_id]); // [15] 프로젝트 모든 이모티콘

  // 2023.05.23
  query += mysql.format(Q_SELECT_OTOME_ITEM, [userkey, project_id, project_id]); // [16] 오토메 아이템 정보
  query += mysql.format(Q_SELECT_OTOME_USER_DRESS, [project_id, userkey]); // [17] 오토메 유저 의상 커스텀 정보

  // * 모인 쿼리 실행
  const result = await slaveDB(query);

  if (!result.state) {
    logger.error(
      `getOtomeProjectResources : ${userkey}/${JSON.stringify(result.error)}`
    );
    return null;
  }

  // * 데이터 포장하기
  const emoticons = collectEmoticonData(result.row[15]);
  const models = collectModelData(result.row[5]);
  const liveObjects = collectLiveObjectData(result.row[6]);
  const liveIllusts = collectLiveIllustData(result.row[7]);
  const sceneProgress = collectSceneID(result.row[10]);
  const sceneHistory = collectSceneID(result.row[11]);
  const episodeProgress = collectEpisodeID(result.row[12]);
  const episodeHistory = collectEpisodeID(result.row[13]);

  // 결과
  responseData.detail = result.row[0];
  responseData.dressCode = result.row[1];
  responseData.nametag = result.row[2];
  responseData.bgms = result.row[3];
  responseData.illusts = result.row[4];

  responseData.backgrounds = result.row[14];
  responseData.minicuts = result.row[8];
  responseData.episodeLoadingList = result.row[9];

  responseData.emoticons = emoticons;
  responseData.models = models;
  responseData.liveObjects = liveObjects;
  responseData.liveIllusts = liveIllusts;
  responseData.sceneProgress = sceneProgress;
  responseData.sceneHistory = sceneHistory;
  responseData.episodeProgress = episodeProgress;
  responseData.episodeHistory = episodeHistory;
  responseData.items = result.row[16];
  responseData.dressCustom = result.row[17];

  return responseData;
}; // ? getOtomeProjectResources

// 현재 시점의 로딩 정보 가져오기
export const getCurrentLoadingData = async (project_id, episode_id, lang) => {
  const result = {};

  const loading = await slaveDB(`
  SELECT a.loading_id
     , a.loading_name
     , a.image_id 
     , fn_get_design_info(a.image_id, 'url') image_url
     , fn_get_design_info(a.image_id, 'key') image_key
  FROM list_loading a
     , list_loading_appear b
WHERE a.project_id = ${project_id}
  AND b.loading_id = a.loading_id
  AND b.episode_id = ${episode_id}
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

  return result;
};

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
