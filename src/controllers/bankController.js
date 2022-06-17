import mysql from "mysql2/promise";
import { response } from "express";
import { DB, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

// 재화 수량 조회
// * 특정 그룹 재화를 위한 기능 추가 (1회권)
export const getCurrencyQuantity = async (
  userkey,
  currency,
  isGroup = false
) => {
  let result;

  if (isGroup) {
    result = await DB(
      `SELECT fn_get_user_group_property(?, ?) quantity
      FROM DUAL;`,
      [userkey, currency]
    );
  } else {
    result = await DB(
      `SELECT fn_get_user_property(?, ?) quantity
      FROM DUAL;`,
      [userkey, currency]
    );
  }

  if (result.state && result.row.length > 0) {
    return result.row[0].quantity;
  } else {
    if (!result.state) {
      logger.error(`getCurrencyQuantity Error ${result.error}`);
    }

    return 0;
  }
};

// * 유저 소모성 재화 정보
export const getUserBankInfo = async (userInfo) => {
  // ! 기본 재화 (gem, coin)
  const commonProperty = (
    await DB(
      `
      SELECT fn_get_user_property(${userInfo.userkey}, 'gem') gem
           , fn_get_user_property(${userInfo.userkey}, 'coin') coin
        FROM DUAL;
    `
    )
  ).row[0];

  // 프로젝트 귀속 재화
  const projectProperty = await DB(`
  SELECT a.currency 
     , IFNULL(SUM(a.current_quantity), 0) current_quantity
     , cc.connected_project
  FROM user_property a
     , com_currency cc 
 WHERE a.userkey = ${userInfo.userkey}
   AND NOW() < expire_date
   AND a.current_quantity > 0
   AND cc.currency = a.currency 
   AND cc.connected_project > 0 
   AND cc.is_use = 1
   AND cc.is_coin = 0
GROUP BY a.currency;
  `);

  const bank = { gem: commonProperty.gem, coin: commonProperty.coin };

  // 프로젝트 귀속재화 (있는것만) bank에 넣어주기.
  projectProperty.row.forEach((item) => {
    bank[`${item.currency}`] = parseInt(item.current_quantity, 10);
  });

  return bank;
}; // * end of bankInfo

// * 유저 재화 조회 with response
export const getUserBankInfoWithResponse = async (req, res) => {
  // ! 재화 정보만 필요할때 사용
  const bank = await getUserBankInfo(req.body);

  res.status(200).json({ bank });
};
