import fs from 'node:fs'
import path from 'node:path'
import koaMulter from '@koa/multer'
import multer from 'multer'
import type {Middleware} from 'koa'
import {AVATAR_PATH} from '../constants/filePath'

// 目录不存在时先创建，避免新环境首次上传报 ENOENT
fs.mkdirSync(AVATAR_PATH, {recursive: true})

const storage = multer.diskStorage({
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`)
    },
    destination: (_req, _file, cb) => {
        cb(null, AVATAR_PATH)
    }
})

/** 单文件上传：字段名 avatar */
export const avatarHandle: Middleware = koaMulter({storage}).single('avatar')
