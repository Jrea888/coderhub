import type {Context} from 'koa'
import {errorTypes} from '../constants/errorTypes'

/**
 * 错误处理：业务错误常量 → HTTP 状态码 + 中文提示
 * 未知异常统一 500 并打印堆栈，避免把 SQL 报错伪装成 404
 */
export default function errorHandle(error: Error, ctx: Context): void {
    let status: number
    let message: string

    switch (error.message) {
        case errorTypes.NAME_OR_PASSWORD_IS_REQUIRED:
            status = 400
            message = '用户名称或者密码不能为空!'
            break
        case errorTypes.USER_ALREADY_EXISTS:
            status = 409
            message = '用户名已经存在!'
            break
        case errorTypes.CURRENT_USER_NOT_EXISTS:
            status = 400
            message = '用户名不存在!'
            break
        case errorTypes.CURRENT_USER_PASSWORD_ERROR:
            status = 400
            message = '用户密码错误!'
            break
        case errorTypes.UNAUTHORIZATION:
            status = 401
            message = '无效的token!'
            break
        case errorTypes.UNPERMISSION:
            status = 403
            message = '无权限操作!'
            break
        case errorTypes.INVALID_PARAMETERS:
            status = 400
            message = '请求参数不合法!'
            break
        case errorTypes.RESOURCE_NOT_FOUND:
            status = 404
            message = '资源不存在!'
            break
        default:
            status = 500
            message = '服务器内部错误!'
            console.error('[未捕获异常]', error)
            break
    }

    ctx.status = status
    ctx.body = message
}
