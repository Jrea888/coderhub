/*
 * @Description: 用户注册接口的逻辑
 * @Author: zhangweigang
 * @Date: 2021-08-09 09:22:49
 * @LastEditTime: 2021-08-13 21:44:55
 * @LastEditors: zhangweigang
 */
const fs = require('fs');
const userSerice = require('../service/user.service');
const fileService = require('../service/file.service');

const { AVATAR_PATH } = require('../constants/filePath');

class UserController {
  async create(ctx, next) {
    // 获取用户参数
    const user = ctx.request.body;
    try {
      // 数据查询 对数据库进行操作
      const result = await userSerice.create(user);
      // 返回给用户数据
      ctx.body = result;
    } catch (error) {
      console.log(error);
    }
  }

  // 根据用户id获取用户头像信息
  async userAvatarInfo(ctx, next) {
    // 1、获取userID
    const { userId } = ctx.params;
    // 2、查找头像信息
    const avatarInfo = await fileService.getAvatarUserInfo(userId);
    // 3、提供头像信息
    ctx.response.set('content-type', avatarInfo.mimtype);
    ctx.body = fs.createReadStream(`${AVATAR_PATH}/${avatarInfo.filename}`);
  }
}

module.exports = new UserController();
