/*
 * @Description: 用户动态接口
 * @Author: zhangweigang
 * @Date: 2021-08-10 22:46:14
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
// 引入路由
const Router = require('koa-router');
const { verifyAuth, verifyPermission } = require('../middleware/auth.middleware');
const { verifyLabelExist } = require('../middleware/label.middleware');
const {
  createMoment,
  getMomentList,
  getOneMomentDetail,
  updateMoment,
  removeMoment,
  addLabels,
  filePictureInfo
} = require('../controller/moment.controller');

// 创建路由对象
const momentRouter = new Router({ prefix: '/moment' });

// 发布一条新动态接口，需要验证token
momentRouter.post('/', verifyAuth, createMoment);
// 获取动态分页列表数据
momentRouter.get('/', getMomentList);
// 获取某一条动态详情
momentRouter.get('/:momentId', getOneMomentDetail);
// 修改动态：1、需要登录 2、需要校验这条动态是否属于当前用户
momentRouter.patch('/:momentId', verifyAuth, verifyPermission, updateMoment);
// 删除动态
momentRouter.delete('/:momentId', verifyAuth, verifyPermission, removeMoment);

// 给动态添加标签（路径拼写修正为 labels）
momentRouter.post('/:momentId/labels', verifyAuth, verifyPermission, verifyLabelExist, addLabels);
// 兼容历史拼写错的路径，避免已有调用方直接 404
momentRouter.post('/:momentId/lables', verifyAuth, verifyPermission, verifyLabelExist, addLabels);

// 动态配图：按文件名读取图片
momentRouter.get('/images/:filename', filePictureInfo);

module.exports = momentRouter;