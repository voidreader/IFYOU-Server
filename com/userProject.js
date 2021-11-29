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
