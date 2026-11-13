import fs from 'node:fs'
import path from 'node:path'
import type {RouterContext} from '@koa/router'
import {PICTURE_PATH} from '../constants/filePath'
import {errorTypes} from '../constants/errorTypes'
import FileService from '../service/file.service'
import momentService from '../service/moment.service'
import type {MomentBody} from '../types/models'
import {emitError, getBody, toNonNegativeInt, toPositiveInt} from '../utils/request'

const MAX_PAGE_SIZE = 100

class MomentController {
    /** POST /moment */
    async createMoment(ctx: RouterContext): Promise<void> {
        const user = ctx.state.user
        const content = getBody<MomentBody>(ctx).content

        if (!user || typeof content !== 'string' || !content.trim()) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const result = await momentService.create(user.id, content.trim())
        ctx.body = result
    }

    /** GET /moment/:momentId */
    async getOneMomentDetail(ctx: RouterContext): Promise<void> {
        const momentId = toPositiveInt(ctx.params.momentId)
        if (!momentId) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const result = await momentService.getMomentById(momentId)
        if (!result) {
            emitError(ctx, errorTypes.RESOURCE_NOT_FOUND)
            return
        }

        ctx.body = {message: '操作成功！', data: result, status: 200, success: true}
    }

    /** GET /moment?offset=&size= */
    async getMomentList(ctx: RouterContext): Promise<void> {
        const offset = toNonNegativeInt(ctx.query.offset, 0)
        const size = Math.min(toPositiveInt(ctx.query.size) ?? 10, MAX_PAGE_SIZE)

        const result = await momentService.getMomentPageList(offset, size)
        ctx.body = result
    }

    /** PATCH /moment/:momentId */
    async updateMoment(ctx: RouterContext): Promise<void> {
        const momentId = toPositiveInt(ctx.params.momentId)
        const content = getBody<MomentBody>(ctx).content

        if (!momentId || typeof content !== 'string' || !content.trim()) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const result = await momentService.update(content.trim(), momentId)
        ctx.body = result
    }

    /** DELETE /moment/:momentId */
    async removeMoment(ctx: RouterContext): Promise<void> {
        const momentId = toPositiveInt(ctx.params.momentId)
        if (!momentId) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const result = await momentService.remove(momentId)
        ctx.body = result
    }

    /** POST /moment/:momentId/labels */
    async addLabels(ctx: RouterContext): Promise<void> {
        const momentId = toPositiveInt(ctx.params.momentId)
        const labels = ctx.state.labels ?? []

        if (!momentId || labels.length === 0) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        for (const label of labels) {
            const isExist = await momentService.hasLabel(momentId, label.id)
            if (!isExist) {
                await momentService.addLabels(momentId, label.id)
            }
        }

        ctx.body = {message: '给动态添加标签成功~', labels}
    }

    /** GET /moment/images/:filename */
    async filePictureInfo(ctx: RouterContext): Promise<void> {
        // 只取 basename，防止 ../ 越权读取 uploads 之外的文件
        const filename = path.basename(ctx.params.filename ?? '')
        if (!filename) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const fileInfo = await FileService.getFileByFilename(filename)
        if (!fileInfo) {
            emitError(ctx, errorTypes.RESOURCE_NOT_FOUND)
            return
        }

        ctx.set('content-type', fileInfo.mimtype)
        ctx.body = fs.createReadStream(path.join(PICTURE_PATH, filename))
    }
}

export default new MomentController()
