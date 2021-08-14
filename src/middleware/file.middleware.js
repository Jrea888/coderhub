/*
 * @Description: 获取图片信息
 * @Author: zhangweigang
 * @Date: 2021-08-13 16:12:58
 * @LastEditTime: 2021-08-13 21:32:53
 * @LastEditors: zhangweigang
 */
const path = require('path');
const Multer = require('koa-multer');
const { AVATAR_PATH } = require('../constants/filePath');

// 存放上传的头像目录
const storage = Multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + path.extname(file.originalname));
  },
  destination: (req, file, cb) => {
    cb(null, AVATAR_PATH);
  }
});
// 用户头像
const avatarUpload = Multer({ storage });
// avatar 为参数名称
const avatarHandle = avatarUpload.single('avatar');

module.exports = {
  avatarHandle
};
