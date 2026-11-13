import fs from 'node:fs'
import path from 'node:path'
import type {RouterContext} from '@koa/router'
import {AVATAR_PATH} from '../constants/filePath'
import {errorTypes} from '../constants/errorTypes'
import fileService from '../service/file.service'
import userService from '../service/user.service'
import type {RegisterBody} from '../types/models'
import {emitError, getBody, toPositiveInt} from '../utils/request'

class UserController {
    /** POST /users */
    async create(ctx: RouterContext): Promise<void> {
        const body = getBody<RegisterBody>(ctx)
        if (!body.name || !body.password) {
            emitError(ctx, errorTypes.NAME_OR_PASSWORD_IS_REQUIRED)
            return
        }

        const result = await userService.create({name: body.name, password: body.password})
        ctx.body = {...result, message: '注册成功'}
    }

    /** GET /users/:userId/avatar */
    async userAvatarInfo(ctx: RouterContext): Promise<void> {
        const id = toPositiveInt(ctx.params.userId)
        if (!id) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const avatarInfo = await fileService.getAvatarUserInfo(id)
        if (!avatarInfo) {
            emitError(ctx, errorTypes.RESOURCE_NOT_FOUND)
            return
        }

        ctx.set('content-type', avatarInfo.mimtype)
        ctx.body = fs.createReadStream(path.join(AVATAR_PATH, avatarInfo.filename))
    }
}

export default new UserController()
