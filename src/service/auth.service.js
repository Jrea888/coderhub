/*
 * @Description: 验证权限
 * @Author: zhangweigang
 * @Date: 2021-08-11 14:13:16
 * @LastEditTime: 2021-08-12 00:21:28
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');

class AuthService {
  async checkResource(tableName, id, userId) {
    try {
      // 1、验证是否有权修改动态信息
      const statement = `SELECT * FROM ${tableName} m WHERE m.id = ? AND m.user_id = ?;`;
      // 使用需要更新的momentId和当前user_id查询，如果有数据说明有权修改，没有数据就没有全修改
      const [result] = await connections.execute(statement, [id, userId]);
      return result.length === 0 ? false : true;
    } catch (error) {
      console.log(error);
    }
  }

  // 方式一：传递表的名字
  // async checkResource(tableName, momentId, userId) {
  //   // 1、验证是否有权修改动态信息
  //   const statement = `SELECT * FROM ${tableName} m WHERE m.id = ? AND m.user_id = ?;`;
  //   // 使用需要更新的momentId和当前user_id查询，如果有数据说明有权修改，没有数据就没有全修改
  //   const [result] = await connections.execute(statement, [momentId, userId]);
  //   return result.length === 0 ? false : true;
  // }
}

module.exports = new AuthService();
