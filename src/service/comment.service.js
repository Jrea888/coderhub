/*
 * @Description: 用户评论数据操作
 * @Author: zhangweigang
 * @Date: 2021-08-11 15:52:49
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');

class CommentService {
  // 创建一条评论
  async create(content, momentId, userId) {
    const statement = `INSERT INTO comment (content, moment_id, user_id) VALUES (?, ?, ?);`;
    const [result] = await connections.execute(statement, [content, momentId, userId]);
    return result;
  }

  // 评论的回复
  async reply(content, momentId, userId, commentId) {
    const statement = `INSERT INTO comment (content, moment_id, user_id, comment_id) VALUES (?, ?, ?, ?);`;
    const [result] = await connections.execute(statement, [content, momentId, userId, commentId]);
    return result;
  }

  // 修改评论
  async update(commentId, content) {
    const statement = `UPDATE comment SET content = ? WHERE id = ?;`;
    const [result] = await connections.execute(statement, [content, commentId]);
    return result;
  }

  // 删除评论
  async remove(commentId) {
    const statement = `DELETE FROM comment WHERE id = ?;`;
    const [result] = await connections.execute(statement, [commentId]);
    return result;
  }

  // 获取某条动态下的评论列表
  async getCommentByMomentId(momentId) {
    const statement = `
      SELECT
        c.id, c.content, c.comment_id commentId, c.createAt createTime,
        JSON_OBJECT('id', u.id, 'name', u.name) user
      FROM comment c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.moment_id = ?
      ORDER BY c.id ASC;
    `;
    const [result] = await connections.execute(statement, [momentId]);
    return result;
  }
}

module.exports = new CommentService();