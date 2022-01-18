import mysql from "mysql2/promise";
import { response } from "express";
import routes from "../routes";
import { DB, transactionDB } from "../mysqldb";
import {
  Q_SCRIPT_CHARACTER_EXPRESSION_DROPDOWN,
  Q_UPDATE_EPISODE_SORTKEY,
  Q_SELECT_PROJECT_MODEL,
  Q_SELECT_PROJECT_EPISODES_FOR_UNLOCK,
  Q_SELECT_PROJECT_SCENES_FOR_UNLOCK,
  Q_SELECT_COUPONS_FOR_UNLOCK,
} from "../QStore";
import { logger } from "../logger";
import {
  respond,
  respondRedirect,
  respondDB,
  adminLogInsert,
  respondAdminSuccess,
} from "../respondent";
import { postSelectProjectEpisodeList } from "./episodeController";

// * 작품별 로딩 관리 시작

// * 로딩 리스트 마스터 테이블 조회
export const getProjectLoadingMaster = async (req, res) => {
  console.log(req.params);
  const {
    params: { id },
  } = req;

  const result = await DB(
    `
  SELECT a.loading_id 
     , a.project_id 
     , a.image_id 
     , fn_get_design_info(a.image_id, 'url') image_url
     , a.loading_name
  FROM list_loading a
 WHERE a.project_id = ?;
  `,
    [id]
  );

  res.status(200).json(result.row);
};

// * 프로젝트 로딩 디테일
export const getProjectLoadingDetail = async (req, res) => {
  const {
    body: { loading_id },
  } = req;

  const responseData = {};

  // TMI 정보
  const textResult = await DB(`
  SELECT a.detail_no
     , a.loading_id
     , a.lang 
     , a.loading_text 
  FROM list_loading_detail a
 WHERE a.loading_id = ${loading_id}
 ORDER BY a.lang
 ;
  `);

  // 등장 에피소드 정보
  const appearResult = await DB(`
  SELECT a.loading_id
     , a.episode_id 
     , fn_get_standard_name('episode_type', b.episode_type) episode_type
     , b.title
     , a.is_use
  FROM list_loading_appear a
     , list_episode b
WHERE a.loading_id  = ${loading_id}
  AND b.episode_id = a.episode_id;
  `);

  responseData.tmiResult = textResult.row;
  responseData.appearResult = appearResult.row;

  res.status(200).json(responseData);
};

// * 로딩을 만든다.
export const createProjectLoading = async (req, res) => {
  const {
    params: { id },
    body: { loading_name, image_id = -1 },
  } = req;

  // 마스터 insert
  const insertMaster = await DB(
    `
  INSERT INTO list_loading (project_id, image_id, loading_name) VALUES(?, ?, ?);
  `,
    [id, image_id, loading_name]
  );

  if (!insertMaster.state) {
    respondDB(res, 80026, insertMaster.error);
    return;
  }

  const loading_id = insertMaster.row.insertId;

  // 만드는 시점에 대상 프로젝트의 등록된 모든 에피소드 불러와서 세팅
  const insertAppear = await DB(`
  INSERT INTO list_loading_appear (loading_id, episode_id) 
  SELECT ${loading_id}, a.episode_id
    FROM list_episode a
  WHERE a.project_id = ${id}
  ORDER BY a.episode_type, a.sortkey ; 
  `);

  if (!insertAppear.state) {
    respondDB(res, 80026, insertAppear.error);
    return;
  }

  respondAdminSuccess(
    req,
    res,
    null,
    "loading_insert",
    getProjectLoadingMaster
  );
};

// * 프로젝트 로딩 디테일 수정
export const updateProjectLoadingDetail = async (req, res) => {
  const {
    params: { id },
    body: { tmiResult, appearResult, loading_id, loading_name, image_id },
  } = req;

  // tmiResult와 appearResult는 변경이 발생한 행만 들어온다.
  // query 만들어놓기.
  const masterUpdateQuery = mysql.format(
    `
  UPDATE list_loading
     SET loading_name = ?
       , image_id = ?
   WHERE loading_id = ?
  `,
    [loading_name, image_id, loading_id]
  );

  // * loading_appear에 대한 처리
  let appearUpdateQuery = "";

  appearResult.forEach((item) => {
    appearUpdateQuery += mysql.format(
      `
    UPDATE list_loading_appear
    SET is_use = ?
  WHERE loading_id = ?
    AND episode_id = ?;
    `,
      [item.is_use, loading_id, item.episode_id]
    );
  }); // end of appearResult forEach

  // * TMI update Query
  let tmiUpdateQuery = ``;

  // 쿼리 모아주기
  tmiResult.forEach((item) => {
    tmiUpdateQuery += mysql.format(`CALL sp_update_loading_text(?,?,?,?);`, [
      loading_id,
      item.lang,
      item.loading_text,
      item.detail_no,
    ]);
  });

  console.log(tmiUpdateQuery);
  console.log(appearUpdateQuery);

  // 모아모아서 한번에
  const result = await transactionDB(appearUpdateQuery + tmiUpdateQuery);

  if (!result.state) {
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(
    req,
    res,
    null,
    "loading_detail_update",
    getProjectLoadingDetail
  );
};

export const deleteProjectLoading = async (req, res) => {
  const {
    body: { loading_id },
  } = req;

  const result = await DB(`
  DELETE FROM list_loading_detail WHERE loading_id = ${loading_id};
  DELETE FROM list_loading_appear WHERE loading_id = ${loading_id};
  DELETE FROM list_loading WHERE loading_id = ${loading_id}`);

  respondAdminSuccess(
    req,
    res,
    null,
    "loading_delete",
    getProjectLoadingMaster
  );
};

// ? 작품별 로딩 관리 끝

// * 작품의 프리패스 가격 조회
export const getProjectFreepassPrice = async ({ userkey, project_id }) => {
  // 영구 구매된 것들을 제외하고의 모든 sale_price를 합치고, 10% 할인이 들어간다.
  const result = await DB(`
  SELECT sum(a.sale_price) origin_freepass_price
     , floor(sum(a.sale_price) - sum(a.sale_price) * 0.1) sale_freepass_price 
  FROM list_episode a
     LEFT OUTER JOIN user_episode_purchase uep ON a.episode_id = uep.episode_id  AND uep.userkey = ${userkey}
 WHERE a.project_id = ${project_id}
   AND a.episode_type = 'chapter'
   AND (uep.permanent  IS NULL OR uep.permanent = 0 )
;
  `);

  if (!result.state || result.row.length === 0) {
    return {};
  }

  return result.row[0];
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

  console.log(`user episode hist : ${arrEpisodeIDs}`);

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

//! 사건ID 해금 조회
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
  AND a.unlock_scenes LIKE CONCAT('%', ${scene_id}, '%')
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

  const locekdMissionList = await DB(
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

// 메인 화면, 작품 리스트 조회
//! JE - 테이블(list_project_master) 및 썸네일(main_banner_id, main_thumbnail_id) 변경
//! JE - 권한 추가
export const home = async (req, res) => {
  const {
    body: { user_id, master_auth = 0, lang = "KO" },
  } = req;

  //! 권한있는 작품 쿼리
  let whereQuery = "";
  if (master_auth === 0) {
    whereQuery = ` AND lp.project_id in(SELECT apa.project_id FROM admin_project_auth apa WHERE user_id = ${user_id}) `;
  }

  // 작품리스트는 기본 Default 언어인 한국어로 조회한다.
  const result = await DB(
    `SELECT lp.project_id
    , lp.project_type 
    , detail.lang 
    , detail.title 
    , fn_get_design_info(detail.main_banner_id, 'url') title_image_url
    , fn_get_design_info(detail.main_banner_id, 'key') title_image_key
    , fn_get_design_info(detail.main_thumbnail_id, 'url') main_thumbnail_url
    , fn_get_design_info(detail.main_thumbnail_id, 'key') main_thumbnail_key  
    , detail.summary 
    , detail.writer 
    , lp.sortkey 
    , lp.bubble_set_id
    , lp.favor_use
    , lp.challenge_use
    , lp.is_complete
    , lp.is_credit
    , lp.is_public
    FROM list_project_master lp
    , list_project_detail detail
    WHERE lp.project_type = 0
    AND detail.project_id = lp.project_id
    AND detail.lang = '${lang}'
    ${whereQuery}
    ORDER BY lp.sortkey, lp.project_id;`,
    []
  );

  res.status(200).json(result.row);
};

// 작품 nametag 정보 주세요!
export const requestProjectNametag = async (userInfo) => {
  const result = await DB(
    `
  SELECT nt.speaker 
  , nt.main_color 
  , nt.sub_color 
  , nt.KO 
  , nt.EN 
  , nt.JA 
  , nt.ZH 
  , fn_get_design_info(nt.voice_banner_id, 'url') banner_url
  , fn_get_design_info(nt.voice_banner_id, 'key') banner_key
FROM list_nametag nt
WHERE nt.project_id = ?;  
  `,
    userInfo.project_id
  );

  return result.row;
};

// 에피소드 정렬 처리
export const postUpdateEpisodeSorting = async (req, res) => {
  console.log(`postUpdateEpisodeSorting ${JSON.stringify(req.body)}`);

  const {
    params: { id },
    body: { rows },
  } = req;

  let insertQuery = ``;

  rows.forEach((item) => {
    insertQuery += mysql.format(Q_UPDATE_EPISODE_SORTKEY, [
      item.sortkey,
      item.episode_id,
    ]);
  });

  console.log(insertQuery);

  const result = await DB(insertQuery);

  if (!result.state) {
    logger.error(`postUpdateEpisodeSorting Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(
    req,
    res,
    null,
    "episode_sorting",
    postSelectProjectEpisodeList
  );
};

// 선택한 스토리 디테일 정보
//! JE - 썸네일 변경
export const getStoryDetail = async (req, res) => {
  const {
    params: { id }, // params!!
    body: { lang = "KO" },
  } = req;

  // console.log(`getStoryDetail ${id}`);
  logger.info(`[${id}] StoryDetail with [${lang}]`);

  const result = await DB(
    `
  SELECT lp.project_id
     , lp.project_type 
     , ? lang 
     , detail.title 
     , detail.main_banner_id
     , detail.main_thumbnail_id
     , fn_get_design_info(detail.main_banner_id, 'url') title_image_url
     , fn_get_design_info(detail.main_banner_id, 'key') title_image_key
     , fn_get_design_info(detail.main_thumbnail_id, 'url') main_thumbnail_url
     , fn_get_design_info(detail.main_thumbnail_id, 'key') main_thumbnail_key  
     , detail.summary 
     , detail.writer 
     , lp.sortkey 
     , lp.bubble_set_id
     , lp.favor_use
     , lp.challenge_use
     , lp.is_complete
     , lp.is_credit
     , lp.is_public
     , fn_check_project_lang_exists(lp.project_id, ?) lang_exists
  FROM list_project_master lp
  		LEFT OUTER JOIN list_project_detail detail ON lp.project_id = detail.project_id
 WHERE lp.project_type = 0
   AND lp.project_id = ?
   AND detail.lang = CASE WHEN fn_check_project_lang_exists(lp.project_id, ?) > 0 THEN ? ELSE lp.default_lang END
  ;`,
    [lang, lang, id, lang, lang]
  );

  // console.log(result);

  if (!result.state || result.row.length === 0) {
    logger.error(`purchaseEpisode Error ${result.error}`);
    respondDB(res, 80039, "");
  } else {
    res.status(200).json(result.row);
  }
}; // 스토리 디테일 정보 처리 종료

// 스토리 신규 등록
//! JE - master 테이블로 변경
export const postRegisterStory = async (req, res) => {
  logger.info(`postRegisterStory`);

  const {
    body: { title, lang = "KO" },
  } = req;

  const result = await DB("INSERT INTO list_project_master(title) VALUES (?)", [
    title,
  ]);

  if (!result.state) {
    logger.error(`postRegisterStory Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 입력 후 detail도 입력해줘야 한다.
  // 그러려면 project_id 값을 받아와야 함
  //! JE - 쿼리 조회 안하고 insertId로 가져오는 걸로 변경
  const projectID = result.row.insertId;
  logger.info(`projectID is.. [${projectID}]`);

  // detail 테이블 입력
  const insertDetail = await DB(
    `INSERT INTO list_project_detail(project_id, lang, title) VALUES (?,?,?)`,
    [projectID, lang, title]
  );

  if (!insertDetail.state) {
    logger.error(`postRegisterStory Error 2 ${insertDetail.error}`);
    respondDB(res, 80026, insertDetail.error);
    return;
  }

  // 다시 기본 리스트 호출
  respondAdminSuccess(req, res, null, "project_insert", home);

  // INSERT INTO list_project(project_type, title) VALUES (
  // res.render("registerStory", { pageTitle: "Register Story" });
}; // 스토리 신규 등록 끝

// 스토리 프로젝트 수정 처리(이미지 처리 함께 할때)
//! JE - 파일 업로드 없이 업데이트
export const postModifyStoryWithImage = async (req, res) => {
  const {
    params: { id },
    body: {
      lang = "KO",
      title = "",
      writer = "",
      summary = "",
      bubble_set_id = 1,
      favor_use = 1,
      challenge_use = 1,
      is_complete = 0,
      is_credit = 0,
      is_public = 0,
      main_banner_id = -1,
      main_thumbnail_id = -1,
    },
  } = req;

  // bubble_set_id, favor_use, challenge_use
  const resultMaster = await DB(
    `
  UPDATE list_project_master
     SET bubble_set_id = ?
       , favor_use = ?
       , challenge_use = ?
       , is_complete = ? 
       , is_credit = ? 
       , is_public = ? 
    WHERE project_id = ?
  `,
    [
      bubble_set_id,
      favor_use,
      challenge_use,
      is_complete,
      is_credit,
      is_public,
      id,
    ]
  );

  if (!resultMaster.state) {
    logger.error(`postModifyStoryWithImage Error 1 ${resultMaster.error}`);
    respondDB(res, 80026, resultMaster.error);
    return;
  }

  // 프로시져 호출을 통해서 detail & insert
  const resultDetail = await DB(
    `
    CALL sp_update_project_detail(?, ?, ?, ?, ?, ?, ?);
    `,
    [id, lang, title, summary, writer, main_banner_id, main_thumbnail_id]
  );

  if (!resultDetail.state) {
    logger.error(`postModifyStoryWithImage Error 2 ${resultDetail.error}`);
    respondDB(res, 80026, resultDetail.error);
    return;
  }

  // 다했으면 redirect
  adminLogInsert(req, "project_update");
  res.redirect(routes.storyDetail(id));
}; // 스토리 프로젝트 수정 처리(이미지 처리) 끝!

// 스토리 프로젝트 수정 (텍스트 처리만)
export const postModifyStoryOnlyText = async (req, res) => {
  // console.log(req);

  // 이미지가 함께 수정되지 않은 경우에만 호출한다.
  const {
    body: { title, summary, writer },
    params: { id },
  } = req;

  // UPDATE 시작!
  const result = await DB(
    "UPDATE list_project_master SET title = ?, summary=?, writer=? WHERE project_id=?",
    [title, summary, writer, id]
  );

  // 다했으면 redirect
  adminLogInsert(req, "project_update_text");
  res.redirect(routes.storyDetail(id));
}; // 스토리 프로젝트 수정 처리(이미지 처리) 끝!

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

// 잠금해제 dropdown 용도 - 에피소드 리스트
const getProjectEpisodsForUnlock = async (project_id, res) => {
  const result = await DB(Q_SELECT_PROJECT_EPISODES_FOR_UNLOCK, [project_id]);

  res.status(200).json(result.row);
};

// 잠금해제 dropdown 용도 - 사건ID 리스트
const getProjectScenesForUnlock = async (project_id, res) => {
  const result = await DB(Q_SELECT_PROJECT_SCENES_FOR_UNLOCK, [project_id]);

  res.status(200).json(result.row);
};

// 잠금해제 dropdown 용도 - 쿠폰그룹
const getCouponsForUnlock = async (project_id, res) => {
  const result = await DB(Q_SELECT_COUPONS_FOR_UNLOCK, [project_id]);

  res.status(200).json(result.row);
};

// 작품의 프로젝트 리스트 조회
const getAdminProjectList = async (req, res) => {
  const result = await DB(
    `
  SELECT a.project_id, a.title
    FROM list_project_master a
   ORDER BY a.sortkey;`,
    []
  );

  if (!result.state) {
    logger.error(`getAdminProjectList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
};

// 어드민에서 사용하는 에피소드 단순 리스트
const getAdminEpisodeList = async (projectID, res) => {
  const result = await DB(
    `
    SELECT le.episode_id, le.title 
    FROM list_episode le 
   WHERE le.project_id = ?
   ORDER BY le.episode_type, le.sortkey ;`,
    [projectID]
  );

  if (!result.state) {
    logger.error(`getAdminEpisodeList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
};

// 어드민에서 사용하는 단순 사건ID 리스트
const getAdminSceneList = async (projectID, res) => {
  const result = await DB(
    `
    SELECT DISTINCT ls.scene_id , CONCAT(ls.scene_id, ' ', ls.script_data) scene_text
  FROM list_script ls
     , list_episode le 
 WHERE ls.project_id = ?
   AND le.episode_id = ls.episode_id 
   AND ls.scene_id <> ''
   AND ls.scene_id IS NOT NULL
 ORDER BY le.episode_type , le.sortkey ;`,
    [projectID]
  );

  if (!result.state) {
    logger.error(`getAdminSceneList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
};

const getAdminMissionCurrencyList = async (req, res) => {
  const result = await DB(
    `
    SELECT cc.currency 
    , cc.origin_name
    FROM com_currency cc
    WHERE cc.mission_reward = 1
    ORDER BY cc.sortkey ;`,
    []
  );

  if (!result.state) {
    logger.error(`getAdminMissionCurrencyList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

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
  else if (func === "targetProjectEpisodeUnlock")
    getProjectEpisodsForUnlock(project_id, res);
  else if (func === "targetProjectSceneUnlock")
    getProjectScenesForUnlock(project_id, res);
  else if (func === "targetCouponUnlock") getCouponsForUnlock(project_id, res);
  else if (func === "adminProjectList") getAdminProjectList(req, res);
  else if (func === "adminEpisodeList") getAdminEpisodeList(project_id, res);
  else if (func === "adminSceneList") getAdminSceneList(project_id, res);
  else if (func === "adminMissionCurrencyList")
    getAdminMissionCurrencyList(req, res);
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
