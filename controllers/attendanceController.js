import mysql from "mysql2/promise";
import { response } from "express";
import { DB, logAction, transactionDB } from "../mysqldb";
import { logger } from "../logger";
import { respondDB } from "../respondent";

//! 출석리스트 
export const attendanceList = async(req, res) => {

    const {
        body:{
            userkey,
        }
    } = req;

    let maxDaySeq = 0;
    const responseData = {};
    const attendanceArray = [];
    // 반복이거나 아직 덜 받은 얘들만
    // 금일에 받은 출석 보상은 제외
    const result = await DB(`
    SELECT a.attendance_id 
    , day_seq
    , b.currency
    , quantity
    , fn_get_design_info(icon_image_id, 'url') icon_image_url
    , fn_get_design_info(icon_image_id, 'key') icon_image_key
    , fn_check_attendance_exists(?, a.attendance_id, day_seq, fn_get_attendance_max(?, a.attendance_id)) is_receive
    FROM com_attendance a, com_attendance_daily b, com_currency c
    WHERE a.attendance_id > 0
    AND a.attendance_id = b.attendance_id
    AND b.currency = c.currency
    AND is_public > 0
    AND now() BETWEEN from_date AND to_date
    AND ( is_loop > 0 OR ( fn_get_attendance_cnt(?, a.attendance_id, fn_get_attendance_max(?, a.attendance_id) ) < kind AND is_loop = 0 ) )
    AND ( SELECT EXISTS (SELECT * FROM user_attendance WHERE userkey = ? AND attendance_id = a.attendance_id AND date(now()) = date(action_date) ) ) = 0;
    `, [userkey, userkey, userkey, userkey, userkey]);
    // eslint-disable-next-line no-restricted-syntax
    for(const item of result.row){ 
        const attendance_id = item.attendance_id.toString();
        if (!Object.prototype.hasOwnProperty.call(responseData, attendance_id)) {  //attendance_id를 property로 선언
            attendanceArray.push(item.attendance_id);
            responseData.atendance = attendanceArray;
            responseData[attendance_id] = [];
        }

        let click_check = 0; //클릭여부      
        if(item.is_receive > 0) { //받았는지 확인
            maxDaySeq = item.day_seq;  
        }else{
            // eslint-disable-next-line no-lonely-if
            if(item.day_seq === maxDaySeq+1) click_check = 1; //그 다음 보상만 클릭 활성화 
        } 

        responseData[attendance_id].push({
            attendance_id : item.attendance_id,
            day_seq : item.day_seq, 
            currency : item.currency, 
            quantity : item.quantity, 
            icon_image_url : item.icon_image_url, 
            icon_image_key : item.icon_image_key,
            is_receive : item.is_receive,
            click_check,
          });
 
    }

    res.status(200).json(responseData); 
};

//! 출석 보상 
export const sendAttendanceReward = async (req, res) =>{

    const {
        body:{
            userkey,
            attendance_id = 0, 
            day_seq = 0,
        }
    } = req;

    const responseData = {};

    //* 유효한지 확인
    let result = await DB(`
    SELECT currency
    , quantity 
    , fn_get_attendance_max(?, a.attendance_id) attendance_max
    FROM com_attendance a, com_attendance_daily b 
    WHERE a.attendance_id = b.attendance_id
    AND is_public > 0 
    AND now() BETWEEN from_date AND to_date
    AND (is_loop > 0 OR ( fn_get_attendance_cnt(?, a.attendance_id, fn_get_attendance_max(?, a.attendance_id)) < kind AND is_loop = 0 ) )
    AND a.attendance_id = ?
    AND day_seq = ?
    ;`, [userkey, userkey, userkey, attendance_id, day_seq]);
    if(!result.state || result.row.length === 0){
        logger.error(`sendAttendanceReward Error 1`);
        respondDB(res, 80019);
        return;
    }

    const {
        currency, 
        quantity,  
        attendance_max,  
    } = result.row[0];

    // console.log(currency, quantity, attendance_max);

    //* 금일 받았는지 확인
    result = await DB(`
    SELECT * FROM user_attendance 
    WHERE userkey = ? 
    AND attendance_id = ?
    AND date(now()) = date(action_date);
    `, [userkey, attendance_id]);
    if(!result.state || ( result.state && result.row.length > 0 )){
        logger.error(`sendAttendanceReward Error 2`);
        respondDB(res, 80025);
        return;        
    }

    //* 중복 확인
    result = await DB(`
    SELECT * FROM user_attendance
    WHERE userkey = ? 
    AND attendance_id = ?
    AND day_seq = ?
    AND loop_cnt = ?;
    `, [userkey, attendance_id, day_seq, attendance_max]);
    if(!result.state || ( result.state && result.row.length > 0 )){
        logger.error(`sendAttendanceReward Error 3`);
        respondDB(res, 80025);
        return;        
    }

    //* 건너 뛰고 보상 받는지 확인  
    if(day_seq !== 1){

        let days = ``; 

        //이전 일수 가져오기 
        result = await DB(`
        SELECT day_seq
        FROM com_attendance_daily 
        WHERE attendance_id = ? 
        AND day_seq < ?;
        `, [attendance_id, day_seq]);
        // eslint-disable-next-line no-restricted-syntax
        for(const item of result.row){
            days += `${item.day_seq},`;
        }
        days = days.slice(0, -1); 

        //연속으로 출석 보상 받았는지 확인 
        result = await DB(`
        SELECT * FROM user_attendance
        WHERE userkey = ? 
        AND attendance_id = ? 
        AND loop_cnt = ? 
        AND day_seq IN (${days});
        `, [userkey, attendance_id, attendance_max]);
        if(!result.state || result.row.length === 0){  // 아무것도 없으면 
            logger.error(`sendAttendanceReward Error 4-1`);
            respondDB(res, 80110);
            return;    
        }else{

            // eslint-disable-next-line no-lonely-if
            if(parseInt((day_seq-1), 10) !== result.row.length){    //연속으로 출석 보상 받지 않고, 건너뛸 경우 
                logger.error(`sendAttendanceReward Error 4-2`);
                respondDB(res, 80110);
                return;                 
            }
        }
    }
    
    let currentQuery = ``;
    let updateQuery = ``; 
    // 누적 
    currentQuery = `
    INSERT INTO user_attendance(userkey, attendance_id, loop_cnt, day_seq, currency, quantity) 
    VALUES(?, ?, ?, ?, ?, ?);
    `;
    updateQuery += mysql.format(currentQuery, [userkey, attendance_id, attendance_max, day_seq, currency, quantity]);

    // 메일 발송 
    currentQuery = `INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
    VALUES(?, 'attendance', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);`;
    updateQuery += mysql.format(currentQuery, [userkey, currency, quantity]); 

    result = await transactionDB(updateQuery); 
    if(!result.state){
        logger.error(`sendAttendanceReward Error 4 ${result.error}`);
        respondDB(res, 80026, result.error);
        return;             
    }

    responseData.day_seq = day_seq; 

    //* 안 읽은 메일 건수
    const unreadMailResult = await DB(
        `SELECT fn_get_user_unread_mail_count(?) cnt FROM dual;`,
        [userkey]
    );

    responseData.unreadMailCount = 0;
    if (unreadMailResult.state && unreadMailResult.row.length > 0)
        responseData.unreadMailCount = unreadMailResult.row[0].cnt;

    res.status(200).json(responseData);
    logAction(userkey, "attendance", req.body);

};