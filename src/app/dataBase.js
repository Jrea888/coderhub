/*
 * @Description: 连接数据库
 * @Author: zhangweigang
 * @Date: 2021-08-09 10:22:52
 * @LastEditTime: 2021-08-09 13:15:28
 * @LastEditors: zhangweigang
 */
const mysql = require('mysql2');
const config = require('./config');

// 连接 MySQL 数据库
const connections = mysql.createPool({
  host: config.MYSQL_HOST,
  port: config.MYSQL_PORT,
  database: config.MYSQL_DATABASE,
  user: config.MYSQL_USER,
  password: config.MYSQL_PASSWORD
});

// 查看数据库是否连接成功
connections.getConnection((error, conn) => {
  if (error) {
    console.log('数据库连接失败！', error);
  } else {
    console.log('数据库连接成功！');
  }
});

module.exports = connections.promise();
