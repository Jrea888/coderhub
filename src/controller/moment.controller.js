/*
 * @Description: 动态接口逻辑处理
 * @Author: zhangweigang
 * @Date: 2021-08-10 22:52:45
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const fs = require('fs');
const path = require('path');
const momentService = require('../service/moment.service');
const FileService = require('../service/file.service');
const { PICTURE_PATH } = require('../constants/filePath');
const errorTypes = require('../constants/errorTypes');

const MAX_PAGE_SIZE = 100;

// 统一参数校验：正整数
const toPositiveInt = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

class MomentController {
  // 发表动态
  async createMoment(ctx) {
    const content = (ctx.request.body || {}).content;
    if (typeof content !== 'string' || !content.trim()) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const result = await momentService.create(ctx.user.id, content.trim());
    ctx.body = result;
  }

  // 获取某一条动态详情
  async getOneMomentDetail(ctx) {
    const momentId = toPositiveInt(ctx.params.momentId);
    if (!momentId) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const result = await momentService.getMomentById(momentId);
    if (!result) {
      return ctx.app.emit('error', new Error(errorTypes.RESOURCE_NOT_FOUND), ctx);
    }

    ctx.body = {
      message: '操作成功！',
      data: result,
      status: 200,
      success: true
    };
  }

  // 获取动态分页列表
  async getMomentList(ctx) {
    // offset / size 来自 query，是字符串，必须转数字并限制上限
    const offset = Math.max(Number(ctx.query.offset) || 0, 0);
    const size = Math.min(toPositiveInt(ctx.query.size) || 10, MAX_PAGE_SIZE);

    const result = await momentService.getMomentPageList(offset, size);
    ctx.body = result;
  }

  // 更新某一条动态
  async updateMoment(ctx) {
    const momentId = toPositiveInt(ctx.params.momentId);
    const content = (ctx.request.body || {}).content;

    if (!momentId || typeof content !== 'string' || !content.trim()) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const result = await momentService.update(content.trim(), momentId);
    ctx.body = result;
  }

  // 删除动态
  async removeMoment(ctx) {
    const momentId = toPositiveInt(ctx.params.momentId);
    if (!momentId) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const result = await momentService.remove(momentId);
    ctx.body = result;
  }

  // 给动态添加标签（labels 由 verifyLabelExist 中间件准备好）
  async addLabels(ctx) {
    const momentId = toPositiveInt(ctx.params.momentId);
    const labels = Array.isArray(ctx.labels) ? ctx.labels : [];

    if (!momentId || labels.length === 0) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    // 关系表已存在的不重复插入
    for (const label of labels) {
      const isExist = await momentService.hasLabel(momentId, label.id);
      if (!isExist) {
        await momentService.addLabels(momentId, label.id);
      }
    }

    ctx.body = { message: '给动态添加标签成功~', labels };
  }

  // 动态配图：按文件名读取图片
  async filePictureInfo(ctx) {
    // 只取 basename，防止 ../ 越权读取 uploads 之外的文���
    const filename = path.basename(ctx.params.filename || '');
    if (!filename) {
      return ctx.app.emit('error', new Error(errorTypes.INVALID_PARAMETERS), ctx);
    }

    const fileInfo = await FileService.getFileByFilename(filename);
    if (!fileInfo) {
      return ctx.app.emit('error', new Error(errorTypes.RESOURCE_NOT_FOUND), ctx);
    }

    ctx.set('content-type', fileInfo.mimtype);
    ctx.body = fs.createReadStream(path.join(PICTURE_PATH, filename));
  }
}

module.exports = new MomentController();