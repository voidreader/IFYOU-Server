import mysql from "mysql2/promise";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { getUserBankInfo } from "../controllers/bankController";

// 재화 수량 조회
// * 특정 그룹 재화를 위한 기능 추가 (1회권)
const getCurrencyQuantity = async (userkey, currency, isGroup = false) => {
  let result;

  if (isGroup) {
    result = await DB(
      `SELECT fn_get_user_group_property(?, ?) quantity
      FROM DUAL;`,
      [userkey, currency]
    );
  } else {
    result = await DB(
      `SELECT fn_get_user_property(?, ?) quantity
      FROM DUAL;`,
      [userkey, currency]
    );
  }

  if (result.state && result.row.length > 0) {
    return result.row[0].quantity;
  } else {
    if (!result.state) {
      logger.error(`getCurrencyQuantity Error ${result.error}`);
    }

    return 0;
  }
};

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
  let currentInfo = [];

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
    FROM user_project_current a
    WHERE a.userkey = ?
    AND a.project_id = ?
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

    console.log(`project current is null `, initResult.row[0]);

    if (initResult.row[0] === undefined || initResult.row[0] === null)
      currentInfo = [];
    else currentInfo = initResult.row[0];
  } else {
    currentInfo = result.row;
  }

  currentInfo.forEach((item) => {
    const openDate = new Date(item.next_open_time);
    item.next_open_tick = openDate.getTime();
  });

  return currentInfo;
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
  let projectCurrent;

  if (result.row[0].length > 0) projectCurrent = result.row[0];
  else projectCurrent = [];

  projectCurrent.forEach((item) => {
    const openDate = new Date(item.next_open_time);
    item.next_open_tick = openDate.getTime();
  });

  return projectCurrent;
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

  const profileResult = await DB(
    `
  SELECT currency_type
  , fn_get_design_info(icon_image_id, 'url') icon_image_url
  , fn_get_design_info(icon_image_id, 'key') icon_image_key
  FROM user_profile_currency a, com_currency b 
  WHERE a.currency = b.currency 
  AND userkey =?
  AND currency_type IN ( 'portrait', 'frame' );
  `,
    [userkey]
  );

  // uid, userkey를 전달.
  const responseData = {};
  responseData.userkey = validationResult.row[0].userkey;
  responseData.uid = validationResult.row[0].uid;
  responseData.nickname = validationResult.row[0].nickname;
  responseData.coin = await getCurrencyQuantity(responseData.userkey, "coin");
  responseData.profile = profileResult.row;

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
    respondDB(res, 80100);
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

// * 코인으로 기다리는 에피소드 열기
export const requestWaitingEpisodeWithCoin = async (req, res) => {
  const {
    body: { userkey, project_id, price },
  } = req;

  // * 현재 프로젝트의 진행중인 에피소드에 대해서 코인을 지불하고 오픈 시간을 앞당긴다.
  // * 에피소드가 열리는 시간은 user_project_current에서의  next_open_time  컬럼이다.

  // project current 체크
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
    SET next_open_time = now() 
  WHERE userkey = ${userkey}
    AND is_special = 0
    AND project_id = ${project_id};`;

  // 결과
  const result = await transactionDB(query);
  if (!result.state) {
    respondDB(res, 80026, result.error);
    return;
  }

  // 성공했으면
  // project_current 갱신
  const responseData = {};
  responseData.projectCurrent = await getUserProjectCurrent(req.body); // 프로젝트 현재 플레이 지점 !
  responseData.bank = await getUserBankInfo(req.body); // 뱅크

  res.status(200).json(responseData);

  logAction(userkey, "waitingOpenCoin", req.body);
}; // ? requestWaitingEpisodeWithCoin END

// * 광고로 기다리는 에피소드 열기
export const requestWaitingEpisodeWithAD = async (req, res) => {
  const {
    body: { userkey, project_id },
  } = req;

  // * 현재 프로젝트의 진행중인 에피소드에 대해서 코인을 지불하고 오픈 시간을 앞당긴다.
  // * 에피소드가 열리는 시간은 user_project_current에서의  next_open_time  컬럼이다.

  // project current 체크
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

  // * 서버에서 광고보면 줄어드는 시간을 가져온다.
  const reduceMin = (
    await DB(
      `SELECT reduce_waiting_time_ad  FROM com_server cs WHERE server_no = 1;`
    )
  ).row[0].reduce_waiting_time_ad;

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
  const result = await transactionDB(query);
  if (!result.state) {
    respondDB(res, 80026, result.error);
    return;
  }

  // 성공했으면
  // project_current 갱신
  const responseData = {};
  responseData.projectCurrent = await getUserProjectCurrent(req.body); // 프로젝트 현재 플레이 지점 !
  responseData.bank = await getUserBankInfo(req.body); // 뱅크

  res.status(200).json(responseData);

  logAction(userkey, "waitingOpenAD", req.body);
}; // ? requestWaitingEpisodeWithAD END
