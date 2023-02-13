import mysql from "mysql2/promise";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";
import { getUserSelectionCurrent } from "../com/userProject";
import { getUserBankInfo, getCurrencyQuantity } from "./bankController";

//! 인게임 중 선택지 저장
export const updateUserSelectionCurrent = async (req, res) => {
  logger.info(`updateUserSelectionCurrent : ${JSON.stringify(req.body)}`);

  const {
    body: {
      userkey,
      project_id,
      episodeID,
      target_scene_id = -1,
      selection_group = 0,
      selection_no = 0,
    },
  } = req;

  const result = await DB(
    `CALL pier.sp_update_user_selection_current(?, ?, ?, ?, ?, ?);`,
    [
      userkey,
      project_id,
      episodeID,
      target_scene_id,
      selection_group,
      selection_no,
    ]
  );

  if (!result.state) {
    logger.error(`updateUserSelectionCurrent error`);
    logger.error(result.error);
  }

  const responseData = await getUserSelectionCurrent(userkey, project_id);

  res.status(200).json(responseData);
};

//! 선택지 구매 처리
export const purchaseSelection = async (req, res) => {
  logger.info(`purchaseSelection : ${JSON.stringify(req.body)}`);

  const {
    body: {
      userkey,
      project_id,
      episode_id,
      selection_group,
      selection_no,
      price = 0,
      lang = "KO",
    },
  } = req;

  let result;
  let currentQuery = ``;
  let purchaseQuery = ``;
  let purchaseCheck = 0;
  const responseData = {};

  //변조 apk 막기
  if (price <= 0) {
    // 어드민 유저, 프리미엄 패스 구매 유저, 기존 선택지 구매유저
    // 올패스 유저까지 체크한다.
    //

    result = await DB(
      `
    SELECT (SELECT admin FROM table_account ta WHERE userkey = ${userkey}) admin
         , (SELECT up.project_id FROM user_premium_pass up WHERE userkey = ${userkey} AND up.project_id = ${project_id}) free_check
         , (SELECT ifnull(count(*), 0) 
             FROM user_selection_purchase 
            WHERE userkey = ${userkey} AND project_id = ${project_id} AND episode_id = ${episode_id} AND selection_group = ${selection_group} AND selection_no = ${selection_no}) purchase_check
         , (SELECT CASE WHEN ta.allpass_expiration > now() THEN 1 ELSE 0 END
              FROM table_account ta  WHERE ta.userkey  = ${userkey})  allpass
      FROM DUAL;`
    );

    if (result.state && result.row.length > 0) {
      const { admin, free_check, purchase_check, allpass } = result.row[0];

      if (admin === 0 && !free_check && purchase_check === 0 && allpass === 0) {
        logger.error(`Error in purchaseSelection ${JSON.stringify(req.body)}`);
        respondDB(res, 80121, "Error in selection purcharse");
        return;
      }

      purchaseCheck = purchase_check;
    }
  }

  // 첫 구매자만 결제 처리
  if (purchaseCheck === 0) {
    //보유 스타 수 확인
    const userStar = await getCurrencyQuantity(userkey, "gem"); // 유저 보유 코인수
    if (userStar < parseInt(price, 10)) {
      logger.error(`purchaseSelection error`);
      respondDB(res, 80102);
      return;
    }

    //스타 사용
    currentQuery = `CALL pier.sp_use_user_property(?, ?, ?, ?, ?);`;
    purchaseQuery += mysql.format(currentQuery, [
      userkey,
      "gem",
      price,
      "selection_purchase",
      project_id,
    ]);

    //구매내역 히스토리 쌓기
    currentQuery = `
      INSERT INTO user_selection_purchase(userkey, project_id, episode_id, selection_group, selection_no, price) 
      VALUES(?, ?, ?, ?, ?, ?);`;
    purchaseQuery += mysql.format(currentQuery, [
      userkey,
      project_id,
      episode_id,
      selection_group,
      selection_no,
      price,
    ]);

    result = await transactionDB(purchaseQuery);
    if (!result.state) {
      logger.error(`purchaseSelection error ${result.error}`);
      respondDB(res, 80026, result.error);
      return;
    }
  }

  //구매내역 전달
  result = await DB(
    `
    SELECT episode_id
    , selection_group
    , selection_no
    , price 
    FROM user_selection_purchase
    WHERE userkey = ? 
    AND project_id = ? 
    AND episode_id = ? 
    ORDER BY selection_group, selection_no;
    `,
    [userkey, project_id, episode_id]
  );

  responseData.list = result.row;
  responseData.bank = await getUserBankInfo(req.body); // 뱅크

  res.status(200).json(responseData);

  // 로그 추가
  logAction(userkey, "paid_selection", req.body);
};

//! 작품별 과금 선택지 정보
export const getUserSelectionPurchaseInfo = async (userInfo) => {
  logger.info(`getUserSelectionPurchaseInfo`);

  const { userkey, project_id, dlc_id = -1 } = userInfo;

  const responseData = {};
  const result = await DB(
    `
    SELECT a.episode_id
    , selection_group
    , selection_no
    , a.price 
    FROM user_selection_purchase a, list_episode b
    WHERE a.episode_id = b.episode_id 
    AND userkey = ? 
    AND a.project_id = ?
    AND a.dlc_id = ${dlc_id}
    ORDER BY sortkey, episode_id;`,
    [userkey, project_id]
  );
  if (result.state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      const episode_id = item.episode_id.toString();
      if (!Object.prototype.hasOwnProperty.call(responseData, episode_id)) {
        responseData[episode_id] = [];
      }
      responseData[episode_id].push({
        episode_id: item.episode_id,
        selection_group: item.selection_group,
        selection_no: item.selection_no,
        price: item.price,
      });
    }
  }

  return responseData;
};
