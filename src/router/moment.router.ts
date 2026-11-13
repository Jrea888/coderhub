import Router from '@koa/router'
import momentController from '../controller/moment.controller'
import {verifyAuth, verifyPermission} from '../middleware/auth.middleware'
import {verifyLabelExist} from '../middleware/label.middleware'

const momentRouter = new Router({prefix: '/moment'})

// 发布动态（需要登录）
momentRouter.post('/', verifyAuth, momentController.createMoment)
// 动态分页列表
momentRouter.get('/', momentController.getMomentList)
// 动态详情
momentRouter.get('/:momentId', momentController.getOneMomentDetail)
// 修改 / 删除（需要登录 + 归属校验）
momentRouter.patch('/:momentId', verifyAuth, verifyPermission, momentController.updateMoment)
momentRouter.delete('/:momentId', verifyAuth, verifyPermission, momentController.removeMoment)
// 给动态打标签（labels 为正确拼写，lables 保留兼容）
momentRouter.post('/:momentId/labels', verifyAuth, verifyPermission, verifyLabelExist, momentController.addLabels)
momentRouter.post('/:momentId/lables', verifyAuth, verifyPermission, verifyLabelExist, momentController.addLabels)
// 动态配图
momentRouter.get('/images/:filename', momentController.filePictureInfo)

export default momentRouter
