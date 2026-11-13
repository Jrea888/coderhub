import crypto from 'node:crypto';

/**
 * 密码摘要（MD5）
 *
 * 注意：MD5 无盐、强度不足，仅课程演示使用。
 * 生产应改为 scrypt/bcrypt，并同步调整 users.password 列长度（见 README）。
 */
export default function md5password(password: string): string {
  return crypto.createHash('md5').update(String(password)).digest('hex');
}