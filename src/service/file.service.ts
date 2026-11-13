import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../app/dataBase';
import type { AvatarRow, FileRow } from '../types/models';

class FileService {
  /** 保存头像元信息 */
  async createAvatar(filename: string, mimetype: string, size: number, userId: number): Promise<ResultSetHeader> {
    const statement = `INSERT INTO avatar (filename, mimtype, size, user_id) VALUES (?, ?, ?, ?);`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [filename, mimetype, size, userId]);
    return result;
  }

  /** 取用户最新头像 */
  async getAvatarUserInfo(userId: number): Promise<AvatarRow | undefined> {
    const statement = `SELECT * FROM avatar WHERE user_id = ? ORDER BY id DESC LIMIT 1;`;
    const [rows] = await pool.execute<RowDataPacket[]>(statement, [userId]);
    return rows[0] as AvatarRow | undefined;
  }

  /** 保存动态配图元信息 */
  async createPicture(
    filename: string,
    mimetype: string,
    size: number,
    userId: number,
    momentId: number
  ): Promise<ResultSetHeader> {
    const statement = `INSERT INTO file (filename, mimtype, size, user_id, moment_id) VALUES (?, ?, ?, ?, ?);`;
    const [result] = await pool.execute<ResultSetHeader>(statement, [filename, mimetype, size, userId, momentId]);
    return result;
  }

  /** 按文件名取图片元信息 */
  async getFileByFilename(filename: string): Promise<FileRow | undefined> {
    const statement = `SELECT * FROM file WHERE filename = ? LIMIT 1;`;
    const [rows] = await pool.execute<RowDataPacket[]>(statement, [filename]);
    return rows[0] as FileRow | undefined;
  }
}

export default new FileService();