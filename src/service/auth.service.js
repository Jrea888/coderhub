/*
 * @Description: 资源归属校验
 * @Author: zhangweigang
 * @Date: 2021-08-11 14:13:16
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');

class AuthService {
  // 查询这条资源是否属于当前用户（表名由中间件白名单校验后传入）
  async checkResource(tableName, resourceId, userId) {
    const statement = `SELECT id FROM ${tableName} WHERE id = ? AND user_id = ? LIMIT 1;`;
    const [result] = await connections.execute(statement, [resourceId, userId]);
    return result.length > 0;
  }
}

module.exports = new AuthService();