/*
 * @Description: 动态操作数据库
 * @Author: zhangweigang
 * @Date: 2021-08-10 23:12:45
 * @LastEditTime: 2021-08-13 22:48:43
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');
const { APP_HOST, APP_PORT } = require('../app/config');

class MomentService {
  // 插入一条新动态数据
  async create(userId, content) {
    try {
      const statement = `INSERT INTO moment (content,user_id) VALUES(?,?);`;
      const [result] = await connections.execute(statement, [content, userId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 根据id查询某条动态
  async getMomentById(id) {
    try {
      const statement = `
        SELECT
          m.id,m.content,m.creatAt createTime,m.updateAt updataTime,
            JSON_OBJECT('id',u.id,'name',u.name) author,
          (SELECT IF(COUNT(c.id),
              JSON_ARRAYAGG(
                JSON_OBJECT('id',c.id,'content',c.content,'commentId',c.comment_id,'creatTime',c.createAt,'user',JSON_OBJECT('id',cu.id,'name',cu.name,'avatarURL',cu.avatar_url))
          ),NULL) FROM comment c LEFT JOIN users cu ON c.user_id = cu.id WHERE c.moment_id = m.id) comments,
          IF(COUNT(l.id),
            JSON_ARRAYAGG(
              JSON_OBJECT('id',l.id,'name',l.name)
            ),NULL) labels,
          (SELECT JSON_ARRAYAGG(CONCAT('${APP_HOST}:${APP_PORT}/moment/images/',f.filename))
          FROM file f WHERE m.user_id = f.moment_id) images
        FROM moment m
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN moment_label ml ON ml.moment_id = m.id
        LEFT JOIN label l ON l.id = ml.label_id
        WHERE m.id = ?
        GROUP BY m.id;
      `;
      const [result] = await connections.execute(statement, [id]);
      return result[0];
    } catch (error) {
      console.log(error);
    }
  }

  // 获取动态分页数据
  async getMomentPageList(offset, size) {
    try {
      const statement = `
      SELECT
        m.id id,m.content content,m.creatAt createTime,m.updateAt updataTime,
        JSON_OBJECT('id',u.id,'name',u.name) users,
	      (SELECT COUNT(*) FROM comment c WHERE c.moment_id = m.id) commentCounts,
      	(SELECT COUNT(*) FROM moment_label ml WHERE ml.moment_id = m.id) labelCounts,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_HOST}:${APP_PORT}/moment/images/',f.filename))
        FROM file f WHERE m.user_id = f.moment_id) images
      FROM moment m
      LEFT JOIN users u ON m.user_id = u.id
      LIMIT ?,?;
    `;
      const [result] = await connections.execute(statement, [offset, size]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 修改(更新动态)
  async update(content, momentId) {
    try {
      const statement = `UPDATE moment SET content = ? WHERE moment.id = ?;`;
      const [result] = await connections.execute(statement, [content, momentId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 删除动态
  async remove(momentId) {
    try {
      const statement = `DELETE FROM moment WHERE id = ?`;
      const [result] = await connections.execute(statement, [momentId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // 判断动态标签关系表中是否已经存在标签
  async hasLabel(momentId, labelId) {
    try {
      const statement = `SELECT * FROM moment_label WHERE moment_id = ? AND label_id = ?;`;
      const [result] = await connections.execute(statement, [momentId, labelId]);
      return result[0] ? true : false;
    } catch (error) {
      console.log(error);
    }
  }

  // 添加标签和动态的关联关系
  async addLabels(momentId, labelId) {
    try {
      const statement = `INSERT INTO moment_label (moment_id,label_id) VALUES (?,?);`;
      const [result] = await connections.execute(statement, [momentId, labelId]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new MomentService();
