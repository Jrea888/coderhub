/*
 * @Description: 动态操作数据库
 * @Author: zhangweigang
 * @Date: 2021-08-10 23:12:45
 * @LastEditTime: 2021-11-13 10:00:00
 * @LastEditors: zhangweigang
 */
const connections = require('../app/dataBase');
const { APP_HOST, APP_PORT } = require('../app/config');

// 注意：service 里不再各自 try/catch 后吞掉异常（原来只 console.log，接口照样返回 200 空数据），
// 让异常向上抛，由 app.on('error') → errorHandle 统一转成 500 并打日志。
class MomentService {
  // 插入一条新动态数据
  async create(userId, content) {
    const statement = `INSERT INTO moment (content, user_id) VALUES (?, ?);`;
    const [result] = await connections.execute(statement, [content, userId]);
    return result;
  }

  // 根据 id 查询某条动态（作者、评论、标签、配图一次聚合返回）
  async getMomentById(id) {
    const statement = `
      SELECT
        m.id, m.content, m.creatAt createTime, m.updateAt updateTime,
        JSON_OBJECT('id', u.id, 'name', u.name) author,
        (SELECT IF(COUNT(c.id),
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', c.id, 'content', c.content, 'commentId', c.comment_id, 'createTime', c.createAt,
                'user', JSON_OBJECT('id', cu.id, 'name', cu.name, 'avatarURL', cu.avatar_url)
              )
            ), NULL)
         FROM comment c
         LEFT JOIN users cu ON c.user_id = cu.id
         WHERE c.moment_id = m.id) comments,
        IF(COUNT(l.id),
          JSON_ARRAYAGG(JSON_OBJECT('id', l.id, 'name', l.name)), NULL) labels,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_HOST}:${APP_PORT}/moment/images/', f.filename))
         FROM file f
         WHERE f.moment_id = m.id) images
      FROM moment m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN moment_label ml ON ml.moment_id = m.id
      LEFT JOIN label l ON l.id = ml.label_id
      WHERE m.id = ?
      GROUP BY m.id;
    `;
    const [result] = await connections.execute(statement, [id]);
    return result[0];
  }

  // 获取动态分页数据
  async getMomentPageList(offset, size) {
    const statement = `
      SELECT
        m.id id, m.content content, m.creatAt createTime, m.updateAt updateTime,
        JSON_OBJECT('id', u.id, 'name', u.name) users,
        (SELECT COUNT(*) FROM comment c WHERE c.moment_id = m.id) commentCounts,
        (SELECT COUNT(*) FROM moment_label ml WHERE ml.moment_id = m.id) labelCounts,
        (SELECT JSON_ARRAYAGG(CONCAT('${APP_HOST}:${APP_PORT}/moment/images/', f.filename))
         FROM file f
         WHERE f.moment_id = m.id) images
      FROM moment m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.id DESC
      LIMIT ?, ?;
    `;
    const [result] = await connections.execute(statement, [offset, size]);
    return result;
  }

  // 修改（更新动态）
  async update(content, momentId) {
    const statement = `UPDATE moment SET content = ? WHERE id = ?;`;
    const [result] = await connections.execute(statement, [content, momentId]);
    return result;
  }

  // 删除动态
  async remove(momentId) {
    const statement = `DELETE FROM moment WHERE id = ?;`;
    const [result] = await connections.execute(statement, [momentId]);
    return result;
  }

  // 判断动态标签关系表中是否已经存在该标签
  async hasLabel(momentId, labelId) {
    const statement = `SELECT * FROM moment_label WHERE moment_id = ? AND label_id = ?;`;
    const [result] = await connections.execute(statement, [momentId, labelId]);
    return result.length > 0;
  }

  // 添加标签和动态的关联关系
  async addLabels(momentId, labelId) {
    const statement = `INSERT INTO moment_label (moment_id, label_id) VALUES (?, ?);`;
    const [result] = await connections.execute(statement, [momentId, labelId]);
    return result;
  }
}

module.exports = new MomentService();