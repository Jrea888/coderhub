/*
 * @Description: 动态接口逻辑处理
 * @Author: zhangweigang
 * @Date: 2021-08-10 22:52:45
 * @LastEditTime: 2021-08-13 22:44:50
 * @LastEditors: zhangweigang
 */
const fs = require('fs');
const momentService = require('../service/moment.service');
const FileService = require('../service/file.service');
const { PICTURE_PATH } = require('../constants/filePath');

class MomentController {
  // 发表动态
  async createMoment(ctx, next) {
    const id = ctx.user.id;
    const content = ctx.request.body.content;
    const result = await momentService.create(id, content);
    ctx.body = result;
  }

  // 获取某一条动态详情
  async getOneMomentDetail(ctx, next) {
    // 1、获取数据(id)
    const id = ctx.params.momentId;
    try {
      // 2、根据id查询对应的动态
      const result = await momentService.getMomentById(id);
      ctx.body = {
        message: '操作成功！',
        data: result,
        status: 200,
        success: true
      };
    } catch (error) {
      console.log(error);
    }
  }

  // 获取动态分页列表数据
  async getMomentList(ctx, next) {
    // 1、获取参数
    const { offset, size } = ctx.query;
    try {
      // 2、分页查询数据
      const result = await momentService.getMomentPageList(offset, size);
      ctx.body = result;
    } catch (error) {
      console.log(error);
    }
  }

  // 更新某一条动态信息
  async updateMoment(ctx, next) {
    // 1、获取参数
    const { content } = ctx.request.body;
    const { momentId } = ctx.params;
    try {
      // 2、更新数据
      const result = await momentService.update(content, momentId);
      ctx.body = result;
    } catch (error) {
      console.log(error);
    }
  }

  // 删除动态 根据id
  async removeMoment(ctx, next) {
    // 1、获取参数
    const { momentId } = ctx.params;
    try {
      // 2、删除动态
      const result = await momentService.remove(momentId);
      ctx.body = result;
    } catch (error) {
      console.log(error);
    }
  }

  // 给动态添加标签
  async addLabels(ctx, next) {
    // 1.获取标签和动态id
    const { labels } = ctx;
    const { momentId } = ctx.params;
    console.log(labels, momentId);
    // 2.判断动态标签关系表中是否已经存在标签
    for (const label of labels) {
      const isExist = await momentService.hasLabel(momentId, label.id);
      if (!isExist) {
        // 如果不存在 将标签添加给动态上，并在表中添加关联关系
        await momentService.addLabels(momentId, label.id);
      }
    }
    ctx.body = '给动态添加标签成功~';
  }

  // 动态配图处理逻辑：将数据库中查询到的图片名称与项目目录所存在的图片的名称对比，有就显示图片
  async filePictureInfo(ctx, next) {
    const { filename } = ctx.params;
    const fileInfo = await FileService.getFileByFilename(filename);

    ctx.response.set('content-type', fileInfo.mimetype);
    ctx.body = fs.createReadStream(`${PICTURE_PATH}/${filename}`);
  }
}

module.exports = new MomentController();
