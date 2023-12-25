/* eslint-disable no-restricted-syntax */
import mysql from "mysql2/promise";
import { response } from "express";
import dotenv from "dotenv";
import { DB, logAction, transactionDB, logDB, slaveDB } from "../mysqldb";

import {
  clearUserEpisodeSceneProgress,
  updateUserIllustHistory,
  updateUserMinicutHistoryVer2,
  resetPlayingEpisode,
  updateUserProjectSceneHist,
} from "./accountController";
import { logger } from "../logger";

import {
  getServerMasterInfo,
  getPackageClientTextList,
} from "./serverController";

import { respondDB, respondFail, respondSuccess } from "../respondent";
import {
  updateUserProjectCurrent,
  requestUserProjectCurrent,
} from "../com/userProject";

import { reportRequestError } from "./logController";
import {
  requestSingleGameCoupon,
  requestSingleGameCouponFromWeb,
  useCoupon,
} from "./couponController";

import { addUserAbility } from "./abilityController";

import {
  requestCompleteDLC_Episode,
  requestCompleteEpisodeOptimized,
} from "./playingStoryAPI";

import {
  createArabicGlossary,
  createComGlossary,
  createJapanGlossary,
  deleteGlossary,
  translateComLocalize,
  translateProjectDataWithGlossary,
  translateProjectDataWithoutGlossary,
  translateProjectSpecificDataWithGlossary,
  translateScriptWithGlossary,
  translateScriptWithoutGlossary,
  translateSingleEpisode,
  translateSingleEpisodeWithoutGlossary,
  translateText,
  translateWithGlossary,
} from "../com/com";
import {
  getSurveyMain,
  getSurveyDetail,
  receiveSurveyReward,
  requestLocalizingSurvey,
} from "./surveyController";
import {
  chargeEnergyByAdvertisement,
  getDetailDLC,
  getOtomeEpisodeAdRewardExists,
  getPackageDLC,
  getPackageInappProduct,
  getPackageProject,
  getPackUserPurchaseList,
  getSingleGameScriptWithResources,
  getUserInappPurchaseList,
  loginPackage,
  purchaseDLC,
  purchaseOtomeChoice,
  purchaseOtomeItem,
  purchaseOtomeProduct,
  purchasePackageInappProduct,
  recoverFailPurchase,
  requestNovelPackageReceiveAllMail,
  requestNovelPackageReceiveSingleMail,
  requestOtomeAdReward,
  requestOtomeEpisodeClearAdReward,
  requestOtomeTimerReward,
  requestPackageStoryInfo,
  requestUnreadMailList,
  requestUserProfileAbilityOnly,
  resetDLC,
  resetOtomeGameProgress,
  updateAlterName,
  updateChangeOtomeDress,
  updateMainOtomeDress,
  updateOtomeSelectionRecord,
  updateUserDLC_Current,
} from "./packageController";
import { initializeClient } from "../com/centralControll";
import { addUserFeedback, updatePackageMission } from "./userController";

dotenv.config();

/* clientController는 미들웨어에서 global.user를 통해 body 파라매터가 저장됩니다. */

// 유저의 미수신 메일 개수 조회
export const getUserUnreadMailCount = async (userkey) => {
  let unreadCount = 0;

  const unreadMailResult = await DB(
    `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
    [userkey]
  );

  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    unreadCount = unreadMailResult.row[0].cnt;

  return unreadCount;
};

// * 쿼리 만들기
export const makeInsertQuery = async (req, res) => {
  const {
    body: { target, schema = "pier" },
  } = req;

  // 컬럼명과 데이터 타입을 가져온다.
  const columns = await DB(
    `SELECT COLUMN_NAME, DATA_TYPE
    FROM information_schema.COLUMNS c WHERE TABLE_NAME =? AND TABLE_SCHEMA = ?
    ORDER BY ORDINAL_POSITION;
    ;`,
    [target, schema]
  );

  let insertQuery = `INSERT INTO ${target} (`;
  let colIndex = 0;
  const colCount = columns.row.length;

  columns.row.forEach((item) => {
    if (colIndex === 0) insertQuery += `${item.COLUMN_NAME}`;
    else insertQuery += `, ${item.COLUMN_NAME}`;

    colIndex += 1;
  });

  insertQuery += `) VALUES (`;

  // for (let i = 0; i < colCount; i++) {
  //   if (i === 0) insertQuery += `?`;
  //   else insertQuery += `, ?`;
  // }

  colIndex = 0;
  let valueColumn = ``;
  columns.row.forEach((item) => {
    valueColumn = "";
    // 숫자타입일 경우
    if (
      item.DATA_TYPE == "int" ||
      item.DATA_TYPE == "tinyint" ||
      item.DATA_TYPE == "bigint" ||
      item.DATA_TYPE == "float"
    ) {
      valueColumn = valueColumn.concat("${", item.COLUMN_NAME, "}");
    } else {
      valueColumn = valueColumn.concat("'${", item.COLUMN_NAME, "}'"); // 스트링은 작은따옴표로 감싸준다.
    }

    if (colIndex === 0) insertQuery += valueColumn;
    else insertQuery += `, ${valueColumn}`;

    colIndex += 1;
  }); // ? END

  insertQuery += `);`;

  res.status(200).send(insertQuery);
};

// * 쿼리 만들기
export const makeSelectQuery = async (req, res) => {
  const {
    body: { target, schema = "pier" },
  } = req;

  // 컬럼명과 데이터 타입을 가져온다.
  const columns = await DB(
    `SELECT COLUMN_NAME, DATA_TYPE
    FROM information_schema.COLUMNS c WHERE TABLE_NAME =? AND TABLE_SCHEMA = ?
    ORDER BY ORDINAL_POSITION;
    ;`,
    [target, schema]
  );

  let selectQuery = `SELECT `;
  let colIndex = 0;

  columns.row.forEach((item) => {
    if (colIndex === 0) selectQuery += `${item.COLUMN_NAME}`;
    else selectQuery += `\n, ${item.COLUMN_NAME}`;

    colIndex += 1;
  });

  selectQuery += `\nFROM ${target}`;

  res.status(200).send(selectQuery);
}; // ? END OF Select Query

// 테이블 카피하기
export const makeCopyInsert = async (req, res) => {
  const {
    body: { target, target_project, current_project },
  } = req;

  const columns = await DB(
    `SELECT COLUMN_NAME, COLUMN_KEY FROM information_schema.COLUMNS c WHERE TABLE_NAME =? ORDER BY ORDINAL_POSITION;`,
    [target]
  );

  let insertQuery = `INSERT INTO ${target} (`;
  let colIndex = 0;

  columns.row.forEach((item) => {
    // 프라이머리 키는 하지 않음
    if (item.COLUMN_KEY.includes("PRI")) return;

    if (colIndex === 0) insertQuery += `${item.COLUMN_NAME}`;
    else insertQuery += `, ${item.COLUMN_NAME}`;

    colIndex += 1;
  });

  insertQuery += `) SELECT `;
  colIndex = 0;
  columns.row.forEach((item) => {
    // 프라이머리 키는 하지 않음
    if (item.COLUMN_KEY.includes("PRI")) return;

    if (item.COLUMN_NAME.includes(`project_id`)) {
      insertQuery += `${target_project} `;
    } else {
      insertQuery += `${item.COLUMN_NAME} `;
    }

    colIndex += 1;

    if (colIndex < columns.row.length - 1) insertQuery += `,`;
  });

  insertQuery += ` FROM ${target} WHERE project_id = ${current_project};`;

  res.status(200).send(insertQuery);
};

export const makeLangInsert = async (req, res) => {
  const {
    body: { target, source_lang = "EN", target_lang },
  } = req;

  // target : 대상 테이블
  // source_lang : 디폴트 언어
  // target_lang : 타겟 언어

  const columns = await DB(
    `SELECT COLUMN_NAME, COLUMN_KEY FROM information_schema.COLUMNS c WHERE TABLE_NAME =? ORDER BY ORDINAL_POSITION;`,
    [target]
  );

  let insertQuery = `INSERT INTO ${target} (`;
  let colIndex = 0;

  columns.row.forEach((item) => {
    if (colIndex === 0) insertQuery += `${item.COLUMN_NAME}`;
    else insertQuery += `, ${item.COLUMN_NAME}`;

    colIndex += 1;
  });

  insertQuery += `) SELECT `;
  colIndex = 0;
  columns.row.forEach((item) => {
    if (item.COLUMN_NAME === "lang") {
      if (colIndex === 0) insertQuery += `'${target_lang}'`;
      else insertQuery += `, '${target_lang}'`;
    } else if (colIndex === 0) insertQuery += `${item.COLUMN_NAME}`;
    else insertQuery += `, ${item.COLUMN_NAME}`;

    colIndex += 1;
  });

  insertQuery += ` FROM ${target} WHERE lang = '${source_lang}';`;

  res.status(200).send(insertQuery);
};

// * 유틸리티
const concatColumns = async (req, res) => {
  const result = await DB(`
  SELECT DISTINCT target_scene_id 
  FROM list_script a
 WHERE a.episode_id IN (SELECT z.episode_id FROM list_episode z WHERE z.project_id = 57 AND z.episode_type ='chapter')
   AND a.template = 'selection'
ORDER BY cast(target_scene_id as UNSIGNED)
;
  `);

  let concatString = "";
  result.row.forEach((item) => {
    concatString += `${item.target_scene_id},`;
  });

  res.status(200).send(concatString);
};

// * 대상 유저의 모든 갤러리 이미지 및 엔딩 오픈 처리
const UnlockUserMemory = async (req, res) => {
  const {
    body: { userkey, project_id },
  } = req;

  const illustQuery = `
  SELECT a.live_illust_id illust_id
      , 'live2d' illust_type
    FROM list_live_illust a
    WHERE a.project_id = ${project_id}
    AND a.is_public  > 0
    AND a.appear_episode  > 0
  UNION all
  SELECT a.illust_id illust_id
    , 'illust' illust_type
  FROM list_illust a
  WHERE a.project_id = ${project_id}
  AND a.is_public  > 0
  AND a.appear_episode  > 0
  ;  
  `;

  const minicutQuery = `
  SELECT a.live_object_id illust_id
     , 'live2d' illust_type
  FROM list_live_object a
 WHERE a.project_id = ${project_id}
   AND a.is_public  > 0
   AND a.appear_episode  > 0
UNION all
SELECT a.minicut_id illust_id
     , 'minicut' illust_type
  FROM list_minicut a
 WHERE a.project_id = ${project_id}
   AND a.is_public  > 0
   AND a.appear_episode  > 0
;
  `;

  const publicIllusts = await DB(illustQuery);
  const publicMinicuts = await DB(minicutQuery);

  let insertQuery = ``;

  publicIllusts.row.forEach((item) => {
    insertQuery += mysql.format(
      `INSERT IGNORE INTO user_illust (userkey, project_id, illust_id, illust_type) VALUES (?, ?, ?, ?);`,
      [userkey, project_id, item.illust_id, item.illust_type]
    );
  });

  publicMinicuts.row.forEach((item) => {
    insertQuery += mysql.format(
      `INSERT IGNORE INTO user_minicut (userkey, project_id, minicut_id, minicut_type) VALUES (?, ?, ?, ?);`,
      [userkey, project_id, item.illust_id, item.illust_type]
    );
  });

  const insertResult = await DB(insertQuery);
  if (!insertResult.state) {
    respondFail(res, insertResult.error, "error", 80019);
    return;
  }

  respondSuccess(res, {});
};

// * 쿼리를 한번에 여러개 사용했을때 어떻게 가져오는지 알고 싶어.
const nestedQuery = async (req, res) => {
  // 쿼리 작성순서대로
  const query = `
  SELECT ld.* FROM list_design ld WHERE design_id = 582;
  SELECT aa.* FROM admin_account aa WHERE email = 'radiogaga.jin@gmail.com';
  SELECT a.* FROM list_project_master a WHERE a.project_id in (57,60);
  `;

  const result = await DB(query);

  // console.log(result);

  // result는 2차원 배열이다. result[0][N], result[1][N], result[2][N] 이런식으로  들어간다.
  console.log("query count : ", result.row.length);
  result.row.forEach((item) => {
    console.log("each query rows : ", item.length);
  });

  res.status(200).json(result.row);
};

const failResponse = (req, res) => {
  respondDB(res, 80033, "에러메세지");
};

// * 맥북에서 업로드된 리소스들 때문에.. 이름 일괄 변경 처리 */
const normalizeResource = async (req, res) => {
  const {
    body: { project_id },
  } = req;

  // 배경
  const result = await DB(`
  select lb.bg_id id, lb.image_name
    FROM list_bg lb
  WHERE lb.project_id = ${project_id};
  `);

  result.row.forEach((item) => {
    DB(
      `
    UPDATE list_bg
       set image_name = ?
    WHERE bg_id = ?
      AND project_id = ${project_id};
    `,
      [item.image_name.normalize("NFC"), item.id]
    );

    // item.image_name = item.image_name.normalize("NFC");
  });

  const minicutResult = await DB(`
  select a.minicut_id id, a.image_name 
    from list_minicut a
  WHERE a.project_id = ${project_id};
  `);

  minicutResult.row.forEach((item) => {
    DB(
      `
    UPDATE list_minicut
       set image_name = ?
    WHERE minicut_id = ?
      AND project_id = ${project_id};
    `,
      [item.image_name.normalize("NFC"), item.id]
    );
  });

  const emoticonResult = await DB(`
  SELECT les.emoticon_slave_id id, les.image_name  FROM list_emoticon_master lem, list_emoticon_slave les  
WHERE lem.project_id = ${project_id}
  AND lem.emoticon_master_id = les.emoticon_master_id ;
  `);

  // const query = ``;

  emoticonResult.row.forEach((item) => {
    DB(
      `
    UPDATE list_emoticon_slave
       set image_name = ?
    WHERE emoticon_slave_id = ?
      AND project_id = ${project_id};
    `,
      [item.image_name.normalize("NFC"), item.id]
    );
  });

  // * 스크립트 처리
  const scriptResult = await DB(`
  SELECT a.script_no, script_data, sound_effect, emoticon_expression 
  FROM list_script a
 WHERE a.project_id = ${project_id};
  `);

  scriptResult.row.forEach((item) => {
    DB(
      `UPDATE list_script
           SET script_data = ?
             , sound_effect = ?
             , emoticon_expression = ?
        WHERE script_no = ?
    `,
      [
        item.script_data.normalize("NFC"),
        item.sound_effect.normalize("NFC"),
        item.emoticon_expression.normalize("NFC"),
        item.script_no,
      ]
    );
  });

  res.status(200).json(result);
};

// * 작품의 히든 요소 강제로 열기
const unlockProjectHiddenElements = async (req, res) => {
  const {
    body: { userkey, project_id },
  } = req;

  // 엔딩 오픈
  await DB(`INSERT IGNORE user_ending (userkey, episode_id, project_id) 
  SELECT ${userkey}
       , le.episode_id
       , le.project_id 
    FROM list_episode le
   WHERE le.episode_type = 'ending'
     AND le.project_id = ${project_id};`);

  // 사이드
  await DB(`
  INSERT IGNORE user_side (userkey, episode_id, project_id) 
  SELECT ${userkey}
       , le.episode_id
       , le.project_id 
    FROM list_episode le
   WHERE le.episode_type = 'side'
     AND le.project_id = ${project_id};`);

  // 갤러리 이미지
  let unlockQuery = ``;
  unlockQuery += `
     DELETE FROM user_illust WHERE userkey = ${userkey} AND project_id = ${project_id};
     DELETE FROM user_minicut WHERE userkey = ${userkey} AND project_id = ${project_id};
   
     INSERT INTO user_illust (userkey, project_id, illust_id, illust_type) 
     SELECT ${userkey}, a.project_id, a.illust_id, 'illust'
       FROM list_illust a
      WHERE a.project_id = ${project_id}
        AND a.is_public = 1
        AND a.appear_episode > 0
        ;
     
     INSERT INTO user_illust (userkey, project_id, illust_id, illust_type) 
     SELECT ${userkey}, a.project_id, a.live_illust_id, 'live2d'
       FROM list_live_illust a
      WHERE a.project_id = ${project_id}
        AND a.is_public = 1
        AND a.appear_episode > 0;  
   
     INSERT INTO user_minicut (userkey, minicut_id, minicut_type, project_id)
     SELECT ${userkey}, a.minicut_id , 'minicut', a.project_id 
       FROM list_minicut a
     WHERE a.project_id = ${project_id}
       AND a.appear_episode > 0
       AND a.is_public = 1;
       
    
     
     INSERT INTO user_minicut (userkey, minicut_id, minicut_type, project_id)
     SELECT ${userkey}, a.live_object_id, 'live2d', a.project_id 
       FROM list_live_object a
     WHERE a.project_id = ${project_id}
       AND a.appear_episode > 0
       AND a.is_public = 1;     
     
     `;

  await DB(unlockQuery); // 실행

  res.status(200).send("done");
};

// * 관리자 계정 전환
const changeAdminAccountStatus = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  await DB(`
    UPDATE table_account 
    SET admin = CASE WHEN admin = 0 THEN 1 ELSE 0 END
   WHERE userkey = ${userkey};
  `);

  const result = await DB(`
  SELECT a.admin FROM table_account a WHERE a.userkey = ${userkey};
  `);

  if (result.row.length <= 0) {
    res.status(400).send("fail");
  } else {
    res.status(200).json(result.row[0]);
  }
};

const requestOP_CalcPackUser = async (req, res) => {
  const users = await slaveDB(`
  SELECT a.userkey
  FROM user_purchase a
 WHERE a.product_id IN ('dress_pack_01', 'dress_pack_02', 'dress_pack_03', 'dress_pack_04');
  `);

  logger.info(`target pack user count : ${users.row.length}`);

  let query = "";

  users.row.forEach((user) => {
    query += mysql.format(`CALL sp_send_user_mail(?, ?, ?, ?, ?, ?);`, [
      user.userkey,
      "inapp",
      "energy",
      255,
      142,
      365,
    ]);
  });

  const result = await transactionDB(query);

  if (!result.state) {
    logger.error(JSON.stringify(result.error));
    respondFail(res, {}, "failed requestOP_CalcPackUser", 80019);
  }

  respondSuccess(res, {});
};

// insert on duplicate query 만들기
const MakeInsertOnDuplicateDeployQuery = async (req, res) => {
  const {
    body: { target_table },
  } = req;

  const targetInfo = await DB(`
    SELECT dtd.table_name, column_name, is_key
      FROM deploy_table_def dtd
    WHERE dtd.table_name = '${target_table}'
    ORDER BY dtd.is_key desc
   ;`);

  let insertQuery = `INSERT INTO ${target_table}(`;
  let params = ``;

  // insert 부분 만들기
  for (let i = 0; i < targetInfo.row.length; i++) {
    const item = targetInfo.row[i];

    insertQuery += item.column_name;

    if (i < targetInfo.row.length - 1) insertQuery += ", ";
  }

  insertQuery += `) VALUES (`;
  params += `[`;

  // param 부분 만들기
  for (let i = 0; i < targetInfo.row.length; i++) {
    const item = targetInfo.row[i];

    insertQuery += `?`;
    params += `item.${item.column_name}`;

    if (i < targetInfo.row.length - 1) {
      insertQuery += ", ";
      params += ", ";
    }
  }

  insertQuery += `) ON DUPLICATE KEY UPDATE `;

  // update 부분 만들기
  for (let i = 0; i < targetInfo.row.length; i++) {
    const item = targetInfo.row[i];

    // unique key가 아닌 컬럼만 처리한다.
    if (item.is_key > 0) {
      continue;
    }
    insertQuery += `${item.column_name} = ?`;
    params += `, item.${item.column_name}`;
    if (i < targetInfo.row.length - 1) insertQuery += ", ";
  }

  insertQuery += `;`;
  params += `]`;

  res.status(200).send(`${insertQuery}\n${params}`);
};

// * 임시 기능 이미지 선택지 관련 내용 주기
const requestImageChoices = async (req, res) => {
  const {
    body: { userkey, choice_count = -1 },
  } = req;

  const result = await DB(`
      SELECT lem.emoticon_owner
      , les.emoticon_slave_id
      , les.image_name
      , les.image_url 
      , les.image_key 
    FROM list_emoticon_master lem 
    , list_emoticon_slave les 
    WHERE lem.project_id = 57
    and les.emoticon_master_id = lem.emoticon_master_id 
    ORDER BY rand() LIMIT 4;  
  `);

  const responseData = {};
  let limitNumber = choice_count;

  // 0보다 작으면 랜덤 1~4
  if (limitNumber < 0) limitNumber = Math.floor(Math.random() * 3) + 1; // 1~4

  responseData.choices = [];
  for (let i = 0; i < limitNumber; i++) {
    const price = Math.floor(Math.random() * 100) + 1;
    if (price <= 40) result.row[i].price = price;
    else result.row[i].price = 0;

    responseData.choices.push(result.row[i]);
  }

  respondSuccess(res, responseData);
};

// * 임시 메소드 (연습용)
const requestChooiceImageChoices = async (req, res) => {
  const {
    body: { userkey, emoticon_slave_id },
  } = req;

  const responseData = { userkey, emoticon_slave_id };
  respondSuccess(res, responseData);
};

// * 텀블벅 후원자 DLC 강제 언락
const requestSponsorDLCUnlock = async (req, res) => {
  const project_id = 142;
  const dlc_id = 6;

  // 105~116 쿠폰 쓴사람 조회
  const users = await DB(`
  SELECT DISTINCT uc.userkey 
  FROM user_coupon uc 
  WHERE uc.coupon_id BETWEEN 105 AND 116;
  `);

  logger.info(`requestSponsorDLCUnlock 대상 유저 : ${users.row.length}`);

  let query = ``;
  users.row.forEach((item) => {
    query += mysql.format(`CALL sp_init_user_dlc_current(?, ?, ?);`, [
      item.userkey,
      project_id,
      dlc_id,
    ]);
  });

  const result = await transactionDB(query);

  if (!result.state) {
    logger.error(`requestSponsorDLCUnlock : [${JSON.stringify(result.error)}]`);
    respondFail(res, {}, "실패", 80019);
    return;
  }

  respondSuccess(res, { "해금 유저": users.row.length });
};

//////////////////////////////////////
// * 각 브랜치에서 필히! 사용하는 요청만 남기고 모두 정리합시다!!!

// * POST 응답 - 오퍼레이션 유틸맄티 관련
export const postOperationUtil = (req, res) => {
  const { func } = req.body;

  if (!func) {
    logger.error(`no func in patch, ${JSON.stringify(req.body)}`);
    respondFail(req, {}, "no func", 80019);
    return;
  }

  // 운영 관련 업무를 위해서 js를 사용해서 결과를 생성합니다.
  switch (func) {
    case "reportRequestError":
      reportRequestError(req, res);
      return;

    case "makeInsertQuery": // Insert Query 만들기
      makeInsertQuery(req, res);
      return;

    case "makeCopyInsert": // Copy & Insert Query 만들기
      makeInsertQuery(req, res);
      return;

    case "makeLangInsert": // Lang 관련 Query 만들기
      makeInsertQuery(req, res);
      return;

    case "concatColumns": //
      concatColumns(req, res);
      return;

    case "nestedQuery": //
      nestedQuery(req, res);
      return;

    case "normalizeResource": //
      normalizeResource(req, res);
      return;

    // ! 구글 자동 번역 관련 요청
    case "translateText": //
      translateText(req, res);
      return;
    case "translateWithGlossary": //
      translateWithGlossary(req, res);
      return;
    case "translateProjectDataWithoutGlossary": //
      translateProjectDataWithoutGlossary(req, res);
      return;
    case "createArabicGlossary": //
      createArabicGlossary(req, res);
      return;

    case "createJapanGlossary": //
      createJapanGlossary(req, res);
      return;
    case "createComGlossary": //
      createComGlossary(req, res);
      return;
    case "translateComLocalize": //
      translateComLocalize(req, res);
      return;
    case "deleteGlossary": //
      deleteGlossary(req, res);
      return;

    case "translateSingleEpisode": //
      translateSingleEpisode(req, res);
      return;

    case "translateSingleEpisodeWithoutGlossary": //
      translateSingleEpisodeWithoutGlossary(req, res);
      return;

    case "translateScriptWithGlossary": // 용어집 사용해서 스크립트 번역
      translateScriptWithGlossary(req, res);
      return;
    case "translateScriptWithoutGlossary": // 용어집 없이 스크립트 번역
      translateScriptWithoutGlossary(req, res);
      return;

    case "translateProjectDataWithGlossary": // 프로젝트 전체 자동 번역
      translateProjectDataWithGlossary(req, res);
      return;
    case "translateProjectSpecificDataWithGlossary": // 프로젝트 특정 데이터 자동 번역
      translateProjectSpecificDataWithGlossary(req, res);
      return;
    // ? 구글 자동 번역 요청 구역 종료

    case "failResponse": // 무조건 실패 응답
      failResponse(req, res);
      return;

    case "UnlockUserMemory": // 이프유 유저의 대상 프로젝트 모든 갤러리 오픈
      UnlockUserMemory(req, res);
      return;

    default:
      respondFail(res, {}, `Not matched func in patch`, 80019);
  }
}; // ? END OF postOperationUtil

// * PUT 응답 받기
export const putClient = (req, res) => {
  const { func } = req.body;

  if (!func) {
    logger.error(`no func in put, ${JSON.stringify(req.body)}`);
    respondFail(req, {}, "no func", 80019);
    return;
  }

  switch (func) {
    case "userFeedback": // 유저 피드백 입력
      addUserFeedback(req, res);
      break;
      
      
    case "recoverFailPurchase": // 유저 피드백 입력
      recoverFailPurchase(req, res);
      break;

    default:
      respondFail(res, {}, `Not matched func in put`, 80019);
  }
}; // ? END PUT

// * 패치 응답 받기
export const patchClient = (req, res) => {
  const { func } = req.body;

  if (!func) {
    logger.error(`no func in patch, ${JSON.stringify(req.body)}`);
    respondFail(req, {}, "no func", 80019);
    return;
  }

  switch (func) {
    case "updatePackageMission":
      updatePackageMission(req, res);
      return;

    case "updateOtomeSelectionRecord": // 유저의 선택지 플레이 기록 저장
      updateOtomeSelectionRecord(req, res);
      return;

    default:
      respondFail(res, {}, `Not matched func in patch`, 80019);
  }
}; // ? END PATCH

// * POST 응답받기 <func에 따라 분배>
export const clientHome = (req, res) => {
  // console.log(req.body);
  const { func } = req.body;

  if (!func) {
    logger.error(`no func ${JSON.stringify(req.body)}`);
    respondFail(req, {}, "no func", 80019);
    return;
  }

  // func로 분류하자..!
  switch (func) {
    case "InitializeClient": // 패키지 연동된 경우 호출
      initializeClient(req, res);
      return;

    case "getServerMasterInfo": // 서버 마스터 정보 및 광고 기준정보 요청
      getServerMasterInfo(req, res);
      return;

    case "loginSinglePackage": // 로그인 처리
      loginPackage(req, res);
      return;

    case "getPackageProject": // 프로젝트 마스터 & 디테일 정보 불러오기
      getPackageProject(req, res);
      return;

    case "requestPackageStoryInfo": // 프로젝트 기준정보 및 유저 플레이 기록 불러오기
      requestPackageStoryInfo(req, res);
      return;

    case "clearUserEpisodeSceneHistory":
      clearUserEpisodeSceneProgress(req, res);
      return;

    case "updateUserProjectSceneHist":
      updateUserProjectSceneHist(req, res);
      return;
    case "resetOtomeGameProgress":
      resetOtomeGameProgress(req, res);
      return;
    case "updateMainOtomeDress":
      updateMainOtomeDress(req, res);
      return;
    case "updateChangeOtomeDress":
      updateChangeOtomeDress(req, res);
      return;
    case "requestOtomeAdReward": // 오토메 광고 보상 요청
      requestOtomeAdReward(req, res);
      return;
    case "requestOtomeTimerReward": // 오토메 타이머 보상 요청
      requestOtomeTimerReward(req, res);
      return;
    case "updateAlterName": // 오토메 이름 수정
      updateAlterName(req, res);
      return;
    case "purchaseOtomeItem": // 오토메 아이템 구매하기 [Deprecated]
      purchaseOtomeItem(req, res);
      return;
    case "purchasePackageInappProduct": // 오토메 아이템 구매하기 신규!
      purchasePackageInappProduct(req, res);
      return;

    case "getPackageDLC": // 패키지 DLC 정보
      getPackageDLC(req, res);
      return;

    case "purchaseDLC": // DLC 구매 (싱글 오토메)
      purchaseDLC(req, res);
      return;
    case "getDetailDLC": // DLC 상세 정보(싱글 오토메)
      getDetailDLC(req, res);
      return;
    case "useCoupon": // 이프유 플랫폼 쿠폰 사용 처리
      useCoupon(req, res);
      return;
    case "requestSingleGameCoupon": // 싱글 오토메 게임 쿠폰 사용 처리
      requestSingleGameCoupon(req, res);
      return;
    case "requestSingleGameCouponFromWeb": // 싱글 오토메 게임 쿠폰 사용 처리(웹페이지)
      requestSingleGameCouponFromWeb(req, res);
      return;

    case "getSurveyMain": // 설문조사(이프유)
      getSurveyMain(req, res);
      return;
    case "getSurveyDetail": // 설문조사 상세정보(이프유)
      getSurveyDetail(req, res);
      return;
    case "receiveSurveyReward": // 설문조사 리워드 처리(이프유)
      receiveSurveyReward(req, res);
      return;

    case "getSingleGameScript": // 에피소드 스크립트 조회(싱글오토메)
      getSingleGameScriptWithResources(req, res);
      return;

    case "purchaseOtomeProduct": // 오토메 게임 인앱상품 구매
      purchaseOtomeProduct(req, res);
      return;

    case "getPackageInappProduct": // 단일 게임 패키지 조회
      getPackageInappProduct(req, res);
      return;

    case "getOtomeEpisodeAdRewardExists": // 오토메 에피소드 클리어 광고보상 유무 체크
      getOtomeEpisodeAdRewardExists(req, res);
      return;

    case "requestOtomeEpisodeClearAdReward": // 오토메 에피소드 클리어 광고보상 요청
      requestOtomeEpisodeClearAdReward(req, res);
      return;

    case "requestUserProfileAbilityOnly": // 유저 능력치 현재 수치정보만 요청하기 (상태이상)
      requestUserProfileAbilityOnly(req, res);
      return;

    case "updateUserDLC_Current": // DLC 플레이 지점 저장 (상태이상)
      updateUserDLC_Current(req, res);
      return;

    case "requestCompleteEpisodeOptimized": // 메인 스트림 에피소드 클리어 처리
      requestCompleteEpisodeOptimized(req, res);
      return;

    case "requestCompleteDLC_Episode": // DLC 에피소드 클리어 처리
      requestCompleteDLC_Episode(req, res);
      return;

    case "resetDLC": // DLC 리셋
      resetDLC(req, res);
      return;

    case "requestOP_CalcPackUser": // 운영업무
      requestOP_CalcPackUser(req, res);
      return;

    case "getPackageClientTextList": // 패키지 클라이언트 로컬라이징 텍스트
      getPackageClientTextList(req, res);
      return;

    case "getNovelPackageUserUnreadMailList": // 패키지 클라이언트 미수신 메일리스트 조회
      requestUnreadMailList(req, res);
      return;

    case "updateUserIllustHistory": // 일러스트 해금 처리
      updateUserIllustHistory(req, res);
      return;

    case "purchaseOtomeChoice": // 유료 선택지 구매
      purchaseOtomeChoice(req, res);
      return;

    case "resetPlayingEpisode": // 현재 플레이중인 에피소드 리셋
      resetPlayingEpisode(req, res);
      return;

    case "addUserAbility": // 유저 호감도 증감 처리
      addUserAbility(req, res);
      return;

    case "requestUserProjectCurrent": // 유저의 현재 진행위치 요청
      requestUserProjectCurrent(req, res);
      return;

    case "requestLocalizingSurvey": // 설문조사 텍스트 조회
      requestLocalizingSurvey(req, res);
      return;

    case "getPackUserPurchaseList": // 패키지 유저 구매내역 [Deprecated]
      getPackUserPurchaseList(req, res);
      return;

    case "getUserInappPurchaseList": // 패키지 유저 구매내역 신규버전!
      getUserInappPurchaseList(req, res);
      return;

    case "requestNovelPackageReceiveAllMail": // 모든 메일 수신
      requestNovelPackageReceiveAllMail(req, res);
      return;

    case "requestNovelPackageReceiveSingleMail": // 단일 메일 수신
      requestNovelPackageReceiveSingleMail(req, res);
      return;

    case "chargeEnergyByAdvertisement": // 광고 보고 에너지 충전
      chargeEnergyByAdvertisement(req, res);
      return;

    case "updateUserMinicutHistoryVer2": // 미니컷 히스토리 해금 정보 업데이트
      updateUserMinicutHistoryVer2(req, res);
      return;

    case "updateUserProjectCurrent": // 플레이 진행 상황 저장
      updateUserProjectCurrent(req, res);
      return;

    case "UnlockUserMemory": // 이프유 유저의 대상 프로젝트 모든 갤러리 오픈
      UnlockUserMemory(req, res);
      return;

    case "makeInsertQuery": // Insert Query 만들기
      makeInsertQuery(req, res);
      return;
    case "makeSelectQuery": // Select Query 만들기
      makeSelectQuery(req, res);
      return;

    case "MakeInsertOnDuplicateDeployQuery": // insert on duplicate 구문 만들기
      MakeInsertOnDuplicateDeployQuery(req, res);
      return;

    case "requestImageChoices": // requestImageChoices
      requestImageChoices(req, res);
      return;

    case "reportRequestError":
      reportRequestError(req, res);
      return;

    case "requestSponsorDLCUnlock":
      requestSponsorDLCUnlock(req, res);
      return;

    case "requestChooiceImageChoices":
      requestChooiceImageChoices(req, res);
      return;

    default:
      logger.error(`clientHome Error ${func}`);
      respondFail(res, {}, "Wrong Request", 80019);
      break;
  }
}; // ? END clientHome
