import mysql from "mysql2/promise";
import routes from "../routes";
import { DB, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { 
    respondDB,
    adminLogInsert, 
} from "../respondent";

//! 네임태그 조회
export const postSelectNametag = async (req, res) => {

    const { params : {id}} = req;
    
    logger.info(`postSelectNametag [${id}}]`);
    
    const result = await DB(`
    SELECT speaker 
           , main_color
           , sub_color
           , voice_banner_id
           , ifnull(fn_get_design_info(voice_banner_id, 'name'), '') voice_banner_name   
           , KO
           , EN
           , JA
           , ZH
           , SC 
    FROM list_nametag WHERE project_id = ?;`, [id]);

    res.status(200).json(result.row);
}; 

//! 네임태그 편집
export const postUpdateNametag =  async (req, res) => {
    
    const { 
        params : {id},
        body : {rows}
    } = req;
    
    logger.info(`postUpdateNametag ${rows.length}`);
    if (rows.length > 0) console.log(rows[0]);

    let insertQuery = ``;
    let index = 0;
    let speakerCheck = true; //화자 공백 체크 

    // 한 행씩 처리
    rows.forEach((item) => {

      //! 화자가 공백일 경우 체크 
      if(item.speaker === "") {
        speakerCheck = false; 
        return;
      }  

      // 일부 컬럼 초기화 처리
      if (!item.main_color) item.main_color = "FFFFFFFF";
      if (!item.sub_color) item.sub_color = "FFFFFFFF";
      if (!item.voice_banner_id) item.voice_banner_id = -1;
      if (!item.KO) item.KO = "";
      if (!item.EN) item.EN = "";
      if (!item.JA) item.JA = "";
      if (!item.ZH) item.ZH = "";
      if (!item.SC) item.SC = "";
  
      const queryParams = [];
  
      const currentQuery = `
      INSERT INTO pier.list_nametag 
      (project_id, speaker, main_color, sub_color, voice_banner_id, KO, EN, JA, ZH, SC)
      VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
  
      queryParams.push(id); 
      queryParams.push(item.speaker); 
      queryParams.push(item.main_color); 
      queryParams.push(item.sub_color);
      queryParams.push(item.voice_banner_id);
      queryParams.push(item.KO);
      queryParams.push(item.EN);
      queryParams.push(item.JA);
      queryParams.push(item.ZH);
      queryParams.push(item.SC);
      
  
      insertQuery += mysql.format(currentQuery, queryParams);
      if (index === 0) console.log(insertQuery);
  
      index += 1;
    });

    //! 공백인 화자만 빼고 업데이트가 진행되어 원본 데이터 보존용으로 막아놓음 
    if(!speakerCheck){
        logger.error(`postUpdateNametag Error ${id} 화자가 입력되지 않았습니다.`);
        respondDB(res, 80027, id);
        return; 
    }

    //! 삭제 및 삽입 동시 진행  
    const result = await transactionDB(`
    DELETE FROM list_nametag WHERE project_id = ?;
    ${insertQuery}
    `,[id]); 

    if(!result.state){
        logger.error(`postUpdateNametag Error ${result.error}`);
        respondDB(res, 80026, id);
        return; 
    }

    logger.info(`postUpdateNametag done!!`);
    
    adminLogInsert(req, "nametag_update_all");
    res.redirect(routes.nametagSelect(id));

};  