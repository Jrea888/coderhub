/*
 * @Description: 用户登录接口逻辑
 * @Author: zhangweigang
 * @Date: 2021-08-09 22:51:41
 * @LastEditTime: 2021-08-11 09:57:05
 * @LastEditors: zhangweigang
 */
const jwt = require('jsonwebtoken');
const { PRIVATE_KEY } = require('../app/config');

class LoginController {
  async login(ctx, next) {
    const { id, name } = ctx.user;
    // 颁发 token 使用私钥进行加密，使用公钥对私钥加密的 token 进行解密验证
    const token = jwt.sign({ id, name }, PRIVATE_KEY, {
      expiresIn: 60 * 60 * 24,
      algorithm: 'RS256'
    });
    // 返回给客户端信息
    ctx.body = {
      id,
      name,
      token
    };
  }

  async success(ctx, next) {
    ctx.body = '授权成功~';
  }
}

module.exports = new LoginController();
