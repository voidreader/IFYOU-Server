import mysql from "mysql2/promise";
import { DB, slaveDB } from "../mysqldb";

import {
  respond,
  respondError,
  respondRedirect,
  respondDB,
  adminLogInsert,
} from "../respondent";
import { logger } from "../logger";

////////////////////////////////////////////////////////////////////////////////

// ! 유저 관련 처리 /////////////////////////////////////////////////////////////////

// * 유저 보이스 히스토리 조회
// * 2021.12.10 rawVoiceHistory, VoiceHistory를 둘다 주는 형태로 변경
export const getUserVoiceHistory = async (userInfo) => {
  const voiceData = {};

  const result = await slaveDB(
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
  const voiceNametagResult = await slaveDB(`
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
    const idSelect = await slaveDB(`
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

  const existsCheck = await slaveDB(
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
  FROM list_sound a, list_sound_lang b  
 WHERE a.project_id = ?
   AND a.sound_type  = 'bgm'
   AND a.is_public = 1
   AND a.sound_id = b.sound_id 
   AND b.lang = ? 
  ORDER BY sound_id;
  `,
    [userInfo.project_id]
  );

  return result.row;
};

// * 유저 오픈된 보이스의 확인 처리 (갤러리에서 호출)
export const updateUserVoiceCheck = async (req, res) => {
  const {
    body: { userkey, sound_id },
  } = req;

  const result = await DB(`
  UPDATE user_voice   
   SET is_replay = 1
 WHERE userkey = ${userkey}
   AND sound_id = ${sound_id};
  `);

  if (!result.state) {
    logger.error(`updateUserVoiceCheck Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(req.body);
};
