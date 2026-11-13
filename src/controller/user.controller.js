/*
 * @Description: 用户注册 / 头像获取
 * @Author: zhangweigang
 * @Date: 2021-08-09 09:22:49
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const fs = require('fs');
const path = require('path');
const userService = require('../service/user.service');
const fileService = require('../service/file.service');
const { AVATAR_PATH } = require('../constants/filePath');
const errorTypes = require('../constants/errorTypes');

class UserController {
  async create(ctx) {
    const user = ctx.request.body;
    // 参数校验在 verifyUser 中间件完成，这里只负责落库并返回安全字段
    const result = await userService.create(user);
    ctx.body = { ...result, message: '注册成功' };
  }

  // 根据用户 id 获取头像
  async userAvatarInfo(ctx) {
    const id = Number(ctx.params.userId);
    if (!Number.isInteger(id) || id <= 0) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const avatarInfo = await fileService.getAvatarUserInfo(id);
    // 原来没判空：用户没传过头像时 avatarInfo 是 undefined，取 .mimtype 直接 500
    if (!avatarInfo) {
      return ctx.app.emit('error', new Error(errorTypes.RESOURCE_NOT_FOUND), ctx);
    }

    ctx.set('content-type', avatarInfo.mimtype);
    ctx.body = fs.createReadStream(path.join(AVATAR_PATH, avatarInfo.filename));
  }
}

module.exports = new UserController();