import { response } from "express";
import schedule from "node-schedule";
import { getProductDetailList } from "../controllers/shopController";
import { cache, loadingCacheData, loadingRegularCacheData } from "../init";
import { logger } from "../logger";
import { DB, slaveDB } from "../mysqldb";

// 캐싱 쿼리 모음
export const CACHE_BUBBLE_MASTER = `
SELECT 
DISTINCT lp.bubble_set_id AS bubbleID 
, cbm.*
FROM list_project_master lp, com_bubble_master cbm 
WHERE lp.project_id > 0
AND cbm.set_id = lp.bubble_set_id
AND lp.is_public > 0;
`;

export const CACHE_BUBBLE_SET = `
SELECT a.set_id 
, a.serial_no
, a.variation 
, a.template 
, a.SIZE size
, a.pos 
, a.bubble_sprite_id
, fn_get_bubble_sprite_info('url', a.bubble_sprite_id) bubble_sprite_url
, fn_get_bubble_sprite_info('key', a.bubble_sprite_id) bubble_sprite_key
, a.outline_sprite_id
, fn_get_bubble_sprite_info('url', a.outline_sprite_id) outline_sprite_url
, fn_get_bubble_sprite_info('key', a.outline_sprite_id) outline_sprite_key
, a.pos_x 
, a.pos_y 
, a.textarea_left 
, a.textarea_right 
, a.textarea_top 
, a.textarea_bottom 
, a.scale_x 
, a.scale_y 
, a.tail_sprite_id
, fn_get_bubble_sprite_info('url', a.tail_sprite_id) tail_sprite_url
, fn_get_bubble_sprite_info('key', a.tail_sprite_id) tail_sprite_key 
, a.tail_outline_sprite_id 
, fn_get_bubble_sprite_info('url', a.tail_outline_sprite_id) tail_outline_sprite_url
, fn_get_bubble_sprite_info('key', a.tail_outline_sprite_id) tail_outline_sprite_key
, a.tail_pos_x
, a.tail_pos_y 
, a.tail_scale_x 
, a.tail_scale_y 
, a.reverse_tail_sprite_id
, fn_get_bubble_sprite_info('url', a.reverse_tail_sprite_id) reversed_tail_sprite_url
, fn_get_bubble_sprite_info('key', a.reverse_tail_sprite_id) reversed_tail_sprite_key
, a.reverse_tail_outline_sprite_id 
, fn_get_bubble_sprite_info('url', a.reverse_tail_outline_sprite_id) reverse_tail_outline_sprite_url
, fn_get_bubble_sprite_info('key', a.reverse_tail_outline_sprite_id) reverse_tail_outline_sprite_key 
, a.reverse_tail_pos_x 
, a.reverse_tail_pos_y 
, a.reverse_tail_scale_x 
, a.reverse_tail_scale_y 
, a.emoticon_pos_x 
, a.emoticon_pos_y 
, a.emoticon_scale_x 
, a.emoticon_scale_y 
, a.font_color 
, a.fill_color 
, a.outline_color 
, a.custom_size_x 
, a.custom_size_y
, a.emoticon_width
, a.emoticon_height
, a.tag_sprite_id
, fn_get_bubble_sprite_info('url', a.tag_sprite_id) tag_sprite_url
, fn_get_bubble_sprite_info('key', a.tag_sprite_id) tag_sprite_key
, a.tag_pos_x
, a.tag_pos_y
FROM com_bubble_group a
WHERE a.set_id = ?
ORDER BY a.template, a.variation, a.SIZE, a.pos;
`;

export const CACHE_BUBBLE_SPRITE = `
SELECT DISTINCT cbg.set_id 
	 , cbs.bubble_sprite_id
     , cbs.image_name
     , cbs.is_slice 
     , cbs.border_left 
     , cbs.border_right 
     , cbs.border_top
     , cbs.border_bottom 
  FROM com_bubble_sprite cbs, com_bubble_group cbg 
  WHERE ( cbs.bubble_sprite_id = cbg.bubble_sprite_id OR cbs.bubble_sprite_id = cbg.outline_sprite_id )
 AND cbg.set_id = ?
 AND cbs.bubble_sprite_id > 0; 
`;

// * 인앱상품 캐시 데이터 조회(이프유)
export const getCacheProduct = async (lang) => {
  const result = await slaveDB(
    `    
    SELECT a.product_master_id 
    , a.product_id 
    , fn_get_design_info(lang.banner_id, 'url') product_url
    , fn_get_design_info(lang.banner_id, 'key') product_key
    , fn_get_design_info(lang.detail_image_id, 'url') product_detail_url
    , fn_get_design_info(lang.detail_image_id, 'key') product_detail_key
    , lang.title product_name
    , ifnull(a.bonus_name, '') bonus_name 
    , a.product_type 
    , fn_get_standard_name('product_type', a.product_type) product_type_name 
    , DATE_FORMAT(a.from_date, '%Y-%m-%d %T') from_date
    , DATE_FORMAT(a.to_date, '%Y-%m-%d %T') to_date
    , a.max_count
    , case when a.to_date = '9999-12-31' THEN 0 ELSE 1 END is_event
    , a.is_public
    , a.package
    FROM list_product_master a
        , list_product_lang lang
    WHERE a.is_public > 0
    AND lang.master_id = a.product_master_id 
    AND lang.lang  = '${lang}'
    AND now() BETWEEN a.from_date AND a.to_date
    AND a.package = 'ifyou'
    ORDER BY product_type, a.from_date DESC, a.product_id;
    `
  );

  //* 유효한 상품 리스트와 디테일 가져오기
  const responseData = {};
  responseData.productMaster = result.row;
  responseData.productDetail = {};

  const productInfo = {};
  const promise = [];

  responseData.productMaster.forEach(async (item) => {
    const key = item.product_master_id.toString();

    // * product_master_id로 키를 만들어주기
    if (!Object.hasOwnProperty.call(productInfo, key)) {
      productInfo[key] = [];
    }

    // * 상품의 product_type에 따른 디테일 정보를 배열에 푸시해주기(프리미엄 패스 제외)
    // * 프리미엄 패스는 getUserSelectedStory()에서 호출
    if (item.product_type !== "premium_pass") {
      promise.push(
        getProductDetailList(item.product_master_id, item.product_type)
      );
    }
  });

  await Promise.all(promise)
    .then((values) => {
      // * promise에 넣어둔 모든 getProductDetailList 실행이 종료되면, 결과가 한번에 들어온다.
      values.forEach((arr) => {
        //* productInfo의 key랑 arr[i].master_id 가 똑같으면,
        arr.forEach((item) => {
          productInfo[item.master_id.toString()].push(item);
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });

  responseData.productDetail = productInfo;
  return responseData;
};

// * 캐시용 서버 마스터 정보
export const getCacheServerMaster = async () => {
  let query = ``; // 쿼리용 스트링

  // 서버 마스터 정보
  // 광고, 타임딜, 기본 재화 정보까지.
  query += `SELECT cs.* FROM com_server cs WHERE server_no > 0 LIMIT 1;`;
  query += `SELECT a.* FROM com_ad a LIMIT 1;`;
  query += `
      SELECT cpt.timedeal_id 
        , cpt.conditions
        , cpt.discount 
        , cpt.deadline 
        , cpt.episode_progress 
      FROM com_premium_timedeal cpt 
    WHERE timedeal_id > 0 
    ORDER BY timedeal_id; 
    `;
  query += `
  SELECT DISTINCT a.currency 
    , fn_get_design_info(a.icon_image_id, 'url') icon_url
    , fn_get_design_info(a.icon_image_id, 'key') icon_key
  FROM com_currency a 
  WHERE a.is_use > 0
  AND a.local_code > -1
  AND a.icon_image_id > 0
  AND a.currency IN ('gem', 'coin');
  `;

  const serverInfo = await slaveDB(query);
  return serverInfo;
};

// * 캐시용 로컬라이즈 텍스트 정보
export const getCacheLocalizedText = async () => {
  // 로컬라이징 텍스트 정보
  const localInfo = await slaveDB(`
  SELECT cl.id
      , cl.KO
      , ifnull(cl.EN, 'NO TEXT') EN
      , ifnull(cl.JA, 'NO TEXT') JA
      , ifnull(cl.AR, 'NO TEXT') AR
      , ifnull(cl.MS, 'NO TEXT') MS
      , ifnull(cl.ES, 'NO TEXT') ES
      , ifnull(cl.RU, 'NO TEXT') RU
    FROM com_localize cl 
    WHERE id > 0;
  `);
  const localData = {}; // 데이터 포장하기
  localInfo.row.forEach((item) => {
    localData[item.id.toString()] = { ...item };
  });

  return localData;
};

// * 캐시용 플랫폼 이벤트 정보 받아오기
export const getCachePlatformEvent = async () => {
  const responseData = {};

  // * 프로모션 정보
  const promotionMaster = await slaveDB(`
  SELECT a.promotion_no
      , a.title
      , a.start_date
      , a.end_date
      , a.promotion_type
      , a.location
      , a.os
      , ifnull(a.exception_culture, '') exception_culture
  FROM com_promotion a
  WHERE is_public > 0 
  AND NOW() BETWEEN start_date AND end_date 
  ORDER BY sortkey; 
  `); // ? 프로모션 끝

  const promotionDetail = await slaveDB(
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
  const noticeMaster = await slaveDB(`
    SELECT cn.notice_no
         , cn.notice_type
         , cn.notice_name
         , cn.sortkey
         , cn.is_public
         , cn.start_date
         , cn.end_date
         , cn.os
         , ifnull(cn.exception_culture, '') exception_culture
    FROM com_notice cn  
  WHERE now() BETWEEN cn.start_date AND cn.end_date
    AND cn.is_public = 1
  ORDER BY cn.sortkey;
  `);

  const noticeDetail = await slaveDB(`
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

  // * 인트로 기준정보  2022.06.18
  const introList = await slaveDB(`
  SELECT ci.intro_no 
  , ci.color_rgb 
  , ci.connected_project_id 
  , ci.character_msg 
  , ci.public_msg 
  , fn_get_design_info(ci.image_id, 'key') image_key
  , fn_get_design_info(ci.image_id, 'url') image_url
  FROM com_intro ci
 WHERE ci.intro_no > 0
 ORDER BY intro_no;
  `);

  responseData.promotion = promotionMaster.row; // 프로모션 정보
  responseData.notice = noticeMaster.row; // 공지사항
  responseData.intro = introList.row; // 인트로 정보

  return responseData;
};

const getBubbleDetail = async (key, kind) => {
  let result;
  if (kind === "set") {
    result = await slaveDB(CACHE_BUBBLE_SET, [key]);
  } else {
    result = await slaveDB(CACHE_BUBBLE_SPRITE, [key]);
  }

  return result.row;
};

// * 말풍선 정보
const getCacheBubble = async () => {
  let result = "";
  let promise = [];
  const responseData = {};
  let bubbleObj = {};

  // 말풍선 버전
  result = await slaveDB(CACHE_BUBBLE_MASTER);
  responseData.bubbleMaster = result.row;

  result.row.forEach(async (item) => {
    const key = item.set_id.toString();
    if (!Object.hasOwnProperty.call(bubbleObj, key)) {
      bubbleObj[key] = [];
    }
    promise.push(getBubbleDetail(key, "set"));
  });

  // 말풍선 세트
  await Promise.all(promise)
    .then((values) => {
      values.forEach((arr) => {
        arr.forEach((item) => {
          bubbleObj[item.set_id.toString()].push(item);
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });
  responseData.bubbleSet = bubbleObj;

  // 말풍선 sprite
  promise = [];
  bubbleObj = {};
  result.row.forEach(async (item) => {
    const key = item.set_id.toString();
    if (!Object.hasOwnProperty.call(bubbleObj, key)) {
      bubbleObj[key] = [];
    }
    promise.push(getBubbleDetail(key, "sprite"));
  });
  await Promise.all(promise)
    .then((values) => {
      values.forEach((arr) => {
        arr.forEach((item) => {
          bubbleObj[item.set_id.toString()].push(item);
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });
  responseData.bubbleSprite = bubbleObj;
  return responseData;
};

// * 공지사항, 프로모션 캐시 리프레시
export const refreshCachePlatformEvent = async (req, res) => {
  const cacheEvent = await getCachePlatformEvent();
  cache.set("promotion", cacheEvent.promotion);
  cache.set("notice", cacheEvent.notice);
  cache.set("intro", cacheEvent.intro);

  if (res) res.status(200).send("Done");
};

// * 로컬라이즈 텍스트 캐시 리프레시
export const refreshCacheLocalizedText = async (req, res) => {
  const localData = await getCacheLocalizedText();
  cache.set("localize", localData); // 로컬라이징 텍스트 정보 세팅

  // com_server의 버전이 연계되어 있어서 같이 한다.
  const master = await slaveDB(
    `SELECT cs.* FROM com_server cs WHERE server_no > 0 LIMIT 1`
  );
  cache.set("serverMaster", master.row[0]);

  //   console.log(cache.get("serverMaster"));

  if (res) res.status(200).send("Done");
};

// * 서버 마스터 캐시 리프레시
export const refreshCacheServerMaster = async (req, res) => {
  const serverInfo = await getCacheServerMaster();
  if (serverInfo.length === 0) {
    logger.error(`error in getCacheServerMaster / loadingCacheData`);
  } else {
    // console.log(serverInfo.row);

    cache.set("serverMaster", serverInfo.row[0][0]); // 마스터 정보
    cache.set("ad", serverInfo.row[1][0]); // 광고 세팅 정보
    cache.set("timedeal", serverInfo.row[2]); // 타임딜 정보

    // 기본 재화 세팅
    const baseCurrency = {};
    const currencyIcons = serverInfo.row[3];

    currencyIcons.forEach((item) => {
      if (!Object.prototype.hasOwnProperty.call(baseCurrency, item.currency)) {
        baseCurrency[item.currency] = {
          image_url: item.icon_url,
          image_key: item.icon_key,
        };
      }
    });

    cache.set("baseCurrency", baseCurrency); // 기본 재화 정보
  }

  if (res) res.status(200).send("Done");
};

// * 인앱 상품 정보 캐시
export const refreshCacheProduct = async (req, res) => {
  const productKO = await getCacheProduct("KO");
  const productEN = await getCacheProduct("EN");
  const productJA = await getCacheProduct("JA");
  const productAR = await getCacheProduct("AR");

  const productMS = await getCacheProduct("MS");
  const productES = await getCacheProduct("ES");
  const productRU = await getCacheProduct("RU");

  const product = {
    KO: productKO,
    EN: productEN,
    JA: productJA,
    AR: productAR,
    MS: productMS,
    ES: productES,
    RU: productRU,
  };

  cache.set("product", product);

  if (res) res.status(200).send("Done");
};

// * 수정이 많지 않은 정보 캐시 리프레쉬
export const refreshCacheFixedData = async (req, res) => {
  let result = "";

  //말풍선
  const bubble = await getCacheBubble();
  if (!cache.has("bubble")) cache.set("bubble", bubble);
  else {
    // 배포 했다면, 다시 캐싱 정보 업데이트(더 좋은 방법이 있으면 그걸로 변경 예정)
    result = await slaveDB(`
    SELECT * 
    FROM admin_deploy_history 
    WHERE project_id = -1 
    AND server = 'ifyou' 
    AND kind = 'bubble' 
    AND deploy_date >= date_add(now(), INTERVAL -2 MINUTE);`);
    if (result.state && result.row.length > 0) cache.set("bubble", bubble);
  }

  if (res) res.status(200).send("Done");
};

// 캐시 리프레시
const schduleCacheRefresh = schedule.scheduleJob("*/20 * * * *", async () => {
  logger.info(">> schduleCacheRefresh START");
  // await loadingCacheData();
  await loadingRegularCacheData();
  logger.info(">> schduleCacheRefresh END");
});
