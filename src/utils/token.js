/*
 * @Description: JWT 签发与校验（RS256，基于 node:crypto，无第三方依赖）
 * @Author: zhangweigang
 * @Date: 2021-11-13 10:00:00
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 *
 * 为什么不用 jsonwebtoken：
 * 该项目原来用 jsonwebtoken@8，依赖链 jws@3 → jwa@1 → buffer-equal-constant-time，
 * 而 buffer-equal-constant-time 在加载时访问 Buffer.SlowBuffer.prototype，
 * Node 22 起已废弃、Node 26 已移除 SlowBuffer，导致服务启动即崩。
 * 升级到 jsonwebtoken@9 仍然走 jws@4 → jwa@2 → 同一个包，无法绕开。
 * 这里用标准库实现最小的 RS256 JWT：header.payload.signature，算法与原来完全一致。
 */
const crypto = require('crypto');

const DEFAULT_EXPIRES_IN = 60 * 60 * 24; // 24 小时（秒）
const ALGORITHM = 'RS256';
const SIGN_ALGORITHM = 'RSA-SHA256';

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

/**
 * 签发 token
 * @param {object} payload 载荷（如 { id, name }）
 * @param {Buffer|string} privateKey RSA 私钥
 * @param {{ expiresIn?: number }} [options]
 */
function signToken(payload, privateKey, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn || DEFAULT_EXPIRES_IN;

  const header = { alg: ALGORITHM, typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + expiresIn };

  const encodedHeader = encode(header);
  const encodedPayload = encode(body);
  const signature = crypto
    .sign(SIGN_ALGORITHM, Buffer.from(`${encodedHeader}.${encodedPayload}`), privateKey)
    .toString('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * 校验 token，通过返回载荷，否则抛错（由中间件转成 401）
 * @param {string} token
 * @param {Buffer|string} publicKey RSA 公钥
 */
function verifyToken(token, publicKey) {
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    throw new Error('invalid token format');
  }

  const [encodedHeader, encodedPayload, signature] = token.split('.');
  const data = `${encodedHeader}.${encodedPayload}`;

  // 1、验签：用公钥验证，签名不符直接拒绝（防止篡改载荷）
  const valid = crypto.verify(
    SIGN_ALGORITHM,
    Buffer.from(data),
    publicKey,
    Buffer.from(signature, 'base64url')
  );
  if (!valid) {
    throw new Error('invalid token signature');
  }

  // 2、校验算法，拒绝 alg 被替换成 none 之类的攻击
  const header = decode(encodedHeader);
  if (header.alg !== ALGORITHM) {
    throw new Error('invalid token algorithm');
  }

  // 3、校验过期时间
  const payload = decode(encodedPayload);
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error('token expired');
  }

  return payload;
}

module.exports = { signToken, verifyToken };