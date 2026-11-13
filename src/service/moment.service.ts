import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { APP_HOST, APP_PORT } from '../app/config';
import pool from '../app/dataBase';
import type { MomentDetail, MomentListItem } from '../types/models';

/**
 * 动态数据访问层
 * 注意：不在这里 try/catch 吞异常，让异常向上抛给统一错误处理
 */
class MomentService {
  /** 发布动态 */
  async create(userId: number, content: string): Promise<ResultSetHeader> {
    const statement = `INSERT INTO moment (content, user_id) VALUES (?, ?);`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [content, userId]);
    return result;
  }

  /** 动态详情：作者、评论、标签、配图一次聚合 */
  async getMomentById(id: number): Promise<MomentDetail | undefined> {
    const statement = `
      SELECT
        m.id, m.content, m.creatAt createTime, m.updateAt updateTime,
        JSON_OBJECT('id', u.id, 'name', u.name) author,
        (SELECT IF(COUNT(c.id),
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', c.id, 'content', c.content, 'commentId', c.comment_id, 'createTime', c.createAt,
                'user', JSON_OBJECT('id', cu.id, 'name', cu.name, 'avatarURL', cu.avatar_url)
              )
            ), NULL)
         FROM comment c
         LEFT JOIN users cu ON c.user_id = cu.id
         WHERE c.moment_id = m.id) comments,
        IF(COUNT(l.id),
          JSON_ARRAYAGG(JSON_OBJECT('id', l.id, 'name', l.name)), NULL) labels,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_HOST}:${APP_PORT}/moment/images/', f.filename))
         FROM file f
         WHERE f.moment_id = m.id) images
      FROM moment m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN moment_label ml ON ml.moment_id = m.id
      LEFT JOIN label l ON l.id = ml.label_id
      WHERE m.id = ?
      GROUP BY m.id;
    `;
    const [rows] = await pool.execute<RowDataPacket[]>(statement, [id]);
    return rows[0] as MomentDetail | undefined;
  }

  /** 分页列表 */
  async getMomentPageList(offset: number, size: number): Promise<MomentListItem[]> {
    const statement = `
      SELECT
        m.id id, m.content content, m.creatAt createTime, m.updateAt updateTime,
        JSON_OBJECT('id', u.id, 'name', u.name) users,
        (SELECT COUNT(*) FROM comment c WHERE c.moment_id = m.id) commentCounts,
        (SELECT COUNT(*) FROM moment_label ml WHERE ml.moment_id = m.id) labelCounts,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_HOST}:${APP_PORT}/moment/images/', f.filename))
         FROM file f
         WHERE f.moment_id = m.id) images
      FROM moment m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.id DESC
      LIMIT ?, ?;
    `;
    const [rows] = await pool.execute<RowDataPacket[]>(statement, [offset, size]);
    return rows as MomentListItem[];
  }

  /** 修改动态 */
  async update(content: string, momentId: number): Promise<ResultSetHeader> {
    const statement = `UPDATE moment SET content = ? WHERE id = ?;`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [content, momentId]);
    return result;
  }

  /** 删除动态 */
  async remove(momentId: number): Promise<ResultSetHeader> {
    const statement = `DELETE FROM moment WHERE id = ?;`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [momentId]);
    return result;
  }

  /** 动态与标签的关联是否已存在 */
  async hasLabel(momentId: number, labelId: number): Promise<boolean> {
    const statement = `SELECT * FROM moment_label WHERE moment_id = ? AND label_id = ?;`;
    const [rows] = await pool.execute<RowDataPacket[]>(statement, [momentId, labelId]);
    return rows.length > 0;
  }

  /** 建立动态与标签的关联 */
  async addLabels(momentId: number, labelId: number): Promise<ResultSetHeader> {
    const statement = `INSERT INTO moment_label (moment_id, label_id) VALUES (?, ?);`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [momentId, labelId]);
    return result;
  }
}

export default new MomentService();