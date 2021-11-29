import mysql from "mysql2/promise";
import { response } from "express";
import { DB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { 
  respondDB, 
  adminLogInsert,
  respondAdminSuccess,
} from "../respondent";
import routes from "../routes";
import { 
  getLikeConditionQuery,
  getPagenationQuery,
  getInConditionQuery, 
  getEqualConditionQuery, 
  getDateConditionQuery
} from "../com/com";

//! 로그인 조회
export const loginCheck = async (req, res) => {
  const {
    body: { googleId, name, email },
  } = req;

  console.log(`googleId : ${googleId}, name : ${name}, email : ${email}`);

  //! 양 옆 공백 제거
  googleId.trim();
  name.trim();
  email.trim();

  //! 계정 확인
  logger.info(`loginCheck [${googleId}}]`);

  const result = await DB(
    `SELECT user_id FROM admin_account WHERE user_id = ?;`,
    [googleId]
  );

  if (!result.state) {
    logger.error(`loginCheck Error 1 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  if (result.row.length === 0) {
    logger.error("loginCheck Error 2");
    respondDB(res, 80017);
    return;
  }

  //! 권한 확인
  const authResult = await DB(
    `
    SELECT user_id FROM admin_auth 
    WHERE user_id = ? AND master_auth = 0 AND project_auth = 0 AND platform_auth = '' AND management_auth = ''
    ;`,
    [googleId]
  );

  if (!authResult.state) {
    logger.error(`loginCheck Error 3 ${authResult.error}`);
    respondDB(res, 80026, authResult.error);
    return;
  }

  if (authResult.row.length > 0) {
    logger.error("loginCheck Error 4");
    respondDB(res, 80018);
    return;
  }

  //! 회원정보 가져오기
  const infoResult = await DB(
    `
    SELECT ifnull(organization,'') organization
    , master_auth
    , project_auth project_auth_check
    , platform_auth
    , management_auth
    FROM admin_account a, admin_auth b 
    WHERE a.user_id = b.user_id
    AND a.user_id = ?;`,
    [googleId]
  );

  if (!infoResult.state) {
    logger.error(`loginCheck Error 5 ${infoResult.error}`);
    respondDB(res, 80026, infoResult.error);
    return;
  }

  const {
    organization,
    master_auth,
    project_auth_check,
    platform_auth,
    management_auth,
  } = infoResult.row[0];

  console.log("auth check : ", infoResult.row[0]);

  //! 모든 작품 권한 가져오기
  let projectResult = "";
  if (project_auth_check === 1) {
    projectResult = await DB(
      `SELECT project_id, auth_kind FROM admin_project_auth WHERE user_id = ?`,
      [googleId]
    );

    if (!projectResult.state) {
      logger.error(`loginCheck Error 6 ${projectResult.error}`);
      respondDB(res, 80026, projectResult.error);
      return;
    }
  }

  //! 유저 정보
  let userInfo = "";
  if (master_auth === 1) {
    // 마스터 권한 on
    userInfo = {
      user_id: googleId,
      user_name: name,
      email,
      organization,
      master_auth,
    };
  } else {
    // 마스터 권한 off
    userInfo = {
      user_id: googleId,
      user_name: name,
      email,
      organization,
      project_auth: projectResult.row,
      platform_auth,
      management_auth,
    };
  }

  logger.info("Login Success!!");
  res.status(200).json(userInfo);
};

//! 회원가입
export const adminJoin = async (req, res) => {
  const {
    body: { googleId, name, email },
  } = req;

  console.log(`googleId : ${googleId}, name : ${name}, email : ${email}`);

  //! 양 옆 공백 제거
  googleId.trim();
  name.trim();
  email.trim();

  logger.info(`adminJoin [${googleId}}]`);

  //! 계정 및 권한 insert(트랜잭션 처리)
  const joinResult = await transactionDB(
    `
    CALL sp_update_admin_info(?, ?, ?, '');
    INSERT INTO admin_auth(user_id) VALUES(?); 
    `,
    [googleId, name, email, googleId]
  );

  if (!joinResult.state) {
    logger.error(`adminJoin Error ${joinResult.error}`);
    respondDB(res, 80026, joinResult.error);
    return;
  }

  logger.info("Join Success!!");
  res.status(200).json({ message: "가입성공", code: "OK" });
};

//! 작품관리
export const projectSelect = async (req, res) => {
  const {
    body: { user_id, master_auth = 0, lang = "KO" },
  } = req;

  //! 권한있는 작품 쿼리
  let whereQuery = "";
  if (master_auth === 0) {
    whereQuery = ` AND lp.project_id in(SELECT apa.project_id FROM admin_project_auth apa WHERE user_id = ${user_id}) `;
  }

  // 작품리스트는 기본 Default 언어인 한국어로 조회한다.
  const result = await DB(
    `SELECT lp.project_id
        , lp.project_type 
        , detail.lang 
        , detail.title 
        , fn_get_design_info(detail.main_banner_id, 'url') title_image_url
        , fn_get_design_info(detail.main_banner_id, 'key') title_image_key
        , fn_get_design_info(detail.main_thumbnail_id, 'url') main_thumbnail_url
        , fn_get_design_info(detail.main_thumbnail_id, 'key') main_thumbnail_key  
        , detail.summary 
        , detail.writer 
        , lp.sortkey 
        , lp.bubble_set_id
        , lp.favor_use
        , lp.challenge_use
        , lp.is_complete
        , lp.is_credit
        , lp.is_public
        FROM list_project_master lp
        , list_project_detail detail
        WHERE lp.project_type = 0
        AND detail.project_id = lp.project_id
        AND detail.lang = '${lang}'
        ${whereQuery}
        ORDER BY lp.sortkey, lp.project_id;`,
    []
  );

  res.status(200).json(result.row);
};

//! 관리자 로그
export const adminLog = async (req, res) => {
  const {
    body: { user_id, kind, content, values = "" },
  } = req;

  let setContent = `${content}`; 
  if(values){
    const setValues = JSON.stringify(values);   //json 형태인 값들은 String 처리 
    setContent = `${setContent} >>> ${setValues}`;
  }
  
  await DB(
    `INSERT INTO admin_history(user_id, kind, content) VALUES(?, ?, ?);`,
    [user_id, kind, setContent]
  );

  logger.info(`Log Success!!!`);
  res.status(200).json({ message: "로그성공", code: "OK" });
};

//! 관리자 리스트
export const adminList = async (req, res) => {
  logger.info(`adminList`);

  const result = await DB(
    `SELECT aa.user_id userId
    , user_name userName
    , email userEmail
    , ifnull(organization, '') userOrganization
    , master_auth userMaster
    , project_auth userProject
    , platform_auth userPlatform 
    , fn_get_standard_name('auth_kind', platform_auth) userPlatform_name
    , management_auth userManagement
    , fn_get_standard_name('auth_kind', management_auth) userManagement_name
    FROM admin_account aa 
    JOIN admin_auth aa2 
    ON aa.user_id = aa2.user_id
    ORDER BY aa.create_date DESC
    ;`,[]);

  if (!result.state) {
    logger.error(`adminList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
};

//! 관리자 상세
export const adminDetail = async (req, res) => {

  logger.info(`adminDetail`);

  const {
    params: { id },
  } = req;

  //! 관리자 정보
  const infoResult = await DB(
    `SELECT user_name userName
    , email userEmail 
    , ifnull(organization, '') userOrganization
    , master_auth userMaster
    , platform_auth userPlatform
    , fn_get_standard_name('auth_kind', platform_auth) userPlatform_name
    , management_auth userManagement
    , fn_get_standard_name('auth_kind', management_auth) userManagement_name
    FROM admin_account aa 
    JOIN admin_auth aa2 
    ON aa.user_id = aa2.user_id
    WHERE aa.user_id = ?;
    `,
    [id]
  );

  if (!infoResult.state) {
    logger.error(`adminDetail ${infoResult.error}`);
    respondDB(res, 80026, infoResult.error);
    return;
  }

  const { userName, userEmail, userOrganization, userMaster, userPlatform, userPlatform_name, userManagement, userManagement_name } =
    infoResult.row[0];

  const userInfo = {
    userId: id,
    userName,
    userEmail,
    userOrganization,
    userMaster,
    userPlatform,
    userPlatform_name,
    userManagement,
    userManagement_name
  };

  logger.info(`adminDetail done!!!`);
  res.status(200).json(userInfo);
};

//! 관리자 수정
export const adminUpdate = async (req, res) => {
  const {
    params: { id },
    body: { userName = "", userOrganization = "", userMaster = 0, userPlatform = "", userManagement = "" },
  } = req;

  logger.info(`adminUpdate`);


  //! 회원정보와 마스터 권한 수정
  const updateResult = await transactionDB(
    `
    UPDATE admin_account SET user_name = ?, organization = ? WHERE user_id = ?; 
    UPDATE admin_auth SET master_auth = ?, platform_auth = ?, management_auth = ? WHERE user_id = ?; 
    `,
    [userName, userOrganization, id, userMaster, userPlatform, userManagement, id]
  );

  if (!updateResult.state) {
    logger.error(`adminUpdate Error ${updateResult.error}`);
    respondDB(res, 80026, updateResult.error);
    return;
  }

  logger.info(`adminUpdate done!!!`);

  adminLogInsert(req, "admin_update"); 

  res.redirect(routes.adminDetail(id));
};

//! 작품 권한 리스트
export const projectAuthList = async (req, res) => {
  const {
    params: { id },
  } = req;

  logger.info(`projectAuthList`);

  const result = await DB(
    `
    SELECT 
    project_id
    , fn_get_project_name(project_id) project_name
    , auth_kind 
    , fn_get_standard_name('auth_kind', auth_kind) auth_kind_name
    FROM admin_project_auth WHERE user_id = ?
    `,
    [id]
  );

  if (!result.state) {
    logger.error(`projectAuthList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
};

//! 작품 권한 추가/수정
export const projectAuthAllUpdate = async (req, res) => {
  
  logger.info(`projectAuthAllUpdate`);

  const {
    params: { id },
    body: { rows = "" },
  } = req;

  console.log(req.body);
  
  //* 중복 체크 
  if (rows.length > 0) {
    let projectCheck = true;
    const projectArray = [];

    rows.forEach((item) => {

      if (!projectArray.includes(item.project_id)) {
        projectArray.push(item.project_id);
      } else {
        projectCheck = false;
      }
    });

    if (!projectCheck) {
      logger.error("projectAuthAllUpdate Error 1");
      respondDB(res, 80066);
      return;
    }     

    let updateQuery = ``; 
    let index = 0; 
    rows.forEach((item) => {

      const queryParams = [];
  
      const currentQuery = `CALL pier.sp_update_project_auth(?, ?, ?);`; 

      queryParams.push(id); 
      queryParams.push(item.project_id); 
      queryParams.push(item.auth_kind); 

      updateQuery += mysql.format(currentQuery, queryParams);
      if (index === 0) console.log(updateQuery);

      if(!item.project_id || !item.auth_kind){
        projectCheck = false; 
      }
  
      index += 1;

    });

    //console.log(updateQuery);

    if(!projectCheck){
      logger.error(`projectAuthAllUpdate Error 2`);
      respondDB(res, 80067);
      return; 
    }

    const result = await transactionDB(`${updateQuery}
    UPDATE admin_auth SET project_auth = 1 WHERE user_id = ?;
    `, [id]); 

    if(!result.state){
      logger.error("projectAuthAllUpdate Error 3");
      respondDB(res, 80026);
      return;      
    }    

  } 

  logger.info(`projectAuthAllUpdate done!!!`);

  adminLogInsert(req, "project_auth_update");
  res.redirect(routes.projectAuthList(id));
};


//! 작품 권한 삭제
export const projectAuthDelete = async (req, res) => {
  const {
    params: { id },
    body: { project_id },
  } = req;

  logger.info(`projectAuthDelete`);

  //! 유효성 체크
  if (!project_id) {
    logger.error("projectAuthDelete Error 1");
    respondDB(res, 80019);
    return;
  }

  //! 권한 삭제
  const result = await DB(
    `DELETE FROM admin_project_auth WHERE user_id = ? AND project_id = ?;`,
    [id, project_id]
  );

  if (!result.state) {
    logger.error(`projectAuthDelete Error 2 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  //! 작품 권한 유무 체크 및 업데이트
  let projectAuth = 0;
  const projectCheck = await DB(
    `SELECT * FROM admin_project_auth WHERE user_id = ?;`,
    [id]
  );

  if (!projectCheck.state) {
    logger.error(`projectAuthDelete Error 3 ${projectCheck.error}`);
    respondDB(res, 80026, projectCheck.error);
    return;
  }

  if (projectCheck.row.length > 0) {
    projectAuth = 1;
  }

  const updateResult = await DB(
    `UPDATE admin_auth SET project_auth = ? WHERE user_id = ?;`,
    [projectAuth, id]
  );

  if (!updateResult.state) {
    logger.error(`projectAuthDelete Error 4 ${updateResult.error}`);
    respondDB(res, 80026, updateResult.error);
    return;
  }

  logger.info(`projectAuthDelete done!!!`);
  adminLogInsert(req, "project_auth_delete");
  res.redirect(routes.projectAuthList(id));
};

//* 첫화면 이미지 로딩 시작

//! 로딩 이미지 리스트
export const mainLoadingList = async (req, res) => {
  const {
    body: { lang = "KO" },
  } = req;

  logger.info(`mainLoadingList`);

  const result = await DB(
    `SELECT main_loading_id
    , image_id
    , ifnull(fn_get_design_info(image_id, 'key'), '') image_key 
    , ifnull(fn_get_design_info(image_id, 'url'), '') image_url 
    , lang
    , title
    , ifnull(start_date, '') start_date
    , ifnull(end_date, '')  end_date
    , is_public 
    FROM list_main_loading 
    WHERE lang = ?
    ORDER BY main_loading_id desc;`,
    [lang]
  );

  if (!result.state) {
    logger.error(`mainLoadingList Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  res.status(200).json(result.row);
};

//! 로딩 이미지 등록
export const mainLoadingInsert = async (req, res) => {
  const {
    body: {
      image_id = -1,
      lang = "KO",
      title = "",
      start_date,
      end_date,
      is_public = 0,
    },
  } = req;

  logger.info(`mainLoadingInsert`);

  //! 날짜 유효성 체크
  const pattern = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])$/;
  if (!pattern.test(start_date) || !pattern.test(end_date)) {
    logger.error("mainLoadingInsert Error");
    respondDB(res, 80019);
    return;
  }

  const result = await DB(
    `
    INSERT INTO list_main_loading(image_id, lang, title, start_date, end_date, is_public) VALUES(?, ?, ?, ?, ?, ?);
    `,
    [image_id, lang, title, start_date, end_date, is_public]
  );

  if (!result.state) {
    logger.error(`mainLoadingInsert Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  logger.info(`mainLoadingInsert done!!!`);
  respondAdminSuccess(req, res, null, "main_loading_insert", mainLoadingList);

};

//! 로딩 이미지 상세
export const mainLoadingDetail = async (req, res) => {
  const {
    params: { id },
  } = req;

  const infoResult = await DB(
    `
    SELECT image_id
    , ifnull(fn_get_design_info(image_id, 'key'), '') image_key
    , ifnull(fn_get_design_info(image_id, 'url'), '') image_url 
    , lang
    , title 
    , ifnull(start_date, '') start_date
    , ifnull(end_date, '') end_date
    , is_public 
    FROM list_main_loading 
    WHERE main_loading_id = ?;
    `,
    [id]
  );

  logger.info(`mainLoadingDetail`);

  if (!infoResult.state) {
    logger.error(`mainLoadingDetail Error ${infoResult.error}`);
    respondDB(res, 80026, infoResult.error);
    return;
  }

  logger.info(`mainLoadingDetail done!!!`);
  res.status(200).json(infoResult.row);
};

//! 로딩 이미지 수정
export const mainLoadingUpdate = async (req, res) => {
  const {
    params: { id },
    body: {
      image_id = -1,
      lang = "KO",
      title = "",
      start_date,
      end_date,
      is_public = 0,
    },
  } = req;

  logger.info(`mainLoadingUpdate`);

  //! 날짜 유효성 체크
  const pattern = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])$/;
  if (!pattern.test(start_date) || !pattern.test(end_date)) {
    logger.error("mainLoadingInsert Error");
    respondDB(res, 80019);
    return;
  }

  const result = await DB(
    `
    UPDATE list_main_loading SET image_id = ?
    , lang = ?
    , title = ?
    , start_date = ?
    , end_date = ? 
    , is_public = ? 
    WHERE main_loading_id = ?;
    `,
    [image_id, lang, title, start_date, end_date, is_public, id]
  );

  if (!result.state) {
    logger.error(`mainLoadingUpdate Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  logger.info(`mainLoadingUpdate done!!!`);

  respondAdminSuccess(req, res, null, "main_loading_update", mainLoadingList);

};

//! 로딩 이미지 삭제
export const mainLoadingDelete = async (req, res) => {
  const {
    params: { id },
    body: { lang = "KO" },
  } = req;

  logger.info(`mainLoadingDelete`);

  const result = await DB(
    `DELETE FROM list_main_loading WHERE main_loading_id = ?;`,
    [id]
  );

  if (!result.state) {
    logger.error(`mainLoadingDelete Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  logger.info(`mainLoadingDelete done!!!`);
  respondAdminSuccess(req, res, null, "main_loading_delete", mainLoadingList);
};

//* 첫화면 이미지 로딩 끝

//* 다국어 로컬 라이징 시작

//! 다국어 리스트
export const comLocallizingList = async (req, res) => {
  logger.info(`locallizingList`);

  const result = await DB(
    `
    SELECT id, KO, EN, JA, ZH, SC FROM com_localize WHERE id > 0;`,
    []
  );

  res.status(200).json(result.row);
};

//! 다국어 수정
export const comLocallizingUpdate = async (req, res) => {
  const {
    body: { rows },
  } = req;

  logger.info(`comLocallizingUpdate ${rows.length}`);
  if (rows.length > 0) console.log(rows[0]);

  let insertQuery = ``;
  let index = 0;
  let validCheck = true;
  const idArrays = [];

  //! id 중복 체크
  rows.forEach((i) => {
    if (idArrays.includes(i.id)) {
      validCheck = false;
    } else {
      idArrays.push(i.id);
    }
  });

  if (!validCheck) {
    logger.error(`comLocallizingUpdate Update error 1`);
    respondDB(res, 80021);
    return;
  }

  // 한 행씩 처리
  rows.forEach((item) => {
    const queryParams = [];

    let currentQuery = ``;

    currentQuery = `CALL sp_update_com_localize(?, ?, ?, ?, ?, ?);`;

    queryParams.push(item.id);
    queryParams.push(item.KO);
    queryParams.push(item.EN);
    queryParams.push(item.JA);
    queryParams.push(item.ZH);
    queryParams.push(item.SC);

    insertQuery += mysql.format(currentQuery, queryParams);
    if (index === 0) console.log(insertQuery);

    index += 1;
  });

  //! 삽입, 수정 동시 진행
  const result = await transactionDB(
    `
    ${insertQuery}
    UPDATE com_server SET local_ver = local_ver + 1 WHERE server_no = 1; 
    `,
    []
  );

  if (!result.state) {
    logger.error(`comLocallizingUpdate Update error 2 (${result.error})`);
    respondDB(res, 80026, result.error);
    return;
  }

  logger.info(`comLocallizingUpdate Update done!!`);
  adminLogInsert(req, "locallizing_update_all");
  res.redirect(routes.comLocallizingList("admin"));

};

//* 다국어 로컬 라이징 끝

//* 메일 시작

export const getReservationList = async (searchInfo) => {
  const {
    body: {
      search_type = "",
      search_word = null,
      search_mail_type = "",
      search_send_to = "", 
      search_start_date = "",
      search_end_date = "",
      search_currency = "",
      search_state = "", 
      page = -1,
      page_size = 20
    },
  } = searchInfo;

  let whereQuery = ``;
  let pageQuery = ``;


  // 메일 NO, UID 검색 
  if(search_type && search_word){
    if(search_type === "uid"){
      whereQuery += getInConditionQuery('reservation_no', `SELECT DISTINCT reservation_no FROM user_mail WHERE userkey IN (${search_word}) AND reservation_no <> -1`, false);
    }else{
      whereQuery += getInConditionQuery(search_type, search_word, false);
    }  
  }

  // 메일 타입 검색 
  if(search_mail_type){
    whereQuery += getEqualConditionQuery("mail_type", search_mail_type, true, false);
  }

  // 받을 대상 검색 
  if(search_send_to){
    if(search_send_to === "all"){
      whereQuery += getEqualConditionQuery("send_to", "-1", true, false);
    }else if(search_send_to === "some"){
      whereQuery += getEqualConditionQuery("send_to", "-1", false, false);
    }
  }

  // 기간 검색 
  if(search_start_date && search_end_date){
    whereQuery += getDateConditionQuery("send_date", search_start_date, search_end_date, false);
  }

  // 재화 검색 
  if(search_currency){
    let OrQuery = ``; 
    if(search_currency.includes("gem")){
      OrQuery += getLikeConditionQuery("currency", 'gem', false, false, OrQuery.length > 0 ? 'OR' : ' AND (');
    } 

    if(search_currency.includes("coin")){
      OrQuery += getLikeConditionQuery("currency", 'coin', false, false, OrQuery.length > 0 ? 'OR' : ' AND (');
    } 

    if(search_currency.includes("OneTime")){
      OrQuery += getLikeConditionQuery("currency", 'OneTime', false, false, OrQuery.length > 0 ? 'OR' : ' AND (');
    } 
    OrQuery += `)`; 

    whereQuery += OrQuery; 
  }

  if(search_state){
    whereQuery += getEqualConditionQuery("is_complete", search_state, true, false);
  }

  // 페이징 처리
  pageQuery = getPagenationQuery(page, page_size); 

  console.log(whereQuery);
  //console.log(pageQuery);

  const result = await DB(
    `SELECT reservation_no
    , mail_type
    , fn_get_standard_name('mail_type', mail_type) mail_name 
    , content
    , send_to
    , DATE_FORMAT(send_date, '%Y-%m-%d %T') send_date
    , currency
    , fn_get_currency_info(currency, 'name') currency_name
    , is_complete
    , fn_get_mail_cnt(reservation_no, 'N') unread_cnt 
    , fn_get_mail_cnt(reservation_no, 'Y') receive_cnt
    FROM list_reservation 
    WHERE reservation_no > 0
    ${whereQuery}
    ORDER BY reservation_no desc
    ${pageQuery};`,
    []
  );

  return result.row;
};

//! 메일 수신 목록
export const getReceiveList = async (reservation_no) =>{

  const result = await DB(`  
  SELECT fn_get_userkey_info(userkey) userkey
  , DATE_FORMAT(receive_date, '%Y-%m-%d %T') receive_date
  , CASE WHEN is_receive = 0 THEN "X" 
  ELSE "O" 
  END state 
  FROM user_mail 
  WHERE reservation_no = ?;`,[reservation_no]);

  return result.row;

};

//! 메일 리스트
export const mailReservationList = async (req, res) => {
  logger.info(`mailReservationList`);

  console.log(req.body);
  const result = await getReservationList(req);
  res.status(200).json(result);
};

//! 메일 상세
export const mailReservationDetail = async (req, res) => {
  
  logger.info(`mailReservationDetail`);

  const {
    params: { id },
  } = req;

  const responseData = {}; 
  const result = await DB(
    `SELECT reservation_no
    , content
    , mail_type
    , fn_get_standard_name('mail_type', mail_type) mail_name   
    , send_to
    , DATE_FORMAT(send_date, '%Y-%m-%d %T') send_date
    , DATE_FORMAT(expire_date, '%Y-%m-%d %T') expire_date
    , currency
    , fn_get_currency_info(currency, 'name') currency_name
    , quantity
    , is_complete
    , fn_get_mail_cnt(reservation_no, 'N') unread_cnt 
    , fn_get_mail_cnt(reservation_no, 'Y') receive_cnt
    FROM list_reservation WHERE reservation_no = ?;`,
    [id]
  );
  responseData.mailDetail = result.row;
  responseData.receivedUser = await getReceiveList(id);

  res.status(200).json(responseData);
};

//! 수신자 목록(엑셀)
export const mailReceiveList = async (req, res) => {
  logger.info(`mailReceiveList`);

  const result = await getReceiveList(req.params.id); 

  res.status(200).json(result);
};

//! 메일 등록
export const mailReservationInsert = async (req, res) => {
  logger.info(`mailReservationInsert`);

  const {
    body: {
      send_to = "",
      content = "",
      mail_type = "",
      currency = "",
      quantity = 0,
      send_date = "",
      expire_date = "",
      user_id = "",
    },
  } = req;

  console.log(req.body);

  //! 유효성 체크
  if (!send_to || !mail_type || !send_date || !expire_date || !user_id) {
    logger.error(`mailInsert Error 1`);
    respondDB(res, 80019);
    return;
  }

  //! mail_type에 따라 currency, quantity 유효성 체크하려고 했으나, 모든 메일이 currency, quantity가 필수이므로 모두 체크 변경
  if (!currency || quantity === 0) {
    logger.error("mailInsert Error 2");
    respondDB(res, 80042);
    return;
  }

  const result = await DB(
    `INSERT INTO list_reservation(send_to, content, mail_type, currency, quantity, send_date, expire_date, admin_id)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      send_to,
      content,
      mail_type,
      currency,
      quantity,
      send_date,
      expire_date,
      user_id
    ]
  );

  if (!result.state) {
    logger.error(`mailInsert Error 3 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "reservation_insert", mailReservationList);

};

//! 메일 수정
export const mailReservationUpdate = async (req, res) => {
  logger.info(`mailReservationUpdate`);

  const {
    params: { id },
    body: {
      send_to = "",
      content = "",
      mail_type = "",
      currency = "",
      quantity = 0,
      send_date = "",
      expire_date = "",
      is_complete = 0,
      user_id = "",
    },
  } = req;

  console.log(req.body);

  //! 유효성 체크
  if (!send_to || !mail_type || !send_date || !expire_date || !user_id) {
    logger.error(`mailReservationUpdate Error 1`);
    respondDB(res, 80019);
    return;
  }

  if (!currency || quantity === 0) {
    logger.error("mailInsert Error 2");
    respondDB(res, 80042);
    return;
  }

  //! 메일 전송 확인
  if (is_complete === 2) {
    logger.error("mailReservationUpdate Error 3");
    respondDB(res, 80043);
    return;
  }

  const result = await DB(
    `UPDATE list_reservation 
    SET send_to = ?
    , content = ?
    , mail_type = ?
    , currency = ? 
    , quantity = ? 
    , send_date = ? 
    , expire_date = ? 
    , admin_id = ?
    WHERE reservation_no = ?;`,
    [
      send_to,
      content,
      mail_type,
      currency,
      quantity,
      send_date,
      expire_date,
      user_id,
      id,
    ]
  );

  if (!result.state) {
    logger.error(`mailReservationUpdate Error 4 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "reservation_update", mailReservationList);

};

//! 메일 삭제
export const mailReservationDelete = async (req, res) => {
  logger.info(`mailReservationDelete`);

  const {
    params: { id },
    body: { is_complete = 0 },
  } = req;

  //! 메일 전송 확인
  if (is_complete === 2) {
    logger.error(`mailReservationDelete Error 1`);
    respondDB(res, 80044);
    return;
  }

  const result = await DB(
    `DELETE FROM list_reservation WHERE reservation_no = ?;`,
    [id]
  );

  if (!result.state) {
    logger.error(`mailReservationDelete Error 2 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  respondAdminSuccess(req, res, null, "reservation_delete", mailReservationList);

};

//! 메일 취소
export const mailReservationCancel = async (req, res) => {
  logger.info(`mailReservationCancel`);

  const {
    params: { id },
    body: { user_id },
  } = req;

  const responseData = {};

  //! 수신 유저
  const readUserkeys = await DB(
    `SELECT userkey FROM user_mail WHERE reservation_no = ? AND is_receive = 1;`,
    [id]
  );
  if (!readUserkeys.state) {
    logger.error(`mailReservationCancel Error 1 ${readUserkeys.error}`);
    respondDB(res, 80026, readUserkeys.error);
    return;
  }

  const userkeyArray = [];
  if (readUserkeys.row.length > 0) {
    readUserkeys.row.forEach((item) => {
      userkeyArray.push(item.userkey);
    });
  }
  responseData.cancelMail = {
    //reservation_no, 메일 읽은 유저키를 같이 보냄
    cancelId: id,
    readArray: userkeyArray,
  };

  //! 수신❌메일 삭제 및 상태 업데이트
  const result = await transactionDB(
    `
  DELETE FROM user_mail WHERE reservation_no = ? AND is_receive = 0;
  UPDATE list_reservation SET is_complete = 3, admin_id = ? WHERE reservation_no = ?;
  `,
    [id, user_id, id]
  );

  if (!result.state) {
    logger.error(`mailReservationCancel Error 2 ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  //! 메일 리스트 재조회
  responseData.reservations = await getReservationList(req);
  adminLogInsert(req, "reservation_cancel");
  res.status(200).json(responseData);
};

//* 메일 끝

// *
// * 공지사항과 이벤트
// *
// 어드민에서 사용하는 공지사항 및 이벤트 리스트
export const getAdminNoticeList = async (req, res) => {
  const result = await DB(
    `
    SELECT cn.notice_no
         , cn.notice_type
         , cn.notice_name
         , cn.sortkey
         , cn.is_public
         , date_format(cn.start_date, '%Y-%m-%d %T') start_date
         , date_format(cn.end_date, '%Y-%m-%d %T') end_date
    FROM com_notice cn
    WHERE notice_no >= 0
    ORDER BY start_date DESC, is_public DESC, sortkey;
    `,
    []
  );

  res.status(200).json(result.row);
};

// 어드민에서 사용하는 공지사항 상세 정보
export const getAdminNoticeDetail = async (req, res) => {
  console.log({ ...req.body });

  const {
    body: { notice_no },
  } = req;

  const result = await DB(
    `
    SELECT cnd.*
    FROM com_notice_detail cnd
        , list_standard ls 
    WHERE notice_no = ?
    AND ls.standard_class = 'lang'
    AND ls.code = cnd.lang
    ORDER BY ls.sortkey
    ;    
    `,
    [notice_no]
  );

  res.status(200).json(result.row);
};

// 공지사항 및 이벤트 마스터 업데이트 or 입력
export const updateOrInsertNoticeMaster = async (req, res) => {
  // 메소드 두개 만들기 귀찮으니까 하나로 만들어야지!!
  // console.log(req.body);
  const {
    body: {
      notice_no = -1,
      notice_type,
      notice_name,
      sortkey,
      is_public,
      start_date = null,
      end_date,
    },
  } = req;

  const result = await DB(`CALL sp_update_notice_master(?,?,?,?,?,?,?);`, [
    notice_no,
    notice_type,
    notice_name,
    sortkey,
    is_public,
    start_date,
    end_date,
  ]);

  if (!result.state) {
    logger.error(`updateOrInsertNoticeMaster Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }


  respondAdminSuccess(req, res, null, "notice_update", getAdminNoticeList);

};

// 공지사항 및 이벤트 디테일 업데이트 or 입력
export const updateOrInsertNoticeDetail = async (req, res) => {
  const {
    body: { rows },
  } = req;

  let notice_no = 0;
  let detail_design_id = 0;
  // 배열로 날아온다.
  console.log(rows);

  const singleQuery = `CALL sp_update_notice_detail_new(?, ?, ?, ?, ?, ?, ?);`;
  let finalQuery = ``;
  rows.forEach((item) => {
    notice_no = item.notice_no;

    if(item.detail_design_id === 0 || !item.detail_design_id) detail_design_id = -1;
    else detail_design_id = item.detail_design_id;

    finalQuery += mysql.format(singleQuery, [
      item.notice_no,
      item.lang,
      item.title,
      item.contents,
      item.design_id,
      item.url_link,
      detail_design_id,
    ]);
  });


  const result = await DB(finalQuery, []);

  if (!result.state) {
    logger.error(`updateOrInsertNoticeDetail Error ${result.error}`);
    respondDB(res, 80026, result.error);
    return;
  }

  req.body.notice_no = notice_no;

  respondAdminSuccess(req, res, null, "notice_detail_update", getAdminNoticeDetail);

};
