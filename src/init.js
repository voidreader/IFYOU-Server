// import "./mongodb";
import dotenv from "dotenv";
import HTTPS from "https";
import fs from "fs";
import LRU from "lru-cache";
import { DB } from "./mysqldb";
import app from "./app";
import { logger } from "./logger";
import { getCachePlatformEvent } from "./com/cacheLoader";

dotenv.config();

const PORT = process.env.PORT || 7606;
const is_https = process.env.HTTPS;

// lru-cahce 생성 옵션
// least recently used 알고리즘으로 오래된 캐시를 새로운 캐시가 교체하는 방식이지만
// 이 프로젝트에서는 그런 방식으로 사용하지 않고 그냥 첫 구동시 로딩을 하고 계속 씀.
// (유저 정보가 아니고 기준정보성 데이터를 캐싱하는거니까)
const lruOptions = {
  max: 500,
  maxSize: 6000,
  sizeCalculation: (value, key) => {
    // 사이즈 굳이 제한두지 않음(특정 데이터 너무 길어서..) 그냥 1로 처리
    return 1;
  },
  dispose: (value, key) => {},
};

// ! 캐시 생성 (여기저기서 다 씀)
export const cache = new LRU(lruOptions);

// 캐시 정보 불러오기
export const loadingCacheData = async () => {
  console.log(`Cache Loading.... `);

  let query = ``; // 쿼리용 스트링

  // 서버 마스터 정보
  query += `SELECT cs.* FROM com_server cs WHERE server_no > 0 LIMIT 1;`;
  query += `SELECT a.* FROM com_ad a LIMIT 1;`;
  query += `
    SELECT cpt.timedeal_id 
      , cpt.conditions
      , cpt.discount 
      , cpt.deadline 
      , cpt.episode_progress 
    FROM com_premium_timedeal cpt 
  WHERE timedeal_id > 0 
  ORDER BY timedeal_id; 
  `;

  const serverInfo = await DB(query);
  cache.set("serverMaster", serverInfo.row[0][0]); // 마스터 정보
  cache.set("ad", serverInfo.row[1][0]); // 광고 세팅 정보
  cache.set("timedeal", serverInfo.row[2]); // 타임딜 정보

  // 로컬라이징 텍스트 정보
  const localInfo = await DB(`
  SELECT cl.id
      , cl.KO
      , ifnull(cl.EN, 'NO TEXT') EN
      , ifnull(cl.JA, 'NO TEXT') JA
    FROM com_localize cl 
    WHERE id > 0;
  `);
  const localData = {}; // 데이터 포장하기
  localInfo.row.forEach((item) => {
    localData[item.id.toString()] = { ...item };
  });

  cache.set("localize", localData); // 로컬라이징 텍스트 정보 세팅

  // 공지사항 및 프로모션 정보
  const cacheEvent = await getCachePlatformEvent();
  cache.set("promotion", cacheEvent.promotion);
  cache.set("notice", cacheEvent.notice);

  console.log(`Cache Done!`);
  console.log(cache.size);
  console.log(cache.calculatedSize);
}; // ? 캐시데이터 세팅 종료

const handleListening = () => {
  logger.info(`Listening on ${PORT}`);
  //console.log(`Listening on ${PORT}`);
};

// ! 서버 시작
const startHTTP = async () => {
  // 캐시 데이터 불러오고 나서 시작한다.
  await loadingCacheData(); // await로 대기

  // 캐시 데이터 로딩 다했으면 http 서버 시작.

  if (is_https > 0) {
    const option = {
      ca: fs.readFileSync("./cert/ca-chain-bundle.pem"),
      key: fs.readFileSync("./cert/key.pem"),
      cert: fs.readFileSync("./cert/crt.pem"),
    };

    console.log("this is https!!! env");

    HTTPS.createServer(option, app).listen(PORT, handleListening);
  } else {
    logger.info("this is http env");
    app.listen(PORT, handleListening);
  }
};

// HTTP 시작
startHTTP();
