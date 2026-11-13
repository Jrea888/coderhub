/*
 * @Description: 用户操作数据库
 * @Author: zhangweigang
 * @Date: 2021-08-09 09:21:56
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');

class UserService {
  // 注册用户
  async create(user) {
    const { name, password } = user;
    const statement = `INSERT INTO users (name, password) VALUES (?, ?);`;
    const [result] = await connections.execute(statement, [name, password]);
    // 返回可安全外传的字段，不要把整条 OkPacket 直接丢给客户端
    return { id: result.insertId, name };
  }

  // 获取用户名称（用于重名校验 / 登录校验）
  async getUserName(name) {
    const statement = `SELECT * FROM users WHERE name = ? LIMIT 1;`;
    const [results] = await connections.execute(statement, [name]);
    return results;
  }

  // 更新用户的头像地址
  async updateAvatarUrlById(avatarUrl, id) {
    const statement = `UPDATE users SET avatar_url = ? WHERE id = ?;`;
    const [result] = await connections.execute(statement, [avatarUrl, id]);
    return result;
  }
}

module.exports = new UserService();