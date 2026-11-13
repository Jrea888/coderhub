import type {Context} from 'koa'

/**
 * 取 JSON 请求体
 *
 * koa-bodyparser 把解析结果放在 ctx.request.body，类型是 unknown；
 * 这里统一收窄成 Partial<T>，由调用方做字段级校验。
 */
export function getBody<T extends object>(ctx: Context): Partial<T> {
    const body = (ctx.request as {body?: unknown}).body
    return (body && typeof body === 'object' && !Array.isArray(body) ? body : {}) as Partial<T>
}

/** 转正整数，非法返回 null */
export function toPositiveInt(value: unknown): number | null {
    const num = Number(value)
    return Number.isInteger(num) && num > 0 ? num : null
}

/** 转非负整数，非法返回 fallback */
export function toNonNegativeInt(value: unknown, fallback = 0): number {
    const num = Number(value)
    return Number.isInteger(num) && num >= 0 ? num : fallback
}

/** 统一抛出业务错误（交给 app.on('error') 处理） */
export function emitError(ctx: Context, type: string): void {
    ctx.app.emit('error', new Error(type), ctx)
}
