import type {ResultSetHeader, RowDataPacket} from 'mysql2'
import pool from '../app/dataBase'
import type {LabelRow} from '../types/models'

class LabelService {
    /** 新增标签 */
    async create(name: string): Promise<ResultSetHeader> {
        const statement = `INSERT INTO label (name) VALUES (?);`
        const [result] = await pool.execute<ResultSetHeader>(statement, [name])
        return result
    }

    /** 标签列表 */
    async getLabelList(limit = 10, offset = 0): Promise<LabelRow[]> {
        const statement = `SELECT * FROM label ORDER BY id ASC LIMIT ?, ?;`
        const [rows] = await pool.execute<RowDataPacket[]>(statement, [offset, limit])
        return rows as LabelRow[]
    }

    /** 按名称查询标签 */
    async getLabelName(labelName: string): Promise<LabelRow | undefined> {
        const statement = `SELECT * FROM label WHERE name = ? LIMIT 1;`
        const [rows] = await pool.execute<RowDataPacket[]>(statement, [labelName])
        return rows[0] as LabelRow | undefined
    }
}

export default new LabelService()
