import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { getUserBankInfo } from "./bankController";

//! 좋아요 리스트
export const getUserProjectLikeList = async (userkey) => {
  const like = [];
  const result = await slaveDB(
    `
    SELECT project_id 
    FROM user_project_like 
    WHERE userkey = ?
    ORDER BY project_id;
    `,
    [userkey]
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const item of result.row) {
    //배열 처리
    if (!like.includes(item.project_id)) {
      like.push(item.project_id);
    }
  }

  return like;
};

//! 좋아요 등록/해제
export const updateProjectLike = async (req, res) => {
  const {
    body: { userkey, project_id = -1 },
  } = req;

  if (project_id === -1) {
    logger.error(`updateProjectLike error`);
    respondDB(res, 80019);
    return;
  }

  let isLike = "0";

  //* 좋아요 등록/해제 처리
  let result = await DB(
    `SELECT * FROM user_project_like WHERE userkey = ? AND project_id = ?;`,
    [userkey, project_id]
  ); //조회
  if (result.row.length === 0) {
    //없으면 insert
    result = await DB(
      `INSERT INTO user_project_like(userkey, project_id) VALUES(?, ?);`,
      [userkey, project_id]
    );
    isLike = "1";
  } else {
    //있으면 delete
    result = await DB(
      `DELETE FROM user_project_like WHERE userkey = ? AND project_id = ?;`,
      [userkey, project_id]
    );
    isLike = "0";
  }

  if (!result.state) {
    logger.error(`updateProjectLike error ${result.error}`);
    respondDB(res, 80026);
    return;
  }

  const responseData = {};
  responseData.like = await getUserProjectLikeList(userkey);
  responseData.is_notify = "0";

  // 선호작 등록/해제에 따라서 작품 알림설정 처리
  /*
  DB(`
    INSERT INTO user_project_notification (userkey, project_id, is_notify, last_modified)
    VALUES (${userkey}, ${project_id}, ${isLike}, now()) ON DUPLICATE KEY 
    UPDATE is_notify = ${isLike}, last_modified = now();
    `);
  */

  res.status(200).json(responseData);
};
