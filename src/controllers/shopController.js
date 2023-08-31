import { slaveDB } from "../mysqldb";

///////////////////////////함수 처리 끝///////////////////////////////////////////

// * 상품 상세정보 가져오기
export const getInappProductDetail = async (masterId) => {
  const result = await slaveDB(
    `SELECT master_id
  , currency
  , fn_get_currency_info(currency, 'name') as currency_name
  , is_main 
  , quantity 
  , first_purchase 
  FROM com_product_detail WHERE master_id = ?;`,
    [masterId]
  );

  // console.log(result);

  return result.row;
};
