/*
 * @Description: 数据接口的中间件的注册
 * @Author: zhangweigang
 * @Date: 2021-08-09 08:34:37
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const errorHandle = require('./errorHandle');
const useRouters = require('../router/index');

const app = new Koa();

// 最外层异常兜底（必须放在所有中间件之前）
//
// 为什么需要它：koa 自带的 ctx.onerror 在捕获到未处理异常时，会直接把响应
// res.end('Internal Server Error')，之后再改 ctx.body 已经来不及；
// 这里先 try/catch，把异常转成 error 事件，让 errorHandle 在响应发出前
// 统一设置状态码和提示（同时保留日志）。
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.app.emit('error', error, ctx);
  }
});

// 解析 body 数据格式
app.use(bodyParser());

// 动态加载路由
app.useRouters = useRouters;
app.useRouters();

// 监听错误并处理
app.on('error', errorHandle);

module.exports = app;