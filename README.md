# SoulKeep

给创始人的有机软件工作台。钉住灵魂，剩下的交给它自己长。

## 它解决什么

软件不是造物，是活物。判据不是「一次写对」，是「活着并持续修复」。SoulKeep 把一个产品的三层摊开给创始人看：

- **灵魂**：一句话一条，整份存成受 Schema 约束的 JSON；术语与它的定义也住在灵魂里。
- **骨架**：先只做 ER——有哪些表、表与表怎么连（一对一 / 一对多 / 多对多）。不写字段：字段属于血肉。也没有「对外对象」这一类：对象一律对外，找不出反例。粗、少、难改；机器生成，人过目。
- **血肉**：骨架之下那一层，分三种——**表设计**（每张表长什么样：有哪些列、哪列是键）、**功能**（落在哪个入口、动到哪几张表）、**页面**（人从哪条路由进去）。一片一行，正文是**受 Schema 约束的 JSON**：多一个字段当场拒掉，引用骨架里没有的表当场拒掉。表设计必须挂在骨架的某张表上，一张表一份。

三层只能单向约束：灵魂管骨架，骨架管血肉。创始人只写灵魂、签骨架，其余不参与。

## 血肉为什么不是规格

血肉是**已经长出来的东西的影子**，不是开工前要写好的图纸：它永远落后于代码，而图纸永远要求代码向它对齐。所以这一层没有编辑页——机器（一个读得懂仓库和数据库的 Agent）在实现之后把真实结构读回来，一片一片喂进 `POST /api/v1/products/:slug/flesh`。

判据很硬：删掉仓库里某个文件，对应的那片血肉应该消失或变成「待补」；人手写的规格不会跟着消失，影子会。

## 架构

- Cloudflare Workers 单源部署：`src/index.ts` 是 Hono 应用，静态产物由 `ASSETS` 同域提供，`/api/v1/*` 与之同域。
- D1 存全部状态：`products`（灵魂与骨架都是列里的 JSON）/ `flesh_tiles`（`kind` 分表设计 / 功能 / 页面，`anchor` 是表设计挂的那张表）。
- 前端 React + Vite + `@zccz14/ux`（统一外壳与主题），Auth Mini 登录，匿名可看公开产品。
- 灵魂与骨架各有独立编辑页（`/#/p/:slug/soul`、`/#/p/:slug/skeleton`）：改动随手存进浏览器本地草稿，点「保存」（或 ⌘S）才整份写回。
- 产品广场（`/#/plaza`）：公开的产品线一屏排开，不登录也能看。产品页的「编辑资料」里可以把一条产品线收成私有。

## 本地开发

```sh
pnpm install
pnpm db:migrate:local
pnpm dev            # Worker + 本地 D1，端口 8788
```

要免登录跑通界面，在 `.dev.vars` 里写：

```
DEV_USER_ID=local-founder
```

然后用 `Authorization: Bearer dev` 调接口。

## 测试与上线

```sh
pnpm check          # typecheck + vitest
pnpm build
```

合并进 `main` 后由 `deploy` 工作流自动迁移 D1、发布 Worker、跑冒烟；线上地址 <https://soulkeep.ntnl.io>。

需要的仓库 secret：`CLOUDFLARE_API_TOKEN`（Workers Scripts:Edit、Workers Routes:Edit、D1:Edit）与 `CLOUDFLARE_ACCOUNT_ID`。

## 四条

Structure · Responsiveness · Homeostasis · Metabolism。软件不是造物，是活物：它不追求一次写对，它追求活着并持续修复。
