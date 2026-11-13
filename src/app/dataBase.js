/*
 * @Description: 连接数据库
 * @Author: zhangweigang
 * @Date: 2021-08-09 10:22:52
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const mysql = require('mysql2');
const config = require('./config');

// 连接 MySQL 数据库（连接池）
const pool = mysql.createPool({
  host: config.MYSQL_HOST,
  port: config.MYSQL_PORT,
  database: config.MYSQL_DATABASE,
  user: config.MYSQL_USER,
  password: config.MYSQL_PASSWORD
});

// 启动探活：用 query 而不是 getConnection。
// 原来 getConnection 拿到的连接没有 release，反复启动/请求会把池里的连接占满。
pool.query('SELECT 1', (error) => {
  if (error) {
    console.log('数据库连接失败！', error.code || error.message);
  } else {
    console.log('数据库连接成功！');
  }
});

// 统一导出 promise 版连接，供 service 层 await 使用
module.exports = pool.promise();