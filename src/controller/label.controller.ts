import type {RouterContext} from '@koa/router'
import {errorTypes} from '../constants/errorTypes'
import LabelService from '../service/label.service'
import type {LabelBody} from '../types/models'
import {emitError, getBody, toNonNegativeInt} from '../utils/request'

class LabelController {
    /** POST /label */
    async create(ctx: RouterContext): Promise<void> {
        const {name} = getBody<LabelBody>(ctx)
        if (typeof name !== 'string' || !name.trim()) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const result = await LabelService.create(name.trim())
        ctx.body = result
    }

    /** GET /label?limit=&offset= */
    async list(ctx: RouterContext): Promise<void> {
        const limit = Math.min(Number(ctx.query.limit) > 0 ? Number(ctx.query.limit) : 10, 100)
        const offset = toNonNegativeInt(ctx.query.offset, 0)

        const result = await LabelService.getLabelList(limit, offset)
        ctx.body = result
    }
}

export default new LabelController()
