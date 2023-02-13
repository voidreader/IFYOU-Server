import mysql from "mysql2/promise";
import { response } from "express";
import { profile } from "winston";
import { DB, logAction, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

// * 유저가 스토리 진행하면서 획득한 능력치 raw 정보
// * 클라이언트에서 필요해서 만들었음.
export const getUserStoryAbilityRawList = async (userInfo) => {
  const { project_id = -1, userkey } = userInfo;

  const result = await DB(`
    SELECT a.episode_id 
     , a.scene_id 
     , ca.speaker
     , ca.ability_id 
     , ca.ability_name
     , a.add_value 
     , le.episode_type 
     , le.chapter_number 
  FROM user_story_ability a
     , com_ability ca
     , list_episode le
 WHERE a.userkey = ${userkey}
   AND a.project_id = ${project_id}
   AND ca.project_id = a.project_id 
   AND ca.ability_id = a.ability_id 
   AND a.episode_id = le.episode_id ;
    `);

  return result.row;
};

//! 현재 능력치 정보
export const getUserProjectAbilityCurrent = async (userInfo) => {
  const { project_id = -1, userkey } = userInfo;

  const responseData = {};

  // 프로젝트에 등록된 모든 능력치
  const projectAbility = await slaveDB(`
  SELECT ca.speaker 
       , ca.ability_name
       , ca.local_id
       , ca.is_main 
       , ca.max_value
       , fn_get_design_info(icon_design_id, 'url') icon_design_url 
       , fn_get_design_info(icon_design_id, 'key') icon_design_key 
	     , fn_get_emoticon_info(emoticon_image_id, 'url') emoticon_design_url 
	     , fn_get_emoticon_info(emoticon_image_id, 'key') emoticon_design_key 
       , fn_get_design_info(standing_id, 'url') background_url 
	     , fn_get_design_info(standing_id, 'key') background_key 
	     , ca.ability_id 
       , ca.profile_height 
       , ca.profile_age 
       , date_format(ifnull(ca.profile_birth_date, now()), '%Y-%m-%d') profile_birth_date 
       , ca.profile_favorite_id 
       , ca.profile_hate_id 
       , ca.profile_line_id
       , ca.profile_introduce_id 
       , 0 current_value
       , 0 item_value
    FROM com_ability ca 
      LEFT OUTER JOIN list_nametag t ON t.speaker = ca.speaker AND t.project_id = ca.project_id
    WHERE ca.project_id = ${project_id}
   ORDER BY ifnull(t.sortkey, 10), ca.speaker, ca.is_main DESC, ca.ability_name;  
  `);

  if (projectAbility.state && projectAbility.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of projectAbility.row) {
      // 화자 기준으로 구성
      if (!Object.prototype.hasOwnProperty.call(responseData, item.speaker)) {
        responseData[item.speaker] = [];
      }

      responseData[item.speaker].push(item); // push.
    }
  }

  //에피소드에서 얻은 능력치
  let result = await DB(
    `
    SELECT b.speaker
    , b.ability_name 
    , ifnull(sum(add_value), 0) current_value
    FROM user_story_ability a, com_ability b
    WHERE userkey = ? 
    AND a.project_id = ?
    AND a.ability_id = b.ability_id
    AND b.project_id = a.project_id
    GROUP BY speaker, ability_name  
    ORDER BY speaker, ability_name;
    `,
    [userkey, project_id]
  );

  if (result.state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      // Key로 등록된 화자만 처리
      if (Object.prototype.hasOwnProperty.call(responseData, item.speaker)) {
        for (let i = 0; i < responseData[item.speaker].length; i++) {
          if (
            responseData[item.speaker][i].ability_name === item.ability_name
          ) {
            responseData[item.speaker][i].current_value =
              parseInt(responseData[item.speaker][i].current_value, 10) +
              parseInt(item.current_value, 10);
          }
        } // end of for
      }
    }
  } // 스토리 진행 능력치 합산 처리 완료

  //재화에서 얻은 능력치
  result = await DB(
    `
    SELECT d.speaker 
    , d.ability_name 
    , ifnull(sum(add_value), 0) current_value
    FROM user_property a, com_currency b, com_currency_ability c, com_ability d   
    WHERE a.currency = b.currency
    AND b.currency = c.currency   
    AND c.ability_id = d.ability_id
    AND b.connected_project = ?
    AND d.project_id = b.connected_project 
    AND a.userkey = ? 
    AND is_ability = 1 
    GROUP BY speaker, ability_name  
    ORDER BY speaker, ability_name;`,
    [project_id, userkey]
  );

  if (result.state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      // Key로 등록된 화자만 처리
      if (Object.prototype.hasOwnProperty.call(responseData, item.speaker)) {
        for (let i = 0; i < responseData[item.speaker].length; i++) {
          if (
            responseData[item.speaker][i].ability_name === item.ability_name
          ) {
            responseData[item.speaker][i].current_value =
              parseInt(responseData[item.speaker][i].current_value, 10) +
              parseInt(item.current_value, 10);

            responseData[item.speaker][i].item_value += item.current_value;
          }
        } // end of for
      }
    }
  } // 재화에서 얻은 능력치 합산 처리 완료

  return responseData;
}; // ? end;

export const getOtomeProfileLines = async (userInfo) => {
  const { project_id = -1 } = userInfo;

  const responseData = {};

  const profileLines = await slaveDB(`
  SELECT ifnull(ca.speaker, 'unknown') speaker
      , cpl.ability_id 
      , cpl.line_id 
      , cpl.motion_id
      , fn_get_motion_name_by_id(cpl.motion_id) motion_name
      , cpl.condition_type 
      , ifnull(cpl.line_condition, '') line_condition 
    FROM com_profile_lines cpl 
      , com_ability ca 
  WHERE ca.project_id = ${project_id}
    AND ca.ability_id = cpl.ability_id
  ORDER BY ability_id, line_id
  ;
  `);

  if (profileLines.state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of profileLines.row) {
      if (!Object.prototype.hasOwnProperty.call(responseData, item.speaker)) {
        responseData[item.speaker] = [];
      }

      responseData[item.speaker].push(item);
    }
  }

  return responseData;
}; // ? getOtomeProfileLines

//! 능력치 수치 추가
export const addUserAbility = async (req, res) => {
  const {
    body: {
      userkey = -1,
      project_id = -1,
      episode_id = -1,
      scene_id = -1,
      speaker = "",
      ability = "",
      add_value = 0,
    },
  } = req;

  let result = await DB(
    `SELECT ability_id FROM com_ability WHERE project_id = ? AND speaker = ? AND ability_name = ?;`,
    [project_id, speaker, ability]
  );
  if (result.state && result.row.length > 0) {
    const { ability_id } = result.row[0];

    result = await DB(
      `INSERT INTO user_story_ability (
            userkey
            , project_id
            , episode_id
            , scene_id 
            , ability_id 
            , add_value ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?);`,
      [userkey, project_id, episode_id, scene_id, ability_id, add_value]
    );

    if (!result.state) {
      logger.error(`addUserAbility Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  //합산값 리턴
  const responseData = {};
  responseData.ability = await getUserProjectAbilityCurrent({
    project_id,
    userkey,
  }); //유저의 현재 능력치 정보
  responseData.rawStoryAbility = await getUserStoryAbilityRawList({
    project_id,
    userkey,
  }); // 스토리에서 획득한 능력치 Raw 리스트

  res.status(200).json(responseData);
};

//! 능력치 수치 리셋 쿼리
export const createQueryResetAbility = async (userInfo) => {
  const { userkey, project_id, episode_id, dlc_id = -1 } = userInfo;

  let isMatch = false;
  let deleteQuery = ``;

  //에피소드 조회
  const result = await slaveDB(`
  SELECT episode_id FROM list_episode WHERE project_id = ${project_id} AND dlc_id = ${dlc_id}
    AND episode_type = 'chapter' ORDER BY sortkey, episode_id;`);

  if (result.state && result.row.length > 0) {
    const currentQuery = `DELETE FROM user_story_ability WHERE userkey = ? AND project_id = ? AND episode_id = ?;`;
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      if (parseInt(episode_id) === item.episode_id) isMatch = true; //해당 에피소드부터 리셋 처리

      if (isMatch) {
        deleteQuery += mysql.format(currentQuery, [
          userkey,
          project_id,
          item.episode_id,
        ]);
      }
    }
  }

  return deleteQuery;
};

//! 처음부터 능력치 리셋
export const firstResetAbility = async (req, res) => {
  const {
    body: { userkey, project_id, episode_id },
  } = req;

  const resetQuery = await createQueryResetAbility({
    userkey,
    project_id,
    episode_id,
  });
  let result;

  if (resetQuery) {
    result = await transactionDB(resetQuery);
    if (!result.state) {
      logger.error(`firstResetAbility Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  //현재 능력치 정보
  result = await getUserProjectAbilityCurrent({ project_id, userkey });
  res.status(200).json(result);
};
