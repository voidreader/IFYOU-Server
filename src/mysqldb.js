import mysql from "mysql2/promise";
// import async from "async";
import dotenv from "dotenv";

dotenv.config();

const dbConfing = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PWD,
  database: process.env.MYSQL_ADMIN_DB,
  connectionLimit: process.env.MYSQL_CONN_LIMIT,
  waitForConnections: process.env.NMYSQL_WAIT_CONN,
  multipleStatements: true,
};

// 로그 DB config
const logdbConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PWD,
  database: "gamelog",
  connectionLimit: process.env.MYSQL_CONN_LIMIT,
  waitForConnections: process.env.NMYSQL_WAIT_CONN,
  multipleStatements: true,
};

// 슬레이브 DB config
const slaveConfig = {
  host: process.env.SLAVE_MYSQL_HOST,
  port: process.env.SLAVE_MYSQL_PORT,
  user: process.env.SLAVE_MYSQL_USER,
  password: process.env.SLAVE_MYSQL_PWD,
  database: process.env.MYSQL_ADMIN_DB,
  connectionLimit: process.env.MYSQL_CONN_LIMIT,
  waitForConnections: process.env.NMYSQL_WAIT_CONN,
  multipleStatements: true,
};

const adminPool = mysql.createPool(dbConfing);
const logPool = mysql.createPool(logdbConfig);
const slavePool = mysql.createPool(slaveConfig);

// 로그 DB 처리
export const logDB = async (sql, params) => {
  const result = {}; // 반환값

  try {
    // state 성공시 true 실패시 false

    const connection = await logPool.getConnection(async (conn) => conn);

    try {
      const [rows, fields] = await connection.query(sql, params);

      result.row = rows;
      result.state = true;
      connection.release();
      return result;
    } catch (err) {
      console.log(`Query ERROR ${err}`);
      result.state = false;
      result.error = err;
      connection.release();
      return result;
    }
  } catch (err) {
    console.log(`DB Error ${err}`);
    result.state = false;
    result.error = err;
    return result;
  }
};

// 일반 DB 처리
export const DB = async (sql, params) => {
  const result = {}; // 반환값

  try {
    // state 성공시 true 실패시 false

    const connection = await adminPool.getConnection(async (conn) => conn);

    try {
      const [rows, fields] = await connection.query(sql, params);

      result.row = rows;
      result.state = true;
      connection.release();
      return result;
    } catch (err) {
      console.log(`Query ERROR ${err}`);
      result.state = false;
      result.error = err;
      connection.release();
      return result;
    }
  } catch (err) {
    console.log(`DB Error ${err}`);
    result.state = false;
    result.error = err;
    return result;
  }
};

// * 슬레이브 DB
export const slaveDB = async (sql, params) => {
  const result = {}; // 반환값

  try {
    // state 성공시 true 실패시 false

    const connection = await slavePool.getConnection(async (conn) => conn);

    try {
      const [rows, fields] = await connection.query(sql, params);

      result.row = rows;
      result.state = true;
      connection.release();
      return result;
    } catch (err) {
      console.log(`Slave Query ERROR ${err}`);
      result.state = false;
      result.error = err;
      connection.release();
      return result;
    }
  } catch (err) {
    console.log(`Slave DB Error ${err}`);
    result.state = false;
    result.error = err;
    return result;
  }
};

//! 트랜잭션
export const transactionDB = async (sql, params) => {
  const result = {}; // 반환값

  try {
    // state 성공시 true 실패미 false

    const connection = await adminPool.getConnection(async (conn) => conn);
    try {
      await connection.beginTransaction();
      console.log("Transaction Start");
      const [rows, fields] = await connection.query(sql, params);
      await connection.commit();
      console.log("Success!!");

      result.row = rows;
      result.state = true;
    } catch (err) {
      console.log(`DB Error ${err}`);
      await connection.rollback();

      result.state = false;
      result.error = err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.log(`DB Error ${err}`);
    result.state = false;
    result.error = err;
  }

  return result;
};

// * 유저 앱 안에서의 모든 행동 기록
export const logAction = (userkey, action_type, log_data) => {
  // console.log(log_data);
  // console.log(JSON.stringify(log_data));
  if (JSON.stringify(log_data).length > 520) {
    logDB(
      `INSERT INTO log_action (userkey, action_type, log_data) 
    VALUES(?, ?, ?);`,
      [userkey, action_type, JSON.stringify(log_data).substr(0, 520)]
    );
  } else {
    logDB(
      `INSERT INTO log_action (userkey, action_type, log_data) 
    VALUES(?, ?, ?);`,
      [userkey, action_type, JSON.stringify(log_data)]
    );
  }
};

// * 올패스 기간 동안 플레이 완료 수집
export const logAllPass = (userkey, project_id, episode_id) => {
  logDB(
    `INSERT INTO log_allpass_play (userkey, project_id, episode_id) 
    VALUES(?, ?, ?);`,
    [userkey, project_id, episode_id]
  );
};

// * 광고 기록.
export const logAD = (
  userkey,
  project_id = -1,
  episode_id = -1,
  ad_type = "unknown"
) => {
  logDB(
    `
  INSERT INTO log_ad(
    userkey
    , project_id
    , episode_id
    , ad_type
  ) VALUES(
    ?
    ,?
    ,?
    ,?
  );
  `,
    [userkey, project_id, episode_id, ad_type]
  );
};
