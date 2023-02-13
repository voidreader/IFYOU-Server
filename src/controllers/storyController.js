import mysql from "mysql2/promise";
import { response } from "express";

import { DB, slaveDB, transactionDB } from "../mysqldb";
import {
  Q_SCRIPT_CHARACTER_EXPRESSION_DROPDOWN,
  Q_SELECT_PROJECT_MODEL,
} from "../QStore";
import { logger } from "../logger";
import { respond, respondRedirect, respondDB } from "../respondent";

// * 작품의 현재 프리미엄 패스 가격
export const getCurrentProjectPassPrice = async ({ userkey, project_id }) => {
  const result = await DB(`
  SELECT fn_get_origin_pass_price (${project_id}) origin_price
     , ROUND(fn_get_current_pass_price(${userkey}, ${project_id}), 2) discount
  FROM DUAL;
  `);

  if (!result.state || result.row.length === 0) {
    return {};
  }

  const { origin_price, discount } = result.row[0];
  const sale_price = Math.floor(origin_price - origin_price * discount);

  const responseData = { origin_price, sale_price, discount };

  return responseData;
};

// ! 스페셜 에피소드 해금 체크 -  에피소드 조건 -
export const checkSideUnlockByEpisode = async (userInfo) => {
  // 아직 해금되지 않은 episode unlock style 사이드 에피소드 리스트
  const locekdSideList = await DB(
    `
  SELECT a.episode_id   
  , fn_get_episode_title_lang(a.episode_id, '${userInfo.lang}') title 
  , a.unlock_episodes 
  FROM list_episode a 
  WHERE a.project_id = ?
  AND a.episode_type = 'side'
  AND a.unlock_style = 'episode'
  AND a.unlock_episodes IS NOT NULL 
  AND a.unlock_episodes <> ''
  AND a.unlock_episodes LIKE CONCAT('%', ${userInfo.episodeID}, '%')
  AND a.episode_id NOT IN (SELECT z.episode_id FROM user_side z WHERE z.userkey = ?);

  `,
    [userInfo.project_id, userInfo.userkey]
  );

  if (!locekdSideList.state || locekdSideList.row.length === 0) return [];

  // console.log(" lockedSideList : ", locekdSideList.row[0]);

  // 해금되지 않은 사이드 스토리가 남아있어.!
  const histEpisodeIDs = await DB(
    `
  SELECT a.episode_id 
  FROM user_episode_hist a
 WHERE a.userkey = ?
   AND a.project_id = ?;
  `,
    [userInfo.userkey, userInfo.project_id]
  );

  const arrEpisodeIDs = []; // 배열로 변환 처리
  histEpisodeIDs.row.forEach((item) => {
    arrEpisodeIDs.push(item.episode_id.toString());
  });

  // 없으면 떙!
  if (arrEpisodeIDs.length === 0) return [];

  // console.log(`user episode hist : ${arrEpisodeIDs}`);

  // ! 이제 locekdSideList 를 한행씩 검사하는거야..!
  // 매번.. 에피소드 플레이 할때마다 체크... 더 좋은 방법이 없을까
  let unlockEpisodes = "";
  let arrUnlockEpisodes = [];
  let isUnlockPossible = true; // 언락 가능 여부 체크
  const unlockSideEpisode = []; // 리턴값. 해금된 사이드 에피소드 정보

  // forEach 시작!
  locekdSideList.row.forEach((item) => {
    isUnlockPossible = true; // true로 해놓고 시작
    unlockEpisodes = item.unlock_episodes; // unlock_episodes 컬럼 값을 가져와서
    arrUnlockEpisodes = unlockEpisodes.split(","); // 콤마로 구분해서 배열을 처리한다.
    // console.log("target unlock episodes : ", arrUnlockEpisodes);

    // arrUnlockEpisodes의 모든 에피소드ID가 user_episode_hist에 존재해야 해금이 되는거다
    arrUnlockEpisodes.forEach((unlockEpisodeID) => {
      // include로 찾는다.
      if (!arrEpisodeIDs.includes(unlockEpisodeID)) {
        // 하나라도 없으면
        isUnlockPossible = false;
      }
    }); // ? arrUnlockEpisodes forEach 끝.

    // 모든 선행 에피소드를 플레이 했다면..
    if (isUnlockPossible) {
      unlockSideEpisode.push(item); // 체크한 사이드 에피소드 정보를 push 해준다.
    }
    /////////////
  }); // ? lockedSideList forEach 끝!

  console.log(`unlockSideEpisode : `, unlockSideEpisode);

  // ! unlockSideEpisode 여기에 넣어진 사이드를 user_side에 insert 해준다.
  if (unlockSideEpisode.length === 0) return {};

  unlockSideEpisode.forEach(async (unlockSide) => {
    // sp 콜하기
    const insertSide = await DB(`CALL sp_insert_user_side(?, ?)`, [
      userInfo.userkey,
      unlockSide.episode_id,
    ]);

    if (!insertSide.state) {
      logger.error(`checkSideUnlockByEpisode Error ${insertSide.error}`);
    }
  }); // ? 신규 입력 끝

  return unlockSideEpisode;

  /////////////
  /////////////
}; // ? checkSideUnlockByEpisode 끝!

//! 사건ID 해금 조회 (삭제 대상)
export const checkSideUnlockByScene = async (userInfo) => {
  const { userkey, project_id, scene_id, lang = "KO" } = userInfo;

  const locekdSideList = await DB(
    `
  SELECT a.episode_id   
  , fn_get_episode_title_lang(a.episode_id, ?) title 
  , a.unlock_scenes 
  FROM list_episode a 
  WHERE a.project_id = ?
  AND a.episode_type = 'side'
  AND a.unlock_style = 'event'
  AND a.unlock_scenes IS NOT NULL 
  AND a.unlock_scenes <> ''
  AND find_in_set('${scene_id}', a.unlock_scenes) 
  AND a.episode_id NOT IN (SELECT z.episode_id FROM user_side z WHERE z.userkey = ?);  
  `,
    [lang, project_id, userkey]
  );

  if (!locekdSideList.state || locekdSideList.row.length === 0) return [];

  //console.log(" lockedSideList : ", locekdSideList.row[0]);

  const histSceneIDs = await DB(
    `SELECT a.scene_id 
    FROM user_scene_hist a
    WHERE a.userkey = ? AND a.project_id = ?;
    `,
    [userkey, project_id]
  );

  const arrSceneIDs = []; // 배열로 변환 처리
  histSceneIDs.row.forEach((item) => {
    arrSceneIDs.push(item.scene_id.toString());
  });

  // 없으면 떙!
  if (arrSceneIDs.length === 0) return [];

  console.log(`user scene hist : ${arrSceneIDs}`);

  let unlockScenes = "";
  let arrUnlockScenes = [];
  let isUnlockPossible = true; // 언락 가능 여부 체크
  const unlockSideEpisode = []; // 리턴값. 해금된 사이드 에피소드 정보

  // forEach 시작!
  locekdSideList.row.forEach((item) => {
    isUnlockPossible = true; // true로 해놓고 시작
    unlockScenes = item.unlock_scenes; // unlock_scenes 컬럼 값을 가져와서
    arrUnlockScenes = unlockScenes.split(","); // 콤마로 구분해서 배열을 처리한다.
    console.log("target unlock scences : ", arrUnlockScenes);

    // arrUnlockScenes의 모든 에피소드ID가 user_scene_hist에 존재해야 해금이 되는거다
    arrUnlockScenes.forEach((unlockScenceID) => {
      // include로 찾는다.
      if (!arrSceneIDs.includes(unlockScenceID)) {
        // 하나라도 없으면
        isUnlockPossible = false;
      }
    }); // ? arrUnlockScenes forEach 끝.

    // 모든 선행 에피소드를 플레이 했다면..
    if (isUnlockPossible) {
      unlockSideEpisode.push(item); // 체크한 사이드 에피소드 정보를 push 해준다.
    }
    /////////////
  }); // ? lockedSideList forEach 끝!

  console.log(`unlockSideEpisode : `, unlockSideEpisode);

  // ! unlockSideEpisode 여기에 넣어진 사이드를 user_side에 insert 해준다.
  if (unlockSideEpisode.length === 0) return {};

  unlockSideEpisode.forEach(async (unlockSide) => {
    // sp 콜하기
    const insertSide = await DB(`CALL sp_insert_user_side(?, ?)`, [
      userkey,
      unlockSide.episode_id,
    ]);

    if (!insertSide.state) {
      logger.error(`checkSideUnlockByScene Error ${insertSide.error}`);
    }
  }); // ? 신규 입력 끝

  return unlockSideEpisode;
};

//! 미션 해금 조회(에피소드)
export const checkMissionByEpisode = async (userInfo) => {
  const { userkey, project_id, episodeID, lang = "KO" } = userInfo;

  const locekdMissionList = await slaveDB(
    `
    SELECT mission_id
    , fn_get_mission_name(mission_id, ?) mission_name
    , fn_get_mission_hint(mission_id, ?) mission_hint
    ,image_url
    , image_key
    , id_condition 
    FROM list_mission
    WHERE project_id = ?
    AND mission_type = 'episode'
    AND id_condition <> ''
    AND id_condition IS NOT NULL 
    AND id_condition LIKE CONCAT('%', ?, '%')
    AND mission_id NOT IN(SELECT mission_id FROM user_mission WHERE userkey = ?);  
    `,
    [lang, lang, project_id, episodeID, userkey]
  );

  if (!locekdMissionList.state || locekdMissionList.row.length === 0) return [];

  const histEpisodeIDs = await DB(
    `SELECT a.episode_id 
    FROM user_episode_hist a
    WHERE a.userkey = ? AND a.project_id = ?;
    `,
    [userkey, project_id]
  );

  const arrEpisodeIDs = []; // 배열로 변환 처리
  histEpisodeIDs.row.forEach((item) => {
    arrEpisodeIDs.push(item.episode_id.toString());
  });

  // 없으면 떙!
  if (arrEpisodeIDs.length === 0) return {};

  console.log(`user episode hist : ${arrEpisodeIDs}`);

  let unlockEpisodes = "";
  let arrUnlockEpisodes = [];
  let isUnlockPossible = true; // 언락 가능 여부 체크
  const unlockMissions = []; // 리턴값. 해금된 미션 정보

  // forEach 시작!
  locekdMissionList.row.forEach((item) => {
    isUnlockPossible = true; // true로 해놓고 시작
    unlockEpisodes = item.id_condition; // id_condition 컬럼 값을 가져와서
    arrUnlockEpisodes = unlockEpisodes.split(","); // 콤마로 구분해서 배열을 처리한다.
    // console.log("target unlock episode : ", arrUnlockEpisodes);

    // arrUnlockEpisodes의 모든 에피소드ID가 user_episode_hist 존재해야 해금이 되는거다
    arrUnlockEpisodes.forEach((unlockEpisodeID) => {
      // include로 찾는다.
      if (!arrEpisodeIDs.includes(unlockEpisodeID)) {
        // 하나라도 없으면
        isUnlockPossible = false;
      }
    }); // ? arrEpisodeIDs forEach 끝.

    // 모든 선행 에피소드를 플레이 했다면..
    if (isUnlockPossible) {
      unlockMissions.push(item); // 체크한 사이드 에피소드 정보를 push 해준다.
    }
    /////////////
  }); // ? locekdMissionList forEach 끝!

  console.log(`unlockMission : `, unlockMissions);

  // ! unlockMissions 여기에 넣어진 사이드를 user_mission에 insert 해준다.
  if (unlockMissions.length === 0) return {};

  unlockMissions.forEach(async (unlockMission) => {
    // sp 콜하기
    const insertMission = await DB(`CALL sp_insert_user_mission(?, ?);`, [
      userkey,
      unlockMission.mission_id,
    ]);

    if (!insertMission.state) {
      logger.error(`checkMissionByEpisode Error ${insertMission.error}`);
    }
  }); // ? 신규 입력 끝

  return unlockMissions;
};

//! 미션 해금 조회(사건)
export const checkMissionByScence = async (userInfo) => {
  const { userkey, project_id, scene_id, lang = "KO" } = userInfo;

  const locekdMissionList = await DB(
    `
    SELECT mission_id
    , fn_get_mission_name(mission_id, ?) mission_name
    , fn_get_mission_hint(mission_id, ?) mission_hint
    , image_url
    , image_key
    , id_condition 
    FROM list_mission
    WHERE project_id = ?
    AND mission_type = 'event'
    AND id_condition <> ''
    AND id_condition IS NOT NULL 
    AND id_condition LIKE CONCAT('%', ?, '%')
    AND mission_id NOT IN(SELECT mission_id FROM user_mission WHERE userkey = ?);  
    `,
    [lang, lang, project_id, scene_id, userkey]
  );

  if (!locekdMissionList.state || locekdMissionList.row.length === 0) return [];

  const histSceneIDs = await DB(
    `SELECT a.scene_id 
    FROM user_scene_hist a
    WHERE a.userkey = ? AND a.project_id = ?;
    `,
    [userkey, project_id]
  );

  const arrSceneIDs = []; // 배열로 변환 처리
  histSceneIDs.row.forEach((item) => {
    arrSceneIDs.push(item.scene_id.toString());
  });

  // 없으면 떙!
  if (arrSceneIDs.length === 0) return {};

  console.log(`user scene hist : ${arrSceneIDs}`);

  let unlockScenes = "";
  let arrUnlockScenes = [];
  let isUnlockPossible = true; // 언락 가능 여부 체크
  const unlockMissions = []; // 리턴값. 해금된 미션 정보

  // forEach 시작!
  locekdMissionList.row.forEach((item) => {
    isUnlockPossible = true; // true로 해놓고 시작
    unlockScenes = item.id_condition; // id_condition 컬럼 값을 가져와서
    arrUnlockScenes = unlockScenes.split(","); // 콤마로 구분해서 배열을 처리한다.
    console.log("target unlock scence : ", unlockScenes);

    // arrUnlockEpisodes의 모든 에피소드ID가 user_episode_hist 존재해야 해금이 되는거다
    arrUnlockScenes.forEach((unlockSceneID) => {
      // include로 찾는다.
      if (!arrSceneIDs.includes(unlockSceneID)) {
        // 하나라도 없으면
        isUnlockPossible = false;
      }
    }); // ? arrEpisodeIDs forEach 끝.

    // 모든 선행 에피소드를 플레이 했다면..
    if (isUnlockPossible) {
      unlockMissions.push(item); // 체크한 사이드 에피소드 정보를 push 해준다.
    }
    /////////////
  }); // ? locekdMissionList forEach 끝!

  console.log(`unlockMission : `, unlockMissions);

  // ! unlockMissions 여기에 넣어진 사이드를 user_mission에 insert 해준다.
  if (unlockMissions.length === 0) return {};

  unlockMissions.forEach(async (unlockMission) => {
    // sp 콜하기
    const insertMission = await DB(`CALL sp_insert_user_mission(?, ?);`, [
      userkey,
      unlockMission.mission_id,
    ]);

    if (!insertMission.state) {
      logger.error(`checkMissionByScence Error ${insertMission.error}`);
    }
  }); // ? 신규 입력 끝

  return unlockMissions;
};

//! 미션 해금 조회(drop)
export const checkMissionByDrop = async (userInfo) => {
  const { userkey, project_id, mission_id, lang = "KO" } = userInfo;

  //! 미션 확인
  const missionCheck = await DB(
    `SELECT * FROM list_mission WHERE project_id = ? AND mission_id = ? AND mission_type = 'drop';`,
    [project_id, mission_id]
  );

  if (!missionCheck.state || missionCheck.row.length === 0) return [];

  //! user_mission 확인
  const userMissionCheck = await DB(
    `SELECT * FROM user_mission WHERE userkey = ? AND mission_id = ?;`,
    [userkey, mission_id]
  );

  if (!userMissionCheck.state || userMissionCheck.row.length > 0) return [];

  //! 없는 경우 해금 처리
  // sp 콜하기
  const insertMission = await DB(`CALL sp_insert_user_mission(?, ?);`, [
    userkey,
    mission_id,
  ]);

  if (!insertMission.state) {
    logger.error(`checkMissionByDrop Error 1 ${insertMission.error}`);
    return [];
  }

  const missionResult = await DB(
    `SELECT mission_id
    , fn_get_mission_name(a.mission_id, ?) mission_name
    , fn_get_mission_hint(a.mission_id, ?) mission_hint
    , image_url
    , image_key FROM list_mission a WHERE mission_id = ?;`,
    [lang, lang, mission_id]
  );

  if (!missionResult.state) {
    logger.error(`checkMissionByDrop Error 2 ${missionResult.error}`);
    return [];
  }

  if (missionResult.row.length > 0) return missionResult.row;
  else return [];
};

// 기준정보 코드 정보 조회
const getStandardCodeList = async (standard_class, res) => {
  const querystr = `
    select ls.code, ls.code_name, ls.comment from list_standard ls 
     where standard_class  = ? order by sortkey, standard_id;
  `;

  const result = await DB(querystr, [standard_class]);

  res.status(200).json(result.row);
};

const getBubbleSpriteCodeList = async (code, res) => {
  const querystr = `
  SELECT a.bubble_sprite_id code
     , a.image_name code_name
  FROM com_bubble_sprite a
 WHERE a.template = ?
 ORDER BY a.bubble_sprite_id desc
 ;

  `;

  const result = await DB(querystr, [code]);
  res.status(200).json(result.row);
};

const getStandardCodeListForExcel = async (standard_class, res) => {
  const querystr = `
    select ls.code id, ls.code_name name from list_standard ls 
     where standard_class  = ? order by standard_id;
  `;

  const result = await DB(querystr, [standard_class]);

  /*
  const arr = [];
  for (let i = 0; i < result.row.length; i++) {
    arr.push(Object.values(result.row[i]));
  }
  */

  // res.status(200).json(arr);
  res.status(200).json(result.row);
};

// 단순 배열로 받기
const getStandardCodeListForDropdown = async (standard_class, res) => {
  const querystr = `
    select ls.code_name from list_standard ls 
     where standard_class  = ? order by standard_id;
  `;

  const result = await DB(querystr, [standard_class]);

  //console.log(result.row);

  const arr = [];
  for (let i = 0; i < result.row.length; i++) {
    arr.push(result.row[i].code_name);
  }

  // res.status(200).json(arr);
  res.status(200).json(arr);
};

// 이모티콘 표현 리스트
const getEmoticonExpressionList = async (project_id, speaker, res) => {
  const querystr = `
    select les.emoticon_slave_id id, les.image_name name
    from list_emoticon_master lem
      , list_emoticon_slave les 
  where lem.project_id = ?
    and lem.emoticon_owner = ?
    and les.emoticon_master_id = lem.emoticon_master_id
    order by les.sortkey , les.emoticon_slave_id 
  `;

  const result = await DB(querystr, [project_id, speaker]);

  res.status(200).json(result.row);
};

// 프로젝트의 모든 이모티콘 리스트
const getProjectEmoticonExpressionList = async (project_id, res) => {
  const querystr = `
    select les.emoticon_slave_id id, les.image_name name, lem.emoticon_owner speaker
    from list_emoticon_master lem
      , list_emoticon_slave les 
  where lem.project_id = ?
    and les.emoticon_master_id = lem.emoticon_master_id
    order by les.sortkey , les.emoticon_slave_id 
  `;

  const result = await DB(querystr, [project_id]);

  res.status(200).json(result.row);
};

// 프로젝트의 모든 캐릭터 표현
const getProjectCharacterExpressionList = async (project_id, res) => {
  const result = await DB(Q_SCRIPT_CHARACTER_EXPRESSION_DROPDOWN, [project_id]);
  res.status(200).json(result.row);
};

// 프로젝트 모델리스트
export const getProjectModelList = async (project_id, res) => {
  const result = await DB(Q_SELECT_PROJECT_MODEL, [project_id]);

  res.status(200).json(result.row);
};

//! JE - 메인배너/썸네일/보이스배너 목록
const getProjectImageList = async (projectID, code, res) => {
  console.log(projectID, code);

  const result = await DB(
    `
  SELECT * FROM list_design 
  WHERE project_id = ? AND design_type LIKE ?;
  `,
    [projectID, code]
  );

  if (!result.state) {
    logger.error(`getProjectImageList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
};

//! 메인로딩/상품배너/상품상세이미지 이미지 목록
const getImageList = async (code, res) => {
  const result = await DB(
    `
  SELECT * FROM list_design 
  WHERE design_type = ?;
  `,
    [code]
  );

  if (!result.state) {
    logger.error(`getImageList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
};

// 에피소드 ID DropDown 용도
export const getAllEpisodeListForDropdown = async (project_id, res) => {
  console.log("getAllEpisodeListForDropdown");

  const result = await DB(
    `
  SELECT le.episode_id 
     , concat(le.episode_id, '. [', fn_get_standard_name('episode_type', le.episode_type), '] ', le.title) episode_name
  FROM list_episode le 
  WHERE le.project_id = ?
  ORDER BY le.episode_type, le.sortkey ;
  `,
    [project_id]
  );

  const newResult = [];
  newResult.push({ episode_id: -1, episode_name: "선택하지 않음" });
  result.row.forEach((item) => {
    newResult.push(item);
  });

  res.status(200).json(newResult);
};

// 화폐 DropDown 용도
export const getCurrencyList = async (res) => {
  console.log("getCurrencyList");

  const result = await DB(
    `SELECT currency, origin_name FROM com_currency WHERE currency <> 'none' and is_coin = 0;`,
    []
  );

  if (!result.state) {
    logger.error(`getCurrencyList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
};

const getPublicProjectDropdown = async (res) => {
  const result = await DB(`
  SELECT a.project_id 
     , a.title project_name
    FROM list_project_master a
  WHERE a.is_public = 1
  ORDER BY a.sortkey 
  ;
  `);

  res.status(200).json(result.row);
};

////////////////////////////////////////////////////////////////////

// 기준정보 코드 조회
//! JE - 메인배너/썸네일 목록 추가
export const getCommonInfo = async (req, res) => {
  const {
    body: { func, code, project_id },
  } = req;

  if (func === "standard") getStandardCodeList(code, res);
  else if (func === "standard_excel") getStandardCodeListForExcel(code, res);
  else if (func === "standard_array") getStandardCodeListForDropdown(code, res);
  else if (func === "emoticon_expression")
    getEmoticonExpressionList(project_id, code, res);
  else if (func === "project_emoticon_expression")
    getProjectEmoticonExpressionList(project_id, res);
  else if (func === "project_character_expression")
    getProjectCharacterExpressionList(project_id, res);
  else if (func === "getProjectModelList") getProjectModelList(project_id, res);
  else if (func === "bubble_sprite") getBubbleSpriteCodeList(code, res);
  else if (func === "projectImageList")
    getProjectImageList(project_id, code, res);
  else if (func === "mainLoadingList" || func === "getAllProductImageList")
    getImageList(code, res);
  else if (func === "getAllEpisodeListForDropdown")
    getAllEpisodeListForDropdown(project_id, res);
  else if (func === "getAllCurrencyList") getCurrencyList(res);
  else if (func === "getPublicProjectDropdown") getPublicProjectDropdown(res);

  // getAllEpisodeListForDropdown

  //getAdminCurrencyList
  // getAdminEpisodeList
  // getAdminSceneList
  // else if( func === "emoticon_expression")
  // getBubbleSpriteCodeList
};
