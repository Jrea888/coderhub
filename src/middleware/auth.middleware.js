/*
 * @Description: 登录校验 / token 校验 / 资源权限校验中间件
 * @Author: zhangweigang
 * @Date: 2021-08-09 22:48:04
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const { verifyToken } = require('../utils/token');
const userService = require('../service/user.service');
const authService = require('../service/auth.service');
const md5password = require('../utils/passwordHandle');
const errorTypes = require('../constants/errorTypes');
const { PUBLIC_KEY } = require('../app/config');

// 统一用 app.emit('error') 交给 app.on('error', errorHandle) 处理，返回 true 表示已响应
const emitError = (ctx, type) => ctx.app.emit('error', new Error(type), ctx);

const verifyLogin = async (ctx, next) => {
  // 1、获取用户名和密码（koa-bodyparser 未解析时 body 可能是 undefined）
  const { name, password } = ctx.request.body || {};

  // 2、验证用户名和密码是否为空
  if (!name || !password) {
    return emitError(ctx, errorTypes.NAME_OR_PASSWORD_IS_REQUIRED);
  }

  // 3、判断用户是否存在
  const result = await userService.getUserName(name);
  const user = Array.isArray(result) ? result[0] : undefined;
  if (!user) {
    return emitError(ctx, errorTypes.CURRENT_USER_NOT_EXISTS);
  }

  // 4、验证密码是否相等
  if (md5password(password) !== user.password) {
    return emitError(ctx, errorTypes.CURRENT_USER_PASSWORD_ERROR);
  }

  ctx.user = user; // 验证完成后，把用户信息挂到 ctx 上给 login controller 用
  await next();
};

const verifyAuth = async (ctx, next) => {
  // 1、获取 token
  const authorization = ctx.headers.authorization;
  if (!authorization) {
    return emitError(ctx, errorTypes.UNAUTHORIZATION);
  }

  const token = authorization.replace(/^Bearer\s+/i, '');

  // 2、验证 token（只把 verify 放进 try）
  // 原写法把 await next() 也包在 try 里，导致下游 controller 的任何异常
  // 都会被 catch 成"无效token"，真正的问题被 401 掩盖
  let payload;
  try {
    payload = verifyToken(token, PUBLIC_KEY);
  } catch (err) {
    return emitError(ctx, errorTypes.UNAUTHORIZATION);
  }

  ctx.user = payload; // token 里带 id / name / iat / exp
  await next();
};

/**
 * 资源归属校验：当前用户是否有权修改/删除某条资源
 * 约定：路由参数名以 Id 结尾（如 :momentId、:commentId），表名由参数名推导
 */
const ALLOWED_TABLES = ['moment', 'comment'];

const verifyPermission = async (ctx, next) => {
  // 1、从路由参数推导出表名和资源 id
  const [resourceKey] = Object.keys(ctx.params);
  if (!resourceKey || !/Id$/.test(resourceKey)) {
    return emitError(ctx, errorTypes.INVALID_PARAMETERS);
  }

  const tableName = resourceKey.replace(/Id$/, '');
  const resourceId = Number(ctx.params[resourceKey]);
  const userId = ctx.user && ctx.user.id;

  // 2、参数与表名都要合法，避免把任意字符串拼进 SQL
  if (!ALLOWED_TABLES.includes(tableName) || !Number.isInteger(resourceId) || resourceId <= 0 || !userId) {
    return emitError(ctx, errorTypes.INVALID_PARAMETERS);
  }

  // 3、查询是否具备权限
  const isPermission = await authService.checkResource(tableName, resourceId, userId);
  if (!isPermission) {
    return emitError(ctx, errorTypes.UNPERMISSION);
  }

  await next();
};

module.exports = { verifyLogin, verifyAuth, verifyPermission };