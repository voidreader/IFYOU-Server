import mysql from "mysql2/promise";
import routes from "../routes";
import { DB, logAdmin, transactionDB } from "../mysqldb";
import {
  Q_INSERT_SCRIPT_RECOVER,
  Q_RECOVER_SCRIPT,
  Q_SCRIPT_CLEAR,
  Q_SCRIPT_SELECT,
  Q_SELECT_SCRIPT_VALIDATION,
  Q_SP_CALL_SCRIPT_VALIDATION,
  Q_INSERT_EPISODE,
  Q_SELECT_PROJECT_EPISODE,
  Q_SCRIPT_INSERT,
} from "../QStore";
import { logger } from "../logger";

import {
  respondRedirect,
  respondDB,
  adminLogInsert,
  respondAdminSuccess,
  respondError,
} from "../respondent";

// 프로젝트 에피소드 리스트(ADMIN)
export const postSelectProjectEpisodeList = async (req, res) => {
  const {
    params: { id },
    body: { lang = "KO" },
  } = req;

  logger.info(`postSelectProjectEpisodeList [${id}], [${lang}]`);

  // 조회 (에피소드 구분없이 모든 에피소드 조회)
  const allEpisodes = await DB(Q_SELECT_PROJECT_EPISODE, [
    lang,
    lang,
    lang,
    lang,
    id,
  ]);

  const mainEpisodes = []; // 메인 에피소드
  const sideEpisodes = []; // 사이드 에피소드
  const endingEpisodes = []; // 엔딩
  const organized = []; // 정렬된

  logger.info(`All Episodes Count [${allEpisodes.row.length}]`);

  // 에피소드 type에 따라서 각 배열로 따로 정리
  allEpisodes.row.forEach((element) => {
    // 에피소드 형태별 수집하기
    if (element.episode_type === "chapter") {
      mainEpisodes.push(element);
    } else if (element.episode_type === "side") {
      element.indexed_title = `[사이드] ${element.title}`; // 타이틀 변경
      sideEpisodes.push(element);
    } else if (element.episode_type === "ending") {
      element.indexed_title = `[엔딩] ${element.title}`;
      endingEpisodes.push(element);
    }
  });
  // chapter, ending, side의 순서대로 조회된다.

  logger.info(
    `Each Episodes Count [${mainEpisodes.length}] / [${endingEpisodes.length}] / [${sideEpisodes.length}]`
  );

  let mainIndex = 1;
  // 정규 에피소드부터 쌓기 시작한다.
  // title은 그대로 두고 색인 타이틀 indexed_title 을 추가한다.
  mainEpisodes.forEach((item) => {
    item.indexed_title = `[${mainIndex}] ${item.title}`;
    mainIndex += 1;

    organized.push(item);

    // ending쪽에서 연결된거 찾는다. (리스트 순서 떄문에!)
    endingEpisodes.forEach((ending) => {
      if (ending.depend_episode === item.episode_id) {
        organized.push(ending);
      }
    });
  }); // 메인과 연결된 엔딩 집어넣기.

  // 연결되지 않은 엔딩 집어넣기
  endingEpisodes.forEach((item) => {
    if (item.depend_episode < 0) {
      // 연결되지 않은 것만
      organized.push(item);
    }
  });

  // 연결이 끊긴 엔딩도 집어넣기
  endingEpisodes.forEach((item) => {
    if (!organized.includes(item)) {
      // 연결되지 않은 것만
      organized.push(item);
    }
  });

  // 일단 사이드 일괄로 때려넣기(나중에 목록 분리할 예정 )
  sideEpisodes.forEach((item) => {
    organized.push(item);
  });

  logger.info(`Organized Episode Count [${organized.length}]`);

  const result = {};
  result.episodes = organized; // 최종 배열 할당,
  res.status(200).send(result.episodes); // 보내기!
}; // ? 프로젝트 에피소드 리스트 끝!

// 에피소드 신규 입력 (2021.05.17)
export const postInsertEpisodeVer2 = async (req, res) => {
  const {
    params: { id },
    body: { episode_type, title, lang = "KO", summary = null },
  } = req;

  // logger.info(`postInsertEpisode : ${JSON.stringify(body)}`);
  // 신규 입력!
  const result = await DB(Q_INSERT_EPISODE, [id, episode_type, title]);
  if (!result.state) {
    logger.error(`postInsertEpisodeVer2 Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 입력한 에피소드 ID를 받아서 detail 입력 추가(다국어 처리 준비 과정)
  // 입력한 에피소드 ID
  const getEpisodeID = await DB(
    `SELECT episode_id FROM list_episode WHERE project_id = ? AND title = ? and episode_type = ?`,
    [id, title, episode_type]
  );

  const episodeID = getEpisodeID.row[0].episode_id;
  logger.info(`Current Inserted EpisodeID : [${episodeID}]`);

  // 다국어 처리 입력하기.
  const resultDetail = await DB(`CALL sp_update_episode_detail(?, ?, ?, ?)`, [
    episodeID,
    lang,
    title,
    summary,
  ]);

  adminLogInsert(req, "episode_insert"); 

  // 완료 후 리스트 조회 redirect 처리
  respondRedirect(
    req,
    res,
    postSelectProjectEpisodeList,
    resultDetail,
    "postInsertEpisodeVer2"
  );
}; // 끝

// ! 에피소드 수정(2021.06.06 - 이미지 연결 타입)
export const postUpdateEpisode = async (req, res) => {
  const {
    params: { id },
    body: {
      episode_id,
      title,
      ending_type = "final",
      price,
      episode_status = 0,
      depend_episode = -1,
      unlock_style = "none",
      unlock_episodes = null,
      unlock_coupon = null,
      unlock_scenes = null,
      sale_price = 1,
      square_image_id,
      popup_image_id,
      summary = null,
      lang = "KO",
      currency = "gem",
      one_currency = "gem",
      one_price = 1,
      first_reward_currency = "coin",
      first_reward_quantity = 0,
    },
  } = req;

  logger.info(`<postUpdateEpisode> [${JSON.stringify(req.body)}]`);

  // 타이틀은 프로시저에서 업데이트 한다. (다국어 처리 때문에..)
  const updateQuery = `

  `;

  const result = await DB(
    `
      UPDATE list_episode
       SET ending_type  = ?
       , price = ?
       , episode_status = ?
       , depend_episode = ?
       , unlock_style = ?
       , unlock_episodes = ?
       , unlock_coupon = ?
       , unlock_scenes = ?
       , sale_price = ?
       , square_image_id = ?
       , popup_image_id = ?
       , currency = ?
       , one_currency = ?
       , one_price = ?
       , first_reward_currency = ?
       , first_reward_quantity = ?
    WHERE episode_id = ?;
    `,

    [
      ending_type,
      price,
      episode_status,
      depend_episode,
      unlock_style,
      unlock_episodes,
      unlock_coupon,
      unlock_scenes,
      sale_price,
      square_image_id,
      popup_image_id,
      currency,
      one_currency,
      one_price,
      first_reward_currency,
      first_reward_quantity,
      episode_id,
    ]
  );

  if (!result.state) {
    logger.error(`postUpdateEpisode Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 다국어 처리 입력하기.
  const resultDetail = await DB(`CALL sp_update_episode_detail(?, ?, ?, ?)`, [
    episode_id,
    lang,
    title,
    summary,
  ]);

  adminLogInsert(req, "episode_update"); 

  respondRedirect(
    req,
    res,
    postSelectProjectEpisodeList,
    resultDetail,
    "postUpdateEpisode"
  );
}; // ? end of postUpdateEpisode

// 에피소드 삭제
export const postDeleteEpisode = async (req, res) => {
  const {
    params: { id },
    body: { episode_id },
  } = req;

  const querystr = `
    DELETE FROM list_episode WHERE episode_id = ?;
    DELETE FROM list_episode_detail WHERE episode_id = ?;
  `;

  await DB(querystr, [episode_id, episode_id]);

  // res.redirect(routes.episodeList(id));

  respondAdminSuccess(req, res, null, "episode_delete", postSelectProjectEpisodeList);

};

/////////////////////////////////

// 에피소드의 스크립트 조회하기 (배열로 리턴하기)
export const postSelectScript = async (req, res) => {
  console.log(req.body);

  const {
    params: { id, episodeID },
    body: { lang = "KO" },
  } = req;

  logger.info(`postSelectScript [${id}/${episodeID}]`);

  const querystr = `
    SELECT a.scene_id 
    , a.template 
    , a.speaker 
    , a.script_data 
    , a.target_scene_id 
    , a.requisite 
    , a.character_expression 
    , a.emoticon_expression 
    , a.in_effect 
    , a.out_effect 
    , a.bubble_size 
    , a.bubble_pos 
    , a.bubble_hold 
    , a.bubble_reverse 
    , a.emoticon_size 
    , a.voice 
    , a.autoplay_row 
    , a.dev_comment 
    , a.project_id 
    , a.episode_id
  FROM list_script a
  WHERE a.project_id = ?
  AND a.episode_id = ?
  AND a.lang = ?
  ORDER BY a.sortkey, a.script_no;  
  `;

  const result = await DB(querystr, [id, episodeID, lang]);

  // console.log(result.row.length);
  const arr = [];

  for (let i = 0; i < result.row.length; i++) {
    arr.push(Object.values(result.row[i]));
  }

  res.status(200).json(arr);
};

// 어드민에서 스크립트 조회! (조회시점엔 순서 관계 없음)
export const postSelectScriptWithObject = async (req, res) => {
  const {
    params: { id, episodeID },
    body: { lang = "KO" },
  } = req;

  logger.info(`postSelectScriptWithObject [${id}/${episodeID}]`);

  const result = await DB(Q_SCRIPT_SELECT, [id, episodeID, lang]);

  res.status(200).json(result);
};

// 스크립트 오브젝트 업데이트
// ! #스크립트 업데이트 오브젝트
export const updateScriptByObject = async (req, res) => {
  const {
    params: { id, episodeID },
    body: { rows, lang = "KO" },
  } = req;

  logger.info(`updateScriptByObject ${rows.length}`);
  if (rows.length > 0) console.log(rows[0]);

  // * script 테이블 삭제 쿼리
  const clearScriptQuery = mysql.format(Q_SCRIPT_CLEAR, [episodeID, lang]);

  // * insert 쿼리 만들기
  let insertQuery = ``;
  let index = 0;
  // 한 행씩 처리
  rows.forEach((item) => {
    // 일부 컬럼 초기화 처리
    if (!item.control) item.control = "";
    if (!item.emoticon_size) item.emoticon_size = "";
    if (!item.autoplay_row) item.autoplay_row = 0;

    const queryParams = [];

    queryParams.push(item.scene_id); // 사건 ID
    queryParams.push(item.template); // 템플릿
    queryParams.push(item.speaker); // 화자
    queryParams.push(item.script_data); // 데이터

    queryParams.push(item.target_scene_id);
    queryParams.push(item.requisite);
    queryParams.push(item.character_expression);
    queryParams.push(item.emoticon_expression);

    queryParams.push(item.in_effect);
    queryParams.push(item.out_effect);
    queryParams.push(item.bubble_size);
    queryParams.push(item.bubble_pos);

    queryParams.push(item.bubble_hold);
    queryParams.push(item.bubble_reverse);
    queryParams.push(item.voice);
    queryParams.push(item.sound_effect);

    queryParams.push(item.autoplay_row);
    queryParams.push(item.dev_comment);
    queryParams.push(id);
    queryParams.push(episodeID);

    queryParams.push(item.control);
    queryParams.push(lang);

    insertQuery += mysql.format(Q_SCRIPT_INSERT, queryParams);
    // if (index === 0) console.log(insertQuery);

    index += 1;
  });

  const result = await transactionDB(`
  ${clearScriptQuery}
  ${insertQuery}
  `);

  // const result = await DB(insertQuery);
  // 입력 실패했을때는, 복원 테이블에서 데이터를 가져와 다시 복원한다.
  if (!result.state) {
    logger.error(`updateScriptByObject Error 2 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 저장 성공시에 validation 체크 한다.
  // 데이터 생성
  const procedure = await DB(Q_SP_CALL_SCRIPT_VALIDATION, [episodeID, id]);
  if (!procedure.state) {
    logger.error(`updateScriptByObject Error 3 ${procedure.error}`);
  }

  logger.info(`${episodeID} Script validation collecting done`);
  const validationResult = await DB(Q_SELECT_SCRIPT_VALIDATION, [episodeID]);

  //! 리프레쉬 오류로 인한 리턴값 수정
  const responseData = {};

  //! 유효성 정보
  responseData.validation = validationResult.row;

  //! 저장 후 갱신된 스크립트 정보
  const reSelectResult = await DB(Q_SCRIPT_SELECT, [id, episodeID, lang]);
  responseData.script = reSelectResult.row;

  //
  respondAdminSuccess(req, res, responseData, "episode_script_update_all");
}; // ? updateScriptByObject

// 최초 에피소드가 등록된 갤러리 이미지 리스트 가져오기
export const getConnectedGalleryImages = async (project_id) => {
  const result = await DB(
    `
  SELECT z.*
    FROM (
  SELECT 'illust' gallery_type
      , a.illust_id
      , a.image_name 
      , a.appear_episode
    FROM list_illust a
  WHERE a.project_id = ${project_id}
    AND a.appear_episode > -1
  UNION ALL   
  SELECT 'live_illust' gallery_type
      , a.live_illust_id 
      , a.live_illust_name 
      , a.appear_episode
    FROM list_live_illust a
  WHERE a.project_id = ${project_id}
    AND a.appear_episode > -1
  UNION ALL  
  SELECT 'minicut' gallery_type
      , a.minicut_id 
      , a.image_name 
      , a.appear_episode
    FROM list_minicut a
  WHERE a.project_id = ${project_id}
    AND a.appear_episode > -1
  UNION ALL
  SELECT 'live_object' gallery_type
      , a.live_object_id 
      , a.live_object_name 
      , a.appear_episode
    FROM list_live_object a
  WHERE a.project_id = ${project_id}
    AND a.appear_episode > -1
  ) z;
  `,
    []
  );

  return result.row;
};
