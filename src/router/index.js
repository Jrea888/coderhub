/*
 * @Description: 动态加载路由
 * @Author: zhangweigang
 * @Date: 2021-08-09 22:15:54
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const fs = require('fs');
const path = require('path');

/**
 * 只加载 .js 路由文件
 *
 * 原实现用"文件名黑名单"跳过 index.js 和一个具体的中文 txt 文件名，
 * 目录里再新增任何笔记类文件都会导致 require 失败并让服务起不来。
 */
const useRouters = function () {
  fs.readdirSync(__dirname)
    .filter((file) => file.endsWith('.js') && file !== 'index.js')
    .sort()
    .forEach((file) => {
      const router = require(path.join(__dirname, file));
      // (app) this 的隐式绑定
      this.use(router.routes());
      this.use(router.allowedMethods());
    });
};

module.exports = useRouters;