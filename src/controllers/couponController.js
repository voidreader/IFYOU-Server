/* eslint-disable no-restricted-syntax */
import mysql from "mysql2/promise";
import { DB, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB, respondFail, respondSuccess } from "../respondent";
import { getUserBankInfo } from "./bankController";
import { resetOtomeGameProgress } from "./packageController";
import { getUserUnreadMailCount } from "./clientController";

//* 쿠폰 관리 시작

///////////////////////////함수 처리 시작///////////////////////////////////////////

///////////////////////////함수 처리 끝///////////////////////////////////////////

//* 클라이언트 호출 시작

//! 이프유 쿠폰 사용
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
}; // ? 종료

// * 단일게임에서의 쿠폰 사용
export const requestSingleGameCoupon = async (req, res) => {
  const {
    body: { userkey, coupon_code, project_id = -1 },
  } = req;

  logger.info(`requestSingleGameCoupon : [${JSON.stringify(req.body)}] `);

  if (!userkey) {
    respondFail(res, {}, "유저 정보가 입력되지 않음", 80056);
    return;
  }

  if (!coupon_code) {
    respondFail(res, {}, "쿠폰코드가 입력되지 않음", 80053);
    return;
  }

  if (project_id < 0) {
    respondFail(res, {}, "프로젝트 정보가 입력되지 않음", 80039);
    return;
  }

  // 유저의 언어 정보 필요하다.
  const userLangResult = await slaveDB(
    `SELECT ifnull(a.current_lang, 'KO') lang FROM table_account a WHERE a.userkey = ${userkey};`
  );

  logger.info(`userLangResult count : ${userLangResult.row.length}`);

  const { lang } = userLangResult.row[0];

  //* 쿠폰 정보 가져오기
  const couponInfo = await slaveDB(
    `SELECT coupon_id
    , coupon_type
    , use_limit
    , remain_keyword_count
    , a.unlock_dlc_id
    FROM com_coupon_master a
    WHERE ( keyword = '${coupon_code}' OR ( SELECT EXISTS (SELECT * FROM com_coupon_serial WHERE coupon_id = a.coupon_id AND serial = '${coupon_code}') > 0 ) ) 
    AND now() BETWEEN start_date AND end_date
    AND a.project_id = ${project_id}
    ;
    `,
    [coupon_code, coupon_code]
  );

  if (couponInfo.row.length === 0) {
    respondFail(res, {}, "쿠폰 정보가 없습니다.", 80053);
    return;
  }

  const {
    coupon_id,
    coupon_type,
    use_limit,
    remain_keyword_count,
    unlock_dlc_id,
  } = couponInfo.row[0];

  // * 대상 유저의 사용건수, 쿠폰 사용여부 확인하기.
  const userLimit = await DB(
    `SELECT * FROM user_coupon WHERE userkey = ${userkey} AND coupon_id = ${coupon_id};`
  );

  // 사용횟수 체크
  if (userLimit.row.length >= parseInt(use_limit, 10)) {
    respondFail(res, {}, "쿠폰 사용 횟수 초과", 80054);
    return;
  }

  // 마감과 사용횟수 체크
  if (coupon_type === "keyword") {
    //* 쿠폰 초과 사용 확인
    if (parseInt(remain_keyword_count, 10) <= 0) {
      respondFail(res, {}, "마감된 쿠폰입니다", 80055);
      return;
    }
  } else {
    //* 쿠폰 사용 확인(동일 시리얼 번호)
    const usedCoupon = await slaveDB(
      `SELECT * FROM user_coupon WHERE coupon_id = ${coupon_id} AND coupon_code = '${coupon_code}';`
    );

    if (usedCoupon.row.length > 0) {
      respondFail(res, {}, "이미 사용된 쿠폰입니다", 80052);
      return;
    }
  }

  logger.info(
    `requestSingleGameCoupon ${project_id}/${userkey}/${lang}/${coupon_id}/${coupon_code}`
  );

  // * 재화 정보 및 해금 DLC 정보
  // 재화 정보
  const couponCurrency = await slaveDB(
    `SELECT a.currency, a.quantity 
          , cc.connected_project
      FROM com_coupon_reward a
          , com_currency cc
      WHERE coupon_id = ${coupon_id}
        AND cc.currency = a.currency;`
  );

  // DLC 정보
  const couponDLC = await slaveDB(`
  SELECT a.dlc_id 
     , fn_get_dlc_name(a.dlc_id, '${lang}') dlc_name
  FROM dlc_master a
 WHERE a.project_id = ${project_id}
   AND a.dlc_type = 'coupon'
   AND a.dlc_id = ${unlock_dlc_id};
  `);

  // * 결과 처리 시작
  // * 쿠폰 사용 내역 추가 및 메일 전송
  // 재화 먼저 메일 발송
  let insertQuery = ``;
  let unlockDlcName = "";
  let index = 0;

  couponCurrency.row.forEach((item) => {
    const queryParams = [];

    const currentQuery = `
        INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
        VALUES(?, 'coupon', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), ?);
        `;

    queryParams.push(userkey);
    queryParams.push(item.currency);
    queryParams.push(item.quantity);
    queryParams.push(item.connected_project); // 프리패스 때문에...

    insertQuery += mysql.format(currentQuery, queryParams);
    if (index === 0) console.log(insertQuery);

    index += 1;
  });

  // 연결된 DLC가 있으면 해금처리하기
  if (couponDLC.row.length > 0) {
    unlockDlcName = couponDLC.row[0].dlc_name;

    insertQuery += mysql.format(`CALL sp_init_user_dlc_current(?, ?, ?);`, [
      userkey,
      project_id,
      unlock_dlc_id,
    ]);
  }

  //* 키워드일 경우, remain_keyword_count 업데이트 추가
  let updateQuery = ``;
  if (coupon_type === "keyword") {
    const keywordQuery = `UPDATE com_coupon_master SET remain_keyword_count = remain_keyword_count-1 WHERE coupon_id = ?;`;
    updateQuery = mysql.format(keywordQuery, coupon_id);
  }

  const result = await transactionDB(
    `
  INSERT INTO user_coupon(userkey, coupon_id, coupon_code) VALUES(?, ?, ?);
  ${updateQuery}
  ${insertQuery}
  `,
    [userkey, coupon_id, coupon_code]
  );

  if (!result.state) {
    logger.error(`useCoupon Error 13 ${result.error}`);
    respondFail(res, {}, "처리 중 오류", 80026);
    return;
  }

  // * 안읽은 메일 건수 전달
  const unreadMailCount = await getUserUnreadMailCount(userkey);
  const responseData = { unreadMailCount };
  responseData.dlcName = unlockDlcName;

  respondSuccess(res, responseData);
}; // ? requestSingleGameCoupon
