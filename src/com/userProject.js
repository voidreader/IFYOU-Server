import mysql from "mysql2/promise";
import { DB, logAction, logAD, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respond, respondDB, respondSuccess } from "../respondent";
import {
  getCurrencyQuantity,
  getUserBankInfo,
} from "../controllers/bankController";
import { Q_USER_EPISODE_PURCHASE, UQ_USE_CURRENCY } from "../USERQStore";
import { cache } from "../init";

// 유저 에피소드 구매 정보 !
export const getUserEpisodePurchaseInfo = async (userInfo) => {
  const result = await DB(Q_USER_EPISODE_PURCHASE, [
    userInfo.userkey,
    userInfo.project_id,
  ]);

  if (!result.state) {
    logger.error(`getUserEpisodePurchaseInfo Error ${result.error}`);
    return [];
  }

  return result.row;
};

//! 현재 에피의 경로 정보
export const getUserProjectProgressInfo = async (userInfo) => {
  const { userkey, project_id, episode_id } = userInfo;

  const result = await DB(
    `
  SELECT 
  scene_id
  , selection_group 
  , route 
  FROM user_project_progress_order
  WHERE userkey = ? 
  AND project_id = ? 
  AND episode_id = ?
  ORDER BY route; 
  `,
    [userkey, project_id, episode_id]
  );

  return result.row;
};

// 작품 선택지 선택 Progress
export const getUserProjectSelectionProgress = async (userInfo) => {
  const result = await DB(
    `
    SELECT a.episode_id 
        , a.target_scene_id
        , a.selection_data
        , 0 is_passed -- 클라이언트에서 사용
    FROM user_selection_progress a
    WHERE a.userkey = ?
    AND a.project_id = ?
    ORDER BY a.update_date;
  `,
    [userInfo.userkey, userInfo.project_id]
  );

  const responseData = {};

  result.row.forEach((item) => {
    if (!responseData.hasOwnProperty(item.episode_id.toString())) {
      responseData[item.episode_id.toString()] = [];
    }

    responseData[item.episode_id.toString()].push({
      target_scene_id: item.target_scene_id,
      selection_data: item.selection_data,
      is_passed: item.is_passed,
    });
  });

  return responseData;
};

// 선택지 Progress
export const updateSelectionProgress = async (req, res) => {
  const {
    body: { userkey, project_id, episodeID, target_scene_id, selection_data },
  } = req;

  const result = await DB(`call sp_update_user_selection_progress(?,?,?,?,?)`, [
    userkey,
    project_id,
    episodeID,
    target_scene_id,
    selection_data,
  ]);

  if (!result.state) {
    logger.error(result.error);
  }

  // refresh
  const responseData = await getUserProjectSelectionProgress(req.body);

  res.status(200).json(responseData);
};

// * 유저 프로젝트의 현재 위치 정보 조회
export const getUserProjectCurrent = async (userInfo) => {
  console.log(`getUserProjectCurrent `, userInfo);
  let currentInfo = [];

  // list_episode 조인 추가 2022.05.20
  const result = await DB(
    `
    SELECT a.project_id
    , a.episode_id 
    , a.is_special
    , ifnull(a.scene_id, '') scene_id
    , ifnull(a.script_no, '') script_no
    , fn_check_episode_is_ending(a.episode_id) is_ending
    , a.is_final
    , date_format(ifnull(a.next_open_time, date_add(now(), INTERVAL -1 hour)), '%Y-%m-%d %T') next_open_time -- utc 변환 
    , le.chapter_number 
    FROM user_project_current a
       , list_episode le
    WHERE a.userkey = ?
    AND a.project_id = ?
    AND le.project_id = a.project_id 
    AND le.episode_id = a.episode_id 
    ORDER BY a.is_special;
  `,
    [userInfo.userkey, userInfo.project_id]
  );

  // ! 최대 2개의 행까지 응답받는다. (정규 에피소드와 스페셜 에피소드)
  // 없으면 첫번째 에피소드를 자동으로 만들어준다.
  if (result.row.length === 0) {
    const initResult = await DB(`CALL sp_init_user_project_current(?,?)`, [
      userInfo.userkey,
      userInfo.project_id,
    ]);

    if (!initResult.state || initResult.row[0].length === 0) {
      logger.error(
        `Error in getUserProjectCurrent ${JSON.stringify(userInfo)}`
      );
      return [];
    }

    logger.info(
      `Call sp_init_user_project_current ${JSON.stringify(
        userInfo
      )} / ${JSON.stringify(initResult.row[0])}`
    );

    currentInfo = initResult.row[0];
  } else {
    currentInfo = result.row;
  }

  // next_open_time의 틱을 구해준다.
  currentInfo.forEach((item) => {
    const openDate = new Date(item.next_open_time);
    item.next_open_tick = openDate.getTime();
  });

  return currentInfo;
}; // ? END OF getUserProjectCurrent

export const requestUserProjectCurrent = async (req, res) => {
  logger.info(`requestUserProjectCurrent : ${JSON.stringify(req.body)}`);
  const currentInfo = await getUserProjectCurrent(req.body);
  respondSuccess(res, currentInfo);
};

// * 유저의 프로젝트내 현재 위치 업데이트
export const requestUpdateProjectCurrent = async ({
  userkey,
  project_id,
  episodeID,
  scene_id = null,
  script_no = 0,
  is_final = 0, // 막다른 길
  callby = "",
}) => {
  let episode_id = episodeID;

  logger.info(
    `requestUpdateProjectCurrent ${userkey}/${project_id}/${episodeID}/${scene_id}/${script_no}/${is_final}/${callby}`
  );

  // 에피소드 ID가 없는 경우.
  if (!episodeID) {
    logger.error(
      `No EpisodeID ${userkey}/${project_id}/${episodeID}/${scene_id}/${script_no}/${is_final}/${callby}`
    );

    // 현재 project_current의 정보를 불러온다.
    const userCurrent = await DB(`SELECT a.episode_id 
    FROM user_project_current a
   WHERE a.userkey = ${userkey}
     AND a.project_id = ${project_id}
     AND a.is_special = 0;`);

    if (userCurrent.state && userCurrent.row.length > 0) {
      episode_id = userCurrent.row[0].episode_id;
    }
  } // 에피소드 정보가 없는 경우에 대한 처리

  // 프로젝트 ID가 없는 경우..!?

  const result = await DB(
    `
      CALL sp_update_user_project_current(?,?,?,?,?,?);
      `,
    [userkey, project_id, episode_id, scene_id, script_no, is_final]
  );

  if (!result.state) {
    logger.error(`${userkey}/${project_id} : ${result.error}`);
    return [];
  }

  // console.log(result.row[0][0]);
  let projectCurrent;

  if (result.row[0].length > 0) projectCurrent = result.row[0];
  else projectCurrent = [];

  projectCurrent.forEach((item) => {
    const openDate = new Date(item.next_open_time);
    item.next_open_tick = openDate.getTime();
  });

  return projectCurrent;
};

// ! 대체 (2022.11.21) requestUpdateProjectCurrent
export const ProcessUpdateUserProjectCurrent = async (userInfo) => {
  userInfo.episode_id = userInfo.episodeID; // 파라매터 잘못써서.. ㅠ
  if (!userInfo.scene_id) userInfo.scene_id = null;

  if (!userInfo.script_no) userInfo.script_no = 0;

  if (!userInfo.is_final) userInfo.is_final = 0;

  if (!userInfo.callby) userInfo.callby = "";

  logger.info(
    `ProcessUpdateUserProjectCurrent : [${JSON.stringify(userInfo)}]`
  );
  // 에피소드 ID 안넘어온 경우
  if (!userInfo.episodeID) {
    logger.error(
      `ProcessUpdateUserProjectCurrent No Episode ID Error : [${JSON.stringify(
        userInfo
      )}]`
    );
    const userCurrent = await getUserProjectCurrent(userInfo); // 다시 받아오기.

    if (userCurrent && userCurrent.length > 0) {
      userInfo.episodeID = userCurrent[0].episode_id;
      userInfo.episode_id = userCurrent[0].episode_id;
    }
  } // 에피소드 ID 없는 경우에 대한 처리 종료

  logAction(userInfo.userkey, "project_current", userInfo);

  // Procedure Call
  const saveResult = await DB(
    `CALL sp_save_user_project_current(?, ?, ?, ?, ?, ?);`,
    [
      userInfo.userkey,
      userInfo.project_id,
      userInfo.episode_id,
      userInfo.scene_id,
      userInfo.script_no,
      userInfo.is_final,
    ]
  );

  if (!saveResult.state) {
    logger.error(`ProcessUpdateUserProjectCurrent Error : ${saveResult.error}`);
    return [];
  }

  // 갱신된 정보 조회
  const projectCurrent = await getUserProjectCurrent(userInfo);
  return projectCurrent;
};

// * 유저의 프로젝트내 현재 위치 업데이트
export const updateUserProjectCurrent = async (req, res) => {
  logger.info(`updateUserProjectCurrent : ${JSON.stringify(req.body)}`);

  //const result = await requestUpdateProjectCurrent(req.body);
  const result = await ProcessUpdateUserProjectCurrent(req.body);
  res.status(200).json(result);

  logAction(req.body.userkey, "project_current_result", result);
};

///////////////////// 새로운 선택지 로그 시작 ///////////////////////

//* 현재 선택지 로그 가져오기
export const getUserSelectionCurrent = async (userkey, project_id) => {
  const result = await slaveDB(
    `
  SELECT episode_id 
  , target_scene_id 
  , selection_group
  , selection_no 
  FROM user_selection_current
  WHERE userkey = ? 
  AND project_id = ?
  ORDER BY action_date DESC; 
  `,
    [userkey, project_id]
  );

  return result.row;
};

//! 현재 선택지 로그
export const getSelectionCurrent = async (req, res) => {
  const {
    body: { userkey, project_id, lang = "KO" },
  } = req;

  const responseData = {};
  const selection = {};
  const ending = [];

  //* 현재 셀렉션(user_selection_current) 값이 있는지 확인
  let endingCheck = true;
  let index = 0;

  let result = await slaveDB(
    `SELECT * FROM user_selection_current 
  WHERE userkey = ? AND project_id =?;
  `,
    [userkey, project_id]
  );
  if (!result.state || result.row.length === 0) endingCheck = false;

  //* 현재 설렉션(user_selection_current), 엔딩(user_selection_ending) 같은 데이터가 있는지 확인
  if (endingCheck) {
    result = await slaveDB(
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

  res.status(200).json(responseData);
};

//! 선택지 로그 top3 리스트
export const getTop3SelectionList = async (req, res) => {
  logger.info(`getTop3SelectionList : ${JSON.stringify(req.body)}`);

  const {
    body: { userkey, project_id, lang = "KO" },
  } = req;

  let result = ``;

  //* 플레이 횟수 가장 큰 값 가져오기
  result = await DB(
    `
  SELECT ifnull(MAX(play_count),0) play_count
  FROM user_selection_ending
  WHERE userkey = ? AND project_id = ?;
  `,
    [userkey, project_id]
  );
  let maxPlayCount = 0;
  if (result.row.length > 0) maxPlayCount = result.row[0].play_count;

  //* 현재 셀렉션(user_selection_current) 값이 있는지 확인
  let endingCheck = true;
  result = await DB(
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

  const responseData = {};
  const selection = {};
  const ending = {};
  let minPlayCount = 0;

  //* 셀력센 리스트
  if (!endingCheck) {
    //* 현재 셀렉션에 값이 없거나 현재 설렉션이 엔딩까지 갔으면 엔딩에서 3개 리스트 호출
    minPlayCount = maxPlayCount - 2 < 0 ? 0 : maxPlayCount - 2; //최소값

    result = await DB(
      `
    SELECT a.episode_id episodeId 
    , fn_get_episode_title_lang(a.episode_id, ?) title
    , a.selection_group selectionGroup
    , a.selection_no selectionNo
    , a.selection_order selectionOrder
    , ${lang} selection_content
    , CASE WHEN a.selection_group = b.selection_group AND a.selection_no = b.selection_no 
    THEN 1 ELSE 0 END selected
    , (SELECT sortkey FROM list_episode WHERE episode_id = a.episode_id) sortkey
    , play_count
    , DATE_FORMAT(origin_action_date, '%Y-%m-%d %T') action_date  
    , ending_id
    , ifnull(fn_get_episode_title_lang(ending_id, ?), '') ending_title 
    , fn_get_ending_type(ending_id) ending_type
    , fn_get_script_data(a.episode_id, a.selection_group, a.selection_no, '${lang}') script_data
    FROM list_selection a LEFT OUTER JOIN user_selection_ending b 
    ON a.project_id = b.project_id AND a.episode_id = b.episode_id AND a.selection_group = b.selection_group
    WHERE userkey = ? 
    AND a.project_id = ?
    AND play_count BETWEEN ? AND ?
    ORDER BY play_count DESC, sortkey, a.episode_id, selectionGroup, a.selection_order;
    `,
      [lang, lang, userkey, project_id, minPlayCount, maxPlayCount]
    );
  } else {
    //* 현재 설렉션이 엔딩까지 안갔으면, 현재 1개 + 엔딩 2개 리스트 호출
    minPlayCount = maxPlayCount - 1 < 0 ? 0 : maxPlayCount - 1; //최소값

    result = await DB(`
    SELECT a.episode_id episodeId  
    , fn_get_episode_title_lang(a.episode_id, '${lang}') title
    , a.selection_group selectionGroup
    , a.selection_no selectionNo
    , a.selection_order selectionOrder
    , ${lang} selection_content
    , CASE WHEN a.selection_group = b.selection_group AND a.selection_no = b.selection_no 
    THEN 1 ELSE 0 END selected
    , (SELECT sortkey FROM list_episode WHERE episode_id = a.episode_id) sortkey
    , play_count
    , DATE_FORMAT(action_date, '%Y-%m-%d %T') action_date  
    , 0 ending_id
    , fn_get_episode_title_lang(0, '${lang}') ending_title
    , fn_get_ending_type(0) ending_type
    , fn_get_script_data(a.episode_id, a.selection_group, a.selection_no, '${lang}') script_data
    FROM list_selection a LEFT OUTER JOIN user_selection_current b 
    on a.project_id = b.project_id AND a.episode_id = b.episode_id AND a.selection_group = b.selection_group
    WHERE userkey = ${userkey}
    AND a.project_id = ${project_id}
    UNION ALL
    SELECT a.episode_id episodeId  
    , fn_get_episode_title_lang(a.episode_id, '${lang}') title
    , a.selection_group selectionGroup
    , a.selection_no selectionNo
    , a.selection_order selectionOrder
    , ${lang} selection_content
    , CASE WHEN a.selection_group = b.selection_group AND a.selection_no = b.selection_no 
    THEN 1 ELSE 0 END selected
    , (SELECT sortkey FROM list_episode WHERE episode_id = a.episode_id) sortkey  
    , play_count
    , DATE_FORMAT(origin_action_date, '%Y-%m-%d %T') action_date    
    , ending_id
    , fn_get_episode_title_lang(ending_id, '${lang}') ending_title
    , fn_get_ending_type(ending_id) ending_type
    , fn_get_script_data(a.episode_id, a.selection_group, a.selection_no, '${lang}') script_data
    FROM list_selection a LEFT OUTER JOIN user_selection_ending b 
    on a.project_id = b.project_id AND a.episode_id = b.episode_id AND a.selection_group = b.selection_group
    WHERE userkey = ${userkey}
    AND a.project_id = ${project_id}
    AND play_count BETWEEN ${minPlayCount} AND ${maxPlayCount} 
    ORDER BY play_count DESC, sortkey, episodeId, selectionGroup, selectionOrder;
    `);
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const item of result.row) {
    let playCount = item.play_count.toString();
    if (!Object.prototype.hasOwnProperty.call(selection, playCount)) {
      selection[playCount] = {};
    }

    if (
      !Object.prototype.hasOwnProperty.call(selection[playCount], item.title)
    ) {
      selection[playCount][item.title] = {};
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        selection[playCount][item.title],
        item.script_data
      )
    ) {
      selection[playCount][item.title][item.script_data] = []; // 없으면 빈 배열 생성
    }

    selection[playCount][item.title][item.script_data].push({
      //선택지
      selection_group: item.selectionGroup,
      selection_no: item.selectionNo,
      selection_order: item.selectionOrder,
      selection_content: item.selection_content,
      selected: item.selected,
    });

    if (!Object.prototype.hasOwnProperty.call(ending, playCount)) {
      ending[playCount] = [];
      playCount = 0;
    }

    if (parseInt(playCount, 10) !== item.play_count) {
      //엔딩
      playCount = item.play_count.toString();
      ending[playCount].push({
        ending_id: item.ending_id,
        ending_title: item.ending_title,
        ending_type: item.ending_type,
      });
    }
  }

  responseData.selection = selection;
  responseData.ending = ending;

  res.status(200).json(responseData);
};

//! 엔딩 선택지 로그
export const getEndingSelectionList = async (req, res) => {
  logger.info(`getEndingSelectionList : ${JSON.stringify(req.body)}`);

  const {
    body: { userkey, project_id, ending_id, lang = "KO" },
  } = req;

  let result = ``;

  //* 최근 엔딩 가져오기(max_play_count)
  result = await slaveDB(
    `
  SELECT MAX(play_count) max_play_count
  FROM user_selection_ending 
  WHERE userkey = ? 
  AND project_id = ?
  ;
  `,
    [userkey, project_id]
  );
  let maxPlayCount = 0;
  if (result.row.length > 0) maxPlayCount = result.row[0].max_play_count;

  //* 엔딩 선택지 로그
  const responseData = {};
  result = await DB(
    `
  SELECT a.episode_id 
  , fn_get_episode_title_lang(a.episode_id, ?) title
  , a.selection_group
  , a.selection_no
  , ${lang} selection_content
  , (SELECT sortkey FROM list_episode WHERE episode_id = a.episode_id) sortkey
  , fn_get_script_data(a.episode_id, a.selection_group, a.selection_no, '${lang}') script_data
  FROM list_selection a, user_selection_ending b
  WHERE a.project_id = b.project_id 
  AND a.episode_id = b.episode_id 
  AND a.selection_group = b.selection_group 
  AND a.selection_no = b.selection_no  
  AND userkey = ?
  AND a.project_id = ?
  AND ending_id = ?
  AND play_count = ?
  ORDER BY sortkey, a.episode_id, a.selection_group, a.selection_order;
  `,
    [lang, userkey, project_id, ending_id, maxPlayCount]
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const item of result.row) {
    if (!Object.prototype.hasOwnProperty.call(responseData, item.title)) {
      responseData[item.title] = [];
    }

    responseData[item.title].push({
      //선택지
      selection_group: item.selection_group,
      selection_no: item.selection_no,
      selection_order: item.selection_order,
      selection_content: item.selection_content,
      selected: item.selected,
      script_data: item.script_data,
    });
  }

  res.status(200).json(responseData);
};

///////////////////// 새로운 선택지 로그 끝 ///////////////////////

//! 리셋 카운드
export const getProjectResetInfo = async (userInfo) => {
  console.log(`getProjectResetInfo`, userInfo);

  const result = await DB(
    `
  SELECT 
  ${userInfo.project_id} project_id
  , fn_get_user_project_reset_count(?, ?) reset_count 
  FROM DUAL;
  `,
    [userInfo.userkey, userInfo.project_id]
  );

  return result.row;
};

// 유저 UID 밸리데이션 체크
export const checkUserIdValidation = async (req, res) => {
  const {
    body: { uid },
  } = req;

  // 제대로된 형식이 아니면 error.
  if (!uid.includes("#") || !uid.includes("-")) {
    respondDB(res, 80056, `UID 정보가 일치하지 않습니다.`);
    return;
  }

  let pin = uid.split("-")[0];
  pin = pin.replace("#", "");
  const userkey = uid.split("-")[1];

  // pin과 userkey 같이 검색.
  const validationResult = await slaveDB(
    `SELECT fn_get_userkey_info(${userkey}) uid
          , userkey 
          , nickname
          , country 
       FROM table_account 
      WHERE userkey = ${userkey} AND pincode = ?;`,
    [pin]
  );
  if (!validationResult.state || validationResult.row.length === 0) {
    respondDB(res, 80056, `UID 정보가 일치하지 않습니다.`);
    return;
  }

  // uid, userkey를 전달.
  const responseData = {};
  responseData.userkey = validationResult.row[0].userkey;
  responseData.uid = validationResult.row[0].uid;
  responseData.nickname = validationResult.row[0].nickname;
  responseData.coin = await getCurrencyQuantity(responseData.userkey, "coin");
  responseData.gem = await getCurrencyQuantity(responseData.userkey, "gem");
  responseData.country = validationResult.row[0].country;

  res.status(200).json(responseData);
};

// 닉네임 변경
export const updateUserNickname = async (req, res) => {
  const {
    body: { userkey, nickname = "" },
  } = req;

  if (!nickname) {
    logger.error(`updateUserNickname error 1`);
    respondDB(res, 80019);
    return;
  }

  if (nickname.length > 12) {
    logger.error(`updateUserNickname error 2`);
    respondDB(res, 80101);
    return;
  }

  // 닉네임 중복 검사
  let result = await DB(
    `SELECT * FROM table_account WHERE userkey <> ? AND nickname = ?;`,
    [userkey, nickname]
  );
  if (!result.state || result.row.length > 0) {
    logger.error(`updateUserNickname error 3`);
    respondDB(res, 80119);
    return;
  }

  // 금칙어 검사
  result = await DB(
    `SELECT fn_check_prohibited_words_exists(?) prohibited_check FROM DUAL;`,
    [nickname]
  );
  if (result.row.length > 0) {
    if (result.row[0].prohibited_check > 0) {
      logger.error(`updateUserNickname error 3`);
      respondDB(res, 80109);
      return;
    }
  }

  result = await DB(
    `UPDATE table_account SET nickname = ? WHERE userkey = ?;`,
    [nickname, userkey]
  );
  if (!result.state) {
    logger.error(`updateUserNickname error 4 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  result = await DB(
    `SELECT userkey, nickname FROM table_account WHERE userkey = ?;`,
    [userkey]
  );

  logAction(userkey, "nickname_update", { userkey, nickname });
  res.status(200).json(result.row[0]);
};

// * 광고로 기다리는 에피소드 열기
export const requestWaitingEpisodeWithAD = async (req, res) => {
  const {
    body: { userkey, project_id },
  } = req;

  // * 현재 프로젝트의 진행중인 에피소드에 대해서 코인을 지불하고 오픈 시간을 앞당긴다.
  // * 에피소드가 열리는 시간은 user_project_current에서의  next_open_time  컬럼이다.

  // project current 체크
  /*
  const rowCheck = await DB(`
  SELECT a.*
    FROM user_project_current a
  WHERE a.userkey = ${userkey}
    AND a.is_special = 0
    AND a.project_id = ${project_id};
  `);

  // projectCurrent가 없네..!?
  if (rowCheck.row.length <= 0) {
    logger.error(
      `requestWaitingEpisode error. No project current ${JSON.stringify(
        req.body
      )}`
    );
    respondDB(res, 80026, "No project current"); // error
    return;
  }
  */

  // * 서버에서 광고보면 줄어드는 시간을 가져온다.
  // 캐시에서 불러오도록 수정함.
  const reduceMin = cache.get("serverMaster").reduce_waiting_time_ad;

  // * 광고를 보고 넘어온 상태기 때문에, 시간을 차감해준다.
  let query = ``;
  query += `
  UPDATE user_project_current
    SET next_open_time = DATE_ADD(next_open_time, INTERVAL ${reduceMin} MINUTE)
  WHERE userkey = ${userkey}
    AND is_special = 0
    AND project_id = ${project_id};  
  `;

  // 결과
  const result = await DB(query);
  if (!result.state) {
    respondDB(res, 80026, result.error);
    logger.error(`requestWaitingEpisodeWithAD : ${result.error}`);
    return;
  }

  // 성공했으면
  // project_current 갱신
  const responseData = {};
  responseData.projectCurrent = await getUserProjectCurrent(req.body); // 프로젝트 현재 플레이 지점 !
  responseData.bank = await getUserBankInfo(req.body); // ! 뱅크 (삭제대상)

  res.status(200).json(responseData);

  if (
    !responseData.projectCurrent ||
    responseData.projectCurrent.length === 0
  ) {
    logger.error(
      `requestWaitingEpisodeWithAD projectCurrent Error ${JSON.stringify(
        req.body
      )}`
    );
  }

  logAction(userkey, "waitingOpenAD", req.body);
  logAD(userkey, project_id, -1, "waitingOpenAD");
}; // ? requestWaitingEpisodeWithAD END

// * 코인을 지불하고 현재 에피소드를 AD => Permanent로 변경
export const requestRemoveCurrentAD = async (req, res) => {
  const {
    body: { userkey, project_id, price = 20, episode_id },
  } = req;

  const userCoin = await getCurrencyQuantity(userkey, "coin"); // 유저 보유 코인수
  // 보유량 체크
  if (price > userCoin) {
    // 80013
    logger.error(
      `requestRemoveCurrentAD error. Not enough coins ${JSON.stringify(
        req.body
      )}`
    );
    respondDB(res, 80013, "Not enouogh coins"); // error
    return;
  }

  let query = mysql.format(
    `CALL sp_use_user_property(?, 'coin', ?, 'remove_current_ad', ?);`,
    [userkey, price, project_id]
  );

  query += mysql.format(`CALL sp_purchase_episode_type2(?, ?, ?, ?, ?, ?)`, [
    userkey,
    project_id,
    episode_id,
    "coin",
    price,
    "Permanent",
  ]);

  // * 소모 처리하고
  const result = await transactionDB(query);

  if (!result.state) {
    respondDB(res, 80026, result.error);
    return;
  }

  const responseData = {};
  responseData.bank = await getUserBankInfo(req.body); // 뱅크
  responseData.episodePurchase = await getUserEpisodePurchaseInfo(req.body); // 구매기록

  res.status(200).json(responseData);

  logAction(userkey, "removeCurrentAD", req.body);
};

//! 프로그레스바 처리
export const resetProjectProgress = async (req, res) => {
  const {
    body: {
      userkey,
      project_id,
      episode_id,
      scene_id = null,
      script_no = 0,
      current_selection_group = -1,
      reset_selection_group = -1,
    },
  } = req;

  let result;
  let currentQuery = ``;
  let resetQuery = ``;
  let quantity = 0;
  let origin_script_no = 0;

  if (
    parseInt(current_selection_group, 10) < 0 ||
    parseInt(reset_selection_group, 10) < 0
  ) {
    logger.error(
      `resetProjectProgress [${userkey}] wrong selection [${current_selection_group}/${reset_selection_group}]`
    );
    respondDB(res, 80019);
    return;
  }

  if (reset_selection_group === 0) quantity = 200;
  else quantity = (current_selection_group - reset_selection_group) * 50;

  //코인 차감
  const userCoin = await getCurrencyQuantity(userkey, "coin");
  if (userCoin < quantity) {
    logger.error(`resetProjectProgress Error`);
    respondDB(res, 80013);
    return;
  }
  currentQuery = `CALL pier.sp_use_user_property(?, 'coin', ?, 'project_progress', ?);`;
  resetQuery += mysql.format(currentQuery, [userkey, quantity, project_id]);

  //현재 script_no 가져오기
  result = await DB(
    `SELECT script_no FROM user_project_current WHERE userkey = ? AND project_id = ? AND is_special = 0;`,
    [userkey, project_id]
  );
  if (result.state && result.row.length > 0)
    origin_script_no = result.row[0].script_no;

  //리셋 처리(user_scene_progress, user_selection_progress, user_selection_current)
  currentQuery = `CALL pier.sp_reset_user_project_progress(?, ?, ?, ?, ?, ?, ?, ?, ?);`;
  resetQuery += mysql.format(currentQuery, [
    userkey,
    project_id,
    episode_id,
    scene_id,
    script_no,
    origin_script_no,
    current_selection_group,
    reset_selection_group,
    quantity,
  ]);

  result = await transactionDB(resetQuery);
  if (!result.state) {
    logger.error(`resetProjectProgress Error ${result.error}`);
    respondDB(res, 80026, result.error);
  }

  // 정보 업데이트 (bank, projectCurrent, sceneProgress, selectionProgress, ability, rowAbility)
};

//! 경로 누적 처리
export const setProjectProgressOrder = async (req, res) => {
  const {
    body: {
      userkey,
      project_id = -1,
      episode_id = -1,
      scene_id = null,
      selection_group = 0,
      route = 0,
    },
  } = req;

  if (!userkey || project_id === -1 || episode_id === -1) {
    logger.error(`setProjectProgressOrder Error`);
    respondDB(res, 80019);
    return;
  }

  //경로 누적 쌓기
  let result = await DB(
    `
  INSERT INTO user_project_progress_order(userkey, project_id, episode_id, scene_id, selection_group, route) 
  VALUES(?, ?, ?, ?, ?, ?);`,
    [userkey, project_id, episode_id, scene_id, selection_group, route]
  );
  if (!result.state) {
    logger.error(`setProjectProgressOrder Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  result = await getUserProjectProgressInfo({
    userkey,
    project_id,
    episode_id,
  });

  res.status(200).json(result);
};

// # 에피소드 구매 타입2 (Rent, OneTime, Permanent)
// * 2021.08.03 추가 로직 1.0.10 버전부터 반영된다.
export const purchaseEpisodeType2 = async (req, res, needResponse = true) => {
  const {
    // 클라이언트에서 구매타입, 사용화폐, 화폐개수를 같이 받아온다.
    body: {
      userkey,
      episodeID,
      purchaseType,
      project_id,
      currency = "none",
      currencyQuantity = 0,
    },
  } = req;

  logger.info(`purchaseEpisodeType2 start [${JSON.stringify(req.body)}]`);

  const useCurrency = currency; // 사용되는 화폐
  const useQuantity = currencyQuantity; // 사용되는 화폐 개수
  let hasFreepass = false; // 자유이용권 갖고 있는지 true/false
  let currentPurchaseType = purchaseType; // 입력되는 구매 형태

  // 구매 형태(purchase_type은 list_standard.purchase_type 참조)

  const responseData = {}; // 응답데이터

  // ! 프리미엄 패스, 원데이 패스, 이프유 패스 구매 확인
  // 클라이언트에서 체크하겠지만 한번 더 체크..
  const freepassCheck = await slaveDB(`
  SELECT a.userkey, a.purchase_no 
  FROM user_premium_pass a
 WHERE a.userkey = ${userkey} 
   AND a.project_id = ${project_id};
  `);

  const ifyouCheck = await slaveDB(`
  SELECT ta.userkey  FROM table_account ta WHERE userkey = ${userkey} AND ifyou_pass_day > 0;
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
    (ifyouCheck.state && ifyouCheck.row.length > 0) ||
    (onedayCheck.state && onedayCheck.row.length > 0)
  ) {
    logger.info(`freepass user [${userkey}]`);

    hasFreepass = true;
    currentPurchaseType = "Permanent"; // 프리패스 이용자는 무조건 소장처리
  } // ? 자유이용권 보유 체크 종료

  // * 프리패스(자유이용권) '미'소지자에 대한 처리
  if (!hasFreepass) {
    // ! 아직 유효한 구매상태인지 체크한다.
    // 대여기간, 1회 플레이, 소장
    // 이중구매는 막아준다. 400 응답
    // 프리패스 이용자가 아닐때만 하는 이유는 프리패스는 이중구매고 뭐고 그냥 구매해도 상관없다.
    const validationCheck = await DB(
      `
      SELECT CASE WHEN uep.permanent = 1 THEN 1
                  ELSE 0 END is_purchased
        FROM user_episode_purchase uep
        WHERE uep.userkey = ? 
          AND uep.episode_id = ?;
    `,
      [userkey, episodeID]
    );

    // 유효한 구매 있음.
    if (
      validationCheck.state &&
      validationCheck.row.length > 0 &&
      validationCheck.row[0].is_purchased > 0
    ) {
      // * 이미 구입했으면 클라이언트에서 정상 동작하도록 처리해준다.(2021.11.18)
      // 한번 봤던 에피소드는 Permanent로 변경해준다. (광고를 두번보게 하지 않음?  )
      /*
      await DB(`
      UPDATE user_episode_purchase 
        SET purchase_type = 'Permanent'
          , permanent  = 1
      WHERE userkey = ${userkey}
        AND episode_id  = ${episodeID};
      `)
      */

      responseData.episodePurchase = await getUserEpisodePurchaseInfo(req.body); // 구매기록
      responseData.bank = await getUserBankInfo(req.body); // bank.
      responseData.userProperty = {}; // 삭제 대상 노드

      if (needResponse) {
        res.status(200).json(responseData);
        return;
      } else {
        return responseData;
      }
    } // ? 유효한 구매 체크 종료

    // ! 사용하려는 재화의 보유고를 체크한다.
    // ! none일때는 제외
    if (useCurrency !== "none") {
      // 보유고가 모자라면 400 응답
      const currentCurrencyCount = await getCurrencyQuantity(
        userkey,
        useCurrency
      );

      // 모자라요!
      if (currentCurrencyCount < useQuantity) {
        logger.error(`purchaseEpisodeType2 Error 2`);
        respondDB(res, 80024, "not enough your property");
        return;
      }
    }
  } // ? 프리패스 미소유자에 대한 처리 끝

  logger.info(
    `purchase procedure call ${episodeID}/${useCurrency}/${useQuantity}/${currentPurchaseType}`
  );

  // ! 실제 구매 처리(type2)
  const purchaseResult = await DB(
    `
  CALL sp_purchase_episode_type2(?,?,?,?,?,?);
  `,
    [
      userkey,
      project_id,
      episodeID,
      useCurrency,
      useQuantity,
      currentPurchaseType,
    ]
  );

  if (!purchaseResult.state) {
    logger.error(`purchaseEpisodeType2 Error 3 ${purchaseResult.error}`);
    respondDB(res, 80022, purchaseResult.error);
    return;
  }

  // ! 재화 소모 처리
  // ! 프리패스 이용자는 재화 소모 처리하지 않음.
  if (!hasFreepass && useCurrency !== "none") {
    const consumeResult = await DB(UQ_USE_CURRENCY, [
      userkey,
      useCurrency,
      useQuantity,
      currentPurchaseType,
      project_id,
    ]);

    // DB ERROR
    if (!consumeResult.state) {
      logger.error(`purchaseEpisodeType2 Error 4 ${consumeResult.error}`);
      respondDB(res, 80022, consumeResult.error);
      return;
    }
  }

  // TODO 유저에게 갱신된 episodePurchase 정보와 bank, ProjectProperty 정보를 함께 준다.
  responseData.episodePurchase = await getUserEpisodePurchaseInfo(req.body); // 구매기록
  responseData.bank = await getUserBankInfo(req.body); // bank.
  responseData.userProperty = {}; // 삭제 대상 노드

  if (needResponse) {
    res.status(200).json(responseData);

    // 로그
    logAction(userkey, "episode_purchase", req.body);
  } else {
    logAction(userkey, "episode_purchase", req.body);

    return responseData;
  }
}; // ? 끝! purchaseEpisodeType2

// ? /////////////////////////////////////////////////////////

// * 코인으로 기다리는 에피소드 열기
export const requestWaitingEpisodeWithCoin = async (req, res) => {
  const {
    body: { userkey, project_id, price },
  } = req;

  // * 현재 프로젝트의 진행중인 에피소드에 대해서 코인을 지불하고 오픈 시간을 앞당긴다.
  // * 에피소드가 열리는 시간은 user_project_current에서의  next_open_time  컬럼이다.
  logger.info(`requestWaitingEpisodeWithCoin : ${JSON.stringify(req.body)}`);

  // project current 체크
  const rowCheck = await slaveDB(`
  SELECT a.*
    FROM user_project_current a
  WHERE a.userkey = ${userkey}
    AND a.is_special = 0
    AND a.project_id = ${project_id};
  `);

  // projectCurrent가 없네..!?
  if (rowCheck.row.length <= 0) {
    logger.error(
      `requestWaitingEpisode error. No project current ${JSON.stringify(
        req.body
      )}`
    );
    respondDB(res, 80026, "No project current"); // error
    return;
  }

  const episodeID = rowCheck.row[0].episode_id; // 에피소드 ID
  const userCoin = await getCurrencyQuantity(userkey, "coin"); // 유저 보유 코인수

  // 보유량 체크
  if (price > userCoin) {
    // 80013
    logger.error(
      `requestWaitingEpisode error. Not enough coins ${JSON.stringify(
        req.body
      )}`
    );
    respondDB(res, 80013, "Not enouogh coins"); // error
    return;
  }

  // * 소모 처리하고, open 시간 바꿔준다.
  let query = ``;

  // 재화 소모처리
  query += mysql.format(
    `CALL sp_use_user_property(?, 'coin', ?, 'open_force', ?);`,
    [userkey, price, project_id]
  );

  // 업데이트 쿼리
  query += `
  UPDATE user_project_current
    SET next_open_time = date_add(now(), INTERVAL -1 minute) 
  WHERE userkey = ${userkey}
    AND is_special = 0
    AND project_id = ${project_id};`;

  // 결과
  const result = await transactionDB(query);
  if (!result.state) {
    respondDB(res, 80026, result.error);
    return;
  }

  console.log(`requestWaitingEpisodeWithCoin #1`);

  // * 에피소드 구매 처리
  req.body.episodeID = episodeID;
  req.body.purchaseType = "Permanent";
  req.body.currency = "coin";
  req.body.currencyQuantity = 0; // 0으로 구매해야한다.(purchaseEpisodeType2 사용해야되서 쓴다)

  // 코인으로 기다리면 무료를 해제했을때는 Permanent로 처리한다.
  const responseData = {};
  // await purchaseEpisodeType2(req, res, false);
  await DB(`CALL sp_purchase_episode_type2(?,?,?,?,?,?);`, [
    userkey,
    project_id,
    episodeID,
    "coin",
    0,
    "Permanent",
  ]);

  console.log(`requestWaitingEpisodeWithCoin #2`);

  // 갱신한다.
  responseData.episodePurchase = await getUserEpisodePurchaseInfo(req.body); // 구매기록
  responseData.bank = await getUserBankInfo(req.body); // bank.
  responseData.userProperty = {}; // 삭제 대상 노드
  responseData.projectCurrent = await getUserProjectCurrent(req.body); // 프로젝트 현재 플레이 지점 !
  // responseData.bank = await getUserBankInfo(req.body); // 뱅크

  console.log(`requestWaitingEpisodeWithCoin #3`);
  res.status(200).json(responseData);

  // 오류 체크
  if (
    !responseData.projectCurrent ||
    responseData.projectCurrent.length === 0
  ) {
    logger.error(
      `requestWaitingEpisodeWithCoin projectCurrentError : ${JSON.stringify(
        req.body
      )}`
    );
  }

  /*
  logger.info(
    `requestWaitingEpisodeWithCoin END : ${JSON.stringify(responseData)}`
  );
  */

  logAction(userkey, "waitingOpenCoin", req.body);
}; // ? requestWaitingEpisodeWithCoin END

// * 유저의 작품 알림 설정하기
export const setUserProjectNotification = async (req, res) => {
  const {
    body: { userkey, project_id, is_notify },
  } = req;

  // 데이터가 없으면 insert, 있으면 update 해주기
  const result = await DB(`
  INSERT INTO user_project_notification (userkey, project_id, is_notify, last_modified)
  VALUES (${userkey}, ${project_id}, ${is_notify}, now()) ON DUPLICATE KEY 
  UPDATE is_notify = ${is_notify}, last_modified = now();   
  `);

  if (!result.state) {
    logger.error(`${JSON.stringify(result.error)}`);
    respondDB(res, 80019, result.error);
    return;
  }

  // 입력 완료 후, 대상 작품의 user_project_current 주기
  const responseData = {};
  responseData.projectCurrent = await getUserProjectCurrent(req.body);
  responseData.is_notify = is_notify; // 결과값

  res.status(200).json(responseData);
};

// 평가 팝업 히스토리 저장
export const updateRateHistory = (req, res) => {
  const {
    body: { userkey, rate_result },
  } = req;

  // 굳이 await 하지 않고 업데이트는 따로 처리하고
  DB(
    `
  UPDATE table_account 
   SET last_rate_date = now()
     , rate_result = ${rate_result}
    WHERE userkey  = ${userkey};
  `,
    []
  );

  // log
  logAction(userkey, "updateRate", req.body);

  // 바로 리턴
  res.status(200).json(req.body);
};
