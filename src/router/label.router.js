/*
 * @Description: 标签接口-
 * @Author: zhangweigang
 * @Date: 2021-08-12 09:40:10
 * @LastEditTime: 2021-08-12 10:06:22
 * @LastEditors: zhangweigang
 */
const Router = require('koa-router');
const { verifyAuth } = require('../middleware/auth.middleware');
const { create, list } = require('../controller/label.controller');

const labelRouter = new Router({ prefix: '/label' });

// 添加新标签
labelRouter.post('/', verifyAuth, create);
labelRouter.get('/', list);

module.exports = labelRouter;
