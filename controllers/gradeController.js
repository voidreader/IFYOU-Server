import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

//! 등급 정산 
export const calculateGradeMonth = async (req, res) =>{

    logger.info(`calculateGradeMonth`);

    let result;
    let currentQuery = ``; 
    let updateQuery = ``;

    //기간 계산
    result = await DB(`
    SELECT 
    , DATE_FORMAT(start_date, '%Y-%m-%d %T') start_date
    , DATE_FORMAT(end_date, '%Y-%m-%d %T') end_date
    , DATE_FORMAT(next_start_date, '%Y-%m-%d %T') next_start_date
    , DATE_FORMAT(next_end_date, '%Y-%m-%d %T') next_end_date
    , DATE_FORMAT(next_end_date, '%Y-%m-%d %T') season_start_date
    , DATE_ADD(next_end_date, INTERVAL 30 DAY) season_end_date
    FROM com_grade_season;`);
    const {
        start_date, 
        end_date, 
        next_start_date, 
        next_end_date, 
        season_start_date, 
        season_end_date,
    } = result.row[0];


    //시즌, 다음 시즌 업데이트
    result = await DB(`
    SELECT 
    , a.grade 
    , next_grade
    , grade_experience
    , CASE WHEN a.grade <= next_grade THEN 
        CASE WHEN grade_experience < b.keep_point THEN -1 ELSE 1 END 
    ELSE 2 END new_grade_state 
    FROM table_account a, com_grade b
    WHERE a.grade = b.grade
    AND userkey = 343;`);
    if(result.state && result.row.length > 0){

        // eslint-disable-next-line no-restricted-syntax
        for (const item of result.row) {

            const { userkey, grade, next_grade, new_grade_state, } = item;
            let { grade_experience, } = item;


            //승급할 대상자 제외 경험치 초기화 
            if( new_grade_state < 2 ) grade_experience = 0; 
            
            //계정 업데이트 
            currentQuery = `
            UPDATE table_account 
            SET grade = ? 
            , next_grade = ? 
            , grade_state = ? 
            , grade_experience = ?  
            WHERE userkey = ?;`;
            updateQuery += mysql.format(currentQuery, [ next_grade, next_grade, new_grade_state, grade_experience, userkey ]);

            //히스토리 누적
            currentQuery = `
            INSERT INTO user_grade_hist(
                userkey
                , grade
                , next_grade
                , grade_experience
                , start_date
                , end_date
            ) VALUES(
                ?
                , ?
                , ?
                , ?
                , ?
                , ?
            );`;
            updateQuery += mysql.format(currentQuery, [ userkey, grade, next_grade, grade_experience,  start_date, end_date ]);
        }
    }

    //시즌 업데이트 
    currentQuery = `
    UPDATE com_grade_season 
    SET start_date = ?
    , end_date = ?
    , next_start_date = ?
    , next_end_date = ?;`;
    // updateQuery += mysql.format(currentQuery, [ next_start_date, next_end_date, season_start_date, season_end_date]);


    if(updateQuery){
        result = await transactionDB(updateQuery);
        if(!result.state){
            logger.error(`calculateGradeMonth Error ${result.error}`);
        }
    }

};