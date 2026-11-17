import type {Next} from 'koa'
import type {RouterContext} from '@koa/router'
import {errorTypes} from '../constants/errorTypes'
import userService from '../service/user.service'
import type {RegisterBody} from '../types/models'
import {hashPassword} from '../utils/password'
import {emitError, getBody} from '../utils/request'

/** 注册校验：用户名密码非空 + 用户名未被占用 */
export async function verifyUser(ctx: RouterContext, next: Next): Promise<void> {
    const {name, password} = getBody<RegisterBody>(ctx)

    if (!name || !password) {
        emitError(ctx, errorTypes.NAME_OR_PASSWORD_IS_REQUIRED)
        return
    }

    const users = await userService.getUserName(name)
    if (users.length) {
        emitError(ctx, errorTypes.USER_ALREADY_EXISTS)
        return
    }

    await next()
}

/** 密码哈希（scrypt + 随机盐，替换原来的裸 MD5） */
export async function handlePassword(ctx: RouterContext, next: Next): Promise<void> {
    const request = ctx.request as unknown as {body: RegisterBody}
    if (request.body.password) {
        request.body.password = hashPassword(request.body.password)
    }
    await next()
}
