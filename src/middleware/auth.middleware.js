/*
 * @Description:用户登录校验中间件
 * @Author: zhangweigang
 * @Date: 2021-08-09 22:48:04
 * @LastEditTime: 2021-08-11 14:53:27
 * @LastEditors: zhangweigang
 */
const jwt = require('jsonwebtoken');
const userService = require('../service/user.service');
const authService = require('../service/auth.service');
const md5password = require('../utils/passwordHandle');
const errorTypes = require('../constants/errorTypes');
const { PUBLIC_KEY } = require('../app/config');

const verifyLogin = async (ctx, next) => {
  console.log('验证登录的middleware~');
  // 1、获取用户名和密码
  const { name, password } = ctx.request.body;
  // 2、验证用户名和密码是否为空
  if (!name || !password) {
    const error = new Error(errorTypes.NAME_OR_PASSWORD_IS_REQUIRED);
    // 发射错误事件去处理
    return ctx.app.emit('error', error, ctx);
  }

  // 3、判断用户是否存在的
  const result = await userService.getUserName(name);
  const user = result[0];
  if (!user) {
    const error = new Error(errorTypes.CURRENT_USER_NOT_EXISTS);
    return ctx.app.emit('error', error, ctx);
  }

  // 4、验证密码是否相等
  if (md5password(password) !== user.password) {
    const error = new Error(errorTypes.CURRENT_USER_PASSWORD_ERROR);
    return ctx.app.emit('error', error, ctx);
  }

  ctx.user = user; // 验证完成后 给ctx对象添加user属性
  await next();
};

const verifyAuth = async (ctx, next) => {
  console.log('验证授权的middleware~');
  // 1、获取token
  const authorization = ctx.headers.authorization;
  if (!authorization) {
    const error = new Error(errorTypes.UNAUTHORIZATION);
    return ctx.app.emit('error', error, ctx);
  }
  const token = authorization.replace('Bearer ', '');
  try {
    // 2、验证token(id/name/iat/exp)
    const result = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256']
    });
    ctx.user = result;
    await next();
  } catch (err) {
    const error = new Error(errorTypes.UNAUTHORIZATION);
    ctx.app.emit('error', error, ctx);
  }
};

/**
 * 1、多个都需要验证权限：修改/删除动态、修改/删除评论
 * 2、业务接口系统、后台管理系统 moment comment
 * 一对一：user --> role
 * 多对多：role --> 权限(删除、修改)
 */
const verifyPermission = async (ctx, next) => {
  console.log('验证权限的middleware~');
  // 1、获取参数 { momentId: '1' }
  const [resourceKey] = Object.keys(ctx.params);
  const tableName = resourceKey.replace('Id', '');
  const resourceId = ctx.params[resourceKey];
  const { id } = ctx.user;
  // 2、查询是否具备权限
  try {
    const isPermission = await authService.checkResource(tableName, resourceId, id);
    // 如果查询数据长度为 0，说明没有权限，扔出异常
    if (!isPermission) throw new Error();
    await next();
  } catch (err) {
    const error = new Error(errorTypes.UNPERMISSION);
    return ctx.app.emit('error', error, ctx);
  }
};

module.exports = { verifyLogin, verifyAuth, verifyPermission };

// 方式一：
// const verifyPermission = (tableName) => {
//   return async (ctx, next) => {
//     console.log('验证权限的middleware~');
//     // 1、获取信息
//     const { momentId } = ctx.params;
//     const { id } = ctx.user;
//     // 2、查询是否具备权限
//     try {
//       const isPermission = await authService.checkResource(tableName, momentId, id);
//       // 如果查询数据长度为 0，说明没有权限，扔出异常
//       if (!isPermission) throw new Error();
//       await next();
//     } catch (err) {
//       const error = new Error(errorTypes.UNPERMISSION);
//       return ctx.app.emit('error', error, ctx);
//     }
//   };
// };
