import { DB, slaveDB } from "../mysqldb";
import { logger } from "../logger";
import {
  respond,
  respondRedirect,
  respondDB,
  respondFail,
  respondSuccess,
} from "../respondent";

export const initializeClient = async (req, res) => {
  const {
    body: { package_id, os_type, app_store, client_version },
  } = req;

  // console.log(req.body);

  // 패키지 마스터 체크
  const packageMasterQueryResult = await slaveDB(
    `SELECT a.package_id FROM com_package_master a WHERE a.package_id = '${package_id}';`
  );

  // 없는 경우에 대한 실패 메세지 처리
  if (
    !packageMasterQueryResult.state ||
    packageMasterQueryResult.row.length <= 0
  ) {
    respondFail(res, {}, "No package info", "");
    return;
  }

  const packageMaster = packageMasterQueryResult.row[0];
  console.log(packageMaster);

  // 클라이언트 버전 체크
  const clientQueryResult = await slaveDB(`
  SELECT a.package_id 
     , a.os_type 
     , a.client_version 
     , a.client_status 
     , ifnull(a.custom_url, '') custom_url
     , a.app_store 
     , ifnull(a.memo, '') memo 
     , m.test_server_url 
     , m.review_server_url 
     , m.live_server_url 
     , m.project_id 
     , ifnull(m.install_url, '') install_url 
  FROM com_package_client a
     , com_package_master m
 WHERE m.package_id = '${package_id}'
   AND a.package_id = m.package_id 
   AND a.os_type = '${os_type}'
   AND a.client_version = '${client_version}'
   AND a.app_store  = '${app_store}';
  `);

  // 쿼리 결과가 없는 경우에 대한 처리
  if (!clientQueryResult.state || clientQueryResult.row.length <= 0) {
    respondFail(res, {}, "No Client info", "");
    return;
  }

  const packageClient = clientQueryResult.row[0];

  // custom_url 사용시,
  if (packageClient.custom_url !== "") {
    packageClient.url = packageClient.custom_url;
  } else {
    // 상태에 따른 url 설정
    // eslint-disable-next-line no-lonely-if
    if (packageClient.client_status === "test") {
      packageClient.url = packageClient.test_server_url;
    } else if (packageClient.client_status === "review") {
      packageClient.url = packageClient.review_server_url;
    } else {
      packageClient.url = packageClient.live_server_url;
    }
  }

  console.log(packageClient);

  respondSuccess(res, packageClient);
}; // ? initializeClient
