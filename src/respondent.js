import { logger } from "./logger";
import { DB } from "./mysqldb";

// * 쉬운 에러처리를 위해서 respondSuccess & respondFail 사용을 권장

// 처리 성공
export const respondSuccess = (res, responseData) => {
  responseData.result = 1;

  res.status(200).json(responseData);
};

// 응답을 성공형태로 보내주지만, 클라이언트에서는 실패로 처리해야하는 응답처리
export const respondFail = (res, responseData, dev_message, textID) => {
  logger.error(dev_message);

  responseData.result = 0;
  responseData.message = dev_message;
  responseData.messageID = textID;

  res.status(200).json(responseData);
};

// ! 에러 전송
// error : 서버에서 발생한 실제 에러 메세지
// localizedTextID : 안내 문구로 나가는 로컬라이징 텍스트 ID
// 매번 code로 전달하면 확인하기 번거로우니까.. koMessage 추가
export const respondError = (res, error, localizedTextID, koMessage) => {
  // * 메세지와 코드를 꼭 전달해주자.
  // 응답을 수신하는 클라이언트나 어드민에서는 localizedText 코드를 통해서
  // 안내 문구 + 실제 에러 메세지를 함께 보여준다.
  const result = {};
  result.message = error !== undefined && error !== null ? error : ""; // 서버 실제 에러 내용
  result.code = localizedTextID; // 텍스트ID
  result.koMessage = koMessage; // 개발자를 위한 한글 메세지

  // DB error의 경우에는 error가 오브젝트 방식으로 전달되기 때문에 알기쉽게 변경해주자!
  // 상단의 메모 참조.
  if (typeof result.message === "object" && result.message !== null) {
    if (
      Object.prototype.hasOwnProperty.call(result.message, "message") &&
      Object.prototype.hasOwnProperty.call(result.message, "code")
    ) {
      result.message = `${result.message.message} : ${result.message.code}`; // string으로 바꿔주자!
    }
  }

  // logger.error(`${localizedTextID} : ${JSON.stringify(error)}`);

  // 전송!
  res.status(400).json(result);
};

//! 에러 쿼리문
export const respondDB = async (res, errorCode, serverError, lang = "KO") => {
  const result = await DB(
    `SELECT ${lang} as message FROM com_localize WHERE id = ? ;`,
    [errorCode]
  );

  // 한국 메세지를 따로 전달하는걸로 하자.(개발자를 위해서)
  let koMessage = ``;

  if (result.row === 0) {
    koMessage = "이 에러에 해당하는 텍스트가 없습니다.";
  } else {
    koMessage = result.row[0].message;
  }

  respondError(res, serverError, errorCode, koMessage);
};

//! func 추가 : 함수명
export const respond = (result, res, func) => {
  if (!result.state) {
    logger.error(`${func} Error`);
    respondDB(res, 80026, result.error);
  } else if (result.hasOwnProperty("row")) {
    res.status(200).json(result.row);
  } else {
    res.status(200).json(result);
  }
};

//! func 추가 : 함수명
export const respondRedirect = (req, res, next, result, func, errorCode) => {
  if (result.state) {
    next(req, res);
  } else {
    logger.error(`${func} Error ${result.error}`);
    if (!errorCode || errorCode === "") {
      respondDB(res, 80026, result.error);
    } else {
      respondDB(res, errorCode, result.error);
    }
  }
};
