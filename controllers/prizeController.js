import mysql from "mysql2/promise";
import { DB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { 
  respondDB,
  respondAdminSuccess,
} from "../respondent";
import { getCurrencyQuantity } from "./accountController";

// * 응모권 시스템 관련
// 상품 기본정보
const queryBasePrizeInfo = `
SELECT prize_id
, prize_name
, quantity
, fn_get_win_prize_count(a.prize_id, a.start_date, a.end_date) win_quantity -- 당첨 수량
, project_id
, apply_condition
, condition_figure
, require_coin
, a.odds
FROM com_prize_ticket a 
WHERE a.prize_id = ?;
`;

// 상품 리스트
const queryPrizeList = `
SELECT z.*
     , CASE WHEN z.quantity - z.win_quantity >= 0 THEN z.quantity - z.win_quantity ELSE 0 END remain_quantity
  FROM (
SELECT prize_id
, prize_name
, quantity
, fn_get_win_prize_count(a.prize_id, a.start_date, a.end_date) win_quantity -- 당첨 수량
, project_id
, fn_get_project_name(a.project_id) project_name
, apply_condition
, fn_get_standard_name('prize_condition', a.apply_condition) apply_condition_name
, condition_figure
, require_coin
, a.image_id
, fn_get_design_info(a.image_id, 'url') image_url
, date_format(a.start_date, '%Y-%m-%d') start_date 
, date_format(a.end_date, '%Y-%m-%d') end_date
, a.sortkey
FROM com_prize_ticket a ) z
WHERE now() BETWEEN z.start_date AND z.end_date
ORDER BY z.sortkey;
`;

////////////////////////
////////////////////////

const getPrizeList = (rows) => {
  rows.forEach((element) => {
    element.apply_condition_name = element.apply_condition_name.replace(
      "N",
      element.condition_figure
    );
  });

  return rows;
};

// * CLINET
// * 현재 진행 중인 응모권 상품 리스트 조회
export const getClientPrizeTicketList = async (req, res) => {
  // 날짜 기준으로 유효한 상품 정보 가져온다.
  const result = await DB(queryPrizeList);
  const modifiedResult = getPrizeList(result.row);
  res.status(200).json(modifiedResult);
};

// 유저 UID 밸리데이션 체크
export const checkUserIdValidation = async (req, res) => {
  const {
    body: { uid },
  } = req;

  // 제대로된 형식이 아니면 error.
  if (!uid.includes("#") || !uid.includes("-")) {
    respondDB(res, 80056, `UID 정보가 일치하지 않습니다.`);
    return;
  }

  let pin = uid.split("-")[0];
  pin = pin.replace("#", "");
  const userkey = uid.split("-")[1];

  // pin과 userkey 같이 검색.
  const validationResult = await DB(
    `SELECT fn_get_userkey_info(${userkey}) uid
          , userkey 
       FROM table_account 
      WHERE userkey = ${userkey} AND pincode = ?;`,
    [pin]
  );
  if (!validationResult.state || validationResult.row.length === 0) {
    respondDB(res, 80056, `UID 정보가 일치하지 않습니다.`);
    return;
  }

  // uid, userkey를 전달.
  const responseData = {};
  responseData.userkey = validationResult.row[0].userkey;
  responseData.uid = validationResult.row[0].uid;
  responseData.coin = await getCurrencyQuantity(responseData.userkey, "coin");

  res.status(200).json(responseData);
};

// * 응모!
export const applyPrize = async (req, res) => {
  const {
    body: { uid, userkey, prize_id },
  } = req;

  // 1. 전달받은 prize_id 정보를 받아온다.
  const prizeResult = await DB(queryBasePrizeInfo, [prize_id]);

  if (!prizeResult.state || prizeResult.row.length === 0) {
    respondDB(res, 80068, "상품 정보가 존재하지 않습니다.");
    return;
  }

  // 상품정보 받아놓고, require_coin과 유저의 자산을 체크
  const prizeInfo = prizeResult.row[0];
  const requireCoin = prizeInfo.require_coin; // 필요 응모권
  const { odds, project_id, apply_condition, condition_figure } = prizeInfo; // 확률, 프로젝트 ID, 응모조건, 개수
  const userOdds = Math.floor(Math.random() * 1000000); // 백만분율, 유저의 랜덤 수 구하기.
  let isWin = false; // 당첨 여부

  // 유저 코인 개수 가져오기(accountController)
  const userCoin = await getCurrencyQuantity(userkey, "coin");

  if (requireCoin > userCoin) {
    respondDB(res, 80068, "응모권이 부족합니다.");
    return;
  }

  // 응모 조건
  if (apply_condition === "episode") {
    const episodeCount = await DB(
      `SELECT * FROM user_episode_hist WHERE userkey = ? AND project_id = ?;`,
      [userkey, project_id]
    );
    if (episodeCount.row.length < condition_figure) {
      respondDB(res, 80068, "응모 조건이 맞지 않습니다.(에피소드)");
      return;
    }
  } else if (apply_condition === "clear") {
    const endingCount = await DB(
      `SELECT * 
    FROM user_ending a 
    , list_episode le 
    WHERE userkey = ?
    AND le.project_id = ?
    AND le.episode_id = a.episode_id
    AND le.episode_type = 'ending'
    AND le.ending_type = 'final';`,
      [userkey, project_id]
    );

    if (endingCount.row.length <= 0) {
      respondDB(res, 80068, "응모 조건이 맞지 않습니다.(최종 엔딩 클리어)");
      return;
    }
  }

  console.log(`user Odds : [${userOdds}] / prize Odds : [${odds}]`);

  // 2. 확률체크해서 당첨, 미당첨 처리
  if (userOdds < odds) {
    console.log(`[${uid}] got prize!!!`);
    isWin = true;
  }

  // 재화 소모 쿼리
  // 내역 입력 쿼리
  const consumeQuery = mysql.format(
    `CALL sp_use_user_property(${userkey}, 'coin', ${requireCoin}, 'prize', ${project_id});`
  );

  const insertHistoryQuery = mysql.format(
    `INSERT INTO user_prize_history (userkey, prize_id, use_coin, is_win) VALUES(${userkey}, ${prize_id}, ${requireCoin}, ${
      isWin ? 1 : 0
    });`,
    []
  );

  // transaction으로 처리.
  const applyResult = await transactionDB(consumeQuery + insertHistoryQuery);

  if (!applyResult.state) {
    logger.error(applyResult.error);
    respondDB(res, 80068, applyResult.error);
    return;
  }

  const historyNo = await DB(
    `SELECT max(history_no) history_no FROM user_prize_history WHERE userkey = ?;`,
    [userkey]
  );

  // * 성공했으면 유저의 코인 개수, 응모권 리스트를 리프레시 해야한다.
  const responseData = {};
  responseData.isWin = isWin;
  responseData.coin = await getCurrencyQuantity(userkey, "coin");
  responseData.historyNo = historyNo.row[0].history_no;

  const prizeList = await DB(queryPrizeList);
  const modifiedList = getPrizeList(prizeList.row);
  responseData.prizeList = modifiedList;

  res.status(200).json(responseData);
}; // ? 응모 끝

// * 유저 응모권 사용 내역
export const getClientUserPrizeHistory = async (req, res) => {
  const {
    body: { userkey },
  } = req;

  // 히스토리
  const historyResult = await DB(`
  SELECT a.prize_id
      , date_format(a.action_date , '%Y-%m-%d %T') action_date
      , a.use_coin 
      , a.is_win 
      , b.prize_name 
      , b.image_id
      , fn_get_design_info(b.image_id, 'url') image_url
      , fn_get_project_name(b.project_id) project_name
      , a.address_no 
      , history_no
    FROM user_prize_history a
      , com_prize_ticket b
    WHERE a.userkey = ${userkey}
    AND b.prize_id = a.prize_id 
    ORDER BY a.history_no DESC;  
  `);

  res.status(200).json(historyResult.row);
};

export const addressList = async (userkey) => {
  const result = await DB(
    `SELECT address_name 
  , receiver 
  , phone1
  , phone2
  , phone3 
  , zipcode
  , address1 
  , address2 
  , email 
  FROM user_prize_address 
  WHERE userkey = ? 
  ORDER BY address_no DESC;`,
    [userkey]
  );

  return result.row;
};

//* 배송지 리스트
export const userAddressList = async (req, res) => {
  logger.info(`userAddressList`);

  const {
    body: { userkey = "" },
  } = req;

  //console.log(req.body);

  if (!userkey) {
    logger.error(`userAddressList Error`);
    respondDB(res, 80019);
    return;
  }

  const result = await addressList(userkey);

  res.status(200).json(result);
};

//* 배송지 삭제
export const deleteAddress = async (req, res) => {
  logger.info(`deleteAddress`);

  const {
    body: { userkey = "", address_no = "" },
  } = req;

  //console.log(req.body);

  if (!userkey || !address_no) {
    logger.error(`deleteAddress Error`);
    respondDB(res, 80019);
    return;
  }

  const result = await DB(
    `DELETE FROM user_prize_address WHERE address_no = ?;`,
    [address_no]
  );
  if (!result.state) {
    logger.error(`deleteAddress Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  const selectResult = await userAddressList(userkey);

  res.status(200).json(selectResult);
};

//* 배송지 추가 및 histrory 연결
export const insertOrUpdateAddress = async (req, res) => {
  logger.info(`insertOrUpdateAddress`);

  const {
    body: {
      userkey = "",
      address_name = "",
      receiver = "",
      phone1 = "",
      phone2 = "",
      phone3 = "",
      zipcode = "",
      address1 = "",
      address2 = "",
      email = "",
      history_no = "",
      address_no = "",
    },
  } = req;

  //console.log(req.body);

  if (
    !userkey ||
    !address_name ||
    !receiver ||
    !phone1 ||
    !phone2 ||
    !phone3 ||
    !zipcode ||
    !address1 ||
    !history_no ||
    !address_no
  ) {
    logger.error(`insertAddress Error 1`);
    respondDB(res, 80019);
    return;
  }

  let result = ``;
  let setAddressno = address_no;
  if (address_no === "-1") {
    // 신규
    result = await DB(
      `INSERT INTO user_prize_address(
      userkey
      , address_name
      , receiver
      , phone1
      , phone2
      , phone3
      , zipcode
      , address1
      , address2
      , email) 
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        userkey,
        address_name,
        receiver,
        phone1,
        phone2,
        phone3,
        zipcode,
        address1,
        address2,
        email,
      ]
    );

    if (!result.state) {
      logger.error(`insertAddress Error 2 ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }

    setAddressno = result.row.insertId;
  } else {
    // 기존

    result = await DB(
      `UPDATE user_prize_address
    SET address_name = ?
    , receiver = ?
    , phone1 = ?
    , phone2 = ?
    , phone3 = ?
    , zipcode = ?
    , address1 = ?
    , address2 = ?
    , email = ?
    WHERE address_no = ?;
    `,
      [
        address_name,
        receiver,
        phone1,
        phone2,
        phone3,
        zipcode,
        address1,
        address1,
        email,
        setAddressno,
      ]
    );

    if (!result.state) {
      logger.error(`insertAddress Error 3 ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  const updateResult = await DB(
    `UPDATE user_prize_history SET address_no = ? WHERE history_no = ?;`,
    [setAddressno, history_no]
  );
  if (!updateResult.state) {
    logger.error(`insertAddress Error 4 ${updateResult.error}`);
    respondDB(res, 80026, updateResult.error);
    return;
  }

  getClientUserPrizeHistory(req, res);
};

//* 배송지 상세
export const addressDetail = async (req, res) => {
  logger.info(`addressDetail`);

  const result = await DB(
    `SELECT
  address_name
  , receiver
  , phone1
  , phone2
  , phone3 
  , zipcode
  , address1
  , address2 
  , email
  FROM user_prize_address WHERE address_no = ?;`,
    [req.body.address_no]
  );

  res.status(200).json(result.row[0]);
};

//* 괸리자 시작 

//* 응모권 리스트 
export const prizeTicketList = async (req, res) =>{

  logger.info(`prizeTicketList`); 

  const result = await DB(`
  SELECT prize_id
  , prize_name
  , quantity
  , fn_get_win_prize_count(prize_id, start_date, end_date) win_quantity -- 당첨 수량
  , fn_get_fail_prize_count(prize_id, start_date, end_date) fail_quantity -- 실패 수량 
  , project_id
  , fn_get_project_name(project_id) project_name
  , apply_condition
  , fn_get_standard_name('prize_condition', apply_condition) apply_condition_name
  , condition_figure
  , require_coin
  , odds 
  , image_id
  , fn_get_design_info(image_id, 'url') image_url
  , date_format(start_date, '%Y-%m-%d') start_date 
  , date_format(end_date, '%Y-%m-%d') end_date
  , sortkey 
  FROM com_prize_ticket
  ORDER BY sortkey;
  `, []); 

  res.status(200).json(result.row); 

};

//* 응모내역
export const prizeTicketDetail = async (req, res) => {

  logger.info(`prizeTicketDetail`); 

  const result = await DB(`
  SELECT
  a.userkey 
  , fn_get_userkey_info(a.userkey) uid 
  , date_format(action_date, '%Y-%m-%d %T') action_date
  , use_coin 
  , is_win 
  , a.address_no 
  , address_name 
  , receiver 
  , phone1 
  , phone2
  , phone3 
  , zipcode 
  , address1 
  , address2 
  , email 
  FROM user_prize_history a LEFT OUTER JOIN user_prize_address b
  ON a.address_no = b.address_no 
  WHERE prize_id = ?
  ORDER BY action_date DESC;
  `, [req.params.id]);

  res.status(200).json(result.row); 

};

//* 응모권 등록/수정 
export const prizeTicketInsertOrUpdate = async (req, res) => {
  
  logger.info(`prizeTicketInsertOrUpdate`); 

  const {
    body:{
      prize_id = 0, 
      prize_name = "", 
      quantity = 0, 
      project_id = -1, 
      apply_condition = "", 
      condition_figure = 0, 
      require_coin = 0, 
      odds = "", 
      image_id = -1, 
      start_date = "", 
      end_date = "", 
    }
  } = req; 

  console.log(req.body); 

  if(!prize_name 
    || !apply_condition 
    || !odds 
    || !start_date 
    || !end_date 
    || quantity === 0 
    || project_id === -1 
    || require_coin === 0 
    || (apply_condition === "episode" && condition_figure === 0)){
    logger.error(`prizeTicketInsertOrUpdate Error`);
    respondDB(res, 80019, req.body);
    return;    
  }

  let result = ``;
  if(prize_id === 0){ //등록
    result = await DB(`
    INSERT INTO com_prize_ticket(prize_name
    , quantity
    , project_id
    , apply_condition 
    , condition_figure 
    , require_coin 
    , odds
    , image_id 
    , start_date
    , end_date) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, [prize_name
    , quantity
    , project_id
    , apply_condition
    , condition_figure
    , require_coin
    , odds
    , image_id
    , start_date
    , end_date]);
  }else{              //수정
    result = await DB(`UPDATE com_prize_ticket 
    SET prize_name = ?
    , quantity = ? 
    , project_id = ? 
    , apply_condition = ? 
    , condition_figure = ? 
    , require_coin = ? 
    , odds = ?
    , image_id = ?
    , start_date = ? 
    , end_date = ? 
    WHERE prize_id = ?;`, [
      prize_name
      , quantity
      , project_id
      , apply_condition
      , condition_figure
      , require_coin
      , odds
      , image_id
      , start_date
      , end_date
      , prize_id]); 
  }

  if(!result.state){
    logger.error(`prizeTicketInsertOrUpdate Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;    
  }

  respondAdminSuccess(req, res, null, "prize_ticket_update", prizeTicketList); 
};

//* 응모권 삭제 
export const prizeTicketDelete = async (req, res) =>{

  logger.info(`prizeTicketDelete`); 

  console.log(req.body); 

  const addressCheck = await DB(`SELECT * FROM user_prize_history WHERE prize_id = ? AND is_win = 1;`, [req.body.prize_id]);

  if(addressCheck.row.length > 0){
    logger.error(`prizeTicketDelete Error 2`);
    respondDB(res, 80081, "당첨 내역이 있습니다.");
    return;    
  }

  const result = await DB(`DELETE FROM com_prize_ticket WHERE prize_id = ?;`, [req.body.prize_id]);
  if(!result.state){
    logger.error(`prizeTicketDelete Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;     
  }

  respondAdminSuccess(req, res, null, "prize_ticket_delete", prizeTicketList); 
};

//* 배송지 변경 
export const addressUpdate = async(req, res) =>{

  logger.info(`addressUpdate`);
  
  const {
    body: {
      address_no = -1, 
      address_name = "", 
      receiver = "", 
      phone1 = "", 
      phone2 = "", 
      phone3 = "", 
      zipcode = "", 
      address1 = "", 
      address2 = "", 
      email = ""
    }
  } = req;

  console.log(req.body);

  if(address_no === -1 || !address_name || !receiver || !phone1 || !phone2 || !phone3 || !zipcode || !address1 || !email){
    logger.error(`addressUpdate Error`);
    respondDB(res, 80019, req.body);
    return;    
  }

  const result = await DB(`UPDATE user_prize_address 
  SET address_name = ? 
  , receiver = ? 
  , phone1 = ? 
  , phone2 = ? 
  , phone3 = ? 
  , zipcode = ? 
  , address1 = ? 
  , address2 = ? 
  , email = ? 
  WHERE address_no =?;`, [
    address_name
  , receiver 
  , phone1 
  , phone2 
  , phone3 
  , zipcode 
  , address1 
  , address2 
  , email 
  , address_no]); 

  if(!result.state){
    logger.error(`addressUpdate Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;       
  }

  respondAdminSuccess(req, res, null, "address_update", prizeTicketDetail); 
};

//* 정렬 업데이트 
export const prizeTicketSorting = async (req, res) => {

  logger.info(`prizeTicketSorting`);

  const {
    body: {rows = ""}, 
  } = req;

  console.log(req.body);

  let updateQuery = ``; 
  const prize = {};
  if(rows.length > 0){

    // 작품별로 배열 분류
    rows.forEach((item) => {
      // eslint-disable-next-line no-prototype-builtins
      if(!prize.hasOwnProperty(item.project_id)){
        prize[item.project_id] = [];
      }
      prize[item.project_id].push(item.prize_id); 
    });

    // 작품별 정렬 업데이트 
    // eslint-disable-next-line no-restricted-syntax
    for(const [key, value] of Object.entries(prize)){
      for(let i = 0 ; i < value.length;){
        const currentQuery = `UPDATE com_prize_ticket SET sortkey = ? WHERE prize_id = ?;`;
        updateQuery += mysql.format(currentQuery, [i, value[i]]);
        i += 1;
      }
    }

    const result = await transactionDB(updateQuery, []); 
    if(!result.state){
      logger.error(`prizeTicketSorting Error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;         
    }
  }

  respondAdminSuccess(req, res, null, "prize_ticket_sorting", prizeTicketList); 
};

//* 관리자 끝 