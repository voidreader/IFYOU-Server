import mysql from "mysql2/promise";
import { response } from "express";
import { DB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

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
GROUP BY a.currency;
  `);

  const bank = { gem: commonProperty.gem, coin: commonProperty.coin };

  // 프로젝트 귀속재화 (있는것만) bank에 넣어주기.
  projectProperty.row.forEach((item) => {
    if (item.currency.includes("OneTime"))
      item.renameCurrency = `onetime_${item.connected_project}`;
    else if (item.currency.includes("Free"))
      item.renameCurrency = `free_${item.connected_project}`;

    bank[`${item.renameCurrency}`] = parseInt(item.current_quantity, 10);
  });

  // ! 클라이언트에서 바로 참조하고있어서..
  // ! 1.0.21 버전에서 제거
  if (!Object.prototype.hasOwnProperty.call(bank, "onetime_57")) {
    bank.onetime_57 = 0;
  }

  if (!Object.prototype.hasOwnProperty.call(bank, "onetime_60")) {
    bank.onetime_60 = 0;
  }

  return bank;
}; // * end of bankInfo

// * 유저 재화 조회 with response
export const getUserBankInfoWithResponse = async (req, res) => {
  // ! 재화 정보만 필요할때 사용
  const bank = await getUserBankInfo(req.body);

  res.status(200).json({ bank });
};
