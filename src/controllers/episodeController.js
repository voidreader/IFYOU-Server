import mysql from "mysql2/promise";
import { DB, transactionDB } from "../mysqldb";

// 최초 에피소드가 등록된 갤러리 이미지 리스트 가져오기
export const getConnectedGalleryImages = async (project_id) => {
  const result = await DB(
    `
  SELECT z.*
    FROM (
  SELECT 'illust' gallery_type
      , a.illust_id
      , a.image_name 
      , a.appear_episode
    FROM list_illust a
  WHERE a.project_id = ${project_id}
    AND a.appear_episode > -1
  UNION ALL   
  SELECT 'live_illust' gallery_type
      , a.live_illust_id 
      , a.live_illust_name 
      , a.appear_episode
    FROM list_live_illust a
  WHERE a.project_id = ${project_id}
    AND a.appear_episode > -1
  UNION ALL  
  SELECT 'minicut' gallery_type
      , a.minicut_id 
      , a.image_name 
      , a.appear_episode
    FROM list_minicut a
  WHERE a.project_id = ${project_id}
    AND a.appear_episode > -1
  UNION ALL
  SELECT 'live_object' gallery_type
      , a.live_object_id 
      , a.live_object_name 
      , a.appear_episode
    FROM list_live_object a
  WHERE a.project_id = ${project_id}
    AND a.appear_episode > -1
  ) z;
  `,
    []
  );

  return result.row;
};
