import Router from '@koa/router';
import commentController from '../controller/comment.controller';
import { verifyAuth, verifyPermission } from '../middleware/auth.middleware';

const commentRouter = new Router({ prefix: '/comment' });

// 发表评论
commentRouter.post('/', verifyAuth, commentController.create);
// 回复评论
commentRouter.post('/:commentId/reply', verifyAuth, commentController.reply);
// 修改 / 删除（需要登录 + 归属校验）
commentRouter.patch('/:commentId', verifyAuth, verifyPermission, commentController.update);
commentRouter.delete('/:commentId', verifyAuth, verifyPermission, commentController.remove);
// 评论列表
commentRouter.get('/', commentController.list);

export default commentRouter;