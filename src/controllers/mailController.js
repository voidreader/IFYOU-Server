import mysql from "mysql2/promise";
import { DB, slaveDB } from "../mysqldb";
import { respondError, respondDB } from "../respondent";
import { getUserBankInfo } from "./bankController";

import { logger } from "../logger";
import { userPurchaseConfirm } from "./shopController";

// 유저 미수신 메일 리스트(만료일 지나지 않은 것들)
const QUERY_USER_UNREAD_MAIL_LIST = `
SELECT a.mail_no
, a.userkey
, a.mail_type
, fn_get_standard_text_id('mail_type', a.mail_type) mail_type_textid
, a.currency
, a.quantity
, a.is_receive
, a.connected_project
, fn_get_project_name_new(a.connected_project, ?) connected_project_title
, TIMESTAMPDIFF(HOUR, now(), a.expire_date) remain_hours
, TIMESTAMPDIFF(MINUTE, now(), a.expire_date) remain_mins
, cc.local_code
, a.purchase_no 
, fn_get_design_info(cc.icon_image_id, 'url') icon_image_url
, fn_get_design_info(cc.icon_image_id, 'key') icon_image_key
, ifnull(a.contents, '') contents
FROM user_mail a
LEFT OUTER JOIN com_currency cc ON cc.currency = a.currency 
WHERE a.userkey = ?
AND a.is_receive = 0 
AND a.expire_date > now()
ORDER BY a.mail_no desc;
`;

// * 단일 메일 실제 읽기 처리하기!
export const readUserSingleMail = async (req, res, next) => {
  const {
    body: { mail_no, userkey },
  } = req;

  // 에러가 발견되면 지울 예정
  logger.info(`readUserSingleMail [${JSON.stringify(req.body)}]`);

  const mailInfo = await DB(
    `
  SELECT a.mail_no
     , a.mail_type 
     , a.currency 
     , a.quantity 
     , a.purchase_no
     , a.paid
  FROM user_mail a 
 WHERE a.mail_no = ?
   AND a.is_receive = 0
   AND a.expire_date > now();
  `,
    [mail_no]
  );

  if (!mailInfo.state || mailInfo.row.length === 0) {
    logger.error(`readUserSingleMail Error 1 ${mailInfo.error}`);
    respondDB(res, 80011, "");
    return;
  }

  const currentMail = mailInfo.row[0];

  if (currentMail.mail_type === "inapp_origin") {
    // 구매확정메일 처리
    await userPurchaseConfirm(req, currentMail.purchase_no, res, next);
  } else {
    // 일반 메일 처리

    // 재화 지급처리 (유료 재화 관련 처리)
    if (currentMail.quantity > 0) {
      const propertyInsert = await DB(
        `
      CALL sp_insert_user_property_paid(?, ?, ?, ?, ?);
      `,
        [
          userkey,
          currentMail.currency,
          currentMail.quantity,
          currentMail.mail_type,
          currentMail.paid,
        ]
      );

      if (!propertyInsert.state) {
        logger.error(`readUserSingleMail Error 2 ${propertyInsert.error}`);
        respondDB(res, 80012, propertyInsert.error);
        return;
      }
    }

    // 3. 메일 수신 처리
    const updateMail = await DB(
      `
    UPDATE user_mail 
    SET is_receive = 1
      , receive_date = now()
    WHERE mail_no = ?;
    `,
      [mail_no]
    );

    if (!updateMail.state) {
      logger.error(`readUserSingleMail Error 3 ${updateMail.error}`);
      respondDB(res, 80012, updateMail.error);
      return;
    }

    // 4. state 변경(mail_type : inapp, ifyoupass인 경우에만 해당)
    if (
      currentMail.mail_type === "inapp" ||
      currentMail.mail_type === "ifyou_pass"
    ) {
      const updateState = await DB(
        `UPDATE user_purchase SET state = 2 WHERE purchase_no = ?;`,
        [currentMail.purchase_no]
      );
      if (!updateState.state) {
        logger.error(`readUserSingleMail Error 4 ${updateState.error}`);
        respondDB(res, 80026, updateState.error);
        return;
      }
    }

    // 다했으면 ! next 불러주세요.
    if (next) {
      next(req, res);
    }
  }
}; // ? 유저 단일  메일 수신 처리 끝!

// * 유저 메일 리스트 조회
export const getUserUnreadMailList = async (req, res) => {
  const {
    body: { userkey, lang = "KO" },
  } = req;

  const responseData = {};

  // 조회 쿼리
  const result = await DB(QUERY_USER_UNREAD_MAIL_LIST, [lang, userkey]);

  // console.log(result.row);

  responseData.mailList = result.row;
  const unreadMailResult = await DB(
    `
    SELECT fn_get_user_unread_mail_count(?) cnt
    FROM dual
    `,
    [userkey]
  );

  responseData.unreadMailCount = 0;
  if (unreadMailResult.state && unreadMailResult.row.length > 0)
    responseData.unreadMailCount = unreadMailResult.row[0].cnt;

  // bank 업데이트
  responseData.bank = await getUserBankInfo(req.body);

  res.status(200).json(responseData);
};

// * 유저 단일 메일 수신 처리
export const requestReceiveSingleMail = (req, res) => {
  readUserSingleMail(req, res, getUserUnreadMailList);
};

// * 유저 모든 메일 수신 처리
export const requestReceiveAllMail = async (req, res) => {
  const {
    body: { userkey, lang = "KO" },
  } = req;

  // 에러가 발견되면 지울 예정
  logger.info(`requestReceiveAllMail [${JSON.stringify(req.body)}]`);

  // 유저의 모든 미수신 메일 정보를 읽어온다.
  const result = await slaveDB(QUERY_USER_UNREAD_MAIL_LIST, [lang, userkey]);

  for await (const item of result.row) {
    req.body.mail_no = item.mail_no;
    await readUserSingleMail(req, res, null);
  }

  getUserUnreadMailList(req, res);
};
