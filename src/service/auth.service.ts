import type { RowDataPacket } from 'mysql2';
import pool from '../app/dataBase';

/** 允许做归属校验的表（白名单，避免任意字符串拼进 SQL） */
export type ResourceTable = 'moment' | 'comment';

class AuthService {
  /** 查询这条资源是否属于当前用户 */
  async checkResource(tableName: ResourceTable, resourceId: number, userId: number): Promise<boolean> {
    const statement = `SELECT id FROM ${tableName} WHERE id = ? AND user_id = ? LIMIT 1;`;
    const [rows] = await pool.execute<RowDataPacket[]>(statement, [resourceId, userId]);
    return rows.length > 0;
  }
}

export default new AuthService();