/*
 * @Description:标签逻辑处理
 * @Author: zhangweigang
 * @Date: 2021-08-12 09:43:52
 * @LastEditTime: 2021-08-12 10:14:36
 * @LastEditors: zhangweigang
 */
const LabelService = require('../service/label.service');
class LabelController {
  async create(ctx, next) {
    // 1.获取参数
    const { name } = ctx.request.body;
    // 2. 添加标签
    const result = await LabelService.create(name);
    ctx.body = result;
  }

  // 获取标签
  async list(ctx, next) {
    // 1.获取参数
    const { limit, offset } = ctx.query;
    // 2. 添加标签
    const result = await LabelService.getLabelList(limit, offset);
    ctx.body = result;
  }
}

module.exports = new LabelController();
