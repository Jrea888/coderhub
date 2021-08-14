/*
 * @Description: 文件接口
 * @Author: zhangweigang
 * @Date: 2021-08-13 16:00:09
 * @LastEditTime: 2021-08-13 22:04:38
 * @LastEditors: zhangweigang
 */
const Router = require('koa-router');
const { verifyAuth } = require('../middleware/auth.middleware');
const { saveAvatarInfo, savePictureInfo } = require('../controller/file.controller');
const { avatarHandle } = require('../middleware/file.middleware');
const { pictureHandle } = require('../middleware/fileMulter.middleware');

const fileRouter = new Router({ prefix: '/upload' });

// 用户头像接口
fileRouter.post('/avatar', verifyAuth, avatarHandle, saveAvatarInfo);
// 发布动态时上传的图片
fileRouter.post('/picture', verifyAuth, pictureHandle, savePictureInfo);

module.exports = fileRouter;
