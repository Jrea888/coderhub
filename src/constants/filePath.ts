import path from 'node:path'

// 上传目录（相对项目根目录，启动时 cwd 需要是项目根）
export const AVATAR_PATH: string = path.resolve(process.cwd(), 'uploads/avatar')
export const PICTURE_PATH: string = path.resolve(process.cwd(), 'uploads/picture')
