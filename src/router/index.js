/*
 * @Description: 动态加载路由
 * @Author: zhangweigang
 * @Date: 2021-08-09 22:15:54
 * @LastEditTime: 2021-08-09 22:44:20
 * @LastEditors: zhangweigang
 */
const fs = require('fs');

const useRouters = function () {
  fs.readdirSync(__dirname).forEach((file) => {
    if (file === 'index.js' || file === '系统接口路径-路由.txt') return;
    const router = require(`./${file}`);
    // (app) this的隐式绑定
    this.use(router.routes());
    this.use(router.allowedMethods());
  });
};

module.exports = useRouters;
