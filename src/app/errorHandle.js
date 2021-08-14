/*
 * @Description: 错误信息处理
 * @Author: zhangweigang
 * @Date: 2021-08-09 12:29:31
 * @LastEditTime: 2021-08-11 14:26:03
 * @LastEditors: zhangweigang
 */
const errorTypes = require('../constants/errorTypes');
const errorHandle = (error, ctx) => {
  let status, message;

  // MDN HTTP响应代码
  switch (error.message) {
    case errorTypes.NAME_OR_PASSWORD_IS_REQUIRED:
      status = 400; // Bad Request
      message = '用户名称或者密码不能为空!';
      break;
    case errorTypes.USER_ALREADY_EXISTS:
      status = 409; // conflict
      message = '用户名已经存在!';
      break;
    case errorTypes.CURRENT_USER_NOT_EXISTS:
      status = 400; // 参数错误
      message = '用户名不存在!';
      break;
    case errorTypes.CURRENT_USER_PASSWORD_ERROR:
      status = 400; // 参数错误
      message = '用户密码错误!';
      break;
    case errorTypes.UNAUTHORIZATION:
      status = 401; // 参数错误
      message = '无效的token!';
      break;
    case errorTypes.UNPERMISSION:
      status = 401; // 参数错误
      message = '无权限操作!';
      break;

    default:
      status = 404;
      message = 'NOT FOUND';
      break;
  }

  // 返回给用户 状态码和提示信息
  ctx.status = status;
  ctx.body = message;
};

module.exports = errorHandle;
