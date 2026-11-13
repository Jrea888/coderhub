import Router from '@koa/router';
import loginController from '../controller/login.controller';
import { verifyAuth, verifyLogin } from '../middleware/auth.middleware';

const authRouter = new Router();

// 登录
authRouter.post('/login', verifyLogin, loginController.login);
// 测试 token 是否有效
authRouter.get('/test', verifyAuth, loginController.success);

export default authRouter;