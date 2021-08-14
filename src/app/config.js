/*
 * @Description: 添加全局配置变量
 * @Author: zhangweigang
 * @Date: 2021-08-09 08:23:23
 * @LastEditTime: 2021-08-13 18:30:53
 * @LastEditors: zhangweigang
 */
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 将.env文件的变量通过dotenv库添加到 全局的process.env中
dotenv.config();

// 引入私钥和公钥文件
const PRIVATE_KEY = fs.readFileSync(path.resolve(__dirname, './keys/private.key'));
const PUBLIC_KEY = fs.readFileSync(path.resolve(__dirname, './keys/public.key'));

module.exports = { APP_HOST, APP_PORT, MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD } = process.env;

module.exports.PRIVATE_KEY = PRIVATE_KEY;
module.exports.PUBLIC_KEY = PUBLIC_KEY;
