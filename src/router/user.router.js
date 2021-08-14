/*
 * @Description: 用户注册接口
 * @Author: zhangweigang
 * @Date: 2021-08-09 09:21:44
 * @LastEditTime: 2021-08-13 17:43:31
 * @LastEditors: zhangweigang
 */
const Router = require('koa-router');
const { create, userAvatarInfo } = require('../controller/user.controller');
const { verifyUser, handlePassword } = require('../middleware/user.middleware');

// 创建路由 并添加请求接口路径前缀
const userRouter = new Router({ prefix: '/users' });

// 编写接口 (业务逻辑的编写放入控制层处理)
userRouter.post('/', verifyUser, handlePassword, create);
userRouter.get('/:userId/avatar', userAvatarInfo);

module.exports = userRouter;
