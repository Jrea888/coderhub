/*
 * @Description: 加载环境变量与本地密钥，导出全局配置
 * @Author: zhangweigang
 * @Date: 2021-08-09 08:23:23
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 将 .env 文件的变量通过 dotenv 添加到全局的 process.env 中
dotenv.config();

// 引入私钥和公钥（jwt 的 sign / verify 需要 PEM 内容，这里保持 Buffer 类型）
const PRIVATE_KEY = fs.readFileSync(path.resolve(__dirname, './keys/private.key'));
const PUBLIC_KEY = fs.readFileSync(path.resolve(__dirname, './keys/public.key'));

const {
  APP_HOST,
  APP_PORT,
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_DATABASE,
  MYSQL_USER,
  MYSQL_PASSWORD
} = process.env;

// 注意：原来写的是 `module.exports = { ... } = process.env;`
// 赋值表达式的值是右边的 process.env，等价于把整个 process.env 导出去；
// 之后再挂 PRIVATE_KEY，值还会被 process.env 强制转成字符串，静默丢掉 Buffer 类型。
module.exports = {
  APP_HOST: APP_HOST || 'http://localhost',
  APP_PORT: Number(APP_PORT) || 8888,
  MYSQL_HOST,
  MYSQL_PORT: Number(MYSQL_PORT) || 3306,
  MYSQL_DATABASE,
  MYSQL_USER,
  MYSQL_PASSWORD,
  PRIVATE_KEY,
  PUBLIC_KEY
};