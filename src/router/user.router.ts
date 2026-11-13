import Router from '@koa/router'
import userController from '../controller/user.controller'
import {handlePassword, verifyUser} from '../middleware/user.middleware'

const userRouter = new Router({prefix: '/users'})

// 注册
userRouter.post('/', verifyUser, handlePassword, userController.create)
// 用户头像
userRouter.get('/:userId/avatar', userController.userAvatarInfo)

export default userRouter
