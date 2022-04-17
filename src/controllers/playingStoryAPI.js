import mysql from "mysql2/promise";
import { DB, logAction, logDB, transactionDB } from "../mysqldb";
import { respondDB, respondError } from "../respondent";
import { logger } from "../logger";

// * 인게임에서 호출되는 API

// * 에피소드 플레이 완료 처리
export const requestCompleteEpisode = async (req, res) => {
  const {
    body: {
      userkey,
      project_id,
      episodeID,
      nextEpisodeID = -1,
      useRecord = true,
      lang = "KO",
      ver = 0,
    },
  } = req;

  logger.info(`updateUserEpisodePlayRecord [${JSON.stringify(req.body)}]`);
  req.body.episode_id = episodeID; // 이름.. 실수..

  // 에피소드 플레이 기록 저장하기
  const updateEpisodeRecordResult = await DB(`
  call sp_update_user_episode_hist(${userkey}, ${project_id}, ${episodeID});
  `);
};
