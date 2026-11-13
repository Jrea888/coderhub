/*
 * @Description: 标签逻辑处理
 * @Author: zhangweigang
 * @Date: 2021-08-12 09:43:52
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const LabelService = require('../service/label.service');
const errorTypes = require('../constants/errorTypes');

class LabelController {
  async create(ctx) {
    const { name } = ctx.request.body || {};
    if (typeof name !== 'string' || !name.trim()) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const result = await LabelService.create(name.trim());
    ctx.body = result;
  }

  // 获取标签列表
  async list(ctx) {
    // limit / offset 是字符串，转数字并限制上限，避免传入非法值
    const limit = Math.min(Number(ctx.query.limit) > 0 ? Number(ctx.query.limit) : 10, 100);
    const offset = Math.max(Number(ctx.query.offset) || 0, 0);

    const result = await LabelService.getLabelList(limit, offset);
    ctx.body = result;
  }
}

module.exports = new LabelController();