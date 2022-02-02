import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

// * Snippet : 작품 진입시 등장하는 짧은 단편을 의미합니다.

// * 작품 default snippet 처리.
export const setDefaultProjectSnippet = async (userInfo) => {
  // * 유저에게 등록된 refer 개수
  const userSnippetCount = (
    await DB(`
   SELECT count(a.snippet_id) cnt
    FROM user_snippet a
    WHERE a.userkey = ${userInfo.userkey}
    AND a.project_id = ${userInfo.project_id}; 
   `)
  ).row[0].cnt;

  // * snippet 개수가 0개이면, 기본 snippet을 user_snippet으로 입력받는다.
  if (userSnippetCount === 0) {
    // 기본 snippet 있는지 체크
    const defaultSnippet = await DB(`
    SELECT a.*
      FROM list_snippet a
     WHERE a.project_id = ${userInfo.project_id}
       AND a.target_episode_id = -1;
    `);

    if (defaultSnippet.state && defaultSnippet.row.length > 0) {
      // * user_snippet에 insert 처리
      let insertQuery = ``;

      defaultSnippet.row.forEach((item) => {
        // * insert Query 만든다.
        insertQuery += mysql.format(
          `INSERT INTO user_snippet(userkey, project_id, snippet_id) VALUES (?, ? , ?);`,
          [userInfo.userkey, item.project_id, item.snippet_id]
        );
      });

      await DB(`${insertQuery}`); // 입력 처리
    } else {
      console.log(`No default snippet in [{${userInfo.project_id}}] `); // 등록된 스니핏 없음
    }
  } else {
    // 입력된 user_snippet 있음.
  }
}; // ? setDefaultProjectSnippet END

// * 재생할 스니핏 조회
export const getPlaySnippet = async (userInfo) => {
  // * 유저의 작품 스니핏중 랜덤한 하나를 골라 준다.

  const returnData = {};
  returnData.playSnippet = {}; // 플레이 스니핏
  returnData.snippetScript = []; // 스니핏의 스크립트

  const userSnippets = await DB(`
  SELECT a.*
    FROM user_snippet a
  WHERE a.userkey = ${userInfo.userkey}
    AND a.project_id = ${userInfo.project_id}
  ORDER BY a.play_count
  ;
  `);

  // 없으면 빈 Row..?
  if (!userSnippets.state || userSnippets.row.length === 0) {
    return returnData;
  }

  // play_count 가 0인건 최우선순위다.

  const zeroPlayed = [];
  userSnippets.row.forEach((item) => {
    if (item.play_count === 0) {
      zeroPlayed.push(item);
    }
  });

  // play_count 0인 스니핏이 1개일때.
  if (zeroPlayed.length === 1) returnData.playSnippet = zeroPlayed[0];
  // 그냥 return.
  else if (zeroPlayed.length > 1) {
    // 한번도 재생되지 않은 스니핏이 2개 이상
    returnData.playSnippet =
      zeroPlayed[Math.floor(Math.random() * zeroPlayed.length)];
  } else {
    // 한번도 재생되지 않은 스니핏 없음
    returnData.playSnippet =
      userSnippets.row[Math.floor(Math.random() * userSnippets.row.length)];
  }

  // * 플레이 스니핏 데이터로 스크립트 불러오기
  const playScript = await DB(`
  SELECT ls.script_no   
      , ls.scene_id 
      , ls.template 
      , ls.speaker origin_speaker
      , substring_index(ls.speaker, ':', 1) speaker 
      , CASE WHEN ls.speaker IS NOT NULL AND instr(ls.speaker, ':') > 0 THEN substring_index(ls.speaker, ':', -1) 
              WHEN ls.speaker IS NULL OR ls.speaker = '' THEN ''
        ELSE 'C' END direction
      , ls.script_data 
      , ls.target_scene_id
      , ls.requisite 
      , ls.character_expression 
      , ls.emoticon_expression 
      , ls.in_effect 
      , ls.out_effect 
      , ls.bubble_size
      , ls.bubble_pos
      , ls.bubble_hold
      , ls.bubble_reverse
      , ls.emoticon_size 
      , ls.voice 
      , ls.sound_effect
      , ls.autoplay_row 
      , ifnull(ls.control, '') control
      , ls.project_id 
      , -1 episode_id -- 안쓰지만 클라이언트 때문에 집어넣었음
  FROM list_snippet_script ls
  WHERE ls.snippet_id = ${returnData.playSnippet.snippet_id}
    AND ls.lang = '${userInfo.lang}'
  ORDER BY script_no;
  `);

  // * 조회하고 리턴데이터에 할당
  returnData.snippetScript = playScript.row;

  return returnData;
}; // ? getPlaySnippet END

// * 스니핏 플레이 카운트 증가시키기
export const updateSnippetPlayCount = async (req, res) => {
  const {
    body: { userkey, snippet_id },
  } = req;

  await DB(`
  UPDATE user_snippet
  SET play_count = play_count + 1
 WHERE userkey = ${userkey}
   AND snippet_id = ${snippet_id};
   `);

  res.status(200).json(`{}`);
};
