/*
 * @Description: 评论数据接口
 * @Author: zhangweigang
 * @Date: 2021-08-11 15:31:52
 * @LastEditTime: 2021-08-11 22:11:52
 * @LastEditors: zhangweigang
 */
const Router = require('koa-router');
const { create, reply, update, remove, list } = require('../controller/comment.controller');
const { verifyAuth, verifyPermission } = require('../middleware/auth.middleware');

const commentRouter = new Router({ prefix: '/comment' });

// 发表评论 1、判断token验证
commentRouter.post('/', verifyAuth, create);
// 回复评论
commentRouter.post('/:commentId/reply', verifyAuth, reply);
// 修改评论 1、判断token验证，2、判断是否有权限
commentRouter.patch('/:commentId', verifyAuth, verifyPermission, update);
// 删除评论
commentRouter.delete('/:commentId', verifyAuth, verifyPermission, remove);

// 获取评论列表
commentRouter.get('/', list);

module.exports = commentRouter;
