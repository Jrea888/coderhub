import type {Next} from 'koa'
import type {RouterContext} from '@koa/router'
import {PUBLIC_KEY} from '../app/config'
import {errorTypes} from '../constants/errorTypes'
import authService, {type ResourceTable} from '../service/auth.service'
import userService from '../service/user.service'
import type {LoginBody, TokenPayload} from '../types/models'
import md5password from '../utils/passwordHandle'
import {emitError, getBody} from '../utils/request'
import {verifyToken} from '../utils/token'

/** 允许做归属校验的表（白名单，避免任意字符串拼进 SQL） */
const ALLOWED_TABLES: ResourceTable[] = ['moment', 'comment']

/** 登录校验：用户名密码是否合法 */
export async function verifyLogin(ctx: RouterContext, next: Next): Promise<void> {
    const {name, password} = getBody<LoginBody>(ctx)

    if (!name || !password) {
        emitError(ctx, errorTypes.NAME_OR_PASSWORD_IS_REQUIRED)
        return
    }

    const users = await userService.getUserName(name)
    const user = users[0]
    if (!user) {
        emitError(ctx, errorTypes.CURRENT_USER_NOT_EXISTS)
        return
    }

    if (md5password(password) !== user.password) {
        emitError(ctx, errorTypes.CURRENT_USER_PASSWORD_ERROR)
        return
    }

    ctx.state.user = {id: user.id, name: user.name}
    await next()
}

/** token 校验：只把验签放 try 里，下游异常不再被误判成 401 */
export async function verifyAuth(ctx: RouterContext, next: Next): Promise<void> {
    const authorization = ctx.headers.authorization
    if (!authorization) {
        emitError(ctx, errorTypes.UNAUTHORIZATION)
        return
    }

    const token = authorization.replace(/^Bearer\s+/i, '')
    let payload: TokenPayload
    try {
        payload = verifyToken(token, PUBLIC_KEY)
    } catch {
        emitError(ctx, errorTypes.UNAUTHORIZATION)
        return
    }

    ctx.state.user = payload
    await next()
}

/** 资源归属校验：参数名以 Id 结尾（:momentId / :commentId），表名由参数名推导 */
export async function verifyPermission(ctx: RouterContext, next: Next): Promise<void> {
    const [resourceKey] = Object.keys(ctx.params)
    if (!resourceKey || !/Id$/.test(resourceKey)) {
        emitError(ctx, errorTypes.INVALID_PARAMETERS)
        return
    }

    const tableName = resourceKey.replace(/Id$/, '') as ResourceTable
    const resourceId = Number(ctx.params[resourceKey])
    const userId = ctx.state.user?.id

    if (!ALLOWED_TABLES.includes(tableName) || !Number.isInteger(resourceId) || resourceId <= 0 || !userId) {
        emitError(ctx, errorTypes.INVALID_PARAMETERS)
        return
    }

    const isPermission = await authService.checkResource(tableName, resourceId, userId)
    if (!isPermission) {
        emitError(ctx, errorTypes.UNPERMISSION)
        return
    }

    await next()
}
