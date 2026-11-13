import type {RouterContext} from '@koa/router'
import {errorTypes} from '../constants/errorTypes'
import commentService from '../service/comment.service'
import type {CommentBody} from '../types/models'
import {emitError, getBody, toPositiveInt} from '../utils/request'

class CommentController {
    /** POST /comment */
    async create(ctx: RouterContext): Promise<void> {
        const user = ctx.state.user
        const {content, momentId} = getBody<CommentBody>(ctx)
        const momentIdNumber = toPositiveInt(momentId)

        if (!user || typeof content !== 'string' || !content.trim() || !momentIdNumber) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const result = await commentService.create(content.trim(), momentIdNumber, user.id)
        ctx.body = result
    }

    /** POST /comment/:commentId/reply */
    async reply(ctx: RouterContext): Promise<void> {
        const user = ctx.state.user
        const {content, momentId} = getBody<CommentBody>(ctx)
        const commentId = toPositiveInt(ctx.params.commentId)
        const momentIdNumber = toPositiveInt(momentId)

        if (!user || !commentId || !momentIdNumber || typeof content !== 'string' || !content.trim()) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const result = await commentService.reply(content.trim(), momentIdNumber, user.id, commentId)
        ctx.body = result
    }

    /** PATCH /comment/:commentId */
    async update(ctx: RouterContext): Promise<void> {
        const commentId = toPositiveInt(ctx.params.commentId)
        const content = getBody<CommentBody>(ctx).content

        if (!commentId || typeof content !== 'string' || !content.trim()) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const result = await commentService.update(commentId, content.trim())
        ctx.body = result
    }

    /** DELETE /comment/:commentId */
    async remove(ctx: RouterContext): Promise<void> {
        const commentId = toPositiveInt(ctx.params.commentId)
        if (!commentId) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const result = await commentService.remove(commentId)
        ctx.body = result
    }

    /** GET /comment?momentId= */
    async list(ctx: RouterContext): Promise<void> {
        const momentId = toPositiveInt(ctx.query.momentId)
        if (!momentId) {
            emitError(ctx, errorTypes.INVALID_PARAMETERS)
            return
        }

        const result = await commentService.getCommentByMomentId(momentId)
        ctx.body = result
    }
}

export default new CommentController()
