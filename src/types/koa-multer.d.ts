/**
 * @koa/multer 4.x 没有自带类型声明，这里补充最小可用类型。
 * 选项类型沿用 multer 自己的 Options（通过 storage 等字段传入时会做结构检查）。
 */
declare module '@koa/multer' {
  import type { Middleware } from 'koa';

  interface KoaMulterInstance {
    single(field: string): Middleware;
    array(field: string, maxCount?: number): Middleware;
    fields(fields: ReadonlyArray<{ name: string; maxCount?: number }>): Middleware;
  }

  interface KoaMulterFactory {
    (options?: Record<string, unknown>): KoaMulterInstance;
  }

  const multer: KoaMulterFactory;
  export default multer;
}