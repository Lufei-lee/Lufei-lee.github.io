# 留言板使用与维护

更新：2026-10-25

## 服务位置

- 主页：https://lufei-lee.github.io/#guestbook
- 留言 API：https://lufei-guestbook.gkp4hw42yr.workers.dev
- [Worker 设置](https://dash.cloudflare.com/accac395ad886d225f1660a1956b8751/workers/services/view/lufei-guestbook/production/settings)
- [留言数据与审核](https://dash.cloudflare.com/accac395ad886d225f1660a1956b8751/workers/d1/databases/573d8668-71ba-4300-a636-deea6bc77578/studio)
- [D1 SQL 控制台](https://dash.cloudflare.com/accac395ad886d225f1660a1956b8751/workers/d1/databases/573d8668-71ba-4300-a636-deea6bc77578/console)
- [Turnstile 控制台](https://dash.cloudflare.com/accac395ad886d225f1660a1956b8751/turnstile)

主站继续由 GitHub Pages 托管。留言保存于 Cloudflare D1 的 `lufei-guestbook` 数据库，不会写进公开 GitHub 仓库。上述管理链接需要登录你的 Cloudflare 账号。

## 访客怎样留言

填写昵称（选填）和正文，通过 Turnstile 检查后点击“发布留言”。昵称最多 40 字符，正文最多 2000 字符。提交成功会提示“已收到，审核后会显示在这里”。

新留言的状态为 `pending`，不会立即出现在公开列表。审核为 `approved` 后，网页显示昵称、正文、北京时间日期和由 IP 推断的国家 / 地区。属地可能受网络出口或代理影响，不代表访客的实际所在地。完整 IP 不写入留言表，也不由公开接口返回。

验证码由 Cloudflare 在服务器端校验，同时核对 `lufei-lee.github.io` 域名及 `guestbook` 用途。每个 IP 在一个固定的 10 分钟窗口内最多成功提交 3 条；限流表只保存以私密密钥生成的摘要，过期记录在后续有效提交时清理。

## 如何审核

打开上面的“留言数据与审核”，选择 `messages` 表。查看 `pending` 记录，把需要公开的留言的 `status` 改为 `approved` 并保存；不公开的改为 `rejected`。公开后若想撤回，改回 `pending` 或 `rejected` 即可，无需删除。

也可以在 SQL 控制台查询待审留言：

```sql
SELECT id, name, message, created_at, region
FROM messages
WHERE status = 'pending'
ORDER BY created_at DESC;
```

复制目标留言的实际 ID，再执行以下二选一语句：

```sql
-- 公开这一条
UPDATE messages SET status = 'approved' WHERE id = '替换为实际留言ID';

-- 隐藏这一条（可恢复）
UPDATE messages SET status = 'rejected' WHERE id = '替换为实际留言ID';
```

主页刷新后会获取最新已审核列表，当前展示最近 50 条。更早的留言仍保存在 D1 中。旧 GitHub Discussions 留言入口继续保留，两边的数据分别管理。

## 配置与密钥

GitHub 仓库的 Actions Repository variables：

| 名称 | 内容 |
| --- | --- |
| `GUESTBOOK_API` | `https://lufei-guestbook.gkp4hw42yr.workers.dev` |
| `TURNSTILE_SITE_KEY` | Turnstile 公开 Site Key |

这两项在构建时写入网页，修改后需要重新部署 GitHub Pages。

私密的 `TURNSTILE_SECRET` 仅存于 Worker 的 Production Secret，页面中显示“Value encrypted”。不放进 GitHub、前端代码、文档或本地同步目录。D1 的 Worker binding 为 `DB`。

## 代码与更新

- `cloudflare/worker.mjs`：读取、提交、验证码校验、属地与限流。
- `cloudflare/schema.sql`：可重复执行的初始表结构，不删除数据。
- `cloudflare/wrangler.toml`：资源名称和绑定配置，不含密钥。
- `cloudflare/worker.test.mjs`：使用本地 SQLite 的接口测试。
- `src/components/home/Guestbook.tsx`：主页留言表单和列表。

后端当前通过 Cloudflare 在线编辑器部署；GitHub Pages 工作流只部署主站。更新后端时，可将 `worker.mjs` 复制到 Worker 的在线编辑器并 Deploy，保留现有 DB 绑定和 Secret。以后如需 Wrangler 自动部署，再单独配置授权。

本地测试（需要支持 `node:sqlite` 的 Node 版本）：

```sh
node --test cloudflare/worker.test.mjs
```

`GET /health` 检查数据库读取与必要配置；`GET /messages` 只返回已审核记录；`POST /messages` 接收 `name`、`message`、`token`，成功返回 HTTP 202。没有公开的管理接口。

## 排查

- 按钮灰色：正文为空，或 Turnstile 尚未验证成功。
- 提交失败：稍后重试；检查验证是否过期、是否达到频率限制。
- 提交成功却看不到：到 D1 检查待审核状态。
- 无法访问 API：先通过实际浏览器检查 `/health`。命令行请求可能被 Cloudflare 边缘层拦截，这与 Worker 自身返回的 JSON 错误不同。
- 不必修改主站 DNS，也没有迁移 GitHub Pages 或启用付费计划。

官方参考：[D1](https://developers.cloudflare.com/d1/get-started/)、[Turnstile 服务端验证](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)。
