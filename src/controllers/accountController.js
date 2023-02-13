/* eslint-disable prefer-destructuring */
/* eslint-disable no-plusplus */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { response } from "express";
import { DB, logAction, logDB, slaveDB, transactionDB } from "../mysqldb";
import {
  Q_CLIENT_LOGIN_BY_DEVICE,
  Q_SELECT_PROJECT_BUBBLE_SET,
  Q_SELECT_PROJECT_BUBBLE_SPRITE,
  Q_SELECT_PROJECT_MODEL_ALL_FILES,
  Q_SELECT_PROJECT_LIVE_OBJECT_ALL_FILES,
  Q_SELECT_PROJECT_LIVE_ILLUST_ALL_FILES,
  Q_CLIENT_LOGIN_BY_GAMEBASE,
  Q_REGISTER_CLIENT_ACCOUNT_WITH_GAMEBASE,
  Q_UPDATE_CLIENT_ACCOUNT_WITH_GAMEBASE,
  Q_CLIENT_LOGIN_BY_USERKEY,
  Q_SELECT_PROJECT_BGM,
  Q_SELECT_PROJECT_NAME_TAG,
  Q_SELECT_PROJECT_DETAIL,
} from "../QStore";

import {
  Q_CHANGE_USERKEY_GAMEBASE,
  Q_INSERT_USER_EPISODE_SCENE_HISTORY,
  Q_SELECT_PROJECT_ALL_ILLUST,
  Q_SELECT_PROJECT_DRESS_CODE,
  Q_SELECT_USER_DRESS_PROGRESS,
  Q_SELECT_USER_ILLUST_HISTORY,
  Q_UPDATE_USER_ILLUST_HISTORY,
  Q_USER_EPISODE_PURCHASE,
  Q_USER_EPISODE_SCENE_CLEAR,
  Q_USER_EPISODE_SCENE_PROGRESS,
  UQ_ACCQUIRE_CURRENCY,
  UQ_USE_CURRENCY,
  Q_UPDATE_USER_MISSION_HISTORY,
  Q_SELECT_USER_MISSION_HISTORY,
  UQ_GET_PROJECT_USER_PROPERTY,
  Q_SELECT_PROJECT_ALL_MINICUT,
  Q_SELECT_EPISODE_LOADING,
  Q_SELECT_MISSION_ALL,
  Q_SELECT_SCENE_HISTORY,
  Q_SELECT_SIDE_STORY,
  Q_SELECT_EPISODE_PROGRESS,
  Q_SELECT_EPISODE_HISTORY,
  Q_SELECT_PROJECT_ALL_BG,
  Q_SELECT_PROJECT_ALL_EMOTICONS,
  Q_SELECT_ENDING_HINT,
  Q_SELECT_SELECTION_HINT_PURCHASE,
  UQ_SEND_MAIL_NEWBIE_GEM,
  Q_SELECT_PREMIUM_PASS_REWARD,
} from "../USERQStore";

import { logger } from "../logger";
import { getUserVoiceHistory } from "./soundController";
import {
  checkSideUnlockByEpisode,
  checkSideUnlockByScene,
  checkMissionByEpisode,
  checkMissionByScence,
  checkMissionByDrop,
  getCurrentProjectPassPrice,
} from "./storyController";
import { respondDB, respondError } from "../respondent";
import {
  getUserProjectCurrent,
  getUserProjectSelectionProgress,
} from "../com/userProject";
import {
  getProjectBgmBannerInfo,
  getProjectFreepassBadge,
} from "./designController";
import { getUserBankInfo, getCurrencyQuantity } from "./bankController";

import { gamebaseAPI } from "../com/gamebaseAPI";
import {
  getProfileCurrencyCurrent,
  getUserStoryProfile,
} from "./profileController";
import {
  getUserProjectAbilityCurrent,
  createQueryResetAbility,
  getUserStoryAbilityRawList,
} from "./abilityController";
import { getUserSelectionPurchaseInfo } from "./selectionController";
import { cache } from "../init";

dotenv.config();

let { CURRENT_UPDATE } = process.env;
if (!CURRENT_UPDATE) CURRENT_UPDATE = 0;

//! 현재 선택지 로그
export const getUserStorySelectionHistory = async (userInfo) => {
  logger.info(`getUserStorySelectionHistory ${JSON.stringify(userInfo)}`);
  const { userkey, project_id, lang } = userInfo;

  const responseData = {};
  const selection = {};
  const ending = [];

  //* 현재 셀렉션(user_selection_current) 값이 있는지 확인
  let endingCheck = true;
  let index = 0;

  let result = await DB(
    `SELECT * FROM user_selection_current 
  WHERE userkey = ? AND project_id =?;
  `,
    [userkey, project_id]
  );
  if (!result.state || result.row.length === 0) endingCheck = false;

  //* 현재 설렉션(user_selection_current), 엔딩(user_selection_ending) 같은 데이터가 있는지 확인
  if (endingCheck) {
    result = await DB(
      `SELECT *
    FROM user_selection_current a, user_selection_ending b 
    WHERE a.userkey = b.userkey 
    AND a.project_id = b.project_id 
    AND a.play_count = b.play_count 
    AND a.userkey = ? AND a.project_id = ?;
    `,
      [userkey, project_id]
    );
    if (result.row.length > 0) endingCheck = false;
  }

  if (!endingCheck) {
    result = await DB(
      `
    SELECT a.episode_id episodeId 
    , ifnull(fn_get_episode_title_lang(a.episode_id, ?), '') title
    , a.selection_group selectionGroup
    , a.selection_no selectionNo
    , a.selection_order selectionOrder
    , ${lang} selection_content
    , CASE WHEN a.selection_group = b.selection_group AND a.selection_no = b.selection_no 
    THEN 1 ELSE 0 END selected
    , ifnull((SELECT sortkey FROM list_episode WHERE episode_id = a.episode_id),0) sortkey
    , DATE_FORMAT(origin_action_date, '%Y-%m-%d %T') action_date  
    , ending_id
    , ifnull(fn_get_episode_title_lang(ending_id, ?), '') ending_title 
    , fn_get_ending_type(ending_id) ending_type
    , fn_get_script_data(a.episode_id, a.selection_group, a.selection_no, '${lang}') script_data
    FROM list_selection a LEFT OUTER JOIN user_selection_ending b 
    ON a.project_id = b.project_id AND a.episode_id = b.episode_id AND a.selection_group = b.selection_group
    WHERE userkey = ? 
    AND a.project_id = ?
    AND play_count = (SELECT max(play_count) FROM user_selection_ending use3 WHERE userkey = ? AND project_id = ?)
    ORDER BY sortkey, a.episode_id, selectionGroup, a.selection_order;`,
      [lang, lang, userkey, project_id, userkey, project_id]
    );
  } else {
    result = await DB(
      `
    SELECT a.episode_id episodeId  
    , ifnull(fn_get_episode_title_lang(a.episode_id, ?), '') title
    , a.selection_group selectionGroup
    , a.selection_no selectionNo
    , a.selection_order selectionOrder
    , ${lang} selection_content
    , CASE WHEN a.selection_group = b.selection_group AND a.selection_no = b.selection_no 
    THEN 1 ELSE 0 END selected
    , ifnull((SELECT sortkey FROM list_episode WHERE episode_id = a.episode_id),0) sortkey
    , DATE_FORMAT(action_date, '%Y-%m-%d %T') action_date  
    , '' ending_title
    , fn_get_script_data(a.episode_id, a.selection_group, a.selection_no, '${lang}') script_data
    FROM list_selection a LEFT OUTER JOIN user_selection_current b 
    on a.project_id = b.project_id AND a.episode_id = b.episode_id AND a.selection_group = b.selection_group
    WHERE userkey = ?
    AND a.project_id = ?
    ORDER BY sortkey, a.episode_id, selectionGroup, a.selection_order;`,
      [lang, userkey, project_id]
    );
  }

  if (result.state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      if (!Object.prototype.hasOwnProperty.call(selection, item.title)) {
        selection[item.title] = {};
      }

      if (
        !Object.prototype.hasOwnProperty.call(
          selection[item.title],
          item.script_data
        )
      ) {
        selection[item.title][item.script_data] = []; // 없으면 빈 배열 생성
      }

      selection[item.title][item.script_data].push({
        //선택지
        selection_group: item.selectionGroup,
        selection_no: item.selectionNo,
        selection_order: item.selectionOrder,
        selection_content: item.selection_content,
        selected: item.selected,
      });

      if (item.ending_title) {
        if (index === 0) {
          //엔딩
          ending.push({
            ending_id: item.ending_id,
            ending_title: item.ending_title,
            ending_type: item.ending_type,
          });
        }

        index += 1;
      }
    }
  }

  responseData.selection = selection;
  responseData.ending = ending;

  return responseData;
}; // ? END

// * 유저 인트로 수행여부 업데이트
export const updateUserIntroDone = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  const result = await DB(`
  update table_account
     SET intro_done = 1
    WHERE userkey = ${userkey};
  `);

  res.status(200).json(req.body);
};

// 캐릭터 탈퇴일자 업데이트
export const updateWithdrawDate = (req, res) => {
  const {
    body: { userkey },
  } = req;

  DB(
    `update table_account set withdraw_date = now() where userkey = ${userkey}`
  );

  res.status(200).send("");
};

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

// * 유저 재화 입력
export const insertUserProperty = async (req, res) => {
  const {
    body: { userkey, currency, quantity, pathCode },
  } = req;

  const responseData = {};

  // * 2021.09.18 처리할꺼 다 하고, 첫 클리어 보상 입력처리.
  const rewardPromise = [];
  rewardPromise.push(addUserProperty(userkey, currency, quantity, pathCode));

  await Promise.all(rewardPromise)
    .then((values) => {
      console.log(values);
    })
    .catch((err) => {
      console.log(err);
      logger.error(err);
    });

  // bank 정보 refresh
  responseData.bank = await getUserBankInfo(req.body);
  res.status(200).json(responseData);
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

// * 유저의 프로젝트 재화 (대여권, 프리패스) 소유 체크
export const getUserProjectProperty = async (userInfo) => {
  // logger.info(`getUserProjectProperty ${JSON.stringify(userInfo)}`);

  // 유저의 프로젝트 재화
  const propertyResult = await slaveDB(UQ_GET_PROJECT_USER_PROPERTY, [
    userInfo.userkey,
    userInfo.project_id,
    userInfo.userkey,
    userInfo.project_id,
    userInfo.userkey,
    userInfo.project_id,
  ]);

  const { freepass, ticket, onetime } = propertyResult.row[0];
  const responseData = {};
  responseData.freepass = freepass;
  responseData.ticket = ticket;
  responseData.onetime = onetime;

  return responseData;
};

// 유저의 미수신 우편 카운트
const getUserUnreadMailCount = async (userkey) => {
  const { cnt } = (
    await DB(`SELECT fn_get_user_unread_mail_count(${userkey}) cnt FROM DUAL;`)
  ).row[0];

  return cnt;
};

// ? /////////////////////////////////////////////////////////////////////////////////////////////////

// 유저 도전과제 히스토리 업데이트
export const updateUserMissionHistory = async (req, res) => {
  logger.info(`updateUserMissionHistory ${JSON.stringify(req.body)}`);

  const userInfo = req.body;

  const result = await DB(Q_UPDATE_USER_MISSION_HISTORY, [
    userInfo.userkey,
    userInfo.mission_id,
  ]);

  if (!result.state) {
    logger.error(`updateUserMissionHistory Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 업데이트하고 재조회
  const refresh = await DB(Q_SELECT_USER_MISSION_HISTORY, [
    userInfo.lang,
    userInfo.lang,
    userInfo.userkey,
    userInfo.project_id,
  ]);

  res.status(200).send(refresh.row);
};

// 프로젝트의 유저 의상 진행정보 조회
const getUserProjectDressProgress = async (userInfo) => {
  const result = await DB(Q_SELECT_USER_DRESS_PROGRESS, [
    userInfo.userkey,
    userInfo.project_id,
  ]);

  if (result.state) return result.row;
  else return [];
};

//////////////////////////// 의상 정보 관련 처리 끝 ///////////////////////////////////////

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

// 유저 에피소드 씬 히스토리 입력(hist, progress 같이 입력)
export const insertUserEpisodeSceneHistory = async (req, res) => {
  const userInfo = req.body;

  await DB(Q_INSERT_USER_EPISODE_SCENE_HISTORY, [
    userInfo.userkey,
    userInfo.project_id,
    userInfo.episode_id,
    userInfo.scene_id,
  ]);

  const list = await getUserEpisodeSceneProgress(userInfo);
  res.status(200).json(list);
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
  , fn_check_episode_lang_exists(a.episode_id, '${userInfo.lang}') lang_exists
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
  , fn_check_episode_in_progress(${userInfo.userkey}, a.episode_id) in_progress
  , fn_check_episode_in_history(${userInfo.userkey}, a.episode_id) in_history
  , fn_get_design_info(a.square_image_id, 'url') title_image_url
  , fn_get_design_info(a.square_image_id, 'key') title_image_key
  , fn_get_design_info(a.popup_image_id, 'url') popup_image_url
  , fn_get_design_info(a.popup_image_id, 'key') popup_image_key
  , TRIM(fn_get_episode_summary_lang(a.episode_id, '${userInfo.lang}')) summary
  , fn_get_count_scene_in_history(${userInfo.userkey}, a.episode_id, '${userInfo.lang}', 'total') total_scene_count
  , fn_get_count_scene_in_history(${userInfo.userkey}, a.episode_id, '${userInfo.lang}', 'played') played_scene_count
  , CASE WHEN a.episode_type = 'ending' THEN fn_check_user_ending(${userInfo.userkey}, a.episode_id) 
         ELSE 0 END ending_open
  , a.next_open_min
  , CASE WHEN ifnull(a.publish_date, '2020-01-01') > now() THEN 1 ELSE 0 END is_serial -- 
  , date_format(ifnull(a.publish_date, '2020-01-01'), '%Y-%m-%d %T') publish_date
  , ifnull(ueh.episode_id, 0) is_clear
  , ifnull(a.speaker, '') speaker
FROM list_episode a
LEFT OUTER JOIN user_episode_hist ueh ON ueh.userkey = ${userInfo.userkey} AND ueh.project_id = a.project_id AND ueh.episode_id = a.episode_id
WHERE a.project_id = ${userInfo.project_id}
  AND a.dlc_id = -1
  AND a.episode_type IN ('chapter', 'ending')
ORDER BY a.episode_type, a.sortkey;  
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

  // ! 2021.09.01 갤러리 이미지 리소스의 첫 등장 에피소드 정보에 따라서 각 에피소드에 넣어준다.
  /*
  const galleryImages = await getConnectedGalleryImages(userInfo.project_id);

  // 정렬된 에피소드 목록을 돌면서 연결된 갤러리 이미지를 넣어준다.
  organized.forEach((item) => {
    item.galleryImage = []; // 빈 배열을 만들어주기!

    for (let i = 0; i < galleryImages.length; i++) {
      if (galleryImages[i].appear_episode === item.episode_id) {
        // 첫 등장 에피소드 ID를 비교해서 일치하면 push!
        item.galleryImage.push(galleryImages[i]); // push 해준다.
      }
    } //
  });
  */

  return organized;
};

// * 프로젝트에 연결된 말풍선 세트 ID 조회
const getProjectBubbleSetVersionID = async (userInfo) => {
  // * 2022.05.18 말풍선 추가 옵션
  // 폰트 사이즈 및 정렬 방식, 네임태그 설정에 대한 정보 추가
  const result = await slaveDB(
    `
    SELECT lp.bubble_set_id
         , cbm.*
    FROM list_project_master lp
       , com_bubble_master cbm 
   WHERE lp.project_id = ?
     AND cbm.set_id = lp.bubble_set_id;
 `,
    [userInfo.project_id]
  );

  // 마스터 정보
  let bubbleMaster = { bubbleID: 25, bubble_ver: 1 };

  // 리턴
  if (result.state && result.row.length > 0) {
    bubbleMaster = result.row[0]; // row 정보를 그대로 가져오고

    // 추가 변수 세팅
    bubbleMaster.bubbleID = result.row[0].bubble_set_id;
    bubbleMaster.bubble_ver = result.row[0].bubble_ver;

    return bubbleMaster;
  } else {
    logger.error(`NO BUBBLE SET ${JSON.stringify(userInfo)}`);
    return bubbleMaster;
  }
}; // ? END

// 프로젝트 말풍선 세트 정보 조회
const getProjectBubbleSetDetail = async (userInfo) => {
  const result = await slaveDB(Q_SELECT_PROJECT_BUBBLE_SET, [
    userInfo.bubbleID,
  ]);

  if (result.state) return result.row;
  else return [];
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

// 유저 프로젝트 일러스트 히스토리
const getUserIllustHistory = async (userInfo) => {
  const result = await DB(Q_SELECT_USER_ILLUST_HISTORY, [
    userInfo.userkey,
    userInfo.userkey,
    userInfo.lang,
    userInfo.lang,
    userInfo.project_id,
    userInfo.lang,
    userInfo.lang,
    userInfo.project_id,
    userInfo.lang,
    userInfo.lang,
    userInfo.project_id,
    userInfo.lang,
    userInfo.lang,
    userInfo.project_id,
  ]);

  if (result.state) return result.row;
  else return [];
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
  ORDER BY le.sortkey, z.illust_name;  
  `
  );

  const images = publicImages.row;

  console.log("!!! gallery total images count : ", images.length);

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

// 유저 프로젝트 도전과제 히스토리
const getUserMissionHistory = async (userInfo) => {
  const result = await DB(Q_SELECT_USER_MISSION_HISTORY, [
    userInfo.userkey,
    userInfo.lang,
    userInfo.lang,
    userInfo.project_id,
  ]);

  if (result.state) return result.row;
  else return [];
};

// 프로젝트의 모든 도전과제 리스트
// * user_mission과 조인해서 주는것으로 변경 (2021.08.13)
const getProjectAllMission = async (userInfo) => {
  const result = await DB(
    `
  SELECT a.mission_id
  , fn_get_mission_name(a.mission_id, '${userInfo.lang}') mission_name
  , fn_get_mission_hint(a.mission_id, '${userInfo.lang}') mission_hint
  , a.mission_type 
  , a.is_hidden 
  , a.reward_currency 
  , a.reward_quantity 
  , a.reward_exp 
  , a.image_url 
  , a.image_key 
  , b.unlock_state 
  , fn_get_design_info((SELECT icon_image_id FROM com_currency WHERE currency = reward_currency), 'url') icon_image_url
  , fn_get_design_info((SELECT icon_image_id FROM com_currency WHERE currency = reward_currency), 'key') icon_image_key
  , fn_get_mission_name(a.mission_id, 'KO') origin_name
FROM list_mission a 
LEFT OUTER JOIN user_mission b ON a.mission_id = b.mission_id AND b.userkey = ${userInfo.userkey}
WHERE a.project_id = ${userInfo.project_id};
  `
  );

  if (result.state) return result.row;
  else return [];
};

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

// 프로젝트 해시태그 정보
const requestProjectHashtag = async (userInfo) => {
  const query = `
  SELECT lph.project_id
  , lph.hashtag_no
  , ch.tag_name 
    FROM list_project_master lp 
    , list_project_hashtag lph
    , com_hashtag ch 
    WHERE lp.project_id = ?
    AND lph.project_id = lp.project_id
    AND ch.hashtag_no = lph.hashtag_no 
    ORDER BY ch.hashtag_no 
    ;  
  `;

  const result = await DB(query, [userInfo.project_id]);

  if (result.state && result.row.length > 0) return result.row;
  else return [];
};

// 프로젝트 메인 썸네일 정보
const requestProjectMainThumbnail = async (userInfo) => {
  const query = `
  SELECT lpt.image_url, lpt.image_key 
  FROM list_project_thumbnail lpt
 WHERE lpt.project_id = ?
 ;
  `;

  const result = await DB(query, [userInfo.project_id]);
  if (result.state && result.row.length > 0) return result.row;
  else return [];
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

// ! 유저 에피소드 진행도 조회 버전2
const getUserEpisodeProgressVer2 = async (userInfo) => {
  const result = await DB(
    `SELECT a.episode_id, is_clear
  FROM user_episode_progress a 
 WHERE a.userkey = ?
   AND a.project_id = ?
 ORDER BY open_date DESC;`,
    [userInfo.userkey, userInfo.project_id]
  );

  if (result.state) {
    return result.row; // 그냥 행 자체를  return
  } else {
    return [];
  }
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

// 대상 에피소드 사건 진행율 가져오기
const getEpisodeSceneCount = async (userkey, episodeID) => {
  const result = await DB(
    `
  SELECT fn_get_count_scene_in_history(?, ?, 'KO', 'total') total_scene_count
       , fn_get_count_scene_in_history(?, ?, 'KO', 'played') played_scene_count
  FROM dual
  `,
    [userkey, episodeID, userkey, episodeID]
  );

  return result.row[0].played_scene_count;
};

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

// 프로젝트 화폐정보
const getProjectCurrency = async (project_id, lang) => {
  const result = await DB(
    `
  SELECT cc.currency
     , fn_get_localize_text(cc.local_code, ?) origin_name
     , cc.currency_type 
     , cc.local_code
     , cc.is_unique 
  FROM com_currency cc WHERE connected_project = ?;
  `,
    [lang, project_id]
  );

  return result.row;
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

// * 랜덤 핀코드 생성하기
const getRandomPIN = () => {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
};

// * 클라이언트 계정 생성
export const registerClientAccount = async (req, res) => {
  logger.info(`registerClientAccount [${JSON.stringify(req.body)}]`);

  const {
    body: { deviceid, gamebaseid = null },
  } = req;

  const pincode = getRandomPIN();

  let result = ``;

  result = await DB(Q_REGISTER_CLIENT_ACCOUNT_WITH_GAMEBASE, [
    deviceid,
    gamebaseid,
    pincode,
  ]);

  if (!result.state) {
    logger.error(`registerClientAccount Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const isLive = process.env.LIVE;
  console.log(`is Live : [${isLive}]`);

  // 임시로직, 신규유저 재화 지급
  // 테스트 서버만 적용할 것.
  //if (isLive < 1) {

  //* 기본 코인 재화 처리
  const userResult = await DB(Q_CLIENT_LOGIN_BY_GAMEBASE, [gamebaseid]);
  if (userResult.state && userResult.row.length > 0) {
    if (isLive == 0) {
      // 가입시 재화 지급
      await DB(UQ_ACCQUIRE_CURRENCY, [
        userResult.row[0].userkey,
        "gem",
        150,
        "newbie",
      ]);
    }

    // * 2022.03.24 더이상 추가 아이템 주지 않음!

    /*
    await DB(UQ_ACCQUIRE_CURRENCY, [
      userResult.row[0].userkey,
      "profileBackground19",
      1,
      "newbie",
    ]);
    await DB(UQ_ACCQUIRE_CURRENCY, [
      userResult.row[0].userkey,
      "ifyouPortrait01",
      1,
      "newbie",
    ]);

    // 프로필에 바로 적용
    await DB(UQ_SAVE_USER_PROFILE, [
      userResult.row[0].userkey,
      "profileBackground19",
      0,
      0,
      0,
      1600,
      1600,
      0,
    ]);
    await DB(UQ_SAVE_USER_PROFILE, [
      userResult.row[0].userkey,
      "ifyouPortrait01",
      1,
      0,
      0,
      800,
      1200,
      0,
    ]);
    */

    // 그 외 재화는 메일 발송
    // await DB(UQ_SEND_MAIL_NEWBIE, [userResult.row[0].userkey, "ifyouFrame01"]);
    // await DB(UQ_SEND_MAIL_NEWBIE, [userResult.row[0].userkey, "ifyouFrame02"]);
    // await DB(UQ_SEND_MAIL_NEWBIE, [userResult.row[0].userkey, "ifyouFrame03"]);
    // await DB(UQ_SEND_MAIL_NEWBIE, [userResult.row[0].userkey, "ifyouFrame04"]);

    // * 2022.07.10
    // 신규 가입시 100 스타 지급
    await DB(UQ_SEND_MAIL_NEWBIE_GEM, [userResult.row[0].userkey]);
  }
  //}

  // res.redirect(routes.clientApp);
  loginClient(req, res);
};

// ! #클라이언트 로그인 처리
export const loginClient = async (req, res) => {
  const {
    body: {
      deviceid,
      gamebaseid = null,
      os,
      country = "ZZ",
      lang = "EN",
      culture = "",
      clientTokenMeta = "",
      clientToken64 = "",
      clientToken7 = "",
      client_version = "1.0.0",
      editor = 0,
    },
  } = req;

  let result = null;
  let current_culture = culture; // 문화권 값

  let userOS = "";
  // 안드로이드 ,아이폰 분류 처리
  if (os === 0) userOS = "Android";
  else userOS = "iOS";

  if (gamebaseid != null) {
    // 게임베이스로 로그인
    logger.info(`loginClient [ ${gamebaseid} ]`);
    result = await DB(Q_CLIENT_LOGIN_BY_GAMEBASE, [gamebaseid]);
  } else {
    // 구버전.
    logger.info(`loginClient without gamebaseID`);
    result = await DB(Q_CLIENT_LOGIN_BY_DEVICE, [deviceid]);
  }

  const accountInfo = {};

  // console.log(result);

  // 계정없으면 생성처리
  if (result.row.length === 0) {
    registerClientAccount(req, res); // 가입시킨다. 가입시키고 다시 호출됨
  } else {
    // * 로그인 완료 후 데이터 처리
    accountInfo.account = result.row[0];
    accountInfo.account.current_lang = lang; // 언어 값 갱신처리

    // allpass_expiration 처리 추가 2022.05.23
    const expireDate = new Date(accountInfo.account.allpass_expiration);
    accountInfo.account.allpass_expire_tick = expireDate.getTime();

    const userInfo = { userkey: accountInfo.account.userkey };
    accountInfo.bank = await getUserBankInfo(userInfo);
    accountInfo.tutorial = await getUserTutorialCurrent(userInfo);
    accountInfo.unreadMailCount = accountInfo.account.unreadMailCount;

    // 테이블에 uid 컬럼이 비어있으면, uid 업데이트 이후에 nickname 변경
    if (accountInfo.account.uid === null || accountInfo.account.uid === "") {
      console.log(`UPDATE UID`);

      await DB(`UPDATE table_account SET uid = ? WHERE userkey = ?`, [
        accountInfo.account.pincode,
        accountInfo.account.userkey,
      ]);
      await DB(
        `UPDATE table_account SET nickname = CONCAT('GUEST', uid) WHERE userkey = ?;`,
        [accountInfo.account.userkey]
      );

      result = await DB(
        `SELECT uid , nickname FROM table_account WHERE userkey = ?;`,
        [accountInfo.account.userkey]
      );
      accountInfo.account.uid = result.row[0].uid;
      accountInfo.account.nickname = result.row[0].nickname;
    }

    // 국가, 언어 기준으로 문화권 설정 처리
    const cultureResult = await slaveDB(`
    SELECT cc.culture_id culture FROM com_culture cc WHERE cc.lang = '${lang}' OR cc.country_code = UPPER('${country}') LIMIT 1;
    `);

    if (cultureResult.state && cultureResult.row.length > 0) {
      current_culture = cultureResult.row[0].culture;
    } else {
      current_culture = "ZZ";
    }

    accountInfo.account.current_culture = current_culture;
    accountInfo.current_culture = current_culture;
    // 문화권 설정 처리 끝.

    // * 응답!!
    res.status(200).json(accountInfo);

    // * 2022.12.26 변조 데이터 유무 확인
    // android이고, editor가 아닌 경우에만 체크
    if (os === 0 && editor === 0 && client_version > "1.2.51") {
      logger.info(`Hash check start [${accountInfo.account.userkey}]`);
      const hashCheckResult = await slaveDB(`
      SELECT a.hash_no  
        FROM com_build_hash a
      WHERE a.client_version = '${client_version}'
        AND a.identifier  = 'pier.make.story'
        AND a.hash_code IN ('${clientTokenMeta}', '${clientToken64}', '${clientToken7}');
      `);

      if (!hashCheckResult.state || hashCheckResult.row.length <= 0) {
        // * 유효하지 않은 유저로 등록할것.
        // 빌드 해시 중 일치하는게 없음
        logger.error(
          `invalid build ifyou user found! [${accountInfo.account.userkey}]`
        );
      }
    } // ? 변조 체크 종료

    // gamebase에서 계정정보 추가로 받아오기.
    const gamebaseResult = await gamebaseAPI.member(gamebaseid);
    if (
      !Object.prototype.hasOwnProperty.call(gamebaseResult, "data") ||
      !Object.prototype.hasOwnProperty.call(gamebaseResult.data, "memberInfo")
    ) {
      return;
    }

    const { valid } = gamebaseResult.data.member;

    logger.info(
      `loginClient update(${userInfo.userkey}) : ${country}, ${valid}`
    );

    // 마지막 접속일자, 언어정보 등 갱신처리
    DB(Q_UPDATE_CLIENT_ACCOUNT_WITH_GAMEBASE, [
      country,
      valid,
      userOS,
      lang,
      current_culture,
      userInfo.userkey,
    ]);

    // 로그 쌓기
    logAction(userInfo.userkey, "login", accountInfo.account);
  } // ? else (로그인) 끝
}; // ? loginClient

// 계정 변경(게임베이스 기 연동 ID에 대한 처리)
export const changeAccountByGamebase = async (req, res) => {
  const {
    body: { userkey, preGamebaseID },
  } = req;

  logger.info(
    `changeAccountByGamebase userkey:[${userkey}]/[${preGamebaseID}]`
  );

  const result = await DB(Q_CHANGE_USERKEY_GAMEBASE, [userkey, preGamebaseID]);
  if (!result.state || result.row.length === 0) {
    logger.error(`changeAccountByGamebase Error ${result.error}`);
    respondDB(res, 80032, "");
    return;
  }

  const accountInfo = {};
  accountInfo.account = result.row[0][0];
  const userInfo = { userkey: accountInfo.account.userkey };
  accountInfo.bank = await getUserBankInfo(userInfo);
  accountInfo.unreadMailCount = accountInfo.account.unreadMailCount;

  res.status(200).json(accountInfo);

  logAction(userkey, "change_auth_account", req.body);
};

// 신규. 위에 insertUserEpisodeSceneHistory 삭제.
// 2022.07.26 삭제대상
export const updateUserSceneRecord = async (req, res) => {
  const userInfo = req.body;

  logger.info(`updateUserSceneRecord : ${JSON.stringify(userInfo)}`);

  const result = await DB(Q_INSERT_USER_EPISODE_SCENE_HISTORY, [
    userInfo.userkey,
    userInfo.project_id,
    userInfo.episode_id,
    userInfo.scene_id,
  ]);

  if (!result.state) {
    logger.error(`updateUserSceneRecord Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const responseData = {};
  responseData.sceneHistory = [];
  responseData.sceneProgress = [];

  responseData.sceneProgress = await getUserEpisodeSceneProgress(userInfo); // 유저 사건ID 진행도
  responseData.sceneHistory = await getUserProjectSceneHistory(userInfo); // 유저가 한번이라도 오픈한 프로젝트별 사건ID (신규 입력만, 삭제나 변경 없음)

  //! 해금 사건ID 조회
  responseData.unlockSide = await checkSideUnlockByScene(userInfo);

  //! 미션 해금 조회
  responseData.unlockMission = await checkMissionByScence(userInfo);

  res.status(200).json(responseData);
};

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

// ! 유저 작품 초기화 TYPE2 - 15버전 부터 사용
export const resetUserEpisodeProgressType2 = async (req, res) => {
  logger.info(`resetUserEpisodeProgressType2 [${JSON.stringify(req.body)}]`);

  // * 2022.02.28 : Flow에서 처리하는 것으로 수정됨. 고정 가격으로 변경되었음.
  // * 2021.12.12 : 선택지 로그 추가로 sp_reset_user_episode_progress 프로시저로 일부 수정 - JE
  // * 2022.01.05 : 리셋 제한 추가(프리패스 : 상관없음, 그 외 : 횟수에 따라 코인값 조정)
  const {
    body: {
      userkey,
      project_id,
      episodeID,
      price,
      isFree = false,
      scene_id,
      kind = "reset",
    },
  } = req;

  const userCoin = await getCurrencyQuantity(userkey, "coin"); // 유저 보유 코인수
  let resetPrice = price; // 리셋 가격 (고정가격으로 변경)

  // 클라이언트에서 체크하겠지만 한번 더 체크..
  const freepassCheck = await slaveDB(`
    SELECT a.userkey, a.purchase_no 
    FROM user_premium_pass a
   WHERE a.userkey = ${userkey} 
     AND a.project_id = ${project_id};
    `);

  const onedayCheck = await slaveDB(`
    SELECT a.userkey 
    FROM user_oneday_pass a
   WHERE a.userkey = ${userkey}
     AND a.project_id = ${project_id}
     AND now() BETWEEN purchase_date AND date_add(a.purchase_date, INTERVAL 1 day);
    `);

  // * 프리미엄 패스 및 이프유 패스, 원데이 패스 보유 중
  if (
    (freepassCheck.state && freepassCheck.row.length > 0) ||
    (onedayCheck.state && onedayCheck.row.length > 0)
  ) {
    // logger.info(`freepass user [${userkey}]`);
    resetPrice = 0;
  } // ? 자유이용권 보유 체크 종료

  let useQuery = ``;

  // * 코인 부족한 경우 종료
  if (userCoin < resetPrice) {
    //코인부족
    logger.error(`resetUserEpisodeProgressType2 Not enough coin!!`);
    respondDB(res, 80013);
    return;
  }

  // 재화 차감 쿼리
  if (resetPrice > 0) {
    useQuery = mysql.format(
      `CALL sp_use_user_property(?, 'coin', ?, 'reset_purchase', ?);`,
      [userkey, resetPrice, project_id]
    );
  }

  //능력치 리셋 쿼리 가져오기
  const abilityResetQuery = await createQueryResetAbility({
    userkey,
    project_id,
    episode_id: episodeID,
  });

  // 리셋 처리 시작 !!
  const resetResult = await transactionDB(
    `
    ${useQuery}
    CALL sp_reset_user_episode_progress(?, ?, ?);
    ${abilityResetQuery}
    `,
    [userkey, project_id, episodeID]
  );

  if (!resetResult.state) {
    logger.error(`resetUserEpisodeProgressType2 Error 1 ${resetResult.error}`);
    respondDB(res, 80026, resetResult.error);
    return;
  }

  // ! 재조회 refresh nextEpisode, currentEpisode, episodeProgress, episodeSceneProgress...
  const responseData = {};

  responseData.episodeProgress = await getUserEpisodeProgress(req.body); // * 유저 에피소드 진행도
  responseData.sceneProgress = await getUserEpisodeSceneProgress(req.body); // * 유저 사건ID 진행도

  // * 2021.08.27
  responseData.projectCurrent = await getUserProjectCurrent(req.body); // 프로젝트 현재 플레이 지점 !
  responseData.selectionProgress = await getUserProjectSelectionProgress(
    req.body
  ); // 프로젝트 선택지 Progress

  // 능력치 2개 추가
  responseData.ability = await getUserProjectAbilityCurrent(req.body);
  responseData.rawStoryAbility = await getUserStoryAbilityRawList(req.body);

  responseData.bank = await getUserBankInfo(req.body);

  res.status(200).json(responseData);

  logAction(userkey, "reset_progress", req.body);
}; // * End of resetUserEpisodeProgress TYPE2

// * 튜토리얼 How to play
export const updateTutorialHowToPlay = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  const result = await DB(`
  update user_tutorial 
    SET how_to_play = 1
  WHERE userkey = ${userkey};
  `);

  // 보상으로 2개 주기
  await addUserProperty(userkey, "gem", 2, "howToPlay");

  const responseData = {};
  responseData.got = { currency: "gem", quantity: 2 };
  responseData.bank = await getUserBankInfo(req.body);

  res.status(200).json(responseData);
}; // ? resetUserEpisodeProgressType2 END

// * 에피소드 플레이 도중 처음으로 돌아가기 호출시 동작.
export const resetPlayingEpisode = async (req, res) => {
  logger.info(`resetPlayingEpisode [${JSON.stringify(req.body)}]`);

  const {
    body: { userkey, episode_id, project_id },
  } = req;

  //능력치 리셋 쿼리 가져오기
  const abilityResetQuery = await createQueryResetAbility({
    userkey,
    project_id,
    episode_id,
  });

  const resetResult = await transactionDB(
    `
  CALL sp_reset_user_episode_progress(?, ?, ?);
  ${abilityResetQuery}
  `,
    [userkey, project_id, episode_id]
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

// * 선택지 튜토리얼 여부
export const updateTutorialSelection = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  const result = await DB(`
  update user_tutorial 
    SET tutorial_selection = 1
  WHERE userkey = ${userkey};
  `);

  res.status(200).json(result.state);
};

// * 튜토리얼 단계 업데이트2022.01.11
export const updateTutorialStep = async (req, res) => {
  const {
    body: {
      userkey,
      tutorial_step,
      first_project_id = -1,
      first_episode_id = -1,
    },
  } = req;

  const userTutorial = await DB(
    `SELECT * FROM user_tutorial ut WHERE ut.userkey = ${userkey};`
  );

  // 테이블에 데이터 없으면 업데이트
  // table_account의 tutorial_step은 사용하지 말자.
  if (userTutorial.state && userTutorial.row.length === 0) {
    const createTutorial =
      await DB(`INSERT INTO user_tutorial (userkey, first_project_id, tutorial_step) 
    VALUES (${userkey}, ${first_project_id}, ${tutorial_step});`);

    if (!createTutorial.state) {
      respondDB(res, 80048, createTutorial.error);
      return;
    }
  } else {
    const updateTutorial = await DB(
      `
    UPDATE user_tutorial
       SET first_project_id = ifnull(?, first_project_id)
         , tutorial_step = ?
    WHERE userkey = ${userkey};
    `,
      [first_project_id, tutorial_step]
    );

    if (!updateTutorial.state) {
      respondDB(res, 80048, updateTutorial.error);
      return;
    }
  } // ? insert or update

  const result = await DB(
    `SELECT a.* FROM user_tutorial a WHERE a.userkey = ${userkey};`
  );

  if (!result.state) {
    respondDB(res, 80048, result.error);
    return;
  }

  const responseData = {};
  responseData.first_project_id = result.row[0].first_project_id;
  // responseData.first_episode_id = result.row[0].first_episode_id;
  responseData.tutorial_step = result.row[0].tutorial_step;
  responseData.new_tutorial_step = result.row[0].tutorial_step;

  res.status(200).json(responseData);

  //로그용으로 쌓기 위해 추가
  if (tutorial_step === 3) logAction(userkey, "tutorial_cancel", req.body);
  logAction(userkey, "update_tutorial", req.body);
};

// * 유저 튜토리얼 보상 요청하기
export const requestTutorialReward = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  // 튜토리얼 스텝 3으로 올린다.
  const updateQuery = `
  UPDATE user_tutorial
     SET tutorial_step = 3
   WHERE userkey = ${userkey};
  `;

  // 튜터리얼 보상 지급 쿼리
  // 2022.01.15 JE - 보상 재화 추가
  const currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project)  
  VALUES(?, 'tutorial', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;

  let propertyQuery = mysql.format(currentQuery, [userkey, "gem", "6"]);
  propertyQuery += mysql.format(currentQuery, [userkey, "tutorialBadge", "1"]);

  const result = await transactionDB(`${updateQuery} ${propertyQuery}`);
  if (!result.state) {
    respondDB(res, 80048, result.error);
    return;
  }

  //로그용으로 쌓기 위해 추가
  logAction(userkey, "tutorial_done", req.body);

  const responseData = { new_tutorial_step: 3 };

  responseData.bank = await getUserBankInfo(req.body); // ! 1.1.10 부터  삭제대상
  responseData.unreadMailCount = await getUserUnreadMailCount(userkey);

  res.status(200).json(responseData);
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

// ? 유저 미니컷 히스토리 업데이트
export const updateUserMinicutHistory = async (req, res) => {
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
  result.illustHistory = await getUserIllustHistory(req.body);

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

// * 2021.12.19 프로젝트 리소스 한번에 가져오기
// * 쿼리 통합
const getProjectResources = async (project_id, lang, userkey) => {
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

  // * 조정
  query += mysql.format(Q_SELECT_EPISODE_LOADING, [project_id]); // [9]. 에피소드 로딩 리스트
  query += mysql.format(Q_SELECT_MISSION_ALL, [
    lang,
    lang,
    userkey,
    lang,
    userkey,
    project_id,
  ]); // [10]. 미션 정보

  query += mysql.format(Q_USER_EPISODE_SCENE_PROGRESS, [userkey, project_id]); // [11] 유저별 에피소드 상황 히스토리
  query += mysql.format(Q_SELECT_SCENE_HISTORY, [userkey, project_id]); // [12] 유저, 프로젝트에서 경험한 모든 사건 ID 목록
  query += mysql.format(Q_USER_EPISODE_PURCHASE, [userkey, project_id]); // [13] 에피소드 구매 정보
  query += mysql.format(Q_SELECT_SIDE_STORY, [
    lang,
    lang,
    lang,
    lang,
    lang,
    userkey,
    lang,
    userkey,
    lang,
    userkey,
    userkey,
    lang,
    userkey,
    lang,
    userkey,
    project_id,
  ]); // [14]. 에피소드 사이드 스토리
  query += mysql.format(Q_SELECT_EPISODE_PROGRESS, [userkey, project_id]); //  [15]. 에피소드 progress
  query += mysql.format(Q_SELECT_EPISODE_HISTORY, [userkey, project_id]); // [16]. 에피소드 히스토리
  query += mysql.format(Q_SELECT_PROJECT_ALL_BG, [project_id]); // [17] 프로젝트 모든 배경
  query += mysql.format(Q_SELECT_PROJECT_ALL_EMOTICONS, [project_id]); // [18] 프로젝트 모든 이모티콘
  query += mysql.format(Q_SELECT_ENDING_HINT, [project_id]); // [19] 엔딩 힌트
  query += mysql.format(Q_SELECT_SELECTION_HINT_PURCHASE, [
    project_id,
    userkey,
  ]); // [20] 선택지 힌트 구매
  query += mysql.format(
    `SELECT * FROM user_mission_all_clear WHERE userkey = ? AND project_id = ?;`,
    [userkey, project_id]
  ); // [21] 미션 올 클리어
  query += mysql.format(Q_SELECT_PREMIUM_PASS_REWARD, [
    userkey,
    project_id,
    project_id,
  ]); // [22] 프리미엄 패스 챌린지 보상 리스트

  // * 모인 쿼리 실행
  const result = await slaveDB(query);

  if (!result.state) {
    logger.error(result.error);
    return null;
  }

  // * 일부 데이터 포장하기

  // [19]. 이모티콘
  const emoticons = {};
  result.row[19].forEach((item) => {
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

  // 캐릭터 모델 파일 포장하기
  const models = {};
  const modelfile = result.row[5];
  modelfile.forEach((item) => {
    if (!Object.prototype.hasOwnProperty.call(models, item.model_name)) {
      models[item.model_name] = [];
    }

    models[item.model_name].push(item); // 배열에 추가
  }); // 캐릭터 모델 포장 끝.

  // 라이브 오브제 파일 포장하기
  const liveObjects = {};
  const liveObjectFile = result.row[6];
  liveObjectFile.forEach((item) => {
    if (
      !Object.prototype.hasOwnProperty.call(liveObjects, item.live_object_name)
    ) {
      liveObjects[item.live_object_name] = [];
    }

    liveObjects[item.live_object_name].push(item); // 배열에 추가
  }); // 라이브 오브제 포장 끝

  // 라이브 일러스트
  const liveIllusts = {};
  const liveIllustFile = result.row[7];
  liveIllustFile.forEach((item) => {
    // 키 없으면 추가해준다.
    if (
      !Object.prototype.hasOwnProperty.call(liveIllusts, item.live_illust_name)
    ) {
      liveIllusts[item.live_illust_name] = [];
    }

    liveIllusts[item.live_illust_name].push(item); // 배열에 추가한다.
  }); // 라이브 일러스트 포장 끝

  //미션 힌트
  if (result.row[10].length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row[10]) {
      const { hint } = item;
      const hints = [];

      if (hint !== "") {
        const hintArr = String(hint).split(",");
        for (let i = 0; i < hintArr.length; i++) {
          if (String(hint).includes(":")) {
            //사건
            hints.push({
              episode_id: hintArr[i].split(":")[0], //에피소드ID
              played: hintArr[i].split(":")[1], //플레이건수
              total: hintArr[i].split(":")[2], //토탈
            });
          } else {
            //에피소드
            hints.push(hintArr[i]);
          }
        }
      }
      item.hint = hints;
    }
  }

  // [11] 씬 프로그레스
  const scenceProgress = [];
  if (result.row[11].length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row[11]) {
      scenceProgress.push(item.scene_id);
    }
  }

  // [12] 씬 히스토리
  const scenceHistory = [];
  if (result.row[12].length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row[12]) {
      scenceHistory.push(item.scene_id);
    }
  }

  // [15] 에피소드 프로그레스
  const episodeProgress = [];
  if (result.row[15].length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row[15]) {
      episodeProgress.push(item.episode_id);
    }
  }

  // [16] 에피소드 히스토리
  const episodeHistory = [];
  if (result.row[16].length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row[16]) {
      episodeHistory.push(item.episode_id);
    }
  }

  // [19] 엔딩 힌트에 능력치 조건 추가
  if (result.row[19].length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row[19]) {
      let { ability_condition } = item;
      const abilitys = [];

      ability_condition = ability_condition.toString().replace(" ", ""); //공백 모두 제거
      if (ability_condition) {
        const abilityArr = ability_condition.split(","); //값이 여러개인 경우 ,(콤마) 기준으로 split

        for (let i = 0; i < abilityArr.length; i++) {
          let operator = ``;
          if (abilityArr[i].includes("<=")) {
            operator = "<=";
          } else if (abilityArr[i].includes(">=")) {
            operator = ">=";
          } else if (abilityArr[i].includes("<")) {
            operator = "<";
          } else if (abilityArr[i].includes(">")) {
            operator = ">";
          } else {
            operator = "=";
          }

          const ability = abilityArr[i].split(operator); //operator 기준으로 split

          abilitys.push({
            speaker: ability[0].split("_")[0].replace("@", ""), //화자
            ability_name: ability[0].split("_")[1], //능력치명
            operator, //연산자
            value: ability[1], //수치
          });
        }
      }

      item.ability_condition = abilitys;
    }
  }

  // [14] 스페셜 에피소드 힌트 관련 에피소드 추가
  if (result.row[14].length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row[14]) {
      const { side_hint } = item;
      const hints = [];

      if (side_hint !== "") {
        const hintArr = String(side_hint).split(",");
        for (let i = 0; i < hintArr.length; i++) {
          if (String(side_hint).includes(":")) {
            //사건
            hints.push({
              episode_id: hintArr[i].split(":")[0], //에피소드ID
              played: hintArr[i].split(":")[1], //플레이건수
              total: hintArr[i].split(":")[2], //토탈
            });
          } else {
            //에피소드
            hints.push(hintArr[i]);
          }
        }
      }
      item.side_hint = hints;
    }
  }

  // [20] 선택지 힌트 구매
  const selectionHintPurchase = {};
  if (result.row[20].length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row[20]) {
      // 키 없으면 추가해준다.
      if (
        !Object.prototype.hasOwnProperty.call(
          selectionHintPurchase,
          item.episode_id.toString()
        )
      ) {
        selectionHintPurchase[item.episode_id.toString()] = [];
      }

      selectionHintPurchase[item.episode_id.toString()].push(item); // 배열에 추가한다.
    }
  }

  // [22] 프리미엄 챌린지 보상
  let premiumMaster = {};
  const premiumDetail = {};
  if (result.row[22].length > 0) {
    let index = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row[22]) {
      //마스터
      if (index === 0) {
        premiumMaster = {
          premium_id: item.premium_id,
          product_id: item.product_id,
          product_price: item.product_price,
          sale_id: item.sale_id,
          sale_price: item.sale_price,
          step: item.step,
        };
      }

      //디테일
      // 키 없으면 추가해준다.
      if (
        !Object.prototype.hasOwnProperty.call(
          premiumDetail,
          item.chapter_number.toString()
        )
      ) {
        premiumDetail[item.chapter_number.toString()] = {};
      }

      premiumDetail[item.chapter_number.toString()] = {
        detail_no: item.detail_no,
        free_currency: item.free_currency,
        free_quantity: item.free_quantity,
        free_reward_date: item.free_reward_date,
        premium_currency: item.premium_currency,
        premium_quantity: item.premium_quantity,
        premium_reward_date: item.premium_reward_date,
        premium_id: item.premium_id,
      };

      index += 1;
    }
  }

  responseData.detail = result.row[0];
  responseData.dressCode = result.row[1];
  responseData.nametag = result.row[2];
  responseData.bgms = result.row[3];
  responseData.illusts = result.row[4];
  responseData.backgrounds = result.row[17];
  responseData.emoticons = emoticons;
  responseData.models = models;
  responseData.liveObjects = liveObjects;
  responseData.liveIllusts = liveIllusts;
  responseData.minicuts = result.row[8];
  responseData.episodeLoadingList = result.row[9];
  responseData.missions = result.row[10];
  responseData.sceneProgress = scenceProgress;
  responseData.sceneHistory = scenceHistory;
  responseData.episodeProgress = episodeProgress;
  responseData.episodeHistory = episodeHistory;
  responseData.dressProgress = [];
  responseData.episodePurchase = result.row[13];
  responseData.sides = result.row[14];
  responseData.endingHint = result.row[19];
  responseData.selectionHintPurchase = selectionHintPurchase;
  responseData.missionAllClear = result.row[21].length > 0 ? 1 : 0;
  responseData.premiumMaster = premiumMaster;
  responseData.premiumDetail = premiumDetail;

  return responseData;
};

// * 2023.01 오토메 프로젝트 리소스 가져오기
export const getOtomeProjectResources = async (project_id, lang, userkey) => {
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
  query += mysql.format(Q_USER_EPISODE_PURCHASE, [userkey, project_id]); // [12] 에피소드 구매 정보

  //////
  query += mysql.format(Q_SELECT_EPISODE_PROGRESS, [userkey, project_id]); //  [13]. 에피소드 progress
  query += mysql.format(Q_SELECT_EPISODE_HISTORY, [userkey, project_id]); // [14]. 에피소드 히스토리
  query += mysql.format(Q_SELECT_PROJECT_ALL_BG, [project_id]); // [15] 프로젝트 모든 배경
  query += mysql.format(Q_SELECT_PROJECT_ALL_EMOTICONS, [project_id]); // [16] 프로젝트 모든 이모티콘

  // * 모인 쿼리 실행
  const result = await slaveDB(query);

  if (!result.state) {
    logger.error(result.error);
    return null;
  }

  // * 데이터 포장하기
  const emoticons = collectEmoticonData(result.row[16]);
  const models = collectModelData(result.row[5]);
  const liveObjects = collectLiveObjectData(result.row[6]);
  const liveIllusts = collectLiveIllustData(result.row[7]);
  const sceneProgress = collectSceneID(result.row[10]);
  const sceneHistory = collectSceneID(result.row[11]);
  const episodeProgress = collectEpisodeID(result.row[13]);
  const episodeHistory = collectEpisodeID(result.row[14]);

  // 결과
  responseData.detail = result.row[0];
  responseData.dressCode = result.row[1];
  responseData.nametag = result.row[2];
  responseData.bgms = result.row[3];
  responseData.illusts = result.row[4];

  responseData.backgrounds = result.row[15];
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

  responseData.episodePurchase = result.row[12];

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

// * 유저가 선택한 스토리(프로젝트) 정보 가져오기
// * 작품 상세화면에 진입이 정보를 아주 많이! 가져온다.
// ! 중요
// * ## 작품상세정보
export const getUserSelectedStory = async (req, res) => {
  const {
    body: {
      userkey,
      project_id,
      userBubbleVersion = 0,
      clientBubbleSetID = -1,
      lang = "KO",
    },
  } = req;

  //로그용으로 쌓기 위해 추가
  logAction(userkey, "project_enter", req.body);

  // * 유저 정보
  const userInfo = {
    userkey,
    project_id,
    userBubbleVersion,
    clientBubbleSetID,
    lang,
  };

  // 프로젝트에 연결된 BubbleSet ID, Version 정보 추가
  let ProjectBubbleSetId = parseInt(clientBubbleSetID, 10);
  const result = await slaveDB(
    "SELECT * FROM list_project_master WHERE project_id = ?;",
    [project_id]
  );
  if (result.state && result.row.length > 0) {
    if (ProjectBubbleSetId !== result.row[0].bubble_set_id)
      ProjectBubbleSetId = result.row[0].bubble_set_id;
  }

  //버전 셋팅
  let bubbleMaster = "";
  const bubbleMasterCache = cache.get("bubble").bubbleMaster;
  bubbleMasterCache.forEach((item) => {
    if (item.bubbleID === ProjectBubbleSetId) bubbleMaster = item;
  });
  if (bubbleMaster === "") bubbleMaster = { bubbleID: 25, bubble_ver: 1 }; //없으면 디폴트로

  // 프로젝트와 연결된 말풍선 세트 정보를 따로 갖고 있는다. (아래에서 비교)
  userInfo.bubbleID = bubbleMaster.bubbleID;
  userInfo.bubble_ver = bubbleMaster.bubble_ver;

  // logger.info(`>>> getUserSelectedStory [${JSON.stringify(userInfo)}]`);

  const storyInfo = {}; // * 결과값

  // * 스토리 프로필 15 버전부터 추가 (2022.02.21)
  storyInfo.storyProfile = await getUserStoryProfile(req, res, false); // 작품별 프로필

  storyInfo.galleryImages = await getUserGalleryHistory(userInfo); // 갤러리 공개 이미지
  storyInfo.projectCurrent = await getUserProjectCurrent(userInfo); // 프로젝트 현재 플레이 지점 !

  // * 로딩 정보 추가
  const currentLoadingData = await getCurrentLoadingData(
    userInfo.project_id,
    storyInfo.projectCurrent[0].episode_id,
    userInfo.lang
  );
  storyInfo.loading = currentLoadingData.loading;
  storyInfo.loadingDetail = currentLoadingData.loadingDetail;

  const projectResources = await getProjectResources(
    userInfo.project_id,
    userInfo.lang,
    userInfo.userkey
  );
  if (projectResources == null) {
    respondDB(res, 80026, "프로젝트 리소스 로딩 오류");
    return;
  }

  storyInfo.backgrounds = projectResources.backgrounds;
  storyInfo.emoticons = projectResources.emoticons;

  storyInfo.detail = projectResources.detail; // 상세정보
  storyInfo.dressCode = projectResources.dressCode; // 의상정보
  storyInfo.nametag = projectResources.nametag; // 네임태그
  storyInfo.bgms = projectResources.bgms; // BGM
  storyInfo.illusts = projectResources.illusts; // 이미지 일러스트
  storyInfo.minicuts = projectResources.minicuts; // 미니컷
  storyInfo.models = projectResources.models; // 캐릭터 모델 정보
  storyInfo.liveObjects = projectResources.liveObjects; // 라이브 오브젝트
  storyInfo.liveIllusts = projectResources.liveIllusts; // 라이브 일러스트
  storyInfo.bubbleSprite =
    cache.get("bubble").bubbleSprite[userInfo.bubbleID.toString()]; // 프로젝트 말풍선 스프라이트 정보
  storyInfo.episodeLoadingList = projectResources.episodeLoadingList; // 에피소드 로딩 리스트
  storyInfo.missions = projectResources.missions; // 프로젝트의 모든 도전과제

  //* 사건 정보
  storyInfo.sceneProgress = projectResources.sceneProgress; // 유저 사건ID 진행도
  // console.log(storyInfo.sceneProgress);
  storyInfo.sceneHistory = projectResources.sceneHistory; // 유저가 한번이라도 오픈한 프로젝트별 사건ID (신규 입력만, 삭제나 변경 없음)
  //* 에피소드 정보
  storyInfo.episodeProgress = projectResources.episodeProgress; // ! 유저 에피소드 진행도
  storyInfo.episodeHistory = projectResources.episodeHistory; // 유저 에피소드 히스토리
  storyInfo.episodePurchase = projectResources.episodePurchase; // 에피소드 구매 정보
  storyInfo.sides = projectResources.sides; // 유저의 사이드 에피소드 리스트

  // storyInfo.premiumPrice = await getCurrentProjectPassPrice(userInfo); // 현재 작품의 프리미엄 패스 가격정보

  storyInfo.selectionProgress = await getUserProjectSelectionProgress(userInfo); // 프로젝트 선택지 Progress

  const voiceData = await getUserVoiceHistory(userInfo);
  storyInfo.voiceHistory = voiceData.voiceHistory; // 화자별로 포장된 보이스
  storyInfo.rawVoiceHistory = voiceData.rawVoiceHistory; // 리스트 그대로 형태의 보이스
  storyInfo.episodes = await requestMainEpisodeList(userInfo); // 유저의 정규 에피소드 리스트

  // 작품 기준정보
  storyInfo.bgmBanner = await getProjectBgmBannerInfo(userInfo); // BGM 배너
  storyInfo.freepassBadge = await getProjectFreepassBadge(userInfo); // 프리패스 뱃지
  storyInfo.bubbleMaster = bubbleMaster; // 말풍선 마스터 정보

  // * 말풍선 상세 정보 (버전체크를 통해서 필요할때만 내려준다)
  // 버전 + 같은 세트 ID인지도 체크하도록 추가.
  if (
    userInfo.userBubbleVersion != userInfo.bubble_ver ||
    userInfo.clientBubbleSetID != userInfo.bubbleID
  ) {
    // logger.info(`!!! Response with BubbleSetDetail`);
    const allBubbleSet =
      cache.get("bubble").bubbleSet[userInfo.bubbleID.toString()];

    // 말풍선 세트를 Variation, Template 별로 정리합니다.
    storyInfo.bubbleSet = arrangeBubbleSet(allBubbleSet);
  } // ? 말풍선 상세정보 끝

  storyInfo.ability = await getUserProjectAbilityCurrent(userInfo); //유저의 현재 능력치 정보
  storyInfo.rawStoryAbility = await getUserStoryAbilityRawList(req.body); // 스토리에서 획득한 능력치 Raw 리스트
  storyInfo.selectionPurchase = await getUserSelectionPurchaseInfo(userInfo); // 과금 선택지 정보
  storyInfo.selectionHistory = await getUserStorySelectionHistory(req.body); // 선택지 히스토리

  storyInfo.endingHint = projectResources.endingHint; //엔딩힌트
  storyInfo.selectionHintPurchase = projectResources.selectionHintPurchase; //선택지힌트 구매
  storyInfo.missionAllClear = projectResources.missionAllClear; //미션 올클리어
  storyInfo.premiumMaster = projectResources.premiumMaster; //프리미엄 패스 마스터
  storyInfo.premiumDetail = projectResources.premiumDetail; //프리미엄 패스 디테일

  // response
  res.status(200).json(storyInfo);
};

// * 유저가 보유한 재화 (꾸미기 가능 재화 한정) 리스트
export const getProfileCurrencyOwnList = async (req, res) => {
  logger.info(`getProfileCurrencyOwnList`);

  const {
    body: { userkey },
  } = req;

  const responseData = {};
  // 재화별로 리스트 가져오기
  const result = await DB(
    `
  SELECT 
  a.currency
  , fn_get_design_info(icon_image_id, 'url') icon_url
  , fn_get_design_info(icon_image_id, 'key') icon_key
  , CASE WHEN currency_type = 'wallpaper' THEN 
    fn_get_bg_info(resource_image_id, 'url') 
  ELSE 
    fn_get_design_info(resource_image_id, 'url') 
  END currency_url
  , CASE WHEN currency_type = 'wallpaper' THEN 
    fn_get_bg_info(resource_image_id, 'key') 
  ELSE 
    fn_get_design_info(resource_image_id, 'key') 
  END currency_key
  , currency_type
  , fn_get_user_property(?, a.currency) total_cnt
  , (SELECT ifnull(count(*), 0) FROM user_profile_currency WHERE userkey = ? AND currency = a.currency) current_cnt
  FROM user_property a, com_currency b 
  WHERE a.currency = b.currency 
  AND userkey = ? 
  AND NOW() < expire_date 
  GROUP BY a.currency
  ORDER BY a.currency
  ;`,
    [userkey, userkey, userkey]
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const item of result.row) {
    if (
      !Object.prototype.hasOwnProperty.call(responseData, item.currency_type)
    ) {
      responseData[item.currency_type] = [];
    }

    responseData[item.currency_type].push({
      //선택지
      currency: item.currency,
      icon_url: item.icon_url,
      icon_key: item.icon_key,
      currency_url: item.currency_url,
      currency_key: item.currency_key,
      total_cnt: item.total_cnt,
      current_cnt: item.current_cnt,
    });
  }

  res.status(200).json(responseData);
};

// * 프리미엄 패스 구매하기 (2022.08.10)
export const purchasePremiumPass = async (req, res) => {
  const {
    body: { userkey, project_id, price = 0 },
  } = req;

  // 이미 프리패스 구매자인지 체크
  const premiumPassExists = await slaveDB(`
  SELECT upp.project_id 
  FROM user_premium_pass upp 
 WHERE upp.userkey = ${userkey}
   AND upp.project_id = ${project_id};
  `);

  // 이미 기존에 구매한 경우에 대한 처리
  if (premiumPassExists.row.length > 0) {
    respondDB(res, 80060, "이미 프리패스를 구매하였습니다.");
    return;
  }

  // * 프리패스 구매에 필요한 가격 조회 및 보유량 체크
  const currentGem = await getCurrencyQuantity(userkey, "gem"); // 현재 유저의 젬 보유량

  const serverValidation = await slaveDB(`
  SELECT fn_get_discount_pass_price(${userkey}, ${project_id}) server_price
   FROM DUAL;
  `);

  // 서버에서 검증을 위해, 가격 한번 더 체크한다.
  const serverPrice = serverValidation.row[0].server_price;
  logger.info(
    `purchaseFreepass [${userkey}] param [${price}], serverPrice [${serverPrice}]`
  );

  // 여기서 이상한 유저들 걸러낸다.
  // 서버 검증 가격보다 파라매터 가격이 싼 경우 의심한다.
  if (price < serverPrice) {
    logger.error(`Error in purchasePremiumPass ${JSON.stringify(req.body)}`);
    respondDB(res, 80026, "Error in premium pass purchase");
    return;
  }

  // 현재 보유량이 가격보다 적은 경우! return
  if (currentGem < price) {
    respondDB(res, 80014, "젬이 부족합니다");
    return;
  } // ? 젬 부족

  // 조건들을 다 통과했으면 실제 구매처리를 시작한다.
  // TransactionDB 사용
  // purchase_no 2로 입력한다.
  let useQuery = mysql.format(`
  INSERT INTO user_premium_pass (userkey, project_id, purchase_no, star_price) VALUES(${userkey}, ${project_id}, 1, ${price});
  `);

  useQuery += mysql.format(
    `CALL sp_use_user_property(?, 'gem', ?, 'freepass', ?);`,
    [userkey, price, project_id]
  );

  // 최종 재화 소모 및, 프리패스 구매 처리
  const finalResult = await transactionDB(`${useQuery}`);

  if (!finalResult.state) {
    respondDB(res, 80059, finalResult.error);
    return;
  }

  // * 성공했으면 bank와 userProperty(프로젝트) 갱신해서 전달해주기
  const responseData = {};
  responseData.bank = await getUserBankInfo(req.body);
  responseData.project_id = project_id; // 콜백처리용도

  res.status(200).json(responseData);

  /*
  logDB(
    `INSERT INTO log_freepass (userkey, project_id, freepass_no, price) VALUES(${userkey}, ${project_id}, ${timedeal_id}, ${salePrice});`
  );
  */

  logAction(userkey, "freepass", req.body);
}; // ? 프리미엄 패스 구매 종료

//! 튜토리얼 리뉴얼
export const requestUserTutorialProgress = async (req, res) => {
  const {
    body: { userkey, step = 1, is_clear = 0 },
  } = req;

  let result;
  let isOpen = false;
  let isReward = false;

  //단계 건너 뛰고 진행했는지 확인
  // * 단계 건너띄는 케이스가 생겨서 아래 조건 주석처리
  /* 
  if (step > 1) {
    //이전 진행단계 개수 확인
    result = await DB(
      `SELECT is_clear FROM user_tutorial_ver2 WHERE userkey = ? AND step < ?;`,
      [userkey, step]
    );
    if (!result.state || result.row.length !== step - 1) {
      logger.error(`getTutorialRenewalProgress Error 1-1`);
      respondDB(res, 80019);
      return;
    }

    //이전 단계 클리어 안했는지 확인
    result = await DB(
      `SELECT * FROM user_tutorial_ver2 WHERE userkey = ? AND step < ? AND is_clear = 0;`,
      [userkey, step]
    );
    if (!result.state || result.row.length > 0) {
      logger.error(`getTutorialRenewalProgress Error 1-2`);
      respondDB(res, 80019);
      return;
    }
  }
  */

  //단계가 있는지 확인
  result = await DB(
    `SELECT * FROM user_tutorial_ver2 WHERE userkey = ? AND step = ?;`,
    [userkey, step]
  );
  if (result.state && result.row.length > 0) isOpen = true;

  if (!isOpen) {
    // 해당 단계 오픈
    result = await DB(
      `INSERT INTO user_tutorial_ver2(userkey, step) VALUES(?, ?);`,
      [userkey, step]
    );
  } else {
    // eslint-disable-next-line no-lonely-if
    if (is_clear === 1) {
      result = await DB(
        `UPDATE user_tutorial_ver2 SET is_clear = ?, clear_date = now() WHERE userkey = ? AND step = ?;`,
        [is_clear, userkey, step]
      );
    }
  }

  if (!result.state) {
    logger.error(`getTutorialRenewalProgress Error 2 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  //튜토리얼 보상 처리(1, 3단계에서만 보상 획득)
  if (isOpen && is_clear && (step === 1 || step === 3)) {
    await addUserProperty(userkey, "coin", 100, "tutorial_ver2");
    isReward = true;
  }

  const accountInfo = {};

  //유저의 현재 튜토리얼 단계 가져오기
  result = await DB(
    `
  SELECT step tutorial_step
  , ifnull(is_clear, 0) tutorial_clear
  FROM user_tutorial_ver2 
  WHERE userkey = ? 
  ORDER BY step DESC 
  LIMIT 1;`,
    [userkey]
  );
  accountInfo.tutorial_current = result.row;

  //보상받는 경우, 뱅크값 갱신
  if (isReward) {
    accountInfo.bank = await getUserBankInfo(req.body);
  }

  res.status(200).json(accountInfo);

  logAction(userkey, "tutorial_ver2", req.body);
};

// * 유저의 active 타임딜 찾기
export const getUserActiveTimeDeal = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  const selectResult = await DB(`
  SELECT a.project_id
  , a.timedeal_id 
  , date_format(a.end_date, '%Y-%m-%d %T') end_date
  , a.discount 
  FROM user_pass_timedeal a
  WHERE a.userkey = ${userkey}
  AND now() < end_date 
  AND a.end_date = (SELECT max(z.end_date) FROM user_pass_timedeal z WHERE z.userkey = a.userkey AND z.project_id = a.project_id);
  `);

  selectResult.row.forEach((item) => {
    const endDate = new Date(item.end_date);
    item.end_date_tick = endDate.getTime(); // tick 넣어주기!
  });

  res.status(200).json(selectResult.row);
};

//! 선택지 힌트 결제 및 팝업
export const requestSelectionHint = async (req, res) => {
  const {
    body: {
      userkey,
      lang = "KO",
      project_id = -1,
      episode_id = -1,
      selection_group = -1,
      selection_no = -1,
    },
  } = req;

  const responseData = {};
  let purchaseCheck = false;
  let totalPrice = 0;
  let scene_id = null;

  // 해당 선택지의 타겟씬id 조회
  let result = await slaveDB(
    `
  SELECT target_scene_id
  FROM list_script 
  WHERE episode_id = ? 
  AND lang = ? 
  AND selection_group = ? 
  AND selection_no = ?;
  `,
    [episode_id, lang, selection_group, selection_no]
  );
  if (result.state && result.row.length > 0)
    scene_id = result.row[0].target_scene_id;

  // 이전에 결제했는지 확인
  result = await DB(
    `
  SELECT * 
  FROM user_selection_hint_purchase 
  WHERE userkey = ? 
  AND episode_id = ? 
  AND selection_group = ? 
  AND selection_no = ?;`,
    [userkey, episode_id, selection_group, selection_no]
  );
  if (result.state && result.row.length === 0) purchaseCheck = true;

  // 리스트
  result = await DB(
    `
  SELECT ending_id 
  , fn_get_episode_title_lang(ending_id, ?) title 
  , fn_get_ending_type_lang(ending_id, ?) ending_type
  , price
  FROM com_ending_hint 
  WHERE project_id = ? 
  AND find_in_set(?, unlock_scenes);
  `,
    [lang, lang, project_id, scene_id]
  );
  if (result.state && result.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      totalPrice += item.price;
    }
  }

  responseData.list = result.row;

  let currentQuery = ``;
  let updateQuery = ``;

  // 결제
  if (purchaseCheck) {
    const userCoin = await getCurrencyQuantity(userkey, "coin");

    if (userCoin < totalPrice) {
      respondDB(res, 80013, "Charge your coin");
      return;
    }

    //코인 사용
    currentQuery = `CALL sp_use_user_property(?,?,?,?,?);`;
    updateQuery += mysql.format(currentQuery, [
      userkey,
      "coin",
      totalPrice,
      "selection_hint",
      project_id,
    ]);

    //히스토리 누적
    currentQuery = `
    INSERT INTO user_selection_hint_purchase(userkey, project_id, episode_id, scene_id, selection_group, selection_no, price) 
    VALUES(?, ?, ?, ?, ?, ?, ?);`;
    updateQuery += mysql.format(currentQuery, [
      userkey,
      project_id,
      episode_id,
      scene_id,
      selection_group,
      selection_no,
      totalPrice,
    ]);

    result = await transactionDB(updateQuery);
    if (!result.state) {
      logger.error(`requestSelectionHint Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  const selectionHintPurchase = {};
  result = await DB(Q_SELECT_SELECTION_HINT_PURCHASE, [project_id, userkey]);
  if (result.state && result.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      // 키 없으면 추가해준다.
      if (
        !Object.prototype.hasOwnProperty.call(
          selectionHintPurchase,
          item.episode_id.toString()
        )
      ) {
        selectionHintPurchase[item.episode_id.toString()] = [];
      }

      selectionHintPurchase[item.episode_id.toString()].push(item); // 배열에 추가한다.
    }
  }
  responseData.selectionHintPurchase = selectionHintPurchase;

  responseData.bank = await getUserBankInfo(req.body); // 뱅크 갱신

  logAction(userkey, "selection_hint", req.body);

  res.status(200).json(responseData);
};

//! 추천 알고리즘
// 2022.06.29 DB 서버 메모리 사용량(90%)까지 올라 기존의 프로시저에 있는 처리 부분을 소스로 뺌
const getRecommendPorject = async (
  userkey,
  genre,
  project_list,
  hashtag_list
) => {
  let result = "";
  let projectList = "";
  let setCaseValue = 0;
  let setProjectCount = 0;

  // 순위 정하기
  result = await slaveDB(`
  SELECT
  1 AS case_value 
  , ifnull(count(DISTINCT lpm.project_id), 0) AS project_count
  FROM list_project_master lpm, list_project_genre lpg, list_project_hashtag lph  
  WHERE lpm.project_id = lpg.project_id  
  AND lpm.project_id = lph.project_id 
  AND lpg.genre_code = '${genre}'
  AND lpm.project_id IN (${project_list})
  AND lph.hashtag_no IN (${hashtag_list})
  UNION
  SELECT 
  2 AS case_value 
  , ifnull(count(DISTINCT lpg.project_id), 0) AS project_count
  FROM list_project_genre lpg 
  WHERE lpg.project_id IN (${project_list})
  AND lpg.genre_code = '${genre}'
  UNION
  SELECT 
  3 AS case_value
  , ifnull(count(DISTINCT lph.project_id), 0) AS project_count
  FROM list_project_hashtag lph 
  WHERE lph.project_id IN (${project_list})
  AND lph.hashtag_no IN (${hashtag_list});
  `);
  if (result.state && result.row.length > 0) {
    //순위 정하기
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      const { case_value, project_count } = item;
      if (
        (case_value === 1 && project_count > 2) ||
        (case_value === 2 && project_count > 2 && setProjectCount < 3) ||
        (case_value === 3 && project_count > 2 && setProjectCount < 3)
      ) {
        setCaseValue = case_value;
        setProjectCount = project_count;
      }
    }
    if (setProjectCount < 3) setCaseValue = 0; //작품 수가 3개 미만이면, 초기화
  }

  logger.info(
    `${userkey} of recommend project >>> case: ${setCaseValue} genre: ${genre} project: ${project_list} hashtag: ${hashtag_list} `
  );

  if (setCaseValue === 1) {
    // -- 1순위(동일 장르, 1개 이상의 동일 옵션 태그)
    result = await slaveDB(`
    SELECT group_concat(DISTINCT lpm.project_id) project_list
    FROM list_project_master lpm, list_project_genre lpg, list_project_hashtag lph  
    WHERE lpm.project_id = lpg.project_id  
    AND lpm.project_id = lph.project_id 
    AND lpg.genre_code = '${genre}'
    AND lpm.project_id IN (${project_list})
    AND lph.hashtag_no IN (${hashtag_list});`);
  } else if (setCaseValue === 2) {
    //  -- 2순위(동일 장르)
    result = await slaveDB(`
    SELECT group_concat(DISTINCT lpg.project_id) project_list
		FROM list_project_genre lpg 
		WHERE lpg.project_id IN (${project_list})
		AND lpg.genre_code = '${genre}';	
    `);
  } else if (setCaseValue === 3) {
    //  -- 3순위(1개 이상의 동일 옵션 태그)
    result = await slaveDB(`
    SELECT group_concat(DISTINCT project_id) project_list
		FROM list_project_hashtag lph 
		WHERE lph.project_id IN (${project_list})
    AND lph.hashtag_no IN (${hashtag_list});    
    `);
  }
  if (result.state && result.row.length > 0) {
    projectList = result.row[0].project_list;
  }

  return projectList;
};

//! 추천 작품 리스트 추출(최대 3개까지)
const pushRecommendProject = async (projectList) => {
  const projectArr = [];

  let whereQuery = ``;
  if (projectList) whereQuery = `WHERE project_id IN (${projectList}) `;

  //조회순 높은 순으로 3개 추출
  const result = await slaveDB(`      
  SELECT project_id
  FROM gamelog.stat_project_sum
  ${whereQuery}
  ORDER BY hit_count DESC
  LIMIT 3;`);
  if (result.state && result.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      projectArr.push(item.project_id);
    }
  }
  return projectArr;
};

//! 추전 작품 리스트
export const requestRecommendProject = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  const responseData = {};

  //추천 작품 알고리즘 처리
  responseData.project_id = [];
  const result = await slaveDB(`
  SELECT 
  DISTINCT ifnull(upc.project_id, '') AS last_played_project
  , fn_get_not_play_project_ver2(${userkey}) not_play_project 
  , fn_get_project_genre(upc.project_id) AS genre
  , group_concat(lph.hashtag_no) hashtag_list
  FROM user_project_current upc, list_project_hashtag lph
  WHERE upc.userkey = ${userkey}
  AND upc.project_id = lph.project_id
  AND upc.update_date = fn_get_max_project_current_time(${userkey}); 
  `);
  if (result.state && result.row.length > 0) {
    //마지막 플레이 작품, 모든 작품 플레이 확인, 플레이 하지 않은 작품 리스트
    const {
      last_played_project = "",
      not_play_project = "",
      genre,
      hashtag_list,
    } = result.row[0];

    //아직 모든 작품을 플레이 하지 않은 경우(플레이를 아예 안했거나 다한 경우 제외)
    if (last_played_project && not_play_project) {
      const project_list = await getRecommendPorject(
        userkey,
        genre,
        not_play_project,
        hashtag_list
      );
      responseData.project_id = await pushRecommendProject(project_list);
    }
  }
  responseData.project_id = [];

  res.status(200).json(responseData);
};

//! 프리미엄 챌린지 보상
export const getPremiumReward = async (req, res) => {
  const {
    body: { userkey, project_id, premium_id, chapter_number, kind = 0 },
  } = req;

  let result = "";
  let currentQuery = "";
  let updateQuery = "";
  const responseData = {};

  //이미 받았는지 확인
  result = await DB(
    `SELECT * FROM user_premium_reward WHERE userkey = ${userkey} AND project_id = ${project_id} AND premium_id = ${premium_id} AND chapter_number = ${chapter_number};`
  );
  if (result.state && result.row.length > 0) {
    const { free_reward_date, premium_reward_date } = result.row[0];

    if (
      (kind === 0 && free_reward_date) ||
      (kind === 1 && premium_reward_date)
    ) {
      logger.error(`already received ${JSON.stringify(req.body)}`);
      respondDB(res, 80025, "already rewarded");
      return;
    }
  }

  //프리미엄 패스 유저인지 확인
  if (kind === 1) {
    result = await DB(
      `SELECT * FROM user_premium_pass WHERE userkey = ? AND project_id = ?;`,
      [userkey, project_id]
    );
    if (!result.state || result.row.length === 0) {
      logger.error(`getPremiumReward Error`);
      respondDB(res, 80039);
      return;
    }
  }

  //보상 조회
  result = await DB(
    `
  SELECT 
  ifnull(upr.reward_no, 0) AS reward_no 
  , free_currency 
  , free_quantity 
  , premium_currency 
  , premium_quantity 
  FROM com_premium_detail cpd
  LEFT OUTER JOIN user_premium_reward upr 
  ON cpd.premium_id = upr.premium_id AND cpd.chapter_number = upr.chapter_number AND upr.userkey = ?
  WHERE cpd.premium_id = ? 
  AND cpd.chapter_number = ?;`,
    [userkey, premium_id, chapter_number]
  );
  if (result.state && result.row.length > 0) {
    const {
      reward_no,
      free_currency,
      free_quantity,
      premium_currency,
      premium_quantity,
    } = result.row[0];

    let currency = free_currency;
    let quantity = free_quantity;
    if (kind === 1) {
      currency = premium_currency;
      quantity = premium_quantity;
    }

    //보상 지급(우편전송)
    currentQuery = `
    INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
    VALUES(?, 'challenge', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), ?);
    `;
    updateQuery += mysql.format(currentQuery, [
      userkey,
      currency,
      quantity,
      project_id,
    ]);

    //히스토리 내역
    if (reward_no === 0) {
      //새로 누적
      let free_reward_date = "NULL";
      let premium_reward_date = "NULL";

      if (kind === 0) free_reward_date = "now()";
      else premium_reward_date = "now()";

      currentQuery = `
      INSERT INTO user_premium_reward(userkey, project_id, premium_id, chapter_number, free_reward_date, premium_reward_date) 
      VALUES(${userkey}, ${project_id}, ${premium_id}, ${chapter_number}, ${free_reward_date}, ${premium_reward_date});
      `;
    } else if (kind === 0) {
      //무료 보상
      currentQuery = `
      UPDATE user_premium_reward
      SET free_reward_date = now()
      WHERE reward_no = ${reward_no};
      `;
    } else {
      //프리미엄 보상
      currentQuery = `
      UPDATE user_premium_reward
      SET premium_reward_date = now()
      WHERE reward_no = ${reward_no};
      `;
    }
    updateQuery += mysql.format(currentQuery);

    result = await transactionDB(updateQuery);
    if (!result.state) {
      logger.error(`getPremiumReward Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  responseData.unreadMailCount = await getUserUnreadMailCount(userkey);
  result = await DB(
    `SELECT * FROM user_premium_reward WHERE userkey = ? AND project_id = ?;`,
    [userkey, project_id]
  );
  responseData.premiumReward = result.row;

  res.status(200).json(responseData);
};
