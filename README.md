# coderhub

基于 **Node.js + Koa 3 + TypeScript + MySQL** 的内容社区后端练习项目：
用户注册登录、发布动态、评论与回复、标签、图片上传。

> 分支 `feature/ts-koa3`：由 Koa 2 + JavaScript 迁移而来，技术栈、目录、脚本与迁移记录见下文。
> 原 JS 版本保留在 `main` 分支。

## 一、技术栈

| 分类 | 技术 | 版本 | 作用 |
|---|---|---|---|
| 语言 | **TypeScript** | 7.0.2 | 全量 TS，`strict: true`，`module: nodenext` |
| 运行器 | **tsx** | 4.23.15 | 直接运行 `.ts`，`--watch` 替代 nodemon |
| Web 框架 | **koa** | 3.3.0 | 仅支持 async 中间件，Node ≥ 18 |
| 路由 | **@koa/router** | 15.7.1 | 每个模块一个 Router，`prefix` 分组 |
| 请求体 | **koa-bodyparser** | 4.4.1 | JSON → `ctx.request.body` |
| 文件上传 | **@koa/multer** + **multer** | 4.0.0 / 2.5.0 | 头像单文件、配图多文件 |
| 数据库 | **mysql2** | 3.24.6 | 连接池 + `promise()`，原生 SQL |
| 配置 | **dotenv** | 17.4.2 | `.env` → `process.env` |
| 认证 | `node:crypto` | 内置 | RS256 签发/验签，零第三方依赖 |
| 类型 | `@types/koa`、`@types/koa-bodyparser`、`@types/multer` | 3.0.3 / 4.3.13 / 2.3.0 | 官方类型 |

未引入：ORM（手写 SQL）、Jest、ESLint/Prettier、CORS 中间件。

## 二、目录结构

```
coderhub/
├── db/schema.sql                 # 建库建表脚本（7 张表，含外键/索引）
├── src/
│   ├── main.ts                   # 入口：监听 APP_PORT
│   ├── app/
│   │   ├── index.ts              # Koa 实例、最外层异常兜底、bodyParser、动态挂路由、error 监听
│   │   ├── config.ts             # dotenv + 密钥读取 + 默认值
│   │   ├── dataBase.ts           # mysql2 连接池（promise）
│   │   ├── errorHandle.ts        # 错误常量 → HTTP 状态码
│   │   └── keys/                 # private.key / public.key（RS256）
│   ├── router/                   # 7 个路由文件 + 动态加载入口
│   ├── middleware/               # 鉴权、注册校验、标签预处理、multer
│   ├── controller/               # 参数校验 + 调 service + 组响应
│   ├── service/                  # SQL 与数据访问（带类型）
│   ├── constants/                # 错误常量、上传路径
│   ├── utils/                    # token、密码摘要、请求体/参数工具
│   └── types/
│       ├── models.ts             # 表行类型、DTO、JWT 载荷
│       ├── koa.d.ts              # 扩展 ctx.state.user / labels、ctx.file / files
│       └── koa-multer.d.ts       # @koa/multer 类型补齐
├── tsconfig.json                 # strict + nodenext，输出 dist
└── package.json                  # dev / start / build / typecheck / serve
```

数据流：`请求 → 路由中间件链 → controller → service → MySQL → 响应`。

## 三、接口清单

路由由 `router/index.ts` 自动加载（按 `__filename` 的扩展名匹配 `.ts`/`.js`，`.txt` 笔记不会被加载）。

### 用户与认证

| 方法 | 路径 | 中间件 | 说明 |
|---|---|---|---|
| POST | `/login` | `verifyLogin` | 登录，签发 JWT（RS256，24h） |
| GET | `/test` | `verifyAuth` | 校验 token 是否有效 |
| POST | `/users` | `verifyUser` → `handlePassword` | 注册（密码 MD5） |
| GET | `/users/:userId/avatar` | — | 以流返回头像 |

### 动态

| 方法 | 路径 | 中间件 | 说明 |
|---|---|---|---|
| POST | `/moment` | `verifyAuth` | 发布动态 |
| GET | `/moment?offset=&size=` | — | 分页列表（size ≤ 100） |
| GET | `/moment/:momentId` | — | 详情（作者/评论/标签/配图聚合） |
| PATCH | `/moment/:momentId` | `verifyAuth` → `verifyPermission` | 修改，仅作者 |
| DELETE | `/moment/:momentId` | `verifyAuth` → `verifyPermission` | 删除，仅作者 |
| POST | `/moment/:momentId/labels` | `verifyAuth` → `verifyPermission` → `verifyLabelExist` | 打标签 |
| POST | `/moment/:momentId/lables` | 同上 | 历史拼写兼容 |
| GET | `/moment/images/:filename` | — | 读取配图（`path.basename` 防穿越） |

### 评论

| 方法 | 路径 | 中间件 | 说明 |
|---|---|---|---|
| POST | `/comment` | `verifyAuth` | 发表评论 |
| POST | `/comment/:commentId/reply` | `verifyAuth` | 回复评论 |
| PATCH | `/comment/:commentId` | `verifyAuth` → `verifyPermission` | 修改 |
| DELETE | `/comment/:commentId` | `verifyAuth` → `verifyPermission` | 删除 |
| GET | `/comment?momentId=` | — | 评论列表 |

### 标签 / 上传

| 方法 | 路径 | 中间件 | 说明 |
|---|---|---|---|
| POST | `/label` | `verifyAuth` | 新增标签 |
| GET | `/label?limit=&offset=` | — | 标签列表 |
| POST | `/upload/avatar` | `verifyAuth` → `avatarHandle` | 头像（字段 `avatar`） |
| POST | `/upload/picture` | `verifyAuth` → `pictureHandle` | 配图（字段 `picture`，≤9 张，`?momentId=`） |

## 四、关键实现

### 1. 类型体系

- `types/models.ts`：`UserRow`、`MomentDetail`、`MomentListItem`、`CommentItem`、`LabelRow`、`AvatarRow`、`FileRow` 等，直接对应 SQL 别名；
- `types/koa.d.ts`：扩展 `DefaultState`（`user`、`labels`）与 `DefaultContext`（`file`、`files`），控制器里 `ctx.state.user` 有类型；
- `types/koa-multer.d.ts`：`@koa/multer` 4.x 没有类型声明，补了 `single/array/fields` 的最小声明。

### 2. JWT（`utils/token.ts`）

私钥签发、公钥验签，`RSA-SHA256`；校验 `alg` 与 `exp`，篡改载荷/过期都会抛错。不依赖 `jsonwebtoken`（其依赖在 Node 26 上会因 `Buffer.SlowBuffer` 移除而崩溃）。

### 3. 权限校验

参数名以 `Id` 结尾（`:momentId` / `:commentId`）→ 推导表名，且表名走白名单 `['moment', 'comment']`，避免拼接注入。

### 4. 错误处理

最外层中间件 `try/catch` → `ctx.app.emit('error')` → `errorHandle` 映射状态码；
未知异常统一 500 并打印堆栈（避免 Koa 自带 `onerror` 抢先 `res.end` 导致 body 不可定制）。

### 5. 上传

`@koa/multer` 4 + multer 2，文件信息挂到 **`ctx.file` / `ctx.files`**（Koa 2 时代的 `koa-multer` 是 `ctx.req.file`）；
上传目录在中间件加载时 `mkdirSync(recursive)`，新环境不会因目录缺失报 ENOENT。

### 6. 动态路由（兼容 dev 与 dist）

```ts
const ext = path.extname(__filename);   // 开发 .ts / 构建 .js
fs.readdirSync(__dirname)
  .filter((file) => file.endsWith(ext) && !file.endsWith(`.d${ext}`) && file !== `index${ext}`)
  .forEach((file) => { /* require + router.routes() */ });
```

## 五、快速开始

```bash
npm install

# 1. 建库建表
mysql -u root -p < db/schema.sql

# 2. 配置环境变量
cp .env.example .env      # 修改 MySQL 账号密码

# 3. 启动
npm run dev               # tsx watch，改代码自动重启
npm run start             # 只跑一次
npm run typecheck         # tsc --noEmit
npm run build             # 编译到 dist
npm run serve             # 运行 dist/main.js
```

启动日志：`Koa服务器在8888端口启动成功...`、`数据库连接成功！`。

## 六、环境变量

| 变量 | 示例 | 说明 |
|---|---|---|
| `APP_HOST` / `APP_PORT` | `http://localhost` / `8888` | 服务地址与端口 |
| `MYSQL_HOST` / `MYSQL_PORT` | `localhost` / `3306` | 数据库地址 |
| `MYSQL_DATABASE` | `codetest` | 库名 |
| `MYSQL_USER` / `MYSQL_PASSWORD` | `root` / `****` | 账号密码 |
| `KEY_DIR` | 可选 | 自定义密钥目录（默认 `src/app/keys`） |

## 七、迁移记录（Koa 2 + JS → Koa 3 + TS）

| 项目 | 迁移前 | 迁移后 | 处理说明 |
|---|---|---|---|
| 语言 | JavaScript | TypeScript 7（strict） | 33 个文件全部 `.ts`，新增 `src/types` |
| 运行器 | nodemon + node | tsx（watch） | ts-node 10 与 TS 7 不兼容，改用 tsx |
| 框架 | koa 2.13 | koa 3.3 | 中间件已是 async，无改动 |
| 路由 | koa-router 10 | @koa/router 15 | path-to-regexp v8；本项目路由写法兼容 |
| 上传 | koa-multer 1 | @koa/multer 4 + multer 2 | `ctx.req.file(s)` → `ctx.file(s)` |
| 数据库 | mysql2 2.3 | mysql2 3.24 | 用 `ResultSetHeader` / `RowDataPacket` 标注 |
| 模块解析 | — | `module/moduleResolution: nodenext` | TS 7 已移除 `moduleResolution: node` |
| 密钥路径 | `__dirname/keys` | 项目根 `src/app/keys`（`KEY_DIR` 可覆盖） | tsc 不拷贝 `.key`，避免 dist 下 ENOENT |
| 类型缺口 | — | `@koa/multer` 自写 `.d.ts` | 11 行 shim |
| 构建 | 无 | `tsc` → `dist`，`npm run serve` | 修正非 TS 资源（keys）定位问题 |

行为保持一致的兼容点：`/moment/:id/lables` 旧路径保留；响应结构、状态码、错误文案未变。

## 八、验证结果

- `npx tsc --noEmit` → **0 错误**；
- `npm run build` → `dist/` 产物完整，`node dist/main.js` 可启动并正常响应；
- 端到端回归（临时 MySQL 实例 + `db/schema.sql`）**37 项全部通过**，覆盖：
  注册/重名 409、登录/错误密码、伪造 token 401、发布/详情/分页、
  标签去重、评论与回复、跨用户修改 403、头像与配图上传及读取、
  删除权限、404/400/405、删除后详情 404；
- 上传文件 `content-type`、图片字节数、配图 URL 可访问均验证通过。

## 九、剩余待改进

- [ ] 密码仍是**无盐 MD5**：换 scrypt/bcrypt 需先加宽列（`ALTER TABLE users MODIFY password VARCHAR(255)`），否则老库可能写入失败；
- [ ] `src/app/keys/private.key` 与 `uploads/*` 仍被 Git 跟踪，建议 `git rm --cached` 并轮换密钥；
- [ ] 没有 CORS、请求日志、限流、单元测试、ESLint/Prettier；
- [ ] tsx 运行不做类型检查，CI 需单独跑 `npm run typecheck`；
- [ ] 本机 `root` 密码与 `.env` 不一致（`ERROR 1045`），回归使用的是临时实例，真实库需自行确认凭据。
- [ ] `src/**/*.txt` 为 0 字节占位笔记，按需求保留。