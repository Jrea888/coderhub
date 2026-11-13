import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import useRouters from '../router/index';
import errorHandle from './errorHandle';

const app = new Koa();

// 最外层异常兜底：先捕获，再转成 error 事件交给 errorHandle。
// 否则 koa 自带的 ctx.onerror 会抢先 res.end('Internal Server Error')，body 无法定制。
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.app.emit('error', error as Error, ctx);
  }
});

// 解析 body
app.use(bodyParser());

// 动态加载路由（this 指向 app）
useRouters.call(app);

// 统一错误处理
app.on('error', errorHandle);

export default app;