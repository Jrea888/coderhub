/*
 * @Description: 主入口文件
 * @Author: zhangweigang
 * @Date: 2021-08-08 23:09:46
 * @LastEditTime: 2021-08-11 09:58:26
 * @LastEditors: zhangweigang
 */
const app = require('./app');
const config = require('./app/config.js');

app.listen(config.APP_PORT, () => {
  console.log(`Koa服务器在${config.APP_PORT}端口启动成功...`);
});
