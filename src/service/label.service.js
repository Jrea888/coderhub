/*
 * @Description: 标签数据查询
 * @Author: zhangweigang
 * @Date: 2021-08-12 09:46:54
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');

class LabelService {
  // 添加标签
  async create(name) {
    const statement = `INSERT INTO label (name) VALUES (?);`;
    const [result] = await connections.execute(statement, [name]);
    return result;
  }

  // 获取标签列表
  // 原实现 SQL 里写死 `LIMIT 0,10`，参数 limit/offset 完全没生效
  async getLabelList(limit = 10, offset = 0) {
    const statement = `SELECT * FROM label ORDER BY id ASC LIMIT ?, ?;`;
    const [result] = await connections.execute(statement, [offset, limit]);
    return result;
  }

  // 通过标签名称查询标签是否存在
  async getLabelName(labelName) {
    const statement = `SELECT * FROM label WHERE name = ? LIMIT 1;`;
    const [result] = await connections.execute(statement, [labelName]);
    return result[0];
  }
}

module.exports = new LabelService();