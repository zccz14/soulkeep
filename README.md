# Soulkeep

给创始人的有机软件工作台。钉住灵魂，剩下的交给它自己长。

## 它解决什么

软件不是造物，是活物。判据不是「一次写对」，是「活着并持续修复」。Soulkeep 把一个产品的三层摊开给创始人看：

- **灵魂**：一句话一条，整份存成受 Schema 约束的 JSON；术语与它的定义也住在灵魂里。
- **骨架**：先只做 ER——有哪些表、表与表怎么连（一对一 / 一对多 / 多对多）。不写字段：字段属于血肉。粗、少、难改；机器生成，人过目。
- **血肉**：功能连线、字段、页面。每天都在换，没有人守着。

三层只能单向约束：灵魂管骨架，骨架管血肉。创始人只写灵魂、签骨架，其余不参与。

## 架构

- Cloudflare Workers 单源部署：`src/index.ts` 是 Hono 应用，静态产物由 `ASSETS` 同域提供，`/api/v1/*` 与之同域。
- D1 存全部状态：`products`（灵魂与骨架都是列里的 JSON）/ `flesh_tiles`。
- 前端 React + Vite + `@zccz14/ux`（统一外壳与主题），Auth Mini 登录，匿名可看公开产品。
- 灵魂与骨架各有独立编辑页（`/#/p/:slug/soul`、`/#/p/:slug/skeleton`）：改动随手存进浏览器本地草稿，点「保存」（或 ⌘S）才整份写回。

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

Structure · Responsiveness · Homeostasis · Metabolism。见站内「四条」一页。
