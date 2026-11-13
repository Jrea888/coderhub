/**
 * 业务错误常量（错误码语义）
 *
 * 用 `as const` 让字面量类型保留下来，派生出 ErrorType 联合类型，
 * 这样中间件/控制器抛错时能获得类型检查，拼错常量会直接编译报错。
 */
export const errorTypes = {
  NAME_OR_PASSWORD_IS_REQUIRED: 'name_or_password_not_null',
  USER_ALREADY_EXISTS: 'username_already_exists',
  CURRENT_USER_NOT_EXISTS: 'current_login_user_not_exists',
  CURRENT_USER_PASSWORD_ERROR: 'current_user_password_error',
  UNAUTHORIZATION: 'no_authorization',
  UNPERMISSION: 'no_permission',
  INVALID_PARAMETERS: 'invalid_parameters',
  RESOURCE_NOT_FOUND: 'resource_not_found'
} as const;

export type ErrorType = (typeof errorTypes)[keyof typeof errorTypes];