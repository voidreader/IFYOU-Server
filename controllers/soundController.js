import aws from "aws-sdk";
import mysql from "mysql2/promise";

import { DB, logAdmin } from "../mysqldb";
import {
  Q_DELETE_PROJECT_SOUND,
  Q_INSERT_PROJECT_SOUND,
  Q_SELECT_PROJECT_SOUND,
  Q_SELECT_SOUND_S3,
  Q_UPDATE_PROJECT_SOUND,
  Q_UPDATE_PROJECT_VOICE,
} from "../QStore";

import {
  respond,
  respondError,
  respondRedirect,
  respondDB,
  adminLogInsert,
} from "../respondent";
import { logger } from "../logger";
import { RecordPrviousS3Object, uploadZipResources } from "../com/com";
////////////////////////////////////////////////////////////////////////////////

// ! 유저 관련 처리 /////////////////////////////////////////////////////////////////

// * 유저 보이스 히스토리 조회
// * 2021.12.10 rawVoiceHistory, VoiceHistory를 둘다 주는 형태로 변경
export const getUserVoiceHistory = async (userInfo) => {
  const voiceData = {};

  const result = await DB(
    `
    SELECT ls.sound_id
    , ls.sound_name 
    , ls.speaker
    , ls.sound_url 
    , ls.sound_key 
    , script.script_data 
    , le.episode_id 
    , le.title
    , le.sortkey
    , le.episode_type
    , fn_check_voice_unlock(?, ls.project_id, ls.sound_id) is_open
 FROM list_sound ls 
    , list_script script
    , list_episode le 
WHERE ls.project_id = ?
  AND ls.is_public = 1
  AND script.project_id = ls.project_id 
  AND (script.voice <> '' AND script.voice IS NOT NULL)
  AND script.voice = ls.sound_name 
  AND le.episode_id = script.episode_id 
  AND le.title NOT LIKE '%테스트%'
  AND script.lang = ?
ORDER BY ls.speaker, le.episode_type, le.sortkey;
  `,
    [userInfo.userkey, userInfo.project_id, userInfo.lang]
  );

  // 포장되지 않은 형태
  voiceData.rawVoiceHistory = result.row;

  // * 보이스 배너를 사용하는 캐릭터 네임태그
  // * 엑스트라 보이스 분리용도.
  const voiceNametagResult = await DB(`
  SELECT a.speaker
  FROM list_nametag a
 WHERE a.project_id = ${userInfo.project_id}
   AND a.voice_banner_id > 0;
  `);

  const voiceNametags = [];
  voiceNametagResult.row.forEach((tag) => {
    voiceNametags.push(tag.speaker);
  });

  const voices = {};
  const rows = result.row;
  let speakerName = "";
  rows.forEach((item) => {
    // * 캐릭터 이름 - 에피소드 타이틀 depth로 진행한다.
    // * 네임태그 테이블에 보이스 배너를 소유하지 않은 캐릭터는 엑스트라로 처리한다.

    // 캐릭터 이름을 할당.
    // * 2021.09.29 엑스트라 관련 기준을 추가.
    if (voiceNametags.includes(item.speaker)) speakerName = item.speaker;
    else speakerName = "엑스트라"; // ... 로컬라이징일땐 어떻게하지..!? ㅠㅠ

    // voices에 speakerName 키가 있는지 체크한다.
    if (!Object.prototype.hasOwnProperty.call(voices, speakerName)) {
      voices[speakerName] = {}; // speakerName 주인으로 하는 object 생성
    }

    // * 2021.09.29 나중에 로컬라이징 들어가면 ..힘들어질 예정

    // 타이틀(제목)이 붙어있는지 체크
    if (
      !Object.prototype.hasOwnProperty.call(voices[speakerName], item.title)
    ) {
      voices[speakerName][item.title] = []; // 없으면 빈 배열 생성
    }

    voices[speakerName][item.title].push(item); // 푸시푸시베이비
  });

  // 포장된 상태
  voiceData.voiceHistory = voices;

  return voiceData;
};

// 유저 보이스 오픈 히스토리
export const updateUserVoiceHistory = async (req, res) => {
  const {
    body: { project_id, sound_name, userkey, sound_id = -1 },
  } = req;

  // logger.info(`updateUserVoiceHistory [${JSON.stringify(req.body)}]`);
  let updateSoundID = -1;

  // * 파라매터로 sound_id를 안받으면 DB에서 찾아준다.
  if (sound_id < 0) {
    // 주어진 음성 이름으로 id를 찾는다.
    const idSelect = await DB(`
      SELECT a.sound_id
      FROM list_sound a 
    WHERE a.project_id = '${project_id}'
      AND a.sound_type = 'voice'
      AND a.sound_name = '${sound_name}';
      `);

    if (!idSelect.state || idSelect.row.length <= 0) {
      logger.error(`updateUserVoiceHistory Error 1 ${idSelect.error}`);
      respondDB(res, 80009, "");
      return;
    }

    // soundID  가져오기.
    updateSoundID = idSelect.row[0].sound_id;
  } else {
    updateSoundID = sound_id;
  }

  const existsCheck = await DB(
    `
  SELECT EXISTS (SELECT a.userkey FROM user_voice a WHERE a.userkey = ? AND a.sound_id= ?) is_exists
  FROM DUAL;
  `,
    [userkey, updateSoundID]
  );

  // 없을 경우에만 insert 처리한다.
  if (existsCheck.row[0].is_exists < 1) {
    const insertResult = await DB(
      `
    INSERT INTO user_voice (userkey, sound_id) VALUES (?, ?);
    `,
      [userkey, updateSoundID]
    );

    if (!insertResult.state) {
      logger.error(`updateUserVoiceHistory Error 2 ${insertResult.error}`);
      respondDB(res, 80010, insertResult.error);
      return;
    }
  }

  // * 이 메소드는 너무 많이 호출되기 때문에, 부하를 최소하하기 위해 성공시에는 사운드 이름만 전달.
  res.status(200).send(sound_name);

  // refresh 처리하기.
};

// 프로젝트 배경음
// * 갤러리에서 사용
export const getProjectBGMs = async (userInfo) => {
  const result = await DB(
    `
  SELECT a.sound_id   
     , a.sound_url 
     , a.sound_key 
     , a.game_volume
     , a.public_name sound_name
  FROM list_sound a 
 WHERE a.project_id = ?
   AND a.sound_type  = 'bgm'
   AND a.is_public = 1
  ORDER BY sound_id;
  `,
    [userInfo.project_id]
  );

  return result.row;
};

// ! ADMIN 시작 부분 //////////////////////////////////////////////////////////////
// 사운드 리소스 조회
export const getProjectSoundResource = async (req, res) => {
  const {
    params: { id },
    body: { sound_type },
  } = req;

  const result = await DB(Q_SELECT_PROJECT_SOUND, [id, sound_type]);

  respond(result, res, "getProjectSoundResource");
};

// * 프로젝트 사운드 리소스 신규 입력
export const postInsertProjectSoundResource = async (req, res) => {
  let {
    params: { id },
    body: { sound_name, sound_type, speaker = null },
  } = req;

  let file;

  if (req.file) file = req.file;
  else file = { location: null, key: null, bucket: null };

  // voice가 아닌 경우 speaker는 null로 처리
  if (sound_type !== "voice") speaker = null;

  const result = await DB(Q_INSERT_PROJECT_SOUND, [
    sound_name,
    file.location,
    file.key,
    id,
    sound_type,
    file.bucket,
    speaker,
  ]);

  adminLogInsert(req, "sound_insert");

  respondRedirect(
    req,
    res,
    getProjectSoundResource,
    result,
    "postInsertProjectSoundResource",
    80005
  );
};

// 프로젝트 사운드 리소스 업데이트
export const postUpdateProjectSoundResource = async (req, res) => {
  logger.info(`postUpdateProjectSoundResource`);

  let {
    params: { id },
    body: {
      sound_id,
      sound_name,
      sound_type,
      game_volume,
      speaker = null,
      is_public = 0,
    },
  } = req;

  let file = null;
  if (req.file) file = req.file;
  else file = { location: null, key: null, bucket: null };

  console.log(file);

  // speaker 추가 처리
  if (sound_type !== "voice") speaker = null;

  // 기존 파일 s3에 지우려고!
  const previousS3 = await DB(Q_SELECT_SOUND_S3, [sound_id]);

  let result;

  if (sound_type === "voice") {
    // 보이스의 경우에만 화자와 공개 여부를 추가로 저장
    result = await DB(Q_UPDATE_PROJECT_VOICE, [
      sound_name,
      sound_type,
      file.location,
      file.key,
      file.bucket,
      game_volume,
      speaker,
      is_public,
      sound_id,
    ]);
  } else {
    // 나머지는 화자와 공개 여부 따로 저장할 필요 없음
    result = await DB(Q_UPDATE_PROJECT_SOUND, [
      sound_name,
      sound_type,
      file.location,
      file.key,
      file.bucket,
      game_volume,
      sound_id,
    ]);
  }

  adminLogInsert(req, "sound_update");

  respondRedirect(
    req,
    res,
    getProjectSoundResource,
    result,
    "postUpdateProjectSoundResource",
    80006
  );

  // 이전 파일 삭제
  if (
    file.key != null &&
    previousS3.state &&
    previousS3.row.length > 0 &&
    previousS3.row[0].bucket != null
  ) {
    RecordPrviousS3Object(previousS3.row[0]);
  }
};

// 프로젝트 사운드 리소스 삭제
export const postDeleteProjectSoundResource = async (req, res) => {
  const {
    body: { sound_id },
  } = req;

  logger.info(`postDeleteProjectSoundResource with soundID ${sound_id}`);
  const result = await DB(Q_DELETE_PROJECT_SOUND, [sound_id]);

  adminLogInsert(req, "sound_delete");

  respondRedirect(
    req,
    res,
    getProjectSoundResource,
    result,
    "postDeleteProjectSoundResource"
  );
};

// * sound zip 에서 사용되는 create, replace 프로시저
const CreateOrReplaceSound = async (req, res, query) => {
  const result = await DB(query);
  if (!result.state) {
    logger.error(`CreateOrReplaceSound Error ${result.error}`);
    respondDB(res, 80038, result.error);
  } else {
    // 잘 넣었으면 재조회 해줘야한다.
    getProjectSoundResource(req, res);
  }
};

// * 사운드 zip 쿼리 생성기
const createOrReplaceSoundQuery = (id, title, location, key, bucket, body) => {
  return mysql.format(
    `CALL sp_update_sound_zip('${id}', ?, '${title}', '${location}','${key}','${bucket}', ?);`,
    [body.sound_type, body.speaker]
  );
};

// * 사운드 zip 파일 업로드
export const uploadSoundZip = async (req, res) => {
  if (req.body.sound_type !== "voice") req.body.speaker = null;

  req.body.folder = `sounds`; // 폴더 지정

  logger.info(`uploadSoundZip [${JSON.stringify(req.body)}]`);

  adminLogInsert(req, "sound_zip");

  // 공통 메소드 호출
  await uploadZipResources(
    req,
    res,
    "sound",
    createOrReplaceSoundQuery,
    CreateOrReplaceSound
  );
};
