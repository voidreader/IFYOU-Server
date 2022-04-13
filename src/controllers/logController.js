import { DB, logDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

// * 클라이언트에서 발생하는 Request ERROR 입력
export const reportRequestError = (req, res) => {
  const {
    body: { userkey, rawData, message },
  } = req;

  logger.error(`reportRequestError : ${JSON.stringify(req.body)}`);

  res.status(200).send("");

  logDB(
    `INSERT INTO gamelog.log_request_error (userkey, raw_data, message) VALUES (?,?,?);`,
    [userkey, rawData, message]
  );
};

export const getUserPropertyHistory = async (req, res) => {
  const {
    body: { userkey, property, range },
  } = req;

  const result = await logDB(
    `
    SELECT date_format(a.action_date, '%Y-%m-%d %T') action_date
    , a.log_type
    , a.currency
    , a.quantity
    , a.log_code
    , pier.fn_get_standard_text_id('property_path_code', a.log_code) log_code_textid
    , pier.fn_get_standard_text_id('property_log_type', a.log_type) log_type_textid
    , pier.fn_get_currency_info(a.currency, 'textid') currency_textid
 FROM gamelog.log_property a
WHERE a.userkey = ?
  AND a.currency = ?
  AND a.action_date >= date_add(now(), INTERVAL ${range * -1} DAY) 
ORDER BY a.log_no desc;
  `,
    [userkey, property]
  );

  res.status(200).json(result.row);
};
