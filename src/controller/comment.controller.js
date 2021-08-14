/*
 * @Description: 评论接口逻辑处理
 * @Author: zhangweigang
 * @Date: 2021-08-11 15:35:51
 * @LastEditTime: 2021-08-12 00:25:12
 * @LastEditors: zhangweigang
 */
const commentService = require('../service/comment.service');

class commentController {
  // 动态评论
  async create(ctx, next) {
    // 1、获取参数 content momentId user_id (哪个用户给哪个动态评论)
    const { content, momentId } = ctx.request.body;
    const { id } = ctx.user;
    // 2、创建一条评论
    try {
      const result = await commentService.create(content, momentId, id);
      ctx.body = result;
    } catch (error) {
      console.log(error);
    }
  }

  // 评论的回复
  async reply(ctx, next) {
    // 1、获取参数 content momentId user_id comment_id (哪个用户的评论给哪个评论，评论的评论)
    const { content, momentId } = ctx.request.body;
    const { commentId } = ctx.params;
    const { id } = ctx.user;
    // 2、评论的评论
    try {
      const result = await commentService.reply(content, momentId, id, commentId);
      ctx.body = result;
    } catch (error) {
      console.log(error);
    }
  }

  // 修改评论
  async update(ctx, next) {
    // 1、获取参数
    const { commentId } = ctx.params;
    const { content } = ctx.request.body;
    try {
      // 2、删除评论
      const result = await commentService.update(commentId, content);
      ctx.body = result;
    } catch (error) {
      console.log(error);
    }
  }

  // 删除评论
  async remove(ctx, next) {
    // 1、获取参数
    const { commentId } = ctx.params;
    try {
      // 2、删除评论
      const result = await commentService.remove(commentId);
      ctx.body = result;
    } catch (error) {
      console.log(error);
    }
  }

  // 获取评论列表
  async list(ctx, next) {
    // 1、获取参数
    const { momentId } = ctx.query;
    try {
      // 2.获取列表
      const result = await commentService.getCommentByMomentId(momentId);
      ctx.body = result;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new commentController();
