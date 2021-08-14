/*
 * @Description: 标签数据查询
 * @Author: zhangweigang
 * @Date: 2021-08-12 09:46:54
 * @LastEditTime: 2021-08-12 11:57:22
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');

class LabelService {
  // 添加标签
  async create(name) {
    try {
      const statement = `INSERT INTO label (name) VALUES (?);`;
      const [result] = await connections.execute(statement, [name]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 获取标签列表
  async getLabelList(limit, offset) {
    try {
      const statement = `SELECT * FROM label  LIMIT 0,10;`;
      const [result] = await connections.execute(statement, [offset, limit]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 通过标签名称查询标签是否存在
  async getLabelName(labelName) {
    try {
      const statement = `SELECT * FROM label WHERE name = ?`;
      const [result] = await connections.execute(statement, [labelName]);
      return result[0];
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new LabelService();
