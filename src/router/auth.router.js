/*
 * @Description: 用户登录接口
 * @Author: zhangweigang
 * @Date: 2021-08-09 22:06:18
 * @LastEditTime: 2021-08-11 09:56:12
 * @LastEditors: zhangweigang
 */
const Router = require('koa-router');
const { verifyLogin, verifyAuth } = require('../middleware/auth.middleware');
const { login, success } = require('../controller/login.controller');

const userLogin = new Router();

userLogin.post('/login', verifyLogin, login);
// 测试 token 是否有效
userLogin.get('/test', verifyAuth, success);

module.exports = userLogin;
