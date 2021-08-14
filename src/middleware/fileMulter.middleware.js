/*
 * @Description:多文图处理
 * @Author: zhangweigang
 * @Date: 2021-08-13 21:31:18
 * @LastEditTime: 2021-08-13 22:02:24
 * @LastEditors: zhangweigang
 */

const path = require('path');
const Multer = require('koa-multer');
const { PICTURE_PATH } = require('../constants/filePath');

const storage = Multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + path.extname(file.originalname));
  },
  destination: (req, file, cb) => {
    cb(null, PICTURE_PATH);
  }
});

// 发布动态时所添加的图片
const pictureUpload = Multer({ storage });
const pictureHandle = pictureUpload.array('picture', 9);

module.exports = {
  pictureHandle
};
