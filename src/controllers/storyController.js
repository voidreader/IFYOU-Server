import mysql from "mysql2/promise";
import { response } from "express";

import { DB, slaveDB, transactionDB } from "../mysqldb";

import { logger } from "../logger";
import { respond, respondRedirect, respondDB } from "../respondent";

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
