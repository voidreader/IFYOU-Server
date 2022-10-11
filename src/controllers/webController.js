import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";

// * 프로젝트의 장르 조회하기
const getProjectGenre = async (project_id, lang) => {
  const result = await slaveDB(`
    SELECT lpg.genre_code
         , fn_get_localize_text(ls.text_id, '${lang}') genre_name
      FROM list_project_genre lpg
        , list_standard ls
      WHERE ls.standard_class = 'genre'
      AND ls.code  = lpg.genre_code
      AND lpg.project_id = ${project_id}
      ORDER BY lpg.sortkey;  
    `);

  const responseData = [];

  result.row.forEach((item) => {
    responseData.push(item.genre_name);
  });

  return responseData;
};

// * 이프유 웹 메인페이지의 정보 요청
export const getIFyouWebMainPageInfo = async (req, res) => {
  const {
    body: { lang = "EN" },
  } = req;

  const responseData = {};

  // * 공개된 작품 목록 가져오기
  const projects = await slaveDB(`
  SELECT a.project_id 
  , ifnull(b.title, a.title) title
  , ifnull(b.summary, a.summary) summary 
  , ifnull(b.writer , a.writer) writer 
  , fn_get_design_info(b.ifyou_banner_id, 'url') promotion_url
  , b.original -- 원작
  FROM list_project_master a
  LEFT OUTER JOIN list_project_detail b ON b.project_id = a.project_id AND b.lang = '${lang}'
  WHERE a.is_public > 0
  AND a.is_deploy > 0  
  `);

  for await (const item of projects.row) {
    item.genre = await getProjectGenre(item.project_id, lang);
  }

  responseData.project = projects.row; // 작품

  const noticeResult = await slaveDB(`
  SELECT cn.notice_no
    , cnd.title 
    , ifnull(cnd.contents, '') contents
    , fn_get_design_info(cnd.design_id, 'url') banner_url
    , fn_get_design_info(cnd.detail_design_id, 'url') detail_url
    FROM com_notice cn 
    , com_notice_detail cnd 
    WHERE cn.is_public > 0
    AND now() BETWEEN cn.start_date AND cn.end_date
    AND cn.notice_no = cnd.notice_no 
    AND cnd.lang  = '${lang}'
    ;
    `);

  const text = await slaveDB(`
  SELECT cl.id
       , CASE WHEN '${lang}' = 'KO' THEN cl.KO
              WHEN '${lang}' = 'EN' THEN cl.EN
              WHEN '${lang}' = 'JA' THEN cl.JA 
              WHEN '${lang}' = 'AR' THEN cl.AR
              WHEN '${lang}' = 'MS' THEN cl.MS
              WHEN '${lang}' = 'ES' THEN cl.ES
              WHEN '${lang}' = 'RU' THEN cl.RU
              ELSE cl.EN END value
 FROM com_localize cl 
WHERE cl.id BETWEEN 6400 AND 6425 
  OR cl.id IN (5051, 5001, 6179, 6181);
  `);

  responseData.notice = noticeResult.row;
  responseData.text = text.row;

  res.status(200).json(responseData);
};

export const receiveInquiry = async (req, res) => {
  const {
    body: { client, company, tel, email, contents, kind = "ifyou" },
  } = req;

  const result = await DB(
    `
  INSERT INTO user_inquiry (client, company, tel, email, contents, kind) 
  VALUES (?, ?, ?, ?, ?, ?);
  `,
    [client, company, tel, email, contents, kind]
  );

  if (!result.state) {
    res.status(400);
    return;
  }

  res.status(200).json(result.state);
};
