/*
 * @Description: 文件数据库处理
 * @Author: zhangweigang
 * @Date: 2021-08-13 16:57:47
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');

class FileService {
  // 保存用户头像
  async createAvatar(filename, mimetype, size, userId) {
    const statement = `INSERT INTO avatar (filename, mimtype, size, user_id) VALUES (?, ?, ?, ?);`;
    const [result] = await connections.execute(statement, [filename, mimetype, size, userId]);
    return result;
  }

  // 根据 userId 获取最新的头像信息
  async getAvatarUserInfo(userId) {
    const statement = `SELECT * FROM avatar WHERE user_id = ? ORDER BY id DESC LIMIT 1;`;
    const [result] = await connections.execute(statement, [userId]);
    return result[0]; // 原来用 result.pop()，空数组时得到 undefined，调用方取 .filename 直接崩
  }

  // 保存动态发布图片
  async createPicture(filename, mimetype, size, userId, momentId) {
    const statement = `INSERT INTO file (filename, mimtype, size, user_id, moment_id) VALUES (?, ?, ?, ?, ?);`;
    const [result] = await connections.execute(statement, [filename, mimetype, size, userId, momentId]);
    return result;
  }

  // 动态配图：根据文件名取图片元信息
  async getFileByFilename(filename) {
    const statement = `SELECT * FROM file WHERE filename = ? LIMIT 1;`;
    const [result] = await connections.execute(statement, [filename]);
    return result[0]; // 原来返回整个数组，controller 却按对象用 fileInfo.mimetype
  }
}

module.exports = new FileService();