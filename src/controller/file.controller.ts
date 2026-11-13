import type {RouterContext} from '@koa/router'
import {APP_HOST, APP_PORT} from '../app/config'
import {errorTypes} from '../constants/errorTypes'
import FileService from '../service/file.service'
import userService from '../service/user.service'
import {emitError, toPositiveInt} from '../utils/request'

class FileController {
    /** POST /upload/avatar */
    async saveAvatarInfo(ctx: RouterContext): Promise<void> {
        const file = ctx.file
        const user = ctx.state.user

        if (!file || !user) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        // 1、保存头像元信息
        await FileService.createAvatar(file.filename, file.mimetype, file.size, user.id)

        // 2、回填可访问的头像地址
        const avatarUrl = `${APP_HOST}:${APP_PORT}/users/${user.id}/avatar`
        await userService.updateAvatarUrlById(avatarUrl, user.id)

        ctx.body = {status: 200, message: '上传头像成功!', success: true}
    }

    /** POST /upload/picture?momentId= */
    async savePictureInfo(ctx: RouterContext): Promise<void> {
        const files = ctx.files ?? []
        const user = ctx.state.user
        const momentId = toPositiveInt(ctx.query.momentId)

        if (!user || files.length === 0 || !momentId) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        for (const file of files) {
            await FileService.createPicture(file.filename, file.mimetype, file.size, user.id, momentId)
        }

        ctx.body = {status: 200, message: '动态图片发布成功!', success: true}
    }
}

export default new FileController()
