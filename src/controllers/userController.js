import mysql from "mysql2/promise";
import { DB, logAction, logDB, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB, respondFail, respondSuccess } from "../respondent";
import { getUserEnergy, updateUserEnergy } from "./packageController";

// * 2023.05.23
// 패키지 유저 계정 관련 로직을 여기에 작성합니다.

// * 유저 피드백 입력
export const addUserFeedback = async (req, res) => {
  const {
    body: { userkey, feedback, email },
  } = req;

  const insertResult = await DB(
    `
    INSERT INTO user_feedback(userkey, feedback, email) 
    VALUES (?, ?, ?);
    `,
    [userkey, feedback, email]
  );

  if (!insertResult.state) {
    logger.error(insertResult.error);
    respondFail(res, {}, "error in addUserFeedback", 80019);
    return;
  }

  respondSuccess(res, {});
};

// * 유저 패키지 미션 진행도 업데이트
export const updatePackageMission = async (req, res) => {
  const {
    body: { userkey, mission },
  } = req;

  logger.info(`updatePackageMission : ${JSON.stringify(req.body)}`);

  const currentMission = await DB(`
  SELECT a.twitter_mission, a.review_mission
    FROM user_package_mission a 
   WHERE a.userkey = ${userkey};
  `);

  console.log(currentMission.row);

  // 트위터 오픈 미션
  if (mission == "twitter") {
    if (
      currentMission.row.length > 0 &&
      currentMission.row[0].twitter_mission > 0
    ) {
      // 이미 받은 상태
      respondFail(res, {}, "Already completed twitter mission", 80019);
      return;
    }

    // insert
    const result = await DB(
      `
        INSERT INTO user_package_mission (userkey, twitter_mission) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE twitter_mission = ?, update_date = now();
    `,
      [userkey, 1, 1]
    );

    if (!result.state) {
      logger.error(result.error);
      respondFail(res, {}, "Error in updatePackageMission", 80019);
      return;
    }
  } else if (mission == "review") {
    // 게임 리뷰 미션

    if (
      currentMission.row.length > 0 &&
      currentMission.row[0].review_mission > 0
    ) {
      // 이미 받은 상태
      respondFail(res, {}, "Already completed review mission", 80019);
      return;
    }

    const result = await DB(
      `
          INSERT INTO user_package_mission (userkey, review_mission) VALUES (?, ?)
          ON DUPLICATE KEY UPDATE review_mission = ?, update_date = now();
      `,
      [userkey, 1, 1]
    );
    if (!result.state) {
      logger.error(result.error);
      respondFail(res, {}, "Error in updatePackageMission", 80019);
      return;
    }
  } else {
    respondFail(res, {}, "Wrong Mission", 80019);
    return;
  }

  // 정상적으로 수행되었으면 보상 지급
  const currentEnergy = await getUserEnergy(userkey);

  const responseData = {};
  responseData.energy = currentEnergy + 15; // 합산된 하트
  responseData.add_energy = 15;
  responseData.mission = mission;

  logger.info(`updatePackageMission response : ${responseData}`);
  respondSuccess(res, responseData);

  updateUserEnergy(userkey, responseData.energy);
  logAction(userkey, mission, "");
}; // ? updatePackageMission
