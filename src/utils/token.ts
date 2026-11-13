import crypto from 'node:crypto';
import type { TokenPayload } from '../types/models';

/**
 * JWT 签发与校验（RS256，基于 node:crypto，无第三方依赖）
 *
 * 不用 jsonwebtoken 的原因：其依赖链 jws → jwa → buffer-equal-constant-time
 * 在 Node 22+ 会因 Buffer.SlowBuffer 被移除而启动崩溃（Node 26 已实测）。
 */
const DEFAULT_EXPIRES_IN = 60 * 60 * 24; // 24 小时（秒）
const ALGORITHM = 'RS256';
const SIGN_ALGORITHM = 'RSA-SHA256';

type Key = Buffer | string;

export interface SignTokenOptions {
  expiresIn?: number;
}

const encode = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString('base64url');

const decode = <T>(value: string): T => JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;

/** 签发 token */
export function signToken(
  payload: Pick<TokenPayload, 'id' | 'name'>,
  privateKey: Key,
  options: SignTokenOptions = {}
): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn || DEFAULT_EXPIRES_IN;

  const header = { alg: ALGORITHM, typ: 'JWT' };
  const body: TokenPayload = { ...payload, iat: now, exp: now + expiresIn };

  const encodedHeader = encode(header);
  const encodedPayload = encode(body);
  const signature = crypto
    .sign(SIGN_ALGORITHM, Buffer.from(`${encodedHeader}.${encodedPayload}`), privateKey)
    .toString('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/** 校验 token，通过返回载荷，否则抛错（由中间件转成 401） */
export function verifyToken(token: string, publicKey: Key): TokenPayload {
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    throw new Error('invalid token format');
  }

  const [encodedHeader, encodedPayload, signature] = token.split('.') as [string, string, string];
  const data = `${encodedHeader}.${encodedPayload}`;

  // 1、验签：公钥验证，签名不符直接拒绝
  const valid = crypto.verify(SIGN_ALGORITHM, Buffer.from(data), publicKey, Buffer.from(signature, 'base64url'));
  if (!valid) {
    throw new Error('invalid token signature');
  }

  // 2、校验算法，避免 alg 被替换
  const header = decode<{ alg?: string }>(encodedHeader);
  if (header.alg !== ALGORITHM) {
    throw new Error('invalid token algorithm');
  }

  // 3、校验过期时间
  const payload = decode<TokenPayload>(encodedPayload);
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error('token expired');
  }

  return payload;
}