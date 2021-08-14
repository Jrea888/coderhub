/*
 * @Description: 文件处理逻辑
 * @Author: zhangweigang
 * @Date: 2021-08-13 16:04:26
 * @LastEditTime: 2021-08-13 21:59:05
 * @LastEditors: zhangweigang
 */
const { AVATAR_PATH, PICTURE_PATH } = require('../constants/filePath');
const FileService = require('../service/file.service');
const userService = require('../service/user.service');
const { APP_HOST, APP_PORT } = require('../app/config');

class FileController {
  // 保存头像信息
  async saveAvatarInfo(ctx, next) {
    // 1、获取图像参数
    const { filename, mimetype, size } = ctx.req.file;
    const { id } = ctx.user;
    console.log(filename, mimetype, size, id);
    // 2、将头像信息保存到数据库
    await FileService.createAvatar(filename, mimetype, size, id);

    // 3、将头像地址保存到用户表中
    const avatarUrl = `${APP_HOST}:${APP_PORT}/users/${id}/avatar`;
    await userService.updateAvatarUrlById(avatarUrl, id);

    ctx.body = {
      status: 200,
      message: '上传头像成功!',
      success: true
    };
  }

  // 保存动态图片信息
  async savePictureInfo(ctx, next) {
    // 1、获取参数
    const files = ctx.req.files;
    const { id } = ctx.user;
    const { momentId } = ctx.query;
    // 2、将所有图片保存在数据中
    for (const file of files) {
      const { filename, mimetype, size } = file;
      console.log(filename, mimetype, size, id, momentId);
      await FileService.createPicture(filename, mimetype, size, id, momentId);
    }

    ctx.body = {
      status: 200,
      message: '动态图片发布成功!',
      success: true
    };
  }
}

module.exports = new FileController();
