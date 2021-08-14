/*
 * @Description: 数据接口的中间件的注册
 * @Author: zhangweigang
 * @Date: 2021-08-09 08:34:37
 * @LastEditTime: 2021-08-09 22:41:56
 * @LastEditors: zhangweigang
 */
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const errorHandle = require('./errorHandle');
const useRouters = require('../router/index');

const app = new Koa();

// 动态加载路由
app.useRouters = useRouters;

// 解析 body 数据格式
app.use(bodyParser());
app.useRouters();
// 监听错误并处理
app.on('error', errorHandle);

module.exports = app;
