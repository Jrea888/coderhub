/*
 * @Description: 用户注册校验中间件
 * @Author: zhangweigang
 * @Date: 2021-08-09 12:22:55
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const errorTypes = require('../constants/errorTypes');
const userService = require('../service/user.service');
const md5password = require('../utils/passwordHandle');

const verifyUser = async (ctx, next) => {
  // 1、获取用户名和密码（请求体可能为空，先兜底成 {}）
  const { name, password } = ctx.request.body || {};

  // 2、验证用户名和密码是否为空
  if (!name || !password) {
    return ctx.app.emit('error', new Error(errorTypes.NAME_OR_PASSWORD_IS_REQUIRED), ctx);
  }

  // 3、判断用户名是否已被注册
  const result = await userService.getUserName(name);
  if (Array.isArray(result) && result.length) {
    return ctx.app.emit('error', new Error(errorTypes.USER_ALREADY_EXISTS), ctx);
  }

  // 4、用户名检测完成后再执行密码加密
  await next();
};

// 密码加密（MD5，历史方案；生产建议改为加盐哈希，见 README）
const handlePassword = async (ctx, next) => {
  const { password } = ctx.request.body || {};
  ctx.request.body.password = md5password(password);
  await next();
};

module.exports = { verifyUser, handlePassword };