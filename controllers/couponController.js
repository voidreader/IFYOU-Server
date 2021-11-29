/* eslint-disable no-restricted-syntax */
import mysql from "mysql2/promise";
import { DB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { 
  respondDB,
  adminLogInsert, 
  respondAdminSuccess, 
} from "../respondent";
import { getUserBankInfo } from "./bankController";

//* 쿠폰 관리 시작

///////////////////////////함수 처리 시작///////////////////////////////////////////

//! 쿠폰 정보 가져오기
export const getCouponMaster = async (couponId) => {
  const result = await DB(
    `SELECT coupon_id
    , coupon_type
    , fn_get_standard_name('coupon_type', coupon_type) coupon_type_name
    , keyword
    , use_limit
    , coupon_name
    , fn_get_coupon_detail_info(coupon_id) coupon_detail_list
    , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date 
    , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
    , CASE WHEN coupon_type = 'serial' THEN 
        (SELECT count(*) FROM user_coupon WHERE coupon_id = a.coupon_id)
      ELSE 
        remain_keyword_count 
    END use_count 
    , issue_count 
    , DATE_FORMAT(issue_date, '%Y-%m-%d %T') issue_date
    FROM com_coupon_master a 
    WHERE coupon_id = ?;`,
    [couponId]
  );

  return result.row;
};

//! 쿠폰 재화 가져오기
export const getCouponReward = async (couponId) => {
  const result = await DB(
    `SELECT currency
        , fn_get_currency_info(currency, 'name') as currency_name
        , quantity 
        FROM com_coupon_reward 
        WHERE coupon_id = ?;
    `,
    [couponId]
  );

  return result.row;
};

//! 쿠폰 시리얼 리스트
export const getCouponSerial = async (couponId) => {
  const result = await DB(
    `SELECT serial FROM com_coupon_serial WHERE coupon_id = ?;`,
    [couponId]
  );

  return result.row;
};

//! 쿠폰 에피소드 가져오기
export const getCouponEpisode = async (couponId) => {
  const result = await DB(
    `SELECT 
    a.episode_id
    , title 
    , project_id 
    , fn_get_project_name(project_id) project_name 
    FROM com_coupon_episode a, list_episode b 
    WHERE a.episode_id = b.episode_id  
    AND coupon_id = ?;
    `,
    [couponId]
  );

  return result.row;
};

//! 쿠폰 재화 처리
export const rewardInsertOrUpdate = async (couponId, rewardList) => {
  let currentQuery = ``;
  let singleQuery = ``;
  let index = 0;
  singleQuery = `CALL sp_update_coupon_reward(?, ?, ?);`;
  rewardList.forEach((item) => {
    currentQuery += mysql.format(singleQuery, [
      couponId,
      item.currency,
      item.quantity,
    ]);
    if (index === 0) console.log(currentQuery);
    index += 1;
  });

  //console.log(currentQuery);

  const result = await transactionDB(currentQuery, []);
  if (!result.state) {
    return result.error;
  }

  return "OK";
};

//! 쿠폰 에피소드 처리
export const episodeInsert = async (couponId, episodeList) => {
  let currentQuery = ``;
  const singleQuery = `CALL sp_insert_coupon_episode(?, ?);`;
  let index = 0;
  episodeList.forEach((item) => {
    currentQuery += mysql.format(singleQuery, [couponId, item.episode_id]);
    if (index === 0) console.log(currentQuery);
    index += 1;
  });

  const result = await transactionDB(currentQuery, []);
  if (!result.state) {
    return result.error;
  }

  return "OK";
};

//! 시리얼 코드 생성(랜덤)
export const randomSerialCode = async () => {
  let serialCode = ``;

  // * 코원 요청에 의해 난수에서 O, 0제거 2021.10.09
  const characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";

  for (let i = 0; i < 12; i++)
    serialCode += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );

  return serialCode;
};

//! 시리얼 체크
export const serialCheck = async (serialArray) => {
  const serialCode = randomSerialCode();
  let vaildCheck = true;

  //* 저장할 배열에 똑같은 시리얼이 있는지 확인
  if (!serialArray.includes(serialCode)) {
    serialArray.push(serialCode);
  } else {
    vaildCheck = false;
  }

  //* 기간 내 똑같은 시리얼 번호가 있는지 확인
  if (vaildCheck) {
    const serailList = await DB(
      `SELECT serial FROM com_coupon_serial 
        WHERE coupon_id IN (SELECT coupon_id FROM com_coupon_master WHERE coupon_type = 'serial' AND NOW() <= end_date);`,
      []
    );

    serailList.row.forEach((item) => {
      if (serialArray.includes(item.serial)) {
        vaildCheck = false;
      }
    });
  }

  if (!vaildCheck) serialArray.pop();

  return vaildCheck;
};

//! 시리얼 생성
export const serialInsert = async (couponId, serialArray) => {
  //console.log(serialArray);
  let currentQuery = ``;
  let index = 0;
  const singleQuery = `INSERT com_coupon_serial(coupon_id, serial) VALUES(?, ?);`;
  serialArray.forEach((item) => {
    currentQuery += mysql.format(singleQuery, [couponId, item]);
    if (index === 0) console.log(currentQuery);
    index += 1;
  });

  const result = await transactionDB(currentQuery, []);
  if (!result.state) {
    return result.error;
  }

  return "OK";
};

///////////////////////////함수 처리 끝///////////////////////////////////////////

//! 쿠폰 리스트
export const couponList = async (req, res) => {
  logger.info("couponList");

  const result = await DB(
    `SELECT coupon_id
    , coupon_type
    , fn_get_standard_name('coupon_type', coupon_type) coupon_type_name
    , coupon_name
    , fn_get_coupon_detail_info(coupon_id) coupon_detail_list
    , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date 
    , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
    , (SELECT count(*) FROM user_coupon WHERE coupon_id = a.coupon_id) use_count 
    , issue_count 
    , DATE_FORMAT(issue_date, '%Y-%m-%d %T') issue_date
    FROM com_coupon_master a 
    ORDER BY coupon_id DESC;`,
    []
  );

  res.status(200).json(result.row);
};

//! 쿠폰 상세
export const couponDetail = async (req, res) => {
  logger.info(`couponDetail`);

  const responseData = {};
  responseData.couponMaster = await getCouponMaster(req.params.id);
  responseData.couponReward = await getCouponReward(req.params.id);
  responseData.usedCoupon = (
    await DB(`SELECT count(*) cnt FROM user_coupon WHERE coupon_id = ?;`, [
      req.params.id,
    ])
  ).row[0].cnt; //* 사용 쿠폰 건수 전달
  responseData.couponEpisode = await getCouponEpisode(req.params.id);

  res.status(200).json(responseData);
};

//! 키워드 중복 체크
export const couponKeywordSearch = async (req, res) => {
  logger.info(`couponKeywordSearch`);

  const {
    body: { coupon_id = 0, keyword = "", start_date = "", end_date = "" },
  } = req;

  if (!keyword || !start_date || !end_date) {
    logger.error(`couponKeywordSearch Error 1`);
    respondDB(res, 80019);
    return;
  }

  const result = await DB(
    `SELECT keyword FROM com_coupon_master
    WHERE coupon_id <> ? 
    AND coupon_type = 'keyword' 
    AND keyword = ?
    AND ((? BETWEEN DATE_FORMAT(start_date, '%Y-%m-%d 00:00:00') AND DATE_FORMAT(end_date, '%Y-%m-%d 23:59:59') ) 
    OR (? BETWEEN DATE_FORMAT(start_date, '%Y-%m-%d 00:00:00') AND DATE_FORMAT(end_date, '%Y-%m-%d 23:59:59') )
    `,
    [coupon_id, keyword, start_date, end_date]
  );

  if (!result.state) {
    logger.error(`couponKeywordSearch Error 2`);
    respondDB(res, 80019);
    return;
  }

  res.status(200).json(result.row);
};

//! 쿠폰 사용 내역
export const usedCouponList = async (req, res) => {
  logger.info(`usedCouponList`);

  const {
    params: { id },
    body: { coupon_type = "" },
  } = req;

  console.log(req.body);

  if (!coupon_type) {
    logger.error(`usedCouponList Error`);
    respondDB(res, 80019);
    return;
  }

  const responseData = {};

  const couponNameResult = await DB(
    `SELECT coupon_name FROM com_coupon_master WHERE coupon_id = ?;`,
    [id]
  );
  responseData.couponName = couponNameResult.row;

  let result = ``;
  if (coupon_type === "keyword") {
    result = await DB(
      `SELECT coupon_code
        , fn_get_userkey_info(userkey) userkey 
        , DATE_FORMAT(use_date, '%Y-%m-%d %T') use_date
        FROM com_coupon_master a, user_coupon b 
        WHERE a.coupon_id = b.coupon_id AND a.coupon_id = ?;
        `,
      [id]
    );
  } else {
    result = await DB(
      `SELECT serial 
        , fn_get_userkey_info(userkey) userkey
        , DATE_FORMAT(use_date, '%Y-%m-%d %T') use_date
        FROM com_coupon_serial a LEFT OUTER JOIN user_coupon b 
        ON a.coupon_id = b.coupon_id AND serial = coupon_code
        WHERE a.coupon_id = ?;`,
      [id]
    );
  }

  responseData.usedCoupon = result.row;
  res.status(200).json(responseData);
};

//! 쿠폰 등록/수정
export const couponInsertOrUpdate = async (req, res) => {
  logger.info("couponInsertOrUpdate");

  console.log(req.body);

  const {
    body: {
      coupon_id = 0,
      coupon_name = "",
      coupon_type = "",
      keyword = "",
      start_date = "",
      end_date = "",
      use_limit = 0,
      issue_count = 0,
      rewardList = "",
      episodeList = "",
      user_id = "",
    },
  } = req;

  //* 유효성 체크
  if (
    !coupon_type ||
    !start_date ||
    !end_date ||
    issue_count === 0 ||
    use_limit === 0 ||
    !user_id
  ) {
    logger.error(`couponInsertOrUpdate Error 1`);
    respondDB(res, 80019, req.body);
    return;
  }

  if (coupon_type === "keyword" && keyword === "") {
    logger.error(`couponInsertOrUpdate Error 2`);
    respondDB(res, 80019, req.body);
    return;
  }

  //* 판매 재화 중복 체크 >> 보낸 데이터에 중복이 있는지를 체크
  if (rewardList.length > 0) {
    let rewardCheck = true;
    const rewardArray = [];

    rewardList.forEach((item) => {
      if (!rewardArray.includes(item.currency)) {
        rewardArray.push(item.currency);
      } else {
        rewardCheck = false;
      }
    });

    if (!rewardCheck) {
      logger.error("couponInsertOrUpdate Error 3");
      respondDB(res, 80057);
      return;
    }
  }

  //* 에피소드 중복 체크 >> 보낸 데이터에 중복이 있는지를 체크
  if (episodeList.length > 0) {
    let episodeCheck = true;
    const episodeArray = [];

    episodeList.forEach((item) => {
      if (!episodeArray.includes(item.episode_id)) {
        episodeArray.push(item.episode_id);
      } else {
        episodeCheck = false;
      }
    });

    if (!episodeCheck) {
      logger.error("couponInsertOrUpdate Error 3");
      respondDB(res, 80021, "에피소드ID가 중복되었습니다.");
      return;
    }
  }

  //* 키워드 중복 확인
  if (coupon_type === "keyword") {
    const keywordCheck = await DB(
      `SELECT * FROM com_coupon_master 
        WHERE coupon_id <> ? 
        AND coupon_type = ? 
        AND keyword = ? 
        AND NOW() <= end_date;`,
      [coupon_id, coupon_type, keyword]
    );

    if (!keywordCheck.state) {
      logger.error(`couponInsertOrUpdate Error 4 ${keywordCheck.error}`);
      respondDB(res, 80026, keywordCheck.error);
      return;
    }

    if (keywordCheck.row.length > 0) {
      logger.error(`couponInsertOrUpdate Error 5`);
      respondDB(res, 80021, "현재 사용 중인 키워드입니다.");
      return;
    }
  }

  //* 등록/수정 처리
  const responseData = {};
  const result = await DB(
    `CALL sp_update_coupon_master(?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      coupon_id,
      coupon_name,
      coupon_type,
      keyword,
      start_date,
      end_date,
      use_limit,
      issue_count,
      user_id,
    ]
  );
  if (!result.state) {
    logger.error(`couponInsertOrUpdate Error 6 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  let couponId = coupon_id;
  if (coupon_id === 0) {
    const couponIdResult = await DB(
      `SELECT max(coupon_id) coupon_id FROM com_coupon_master;`,
      []
    );
    couponId = couponIdResult.row[0].coupon_id;
  }
  responseData.couponMaster = await getCouponMaster(couponId);

  //* 판매재화 처리 및 가져오기
  if (rewardList.length > 0) {
    const rewardResult = await rewardInsertOrUpdate(couponId, rewardList);
    if (rewardResult !== "OK") {
      logger.error(`couponInsertOrUpdate Error 7 ${rewardResult}`);
      responseData.rewardError = rewardResult;
    }
  }
  responseData.couponReward = await getCouponReward(couponId);

  //* 시리얼 번호 생성
  const serialCnt = await getCouponSerial(couponId);
  const promise = [];
  if (coupon_type === "serial" && serialCnt.length === 0) {
    //* 시리얼 번호 유효성 체크
    for (let i = 0; i < parseInt(issue_count, 10); ) {
      // eslint-disable-next-line no-await-in-loop
      const vaildCheck = await serialCheck(promise);
      if (!vaildCheck) {
        // eslint-disable-next-line no-continue
        continue;
      } else {
        i += 1;
      }
    }

    //* 시리얼 insert
    await Promise.all(promise)
      .then(async (values) => {
        const serialResult = await serialInsert(couponId, values);
        if (serialResult !== "OK") {
          logger.error(`couponInsertOrUpdate Error 8 ${serialResult}`);
          responseData.serialError = serialResult;
        }
      })
      .catch((err) => {
        logger.error(err);
      });
    responseData.couponSerial = await getCouponSerial(couponId);
  }

  //* 에피소드 처리
  if (episodeList.length > 0) {
    const episodeResult = await episodeInsert(couponId, episodeList);
    if (episodeResult !== "OK") {
      logger.error(`couponInsertOrUpdate Error 9 ${episodeResult}`);
      responseData.episodeError = episodeResult;
    }
  }
  responseData.couponEpisode = await getCouponEpisode(couponId);

  adminLogInsert(req, "coupon_update"); 
  res.status(200).json(responseData);
};

//! 쿠폰 전체 삭제
export const couponAllDelete = async (req, res) => {
  logger.info(`couponAllDelete`);

  console.log(req.body);

  const {
    params: { id },
    body: { coupon_type = "" },
  } = req;

  if (!coupon_type) {
    logger.error(`couponAllDelete Error 1`);
    respondDB(res, 80019, req.body);
    return;
  }

  //* 쿠폰 사용 확인
  const usedCouponCheck = await DB(
    `SELECT * FROM user_coupon WHERE coupon_id = ?;`,
    [id]
  );

  if (usedCouponCheck.row.length > 0) {
    logger.error(`couponAllDelete Error 2`);
    respondDB(res, 80062);
    return;
  }

  let deleteQuery = ``;
  let singleQuery = ``;
  if (coupon_type === "serial") {
    singleQuery = `DELETE FROM com_coupon_serial WHERE coupon_id = ?;`;
    deleteQuery += mysql.format(singleQuery, [id]);
  }

  //* 에피소드 확인
  const episodeCheck = await DB(
    `SELECT * FROM com_coupon_episode WHERE coupon_id = ?;`,
    [id]
  );
  if (episodeCheck.row.length > 0) {
    singleQuery = `DELETE FROM com_coupon_episode WHERE coupon_id = ?;`;
    deleteQuery += mysql.format(singleQuery, [id]);
  }

  const result = await transactionDB(
    `
    DELETE FROM com_coupon_reward WHERE coupon_id = ?; 
    ${deleteQuery}
    DELETE FROM com_coupon_master WHERE coupon_id = ?;
    `,
    [id, id]
  );

  if (!result.state) {
    logger.error(`couponAllDelete Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "coupon_delete", couponList);
};

//! 쿠폰 재화 삭제
export const couponRewardDelete = async (req, res) => {
  logger.info(`couponRewardDelete`);

  console.log(req.body);

  const {
    params: { id },
    body: { currency = "" },
  } = req;

  if (!currency) {
    logger.error(`couponRewardDelete Error 1`);
    respondDB(res, 80019, req.body);
    return;
  }

  const vaildCheck = await DB(
    `SELECT * FROM com_coupon_reward WHERE coupon_id = ? AND currency = ?;`,
    [id, currency]
  );
  if (!vaildCheck.state) {
    logger.error(`couponRewardDelete Error 2 ${vaildCheck.error}`);
    respondDB(res, 80026, vaildCheck.error);
    return;
  }

  if (vaildCheck.row.length === 0) {
    logger.error(`couponRewardDelete Error 3`);
    respondDB(res, 80019, "데이터가 없습니다.");
    return;
  }

  const result = await DB(
    `DELETE FROM com_coupon_reward WHERE coupon_id = ? AND currency = ?;`,
    [id, currency]
  );
  if (!result.state) {
    logger.error(`couponRewardDelete Error 4 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const detailList = await getCouponReward(id);

  respondAdminSuccess(req, res, detailList, "coupon_detail_delete");

};

//! 쿠폰 에피소드 삭제
export const couponEpisodeDelete = async (req, res) => {
  logger.info(`couponEpisodeDelete`);

  console.log(req.body);

  const {
    params: { id },
    body: { episode_id = "" },
  } = req;

  if (!episode_id) {
    logger.error(`couponEpisodeDelete Error 1`);
    respondDB(res, 80019, req.body);
    return;
  }

  const vaildCheck = await DB(
    `SELECT * FROM com_coupon_episode WHERE coupon_id = ? AND episode_id = ?;`,
    [id, episode_id]
  );
  if (!vaildCheck.state) {
    logger.error(`couponEpisodeDelete Error 2 ${vaildCheck.error}`);
    respondDB(res, 80026, vaildCheck.error);
    return;
  }

  if (vaildCheck.row.length === 0) {
    logger.error(`couponEpisodeDelete Error 3`);
    respondDB(res, 80019, "데이터가 없습니다.");
    return;
  }

  const result = await DB(
    `DELETE FROM com_coupon_episode WHERE coupon_id = ? AND episode_id = ?;`,
    [id, episode_id]
  );
  if (!result.state) {
    logger.error(`couponEpisodeDelete Error 4 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const episodeList = await getCouponEpisode(id);
  respondAdminSuccess(req, res, episodeList, "coupon_episode_delete");

};

//! 쿠폰 에피소드 확인
export const couponEpisodeCheck = async (req, res) => {
  logger.info(`couponEpisodeCheck`);

  const {
    body: { episode_id = "" },
  } = req;

  console.log(req.body);

  if (!episode_id) {
    logger.error(`couponEpisodeCheck Error`);
    respondDB(res, 80019, req.body);
    return;
  }

  const result = await DB(
    `
  SELECT title
  , project_id
  , fn_get_project_name(project_id) project_name 
  FROM list_episode 
  WHERE episode_id = ?;`,
    [episode_id]
  );

  res.status(200).json(result.row);
};

//* 쿠폰 관리 끝

//* 클라이언트 호출 시작

//! 쿠폰 사용
export const useCoupon = async (req, res) => {
  logger.info("useCoupon");

  const {
    body: { userkey = "", coupon_code = "" },
  } = req;

  console.log(req.body);

  //* 유효성 체크
  if (!userkey || !coupon_code) {
    logger.error(`useCoupon Error 1`);
    res.status(200).json({ code: 80019, koMessage: "잘못된 값입니다." });
    return;
  }

  //* userkey 확인
  let setUserKey = userkey;
  if (setUserKey.includes("#")) {
    //* IOS 전용

    setUserKey = userkey.replace("#", "");
    const setUserKeyArray = setUserKey.split("-");

    const validUserkey = await DB(
      `SELECT userkey FROM table_account WHERE userkey = ? AND pincode = ?;`,
      [setUserKeyArray[1], setUserKeyArray[0].toUpperCase()]
    );
    if (!validUserkey.state) {
      logger.error(`useCoupon Error 2 ${validUserkey.error}`);
      respondDB(res, 80026, validUserkey.error);
      return;
    }

    if (validUserkey.row.length === 0) {
      logger.error(`useCoupon Error 3`);
      res
        .status(200)
        .json({ code: 80056, koMessage: "UID 정보가 일치하지 않습니다." });
      return;
    }

    setUserKey = validUserkey.row[0].userkey;
  }

  //* 쿠폰 정보 가져오기
  const couponInfo = await DB(
    `SELECT coupon_id
    , coupon_type
    , use_limit
    , remain_keyword_count
    FROM com_coupon_master a
    WHERE ( keyword = ? OR ( SELECT EXISTS (SELECT * FROM com_coupon_serial WHERE coupon_id = a.coupon_id AND serial = ?) > 0 ) ) 
    AND sysdate() BETWEEN start_date AND end_date;
    `,
    [coupon_code, coupon_code]
  );

  if (!couponInfo.state) {
    logger.error(`useCoupon Error 4 ${couponInfo.error}`);
    respondDB(res, 80026, couponInfo.error);
    return;
  }

  if (couponInfo.row.length === 0) {
    logger.error(`useCoupon Error 5`);
    res
      .status(200)
      .json({ code: 80053, koMessage: "유효하지 않은 쿠폰입니다." });
    return;
  }

  const { coupon_id, coupon_type, use_limit, remain_keyword_count } =
    couponInfo.row[0];

  //* 유저 사용 건수 확인
  const userLimit = await DB(
    `SELECT * FROM user_coupon WHERE userkey = ? AND coupon_id = ?;`,
    [setUserKey, coupon_id]
  );
  if (!userLimit.state) {
    logger.error(`useCoupon Error 6 ${userLimit.error}`);
    respondDB(res, 80026, userLimit.error);
    return;
  }

  if (userLimit.row.length >= parseInt(use_limit, 10)) {
    logger.error(`useCoupon Error 7`);
    res
      .status(200)
      .json({ code: 80054, koMessage: "쿠폰 사용 횟수를 초과했습니다." });
    return;
  }

  if (coupon_type === "keyword") {
    //* 쿠폰 초과 사용 확인
    if (parseInt(remain_keyword_count, 10) <= 0) {
      logger.error(`useCoupon Error 8`);
      res.status(200).json({ code: 80055, koMessage: "마감된 쿠폰입니다." });
      return;
    }
  } else {
    //* 쿠폰 사용 확인(동일 시리얼 번호)
    const usedCoupon = await DB(
      `SELECT * FROM user_coupon WHERE coupon_id = ? AND coupon_code = ?;`,
      [coupon_id, coupon_code]
    );
    if (!usedCoupon.state) {
      logger.error(`useCoupon Error 9 ${usedCoupon.error}`);
      respondDB(res, 80026, usedCoupon.error);
      return;
    }

    if (usedCoupon.row.length > 0) {
      logger.error(`useCoupon Error 10`);
      res
        .status(200)
        .json({ code: 80052, koMessage: "이미 사용된 쿠폰입니다. " });
      return;
    }
  }

  //* 재화 정보 가져오기
  const couponCurrency = await DB(
    `SELECT a.currency, a.quantity 
          , cc.connected_project
      FROM com_coupon_reward a
          , com_currency cc
      WHERE coupon_id = ?
        AND cc.currency = a.currency;`,
    [coupon_id]
  );

  if (!couponCurrency.state) {
    logger.error(`useCoupon Error 11 ${couponCurrency.error}`);
    respondDB(res, 80026, couponCurrency.error);
    return;
  }

  if (couponCurrency.row.length === 0) {
    logger.error(`재화가 없는 쿠폰 사용`);
    // res.status(200).json({ code: 80049, koMessage: "재화가 없습니다." });
    // return;
  }

  //* 쿠폰 메일 전송
  let insertQuery = ``;
  let index = 0;

  couponCurrency.row.forEach((item) => {
    const queryParams = [];

    const currentQuery = `
        INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
        VALUES(?, 'coupon', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), ?);
        `;

    queryParams.push(setUserKey);
    queryParams.push(item.currency);
    queryParams.push(item.quantity);
    queryParams.push(item.connected_project); // 프리패스 때문에...

    insertQuery += mysql.format(currentQuery, queryParams);
    if (index === 0) console.log(insertQuery);

    index += 1;
  });

  // * 해금 에피소드 정보가 있는 경우, user_side 테이블에 추가 처리 2021.10.25
  let unlockEpisodeQuery = "";
  const checkUnlockEpisode = await DB(`
  SELECT a.episode_id
  FROM com_coupon_episode a
 WHERE a.coupon_id = ${coupon_id};
  `);

  if (checkUnlockEpisode.row.length > 0) {
    checkUnlockEpisode.row.forEach((item) => {
      unlockEpisodeQuery += mysql.format(
        `INSERT INTO user_side(userkey, episode_id) VALUES(?, ?);`,
        [setUserKey, item.episode_id]
      );
    });
  }
  // ? 해금 에피소드 처리 끝!

  //* 키워드일 경우, remain_keyword_count 업데이트 추가
  let updateQuery = ``;
  if (coupon_type === "keyword") {
    const keywordQuery = `UPDATE com_coupon_master SET remain_keyword_count = remain_keyword_count-1 WHERE coupon_id = ?;`;
    updateQuery = mysql.format(keywordQuery, coupon_id);
  }

  //* 쿠폰 사용 내역 추가 및 메일 전송
  const result = await transactionDB(
    `
    INSERT INTO user_coupon(userkey, coupon_id, coupon_code) VALUES(?, ?, ?);
    ${updateQuery}
    ${insertQuery}
    ${unlockEpisodeQuery}
    `,
    [setUserKey, coupon_id, coupon_code]
  );

  if (!result.state) {
    logger.error(`useCoupon Error 13 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  //* 안 읽은 메일 건수 전달
  const responseData = {};
  const unreadMailResult = await DB(
    `SELECT fn_get_user_unread_mail_count(?) cnt FROM DUAL;`,
    [setUserKey]
  );

  responseData.unreadMailCount = 0;
  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    responseData.unreadMailCount = unreadMailResult.row[0].cnt;

  const userInfo = { userkey: setUserKey }; // error fix
  responseData.bank = await getUserBankInfo(userInfo);

  const messageResult = await DB(
    `SELECT id, KO FROM com_localize WHERE id = 80058;`,
    []
  );
  responseData.code = messageResult.row[0].id;
  responseData.koMessage = messageResult.row[0].KO;

  // * 2021.10.25 쿠폰으로 인해 해금된 에피소드 리스트
  const unlockEpisodeResult = await DB(`
  SELECT fn_get_project_name(a.project_id) project_name
        , fn_get_episode_title_lang(a.episode_id, 'KO') episode_title
        , a.project_id
      FROM list_episode a
    WHERE a.episode_id IN (SELECT z.episode_id FROM com_coupon_episode z WHERE z.coupon_id = ${coupon_id});`);

  responseData.unlockEpisode = unlockEpisodeResult.row; // 결과 전달

  res.status(200).json(responseData);
};

//* 클라이언트 호출 끝
