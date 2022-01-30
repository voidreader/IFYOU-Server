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
    return {};
  }

  // play_count 가 0인건 최우선순위다.

  const zeroPlayed = [];
  userSnippets.row.forEach((item) => {
    if (item.play_count === 0) {
      zeroPlayed.push(item);
    }
  });

  // play_count 0인 스니핏이 1개일때.
  if (zeroPlayed.length === 1) return zeroPlayed[0]; // 그냥 return.

  return {};
}; // ? getPlaySnippet END
