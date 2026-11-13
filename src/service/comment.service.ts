import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../app/dataBase';
import type { CommentItem } from '../types/models';

class CommentService {
  /** 发表评论 */
  async create(content: string, momentId: number, userId: number): Promise<ResultSetHeader> {
    const statement = `INSERT INTO comment (content, moment_id, user_id) VALUES (?, ?, ?);`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [content, momentId, userId]);
    return result;
  }

  /** 回复评论 */
  async reply(content: string, momentId: number, userId: number, commentId: number): Promise<ResultSetHeader> {
    const statement = `INSERT INTO comment (content, moment_id, user_id, comment_id) VALUES (?, ?, ?, ?);`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [content, momentId, userId, commentId]);
    return result;
  }

  /** 修改评论 */
  async update(commentId: number, content: string): Promise<ResultSetHeader> {
    const statement = `UPDATE comment SET content = ? WHERE id = ?;`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [content, commentId]);
    return result;
  }

  /** 删除评论 */
  async remove(commentId: number): Promise<ResultSetHeader> {
    const statement = `DELETE FROM comment WHERE id = ?;`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [commentId]);
    return result;
  }

  /** 某条动态下的评论列表 */
  async getCommentByMomentId(momentId: number): Promise<CommentItem[]> {
    const statement = `
      SELECT
        c.id, c.content, c.comment_id commentId, c.createAt createTime,
        JSON_OBJECT('id', u.id, 'name', u.name) user
      FROM comment c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.moment_id = ?
      ORDER BY c.id ASC;
    `;
    const [rows] = await pool.execute<RowDataPacket[]>(statement, [momentId]);
    return rows as CommentItem[];
  }
}

export default new CommentService();