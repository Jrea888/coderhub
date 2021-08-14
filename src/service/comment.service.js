/*
 * @Description: 用户评论数据操作
 * @Author: zhangweigang
 * @Date: 2021-08-11 15:52:49
 * @LastEditTime: 2021-08-11 23:58:05
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');

class CommentService {
  // 创建一条评论
  async create(content, momentId, userId) {
    try {
      const statement = `INSERT INTO comment (content,moment_id,user_id) VALUES (?,?,?);`;
      const [result] = await connections.execute(statement, [content, momentId, userId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 评论的回复
  async reply(content, momentId, userId, commentId) {
    try {
      const statement = `INSERT INTO comment (content,moment_id,user_id,comment_id) VALUES (?,?,?,?);`;
      const [result] = await connections.execute(statement, [content, momentId, userId, commentId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 修改评论
  async update(commentId, content) {
    try {
      const statement = `UPDATE comment SET content = ? WHERE comment.id = ?;`;
      const [result] = await connections.execute(statement, [content, commentId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 删除评论
  async remove(commentId) {
    try {
      const statement = `DELETE FROM comment WHERE id = ?`;
      const [result] = await connections.execute(statement, [commentId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 获取评论列表
  async getCommentByMomentId(momentId) {
    try {
      const statement = `
      SELECT
        m.id,m.content,m.comment_id commentId,m.createAt createTime,
        JSON_OBJECT('id',u.id,'name',u.name) user
      FROM comment m
      LEFT JOIN	users u ON u.id = m.user_id
      WHERE m.moment_id = ?;
      `;
      const [result] = await connections.execute(statement, [momentId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new CommentService();
