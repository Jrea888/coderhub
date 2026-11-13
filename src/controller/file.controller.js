/*
 * @Description: 文件处理逻辑
 * @Author: zhangweigang
 * @Date: 2021-08-13 16:04:26
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const FileService = require('../service/file.service');
const userService = require('../service/user.service');
const { APP_HOST, APP_PORT } = require('../app/config');
const errorTypes = require('../constants/errorTypes');

class FileController {
  // 保存头像信息
  async saveAvatarInfo(ctx) {
    // multer 没匹配到文件时 ctx.req.file 是 undefined
    const file = ctx.req.file;
    if (!file) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const { filename, mimetype, size } = file;
    const { id } = ctx.user;

    // 1、将头像信息保存到数据库
    await FileService.createAvatar(filename, mimetype, size, id);

    // 2、把可访问的头像地址回填到用户表
    const avatarUrl = `${APP_HOST}:${APP_PORT}/users/${id}/avatar`;
    await userService.updateAvatarUrlById(avatarUrl, id);

    ctx.body = {
      status: 200,
      message: '上传头像成功!',
      success: true
    };
  }

  // 保存动态图片信息
  async savePictureInfo(ctx) {
    const files = ctx.req.files;
    const momentId = Number(ctx.query.momentId);
    const { id } = ctx.user;

    // 原来没校验：files 为空或 momentId 缺失时，要么不插入却返回成功，要么把 undefined 写进 SQL
    if (!Array.isArray(files) || files.length === 0 || !Number.isInteger(momentId) || momentId <= 0) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    for (const file of files) {
      const { filename, mimetype, size } = file;
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