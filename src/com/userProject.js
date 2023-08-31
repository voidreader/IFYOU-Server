import mysql from "mysql2/promise";
import { DB, logAction, logAD, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respond, respondDB, respondSuccess } from "../respondent";
import { getCurrencyQuantity } from "../controllers/bankController";

import { cache } from "../init";

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
