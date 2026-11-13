/*
 * @Description: 验证标签是否存在，不存在先入库，并把结果挂到 ctx.labels
 * @Author: zhangweigang
 * @Date: 2021-08-12 10:57:26
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const LabelService = require('../service/label.service');
const errorTypes = require('../constants/errorTypes');

class LabelMiddleware {
  async verifyLabelExist(ctx, next) {
    // 1、获取参数（原来直接 for...of，labels 不是数组时抛 TypeError，变成 500）
    const { labels } = ctx.request.body || {};
    if (!Array.isArray(labels)) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    // 2、清洗：只保留非空字符串，并去重（重复标签会让关联表插入重复数据）
    const names = [
      ...new Set(
        labels
          .filter((name) => typeof name === 'string' && name.trim())
          .map((name) => name.trim())
      )
    ];

    // 3、逐个查询/创建标签，收集 { name, id }
    const newLabels = [];
    for (const name of names) {
      const labelResult = await LabelService.getLabelName(name);
      if (labelResult) {
        newLabels.push({ name, id: labelResult.id });
      } else {
        const result = await LabelService.create(name);
        newLabels.push({ name, id: result.insertId });
      }
    }

    // 4、传给下一个中间件（controller 里取 ctx.labels）
    ctx.labels = newLabels;
    await next();
  }
}

module.exports = new LabelMiddleware();