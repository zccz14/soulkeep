# Soulkeep

给创始人的有机软件工作台。钉住灵魂，剩下的交给它自己长。

## 它解决什么

软件不是造物，是活物。判据不是「一次写对」，是「活着并持续修复」。Soulkeep 把一个产品的三层摊开给创始人看：

- **灵魂**：轮廓由钉子钉住。每一颗钉是一句不能交给别人的话；拔掉一颗，形状就变。
- **骨架**：概念、术语、关系、对外对象、技术栈。粗、少、难改；机器生成，人过目。
- **血肉**：功能连线、字段、页面。每天都在换，没有人守着。

三层只能单向约束：灵魂管骨架，骨架管血肉。创始人只写灵魂、签骨架，其余不参与。

## 架构

- Cloudflare Workers 单源部署：`src/index.ts` 是 Hono 应用，静态产物由 `ASSETS` 同域提供，`/api/v1/*` 与之同域。
- D1 存全部状态：`products` / `soul_pins` / `skeleton_parts` / `flesh_tiles`。
- 前端 React + Vite + `@zccz14/ux`（统一外壳与主题），Auth Mini 登录，匿名可看公开产品。

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
