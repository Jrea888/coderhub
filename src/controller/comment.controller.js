/*
 * @Description: 评论接口逻辑处理
 * @Author: zhangweigang
 * @Date: 2021-08-11 15:35:51
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const commentService = require('../service/comment.service');
const errorTypes = require('../constants/errorTypes');

const toPositiveInt = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

class CommentController {
  // 动态评论
  async create(ctx) {
    const { content, momentId } = ctx.request.body || {};
    const id = ctx.user.id;

    if (typeof content !== 'string' || !content.trim() || !toPositiveInt(momentId)) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const result = await commentService.create(content.trim(), Number(momentId), id);
    ctx.body = result;
  }

  // 评论的回复
  async reply(ctx) {
    const { content, momentId } = ctx.request.body || {};
    const commentId = toPositiveInt(ctx.params.commentId);
    const id = ctx.user.id;

    if (typeof content !== 'string' || !content.trim() || !toPositiveInt(momentId) || !commentId) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const result = await commentService.reply(content.trim(), Number(momentId), id, commentId);
    ctx.body = result;
  }

  // 修改评论
  async update(ctx) {
    const commentId = toPositiveInt(ctx.params.commentId);
    const { content } = ctx.request.body || {};

    if (!commentId || typeof content !== 'string' || !content.trim()) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const result = await commentService.update(commentId, content.trim());
    ctx.body = result;
  }

  // 删除评论
  async remove(ctx) {
    const commentId = toPositiveInt(ctx.params.commentId);
    if (!commentId) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const result = await commentService.remove(commentId);
    ctx.body = result;
  }

  // 获取某条动态的评论列表
  async list(ctx) {
    // 原来 momentId 缺失时会把 undefined 传给 SQL，mysql2 直接抛参数错误
    const momentId = toPositiveInt(ctx.query.momentId);
    if (!momentId) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const result = await commentService.getCommentByMomentId(momentId);
    ctx.body = result;
  }
}

module.exports = new CommentController();