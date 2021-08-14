/*
 * @Description: 密码加密
 * @Author: zhangweigang
 * @Date: 2021-08-09 21:19:55
 * @LastEditTime: 2021-08-09 23:32:10
 * @LastEditors: zhangweigang
 */
// crypto 是 Node 自带的库
const crypto = require('crypto');

const md5password = (password) => {
  const md5 = crypto.createHash('md5'); // 选择加密算法 返回MD5对象
  // update对象 返回二进制的字符串，再转换为十六进制(hex),如果不穿参数，拿到是buffer
  // 重点：password必须为字符串
  const result = md5.update(String(password)).digest('hex');
  return result;
};

module.exports = md5password;
