import Router from '@koa/router';
import labelController from '../controller/label.controller';
import { verifyAuth } from '../middleware/auth.middleware';

const labelRouter = new Router({ prefix: '/label' });

labelRouter.post('/', verifyAuth, labelController.create);
labelRouter.get('/', labelController.list);

export default labelRouter;