import mysql from "mysql2/promise";
import { DB, logAction } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { getCurrencyQuantity } from "../controllers/accountController";

// 작품 선택지 선택 Progress
export const getUserProjectSelectionProgress = async (userInfo) => {
  const result = await DB(
    `
    SELECT a.episode_id 
        , a.target_scene_id
        , a.selection_data
    FROM user_selection_progress a
    WHERE a.userkey = ?
    AND a.project_id = ?
    ORDER BY a.update_date desc;
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

  const result = await DB(
    `
    SELECT a.project_id
    , a.episode_id 
    , a.is_special
    , ifnull(a.scene_id, '') scene_id
    , ifnull(a.script_no, '') script_no
    , fn_check_episode_is_ending(a.episode_id) is_ending
    , a.is_final
    FROM user_project_current a
    WHERE a.userkey = ?
    AND a.project_id = ?;
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

    console.log(`project current is null `, initResult.row[0]);

    if (initResult.row[0] === undefined || initResult.row[0] === null)
      return [];
    else return initResult.row[0];
  } else {
    return result.row;
  }
};

// * 유저의 프로젝트내 현재 위치 업데이트
export const requestUpdateProjectCurrent = async ({
  userkey,
  project_id,
  episodeID,
  scene_id = null,
  script_no = 0,
  is_final = 0, // 막다른 길
}) => {
  console.log(
    `requestUpdateProjectCurrent ${userkey}/${project_id}/${episodeID}/${scene_id}/${script_no}/${is_final}`
  );

  const result = await DB(
    `
      CALL sp_update_user_project_current(?,?,?,?,?,?);
      `,
    [userkey, project_id, episodeID, scene_id, script_no, is_final]
  );

  if (!result.state) {
    logger.error(result.error);
    return [];
  }

  // console.log(result.row[0][0]);

  if (result.row[0].length > 0) return result.row[0];
  else return [];
};

// * 유저의 프로젝트내 현재 위치 업데이트
export const updateUserProjectCurrent = async (req, res) => {
  logger.info(`updateUserProjectCurrent : ${JSON.stringify(req.body)}`);

  const result = await requestUpdateProjectCurrent(req.body);
  res.status(200).json(result);

  logAction(req.body.userkey, "project_current", req.body);
};

///////////////////// 새로운 선택지 로그 시작 ///////////////////////

//* 현재 선택지 로그 가져오기
const getUserSelectionCurrent = async (userkey, project_id) => {
  const result = await DB(
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

//* 인게임 중 선택지 저장
export const updateUserSelectionCurrent = async (req, res) => {
  logger.info(`updateUserSelectionCurrent : ${JSON.stringify(req.body)}`);

  const {
    body: {
      userkey,
      project_id,
      episodeID,
      target_scene_id = -1,
      selection_group = 0,
      selection_no = 0,
    },
  } = req;

  const result = await DB(
    `CALL pier.sp_update_user_selection_current(?, ?, ?, ?, ?, ?);`,
    [
      userkey,
      project_id,
      episodeID,
      target_scene_id,
      selection_group,
      selection_no,
    ]
  );

  if (!result.state) {
    logger.error(`updateUserSelectionCurrent error`);
    logger.error(result.error);
  }

  const responseData = await getUserSelectionCurrent(userkey, project_id);

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
  result = await DB(
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
export const getProjectResetInfo = async (userInfo) =>{
  console.log(`getProjectResetInfo`, userInfo);

  const result = await DB(`
  SELECT 
  ${userInfo.project_id} project_id
  , fn_get_user_project_reset_count(?, ?) reset_count 
  FROM DUAL;
  `, [userInfo.userkey, userInfo.project_id]);

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
  const validationResult = await DB(
    `SELECT fn_get_userkey_info(${userkey}) uid
          , userkey 
          , nickname 
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

  res.status(200).json(responseData);
};
