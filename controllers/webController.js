import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";

// * 이프유 웹 메인페이지의 정보 요청
export const getIFyouWebMainPageInfo = async (req, res) => {
  const {
    body: { lang = "EN" },
  } = req;

  const responseData = {};

  // * 공개된 작품 목록 가져오기
  const projects = await DB(`
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

  responseData.project = projects.row; // 작품

  const noticeResult = await DB(`
  SELECT cnd.title 
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

  const text = await DB(`
  SELECT cl.id, cl.KO, cl.EN, cl.JA
 FROM com_localize cl 
WHERE cl.id BETWEEN 6400 AND 6414 
  OR cl.id IN (5051, 5001, 6179, 6181);
  `);

  responseData.notice = noticeResult.row;
  responseData.text = text.row;

  res.status(200).json(responseData);
};
