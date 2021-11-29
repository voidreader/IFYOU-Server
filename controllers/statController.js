import mysql from "mysql2/promise";
import { response } from "express";
import { DB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

// * 통계 정보를 편하게 수집하기 위한 기능들을 모았습니다.
// * 모았다는건 사실 훼이크고 1개밖에 없음..

const episodeHistCountQuery = `
SELECT userkey, count(*) cnt
FROM user_episode_hist hist
WHERE hist.episode_id IN (SELECT z.episode_id FROM list_episode z WHERE z.project_id= ? AND z.episode_type ='chapter')
AND hist.first_play between ? and ?
GROUP BY userkey;
`;

// * 정규 에피소드 1화부터 끝까지 유저수 카운트
export const getProjectEpisodeProgressCount = async (req, res) => {
  const {
    body: { start_date, end_date, project_id },
  } = req;

  // 기간, 프로젝트 ID를 파라매터로 받는다.

  // 작품에 있는 정규 에피소드(엔딩제외) 가져오기
  const chapters = (
    await DB(`
    SELECT a.*
    FROM list_episode a
    WHERE a.project_id = ${project_id}
    AND a.episode_type ='chapter'
    ORDER BY a.sortkey ;
    `)
  ).row;

  console.log("chapters : ", chapters.length);

  // 에피소드 개수
  const maxCount = chapters.length;

  // 에피소드 화별로 키, 초기화
  const responseData = {};
  for (let i = 1; i <= maxCount; i++) {
    responseData[i.toString()] = 0;
  }

  const result = await DB(episodeHistCountQuery, [
    project_id,
    start_date,
    end_date,
  ]);

  console.log(`total user count : `, result.row.length);

  result.row.forEach((item) => {
    const current = item.cnt;

    // * ex: 5화까지 봤으면 1,2,3,4,5 다 더해준다. (5화를 클리어한 사람은 1,2,3,4,5 다 본사람이니까!)
    for (let i = 1; i <= current; i++) {
      responseData[i.toString()] = responseData[i.toString()] + 1;
    }
  });

  // 통계 테이블 삭제
  await DB(`DELETE FROM stat_episode_progress WHERE episode_no > 0`);

  let insertQuery = ``;
  for (let i = 1; i <= maxCount; i++) {
    insertQuery += mysql.format(
      `INSERT INTO stat_episode_progress(episode_no, cnt) values (?, ?);`,
      [i, responseData[i.toString()]]
    );
  }

  // 통계 테이블 입력stat_episode_progress. 편하게 복사하고싶다!
  await DB(insertQuery);

  // 예의상 response
  res.status(200).json(responseData);
};
