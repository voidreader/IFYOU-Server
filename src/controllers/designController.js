import mysql from "mysql2/promise";
import { DB, slaveDB } from "../mysqldb";

// 프리패스 뱃지 정보
export const getProjectFreepassBadge = async ({ project_id }) => {
  const result = await slaveDB(`
  SELECT fn_get_design_info(a.resource_image_id, 'url') image_url
  , fn_get_design_info(a.resource_image_id, 'key') image_key
FROM com_currency a
WHERE a.connected_project = ${project_id}
AND a.currency_type = 'badge'
AND a.currency LIKE '%premiumpass%';
  `);

  if (result.row.length === 0) return { image_url: "", image_key: "" };
  return result.row[0];
};

// ? 프로젝트 BGM 배너 정보
export const getProjectBgmBannerInfo = async ({ project_id }) => {
  const result = await slaveDB(
    `
  SELECT ld.image_url, ld.image_key 
  FROM list_design ld
 WHERE ld.project_id = ?
   AND ld.design_type ='bgm_banner'
ORDER BY design_id 
LIMIT 1;
  `,
    [project_id]
  );

  if (result.row.length === 0) return { image_url: "", image_key: "" };

  return result.row[0];
};

// * 클라이언트에서 사용하는 공용 모델 리스트
// * 클라이언트에서 사용합니다!!!
export const getComModelMainBannerClientList = async () => {
  const master = await DB(
    `SELECT a.* FROM com_model a WHERE a.model_type = 'main_banner'`
  );

  const detail = await DB(`
  SELECT b.*
    FROM com_model a
      , com_model_detail b
  WHERE a.model_type = 'main_banner'
    AND b.model_id = a.model_id;
   `);

  const models = {};
  const masterArray = master.row;
  const detailArray = detail.row;

  masterArray.forEach((item) => {
    const key = item.model_id.toString();

    /// 키를 id로 잡아서 넣어준다.
    if (!Object.prototype.hasOwnProperty.call(models, key)) {
      models[key] = [];
    }

    detailArray.forEach((motion) => {
      if (motion.model_id === item.model_id) models[key].push(motion); // 배열에 추가해주기.
    });
  });

  return models;
};
