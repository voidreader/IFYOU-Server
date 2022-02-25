import mysql from "mysql2/promise";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";


//! 현재 능력치 정보 
export const getUserProjectAbilityCurrent = async (req, res) => {

    const {
        body:{
            project_id = -1, 
            userkey,
        } 
    } = req;


    let currencyList = ``; 
    const responseData = {}; 

    // 능력치가 있는 재화 리스트 
    let result = await DB(`
    SELECT a.currency 
    FROM user_property a, com_currency b 
    WHERE a.currency = b.currency
    AND is_ability = 1 
    AND userkey = ?
    AND connected_project = ?;`, [userkey, project_id]);
    if(result.state && result.row.length > 0){
            
        // eslint-disable-next-line no-restricted-syntax
        for(const item of result.row){
            currencyList+=`'${item.currency}',`;
        }
        currencyList = currencyList.slice(0, -1);
    }

    //에피소드 중에 얻은 능력치
    result = await DB(`
    SELECT b.speaker
    , b.ability_name 
    , fn_get_design_info(icon_design_id, 'url') icon_design_url 
    , fn_get_design_info(icon_design_id, 'key') icon_design_key 
    , ifnull(sum(add_value), 0) current_value
    FROM user_story_ability a, com_ability b  
    WHERE a.ability_id = b.ability_id
    AND userkey = ? 
    AND a.project_id = ?
    UNION
    SELECT b.speaker 
    , b.ability_name 
    , fn_get_design_info(icon_design_id, 'url') icon_design_url 
    , fn_get_design_info(icon_design_id, 'key') icon_design_key 
    , ifnull(sum(add_value), 0) current_value
    FROM com_currency_ability a, com_ability b  
    WHERE a.ability_id = b.ability_id
    AND b.project_id = ?
    AND a.currency IN ( ${currencyList} ) 
    GROUP BY speaker, ability_name  
    ORDER BY speaker, ability_name; 
    `, [userkey, project_id, project_id]);
    if(result.state){

        // eslint-disable-next-line no-restricted-syntax
        for(const item of result.row){
            
            if (!Object.prototype.hasOwnProperty.call(responseData, item.speaker)) {
                responseData[item.speaker] = [];    
            }

            responseData[item.speaker].push({
                ability_name: item.ability_name, 
                icon_design_url: item.icon_design_url, 
                icon_design_key: item.icon_design_key, 
                current_value: item.current_value
            });
            
        }
    }


    res.status(200).json(responseData);
    //return responseData;
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

//! 능력치 수치 리셋 
export const resetAbility = async (userInfo) => {

    const {
        userkey, 
        project_id, 
        episode_id, 
    } = userInfo;

    let isMatch = false; 
    
    let deleteQuery = ``;

    let result = await DB(`SELECT episode_id FROM list_episode_id WHERE project_id = ? AND episode_type = 'chapter' ORDER BY le.sortkey, le.episode_id;`, [project_id]);
    if(result.state){

        const currentQuery = `DELETE FROM user_story_ability WHERE userkery = ? AND project_id = ? AND episode_id = ?;`; 
        // eslint-disable-next-line no-restricted-syntax
        for(const item of result.row){
            
            if(episode_id === item.episode_id) isMatch = true;

            if(isMatch){
                deleteQuery += mysql.format(currentQuery, [userkey, project_id, item.episode_id]);
            }
        }
    }

    if(deleteQuery){
        result = await transactionDB(deleteQuery);

        if(!result.state){
            logger.error(`resetAbility Error ${result.error}`);
            return false;
        }
    }

    return true; 
}; 