import mysql from 'mysql2'
import type {Pool} from 'mysql2'
import {MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USER} from './config'

// 连接 MySQL 数据库（连接池）
const pool: Pool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    database: MYSQL_DATABASE,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD
})

// 启动探活：用 query 而不是 getConnection，避免连接不释放
pool.query('SELECT 1', error => {
    if (error) {
        console.log('数据库连接失败！', error.code || error.message)
    } else {
        console.log('数据库连接成功！')
    }
})

// 统一导出 promise 版连接，供 service 层 await 使用
export default pool.promise()
