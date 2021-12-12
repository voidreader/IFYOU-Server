import { DB, logAction } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

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

  const result = await DB(`
  SELECT episode_id 
  , target_scene_id 
  , selection_group
  , selection_no 
  FROM user_selection_current
  WHERE userkey = ? 
  AND project_id = ?
  ORDER BY action_date DESC; 
  `, [userkey, project_id]);

  return result.row; 
};

//* 인게임 중 선택지 저장 
export const updateUserSelectionCurrent = async (req, res) => {
  logger.info(`updateUserSelectionCurrent : ${JSON.stringify(req.body)}`);

  const {
    body:{
      userkey, 
      project_id, 
      episodeID, 
      target_scene_id = -1, 
      selection_group = 0, 
      selection_no = 0,
    }
  } = req;

  const result = await DB(`CALL pier.sp_update_user_selection_current(?, ?, ?, ?, ?, ?);`, 
  [userkey, project_id, episodeID, target_scene_id, selection_group, selection_no]);

  if (!result.state) {
    logger.error(result.error);
  }

  const responseData = await getUserSelectionCurrent(userkey, project_id);

  res.status(200).json(responseData);
};

//! 선택지 로그 top3 리스트 
export const getTop3SelectionList = async(req, res) =>{
  logger.info(`getTop3SelectionList : ${JSON.stringify(req.body)}`);
  
  const {
    body:{
      userkey, 
      project_id,
      lang = "KO", 
    }
  } = req;

  let result = ``;
  
  //* 엔딩 해금 확인 
  result = await DB(`SELECT * 
  FROM user_selection_ending 
  WHERE userkey = ? AND project_id = ?;
  ;`, [userkey, project_id]);
  if(!result.state || result.row.length === 0){
    respondDB(res, 80095);
    return;
  }

  //* 현재 셀렉션(user_selection_current) 값이 있는지 확인 
  let historyCheck = true; 
  result = await DB(`SELECT * FROM user_selection_current 
  WHERE userkey = ? AND project_id =?;
  `, [userkey, project_id]);
  if(!result.state || result.row.length === 0) historyCheck = false; 

  //* 플레이 횟수 가장 큰 값 가져오기
  result = await DB(`
  SELECT MAX(play_count) play_count
  FROM user_selection_hist
  WHERE userkey = ? AND project_id = ?;
  `, [userkey, project_id]);
  const maxPlayCount = result.row[0].play_count;
  let minPlayCount = 0;

  const responseData = {}; 
  const selection = {};
  const ending = {}; 
  //* 셀력센 리스트 
  if(!historyCheck){   //현재 셀렉션에 값이 없으면 히스토리에서 3개 가져옴
    minPlayCount = maxPlayCount - 2 < 0 ? 0 : maxPlayCount -2;
    
    result = await DB(`
    SELECT a.episode_id episodeId 
    , fn_get_episode_title_lang(a.episode_id, ?) title
    , a.selection_group selectionGroup
    , a.selection_no selectionNo
    , a.selection_order selectionOrder
    , ${lang} selection_content
    , CASE WHEN a.selection_group = b.selection_group AND a.selection_no = b.selection_no 
    THEN 'O' ELSE 'X' END selected
    , (SELECT sortkey FROM list_episode WHERE episode_id = a.episode_id) sortkey
    , play_count
    , DATE_FORMAT(origin_action_date, '%Y-%m-%d %T') action_date  
    FROM list_selection a LEFT OUTER JOIN user_selection_hist b 
    ON a.project_id = b.project_id AND a.episode_id AND a.selection_group = b.selection_group
    WHERE userkey = ? 
    AND a.project_id = ?
    AND play_count BETWEEN ? AND ?
    ORDER BY play_count, sortkey, a.episode_id, a.selection_group, a.selection_order;
    `, [lang, userkey, project_id, minPlayCount, maxPlayCount]);
  }else{
    minPlayCount = maxPlayCount - 1 < 0 ? 0 : maxPlayCount -1;

    result = await DB(`
    SELECT a.episode_id episodeId  
    , fn_get_episode_title_lang(a.episode_id, ?) title
    , a.selection_group selectionGroup
    , a.selection_no selectionNo
    , a.selection_order selectionOrder
    , ${lang} selection_content
    , CASE WHEN a.selection_group = b.selection_group AND a.selection_no = b.selection_no 
    THEN 'O' ELSE 'X' END selected
    , (SELECT sortkey FROM list_episode WHERE episode_id = a.episode_id) sortkey  
    , ${maxPlayCount+1} play_count
    ,  DATE_FORMAT(action_date, '%Y-%m-%d %T') action_date  
    FROM list_selection a LEFT OUTER JOIN user_selection_current b 
    on a.project_id = b.project_id AND a.episode_id = b.episode_id AND a.selection_group = b.selection_group
    WHERE userkey = ? 
    AND a.project_id = ?
    UNION ALL 
    SELECT a.episode_id episodeId  
    , fn_get_episode_title_lang(a.episode_id, ?) title
    , a.selection_group selectionGroup
    , a.selection_no selectionNo
    , a.selection_order selectionOrder
    , ${lang} selection_content
    , CASE WHEN a.selection_group = b.selection_group AND a.selection_no = b.selection_no 
    THEN 'O' ELSE 'X' END selected
    , (SELECT sortkey FROM list_episode WHERE episode_id = a.episode_id) sortkey  
    , play_count
    , DATE_FORMAT(origin_action_date, '%Y-%m-%d %T') action_date  
    FROM list_selection a LEFT OUTER JOIN user_selection_hist b 
    on a.project_id = b.project_id AND a.episode_id = b.episode_id AND a.selection_group = b.selection_group
    WHERE userkey = ? 
    AND a.project_id = ?
    AND play_count BETWEEN ? AND ? 
    ORDER BY play_count, sortkey, episodeId, selectionGroup, selectionOrder;     
    `, [lang, userkey, project_id, lang, userkey, project_id, minPlayCount, maxPlayCount]);
  }
  // eslint-disable-next-line no-restricted-syntax
  for(const item of result.row) {
    let playCount = item.play_count.toString(); 
    if (!Object.prototype.hasOwnProperty.call(selection, playCount)) {
      selection[playCount] = []; 
    }
    selection[playCount].push({
      episode_id : item.episodeId, 
      title : item.title, 
      selection_group : item.selectionGroup, 
      selection_no : item.selectionNo,
      selection_order : item.selectionOrder, 
      selection_content : item.selection_content, 
      selected : item.selected, 
    });

    if (!Object.prototype.hasOwnProperty.call(ending, playCount)) {
      ending[playCount] = []; 
      playCount = 0; 
    }
    if(parseInt(playCount,10) !== item.play_count){  
      playCount = item.play_count.toString();
      // eslint-disable-next-line no-await-in-loop
      const endingResult = await DB(`
      SELECT
      ending_id
      , ifnull(fn_get_episode_title_lang(ending_id, ?), '') ending_title 
      FROM user_selection_ending 
      WHERE userkey = ? 
      AND project_id = ?
      AND episode_id = ?
      AND origin_action_date = ?;
      `, [lang, userkey, project_id, item.episodeId, item.action_date]);
      if(!endingResult.state || endingResult.row.length === 0){
        ending[playCount].push({});  
      }else{
        ending[playCount].push({
          ending_id : endingResult.row[0].ending_id,
          ending_title : endingResult.row[0].ending_title, 
        });          
      }
    }
  }
  
  responseData.selection = selection; 
  responseData.ending = ending;
  
  res.status(200).json(responseData);
};

//! 엔딩 선택지 로그 
export const getEndingSelectionList = async(req, res) => {
  
  const {
    body:{
      userkey, 
      project_id, 
      ending_id, 
      lang = "KO",
    }
  } = req;

  let result = ``;

  //* 최근 엔딩 가져오기
  result = await DB(`
  SELECT MAX(DATE_FORMAT(update_date, '%Y-%m-%d %T')) update_date
  FROM user_selection_ending 
  WHERE episode_id = (
    SELECT episode_id 
    FROM list_episode 
    WHERE project_id = ?
    ORDER BY sortkey, episode_id 
    LIMIT 1)
  AND selection_group = 1 
  ;
  `, [project_id]);

  const max_update_date = result.row[0].update_date; 

  //console.log(max_action_date);

  //* 엔딩 선택지 로그
  result = await DB(`
  SELECT a.episode_id 
  , fn_get_episode_title_lang(a.episode_id, ?) title
  , a.selection_group
  , a.selection_no
  , a.selection_order
  , ${lang} selection_content
  , CASE WHEN a.selection_group = b.selection_group AND a.selection_no = b.selection_no 
  THEN 'O' ELSE 'X' END selected
  , (SELECT sortkey FROM list_episode WHERE episode_id = a.episode_id) sortkey
  FROM list_selection a LEFT OUTER JOIN user_selection_ending b
  ON a.project_id = b.project_id AND a.episode_id = b.episode_id AND a.selection_group = b.selection_group
  WHERE userkey = ?
  AND a.project_id = ?
  AND ending_id = ?
  AND update_date >= ? 
  ORDER BY sortkey, a.episode_id, a.selection_group, a.selection_order;
  `, [lang, userkey, project_id, ending_id, max_update_date]);

  res.status(200).json(result.row);
};

///////////////////// 새로운 선택지 로그 끝 ///////////////////////