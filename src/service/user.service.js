/*
 * @Description: 用户操作数据库
 * @Author: zhangweigang
 * @Date: 2021-08-09 09:21:56
 * @LastEditTime: 2021-08-13 21:43:43
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');

class UserService {
  // 注册用户
  async create(user) {
    // 获取数据
    const { name, password } = user;
    try {
      // 插入数据
      const statement = `INSERT INTO users (name,password) VALUES(?,?);`;
      const results = await connections.execute(statement, [name, password]);
      return results[0];
    } catch (error) {
      console.log(error);
    }
  }

  // 获取用户名称
  async getUserName(name) {
    try {
      const statement = `SELECT * FROM users WHERE name = ?`;
      const results = await connections.execute(statement, [name]);
      return results[0];
    } catch (error) {
      console.log(error);
    }
  }

  // 更新用户的头像地址
  async updateAvatarUrlById(avatarUrl, id) {
    const statement = `UPDATE users SET avatar_url = ? WHERE id = ?;`;
    const [result] = await connections.execute(statement, [avatarUrl, id]);
    return result;
  }
}

module.exports = new UserService();
