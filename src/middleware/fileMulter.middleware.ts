import fs from 'node:fs';
import path from 'node:path';
import koaMulter from '@koa/multer';
import multer from 'multer';
import type { Middleware } from 'koa';
import { PICTURE_PATH } from '../constants/filePath';

fs.mkdirSync(PICTURE_PATH, { recursive: true });

const storage = multer.diskStorage({
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
  destination: (_req, _file, cb) => {
    cb(null, PICTURE_PATH);
  }
});

/** 多文件上传：字段名 picture，最多 9 张 */
export const pictureHandle: Middleware = koaMulter({ storage }).array('picture', 9);