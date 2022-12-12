/* eslint-disable no-restricted-syntax */
import aws from "aws-sdk";
import unzipper from "unzipper";
import il from "iconv-lite";
import mysql from "mysql2/promise";

import { DB, slaveDB } from "../mysqldb";
import { respond, respondRedirect, respondDB } from "../respondent";
import { logger } from "../logger";
import * as credentials from "./google_credential.json";

const googleProjectID = "refined-sum-353306";

// 보안용 변수
const tokenMetaPath = "Metadata/global-metadata.dat";
const token64Path = "arm64-v8a/libunity.so";
const token7Path = "armeabi-v7a/libunity.so";

// aws s3 엑세스 정보
export const awsAccessInfo = new aws.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

// 버킷!
export const mainBucketName = `pierstore/assets`;

const { Translate } = require("@google-cloud/translate").v2;
const { TranslationServiceClient } = require("@google-cloud/translate");

const translate = new Translate({
  credentials,
});

const translationClient = new TranslationServiceClient({ credentials });

// * 단일 에피소드 자동번역
export const translateSingleEpisode = async (req, res) => {
  const {
    body: { project_id, episode_id, targetLang, sourceLang = "en" },
  } = req;

  logger.info(`translateSingleEpisode ${JSON.stringify(req.body)}`);

  // 용어집 ID 만들기
  const glossary_id = `${sourceLang}_${targetLang}_${project_id}`;
  const glossaryConfig = {
    glossary: `projects/${googleProjectID}/locations/us-central1/glossaries/${glossary_id}`,
  };

  let updateQuery = ``;

  const episodeInfo = await DB(`
  SELECT led.episode_id, led.title, led.summary 
  FROM list_episode a
     , list_episode_detail led 
 WHERE a.project_id = ${project_id}
   AND led.episode_id = ${episode_id}
   AND led.lang  = UPPER('${sourceLang}')
  `);

  if (!episodeInfo.state || episodeInfo.row.length === 0) {
    res.status(200).send("No episode info");
    return;
  }

  // 아래부터 스크립트 시작
  res
    .status(200)
    .send(`[${episode_id}]/[${targetLang}] episode translate start`);

  // 영어 스크립트를 타겟 스크립트로 복사한다.
  // 대상 언어의 스크립트를 제거하고 입력한다.
  await DB(`DELETE FROM list_script WHERE episode_id = ${episode_id} AND lang = UPPER('${targetLang}');
  INSERT INTO list_script (episode_id
    , scene_id
    , template
    , speaker
    , script_data
    , target_scene_id
    , requisite
    , character_expression
    , emoticon_expression
    , in_effect
    , out_effect
    , bubble_size
    , bubble_pos
    , bubble_hold
    , bubble_reverse
    , emoticon_size
    , voice
    , autoplay_row
    , dev_comment
    , project_id
    , sortkey
    , sound_effect
    , lang
    , control
    , selection_group
    , selection_no) 
    SELECT episode_id
    , scene_id
    , template
    , speaker
    , script_data
    , target_scene_id
    , requisite
    , character_expression
    , emoticon_expression
    , in_effect
    , out_effect
    , bubble_size
    , bubble_pos
    , bubble_hold
    , bubble_reverse
    , emoticon_size
    , voice
    , autoplay_row
    , dev_comment
    , project_id
    , sortkey
    , sound_effect
    , UPPER('${targetLang}')
    , control
    , selection_group
    , selection_no
      FROM list_script a
      WHERE a.episode_id = ${episode_id}
        AND a.lang = UPPER('${sourceLang}')
      ORDER BY a.script_no;
  `);

  // 복사된 타겟 언어 스크립트 정보를 가져온다. (아직 영어다)
  const targetScript = await DB(`
  SELECT ls.script_no, ls.script_data 
  FROM list_script ls
  WHERE ls.project_id = ${project_id}
    AND ls.episode_id = ${episode_id}
    AND ls.template IN ('narration', 'feeling', 'talk', 'whisper', 'yell', 'speech', 'monologue', 'message_receive', 'message_self', 'message_partner', 'message_call', 'selection', 'phone_self', 'phone_partner', 'game_message', 'selection_info', 'flow_time')
    AND ls.script_data is not null
    AND ls.script_data <> ''
    AND ls.lang = UPPER('${targetLang}');
  `);

  console.log(`${episode_id} : translate start!!!`);
  updateQuery = ``;

  for await (const scriptRow of targetScript.row) {
    // 타겟 언어 스크립트는 최초에 영어라서 이제 번역을 시작한다.
    // console.log(`[${scriptRow.script_data}]`);

    // Construct request
    const request = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [scriptRow.script_data],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    // 번역 요청하기 (한줄씩 요청)
    const [response] = await translationClient.translateText(request);
    scriptRow.script_data = response.glossaryTranslations[0].translatedText; // 번역된 언어로 교체하기.
    // console.log(scriptRow.script_data);

    // 중간중간 에러때문에 단일 쿼리 실행으로 변경
    updateQuery = mysql.format(
      `UPDATE list_script SET script_data = ? WHERE script_no = ${scriptRow.script_no};`,
      [scriptRow.script_data]
    );
    const updateResult = await DB(updateQuery);
    if (!updateResult.state) {
      // 드물게 번역이 제대로 안되고 에러나는 케이스 있다.
      logger.error(`${updateResult.error}`);
    }
  } // ? end of targetScript for.

  console.log(`[${episode_id}] single translate done`);
}; // ? translateSingleEpisode

// * 프로젝트 데이터 자동번역(용어집연계)
export const translateProjectDataWithGlossary = async (req, res) => {
  const {
    body: { project_id, targetLang, sourceLang = "en" },
  } = req;

  res.status(200).send("go!");

  console.log(req.body);

  const glossaryConfig = {
    glossary: `projects/${googleProjectID}/locations/us-central1/glossaries/${sourceLang}_${targetLang}_${project_id}`,
  };

  const episodeList = await DB(`
  SELECT led.episode_id, led.title, led.summary 
  FROM list_episode a
     , list_episode_detail led 
 WHERE a.project_id = ${project_id}
   AND led.episode_id = a.episode_id 
   AND led.lang  = upper('${sourceLang}')
 ORDER BY a.episode_type , a.chapter_number ;
  `);

  console.log(`${project_id} episode data count : [${episodeList.row.length}]`);

  // 에피소드별로 처리한다.
  for await (const episode of episodeList.row) {
    // 타이틀, 요약 따로따로 번역
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [episode.title],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    episode.title = responseTitle.glossaryTranslations[0].translatedText;

    const requestSummary = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [episode.summary],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseSummary] = await translationClient.translateText(
      requestSummary
    );
    episode.summary = responseSummary.glossaryTranslations[0].translatedText;

    // console.log(`[${episode.title}]/[${episode.summary}]`);

    // 에피소드 번역 받았으면 입력한다
    const updateResult = await DB(
      `
    INSERT INTO list_episode_detail (episode_id, lang, title, summary)
    VALUES (${episode.episode_id}, UPPER('${targetLang}'), ?, ?) 
    ON DUPLICATE KEY UPDATE title = ?, summary = ?;
    `,
      [episode.title, episode.summary, episode.title, episode.summary]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of for

  console.log(`${project_id} episode translatation end`);

  // * 여기서부터 미션 데이터 시작

  const missionList = await DB(`
  SELECT lml.mission_id, lml.mission_name, lml.mission_hint 
  FROM list_mission lm
     , list_mission_lang lml 
 WHERE lm.project_id = ${project_id}
   AND lm.mission_id = lml.mission_id 
   AND lml.lang = upper('${sourceLang}')
  ORDER BY lml.mission_id;
  `);

  console.log(`${project_id} missionList count : [${missionList.row.length}]`);

  // 에피소드별로 처리한다.
  for await (const mission of missionList.row) {
    // 타이틀, 요약 따로따로 번역
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [mission.mission_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    mission.mission_name = responseTitle.glossaryTranslations[0].translatedText;

    const requestMissionSummary = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [mission.mission_hint],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseMissionSummary] = await translationClient.translateText(
      requestMissionSummary
    );
    mission.mission_hint =
      responseMissionSummary.glossaryTranslations[0].translatedText;

    // console.log(`[${mission.mission_name}]/[${mission.mission_hint}]`);

    // 에피소드 번역 받았으면 입력한다
    const updateResult = await DB(
      `
    INSERT INTO list_mission_lang (mission_id, lang, mission_name, mission_hint)
    VALUES (${mission.mission_id}, UPPER('${targetLang}'), ?, ?) 
    ON DUPLICATE KEY UPDATE mission_name = ?, mission_hint = ?;
    `,
      [
        mission.mission_name,
        mission.mission_hint,
        mission.mission_name,
        mission.mission_hint,
      ]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of for
  console.log(`${project_id} mission translatation end`);

  // ! 코인상품
  const coinShopList = await DB(`
  SELECT ccpd.coin_product_id, ccpd.name 
  FROM com_coin_product ccp
     , com_currency cc 
     , com_coin_product_detail ccpd 
  WHERE cc.currency = ccp.currency
    AND cc.connected_project = ${project_id}
    AND ccpd.coin_product_id = ccp.coin_product_id 
    AND ccpd.lang = upper('${sourceLang}')
  ;
  `);

  console.log(`${project_id} coinShop count : [${coinShopList.row.length}]`);

  for await (const coin of coinShopList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [coin.name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    coin.name = responseTitle.glossaryTranslations[0].translatedText;

    const updateResult = await DB(
      `
    INSERT INTO com_coin_product_detail (coin_product_id, lang, name)
    VALUES (${coin.coin_product_id}, UPPER('${targetLang}'), ?) 
    ON DUPLICATE KEY UPDATE name = ?;
    `,
      [coin.name, coin.name]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 코인샵 상품 for
  console.log(`${project_id} #### coinShop translatation end`);

  // 연결재화 로컬ID 자동번역 //////////////////////////////////////
  const currencyList = await DB(`
  SELECT cl.id, cl.${sourceLang} sourceText
  FROM com_currency cc
     , com_localize cl 
 WHERE cc.connected_project  = ${project_id}
   AND cl.id = cc.local_code
;
  `);

  console.log(
    `${project_id} currencyList count : [${currencyList.row.length}]`
  );

  for await (const currency of currencyList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [currency.sourceText],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    currency.sourceText = responseTitle.glossaryTranslations[0].translatedText;

    const updateResult = await DB(
      `
    update com_localize 
       SET ${targetLang} = ?
     WHERE id = ?;
    `,
      [currency.sourceText, currency.id]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 재화for
  console.log(`${project_id} #### currency translatation end`);
  //////////////////// 재화 끝

  // * 사운드 시작
  const soundList = await DB(`
  SELECT lsl.sound_id, lsl.public_name 
  FROM list_sound ls 
     , list_sound_lang lsl 
 WHERE ls.project_id = ${project_id}
   AND ls.is_public > 0
   AND lsl.sound_id = ls.sound_id 
   AND lsl.lang = upper('${sourceLang}')
;
  `);

  console.log(`${project_id} soundList count : [${soundList.row.length}]`);

  for await (const sound of soundList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [sound.public_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    sound.public_name = responseTitle.glossaryTranslations[0].translatedText;

    const updateResult = await DB(
      `
      INSERT INTO list_sound_lang (sound_id, lang, public_name)
      VALUES (${sound.sound_id}, UPPER('${targetLang}'), ?) 
      ON DUPLICATE KEY UPDATE public_name = ?;
      `,
      [sound.public_name, sound.public_name]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 재화for
  console.log(`${project_id} #### Sound translatation end`);
  //////////////// 사운드 종료

  // * 말풍선 시작
  const bubbleList = await DB(`
    SELECT ccb.currency, bubble
    FROM com_currency cc
       , com_currency_bubble ccb 
   WHERE cc.connected_project  = ${project_id}
     AND ccb.currency = cc.currency
     AND ccb.lang  = upper('${sourceLang}')
  ;
    `);

  console.log(`${project_id} bubbleList count : [${bubbleList.row.length}]`);

  for await (const bubble of bubbleList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [bubble.bubble],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    bubble.bubble = responseTitle.glossaryTranslations[0].translatedText;

    const updateResult = await DB(
      `
        INSERT INTO com_currency_bubble (currency, lang, bubble)
        VALUES ('${bubble.currency}', UPPER('${targetLang}'), ?) 
        ON DUPLICATE KEY UPDATE bubble = ?;
        `,
      [bubble.bubble, bubble.bubble]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 재화for
  console.log(`${project_id} #### Bubble translatation end`);
  //////////////// 말풍선 종료

  // * TMI 시작
  const loadingList = await DB(`
    SELECT lld.detail_no, lld.loading_text, lld.loading_id
    FROM list_loading ll
       , list_loading_detail lld 
   WHERE ll.project_id = ${project_id}
     AND lld.lang = upper('${sourceLang}')
     AND lld.loading_id = ll.loading_id;
    `);

  console.log(`${project_id} loadingList count : [${loadingList.row.length}]`);

  // 여기는 예외로 타겟언어를 삭제하고 시작한다
  const deleteLoading = await DB(`
  DELETE FROM list_loading_detail lld WHERE lang = UPPER('${targetLang}') AND loading_id  IN (SELECT z.loading_id FROM list_loading z WHERE z.project_id = ${project_id});
  `);

  for await (const loading of loadingList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [loading.loading_text],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    loading.loading_text = responseTitle.glossaryTranslations[0].translatedText;

    const updateResult = await DB(
      `
        INSERT INTO list_loading_detail (loading_id, lang, loading_text)
        VALUES (${loading.loading_id}, UPPER('${targetLang}'), ?);
        `,
      [loading.loading_text]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 재화for
  console.log(`${project_id} #### loading translatation end`);
  //////////////// TMI 종료

  // * 일반 일러스트
  const illustList = await DB(`
  SELECT lil.illust_id , lil.lang, lil.public_name, lil.summary
  FROM list_illust_lang lil
     , list_illust li 
 WHERE li.project_id = ${project_id}
   AND lil.illust_id = li.illust_id 
   AND lil.lang = upper('${sourceLang}')
   AND lil.illust_type = 'illust'
   AND li.is_public > 0
 ORDER BY lil.illust_id;
;
  `);

  console.log(`${project_id} illustList count : [${illustList.row.length}]`);

  for await (const illust of illustList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [illust.public_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    illust.public_name = responseTitle.glossaryTranslations[0].translatedText;

    const requestTitle2 = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [illust.summary],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle2] = await translationClient.translateText(
      requestTitle2
    );
    illust.summary = responseTitle2.glossaryTranslations[0].translatedText;

    const updateResult = await DB(
      `
      INSERT INTO list_illust_lang (illust_id, lang, illust_type, public_name, summary)
      VALUES (${illust.illust_id}, UPPER('${targetLang}'), ?, ?, ?) 
      ON DUPLICATE KEY UPDATE public_name = ?, summary = ?;
      `,
      [
        "illust",
        illust.public_name,
        illust.summary,
        illust.public_name,
        illust.summary,
      ]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of illust for
  console.log(`${project_id} #### illust translatation end`);
  //////////////// 일반 일러스트 종료

  // * 라이브 일러스트
  const liveIllustList = await DB(`
  SELECT lil.illust_id , lil.lang, lil.public_name, lil.summary
  FROM list_illust_lang lil
     , list_live_illust li 
 WHERE li.project_id = ${project_id}
   AND lil.illust_id = li.live_illust_id  
   AND lil.lang = upper('${sourceLang}')
   AND li.is_public > 0
   AND lil.illust_type = 'live2d';  
;
  `);

  console.log(
    `${project_id} liveIllustList count : [${liveIllustList.row.length}]`
  );

  for await (const illust of liveIllustList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [illust.public_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    illust.public_name = responseTitle.glossaryTranslations[0].translatedText;

    const requestTitle2 = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [illust.summary],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle2] = await translationClient.translateText(
      requestTitle2
    );
    illust.summary = responseTitle2.glossaryTranslations[0].translatedText;

    const updateResult = await DB(
      `
      INSERT INTO list_illust_lang (illust_id, lang, illust_type, public_name, summary)
      VALUES (${illust.illust_id}, UPPER('${targetLang}'), ?, ?, ?) 
      ON DUPLICATE KEY UPDATE public_name = ?, summary = ?;
      `,
      [
        "live2d",
        illust.public_name,
        illust.summary,
        illust.public_name,
        illust.summary,
      ]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of live illust for
  console.log(`${project_id} #### live illust translatation end`);
  //////////////// 라이브 일러스트 종료

  // * 미니컷
  const minicutList = await DB(`
  SELECT lil.minicut_id, lil.lang, lil.public_name, lil.summary
  FROM list_minicut_lang lil
     , list_minicut li 
 WHERE li.project_id = ${project_id}
   AND lil.minicut_id = li.minicut_id 
   AND lil.lang = upper('${sourceLang}')
   AND li.is_public > 0
   AND lil.minicut_type = 'minicut';
  `);

  console.log(`${project_id} minicutList count : [${minicutList.row.length}]`);

  for await (const minicut of minicutList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [minicut.public_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    minicut.public_name = responseTitle.glossaryTranslations[0].translatedText;

    const requestTitle2 = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [minicut.summary],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle2] = await translationClient.translateText(
      requestTitle2
    );
    minicut.summary = responseTitle2.glossaryTranslations[0].translatedText;

    const updateResult = await DB(
      `
      INSERT INTO list_minicut_lang (minicut_id, lang, minicut_type, public_name, summary)
      VALUES (${minicut.minicut_id}, UPPER('${targetLang}'), ?, ?, ?) 
      ON DUPLICATE KEY UPDATE public_name = ?, summary = ?;
      `,
      [
        "minicut",
        minicut.public_name,
        minicut.summary,
        minicut.public_name,
        minicut.summary,
      ]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of minicut for
  console.log(`${project_id} #### minicut translatation end`);
  //////////////// 미니컷 종료

  // * 미니컷
  const liveObjectList = await DB(`
  SELECT lil.minicut_id, lil.lang, lil.public_name, lil.summary
  FROM list_minicut_lang lil
     , list_live_object li 
 WHERE li.project_id = ${project_id}
   AND lil.minicut_id = li.live_object_id  
   AND lil.lang = upper('${sourceLang}')
   AND li.is_public > 0
   AND lil.minicut_type  = 'live2d';     
  `);

  console.log(
    `${project_id} liveObjectList count : [${liveObjectList.row.length}]`
  );

  for await (const minicut of liveObjectList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [minicut.public_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    minicut.public_name = responseTitle.glossaryTranslations[0].translatedText;

    const requestTitle2 = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [minicut.summary],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle2] = await translationClient.translateText(
      requestTitle2
    );
    minicut.summary = responseTitle2.glossaryTranslations[0].translatedText;

    const updateResult = await DB(
      `
      INSERT INTO list_minicut_lang (minicut_id, lang, minicut_type, public_name, summary)
      VALUES (${minicut.minicut_id}, UPPER('${targetLang}'), ?, ?, ?) 
      ON DUPLICATE KEY UPDATE public_name = ?, summary = ?;
      `,
      [
        "live2d",
        minicut.public_name,
        minicut.summary,
        minicut.public_name,
        minicut.summary,
      ]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of minicut for
  console.log(`${project_id} #### live object translatation end`);
  //////////////// 라이브 오브젝트 종료
}; // ? 종료 프로젝트 데이터

// * 프로젝트 특정 데이터 자동번역 (용어집 연계)
export const translateProjectSpecificDataWithGlossary = async (req, res) => {
  const {
    body: { project_id, targetLang, sourceLang = "en" },
  } = req;

  console.log(req.body);

  const glossaryConfig = {
    glossary: `projects/${googleProjectID}/locations/us-central1/glossaries/${sourceLang}_${targetLang}_${project_id}`,
  };

  // 연결재화 로컬ID 자동번역 //////////////////////////////////////
  const currencyList = await DB(`
  SELECT cl.id, cl.${sourceLang} sourceText
  FROM com_currency cc
     , com_localize cl 
 WHERE cc.connected_project  = ${project_id}
   AND cl.id = cc.local_code
;
  `);

  console.log(
    `${project_id} currencyList count : [${currencyList.row.length}]`
  );

  for await (const currency of currencyList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [currency.sourceText],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    currency.sourceText = responseTitle.glossaryTranslations[0].translatedText;

    const updateResult = await DB(
      `
    update com_localize 
       SET ${targetLang} = ?
     WHERE id = ?;
    `,
      [currency.sourceText, currency.id]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 재화for
  console.log(`${project_id} #### currency translatation end`);

  res.status(200).send("ok");
};

// * 작품 스크립트 자동 번역 생성하기
export const translateScriptWithGlossary = async (req, res) => {
  // * 프로젝트ID, 번역될 언어 값을 받아서 변형시킨다.
  // * targetLang은 소문자로 받는다.

  const {
    body: { project_id, targetLang },
  } = req;

  let updateQuery = ``;
  const glossary_id = `en_${targetLang}_${project_id}`;
  req.body.glossary_id = glossary_id;

  res.status(200).json(req.body);

  // 구글 클라우드 용어집 설정
  const glossaryConfig = {
    glossary: `projects/${googleProjectID}/locations/us-central1/glossaries/${glossary_id}`,
  };

  // 작품의 에피소드 리스트 가져온다.
  const episodeList = await DB(`
  SELECT le.episode_id, le.title
  FROM list_episode le
 WHERE le.project_id = ${project_id}
  ORDER BY le.episode_type, le.chapter_number;
  `);

  // * 에피소드 별로 복사를 한다.
  for await (const item of episodeList.row) {
    console.log(`[${item.id}] [${item.title}] start translation`);

    // 영어 스크립트를 타겟 스크립트로 복사한다.
    // 대상 언어의 스크립트를 제거하고 입력한다.
    await DB(`DELETE FROM list_script WHERE episode_id = ${item.episode_id} AND lang = UPPER('${targetLang}');
    INSERT INTO list_script (episode_id
      , scene_id
      , template
      , speaker
      , script_data
      , target_scene_id
      , requisite
      , character_expression
      , emoticon_expression
      , in_effect
      , out_effect
      , bubble_size
      , bubble_pos
      , bubble_hold
      , bubble_reverse
      , emoticon_size
      , voice
      , autoplay_row
      , dev_comment
      , project_id
      , sortkey
      , sound_effect
      , lang
      , control
      , selection_group
      , selection_no) 
      SELECT episode_id
      , scene_id
      , template
      , speaker
      , script_data
      , target_scene_id
      , requisite
      , character_expression
      , emoticon_expression
      , in_effect
      , out_effect
      , bubble_size
      , bubble_pos
      , bubble_hold
      , bubble_reverse
      , emoticon_size
      , voice
      , autoplay_row
      , dev_comment
      , project_id
      , sortkey
      , sound_effect
      , UPPER('${targetLang}')
      , control
      , selection_group
      , selection_no
        FROM list_script a
       WHERE a.episode_id = ${item.episode_id}
         AND a.lang = 'EN'
       ORDER BY a.script_no;
    `);

    // 복사된 타겟 언어 스크립트 정보를 가져온다. (아직 영어다)
    const targetScript = await DB(`
    SELECT ls.script_no, ls.script_data 
    FROM list_script ls
   WHERE ls.project_id = ${project_id}
     AND ls.episode_id = ${item.episode_id}
     AND ls.template IN ('narration', 'feeling', 'talk', 'whisper', 'yell', 'speech', 'monologue', 'message_receive', 'message_self', 'message_partner', 'message_call', 'selection', 'phone_self', 'phone_partner', 'game_message', 'selection_info', 'flow_time')
     AND ls.script_data is not null
     AND ls.script_data <> ''
     AND ls.lang = UPPER('${targetLang}');
    `);

    console.log(`${JSON.stringify(item)} translate start!!!`);
    updateQuery = ``;

    for await (const scriptRow of targetScript.row) {
      // 타겟 언어 스크립트는 최초에 영어라서 이제 번역을 시작한다.
      // console.log(`[${scriptRow.script_data}]`);

      // Construct request
      const request = {
        parent: `projects/${googleProjectID}/locations/us-central1`,
        contents: [scriptRow.script_data],
        mimeType: "text/plain", // mime types: text/plain, text/html
        sourceLanguageCode: "en",
        targetLanguageCode: targetLang,
        glossaryConfig,
      };

      // 번역 요청하기 (한줄씩 요청)
      const [response] = await translationClient.translateText(request);
      scriptRow.script_data = response.glossaryTranslations[0].translatedText; // 번역된 언어로 교체하기.
      // console.log(scriptRow.script_data);

      // 중간중간 에러때문에 단일 쿼리 실행으로 변경
      updateQuery = mysql.format(
        `UPDATE list_script SET script_data = ? WHERE script_no = ${scriptRow.script_no};`,
        [scriptRow.script_data]
      );
      const updateResult = await DB(updateQuery);
      if (!updateResult.state) {
        // 드물게 번역이 제대로 안되고 에러나는 케이스 있다.
        logger.error(`${updateResult.error}`);
      }
    } // ? end of targetScript for.

    console.log(`[${item.episode_id}] [${item.title}]`);
  } // ? end of episode for await

  // Run request
  console.log(`Done!`);
};

// * 용어집과 함께 번역
export const translateWithGlossary = async (req, res) => {
  const {
    body: { text, targetLang, sourceLang, glossary_id },
  } = req;

  const glossaryConfig = {
    glossary: `projects/${googleProjectID}/locations/us-central1/glossaries/${glossary_id}`,
  };
  // Construct request
  const request = {
    parent: `projects/${googleProjectID}/locations/us-central1`,
    contents: [text],
    mimeType: "text/plain", // mime types: text/plain, text/html
    sourceLanguageCode: sourceLang,
    targetLanguageCode: targetLang,
    glossaryConfig,
  };

  // Run request
  const [response] = await translationClient.translateText(request);

  const resultText = response.glossaryTranslations[0].translatedText;

  for (const translation of response.glossaryTranslations) {
    console.log(`Translation: ${translation.translatedText}`);
  }

  res.status(200).send(resultText);
};

// * 번역 API
export const translateText = async (req, res) => {
  const {
    body: { text, targetLang },
  } = req;

  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.
  let [translations] = await translate.translate(text, targetLang);
  translations = Array.isArray(translations) ? translations : [translations];
  console.log("Translations: ", translations.length);

  /*
  translations.forEach((translation, i) => {
    console.log(`${text[i]} => (${targetLang}) ${translation}`);
  });
  */

  res.status(200).send(translations[0]);
}; // 번역 API 종료

// * 한글=>일어 대응 용어집 생성
export const createJapanGlossary = async (req, res) => {
  const {
    body: { filename, glossary_id },
  } = req;

  // Construct glossary
  const glossary = {
    languageCodesSet: {
      languageCodes: ["ko", "ja"],
    },
    inputConfig: {
      gcsSource: {
        inputUri: `gs://ifyou/translate/${filename}`,
      },
    },
    name: `projects/${googleProjectID}/locations/us-central1/glossaries/${glossary_id}`,
  };

  // Construct request
  const request = {
    parent: `projects/${googleProjectID}/locations/us-central1`,
    glossary,
  };

  // Create glossary using a long-running operation
  const [operation] = await translationClient.createGlossary(request);

  await operation
    .promise()
    .then(() => {
      console.log("Created glossary:");
      console.log(
        `InputUri ${request.glossary.inputConfig.gcsSource.inputUri}`
      );

      res.status(200).send("용어집이 생성되었습니다.");
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send("파일이 없거나 파일 형식이 잘못되었습니다.");
    });
};

// 영어 - 아랍어 용어집 생성
export const createArabicGlossary = async (req, res) => {
  const {
    body: { filename, glossary_id },
  } = req;

  // Construct glossary
  const glossary = {
    languageCodesSet: {
      languageCodes: ["en", "ko", "ar"],
    },
    inputConfig: {
      gcsSource: {
        inputUri: `gs://ifyou/translate/${filename}`,
      },
    },
    name: `projects/${googleProjectID}/locations/us-central1/glossaries/${glossary_id}`,
  };

  // Construct request
  const request = {
    parent: `projects/${googleProjectID}/locations/us-central1`,
    glossary,
  };

  // Create glossary using a long-running operation
  const [operation] = await translationClient.createGlossary(request);

  await operation
    .promise()
    .then(() => {
      console.log("Created glossary:");
      console.log(
        `InputUri ${request.glossary.inputConfig.gcsSource.inputUri}`
      );

      res.status(200).send("용어집이 생성되었습니다.");
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send("파일이 없거나 파일 형식이 잘못되었습니다.");
    });
};

// * 공통 com_localize 용어집 생성
export const createComGlossary = async (req, res) => {
  // Construct glossary
  const glossary = {
    languageCodesSet: {
      languageCodes: ["en", "ko", "ar", "ms", "es", "ru"],
    },
    inputConfig: {
      gcsSource: {
        inputUri: `gs://ifyou/translate/com.csv`,
      },
    },
    name: `projects/${googleProjectID}/locations/us-central1/glossaries/ifyou_com`,
  };

  const request = {
    parent: `projects/${googleProjectID}/locations/us-central1`,
    glossary,
  };

  // Create glossary using a long-running operation
  const [operation] = await translationClient.createGlossary(request);

  await operation
    .promise()
    .then(() => {
      console.log("Created glossary:");
      console.log(
        `InputUri ${request.glossary.inputConfig.gcsSource.inputUri}`
      );

      res.status(200).send("공통 용어집이 생성되었습니다.");
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send("파일이 없거나 파일 형식이 잘못되었습니다.");
    });
};

// * 공통 텍스트 번역 with 용어집
export const translateComLocalize = async (req, res) => {
  const {
    body: { targetLang, sourceLang },
  } = req;

  const glossaryConfig = {
    glossary: `projects/${googleProjectID}/locations/us-central1/glossaries/ifyou_com`,
  };

  const targetText = await slaveDB(`
  SELECT cl.*
  FROM com_localize cl
 WHERE cl.EN NOT LIKE '%<color%'
   AND cl.EN IS NOT NULL
   AND cl.EN <> ''
   AND (cl.id BETWEEN 200 AND 230
   		OR cl.id BETWEEN 3000 AND 3999
   		OR cl.id BETWEEN 5000 AND 5999
   		OR cl.id BETWEEN 6000 AND 6495
   		OR cl.id BETWEEN 8000 AND 12007
   );
  `);

  res.status(200).send(`com_localize 번역 시작 ${JSON.stringify(req.body)}`);

  for await (const textRow of targetText.row) {
    const sourceText = textRow[sourceLang.toUpperCase()];

    // Construct request
    const request = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [sourceText],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      glossaryConfig,
    };

    // 번역 요청하기 (한줄씩 요청)
    const [response] = await translationClient.translateText(request);
    textRow[targetLang.toUpperCase()] =
      response.glossaryTranslations[0].translatedText; // 번역된 언어로 교체하기.

    const updateResult = await DB(
      `
      update com_localize
         SET ${targetLang.toUpperCase()} = ?
      WHERE id = ?;
      `,
      [textRow[targetLang.toUpperCase()], textRow.id]
    );

    if (!updateResult.state) {
      logger.error(updateResult.error);
    }
  }

  console.log("done");
};

// 용어집 삭제
export const deleteGlossary = async (req, res) => {
  const {
    body: { glossary_id },
  } = req;

  // Construct request
  const request = {
    parent: `projects/${googleProjectID}/locations/us-central1`,
    name: `projects/${googleProjectID}/locations/us-central1/glossaries/${glossary_id}`,
  };

  // Delete glossary using a long-running operation
  const [operation] = await translationClient.deleteGlossary(request);

  // Wait for operation to complete.
  const [response] = await operation.promise();

  console.log(`Deleted glossary: ${response.name}`);

  res.status(200).send(`${response.name}`);
};

// 이전 S3 오브젝트 기록하기
export const RecordPrviousS3Object = ({ project_id, object_key, bucket }) => {
  // ! 이제까지는 (2021.07.12 기준) 리소스 교체시에는 즉시 과거 S3를 삭제했지만,
  // ! 추후 테스트 - 라이브 서버를 분리하게 되면, 즉시 삭제하는 경우
  // ! 라이브 서버에서 과거 S3 오브젝트를 참조하는 경우에 문제가 발생한다. (없으니까...)
  // ! 그래서 교체시에 즉각적으로 삭제하지 않고, 특정 테이블에 정보를 기록해놓고,
  // ! 변경 사항이 라이브로 반영된 시점에 수동으로 정리하도록 처리하자.

  // * 테이블 교체 : 기존 list_previous_s3, target_delete_s3 사용하지 않음. (삭제)
  DB(
    `INSERT INTO table_stashed_s3 (project_id, object_key, bucket) VALUES (?,?,?)`,
    [project_id, object_key, bucket]
  );
};

// S3 오브젝트 삭제 메소드
// ! 함부로 호출하지 말것.
export const DeleteS3Object = (bucket, key) => {
  awsAccessInfo.deleteObject(
    {
      Bucket: bucket,
      Key: key,
    },
    (err, data) => {
      if (err) {
        logger.err(`DeleteS3Object Error ${err}`);
        return;
      }
      console.log("s3 deleteObject ", key);
    }
  );
};

// S3 버려진것들 한번에 정리하기.
// ! 함부로 호출하지 말것
// ! 프로젝트별로 처리하도록 변경
export const DeleteStashedS3Objects = async (project_id) => {
  const query = `
    SELECT a.object_key, a.bucket
      FROM table_stashed_s3 a
    WHERE a.project_id = ${project_id}
  `;

  // S3에서 삭제처리
  const result = await DB(query);
  if (result.state && result.row.length > 0) {
    result.row.forEach((item) => {
      DeleteS3Object(item.bucket, item.object_key);
    });
  }

  // S3 삭제 후 테이블에서 제거
  const deleteQuery = `DELETE FROM table_stashed_s3 WHERE project_id = ${project_id}`;
  await DB(deleteQuery);

  // 끝
};
// ? s3 정리 부분 끝

// * zip 업로드 (공통 메소드)
// zipType : image, live2d, sound 등 zip 파일이 담고있는 파일 형식
// queryMaker : Insert Query 만드는 함수
// createOrReplace : 실제 쿼리 실행하는 함수
export const uploadZipResources = async (
  req,
  res,
  zipType,
  queryMaker,
  createOrReplace
) => {
  const {
    // 올라간 원본 zip파일의 위치와 키
    file: { location, key, bucket, acl }, // zip 파일 기본
    params: { id }, // 프로젝트
  } = req;

  // ! body를 따로 저장
  const { body } = req;

  console.log(`file : ${decodeURI(encodeURI(JSON.stringify(req.file)))}`);

  let resultUnzip = null;

  const s3param = {
    Bucket: bucket,
    Key: key,
  };

  // 원본 압축 파일을 가져와서 압축 해제를 시작!
  const zip = awsAccessInfo
    .getObject(s3param)
    .createReadStream()
    .pipe(unzipper.Parse({ forceStream: true }));

  const promises = [];
  const origins = []; // zip 파일내의 오리지널 파일 정보
  let i = 1;

  // eslint-disable-next-line no-restricted-syntax
  for await (const e of zip) {
    const entry = e;

    // 한글파일명이 깨져서 압축해제할때 디코딩 해야한다.
    const { isUnicode } = entry.props.flags;
    // decode "non-unicode" filename from OEM Cyrillic character set
    const fileName = isUnicode
      ? entry.path
      : il.decode(entry.props.pathBuffer, "cp949");
    const { type } = entry;

    console.log(fileName); // filename 체크해보고..

    const fileLength = fileName.length;
    const lastDot = fileName.lastIndexOf(".");
    const fileExtension = fileName.substring(lastDot + 1, fileLength);
    const obfuscated = `${Date.now()}_${i}`; // 난독화

    // ! 확장자가 잘못되어있으면 업로드 대상에서 뺀다. (image, live2d, sound, bubble)
    // ! 계속 추가할것!
    if (zipType === "image" || zipType === "bubble") {
      if (!fileExtension.includes("png") && !fileExtension.includes("jpg")) {
        // eslint-disable-next-line no-continue
        continue;
      }
    } else if (zipType === "sound") {
      if (!fileExtension.includes("wav") && !fileExtension.includes("mp3")) {
        // eslint-disable-next-line no-continue
        continue;
      }
    }

    // 압축해제한 파일을 업로드 하기 위해 난독화와 이름을 처리한다.
    // middlewares의 multerBackground와 동일하게 사용한다.
    const originObj = {};

    originObj.obfuscated = `${obfuscated}.${fileExtension}`;
    // eslint-disable-next-line prefer-destructuring
    originObj.title = fileName.split(".")[0];

    origins.push(originObj);

    if (type === "File") {
      // bucket, key 주의!
      // ! id/body.folder/... 로 진행한다.
      // ! bubble은 공통 리소스라서 폴더가 다르다.
      let savedFolder = `${id}/${body.folder}/${obfuscated}.${fileExtension}`;

      if (zipType === "bubble")
        savedFolder = `${body.folder}/${obfuscated}.${fileExtension}`;

      const uploadParams = {
        Bucket: mainBucketName,
        ACL: acl,
        Key: savedFolder,
        Body: entry,
      };

      promises.push(awsAccessInfo.upload(uploadParams).promise());
    } else {
      entry.autodrain(); // file 이 아니면 stream을 dispose. ..파일이 아닌게 올 수 도 있나..?
    }
    i += 1;
  } // end of for await

  // 모든 파일 업로드 후 DB 처리
  await Promise.all(promises)
    .then((values) => {
      resultUnzip = values;
      // console.log(resultUnzip);

      // values는 object의 배열로 받는다.
      let insertstr = "";

      resultUnzip.forEach((item) => {
        // origins 에서 title을 가져와야한다.
        let title = "";
        origins.forEach((origin) => {
          if (item.Key.includes(origin.obfuscated)) {
            title = origin.title;
          }
        });

        // zip으로 올리면 bucket과 키가 의도와 달라서 편집해서 전달.
        // queryMaker에게 query를 받아오도록 처리
        insertstr += queryMaker(
          id,
          title,
          item.Location,
          item.Key.replaceAll(`assets/`, ``),
          mainBucketName,
          body
        );
        /*
        insertstr += mysql.format(Q_CREATE_OR_REPLACE_IMAGE, [
          id,
          title,
          item.Location,
          item.Key.replaceAll(`assets/`, ``),
          mainBucketName,
        ]);
        */
      });

      console.log(`>>> query made ${insertstr}`);
      createOrReplace(req, res, insertstr);
    })
    .catch((err) => {
      logger.error(`uploadZipResources Error ${err.error}`);
      respondDB(res, 80041, err.error);
    });

  // * zip 파일 삭제
  DeleteS3Object(bucket, key);
};

// * 페이지네이션용 쿼리
export const getPagenationQuery = (page, page_size) => {
  // page < 0 이면 페이징 하지 않음
  if (parseInt(page, 10) < 0) return ` LIMIT 500`;

  // * start, end 처리
  const start =
    parseInt(page, 10) * parseInt(page_size, 10) + page == 0 ? 0 : 1;
  const end = start + parseInt(page_size, 10);

  return ` LIMIT ${start}, ${end}`;
};

// * LIKE 조건 쿼리 구하기
export const getLikeConditionQuery = (
  col,
  word,
  isStart = false,
  isUpperCase = false,
  oper = "AND"
) => {
  let query = "";

  if (isStart) {
    query += ` WHERE ${col} LIKE '%${
      isUpperCase ? word.toUpperCase() : word
    }%'`;
  } else {
    query += ` ${oper} ${col} LIKE '%${
      isUpperCase ? word.toUpperCase() : word
    }%'`;
  }

  return query;
};

//* IN 조건 쿼리 구하기
export const getInConditionQuery = (col, word, isStart = false) => {
  let query = "";
  let start = " AND ";
  let setWord = ``;

  if (isStart) start = " WHERE";

  if (word.includes("SELECT")) {
    // 구문에 SELECT가 있으면 ''(중괄호) 해제
    setWord = word;
  } else {
    const wordArray = word.split(",");
    // eslint-disable-next-line no-restricted-syntax
    for (const item of wordArray) {
      setWord += `'${item}',`;
    }
    setWord = setWord.slice(0, -1);
  }

  query += ` ${start} ${col} IN (${setWord}) `;

  return query;
};

//* = 조건 쿼리 구하기
export const getEqualConditionQuery = (col, word, isEqual, isStart = false) => {
  let query = "";
  let start = " AND";
  let equal = " <> ";

  if (isStart) start = " WHERE";
  if (isEqual) equal = " = ";

  query += ` ${start} ${col} ${equal} '${word}' `;

  return query;
};

//* 날짜 쿼리 구하기
export const getDateConditionQuery = (
  col,
  startDate,
  endDate,
  isStart = false
) => {
  let query = "";
  let start = " AND ";

  if (isStart) start = " WHERE";

  query += ` ${start}  ${col} BETWEEN DATE_FORMAT('${startDate}', '%Y-%m-%d 00:00:00') AND DATE_FORMAT('${endDate}', '%Y-%m-%d 23:59:59') `;

  return query;
};

//* 비교 쿼리 구하기
export const getCompareConditionQuery = (
  col,
  compare,
  col2,
  isStart = false
) => {
  let query = "";
  let start = "AND";

  if (isStart) start = "WHERE";

  query += ` ${start} ${col} ${compare} ${col2} `;

  return query;
};

// ! 프로젝트 모든 데이터 번역(용어집 없음)
export const translateProjectDataWithoutGlossary = async (req, res) => {
  const {
    body: { project_id, targetLang, sourceLang = "en" },
  } = req;

  res.status(200).send("go!");

  console.log(req.body);

  const episodeList = await DB(`
  SELECT led.episode_id, led.title, led.summary 
  FROM list_episode a
     , list_episode_detail led 
 WHERE a.project_id = ${project_id}
   AND led.episode_id = a.episode_id 
   AND led.lang  = upper('${sourceLang}')
 ORDER BY a.episode_type , a.chapter_number ;
  `);

  console.log(`${project_id} episode data count : [${episodeList.row.length}]`);

  // 에피소드별로 처리한다.
  for await (const episode of episodeList.row) {
    // 타이틀, 요약 따로따로 번역
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [episode.title],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    episode.title = responseTitle.translations[0].translatedText;

    const requestSummary = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [episode.summary],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseSummary] = await translationClient.translateText(
      requestSummary
    );
    episode.summary = responseSummary.translations[0].translatedText;

    // console.log(`[${episode.title}]/[${episode.summary}]`);

    // 에피소드 번역 받았으면 입력한다
    const updateResult = await DB(
      `
    INSERT INTO list_episode_detail (episode_id, lang, title, summary)
    VALUES (${episode.episode_id}, UPPER('${targetLang}'), ?, ?) 
    ON DUPLICATE KEY UPDATE title = ?, summary = ?;
    `,
      [episode.title, episode.summary, episode.title, episode.summary]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of for

  console.log(`${project_id} episode translatation end`);

  // * 여기서부터 미션 데이터 시작

  const missionList = await DB(`
  SELECT lml.mission_id, lml.mission_name, lml.mission_hint 
  FROM list_mission lm
     , list_mission_lang lml 
 WHERE lm.project_id = ${project_id}
   AND lm.mission_id = lml.mission_id 
   AND lml.lang = upper('${sourceLang}')
  ORDER BY lml.mission_id;
  `);

  console.log(`${project_id} missionList count : [${missionList.row.length}]`);

  // 에피소드별로 처리한다.
  for await (const mission of missionList.row) {
    // 타이틀, 요약 따로따로 번역
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [mission.mission_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    mission.mission_name = responseTitle.translations[0].translatedText;

    const requestMissionSummary = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [mission.mission_hint],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseMissionSummary] = await translationClient.translateText(
      requestMissionSummary
    );
    mission.mission_hint =
      responseMissionSummary.translations[0].translatedText;

    // console.log(`[${mission.mission_name}]/[${mission.mission_hint}]`);

    // 에피소드 번역 받았으면 입력한다
    const updateResult = await DB(
      `
    INSERT INTO list_mission_lang (mission_id, lang, mission_name, mission_hint)
    VALUES (${mission.mission_id}, UPPER('${targetLang}'), ?, ?) 
    ON DUPLICATE KEY UPDATE mission_name = ?, mission_hint = ?;
    `,
      [
        mission.mission_name,
        mission.mission_hint,
        mission.mission_name,
        mission.mission_hint,
      ]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of for
  console.log(`${project_id} mission translatation end`);

  // ! 코인상품
  const coinShopList = await DB(`
  SELECT ccpd.coin_product_id, ccpd.name 
  FROM com_coin_product ccp
     , com_currency cc 
     , com_coin_product_detail ccpd 
  WHERE cc.currency = ccp.currency
    AND cc.connected_project = ${project_id}
    AND ccpd.coin_product_id = ccp.coin_product_id 
    AND ccpd.lang = upper('${sourceLang}')
  ;
  `);

  console.log(`${project_id} coinShop count : [${coinShopList.row.length}]`);

  for await (const coin of coinShopList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [coin.name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    coin.name = responseTitle.translations[0].translatedText;

    const updateResult = await DB(
      `
    INSERT INTO com_coin_product_detail (coin_product_id, lang, name)
    VALUES (${coin.coin_product_id}, UPPER('${targetLang}'), ?) 
    ON DUPLICATE KEY UPDATE name = ?;
    `,
      [coin.name, coin.name]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 코인샵 상품 for
  console.log(`${project_id} #### coinShop translatation end`);

  // 연결재화 로컬ID 자동번역 //////////////////////////////////////
  const currencyList = await DB(`
  SELECT cl.id, cl.${sourceLang} sourceText
  FROM com_currency cc
     , com_localize cl 
 WHERE cc.connected_project  = ${project_id}
   AND cl.id = cc.local_code
   AND cl.${sourceLang} is not null
   AND cl.${sourceLang} <> ''
;
  `);

  console.log(
    `${project_id} currencyList count : [${currencyList.row.length}]`
  );

  for await (const currency of currencyList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [currency.sourceText],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    currency.sourceText = responseTitle.translations[0].translatedText;

    const updateResult = await DB(
      `
    update com_localize 
       SET ${targetLang} = ?
     WHERE id = ?;
    `,
      [currency.sourceText, currency.id]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 재화for
  console.log(`${project_id} #### currency translatation end`);
  //////////////////// 재화 끝

  // * 사운드 시작
  const soundList = await DB(`
  SELECT lsl.sound_id, lsl.public_name 
  FROM list_sound ls 
     , list_sound_lang lsl 
 WHERE ls.project_id = ${project_id}
   AND ls.is_public > 0
   AND lsl.sound_id = ls.sound_id 
   AND lsl.lang = upper('${sourceLang}')
;
  `);

  console.log(`${project_id} soundList count : [${soundList.row.length}]`);

  for await (const sound of soundList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [sound.public_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    sound.public_name = responseTitle.translations[0].translatedText;

    const updateResult = await DB(
      `
      INSERT INTO list_sound_lang (sound_id, lang, public_name)
      VALUES (${sound.sound_id}, UPPER('${targetLang}'), ?) 
      ON DUPLICATE KEY UPDATE public_name = ?;
      `,
      [sound.public_name, sound.public_name]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 재화for
  console.log(`${project_id} #### Sound translatation end`);
  //////////////// 사운드 종료

  // * 말풍선 시작
  const bubbleList = await DB(`
    SELECT ccb.currency, bubble
    FROM com_currency cc
       , com_currency_bubble ccb 
   WHERE cc.connected_project  = ${project_id}
     AND ccb.currency = cc.currency
     AND ccb.lang  = upper('${sourceLang}')
  ;
    `);

  console.log(`${project_id} bubbleList count : [${bubbleList.row.length}]`);

  for await (const bubble of bubbleList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [bubble.bubble],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    bubble.bubble = responseTitle.translations[0].translatedText;

    const updateResult = await DB(
      `
        INSERT INTO com_currency_bubble (currency, lang, bubble)
        VALUES ('${bubble.currency}', UPPER('${targetLang}'), ?) 
        ON DUPLICATE KEY UPDATE bubble = ?;
        `,
      [bubble.bubble, bubble.bubble]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 재화for
  console.log(`${project_id} #### Bubble translatation end`);
  //////////////// 말풍선 종료

  // * TMI 시작
  const loadingList = await DB(`
    SELECT lld.detail_no, lld.loading_text, lld.loading_id
    FROM list_loading ll
       , list_loading_detail lld 
   WHERE ll.project_id = ${project_id}
     AND lld.lang = upper('${sourceLang}')
     AND lld.loading_id = ll.loading_id;
    `);

  console.log(`${project_id} loadingList count : [${loadingList.row.length}]`);

  // 여기는 예외로 타겟언어를 삭제하고 시작한다
  const deleteLoading = await DB(`
  DELETE FROM list_loading_detail lld WHERE lang = UPPER('${targetLang}') AND loading_id  IN (SELECT z.loading_id FROM list_loading z WHERE z.project_id = ${project_id});
  `);

  for await (const loading of loadingList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [loading.loading_text],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    loading.loading_text = responseTitle.translations[0].translatedText;

    const updateResult = await DB(
      `
        INSERT INTO list_loading_detail (loading_id, lang, loading_text)
        VALUES (${loading.loading_id}, UPPER('${targetLang}'), ?);
        `,
      [loading.loading_text]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of 재화for
  console.log(`${project_id} #### loading translatation end`);
  //////////////// TMI 종료

  // * 일반 일러스트
  const illustList = await DB(`
  SELECT lil.illust_id , lil.lang, lil.public_name, lil.summary
  FROM list_illust_lang lil
     , list_illust li 
 WHERE li.project_id = ${project_id}
   AND lil.illust_id = li.illust_id 
   AND lil.lang = upper('${sourceLang}')
   AND lil.illust_type = 'illust'
   AND li.is_public > 0
 ORDER BY lil.illust_id;
;
  `);

  console.log(`${project_id} illustList count : [${illustList.row.length}]`);

  for await (const illust of illustList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [illust.public_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    illust.public_name = responseTitle.translations[0].translatedText;

    const requestTitle2 = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [illust.summary],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle2] = await translationClient.translateText(
      requestTitle2
    );
    illust.summary = responseTitle2.translations[0].translatedText;

    const updateResult = await DB(
      `
      INSERT INTO list_illust_lang (illust_id, lang, illust_type, public_name, summary)
      VALUES (${illust.illust_id}, UPPER('${targetLang}'), ?, ?, ?) 
      ON DUPLICATE KEY UPDATE public_name = ?, summary = ?;
      `,
      [
        "illust",
        illust.public_name,
        illust.summary,
        illust.public_name,
        illust.summary,
      ]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of illust for
  console.log(`${project_id} #### illust translatation end`);
  //////////////// 일반 일러스트 종료

  // * 라이브 일러스트
  const liveIllustList = await DB(`
  SELECT lil.illust_id , lil.lang, lil.public_name, lil.summary
  FROM list_illust_lang lil
     , list_live_illust li 
 WHERE li.project_id = ${project_id}
   AND lil.illust_id = li.live_illust_id  
   AND lil.lang = upper('${sourceLang}')
   AND li.is_public > 0
   AND lil.illust_type = 'live2d';  
;
  `);

  console.log(
    `${project_id} liveIllustList count : [${liveIllustList.row.length}]`
  );

  for await (const illust of liveIllustList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [illust.public_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    illust.public_name = responseTitle.translations[0].translatedText;

    const requestTitle2 = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [illust.summary],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle2] = await translationClient.translateText(
      requestTitle2
    );
    illust.summary = responseTitle2.translations[0].translatedText;

    const updateResult = await DB(
      `
      INSERT INTO list_illust_lang (illust_id, lang, illust_type, public_name, summary)
      VALUES (${illust.illust_id}, UPPER('${targetLang}'), ?, ?, ?) 
      ON DUPLICATE KEY UPDATE public_name = ?, summary = ?;
      `,
      [
        "live2d",
        illust.public_name,
        illust.summary,
        illust.public_name,
        illust.summary,
      ]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of live illust for
  console.log(`${project_id} #### live illust translatation end`);
  //////////////// 라이브 일러스트 종료

  // * 미니컷
  const minicutList = await DB(`
  SELECT lil.minicut_id, lil.lang, lil.public_name, lil.summary
  FROM list_minicut_lang lil
     , list_minicut li 
 WHERE li.project_id = ${project_id}
   AND lil.minicut_id = li.minicut_id 
   AND lil.lang = upper('${sourceLang}')
   AND li.is_public > 0
   AND lil.minicut_type = 'minicut';
  `);

  console.log(`${project_id} minicutList count : [${minicutList.row.length}]`);

  for await (const minicut of minicutList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [minicut.public_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    minicut.public_name = responseTitle.translations[0].translatedText;

    const requestTitle2 = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [minicut.summary],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle2] = await translationClient.translateText(
      requestTitle2
    );
    minicut.summary = responseTitle2.translations[0].translatedText;

    const updateResult = await DB(
      `
      INSERT INTO list_minicut_lang (minicut_id, lang, minicut_type, public_name, summary)
      VALUES (${minicut.minicut_id}, UPPER('${targetLang}'), ?, ?, ?) 
      ON DUPLICATE KEY UPDATE public_name = ?, summary = ?;
      `,
      [
        "minicut",
        minicut.public_name,
        minicut.summary,
        minicut.public_name,
        minicut.summary,
      ]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of minicut for
  console.log(`${project_id} #### minicut translatation end`);
  //////////////// 미니컷 종료

  // * 미니컷
  const liveObjectList = await DB(`
  SELECT lil.minicut_id, lil.lang, lil.public_name, lil.summary
  FROM list_minicut_lang lil
     , list_live_object li 
 WHERE li.project_id = ${project_id}
   AND lil.minicut_id = li.live_object_id  
   AND lil.lang = upper('${sourceLang}')
   AND li.is_public > 0
   AND lil.minicut_type  = 'live2d';     
  `);

  console.log(
    `${project_id} liveObjectList count : [${liveObjectList.row.length}]`
  );

  for await (const minicut of liveObjectList.row) {
    const requestTitle = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [minicut.public_name],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle] = await translationClient.translateText(requestTitle);
    minicut.public_name = responseTitle.translations[0].translatedText;

    const requestTitle2 = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [minicut.summary],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [responseTitle2] = await translationClient.translateText(
      requestTitle2
    );
    minicut.summary = responseTitle2.translations[0].translatedText;

    const updateResult = await DB(
      `
      INSERT INTO list_minicut_lang (minicut_id, lang, minicut_type, public_name, summary)
      VALUES (${minicut.minicut_id}, UPPER('${targetLang}'), ?, ?, ?) 
      ON DUPLICATE KEY UPDATE public_name = ?, summary = ?;
      `,
      [
        "live2d",
        minicut.public_name,
        minicut.summary,
        minicut.public_name,
        minicut.summary,
      ]
    );

    if (!updateResult.state) {
      logger.error(
        `${JSON.stringify(updateResult.error)} / [${updateResult.query}]`
      );
      return;
    }
  } // ? end of minicut for
  console.log(`${project_id} #### live object translatation end`);
  console.log(`${project_id} #### 프로젝트 텍스트 (용어집없음) 종료!`);
  //////////////// 라이브 오브젝트 종료
}; // ? 종료 프로젝트 데이터

// * 선택지 확정 정보 업데이트
export const updateSelectionConfirm = async (req, res) => {
  const {
    body: { project_id, targetLang },
  } = req;

  // 선택한 작품의 타겟언어 선택지 (정규) 리스트 가져오기
  const result = await DB(`
  SELECT ls.episode_id, ls.script_data, ls.selection_group, ls.selection_no 
  FROM list_script ls 
     , list_episode le 
 WHERE le.project_id = ${project_id}
   AND le.episode_type  = 'chapter'
   AND le.episode_id = ls.episode_id 
   AND ls.lang = upper('${targetLang}')
   AND ls.template = 'selection'
 ORDER BY ls.episode_id, ls.selection_group, ls.selection_no ;
  `);

  for await (const item of result.row) {
    await DB(`
    UPDATE list_selection
      SET ${targetLang} = '${item.script_data}'
     WHERE project_id = ${project_id}
       AND selection_group = ${item.selection_group}
       AND selection_no = ${item.selection_no}
       AND episode_id = ${item.episode_id}
    `);
  }

  // res.status(200).send("done");
};

// * 작품 스크립트 자동 번역 생성하기(용어집 없이 번역하기)
export const translateScriptWithoutGlossary = async (req, res) => {
  // * 프로젝트ID, 번역될 언어 값을 받아서 변형시킨다.
  // * targetLang은 소문자로 받는다.

  const {
    body: { project_id, targetLang },
  } = req;

  let updateQuery = ``;
  const glossary_id = `en_${targetLang}_${project_id}`;
  req.body.glossary_id = glossary_id;

  res.status(200).json(req.body);

  // 작품의 에피소드 리스트 가져온다.
  const episodeList = await DB(`
  SELECT le.episode_id, le.title
  FROM list_episode le
 WHERE le.project_id = ${project_id}
  ORDER BY le.episode_type, le.chapter_number;
  `);

  // * 에피소드 별로 복사를 한다.
  for await (const item of episodeList.row) {
    console.log(`[${item.id}] [${item.title}] start translation`);

    // 영어 스크립트를 타겟 스크립트로 복사한다.
    // 대상 언어의 스크립트를 제거하고 입력한다.
    await DB(`DELETE FROM list_script WHERE episode_id = ${item.episode_id} AND lang = UPPER('${targetLang}');
    INSERT INTO list_script (episode_id
      , scene_id
      , template
      , speaker
      , script_data
      , target_scene_id
      , requisite
      , character_expression
      , emoticon_expression
      , in_effect
      , out_effect
      , bubble_size
      , bubble_pos
      , bubble_hold
      , bubble_reverse
      , emoticon_size
      , voice
      , autoplay_row
      , dev_comment
      , project_id
      , sortkey
      , sound_effect
      , lang
      , control
      , selection_group
      , selection_no) 
      SELECT episode_id
      , scene_id
      , template
      , speaker
      , script_data
      , target_scene_id
      , requisite
      , character_expression
      , emoticon_expression
      , in_effect
      , out_effect
      , bubble_size
      , bubble_pos
      , bubble_hold
      , bubble_reverse
      , emoticon_size
      , voice
      , autoplay_row
      , dev_comment
      , project_id
      , sortkey
      , sound_effect
      , UPPER('${targetLang}')
      , control
      , selection_group
      , selection_no
        FROM list_script a
       WHERE a.episode_id = ${item.episode_id}
         AND a.lang = 'EN'
       ORDER BY a.script_no;
    `);

    // 복사된 타겟 언어 스크립트 정보를 가져온다. (아직 영어다)
    const targetScript = await DB(`
    SELECT ls.script_no, ls.script_data 
    FROM list_script ls
   WHERE ls.project_id = ${project_id}
     AND ls.episode_id = ${item.episode_id}
     AND ls.template IN ('narration', 'feeling', 'talk', 'whisper', 'yell', 'speech', 'monologue', 'message_receive', 'message_self', 'message_partner', 'message_call', 'selection', 'phone_self', 'phone_partner', 'game_message', 'selection_info', 'flow_time')
     AND ls.script_data is not null
     AND ls.script_data <> ''
     AND ls.lang = UPPER('${targetLang}');
    `);

    console.log(`${JSON.stringify(item)} translate start!!!`);
    updateQuery = ``;

    for await (const scriptRow of targetScript.row) {
      // 타겟 언어 스크립트는 최초에 영어라서 이제 번역을 시작한다.
      // console.log(`[${scriptRow.script_data}]`);

      // Construct request
      const request = {
        parent: `projects/${googleProjectID}/locations/us-central1`,
        contents: [scriptRow.script_data],
        mimeType: "text/plain", // mime types: text/plain, text/html
        sourceLanguageCode: "en",
        targetLanguageCode: targetLang,
      };

      // 번역 요청하기 (한줄씩 요청)
      const [response] = await translationClient.translateText(request);
      scriptRow.script_data = response.translations[0].translatedText; // 번역된 언어로 교체하기.
      // console.log(scriptRow.script_data);

      // 중간중간 에러때문에 단일 쿼리 실행으로 변경
      updateQuery = mysql.format(
        `UPDATE list_script SET script_data = ? WHERE script_no = ${scriptRow.script_no};`,
        [scriptRow.script_data]
      );
      const updateResult = await DB(updateQuery);
      if (!updateResult.state) {
        // 드물게 번역이 제대로 안되고 에러나는 케이스 있다.
        logger.error(`${updateResult.error}`);
      }
    } // ? end of targetScript for.

    console.log(`[${item.episode_id}] [${item.title}]`);
  } // ? end of episode for await

  // Run request
  console.log(`Done!`);
  updateSelectionConfirm(req, res);
};

// * 단일 에피소드 자동번역
export const translateSingleEpisodeWithoutGlossary = async (req, res) => {
  const {
    body: { project_id, episode_id, targetLang, sourceLang = "en" },
  } = req;

  logger.info(
    `translateSingleEpisodeWithoutGlossary ${JSON.stringify(req.body)}`
  );

  let updateQuery = ``;

  const episodeInfo = await DB(`
  SELECT led.episode_id, led.title, led.summary 
  FROM list_episode a
     , list_episode_detail led 
 WHERE a.project_id = ${project_id}
   AND led.episode_id = ${episode_id}
   AND led.lang  = UPPER('${sourceLang}')
  `);

  if (!episodeInfo.state || episodeInfo.row.length === 0) {
    res.status(200).send("No episode info");
    return;
  }

  // 아래부터 스크립트 시작
  res
    .status(200)
    .send(`[${episode_id}]/[${targetLang}] episode translate start`);

  // 영어 스크립트를 타겟 스크립트로 복사한다.
  // 대상 언어의 스크립트를 제거하고 입력한다.
  await DB(`DELETE FROM list_script WHERE episode_id = ${episode_id} AND lang = UPPER('${targetLang}');
  INSERT INTO list_script (episode_id
    , scene_id
    , template
    , speaker
    , script_data
    , target_scene_id
    , requisite
    , character_expression
    , emoticon_expression
    , in_effect
    , out_effect
    , bubble_size
    , bubble_pos
    , bubble_hold
    , bubble_reverse
    , emoticon_size
    , voice
    , autoplay_row
    , dev_comment
    , project_id
    , sortkey
    , sound_effect
    , lang
    , control
    , selection_group
    , selection_no) 
    SELECT episode_id
    , scene_id
    , template
    , speaker
    , script_data
    , target_scene_id
    , requisite
    , character_expression
    , emoticon_expression
    , in_effect
    , out_effect
    , bubble_size
    , bubble_pos
    , bubble_hold
    , bubble_reverse
    , emoticon_size
    , voice
    , autoplay_row
    , dev_comment
    , project_id
    , sortkey
    , sound_effect
    , UPPER('${targetLang}')
    , control
    , selection_group
    , selection_no
      FROM list_script a
      WHERE a.episode_id = ${episode_id}
        AND a.lang = UPPER('${sourceLang}')
      ORDER BY a.script_no;
  `);

  // 복사된 타겟 언어 스크립트 정보를 가져온다. (아직 영어다)
  const targetScript = await DB(`
  SELECT ls.script_no, ls.script_data 
  FROM list_script ls
  WHERE ls.project_id = ${project_id}
    AND ls.episode_id = ${episode_id}
    AND ls.template IN ('narration', 'feeling', 'talk', 'whisper', 'yell', 'speech', 'monologue', 'message_receive', 'message_self', 'message_partner', 'message_call', 'selection', 'phone_self', 'phone_partner', 'game_message', 'selection_info', 'flow_time')
    AND ls.script_data is not null
    AND ls.script_data <> ''
    AND ls.lang = UPPER('${targetLang}');
  `);

  console.log(`${episode_id} : translate start!!!`);
  updateQuery = ``;

  for await (const scriptRow of targetScript.row) {
    // 타겟 언어 스크립트는 최초에 영어라서 이제 번역을 시작한다.
    // console.log(`[${scriptRow.script_data}]`);

    // Construct request
    const request = {
      parent: `projects/${googleProjectID}/locations/us-central1`,
      contents: [scriptRow.script_data],
      mimeType: "text/plain", // mime types: text/plain, text/html
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    // 번역 요청하기 (한줄씩 요청)
    const [response] = await translationClient.translateText(request);
    scriptRow.script_data = response.translations[0].translatedText; // 번역된 언어로 교체하기.
    // console.log(scriptRow.script_data);

    // 중간중간 에러때문에 단일 쿼리 실행으로 변경
    updateQuery = mysql.format(
      `UPDATE list_script SET script_data = ? WHERE script_no = ${scriptRow.script_no};`,
      [scriptRow.script_data]
    );
    const updateResult = await DB(updateQuery);
    if (!updateResult.state) {
      // 드물게 번역이 제대로 안되고 에러나는 케이스 있다.
      logger.error(`${updateResult.error}`);
    }
  } // ? end of targetScript for.

  console.log(`[${episode_id}] single translate done`);
}; // ? translateSingleEpisode

// * 빌드 유효성 체크
export const checkBuildValidation = async (userInfo) => {
  //logger.info(`checkBuildValidation start : ${JSON.stringify(userInfo)}`);

  if (userInfo.packageid != "pier.story.cruise") {
    logger.info(`Not checking build : ${JSON.stringify(userInfo)}`);
    return true;
  }

  // * 아이폰은 그냥 true로 진행.
  if (userInfo.os > 0) {
    logger.info(`Not Android build : ${JSON.stringify(userInfo)}`);
    return true;
  }

  if (userInfo.version < 5) {
    logger.info(
      `${userInfo.packageid} : under version 5. ${JSON.stringify(userInfo)}`
    );
    return true; // 5버전 미만은 true
  }

  //
  const tokenMetaResult = await slaveDB(`
  SELECT cbh.hash_no 
    FROM com_build_hash cbh
  WHERE cbh.identifier = '${userInfo.packageid}'
    AND cbh.hash_path LIKE '%${tokenMetaPath}%'
    AND cbh.hash_code = '${userInfo.tokenMeta}'
    AND cbh.build_ver = ${userInfo.version};
  `);

  if (tokenMetaResult.state && tokenMetaResult.row.length > 0) {
    return true; // 매칭.
  } else {
    const token64Result = await slaveDB(`
    SELECT cbh.hash_no 
      FROM com_build_hash cbh
    WHERE cbh.identifier = '${userInfo.packageid}'
      AND cbh.hash_path LIKE '%${token64Path}%'
      AND cbh.hash_code = '${userInfo.token64}'
      AND cbh.build_ver = ${userInfo.version};    
    `);

    if (token64Result.state && token64Result.row.length > 0) {
      return true;
    } else {
      return false;
    }
  }
};
