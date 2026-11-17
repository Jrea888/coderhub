import crypto from 'node:crypto'

/**
 * 密码哈希（scrypt + 随机盐）
 *
 * 存储格式：scrypt$N$r$p$salt$hash（salt/hash 为 base64url）
 * - 参数写进字符串，以后调整 N/r/p 也不会让老密码失效；
 * - 每个用户独立随机盐，防彩虹表；
 * - scrypt 故意慢且吃内存，暴力破解成本远高于 MD5。
 *
 * 兼容历史数据：库里 32 位十六进制的旧 MD5 仍可校验通过，
 * 登录成功后由 verifyLogin 自动升级为 scrypt（见 auth.middleware）。
 */
const PREFIX = 'scrypt'
const KEY_LENGTH = 64
const SALT_LENGTH = 16
const SCRYPT_PARAMS = {N: 16384, r: 8, p: 1} as const
const LEGACY_MD5 = /^[a-f0-9]{32}$/i

/** 生成密码哈希 */
export function hashPassword(plain: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH)
    const derived = crypto.scryptSync(String(plain), salt, KEY_LENGTH, SCRYPT_PARAMS)
    return [
        PREFIX,
        SCRYPT_PARAMS.N,
        SCRYPT_PARAMS.r,
        SCRYPT_PARAMS.p,
        salt.toString('base64url'),
        derived.toString('base64url')
    ].join('$')
}

/** 校验密码：支持 scrypt（当前）与 32 位 MD5（历史数据） */
export function verifyPassword(plain: string, stored: string): boolean {
    if (typeof stored !== 'string' || stored.length === 0) return false

    if (stored.startsWith(`${PREFIX}$`)) {
        return verifyScrypt(plain, stored)
    }

    // 兼容老数据：早期用户是裸 MD5
    if (LEGACY_MD5.test(stored)) {
        return safeEqual(md5Hex(plain), stored)
    }

    return false
}

/** 是否需要重新哈希（历史 MD5 或 scrypt 参数已升级） */
export function needsRehash(stored: string): boolean {
    if (typeof stored !== 'string' || stored.length === 0) return true
    if (LEGACY_MD5.test(stored)) return true
    if (!stored.startsWith(`${PREFIX}$`)) return true

    const [, n, r, p] = stored.split('$')
    return Number(n) !== SCRYPT_PARAMS.N || Number(r) !== SCRYPT_PARAMS.r || Number(p) !== SCRYPT_PARAMS.p
}

function verifyScrypt(plain: string, stored: string): boolean {
    const parts = stored.split('$')
    if (parts.length !== 6) return false

    const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts
    if (!saltRaw || !hashRaw) return false

    const N = Number(nRaw)
    const r = Number(rRaw)
    const p = Number(pRaw)
    if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false

    const salt = Buffer.from(saltRaw, 'base64url')
    const expected = Buffer.from(hashRaw, 'base64url')
    if (salt.length === 0 || expected.length === 0) return false

    const derived = crypto.scryptSync(String(plain), salt, expected.length, {N, r, p})
    return crypto.timingSafeEqual(derived, expected)
}

function md5Hex(plain: string): string {
    return crypto.createHash('md5').update(String(plain)).digest('hex')
}

function safeEqual(actual: string, expected: string): boolean {
    const a = Buffer.from(actual)
    const b = Buffer.from(expected)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
}
