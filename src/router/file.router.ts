import Router from '@koa/router'
import fileController from '../controller/file.controller'
import {verifyAuth} from '../middleware/auth.middleware'
import {avatarHandle} from '../middleware/file.middleware'
import {pictureHandle} from '../middleware/fileMulter.middleware'

const fileRouter = new Router({prefix: '/upload'})

// 头像
fileRouter.post('/avatar', verifyAuth, avatarHandle, fileController.saveAvatarInfo)
// 动态配图（?momentId=）
fileRouter.post('/picture', verifyAuth, pictureHandle, fileController.savePictureInfo)

export default fileRouter
