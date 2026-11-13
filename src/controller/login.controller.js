/*
 * @Description: 用户登录接口逻辑
 * @Author: zhangweigang
 * @Date: 2021-08-09 22:51:41
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const { signToken } = require('../utils/token');
const { PRIVATE_KEY } = require('../app/config');

class LoginController {
  async login(ctx) {
    const { id, name } = ctx.user;

    // 用私钥签发 token，后续用公钥验签（RS256 非对称加密）
    const token = signToken({ id, name }, PRIVATE_KEY, { expiresIn: 60 * 60 * 24 });

    // 返回给客户端信息
    ctx.body = {
      id,
      name,
      token
    };
  }

  async success(ctx) {
    ctx.body = '授权成功~';
  }
}

module.exports = new LoginController();