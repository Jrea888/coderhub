/*
 * @Description: 文件数据库处理
 * @Author: zhangweigang
 * @Date: 2021-08-13 16:57:47
 * @LastEditTime: 2021-08-13 22:38:25
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');

class FileService {
  // 保存用户头像
  async createAvatar(filename, mimetype, size, userId) {
    try {
      const statement = `INSERT INTO avatar (filename,mimtype,size,user_id) VALUES (?,?,?,?)`;
      const [result] = await connections.execute(statement, [filename, mimetype, size, userId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 根据userid获取用户头像信息
  async getAvatarUserInfo(userId) {
    const statement = `SELECT * FROM avatar WHERE user_id = ?`;
    const [result] = await connections.execute(statement, [userId]);
    return result.pop();
  }

  // 保存动态发布图片
  async createPicture(filename, mimetype, size, userId, momentId) {
    try {
      const statement = `INSERT INTO file (filename,mimtype,size,user_id,moment_id) VALUES (?,?,?,?,?)`;
      const [result] = await connections.execute(statement, [filename, mimetype, size, userId, momentId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 动态配图 根据名称获取图片类型
  async getFileByFilename(filename) {
    try {
      const statement = `SELECT * FROM file WHERE filename = ?`;
      const [result] = await connections.execute(statement, [filename]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new FileService();
