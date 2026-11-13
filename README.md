# coderhub

基于 **Node.js + Koa + MySQL** 开发的内容社区后端练习项目（coderwhy Node.js 课程「14.项目练习」）：
用户注册登录、发布动态、评论与回复、标签、图片上传。

> 本文档按仓库实际代码整理。技术栈、接口、数据结构均与源码一致；
> 2025-11-13 的一次集中修复记录见第七节。

## 一、技术栈

| 分类 | 技术 | 声明版本 | 作用 |
|---|---|---|---|
| 运行时 | Node.js | — | CommonJS，无 TypeScript、无构建步骤 |
| Web 框架 | **koa** | ^2.13.1 | HTTP 服务、洋葱模型中间件 |
| 路由 | **koa-router** | ^10.0.0 | 每个业务模块一个 Router，用 `prefix` 分组 |
| 请求体解析 | **koa-bodyparser** | ^4.3.0 | 解析 JSON / 表单到 `ctx.request.body` |
| 文件上传 | **koa-multer** | ^1.0.2 | 头像单文件、动态配图多文件，落盘到 `uploads/` |
| 数据库 | **mysql2** | ^2.3.0 | `createPool` 连接池 + `promise()` API，原生 SQL |
| 配置 | **dotenv** | ^10.0.0 | 加载 `.env` 到 `process.env` |
| 开发工具 | **nodemon** | ^2.0.12 | `npm start` 热重启 |
| Node 内置 | `crypto`、`fs`、`path` | — | RS256 签发/验签 token、MD5 摘要、图片流式返回 |

**没有引入**：TypeScript、ORM（手写 SQL）、Jest/测试、ESLint/Prettier、CORS 中间件、参数校验库。

> 说明：token 原来用 `jsonwebtoken@8`，其依赖链在 Node 22+ 上会因 `Buffer.SlowBuffer` 被移除而启动崩溃
> （`jsonwebtoken@8 → jws@3 → jwa@1 → buffer-equal-constant-time`，升级到 v9 仍然命中同一依赖），
> 现已改为 `src/utils/token.js` 基于 `node:crypto` 自实现 RS256，行为与原来一致且零依赖。

## 二、目录结构与职责

```
coderhub/
├── src/
│   ├── main.js                     # 入口：读配置端口并 listen
│   ├── app/
│   │   ├── index.js                # 创建 Koa、最外层异常兜底、bodyParser、动态挂路由、error 监听
│   │   ├── config.js               # dotenv 载入 + 读取 RSA 公私钥 + 默认值
│   │   ├── dataBase.js             # mysql2 连接池 + 启动探活 + 导出 promise 版连接
│   │   ├── errorHandle.js          # 错误常量 → HTTP 状态码 + 中文提示（默认 500）
│   │   └── keys/                   # private.key / public.key（RS256 密钥对）
│   ├── router/                     # 路由层：URL + 方法 → 中间件链 → controller
│   │   ├── index.js                # 动态加载：只 require 本目录的 .js 文件
│   │   ├── auth.router.js          # /login、/test
│   │   ├── user.router.js          # /users
│   │   ├── moment.router.js        # /moment
│   │   ├── comment.router.js       # /comment
│   │   ├── label.router.js         # /label
│   │   └── file.router.js          # /upload
│   ├── middleware/                 # 参数校验、鉴权、权限、上传、标签预处理
│   ├── controller/                 # 取参 → 调 service → 组响应
│   ├── service/                    # 写 SQL、访问数据库
│   ├── constants/
│   │   ├── errorTypes.js           # 业务错误常量
│   │   └── filePath.js             # uploads/avatar、uploads/picture 路径常量
│   └── utils/
│       ├── passwordHandle.js       # MD5 摘要
│       └── token.js                # RS256 JWT 签发 / 校验（node:crypto）
├── uploads/                        # 上传落盘目录（avatar / picture）
├── .env                            # 本地配置（已被 .gitignore 忽略）
└── package.json                    # start / serve 脚本
```

数据流：`请求 → 路由中间件链（校验/鉴权/权限/上传）→ controller → service → MySQL → 响应`。
控制器不写 SQL，service 不碰 `ctx`。

## 三、业务功能与接口

路由通过 `router/index.js` 自动加载：目录下新增 `*.router.js` 即生效（`.txt` 笔记文件会被跳过）。

### 用户与认证

| 方法 | 路径 | 中间件 | 说明 |
|---|---|---|---|
| POST | `/login` | `verifyLogin` | 校验用户名密码，签发 JWT（RS256，24h） |
| GET | `/test` | `verifyAuth` | 测试 token 是否有效 |
| POST | `/users` | `verifyUser` → `handlePassword` | 注册，密码 MD5 后入库 |
| GET | `/users/:userId/avatar` | — | 按用户 id 以流返回头像 |

### 动态（moment）

| 方法 | 路径 | 中间件 | 说明 |
|---|---|---|---|
| POST | `/moment` | `verifyAuth` | 发布动态（content） |
| GET | `/moment?offset=&size=` | — | 分页列表（作者、评论数、标签数、配图） |
| GET | `/moment/:momentId` | — | 单条详情（作者、评论、标签、配图一次聚合） |
| PATCH | `/moment/:momentId` | `verifyAuth` → `verifyPermission` | 修改内容，仅作者 |
| DELETE | `/moment/:momentId` | `verifyAuth` → `verifyPermission` | 删除，仅作者 |
| POST | `/moment/:momentId/labels` | `verifyAuth` → `verifyPermission` → `verifyLabelExist` | 给动态打标签 |
| POST | `/moment/:momentId/lables` | 同上 | 历史拼写，保留兼容 |
| GET | `/moment/images/:filename` | — | 按文件名流式返回配图 |

### 评论

| 方法 | 路径 | 中间件 | 说明 |
|---|---|---|---|
| POST | `/comment` | `verifyAuth` | 发表评论（content、momentId） |
| POST | `/comment/:commentId/reply` | `verifyAuth` | 回复评论（content、momentId） |
| PATCH | `/comment/:commentId` | `verifyAuth` → `verifyPermission` | 修改评论 |
| DELETE | `/comment/:commentId` | `verifyAuth` → `verifyPermission` | 删除评论 |
| GET | `/comment?momentId=` | — | 某条动态下的评论列表 |

### 标签

| 方法 | 路径 | 中间件 | 说明 |
|---|---|---|---|
| POST | `/label` | `verifyAuth` | 新增标签 |
| GET | `/label?limit=&offset=` | — | 标签列表（limit 上限 100，默认 10） |

### 文件上传

| 方法 | 路径 | 中间件 | 说明 |
|---|---|---|---|
| POST | `/upload/avatar` | `verifyAuth` → `avatarHandle` | 头像（字段 `avatar`），写 `avatar` 表并回填 `users.avatar_url` |
| POST | `/upload/picture` | `verifyAuth` → `pictureHandle` | 动态配图（字段 `picture`，最多 9 张，需 `?momentId=`） |

## 四、关键实现点

### 1. 动态加载路由

```js
fs.readdirSync(__dirname)
  .filter((file) => file.endsWith('.js') && file !== 'index.js')
  .sort()
  .forEach((file) => {
    const router = require(path.join(__dirname, file))
    this.use(router.routes())        // this 由 app.useRouters() 隐式绑定到 app
    this.use(router.allowedMethods())
  })
```

### 2. JWT：RS256 非对称签名（`utils/token.js`）

- 登录用**私钥**签发：`crypto.sign('RSA-SHA256', data, PRIVATE_KEY)`；
- 验签用**公钥**：`crypto.verify(...)`，签名不符直接拒绝；
- 额外校验 `header.alg === 'RS256'`，避免 alg 被替换；
- 校验 `exp`，过期返回 401。

```js
signToken({ id, name }, PRIVATE_KEY, { expiresIn: 60 * 60 * 24 }) // 签发
verifyToken(token, PUBLIC_KEY)                                     // 校验，失败抛错
```

### 3. 权限校验

路由参数名以 `Id` 结尾（`:momentId`、`:commentId`），表名由参数名推导，
但**表名必须在白名单内**（`moment`、`comment`），避免任意字符串拼进 SQL：

```js
const tableName = resourceKey.replace(/Id$/, '')
if (!ALLOWED_TABLES.includes(tableName)) → 400
const isPermission = await authService.checkResource(tableName, resourceId, userId)
```

### 4. 错误处理链路

1. 最外层中间件 `try/catch` 捕获所有异常 → `ctx.app.emit('error', err, ctx)`；
2. `app.on('error', errorHandle)` 把错误常量映射成状态码 + 中文提示；
3. 未知异常统一 **500** 并打印堆栈（不再伪装成 404）。

| 错误常量 | 状态码 | 提示 |
|---|---|---|
| `NAME_OR_PASSWORD_IS_REQUIRED` | 400 | 用户名或密码不能为空 |
| `USER_ALREADY_EXISTS` | 409 | 用户名已存在 |
| `CURRENT_USER_NOT_EXISTS` | 400 | 用户名不存在 |
| `CURRENT_USER_PASSWORD_ERROR` | 400 | 用户密码错误 |
| `UNAUTHORIZATION` | 401 | 无效的 token |
| `UNPERMISSION` | **403** | 无权限操作（已认证但无权限） |
| `INVALID_PARAMETERS` | 400 | 请求参数不合法 |
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在 |
| 其他 | 500 | 服务器内部错误 |

### 5. 文件上传与读取

`koa-multer` 的 `diskStorage` 以时间戳命名落盘；元信息入库（`avatar` / `file` 表）；
读取时用 `fs.createReadStream` 作为 `ctx.body` 流式返回，并做 `path.basename` 处理防止路径穿越。

### 6. SQL 聚合避免 N+1

动态详情用一条 SQL 聚合作者、评论、标签、配图（`JSON_OBJECT` / `JSON_ARRAYAGG` + 子查询）。

### 7. 分页

`GET /moment?offset=&size=` → `LIMIT ?, ?`，参数在 controller 里转成数字：`offset >= 0`、`1 <= size <= 100`。

## 五、快速开始

```bash
npm install

# 准备数据库（仓库没有建表脚本，需自行创建）
mysql -u root -p
CREATE DATABASE codetest DEFAULT CHARSET utf8mb4;
```

根据代码中的 SQL 反推，需要这些表（最小字段集，供建表参考）：

| 表 | 关键字段 |
|---|---|
| `users` | id、name、password、avatar_url、createAt、updateAt |
| `moment` | id、content、user_id、creatAt、updateAt |
| `comment` | id、content、moment_id、user_id、comment_id、createAt、updateAt |
| `label` | id、name、createAt、updateAt |
| `moment_label` | moment_id、label_id、createAt、updateAt |
| `avatar` | id、filename、mimtype、size、user_id、createAt、updateAt |
| `file` | id、filename、mimtype、size、user_id、moment_id、createAt、updateAt |

```bash
# 生成 RS256 密钥（src/app/keys 下已有文件可跳过）
openssl genrsa -out src/app/keys/private.key 1024
openssl rsa -in src/app/keys/private.key -pubout -out src/app/keys/public.key

# 按本地 MySQL 修改 .env 后启动
npm start     # nodemon
npm run serve # 只用 node 跑一次
```

启动成功日志：`Koa服务器在8888端口启动成功...`、`数据库连接成功！`。

## 六、环境变量

| 变量 | 示例 | 说明 |
|---|---|---|
| `APP_HOST` | `http://localhost` | 拼接图片/头像的绝对地址 |
| `APP_PORT` | `8888` | 服务端口 |
| `MYSQL_HOST` / `MYSQL_PORT` | `localhost` / `3306` | 数据库地址 |
| `MYSQL_DATABASE` | `codetest` | 库名 |
| `MYSQL_USER` / `MYSQL_PASSWORD` | `root` / `root` | 账号密码（按本地实际修改） |

## 七、修复记录（2025-11-13）

本次集中修复了以下问题，`*.txt` 占位笔记全部保留。

### 启动级问题

| 问题 | 修复 |
|---|---|
| Node 22+ 下服务无法启动：`jsonwebtoken@8` 依赖链用到已移除的 `Buffer.SlowBuffer` | 移除 `jsonwebtoken`，用 `node:crypto` 自实现 RS256 签发/校验（`utils/token.js`） |
| 未捕获异常时 Koa 自带 `onerror` 抢先 `res.end('Internal Server Error')`，`errorHandle` 改不动响应体 | `app/index.js` 增加最外层 `try/catch` 中间件，先转成 error 事件再统一响应 |
| `package.json` 把 koa / mysql2 等运行依赖放在 `devDependencies`，`npm i --production` 装不出来 | 调整依赖分区，新增 `npm run serve` |

### 逻辑 Bug

| 位置 | 问题 | 修复 |
|---|---|---|
| `moment.service` | 配图子查询写成 `WHERE m.user_id = f.moment_id`（会串到同用户其它动态的图片） | 改为 `f.moment_id = m.id`（详情 + 列表两处） |
| `file.service` | `getFileByFilename` 返回数组，controller 当对象用 `fileInfo.mimetype` | 返回 `result[0]`；`getAvatarUserInfo` 同样改为返回单条 |
| `label.service` | SQL 写死 `LIMIT 0,10`，`limit/offset` 参数完全没生效 | 改为 `LIMIT ?, ?` 并转数字 |
| `auth.middleware` | `verifyAuth` 把 `await next()` 包在 try 里，下游异常被误判成"无效 token" | 只把 `jwt.verify` 放 try 内 |
| `errorHandle` | 未知异常默认 404 + NOT FOUND，SQL 错误被伪装成"接口不存在" | 默认改 500 + 打印堆栈 |
| `errorHandle` | `UNPERMISSION` 返回 401，语义上应是 403 | 改为 403 |
| `config.js` | `module.exports = { ... } = process.env` 实际导出的是整个 `process.env`，密钥会被强制转成字符串 | 显式构造配置对象，端口转 Number 并给默认值 |
| `dataBase.js` | `getConnection` 拿到的连接未 `release`，连接池会被占满 | 改用 `pool.query('SELECT 1')` 探活 |
| 所有 service | `try/catch` 后只 `console.log`，异常被吞、接口照样返回 200 | 去掉吞异常，交由统一错误处理返回 500 |
| 所有 controller | 参数缺失时把 `undefined` 传给 SQL，mysql2 直接抛错 | 增加参数校验，返回 400；查不到资源返回 404 |
| `moment.controller` | 图片接口未判空、未防路径穿越 | 判空 + `path.basename` |
| `label.middleware` | `labels` 非数组时 `for...of` 抛 TypeError（500）；重复标签重复入库 | 校验数组、去重、trim |
| `user.middleware` | 请求体为空时解构抛 TypeError | `ctx.request.body || {}` 兜底 |
| `router/index.js` | 用文件名黑名单跳过 `.txt`，新增笔记文件会导致 `require` 失败 | 只加载 `.js` 文件 |
| `moment.router` | 路径拼写 `lables` | 修正为 `labels`，旧路径保留兼容 |
| `user.controller` | 注册直接返回整条 `OkPacket` | 只返回 `{ id, name }` |
| `verifyPermission` | 表名由参数名任意推导，可拼进 SQL | 表名白名单（`moment`/`comment`）+ 数字校验 |

### 仓库与配置

- `.gitignore` 增加 `uploads/`、`src/app/keys/`（私钥与上传内容不应入库；已跟踪的历史文件需手动 `git rm --cached` 才会解除）。

### 验证结果

- 32 个 `.js` 文件 `node --check` 全部通过；
- 服务可正常启动（`Koa服务器在8888端口启动成功...`）；
- 路由行为实测：`GET /nope` → 404、`PUT /login` → 405（`Allow: POST`）、缺参 → 400、无 token → 401、
  非法 id → 400、数据库异常 → 500 且返回统一文案；
- JWT 单测（脚本）：正常签发/校验通过，**篡改载荷**与**过期 token** 均被拒绝；
- 数据库连接被拒（本地 MySQL 凭据与 `.env` 不一致），依赖真实数据的 happy path 未在本机验证。

## 八、剩余待改进

- [ ] 仓库仍没有建表脚本，建议补 `schema.sql`（可一并统一字段命名：`creatAt`/`mimtype` 等拼写）；
- [ ] 密码仍是**无盐 MD5**。改为加盐哈希（scrypt/bcrypt）时会拉长哈希值，
      需要先确认或调整 `users.password` 列长度（建议 `VARCHAR(255)`），否则注册会因超长失败：
      ```sql
      ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL;
      ```
- [ ] `src/app/keys/private.key`、`uploads/*` 已被 Git 跟踪，历史提交中仍存在，建议清理并轮换密钥；
- [ ] 没有 CORS、请求日志、限流、单元测试、ESLint/Prettier；
- [ ] `verifyPermission` 仍依赖"参数名以 Id 结尾"的隐式约定（已加白名单兜底，但改名仍会失效）；
- [ ] `src/**/*.txt` 是 0 字节的占位笔记，按需求保留。