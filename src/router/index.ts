import fs from 'node:fs'
import path from 'node:path'
import type Koa from 'koa'
import type { RouterInstance } from '@koa/router'

const DEFAULT_PATH = __dirname // 当前文件所在目录 router 目录

/**
 * 动态加载路由：只加载与当前入口同后缀的文件
 * - 开发（tsx）时 __filename 是 .ts，加载同目录 *.ts
 * - 构建后（dist）是 .js，加载 *.js
 * 目录里的 *.txt 笔记文件不会被 require
 */
function useRouters(this: Koa): void {
    const ext = path.extname(__filename) // .ts / .js

    fs.readdirSync(DEFAULT_PATH)
        .filter(file => file.endsWith(ext) && !file.endsWith(`.d${ext}`) && file !== `index${ext}`)
        .sort()
        .forEach(file => {
            // 路径拼接
            const fullPath = path.join(DEFAULT_PATH, file)
            const mod = require(fullPath) as {default?: RouterInstance}
            const router = mod.default
            if (!router) {
                throw new Error(`路由文件缺少默认导出：${file}`)
            }
            // this 由 app.useRouters.call(app) 绑定为 app
            this.use(router.routes())
            this.use(router.allowedMethods())
        })
}

export default useRouters
