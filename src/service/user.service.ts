import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../app/dataBase';
import type { PublicUser, UserRow } from '../types/models';

class UserService {
  /** 注册用户，返回可安全外传的字段 */
  async create(user: { name: string; password: string }): Promise<PublicUser> {
    const statement = `INSERT INTO users (name, password) VALUES (?, ?);`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [user.name, user.password]);
    return { id: result.insertId, name: user.name };
  }

  /** 按用户名查询（重名校验 / 登录校验） */
  async getUserName(name: string): Promise<UserRow[]> {
    const statement = `SELECT * FROM users WHERE name = ? LIMIT 1;`;
    const [rows] = await pool.execute<RowDataPacket[]>(statement, [name]);
    return rows as UserRow[];
  }

  /** 更新用户头像地址 */
  async updateAvatarUrlById(avatarUrl: string, id: number): Promise<ResultSetHeader> {
    const statement = `UPDATE users SET avatar_url = ? WHERE id = ?;`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [avatarUrl, id]);
    return result;
  }
}

export default new UserService();