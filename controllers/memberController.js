import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB, adminLogInsert, respondAdminSuccess } from "../respondent";
import { gamebaseAPI } from "../com/gamebaseAPI";
import {
  getLikeConditionQuery,
  getPagenationQuery,
  getEqualConditionQuery,
  getDateConditionQuery,
  getCompareConditionQuery,
  getInConditionQuery,
} from "../com/com";
import { getCurrencyQuantity } from "./accountController";

//* 유저 관리 시작

//! 유저 리스트
export const userList = async (req, res) => {
  logger.info(`userList`);

  const result = await DB(
    `SELECT userkey
    , country 
    , fn_get_userkey_info(userkey) uid
    , gamebaseid 
    , DATE_FORMAT(createtime, '%Y-%m-%d %T') createtime
    , DATE_FORMAT(lastlogintime, '%Y-%m-%d %T') lastlogintime
    , fn_get_user_property(userkey, 'gem') gem_count
    , fn_get_user_property(userkey, 'coin') coin_count
    , fn_get_user_property(userkey, 'countessOneTime') countessOneTime_count
    , fn_get_user_property(userkey, 'honeybloodOneTime') honeybloodOneTime_count
    , valid
    FROM table_account
    ORDER BY userkey DESC;
    `,
    []
  );

  res.status(200).json(result.row);
};

//! 상세 정보
export const userDetail = async (req, res) => {
  logger.info(`userDetail`);

  console.log(req.body);

  const {
    body: { gamebaseid = "" },
  } = req;

  if (!gamebaseid) {
    logger.error("userDetail Error");
    respondDB(res, 80019);
    return;
  }

  //* 상태, 가입일, 마지막로그인, 탈퇴일 가져오기
  const result = await DB(
    `SELECT valid 
    , DATE_FORMAT(createtime, '%Y-%m-%d %T') createtime
    , DATE_FORMAT(lastlogintime, '%Y-%m-%d %T') lastlogintime
    , DATE_FORMAT(withdrawtime, '%Y-%m-%d %T') withdrawtime 
    FROM table_account
    WHERE userkey = ?;`,
    [req.params.id]
  );

  let setValid = result.row[0].valid;

  //* 게임베이스에서 유저 정보 가져오기 및 셋팅
  const gamebaseResult = await gamebaseAPI.member(gamebaseid);

  const { valid, authList } = gamebaseResult.data.member;

  const { storeCode, network, osCode, osVersion, clientVersion } =
    gamebaseResult.data.memberInfo;

  if (!setValid) {
    //* DB에 상태값이 없으면 게임베이스에 가져온 걸로 치환
    setValid = valid;
  }

  //* 탈퇴유예인 경우에는 탈퇴유예날짜 셋팅
  let gracePeriodDate = "";
  if (setValid === "T") {
    gracePeriodDate = gamebaseResult.data.temporaryWithdrawal.gracePeriodDate;
  }

  //* 토탈 유저 정보 정리
  const userInfo = {
    valid: setValid,
    gracePeriodDate,
    createtime: result.row[0].createtime,
    lastlogintime: result.row[0].lastlogintime,
    withdrawtime: result.row[0].withdrawtime,
    storeCode,
    idPCode: authList[0].idPCode,
    network,
    osCode,
    osVersion,
    clientVersion,
  };

  res.status(200).json(userInfo);
};

//! 재화 기록
export const userCurrencyList = async (req, res) => {
  logger.info(`userCurrencyList`);

  const responseData = {};

  //* 젬, 응모권 개수
  const cntResult = await DB(
    `SELECT fn_get_user_property(?, 'gem') gem_count
    , fn_get_user_property(?, 'coin') coin_count
    FROM DUAL;`,
    [req.params.id, req.params.id]
  );
  responseData.cnt = cntResult.row;

  //* 프리패스
  const oneTimeResult = await DB(
    `SELECT project_id 
    , fn_get_project_name(project_id) project_name
    , log_code 
    , fn_get_standard_name('property_path_code', log_code) log_code_name
    , DATE_FORMAT(action_date, '%Y-%m-%d %T') action_date
    FROM gamelog.log_property
    WHERE userkey = ?  
    AND log_type = 'get'
    AND currency LIKE '%OneTime'
    ORDER BY log_no DESC;
    ;`,
    [req.params.id]
  );
  responseData.Onetime = oneTimeResult.row;

  //* 나머지 화폐 내역
  const result = await DB(
    `SELECT log_no
    , currency 
    , DATE_FORMAT(action_date, '%Y-%m-%d %T') action_date
    , pier.fn_get_standard_comment('property_path_code', log_code, project_id) content
    , CASE WHEN log_type = 'get' 
    THEN 
        CONCAT('+', quantity)
    ELSE 
        CONCAT('-', quantity)
    END change_cnt
    , property_result
    FROM gamelog.log_property
    WHERE userkey = ? 
    AND currency in ('gem', 'coin')
    ORDER BY log_no DESC;
    `,
    [req.params.id]
  );
  responseData.currency = result.row;

  res.status(200).json(responseData);
};

//* 유저 관리 끝

// * 유저의 갤러리 오픈 현황
export const getAdminUserGalleryImageList = async (req, res) => {
  const {
    body: { project_id = "%" },
    params: { id }, // userkey
  } = req;

  const gallery = await DB(
    `
    SELECT z.project_id
    , fn_get_project_name(z.project_id) project_name
    ,CASE WHEN z.illust_type = 'live2d' AND z.is_minicut = 0 THEN '라이브 일러스트'
           WHEN z.illust_type = 'live2d' AND z.is_minicut = 1 THEN '라이브 오브제'
           WHEN z.illust_type = 'illust' THEN '일러스트'
           WHEN z.illust_type = 'minicut' THEN '미니컷'
           ELSE '알 수 없음' END illust_type_name
    , z.illust_type
    , z.illust_id
    , z.illust_name
    , ifnull(z.public_name, z.illust_name) public_name
    , CASE WHEN is_minicut = 0 THEN fn_check_user_illust_exists(${id}, z.illust_type, z.illust_id)
           ELSE fn_check_user_minicut_exists(${id}, z.illust_type, z.illust_id) END illust_open
    , z.is_minicut
    , z.is_public
    , z.appear_episode
    , fn_get_episode_title_lang(z.appear_episode, 'KO') appear_episode_title
    , fn_get_episode_type(z.appear_episode) appear_episode_type
 FROM (
        SELECT 'illust' illust_type
            , li.illust_id illust_id
            , li.image_name  illust_name
            , fn_get_design_info(li.thumbnail_id, 'url') thumbnail_url
            , fn_get_design_info(li.thumbnail_id, 'key') thumbnail_key
            , fn_get_illust_localized_text(li.illust_id, 'illust', 'KO', 'name') public_name
            , fn_get_illust_localized_text(li.illust_id, 'illust', 'KO', 'summary') summary
            , 0 is_minicut
            , li.is_public
            , li.image_url
            , li.image_key
            , li.appear_episode
            , li.project_id
        FROM list_illust li
        WHERE li.project_id LIKE ?
        AND li.is_public > 0
        AND li.appear_episode > 0
        UNION ALL
        SELECT 'live2d' illust_type
        , lli.live_illust_id  illust_id
        , lli.live_illust_name  illust_name
        , fn_get_design_info(lli.thumbnail_id, 'url') thumbnail_url
        , fn_get_design_info(lli.thumbnail_id, 'key') thumbnail_key
        , fn_get_illust_localized_text(lli.live_illust_id , 'live2d', 'KO', 'name') public_name
        , fn_get_illust_localized_text(lli.live_illust_id, 'live2d', 'KO', 'summary') summary    
        , 0 is_minicut
        , lli.is_public
        , '' image_url
        , '' image_key
        , lli.appear_episode
        , lli.project_id 
        FROM list_live_illust lli
        WHERE lli.project_id LIKE ?
        AND lli.is_public > 0
        AND lli.appear_episode > 0
        UNION ALL 
        SELECT 'live2d' illust_type
        , a.live_object_id  illust_id
        , a.live_object_name  illust_name
        , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
        , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
        , fn_get_minicut_localized_text(a.live_object_id, 'live2d', 'KO', 'name') public_name
        , fn_get_minicut_localized_text(a.live_object_id, 'live2d', 'KO', 'summary') summary
        , 1 is_minicut
        , a.is_public
        , '' image_url
        , '' image_key
        , a.appear_episode
        , a.project_id 
        FROM list_live_object a 
        WHERE a.project_id LIKE ?
        AND a.is_public > 0
        AND a.appear_episode > 0
        UNION ALL
        SELECT 'minicut' illust_type
        , a.minicut_id  illust_id
        , a.image_name  illust_name
        , fn_get_design_info(a.thumbnail_id, 'url') thumbnail_url
        , fn_get_design_info(a.thumbnail_id, 'key') thumbnail_key
        , fn_get_minicut_localized_text(a.minicut_id, 'minicut', 'KO', 'name') public_name
        , fn_get_minicut_localized_text(a.minicut_id, 'minicut', 'KO', 'summary') summary
        , 1 is_minicut
        , a.is_public
        , a.image_url
        , a.image_key
        , a.appear_episode
        , a.project_id 
        FROM list_minicut a 
        WHERE a.project_id LIKE ?
        AND a.appear_episode > 0
        AND a.is_public > 0
        ) z
        ORDER BY z.project_id, z.illust_name;    
    `,
    [project_id, project_id, project_id, project_id]
  );

  res.status(200).json(gallery.row);
};

// * 유저의 모든 해금 미션 리스트
export const getAdminUserMissionList = async (req, res) => {
  const {
    params: { id },
  } = req;

  const allMission = await DB(`
    SELECT fn_get_project_name(lm.project_id) project_name
     , lm.mission_id 
     , lm.mission_name 
     , lm.mission_hint 
     , um.unlock_state 
     , CASE WHEN um.unlock_state = 0 THEN '달성' ELSE '보상수령' END unlock_state_name
     , um.open_date 
     , um.receive_date 
     , um.userkey 
  FROM user_mission um
     , list_mission lm 
 WHERE um.userkey = ${id}
   AND lm.mission_id= um.mission_id
  ORDER BY lm.project_id, um.unlock_state DESC, lm.mission_name;
    `);

  // * 필터링용 드롭다운
  const projectDropDown = await DB(`
 SELECT DISTINCT lm.project_id, fn_get_project_name(lm.project_id) project_name
  FROM user_mission um
     , list_mission lm 
 WHERE um.userkey = ${id}
   AND lm.mission_id= um.mission_id;
   `);

  const responseData = {};
  responseData.missions = allMission.row;
  responseData.projectFilter = projectDropDown.row;

  res.status(200).json(responseData);
};

//* 재화 회수 기능
export const userCurrencyControl = async (req, res) => {
  console.log(req.body);

  logger.info(`userCurrencyControl`);

  const {
    params: { id },
    body: { currencyList = "" },
  } = req;

  let currentQuery = ``;
  let updateQuery = ``;
  let selectQuery = ``;
  let failQuery = ``;

  const responseData = {};
  responseData.currencyList = {};
  responseData.failList = {};

  if (currencyList.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for await (const item of currencyList) {
      let queryParams = [];
      let currencyCheck = true;
      let { quantity } = item;
      const { currency } = item;

      if (!currency || !quantity) {
        currencyCheck = false;
      }

      if (currencyCheck && parseInt(quantity, 10) < 0) {
        const totalResult = await DB(
          `SELECT fn_get_user_property(?, ?) total FROM DUAL;`,
          [id, currency]
        );
        const minusCheck =
          parseInt(totalResult.row[0].total, 10) + parseInt(quantity, 10);
        if (minusCheck < 0) currencyCheck = false;
      }

      if (currencyCheck) {
        //* 재화 처리
        if (parseInt(quantity, 10) < 0) {
          //음수인경우
          quantity *= -1;
          currentQuery = `CALL sp_use_user_property(?, ?, ?, 'admin', -1);`;
        } else {
          //양수인경우
          currentQuery = `CALL sp_insert_user_property(?, ?, ?, 'admin');`;
        }

        queryParams.push(id);
        queryParams.push(currency);
        queryParams.push(quantity);
        updateQuery += mysql.format(currentQuery, queryParams);

        //* 재화별 total
        queryParams = [];
        currentQuery = `SELECT ? currency, fn_get_user_property(?, ?) total FROM DUAL;`;

        queryParams.push(currency);
        queryParams.push(id);
        queryParams.push(currency);
        selectQuery += mysql.format(currentQuery, queryParams);

        console.log(selectQuery);
      } else {
        //* 회수 실패
        currentQuery = `SELECT ? currency, ? quantity FROM DUAL;`;
        queryParams.push(currency);
        queryParams.push(quantity);
        failQuery += mysql.format(currentQuery, queryParams);

        console.log(failQuery);
      }
    }

    if (updateQuery !== ``) {
      const result = await transactionDB(`${updateQuery}`, []);
      if (!result.state) {
        logger.error(`userMailDelete Error ${result.error}`);
        respondDB(res, 80026, result.error);
        return;
      }

      const selectResult = await DB(`${selectQuery}`, []);
      responseData.currencyList = selectResult.row;
    }

    if (failQuery !== ``) {
      const failResult = await DB(`${failQuery}`, []);
      responseData.failList = failResult.row;
    }
  }

  adminLogInsert(req, "user_currency_control");

  res.status(200).json(responseData);
};

/////////////////////////////////////////////////
// ? 여기서부터 버전 2 준비
/////////////////////////////////////////////////

// * 게임 유저 리스트
export const requestGameUserList = async (req, res) => {
  const {
    body: { search_type, search_word = null, page = -1, page_size = 20 },
  } = req;

  // * 검색 타입과 검색어 처리 추가됨.
  console.log(req.body);

  let query = `
  SELECT ta.userkey
      , country
      , concat('#', ta.pincode, '-', userkey) uid
      , ta.gamebaseid 
      , DATE_FORMAT(ta.createtime, '%Y-%m-%d %T') createtime 
      , DATE_FORMAT(ta.lastlogintime, '%Y-%m-%d %T') lastlogintime 
      , fn_get_user_property(ta.userkey, 'gem') gem
      , fn_get_user_property(ta.userkey, 'coin') coin
      , ta.valid 
    FROM table_account ta
    WHERE ta.country IS NOT null
  `;

  // 검색어 있는 경우에 대한 처리
  if (search_word != null) {
    if (search_type === "uid") {
      query += getLikeConditionQuery("uid", search_word, false, true);
    } else if (search_type === "gamebase") {
      query += getLikeConditionQuery("gamebaseid", search_word, false, true);
    }
  }

  // 페이징 처리
  query += getPagenationQuery(page, page_size);
  query += `;`;

  console.log(query);

  const result = await DB(query);

  res.status(200).json(result.row);
};

// * 게임 유저의 프로젝트 1회원 재화 리스트
export const requestGameUserTicketProperty = async (req, res) => {
  const {
    params: { id },
  } = req;

  const result = await DB(`
  SELECT z.currency_name
      , fn_get_user_property(${id}, z.currency) quantity
    FROM (
    SELECT DISTINCT up.currency
        , fn_get_localize_text(cc.local_code, 'KO') currency_name
    FROM user_property up 
    , com_currency cc 
    WHERE up.userkey = ${id}
    AND up.currency = cc.currency 
    AND cc.connected_project > 0 
    AND cc.consumable > 0
    AND cc.currency_type = 'consumable'
    ) z 
    ORDER BY z.currency_name;
  `);

  res.status(200).json(result.row);
};

// * 게임유저 상세정보
export const requestGameUserDetail = async (req, res) => {
  console.log(`requestGameUserDetail : `, req.params);

  const {
    params: { id },
  } = req;

  //* 상태, 가입일, 마지막로그인, 탈퇴일 가져오기
  const result = await DB(
    `SELECT gamebaseid
    FROM table_account
    WHERE userkey = ${id};`
  );

  if (!result.state || result.row.length === 0) {
    respondDB(res, 80019, "유저 정보가 존재하지 않습니다");
    return;
  }

  const { gamebaseid } = result.row[0];

  //* 게임베이스에서 유저 정보 가져오기 및 셋팅
  const gamebaseResult = await gamebaseAPI.member(gamebaseid);
  if (
    gamebaseResult === null ||
    !Object.prototype.hasOwnProperty.call(gamebaseResult, "data") ||
    !Object.prototype.hasOwnProperty.call(gamebaseResult.data, "member") ||
    !Object.prototype.hasOwnProperty.call(gamebaseResult.data, "memberInfo")
  ) {
    respondDB(res, 80019, "연동된 게임베이스 정보가 없습니다");
    return;
  }

  const { authList } = gamebaseResult.data.member;

  if (gamebaseResult.data.memberInfo === null) {
    respondDB(res, 80019, "연동된 게임베이스 정보가 없습니다");
    return;
  }

  const { storeCode, network, osCode, osVersion, clientVersion } =
    gamebaseResult.data.memberInfo;

  //* 토탈 유저 정보 정리
  const userInfo = {
    storeCode,
    idp: authList.length > 0 ? authList[0].idPCode : "guest",
    network,
    osCode,
    osVersion,
    clientVersion,
  };

  // TODO 유저의 작품 활동 내역 조회
  const actionHistory = await logDB(`
  SELECT pier.fn_get_project_name(JSON_EXTRACT(la.log_data, '$.project_id')) project_name
      , pier.fn_get_standard_name('log_action', la.action_type) action_name
      , pier.fn_get_episode_title_lang(JSON_EXTRACT(la.log_data, '$.episode_id'), 'KO') episode_title
      , DATE_FORMAT(la.action_date, '%Y-%m-%d %T') action_date
    FROM gamelog.log_action la
  WHERE la.userkey = ${id}
    AND action_type IN ('episode_start', 'episode_clear')
  ORDER BY la.log_no DESC;
  `);

  const responseData = {};
  responseData.userInfo = userInfo;
  responseData.userAction = actionHistory.row;

  res.status(200).json(responseData);
};

//* 쿠폰 기록
export const userCouponList = async (req, res) => {
  logger.info(`userCouponList`);

  console.log(req.body);

  const {
    params: { id },
    body: { search_start_date = "", search_end_date = "" },
  } = req;

  let whereQuery = ``;

  if (search_start_date && search_end_date) {
    whereQuery += getDateConditionQuery(
      "use_date",
      search_start_date,
      search_end_date,
      false
    );
  }

  //console.log(whereQuery);

  const result = await DB(
    `SELECT coupon_id 
    , DATE_FORMAT(use_date, '%Y-%m-%d %T') use_date
    , (SELECT coupon_name FROM com_coupon_master WHERE coupon_id = a.coupon_id) coupon_name 
    , coupon_code
    , fn_get_coupon_detail_info(coupon_id) coupon_detail_list
    FROM user_coupon a 
    WHERE userkey = ?
    ${whereQuery}
    ORDER by coupon_id DESC; 
    `,
    [id]
  );

  res.status(200).json(result.row);
};

//* 우편 기록
export const userMailList = async (req, res) => {
  logger.info(`userMailList`);

  console.log(req.body);

  const {
    params: { id },
    body: {
      search_date_type = "",
      search_start_date = "",
      search_end_date = "",
      search_state = "",
      search_currency = "",
      search_mail_type = "",
    },
  } = req;

  let whereQuery = ``;

  // 기간 검색
  if (search_date_type && search_start_date && search_end_date) {
    whereQuery += getDateConditionQuery(
      search_date_type,
      search_start_date,
      search_end_date,
      false
    );
  }

  // 발송 상태 검색
  if (search_state) {
    if (search_state === "expired")
      whereQuery += getCompareConditionQuery(
        "expire_date",
        "<",
        "NOW()",
        false
      );
    else
      whereQuery += getCompareConditionQuery(
        "expire_date",
        ">=",
        "NOW()",
        false
      );
  }

  // 재화 검색
  if (search_currency) {
    let OrQuery = ``;
    if (search_currency.includes("gem")) {
      OrQuery += getLikeConditionQuery(
        "currency",
        "gem",
        false,
        false,
        OrQuery.length > 0 ? "OR" : " AND ("
      );
    }

    if (search_currency.includes("coin")) {
      OrQuery += getLikeConditionQuery(
        "currency",
        "coin",
        false,
        false,
        OrQuery.length > 0 ? "OR" : " AND ("
      );
    }

    if (search_currency.includes("OneTime")) {
      OrQuery += getLikeConditionQuery(
        "currency",
        "OneTime",
        false,
        false,
        OrQuery.length > 0 ? "OR" : " AND ("
      );
    }
    OrQuery += `)`;

    whereQuery += OrQuery;
  }

  // 메일 타입 검색
  if (search_mail_type) {
    whereQuery += getEqualConditionQuery(
      "mail_type",
      search_mail_type,
      true,
      false
    );
  }

  //console.log(whereQuery);

  const result = await DB(
    `SELECT mail_no
    , DATE_FORMAT(send_date, '%Y-%m-%d %T') send_date
    , DATE_FORMAT(expire_date, '%Y-%m-%d %T') expire_date
    , mail_type
    , fn_get_standard_name('mail_type', mail_type) mail_name 
    , currency
    , fn_get_currency_info(currency, 'name') currency_name
    , quantity
    , reservation_no 
    FROM user_mail 
    WHERE userkey = ? 
    AND is_receive = 0 
    ${whereQuery}
    ORDER BY mail_no DESC;
    `,
    [id]
  );

  res.status(200).json(result.row);
};

//* 우편 취소
export const userMailCancel = async (req, res) => {
  logger.info(`userMailCancel`);

  const {
    body: { mail_no = 0, reservation_no = 0, admin_id = "" },
  } = req;

  console.log(req.body);

  if (mail_no === 0) {
    logger.error("userMailCancel Error");
    respondDB(res, 80019);
    return;
  }

  let currentQuery = ``;
  let updateQuery = ``;

  // 관리자가 보낸 예약메일인 경우, 메일 취소 처리
  if (reservation_no > 0) {
    const reservationCheck = await DB(
      `SELECT * FROM user_mail WHERE reservation_no = ?;`,
      [reservation_no]
    );
    const queryParams = [];
    if (reservationCheck.row.length === 1) {
      currentQuery = `UPDATE list_reservation SET is_complete = 3, admin_id = ? WHERE reservation_no = ?;`;
      queryParams.push(admin_id);
      queryParams.push(reservation_no);
      updateQuery += mysql.format(currentQuery, queryParams);
    }
  }

  const result = await DB(
    `
  DELETE FROM user_mail WHERE mail_no = ?;
  ${updateQuery}
  `,
    [mail_no]
  );

  if (!result.state) {
    logger.error(`userMailCancel Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "user_mail_cancel", userMailList);
};
// * 유저 프리패스 히스토리
const getGameUserFreepassHistory = async (userkey) => {
  const result = await DB(`
  SELECT pier.fn_get_project_name(lf.project_id) project_name
     , cf.freepass_name 
     , lf.price 
     , DATE_FORMAT(lf.purchase_date, '%Y-%m-%d %T') purchase_date 
  FROM gamelog.log_freepass lf 
     , com_freepass cf 
 WHERE userkey = ${userkey}
   AND cf.freepass_no = lf.freepass_no 
;
  `);

  return result.row;
};

// * 유저 재화 정보 조회
const getGameUserCurrency = async ({
  userkey,
  property,
  from_date,
  to_date,
}) => {
  let query = ``;

  // 1회권과 다름.
  if (property.includes(`OneTime`)) {
    query = `
    SELECT pier.fn_get_project_name(lp.project_id) project_name
        , CASE WHEN lp.log_type = 'get' THEN lp.quantity ELSE lp.quantity * -1 END quantity
        , CASE WHEN lp.log_type = 'get' THEN '획득' ELSE '사용' END log_type
        , pier.fn_get_standard_name('property_path_code', lp.log_code) log_code
        , DATE_FORMAT(lp.action_date, '%Y-%m-%d %T') action_date
      FROM gamelog.log_property lp 
    WHERE lp.userkey = ${userkey}`;
    query += getInConditionQuery(
      "currency",
      `SELECT cc.currency FROM com_currency cc  WHERE cc.currency LIKE '%OneTime%'`,
      false
    );
  } else {
    query = `
    SELECT CASE WHEN lp.log_type = 'get' THEN lp.quantity ELSE lp.quantity * -1 END quantity
         , CASE WHEN lp.log_type = 'get' THEN '획득' ELSE '사용' END log_type
         , pier.fn_get_standard_name('property_path_code', lp.log_code) log_code -- 사용 혹은 획득 사유 
         , lp.currency -- 화폐 코드
         , lp.property_result -- 처리 후 재화의 개수 
         , DATE_FORMAT(lp.action_date, '%Y-%m-%d %T') action_date
      FROM gamelog.log_property lp
    WHERE lp.userkey = ${userkey}`;
    query += getEqualConditionQuery("currency", property, true, false);
  }

  query += getDateConditionQuery("action_date", from_date, to_date, false);
  query += ` ORDER BY lp.log_no DESC;`;
  console.log(query);

  const result = await DB(query);
  return result.row;
};

// * 유저 재화 기록 종합
export const requestGameUserProperty = async (req, res) => {
  const {
    body: { property },
    params: { id },
  } = req;

  const userkey = id;
  req.body.userkey = userkey;

  const responseData = {};
  responseData.freepass = await getGameUserFreepassHistory(userkey); // 프리패스
  responseData.property = await getGameUserCurrency(req.body); // 재화 리스트

  // 1회권의 경우 작품마다 코드가 다 다르기 때문에 group으로 묶어서 계산하도록 처리
  if (property.includes("OneTime"))
    responseData.total = await getCurrencyQuantity(userkey, property, true);
  else responseData.total = await getCurrencyQuantity(userkey, property, false);

  res.status(200).json(responseData);
};

export const getUserMissionList = async (userkey) => {
  const result = await DB(
    `
  SELECT project_id 
  , fn_get_project_name(project_id) project_name 
  , count(*) mission_total
  , fn_get_mission_count(project_id, ?, 'N') user_total
  , fn_get_mission_count(project_id, ?, 'Y') user_reward
  , DATE_FORMAT(max(open_date), '%Y-%m-%d %T') last_mission_date 
  FROM list_mission a LEFT OUTER JOIN user_mission b
  ON a.mission_id = b.mission_id AND userkey = ? 
  GROUP BY project_id;`,
    [userkey, userkey, userkey]
  );

  return result.row;
};

export const getUserMissionDetail = async (userkey, project_id) => {
  const result = await DB(
    ` SELECT a.mission_id
  , mission_name
  , CASE WHEN a.mission_id = b.mission_id THEN 'O' ELSE 'X' END unlock_check
  , ifnull(DATE_FORMAT(open_date, '%Y-%m-%d %T'), '-') open_date
  , CASE WHEN unlock_state = 1 THEN DATE_FORMAT(receive_date, '%Y-%m-%d %T') ELSE '-' END reward_date
  FROM list_mission a LEFT OUTER JOIN user_mission b  
  ON a.mission_id = b.mission_id AND userkey = ?
  WHERE project_id = ?
  ORDER BY mission_id;`,
    [userkey, project_id]
  );

  return result.row;
};

//* 유저 미션 리스트
export const userMissionList = async (req, res) => {
  logger.info(`userMissionList`);

  const result = await getUserMissionList(req.params.id);

  res.status(200).json(result);
};

//* 유저 미션 상세
export const userMissionDetail = async (req, res) => {
  logger.info(`userMissionDetail`);

  console.log(req.body);

  const result = await getUserMissionDetail(req.params.id, req.body.project_id);

  res.status(200).json(result);
};

//* 유저 미션 초기화
export const userMissonClear = async (req, res) => {
  logger.info(`userMissonClear`);

  const {
    params: { id },
    body: { mission_type = "", project_id = "", mission_id = "" },
  } = req;

  console.log(req.body);

  // 필수값 체크
  if (
    !mission_type ||
    (mission_type === "all" && !project_id) ||
    (mission_type === "some" && !mission_id)
  ) {
    logger.error("userMissonClear Error");
    respondDB(res, 80019, req.body);
    return;
  }

  // 초기화 처리
  let result = ``;
  if (mission_type === "some") {
    //미션 한개 초기화
    result = await DB(
      `DELETE FROM user_mission WHERE userkey = ? AND mission_id = ?;`,
      [id, mission_id]
    );
  } else {
    // 전체 초기화
    result = await DB(
      `DELETE FROM user_mission WHERE userkey = ? AND mission_id IN (SELECT mission_id FROM list_mission WHERE project_id = ?);`,
      [id, project_id]
    );
  }

  if (!result.state) {
    logger.error(`userMailCancel Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  // 리스트와 상세 재조회
  const responseData = {};
  responseData.missionList = await getUserMissionList(id);
  responseData.missionDetail = await getUserMissionDetail(id, project_id);

  adminLogInsert(req, "user_mission_clear");

  res.status(200).json(responseData);
};

//* 유저 수집 리스트
export const userCollection = async (req, res) => {
  logger.info(`userCollection`);

  //공개 중인 프로젝트
  let projectId = ``;
  const projectResult = await DB(
    `SELECT project_id FROM list_project_master WHERE is_public > 0;`,
    []
  );
  projectResult.row.forEach((item) => {
    projectId += `${item.project_id},`;
  });
  projectId = projectId.slice(0, -1);

  const resultArray = [];
  const projectIdArray = [];

  //일러스트
  const illustResult = await DB(
    `
  SELECT 
  a.project_id
  , fn_get_project_name(a.project_id) project_name 
  , count(a.project_id) total 
  , count(b.project_id) user_total
  , ifnull(DATE_FORMAT(max(b.open_date), '%Y-%m-%d %T'), '-') open_date
  FROM list_illust a LEFT OUTER JOIN user_illust b 
  ON a.illust_id = b.illust_id AND illust_type = 'illust' AND userkey = ?
  WHERE a.illust_id > 0 
  AND is_public > 0 AND appear_episode > 0 
  AND a.project_id IN (${projectId})
  GROUP BY a.project_id;  
  `,
    [req.params.id]
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const item of illustResult.row) {
    if (!projectIdArray.includes(item.project_id)) {
      projectIdArray.push(item.project_id);
      resultArray.push(item);
    }
  }

  //라이브 일러스트
  const liveIllustResult = await DB(
    `
  SELECT 
  a.project_id
  , fn_get_project_name(a.project_id) project_name
  , count(a.project_id) total
  , count(b.project_id) user_total
  , ifnull(DATE_FORMAT(max(b.open_date), '%Y-%m-%d %T'), '-') open_date
  FROM list_live_illust a LEFT OUTER JOIN user_illust b 
  ON a.live_illust_id = b.illust_id AND illust_type='live2d' AND userkey = ? 
  WHERE live_illust_id > 0  AND is_public > 0 AND appear_episode > 0
  AND a.project_id IN (${projectId})
  GROUP BY a.project_id;
  `,
    [req.params.id]
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const item of liveIllustResult.row) {
    if (!projectIdArray.includes(item.project_id)) {
      projectIdArray.push(item.project_id);
      resultArray.push(item);
    } else {
      for (let i = 0; i < resultArray.length; ) {
        if (resultArray[i].project_id === item.project_id) {
          resultArray[i].total += item.total;
          resultArray[i].user_total += item.user_total;
          if (resultArray[i].open_date < item.open_date)
            resultArray[i].open_date = item.open_date;
        }
        i += 1;
      }
    }
  }

  //미니컷
  const minicutResult = await DB(
    `
  SELECT 
  a.project_id
  , fn_get_project_name(a.project_id) project_name 
  , count(a.project_id) total 
  , count(b.project_id) user_total 
  , ifnull(DATE_FORMAT(max(b.open_date), '%Y-%m-%d %T'), '-') open_date
  FROM list_minicut a LEFT OUTER JOIN user_minicut b 
  ON a.minicut_id = b.minicut_id AND minicut_type = 'image' AND userkey = ?
  WHERE a.minicut_id > 0 AND is_public > 0 AND appear_episode > 0 
  AND a.project_id IN (${projectId})
  GROUP BY a.project_id;
  `,
    [req.params.id]
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const item of minicutResult.row) {
    if (!projectIdArray.includes(item.project_id)) {
      projectIdArray.push(item.project_id);
      resultArray.push(item);
    } else {
      for (let i = 0; i < resultArray.length; ) {
        if (resultArray[i].project_id === item.project_id) {
          resultArray[i].total += item.total;
          resultArray[i].user_total += item.user_total;
          if (resultArray[i].open_date < item.open_date)
            resultArray[i].open_date = item.open_date;
        }
        i += 1;
      }
    }
  }

  //라이브 오브제
  const liveObjectReust = await DB(
    `
  SELECT 
  a.project_id 
  , fn_get_project_name(a.project_id) project_name 
  , count(a.project_id) total
  , count(b.project_id) user_total 
  , ifnull(DATE_FORMAT(max(b.open_date), '%Y-%m-%d %T'), '-') open_date
  FROM list_live_object a LEFT OUTER JOIN user_minicut b 
  ON a.live_object_id = b.minicut_id AND minicut_type = 'live2d' AND userkey = ? 
  WHERE a.live_object_id > 0 AND is_public > 0 AND appear_episode > 0 
  AND a.project_id IN (${projectId})
  GROUP BY a.project_id;
  `,
    [req.params.id]
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const item of liveObjectReust.row) {
    if (!projectIdArray.includes(item.project_id)) {
      projectIdArray.push(item.project_id);
      resultArray.push(item);
    } else {
      for (let i = 0; i < resultArray.length; ) {
        if (resultArray[i].project_id === item.project_id) {
          resultArray[i].total += item.total;
          resultArray[i].user_total += item.user_total;
          if (resultArray[i].open_date < item.open_date)
            resultArray[i].open_date = item.open_date;
        }
        i += 1;
      }
    }
  }

  res.status(200).json(resultArray);
};

//* 유저 수집 상세
export const userCollectoinDetail = async (req, res) => {
  logger.info(`userCollectoinDetail`);

  const {
    params: { id },
    body: { project_id = "" },
  } = req;

  console.log(req.body);

  if (!project_id) {
    logger.error("userCollectoinDetail Error");
    respondDB(res, 80019, req.body);
    return;
  }

  const result = await DB(
    `
  SELECT
  image_name collection_name
  , 'illust' collection_type
  , CASE WHEN a.illust_id = b.illust_id AND illust_type = 'illust' THEN 'O' ELSE 'X' END unlock_check
  , CASE WHEN a.illust_id = b.illust_id AND illust_type = 'illust' THEN DATE_FORMAT(open_date, '%Y-%m-%d %T') ELSE '-' END open_date
  FROM list_illust a LEFT OUTER JOIN user_illust b 
  ON a.illust_id = b.illust_id AND illust_type = 'illust' AND userkey = ?
  WHERE a.illust_id > 0 AND is_public > 0 AND appear_episode > 0 
  AND a.project_id = ?
  UNION ALL 
  SELECT
  live_illust_name collection_name
  , 'live_illust' collection_type
  , CASE WHEN a.live_illust_id = b.illust_id AND illust_type = 'live2d' THEN 'O' ELSE 'X' END unlock_check
  , CASE WHEN a.live_illust_id = b.illust_id AND illust_type = 'live2d' THEN DATE_FORMAT(open_date, '%Y-%m-%d %T') ELSE '-' END open_date
  FROM list_live_illust a LEFT OUTER JOIN user_illust b 
  ON a.live_illust_id = b.illust_id AND illust_type = 'live2d' AND userkey = ? 
  WHERE a.live_illust_id > 0 AND is_public > 0 AND appear_episode > 0 
  AND a.project_id = ?
  UNION ALL 
  SELECT
  image_name  collection_name
  , 'minicut' collection_type
  , CASE WHEN a.minicut_id = b.minicut_id AND minicut_type = 'image' THEN 'O' ELSE 'X' END unlock_check
  , CASE WHEN a.minicut_id = b.minicut_id AND minicut_type = 'image' THEN DATE_FORMAT(open_date, '%Y-%m-%d %T') ELSE '-' END open_date
  FROM list_minicut a LEFT OUTER JOIN user_minicut b 
  ON a.minicut_id = b.minicut_id AND minicut_type = 'image' AND userkey = ? 
  WHERE a.minicut_id > 0 AND is_public > 0 AND appear_episode > 0 
  AND a.project_id = ?
  UNION ALL 
  SELECT
  live_object_name collection_name
  , 'live_object' collection_type
  , CASE WHEN a.live_object_id = b.minicut_id AND minicut_type = 'live2d' THEN 'O' ELSE 'X' END unlock_check
  , CASE WHEN a.live_object_id = b.minicut_id AND minicut_type = 'live2d' THEN DATE_FORMAT(open_date, '%Y-%m-%d %T') ELSE '-' END open_date
  FROM list_live_object a LEFT OUTER JOIN user_minicut b 
  ON a.live_object_id = b.minicut_id AND minicut_type = 'live2d' AND userkey = ? 
  WHERE a.live_object_id > 0 AND is_public > 0 AND appear_episode > 0 
  AND a.project_id = ?
  ;`,
    [id, project_id, id, project_id, id, project_id, id, project_id]
  );

  //console.log(result.row.length);

  res.status(200).json(result.row);
};
