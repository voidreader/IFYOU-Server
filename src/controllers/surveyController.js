import mysql from "mysql2/promise";
import { DB, logAction, slaveDB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

//! 메인
export const getSurveyMain = async (req, res) => {
  const {
    body: { userkey, lang, country },
  } = req;

  const result = await DB(`
    SELECT 
    cs.survey_id
    , fn_get_survey_localize_text(title, '${lang}') title_text
    , currency 
    , quantity 
    , count(csq.question_id) question_count
    , fn_check_survey_exists(${userkey}, cs.survey_id) survey_done
    FROM com_survey cs 
    LEFT OUTER JOIN com_survey_question csq ON cs.survey_id = csq.survey_id 
    WHERE cs.survey_id > 0 
    AND is_public > 0
    AND now() BETWEEN start_date AND end_date
    AND (locate('${country}', exception_country) IS NULL OR locate('${country}', exception_country) < 1)
    GROUP BY cs.survey_id;`);

  res.status(200).json(result.row);
};

//! 상세 항목
export const getSurveyDetail = async (req, res) => {
  const {
    body: { userkey, lang = "KO", country, survey_id },
  } = req;

  const responseData = {};

  //설문조사 확인
  let result = await DB(`
    SELECT * 
    , fn_get_survey_localize_text(title, '${lang}') title_text
    , fn_check_survey_exists(${userkey}, survey_id) survey_done
    FROM com_survey 
    WHERE survey_id = ${survey_id}
    AND is_public > 0 
    AND now() BETWEEN start_date AND end_date
    AND (locate('${country}', exception_country) IS NULL OR locate('${country}', exception_country) < 1);`);
  if (!result.state || result.row.length === 0) {
    logger.info(`getSurveyDetail Error 1`);
    respondDB(res, 80019, "", lang);
    return;
  } else {
    const { survey_done, title_text, currency, quantity } = result.row[0];

    //설문조사 완료
    if (survey_done > 0) {
      logger.info(`getSurveyDetail Error 2`);
      respondDB(res, 80025, "", lang);
      return;
    }

    responseData.master = {
      title: title_text,
      currency,
      quantity,
    };
  }

  //설문조사 질문 리스트
  result = await slaveDB(`
    SELECT 
    csq.question_id
    , fn_get_survey_localize_text(question, '${lang}') question_text
    , answer_kind
    , select_check
    , csa.answer_id 
    , fn_get_survey_localize_text(csa.answer, '${lang}') answer_text
    FROM com_survey_question csq
    LEFT OUTER JOIN com_survey_answer csa 
    ON csq.question_id = csa.question_id 
    WHERE survey_id = ${survey_id}
    ORDER BY csq.sortkey, csa.sortkey;`);
  if (result.state && result.row.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of result.row) {
      const key = item.question_id.toString();
      if (!Object.hasOwnProperty.call(responseData, key)) {
        responseData[key] = [];
      }

      responseData[key].push(item);
    }
  }

  res.status(200).json(responseData);
};

//! 설문조사 완료
export const receiveSurveyReward = async (req, res) => {
  const {
    body: { userkey, lang, country, survey_id, rows = "" },
  } = req;

  let index = 1;
  let currentQuery = "";
  let updateQuery = "";

  //진행 중인 설문조사인지 확인
  let result = await DB(`
    SELECT * 
    , count(*) question_count
    FROM com_survey cs, com_survey_question csq 
    WHERE cs.survey_id = csq.survey_id 
    AND cs.survey_id = ${survey_id}
    AND is_public > 0 
    AND now() BETWEEN start_date AND end_date
    AND (locate('${country}', exception_country) IS NULL OR locate('${country}', exception_country) < 1);`);
  if (!result.state || result.row.length === 0) {
    logger.info(`receiveSurveyReward Error 1`);
    respondDB(res, 80019, "", lang);
    return;
  }

  // 보상 재화, 개수
  const { currency, quantity, question_count } = result.row[0];

  //이미 받았는지 확인
  result = await DB(
    `SELECT * FROM user_survey WHERE userkey = ? AND survey_id = ?;`,
    [userkey, survey_id]
  );
  if (!result.state || result.row.length > 0) {
    logger.info(`receiveSurveyReward Error 2`);
    respondDB(res, 80025, "", lang);
    return;
  }

  //히스토리 누적 및 메일 발송
  if (rows) {
    // 설문 답안
    currentQuery =
      "INSERT INTO user_survey(userkey, survey_id, question_id, answer, sortkey) VALUES(?, ?, ?, ?, ?);";
    const questionArr = [];
    const resultArr = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const item of rows) {
      if (!questionArr.includes(item.question_id)) {
        questionArr.push(item.question_id);
        resultArr.push(item);
      } else {
        for (let i = 0; i < resultArr.length; i++) {
          if (resultArr[i].question_id === item.question_id) {
            resultArr[i].answer += `,${item.answer}`;
          }
        }
      }
    }

    if (question_count !== questionArr.length) {
      logger.info(`receiveSurveyReward Error 3`);
      respondDB(res, 80132, "", lang);
      return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const item of resultArr) {
      updateQuery += mysql.format(currentQuery, [
        userkey,
        survey_id,
        item.question_id,
        item.answer,
        index,
      ]);
      index += 1;
    }

    // 우편 전송
    currentQuery = `
        INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
        VALUES(?, 'survey', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;
    updateQuery += mysql.format(currentQuery, [userkey, currency, quantity]);

    result = await transactionDB(updateQuery);
    if (!result.state) {
      logger.info(`receiveSurveyReward Error 4 ${result.error}`);
      respondDB(res, 80026, result.error, lang);
      return;
    }
  }

  res.status(200).json("OK");

  logAction(userkey, "survey", {
    userkey,
    lang,
    survey_id,
  });
};

//! 다국어
export const requestLocalizingSurvey = async (req, res) => {
  const {
    body: { lang = "KO" },
  } = req;

  const result = await DB(`
    SELECT 
    id
    , ${lang} message 
    FROM com_localize
    WHERE id IN (2000,6303,5034,6202,6205,6206,6207,6208,6210,6211,6213,6212,80133,80134,80135,80136,5067,5161,6209,5210,6446);`);

  res.status(200).json(result.row);
};
