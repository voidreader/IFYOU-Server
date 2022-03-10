import mysql from "mysql2/promise";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

//! 현재 능력치 정보 
export const getUserProjectAbilityCurrent = async (userInfo) => {

    const {
        project_id = -1, 
        userkey,
    } = userInfo;

    const responseData = {};
    const abilityArr = [];

    //에피소드에서 얻은 능력치
    let result = await DB(`
    SELECT b.speaker
    , b.ability_name 
    , fn_get_design_info(icon_design_id, 'url') icon_design_url 
    , fn_get_design_info(icon_design_id, 'key') icon_design_key 
    , fn_get_design_info(emoticon_image_id, 'url') emoticon_design_url 
    , fn_get_design_info(emoticon_image_id, 'key') emoticon_design_key 
    , ifnull(sum(add_value), 0) current_value
    FROM user_story_ability a, com_ability b
    WHERE a.ability_id = b.ability_id
    AND userkey = ? 
    AND a.project_id = ?
    GROUP BY speaker, ability_name  
    ORDER BY speaker, ability_name;
    `, [userkey, project_id]);
    if(result.state){
        // eslint-disable-next-line no-restricted-syntax
        for(const item of result.row){    
            abilityArr.push(item); //배열에 추가
        }
    }

    //재화에서 얻은 능력치 
    result = await DB(`
    SELECT d.speaker 
    , d.ability_name 
    , fn_get_design_info(d.icon_design_id, 'url') icon_design_url 
    , fn_get_design_info(d.icon_design_id, 'key') icon_design_key 
    , fn_get_design_info(emoticon_image_id, 'url') emoticon_design_url 
    , fn_get_design_info(emoticon_image_id, 'key') emoticon_design_key 
    , ifnull(sum(add_value), 0) current_value
    FROM user_property a, com_currency b, com_currency_ability c, com_ability d   
    WHERE a.currency = b.currency
    AND b.currency = c.currency   
    AND c.ability_id = d.ability_id
    AND b.connected_project = ?
    AND a.userkey = ? 
    AND is_ability = 1 
    GROUP BY speaker, ability_name  
    ORDER BY speaker, ability_name;`, [project_id, userkey]); 
    if(result.state){
        // eslint-disable-next-line no-restricted-syntax
        for(const item of result.row){           
            let abilityAddCheck = true; //배열에 추가할지 체크 

            //반복문으로 돌려 캐릭터의 능력치가 이미 있으면 합산 처리  
            for(let i = 0; i < abilityArr.length; i++){
                if(abilityArr[i].speaker === item.speaker && abilityArr[i].ability_name === item.ability_name){ 
                    abilityArr[i].current_value = parseInt(abilityArr[i].current_value) + parseInt(item.current_value); 
                    abilityAddCheck = false;
                    break; 
                } 
            }

            if(abilityAddCheck) abilityArr.push(item);  //아무것도 없으면 새 캐릭터/능력치 추가 
        }
    }

    //마지막에 캐릭터별 능력치로 정리 
    // eslint-disable-next-line no-restricted-syntax
    for(const item of abilityArr){
        if (!Object.prototype.hasOwnProperty.call(responseData, item.speaker)) {
            responseData[item.speaker] = [];    
        }

        responseData[item.speaker].push({
            ability_name: item.ability_name, 
            icon_design_url: item.icon_design_url, 
            icon_design_key: item.icon_design_key, 
            current_value: parseInt(item.current_value)
        });        
    }

    return responseData;
};

//! 능력치 수치 추가 
export const addUserAbility = async (req, res) => {
    const { 
        body: {
            userkey = -1, 
            project_id = -1, 
            episode_id = -1, 
            scene_id = -1, 
            speaker = "", 
            ability = "",
            add_value = 0
        }
    } = req;

    let result = await DB(`SELECT ability_id FROM com_ability WHERE project_id = ? AND speaker = ? AND ability_name = ?;`, [project_id, speaker, ability]);
    if(result.state && result.row.length > 0){
        
        const { ability_id } = result.row[0];

        result = await DB(`INSERT INTO user_story_ability (
            userkey
            , project_id
            , episode_id
            , scene_id 
            , ability_id 
            , add_value ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?);`, [userkey, project_id, episode_id, scene_id, ability_id, add_value]);

        if(!result.state){
            logger.error(`addUserAbility Error ${result.error}`);
            respondDB(res, 80026, result.error);
            return;
        }
    }

    //합산값 리턴 
    result = await getUserProjectAbilityCurrent({project_id, userkey});   

    res.status(200).json(result);
};

//! 능력치 수치 리셋 쿼리
export const createQueryResetAbility = async (userInfo) => {
    
    const {
        userkey, 
        project_id, 
        episode_id,
    } = userInfo;

    let isMatch = false; 
    let deleteQuery = ``;

    //에피소드 조회
    const result = await DB(`SELECT episode_id FROM list_episode WHERE project_id = ? AND episode_type = 'chapter' ORDER BY sortkey, episode_id;`, [project_id]);
    if(result.state && result.row.length > 0){

        const currentQuery = `DELETE FROM user_story_ability WHERE userkey = ? AND project_id = ? AND episode_id = ?;`; 
        // eslint-disable-next-line no-restricted-syntax
        for(const item of result.row){
            
            if(parseInt(episode_id) === item.episode_id) isMatch = true;  //해당 에피소드부터 리셋 처리

            if(isMatch){
                deleteQuery += mysql.format(currentQuery, [userkey, project_id, item.episode_id]);
            }
        }
    }
   
    return deleteQuery;

};

//! 처음부터 능력치 리셋 
export const firstResetAbility = async (req, res) => {

    const {
        body:{
            userkey, 
            project_id, 
            episode_id,
        } 
    } = req;

    const resetQuery = await createQueryResetAbility ({userkey, project_id, episode_id});
    let result; 

    if(resetQuery){
        result = await transactionDB(resetQuery); 
        if(!result.state){
            logger.error(`firstResetAbility Error ${result.error}`);
            respondDB(res, 80026, result.error);
            return;
        }
    }

    //현재 능력치 정보 
    result = await getUserProjectAbilityCurrent({project_id, userkey});   
    res.status(200).json(result);
}; 