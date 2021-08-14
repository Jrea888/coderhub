/*
 * @Description: 验证标签是否存在
 * @Author: zhangweigang
 * @Date: 2021-08-12 10:57:26
 * @LastEditTime: 2021-08-12 11:44:14
 * @LastEditors: zhangweigang
 */
const LabelService = require('../service/label.service');

class LabelMiddleware {
  // 判断标签是否存在
  async verifyLabelExist(ctx, next) {
    // 1.获取参数
    const { labels } = ctx.request.body;
    const newLabels = [];
    for (const name of labels) {
      // 使用标签名称查询标签是否存在
      const labelResult = await LabelService.getLabelName(name); // undefine
      let label = { name };
      if (!labelResult) {
        // 不存在先将标签添加到label表中
        const result = await LabelService.create(name);
        label.id = result.insertId;
      } else {
        label.id = labelResult.id;
      }
      newLabels.push(label);
    }
    // 将添加给动态的标签保存在 labels 属性里面，传给下一个中间件
    ctx.labels = newLabels;
    await next();
  }
}

module.exports = new LabelMiddleware();
