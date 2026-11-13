/*
 * @Description: 业务错误常量（错误码语义）
 * @Author: zhangweigang
 * @Date: 2021-08-09 12:38:54
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const NAME_OR_PASSWORD_IS_REQUIRED = 'name_or_password_not_null';
const USER_ALREADY_EXISTS = 'username_already_exists';
const CURRENT_USER_NOT_EXISTS = 'current_login_user_not_exists';
const CURRENT_USER_PASSWORD_ERROR = 'current_user_password_error';
const UNAUTHORIZATION = 'no_authorization';
const UNPERMISSION = 'no_permission';
// 新增：参数不合法 / 资源不存在，避免所有异常都掉进 404
const INVALID_PARAMETERS = 'invalid_parameters';
const RESOURCE_NOT_FOUND = 'resource_not_found';

module.exports = {
  NAME_OR_PASSWORD_IS_REQUIRED,
  USER_ALREADY_EXISTS,
  CURRENT_USER_NOT_EXISTS,
  CURRENT_USER_PASSWORD_ERROR,
  UNAUTHORIZATION,
  UNPERMISSION,
  INVALID_PARAMETERS,
  RESOURCE_NOT_FOUND
};