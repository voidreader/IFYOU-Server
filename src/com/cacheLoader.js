import { response } from "express";
import { DB } from "../mysqldb";

// * 캐시용 플랫폼 이벤트 정보 받아오기
export const getCachePlatformEvent = async () => {
  const responseData = {};

  // * 프로모션 정보
  const promotionMaster = await DB(`
  SELECT a.promotion_no
      , a.title
      , a.start_date
      , a.end_date
      , a.promotion_type
      , a.location
      , a.os
  FROM com_promotion a
  WHERE is_public > 0 
  AND NOW() BETWEEN start_date AND end_date 
  ORDER BY sortkey; 
  `); // ? 프로모션 끝

  const promotionDetail = await DB(
    `
  SELECT 
  b.promotion_no 
  , lang
  , design_id 
  , fn_get_design_info(design_id, 'url') promotion_banner_url
  , fn_get_design_info(design_id, 'key') promotion_banner_key
    FROM com_promotion a, com_promotion_detail b
  WHERE a.promotion_no = b.promotion_no 
  AND is_public > 0 
  AND NOW() BETWEEN start_date AND end_date
  ORDER BY sortkey;  
  `
  );

  promotionMaster.row.forEach((promotion) => {
    if (!Object.prototype.hasOwnProperty.call(promotion, "detail")) {
      promotion.detail = [];
    }

    promotionDetail.row.forEach((item) => {
      if (item.promotion_no === promotion.promotion_no) {
        promotion.detail.push(item);
      }
    });
  }); // ? 프로모션 끝

  // * 공지사항 정보
  const noticeMaster = await DB(`
    SELECT cn.*
    FROM com_notice cn  
  WHERE now() BETWEEN cn.start_date AND cn.end_date
    AND cn.is_public = 1
  ORDER BY cn.sortkey;
  `);

  const noticeDetail = await DB(`
    SELECT b.notice_no
    , b.lang 
    , b.title 
    , b.contents 
    , fn_get_design_info(b.design_id, 'url') banner_url
    , fn_get_design_info(b.design_id, 'key') banner_key
    , fn_get_design_info(b.detail_design_id, 'url') detail_banner_url
    , fn_get_design_info(b.detail_design_id, 'key') detail_banner_key
    , b.url_link 
  FROM com_notice cn
    , com_notice_detail b
  WHERE now() BETWEEN cn.start_date AND cn.end_date
  AND cn.is_public = 1
  AND b.notice_no = cn.notice_no 
  ORDER BY cn.sortkey
  ;  
  `);

  noticeMaster.row.forEach((notice) => {
    if (!Object.prototype.hasOwnProperty.call(notice, "detail")) {
      notice.detail = [];
    }

    noticeDetail.row.forEach((item) => {
      if (item.notice_no === notice.notice_no) {
        notice.detail.push(item);
      }
    });
  }); // ? 공지사항 끝

  responseData.promotion = promotionMaster.row; // 프로모션 정보
  responseData.notice = noticeMaster.row; // 공지사항

  return responseData;
};
