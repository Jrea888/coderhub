/*
 * @Description: 用户动态接口
 * @Author: zhangweigang
 * @Date: 2021-08-10 22:46:14
 * @LastEditTime: 2021-08-13 22:32:08
 * @LastEditors: zhangweigang
 */
// 引入路由
const Router = require('koa-router');
const { verifyAuth, verifyPermission } = require('../middleware/auth.middleware');
const { verifyLabelExist } = require('../middleware/label.middleware');
const { createMoment, getMomentList, getOneMomentDetail, updateMoment, removeMoment, addLabels, filePictureInfo } = require('../controller/moment.controller');

// 创建路由对象
const momentRouter = new Router({ prefix: '/moment' });

// 发布一条新动态接口，需要验证token
momentRouter.post('/', verifyAuth, createMoment);
// 获取动态分页列表数据
momentRouter.get('/', getMomentList);
// 获取某一条动态详情
momentRouter.get('/:momentId', getOneMomentDetail);
// 修改动态信息 content id 1、用户需要登录，2、需要认证这条动态是否有权限修改
// 方式一：使用闭包 verifyPermission 是一个函数，函数返回中间件去执行
// momentRouter.patch('/:momentId', verifyAuth, verifyPermission('moment'), updateMoment);
// 方式二：使用参数前面的 字段：moment作为表名称
momentRouter.patch('/:momentId', verifyAuth, verifyPermission, updateMoment);
// 删除动态信息
momentRouter.delete('/:momentId', verifyAuth, verifyPermission, removeMoment);

// 给动态添加标签
momentRouter.post('/:momentId/lables', verifyAuth, verifyPermission, verifyLabelExist, addLabels);

// 动态配置图片
momentRouter.get('/images/:filename', filePictureInfo);

module.exports = momentRouter;
