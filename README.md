# coderhub

基于 **Node.js + Koa 3 + TypeScript + MySQL** 的内容社区后端。

提供用户注册登录、发布动态、评论与回复、标签、头像与配图上传等能力，是一个完整的 REST 风格后端练习项目：全量 TypeScript、原生 SQL（无 ORM）、自研 JWT 签发验签。

> 当前分支 `feature/ts-koa3`：由 **Koa 2 + JavaScript** 迁移至 **Koa 3 + TypeScript**。
> 原 JS 实现保留在 `main` 分支，迁移对照见 [§10 迁移记录](#十迁移记录koa-2--js--koa-3--ts)。

---

## 目录

- [一、功能一览](#一功能一览)
- [二、技术栈](#二技术栈)
- [三、快速开始](#三快速开始)
- [四、目录结构](#四目录结构)
- [五、架构与请求流转](#五架构与请求流转)
- [六、接口文档](#六接口文档)
- [七、关键设计](#七关键设计)
- [八、数据库设计](#八数据库设计)
- [九、脚本与环境变量](#九脚本与环境变量)
- [十、迁移记录（Koa 2 + JS → Koa 3 + TS）](#十迁移记录koa-2--js--koa-3--ts)
- [十一、验证结果](#十一验证结果)
- [十二、已知问题与改进方向](#十二已知问题与改进方向)

---

## 一、功能一览

| 模块 | 能力 |
|---|---|
| 用户 | 注册（重名校验）、登录、JWT 校验、头像读取 |
| 动态 | 发布、分页列表、详情聚合（作者/评论/标签/配图）、修改、删除 |
| 评论 | 发表、回复、列表、修改、删除 |
| 标签 | 新增、列表、给动态打标签（自动去重、复用已有标签） |
| 文件 | 头像单文件上传、动态配图多文件上传（≤ 9 张）、按 URL 读取 |
| 鉴权 | RS256 签发/验签、资源归属校验（仅作者可改删） |

---

## 二、技术栈

| 分类 | 技术 | 版本 | 作用 |
|---|---|---|---|
| 语言 | TypeScript | 7.0.2 | 全量 TS，`strict: true`，`module: nodenext` |
| 运行时 | Node.js | ≥ 18（实测 26.10.0） | Koa 3 要求 Node ≥ 18 |
| 运行器 | tsx | 4.23.15 | 直接运行 `.ts`，`--watch` 替代 nodemon |
| Web 框架 | koa | 3.3.0 | 仅支持 async 中间件 |
| 路由 | @koa/router | 15.7.1 | 每个模块一个 Router，`prefix` 分组 |
| 请求体 | koa-bodyparser | 4.4.1 | JSON → `ctx.request.body` |
| 文件上传 | @koa/multer + multer | 4.0.0 / 2.5.0 | 头像单文件、配图多文件 |
| 数据库 | mysql2 | 3.24.6 | 连接池 + `promise()`，原生 SQL |
| 配置 | dotenv | 17.4.2 | `.env` → `process.env` |
| 认证 | `node:crypto` | 内置 | RS256 签发/验签，零第三方依赖 |

**未引入**：ORM（手写 SQL）、Jest、ESLint/Prettier、CORS 中间件、日志与限流。

两个有意的取舍：

- **不用 `jsonwebtoken`**：其依赖链 `jws → jwa → buffer-equal-constant-time` 在 Node 22+ 会因 `Buffer.SlowBuffer` 被移除而启动崩溃（Node 26 实测），因此用 `node:crypto` 约 70 行实现签发与校验。原库的用法、升级验证与替代方案对比见 [§7.2.1](#21-为什么移除-jsonwebtoken当前方案nodecrypto)。
- **不用 `ts-node`**：ts-node 10 与 TypeScript 7 不兼容，改用 `tsx`。

---

## 三、快速开始

### 前置条件

- Node.js ≥ 18
- MySQL ≥ 5.7.22（详情聚合用到 `JSON_ARRAYAGG`；实测 MySQL 8.4）

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 建库建表（7 张表，含外键与索引）
mysql -u root -p < db/schema.sql

# 3. 配置环境变量
cp .env.example .env        # Windows: copy .env.example .env
#   修改 MYSQL_USER / MYSQL_PASSWORD 为本机凭据

# 4. 启动
npm run dev                 # tsx watch，改代码自动重启
```

启动成功后控制台输出：

```
Koa服务器在8888端口启动成功...
数据库连接成功！
```

若数据库连不上会打印 `数据库连接失败！ ER_ACCESS_DENIED_ERROR`，服务仍会监听端口，但所有查询接口会返回 500 —— 先修 `.env` 再调用。

### 冒烟测试

```bash
# 注册
curl -X POST http://localhost:8888/users \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"alice\",\"password\":\"123456\"}"

# 登录（拿 token）
curl -X POST http://localhost:8888/login \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"alice\",\"password\":\"123456\"}"

# 带 token 发布动态
curl -X POST http://localhost:8888/moment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d "{\"content\":\"Hello coderhub\"}"
```

---

## 四、目录结构

```
coderhub/
├── db/
│   └── schema.sql                 # 建库建表脚本（7 张表，含外键/索引）
├── src/
│   ├── main.ts                    # 入口：监听 APP_PORT
│   ├── app/
│   │   ├── index.ts               # Koa 实例：异常兜底 → bodyParser → 挂路由 → error 监听
│   │   ├── config.ts              # dotenv + 密钥读取 + 默认值
│   │   ├── dataBase.ts            # mysql2 连接池（导出 promise 版）
│   │   ├── errorHandle.ts         # 错误常量 → HTTP 状态码 + 中文文案
│   │   └── keys/                  # private.key / public.key（RS256）
│   ├── router/                    # 6 个路由文件 + 动态加载入口 index.ts
│   ├── middleware/                # 鉴权、注册校验、标签预处理、multer
│   ├── controller/                # 参数校验 + 调 service + 组响应
│   ├── service/                   # SQL 与数据访问（带类型）
│   ├── constants/
│   │   ├── errorTypes.ts          # 业务错误常量（as const）
│   │   └── filePath.ts            # AVATAR_PATH / PICTURE_PATH
│   ├── utils/
│   │   ├── token.ts               # RS256 JWT 签发/验签
│   │   ├── passwordHandle.ts      # MD5 摘要
│   │   └── request.ts             # getBody / toPositiveInt / emitError
│   └── types/
│       ├── models.ts              # 表行类型、DTO、JWT 载荷
│       ├── koa.d.ts               # 扩展 ctx.state.user / labels、ctx.file / files
│       └── koa-multer.d.ts        # @koa/multer 类型补齐
├── uploads/                       # 运行期上传产物（avatar/ picture/）
├── tsconfig.json                  # strict + nodenext，输出 dist
├── .env.example                   # 环境变量模板
└── package.json                   # dev / start / build / typecheck / serve
```

分层职责：

| 层 | 职责 | 不做的事 |
|---|---|---|
| `router` | 声明路径与中间件链 | 不含业务逻辑 |
| `middleware` | 跨接口的通用校验（登录态、归属、标签预处理） | 不写 SQL |
| `controller` | 参数校验、调用 service、组装响应 | 不写 SQL |
| `service` | 只写 SQL、返回带类型的行 | **不 try/catch 吞异常** |

`src/**/*.txt` 为 0 字节占位文件，记录"该写什么"的笔记，不参与构建（路由动态加载只匹配 `.ts`/`.js`）。

---

## 五、架构与请求流转

```
HTTP 请求
   │
   ├─ 异常兜底中间件（try/catch → emit 'error'）
   ├─ koa-bodyparser（JSON → ctx.request.body）
   ├─ @koa/router 匹配路由
   │     └─ 中间件链（verifyAuth → verifyPermission → …）
   ├─ controller（校验参数、组装响应）
   ├─ service（执行 SQL）
   └─ mysql2 连接池（promise 版）
```

应用装配只有 4 步（`src/app/index.ts`）：

```ts
app.use(异常兜底);          // 必须放最外层
app.use(bodyParser());
useRouters.call(app);      // 动态加载 router/*.ts
app.on('error', errorHandle);
```

路由是**按目录自动注册**的，新增一个 `xxx.router.ts` 并默认导出 Router 即可生效：

```ts
const ext = path.extname(__filename);        // 开发 .ts / 构建 .js
fs.readdirSync(__dirname)
  .filter((file) => file.endsWith(ext) && !file.endsWith(`.d${ext}`) && file !== `index${ext}`)
  .sort()
  .forEach((file) => {
    const router = require(path.join(__dirname, file)).default;
    this.use(router.routes());
    this.use(router.allowedMethods());
  });
```

---

## 六、接口文档

统一约定：

- 请求体为 JSON，需带 `Content-Type: application/json`；上传接口为 `multipart/form-data`。
- 需要登录的接口带 `Authorization: Bearer <token>`（`Bearer` 前缀大小写不敏感）。
- 错误响应为**纯文本**中文提示，状态码由错误类型决定（见 [错误码表](#错误码表)）。

### 6.1 用户与认证

| 方法 | 路径 | 中间件链 | 说明 |
|---|---|---|---|
| POST | `/users` | `verifyUser` → `handlePassword` | 注册，密码 MD5 后入库 |
| POST | `/login` | `verifyLogin` | 登录，返回 JWT |
| GET | `/test` | `verifyAuth` | 校验 token 是否有效 |
| GET | `/users/:userId/avatar` | — | 以流返回最新头像 |

**POST /users**

```json
// 请求
{ "name": "alice", "password": "123456" }
// 成功 200
{ "id": 1, "name": "alice", "message": "注册成功" }
```

**POST /login**

```json
// 成功 200
{ "id": 1, "name": "alice", "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**GET /test** → `200 授权成功~`（纯文本）

### 6.2 动态

| 方法 | 路径 | 中间件链 | 说明 |
|---|---|---|---|
| POST | `/moment` | `verifyAuth` | 发布动态，返回 `ResultSetHeader` |
| GET | `/moment?offset=&size=` | — | 分页列表，`size` 默认 10、上限 100 |
| GET | `/moment/:momentId` | — | 详情（作者/评论/标签/配图一次聚合） |
| PATCH | `/moment/:momentId` | `verifyAuth` → `verifyPermission` | 修改，仅作者 |
| DELETE | `/moment/:momentId` | `verifyAuth` → `verifyPermission` | 删除，仅作者 |
| POST | `/moment/:momentId/labels` | `verifyAuth` → `verifyPermission` → `verifyLabelExist` | 打标签 |
| POST | `/moment/:momentId/lables` | 同上 | 历史拼写兼容路径 |
| GET | `/moment/images/:filename` | — | 读取配图（`path.basename` 防穿越） |

**GET /moment** 返回数组（无外层包装），按 `id` 倒序：

```json
[
  {
    "id": 7,
    "content": "Hello coderhub",
    "createTime": "2026-11-13T03:44:27.000Z",
    "updateTime": "2026-11-13T03:44:27.000Z",
    "users": { "id": 10, "name": "alice" },
    "commentCounts": 0,
    "labelCounts": 2,
    "images": ["http://localhost:8888/moment/images/1794541467428.png"]
  }
]
```

> 列表项的键是 `users`（复数），详情里是 `author`（单数）—— 沿用课程原始实现，未做统一。

**GET /moment/:momentId**

```json
{
  "message": "操作成功！",
  "success": true,
  "status": 200,
  "data": {
    "id": 7,
    "content": "Hello coderhub",
    "createTime": "2026-11-13T03:44:27.000Z",
    "updateTime": "2026-11-13T03:44:27.000Z",
    "author": { "id": 10, "name": "alice" },
    "comments": [
      {
        "id": 3,
        "content": "这是一条评论",
        "commentId": null,
        "createTime": "2026-11-13T03:44:27.000Z",
        "user": { "id": 11, "name": "bob", "avatarURL": null }
      }
    ],
    "labels": [{ "id": 1, "name": "前端" }],
    "images": ["http://localhost:8888/moment/images/1794541467428.png"]
  }
}
```

`comments` / `labels` / `images` 在无数据时为 `null`（不是空数组）。

**POST /moment/:momentId/labels**

```json
// 请求：自动去重、去首尾空格，缺失的标签会先入库
{ "labels": ["前端", "Node.js", "前端"] }
// 响应
{ "message": "给动态添加标签成功~", "labels": [{ "id": 1, "name": "前端" }, { "id": 2, "name": "Node.js" }] }
```

### 6.3 评论

| 方法 | 路径 | 中间件链 | 说明 |
|---|---|---|---|
| POST | `/comment` | `verifyAuth` | 发表评论 |
| POST | `/comment/:commentId/reply` | `verifyAuth` | 回复评论 |
| GET | `/comment?momentId=` | — | 某动态下的评论（含回复，按 id 升序） |
| PATCH | `/comment/:commentId` | `verifyAuth` → `verifyPermission` | 修改，仅作者 |
| DELETE | `/comment/:commentId` | `verifyAuth` → `verifyPermission` | 删除，仅作者 |

```json
// POST /comment  —— momentId 可传数字或数字字符串
{ "content": "这是一条评论", "momentId": 7 }

// POST /comment/:commentId/reply  —— momentId 仍须在 body 里
{ "content": "这是一条回复", "momentId": 7 }
```

回复通过 `comment_id` 自引用，`comment_id IS NULL` 即为一级评论。

### 6.4 标签

| 方法 | 路径 | 中间件链 | 说明 |
|---|---|---|---|
| POST | `/label` | `verifyAuth` | 新增标签 |
| GET | `/label?limit=&offset=` | — | 标签列表，`limit` 默认 10、上限 100 |

### 6.5 文件上传

| 方法 | 路径 | 中间件链 | 说明 |
|---|---|---|---|
| POST | `/upload/avatar` | `verifyAuth` → `avatarHandle` | 头像，字段名 `avatar` |
| POST | `/upload/picture` | `verifyAuth` → `pictureHandle` | 配图，字段名 `picture`，≤ 9 张，需 `?momentId=` |

```bash
curl -X POST http://localhost:8888/upload/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@./avatar.png"

curl -X POST "http://localhost:8888/upload/picture?momentId=7" \
  -H "Authorization: Bearer <token>" \
  -F "picture=@./a.png" -F "picture=@./b.png"
```

上传成功返回 `{ "status": 200, "message": "...", "success": true }`，**不返回文件 URL**。
配图 URL 由动态详情/列表接口拼出：`${APP_HOST}:${APP_PORT}/moment/images/<filename>`。
头像上传后会把 `users.avatar_url` 回填为 `${APP_HOST}:${APP_PORT}/users/<id>/avatar`。

### 错误码表

| 错误常量 | HTTP | 响应文案 | 触发场景 |
|---|---|---|---|
| `NAME_OR_PASSWORD_IS_REQUIRED` | 400 | 用户名称或者密码不能为空! | 注册/登录缺字段 |
| `USER_ALREADY_EXISTS` | 409 | 用户名已经存在! | 注册重名 |
| `CURRENT_USER_NOT_EXISTS` | 400 | 用户名不存在! | 登录用户不存在 |
| `CURRENT_USER_PASSWORD_ERROR` | 400 | 用户密码错误! | 登录密码错误 |
| `UNAUTHORIZATION` | 401 | 无效的token! | 缺 token / 验签失败 / 过期 |
| `UNPERMISSION` | 403 | 无权限操作! | 改删非本人资源 |
| `INVALID_PARAMETERS` | 400 | 请求参数不合法! | ID 非正整数、body 字段缺失 |
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在! | 动态/头像/图片不存在 |
| 未知异常 | 500 | 服务器内部错误! | SQL 报错等（服务端打印堆栈） |

路由未匹配 → `404`；路径匹配但方法不符 → `405`（`@koa/router` 的 `allowedMethods`）。

---

## 七、关键设计

### 1. 错误处理：为什么要有最外层 try/catch

```ts
app.use(async (ctx, next) => {
  try { await next(); }
  catch (error) { ctx.app.emit('error', error as Error, ctx); }
});
```

Koa 自带的 `ctx.onerror` 会在异常时抢先 `res.end('Internal Server Error')`，导致 `errorHandle` 里定制的状态码和中文文案写不进去。先自行捕获、再用 `emit('error')` 转交统一处理，`ctx.body` 才可控。

业务代码通过 `emitError(ctx, errorTypes.XXX)` 抛错，错误类型是 `as const` 派生的字面量联合，常量拼错会直接编译报错。

### 2. JWT（`utils/token.ts`）

- 私钥签发、公钥验签，算法 `RSA-SHA256`，载荷 `{ id, name, iat, exp }`，有效期 24 小时；
- 校验顺序：**验签 → 校验 `alg` → 校验 `exp`**，防 `alg` 替换攻击；
- `verifyAuth` 只把验签放进 `try`，下游异常不会被误判成 401。

#### 2.1 为什么移除 `jsonwebtoken`（当前方案：`node:crypto`）

**原实现确实在用这个库，不是“装了没用”。** `main` 分支的历史提交里有两处真实调用：

```js
// src/controller/login.controller.js（签发）
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id, name }, PRIVATE_KEY, {
  expiresIn: 60 * 60 * 24,
  algorithm: 'RS256'
});

// src/middleware/auth.middleware.js（验签）
const jwt = require('jsonwebtoken');
const result = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
```

`package.json` 里对应声明 `"jsonwebtoken": "^8.5.1"`（当时放在 `devDependencies`）。

**移除原因**：Node 26 已移除 `Buffer.SlowBuffer`，而它的传递依赖在**模块加载阶段**就会访问该属性，服务还没开始处理请求就崩了：

```
jsonwebtoken@8 → jws@3 → jwa@1 → buffer-equal-constant-time@1
                                     └─ SlowBuffer.prototype.equal  ← TypeError
```

升级也绕不开（两条链最终都落在同一个包上）：

| 版本 | 依赖链 | 结果 |
|---|---|---|
| `jsonwebtoken@8.5.1` | jws@3 → jwa@1 → bcet | 启动即崩 |
| `jsonwebtoken@9.0.3` | jws@4 → jwa@2 → bcet | 同样崩 |

**现实现**（`utils/token.ts`，约 70 行）：`crypto.sign('RSA-SHA256')` 签发、`crypto.verify()` 验签，校验顺序为**签名 → `alg === 'RS256'` → `exp`**；载荷仍为 `{ id, name, iat, exp }`，有效期 24 小时。

**兼容性**：JWT 是标准格式（header.payload.signature），算法、载荷字段、密钥文件都没有变，因此**旧 token 仍然有效**（反过来也一样）；差异只是不再具备库里可选的 `aud` / `iss` / `nbf` 校验——本项目没有使用这些字段。

**备选方案与取舍**：

| 方案 | 优点 | 代价 |
|---|---|---|
| 降 Node 到 20/22 LTS + `jsonwebtoken@9` | 改动最小 | 运行时被锁定在旧版本 |
| 换 `jose` | 活跃维护、无 `jwa` 依赖 | 偏 ESM，CommonJS 需动态 `import()` 或整体转 ESM |
| **`node:crypto` 自研（当前）** | 零依赖、启动快、类型可控 | 需自行维护（约 70 行），只覆盖用到的能力 |

**提交时间线**：`74edea5` 引入 → `12ed5a6`（`main`）移除并改为 `utils/token.js` → `f30eeaf`（本分支）迁移为 `utils/token.ts`。


### 3. 权限校验：参数名推导表名

```ts
const [resourceKey] = Object.keys(ctx.params);       // momentId / commentId
const tableName = resourceKey.replace(/Id$/, '');    // moment / comment
if (!ALLOWED_TABLES.includes(tableName)) → 400
```

表名不能直接拼接（SQL 注入），因此走白名单 `['moment', 'comment']`，ID 再过 `toPositiveInt`。

### 4. 参数收窄（`utils/request.ts`）

`koa-bodyparser` 解析出的 `ctx.request.body` 是 `unknown`。统一用 `getBody<T>()` 收窄成 `Partial<T>`，控制器再做字段级判断，避免 `as any` 满天飞。

### 5. 上传

`@koa/multer` 4 把文件信息挂在 **`ctx.file` / `ctx.files`**（Koa 2 时代的 `koa-multer` 是 `ctx.req.file`）。
两个上传目录在**中间件模块加载时**就 `mkdirSync(recursive)`，新环境不会因目录缺失报 ENOENT。
读取配图时先 `path.basename()` 再拼路径，`/moment/images/../../.env` 这类请求会落到 404。

### 6. 类型体系

- `types/models.ts`：`UserRow`、`MomentDetail`、`MomentListItem`、`CommentItem`、`LabelRow`、`AvatarRow`、`FileRow`，直接对应 SQL 别名；另有请求体 DTO 与 `TokenPayload`。
- `types/koa.d.ts`：扩展 `DefaultState`（`user`、`labels`）与 `DefaultContext`（`file`、`files`），控制器里 `ctx.state.user` 有类型。
- `types/koa-multer.d.ts`：`@koa/multer` 4.x 不带声明，补了 20 行 shim（`single/array/fields`）。
- `mysql2` 的 `pool.execute<T>()` 显式标注 `ResultSetHeader`（增删改）与 `RowDataPacket[]`（查询）。

### 7. 分页

- 动态：`offset` 非负整数（默认 0），`size` 正整数（默认 10、`Math.min(..., 100)`）；
- 标签：`limit` 默认 10、上限 100；非法值一律兜底到默认，不报错。

---

## 八、数据库设计

7 张表，`db/schema.sql` 一次建好，全部 InnoDB + utf8mb4：

| 表 | 说明 | 关键约束 |
|---|---|---|
| `users` | 用户 | `uk_users_name` 唯一用户名 |
| `moment` | 动态 | `fk_moment_user` → `users`（级联删除） |
| `comment` | 评论/回复 | 自引用 `fk_comment_parent`，`moment_id`/`user_id` 级联 |
| `label` | 标签 | `uk_label_name` 唯一 |
| `moment_label` | 动态-标签关联 | 复合主键 `(moment_id, label_id)` 天然去重 |
| `avatar` | 头像元信息 | `fk_avatar_user` 级联 |
| `file` | 配图元信息 | 关联 `user` 与 `moment`，均级联 |

**沿用的历史拼写**（SQL 里已按此写，改表需同步改 service）：

- `moment.creatAt` —— 少了 `e`（`users`/`comment`/`label` 是正常的 `createAt`）；
- `avatar.mimtype` / `file.mimtype` —— 应为 `mimetype`。

删动态时 `comment`、`moment_label`、`file` 的记录由外键级联清掉，但 **`uploads/` 里的物理文件不会删**（见 [§12](#十二已知问题与改进方向)）。

---

## 九、脚本与环境变量

### npm 脚本

| 命令 | 作用 |
|---|---|
| `npm run dev` | `tsx watch src/main.ts`，改代码自动重启 |
| `npm run start` | `tsx src/main.ts`，跑一次（不 watch、不做类型检查） |
| `npm run typecheck` | `tsc --noEmit`，只检查不产出 |
| `npm run build` | `tsc -p tsconfig.json` → `dist/` |
| `npm run serve` | `node dist/main.js`，需先 `build` |

> `tsx` 只做转译、不做类型检查，CI 里要单独跑 `npm run typecheck`。

### 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `APP_HOST` | `http://localhost` | 拼头像/配图 URL 用，部署到域名时要改 |
| `APP_PORT` | `8888` | 监听端口 |
| `MYSQL_HOST` | `localhost` | 数据库地址 |
| `MYSQL_PORT` | `3306` | 数据库端口 |
| `MYSQL_DATABASE` | `codetest` | 库名 |
| `MYSQL_USER` | `root` | 账号 |
| `MYSQL_PASSWORD` | 空 | 密码 |
| `KEY_DIR` | `src/app/keys` | 可选，自定义 RSA 密钥目录（部署时挂载） |

`.env` 不入库（`.gitignore` 已忽略），模板见 `.env.example`。

### 密钥

若 `src/app/keys` 不存在（新克隆且未拿到密钥），自行生成：

```bash
openssl genrsa -out src/app/keys/private.key 2048
openssl rsa -in src/app/keys/private.key -pubout -out src/app/keys/public.key
```

`config.ts` 定位密钥用的是 **项目根下的 `src/app/keys`**，而不是 `__dirname/keys`——因为 `tsc` 不复制 `.key` 到 `dist`，用 `__dirname` 会在构建后 ENOENT。

---

## 十、迁移记录（Koa 2 + JS → Koa 3 + TS）

| 项目 | 迁移前 | 迁移后 | 处理说明 |
|---|---|---|---|
| 语言 | JavaScript | TypeScript 7（strict） | 全部文件 `.ts`，新增 `src/types` |
| 运行器 | nodemon + node | tsx（watch） | ts-node 10 与 TS 7 不兼容 |
| 框架 | koa 2.13 | koa 3.3 | 中间件已是 async，无改动 |
| 路由 | koa-router 10 | @koa/router 15 | path-to-regexp v8；现有写法兼容 |
| 上传 | koa-multer 1 | @koa/multer 4 + multer 2 | `ctx.req.file(s)` → `ctx.file(s)` |
| 数据库 | mysql2 2.3 | mysql2 3.24 | 用 `ResultSetHeader` / `RowDataPacket` 标注 |
| 模块解析 | — | `module`/`moduleResolution: nodenext` | TS 7 已移除 `moduleResolution: node` |
| 密钥路径 | `__dirname/keys` | 项目根 `src/app/keys`（`KEY_DIR` 可覆盖） | tsc 不拷贝 `.key` |
| 类型缺口 | — | 自写 `@koa/multer` 声明 | 20 行 shim |
| 构建 | 无 | `tsc` → `dist` + `npm run serve` | 顺带修正非 TS 资源定位 |
| 认证库 | `jsonwebtoken@8.5.1` | `node:crypto` 自研 RS256 | 依赖链在 Node 26 触发 `Buffer.SlowBuffer` 崩溃，v9 同样命中 |
| 校验 | 弱 | `toPositiveInt` / 白名单 / 走统一错误处理 | 原来 SQL 报错会被当成 404 |

**行为保持一致的兼容点**：`/moment/:id/lables` 旧路径保留；响应结构、状态码、错误文案未变。

---

## 十一、验证结果

验证环境：Node 26.10.0 / npm 11.19.1 / MySQL 8.4.10 / Windows。
本机 `MySQL84` 服务的 root 凭据与 `.env` 不一致（`ERROR 1045`），因此回归使用**临时 MySQL 实例** + `db/schema.sql`，未改动本机库。

| 检查项 | 结果 |
|---|---|
| `npx tsc --noEmit` | **0 错误** |
| `npm run build` | 成功，`dist/` 70 个文件（`.js` + `.d.ts` + `.map`） |
| `node dist/main.js` | 启动并正常响应 |
| `npm run start`（tsx） | 启动并正常响应 |
| 接口端到端回归 | **62 项断言全部通过** |

回归覆盖：

- 注册（含中文用户名 utf8 往返）、重名 409、空字段 400；
- 登录签 token、错误密码 / 不存在用户 400；
- token：无 / 结构非法 / 篡改载荷（签名不符）→ 401，合法 → 200；
- 动态：发布、详情聚合、分页、修改、删除、不存在 404、空内容 400、未登录 401；
- 标签：打标签自动去重、重复打幂等、非数组 400、非作者 403、历史 `lables` 路径可用；
- 评论：发表、回复、列表含 `commentId` 回指、缺 `momentId` 400、非作者改 403；
- 上传：头像、头像读取（`content-type` + 字节数一致）、配图 2 张、详情 URL 聚合、按 URL 读取、路径穿越 404；
- 通用：未知路由 404、方法不符 405、非法分页参数兜底、非数字 ID 400。

---

## 十二、已知问题与改进方向

按优先级排列，都是**当前代码的真实行为**，不是待办占位：

1. **重复创建同名标签返回 500**。`label.name` 有唯一索引，`POST /label` 直接裸插，`ER_DUP_ENTRY` 落到默认 500。应捕获 errno `1062` 返回 409，或改为幂等返回已有记录。（回归中已固定该行为）
2. **密码是无盐 MD5**。换 scrypt/bcrypt 前要先加宽列：`ALTER TABLE users MODIFY password VARCHAR(255);`（schema 已是 255，老库需确认），否则可能写入失败。
3. **私钥与测试图片进了版本库**。`src/app/keys/private.key`、`uploads/*.jpg` 仍被 Git 跟踪（`.gitignore` 对已跟踪文件无效）。建议 `git rm --cached` 并轮换密钥。
4. **删除动态不清理磁盘文件**。数据库记录随外键级联删除，`uploads/` 下的物理文件成为孤儿。
5. **缺少通用能力**：CORS、请求日志、限流、单元测试、ESLint/Prettier 均未引入。
6. **`tsx` 不做类型检查**，CI 需单独跑 `npm run typecheck`。
7. **`package.json` 的 `name` 拼成了 `corderhub`**（少一个 d），不影响运行。
8. **列表/详情键名不统一**：列表用 `users`，详情用 `author`；`comments`/`labels`/`images` 无数据时为 `null`。
9. **`src/**/*.txt` 是 0 字节占位笔记**，按课程需求保留，不参与构建。

---

## License

ISC
