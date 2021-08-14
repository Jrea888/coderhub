/*
 * @Description: 用户校验中间件
 * @Author: zhangweigang
 * @Date: 2021-08-09 12:22:55
 * @LastEditTime: 2021-08-11 09:52:17
 * @LastEditors: zhangweigang
 */
const errorTypes = require('../constants/errorTypes');
const userService = require('../service/user.service');
const md5password = require('../utils/passwordHandle');

const verifyUser = async (ctx, next) => {
  console.log('验证注册的middleware~');
  // 1、获取用户名和密码
  const { name, password } = ctx.request.body;
  // 2、验证用户名和密码是否为空
  if (!name || !password) {
    const error = new Error(errorTypes.NAME_OR_PASSWORD_IS_REQUIRED);
    // 发射错误事件去处理
    return ctx.app.emit('error', error, ctx);
  }
  // 3、判断用户名是否是被注册过，是否重复注册
  const result = await userService.getUserName(name);
  if (result.length) {
    const error = new Error(errorTypes.USER_ALREADY_EXISTS);
    return ctx.app.emit('error', error, ctx);
  }
  // 4、等待用户名检测是否重复完成后，执行handlePassword中间件
  await next();
};

// 4、密码加密
const handlePassword = async (ctx, next) => {
  console.log('密码加密的middleware~');
  // 1、获取密码
  const { password } = ctx.request.body;
  // 2、使用MD5加密
  ctx.request.body.password = md5password(password);
  // 3、等待加密完成，再执行create中间件
  await next();
};

module.exports = { verifyUser, handlePassword };
