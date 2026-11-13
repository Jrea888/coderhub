import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// 将 .env 的变量注入 process.env（按 cwd 找 .env，npm 脚本均在项目根执行）
dotenv.config();

/**
 * 密钥目录
 *
 * tsc 只编译 .ts，不会把 keys/*.key 复制到 dist，所以不能用 __dirname/keys：
 * - 开发：__dirname = src/app        → 上两级 = 项目根
 * - 构建：__dirname = dist/app       → 上两级 = 项目根
 * 统一指向项目根下的 src/app/keys，密钥只保留一份。
 * 也可以用 KEY_DIR 环境变量覆盖（比如部署时挂载密钥）。
 */
const KEY_DIR = process.env.KEY_DIR
  ? path.resolve(process.env.KEY_DIR)
  : path.resolve(__dirname, '..', '..', 'src', 'app', 'keys');

export const PRIVATE_KEY: Buffer = fs.readFileSync(path.join(KEY_DIR, 'private.key'));
export const PUBLIC_KEY: Buffer = fs.readFileSync(path.join(KEY_DIR, 'public.key'));

export const APP_HOST: string = process.env.APP_HOST || 'http://localhost';
export const APP_PORT: number = Number(process.env.APP_PORT) || 8888;

export const MYSQL_HOST: string = process.env.MYSQL_HOST || 'localhost';
export const MYSQL_PORT: number = Number(process.env.MYSQL_PORT) || 3306;
export const MYSQL_DATABASE: string = process.env.MYSQL_DATABASE || 'codetest';
export const MYSQL_USER: string = process.env.MYSQL_USER || 'root';
export const MYSQL_PASSWORD: string = process.env.MYSQL_PASSWORD || '';