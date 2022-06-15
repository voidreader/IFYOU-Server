import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { getUserBankInfo } from "./bankController";

//! 좋아요 리스트
export const getUserProjectLikeList = async (userkey) => {
  const like = [];
  const result = await DB(
    `
    SELECT project_id 
    FROM user_project_like 
    WHERE userkey = ?
    ORDER BY project_id;
    `,
    [userkey]
  );

  // eslint-disable-next-line no-restricted-syntax
  result.row.forEach((item) => {
    like.push(item.project_id);
  });

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

  let isLike = 0;

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
    isLike = 1;
  } else {
    //있으면 delete
    result = await DB(
      `DELETE FROM user_project_like WHERE userkey = ? AND project_id = ?;`,
      [userkey, project_id]
    );

    // 선호작 해제한경우는 알림설정을 맘대로 건들지 않는다.
    const userNotify = await DB(
      `SELECT is_notify FROM user_project_notification upn WHERE userkey = ${userkey} AND project_id = ${project_id};`
    );
    isLike = userNotify.row[0].is_notify;
  }

  if (!result.state) {
    logger.error(`updateProjectLike error ${result.error}`);
    respondDB(res, 80026);
    return;
  }

  const likeProject = await getUserProjectLikeList(userkey);

  const responseData = {};
  responseData.like = likeProject;
  responseData.is_notify = isLike;

  // 선호작 등록/해제에 따라서 작품 알림설정 처리

  DB(`
    INSERT INTO user_project_notification (userkey, project_id, is_notify, last_modified)
    VALUES (${userkey}, ${project_id}, ${isLike}, now()) ON DUPLICATE KEY 
    UPDATE is_notify = ${isLike}, last_modified = now();
    `);

  res.status(200).json(responseData);
};
