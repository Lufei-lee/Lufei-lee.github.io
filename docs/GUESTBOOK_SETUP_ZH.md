# 匿名留言板开通说明

更新：2026-10-25

## 目前完成到哪里

主页仍部署在 https://lufei-lee.github.io/。新留言板已完成名字、正文、字数限制、公开信息确认、提交状态、留言列表和日期 / IP 属地的页面样式，并预留真实 Turnstile 验证与 API 接口。

**目前没有 Cloudflare 账号，也没有部署留言后端。匿名留言尚不能提交或持久保存。** 页面明确提示未连接，并保留原 GitHub 留言入口；不会显示演示留言、假验证码或虚假的提交成功状态。旧 GitHub 留言不会被删除。

## 你现在只需要做的事

1. 打开 [Cloudflare 注册页](https://dash.cloudflare.com/sign-up)，使用自己的邮箱注册，并完成邮箱验证。
2. 登录控制台。主页继续使用 GitHub Pages，无需购买域名，也无需迁移 GitHub Pages 的 DNS。
3. 完成后告诉我“Cloudflare 注册好了”。可以届时协助部署下面的后端，不需要把密码或密钥发到聊天中。

## 后续接入顺序

1. 创建一个 Workers 服务，例如 `lufei-guestbook`，用于提供留言接口，地址形如 `https://lufei-guestbook.<你的子域>.workers.dev`。
2. 在 D1 中创建数据库 `lufei-guestbook`，为 Worker 添加名为 `DB` 的 D1 binding。建立留言表，至少包含 `id`、`name`、`message`、`created_at`、`region`、`status`。使用服务端 UTC 时间；前端按北京时间显示日期。
3. 实现下文约定的读写接口。新留言为 `pending`，公开读取只返回 `approved`。初期可在 D1 控制台审核留言并修改状态，不把审核口令或管理接口暴露给网页。
4. 在 Turnstile 创建 widget，允许的 hostname 填 `lufei-lee.github.io`，选择 Managed 模式。获取公开 **Site Key** 和私密 **Secret Key**。Site Key 用于网页；Secret Key 只保存在 Worker secret 中。
5. Worker 必须调用 Cloudflare Siteverify 校验 token，并检查返回的 hostname 和 `action = guestbook`。同时校验字数、公开信息同意值，使用参数化 SQL；设置请求大小限制与频率限制。IP 属地由 Worker 的 `request.cf` 地区数据生成，不能信任浏览器传来的地区文本。完整 IP 不进入公开数据表或接口。
6. 在 GitHub 仓库的 Settings → Secrets and variables → Actions → Variables 中添加以下两个 **Repository variables**：

   | 名称 | 内容 |
   | --- | --- |
   | `GUESTBOOK_API` | 实际部署的 Worker 根地址，不带 `/messages` |
   | `TURNSTILE_SITE_KEY` | 公开 Site Key |

   工作流已预留这两个变量；**后端准备好前不要填写**。不要把 Secret Key 放在这里，也不要创建任何 `NEXT_PUBLIC_*` 私密密钥。

7. 重新运行 GitHub Actions 中的 Deploy PRISM to GitHub Pages。部署后测试：验证失败不入库、正常提交进入待审核、审核后显示名字 / 日期 / 地区、普通访客无法读取待审留言或完整 IP。

## 页面预留的 API 约定

`GET /messages`：返回已审核留言，按日期倒序并限制返回条数；后续留言多时再加入分页。

```json
{
  "messages": [
    {"id":"示例 ID","name":"访客名","message":"留言正文","created_at":"2026-10-25T08:00:00Z","region":"中国 · 上海"}
  ]
}
```

`POST /messages`：接收 JSON `{ "name": "…", "message": "…", "token": "…", "consent": true }`。昵称选填、最长 40 字符；正文去除首尾空白后 1–2000 字符。服务端验证并存储成功后才返回 `201` 或 `202`，失败返回相应 4xx / 5xx。前端成功文案为“已收到，审核后会显示在这里”。

Worker 还需处理跨域 `OPTIONS`，允许来源限定为 `https://lufei-lee.github.io`，方法为 GET / POST / OPTIONS，允许 `Content-Type`。CORS 不是身份验证，写入仍须验证 Turnstile 并限制频率。公共读接口不返回 IP、验证 token、管理数据或待审核内容。

## 官方说明

- [Workers 入门](https://developers.cloudflare.com/workers/get-started/guide/)
- [D1 创建数据库和绑定](https://developers.cloudflare.com/d1/get-started/)
- [Turnstile 开通](https://developers.cloudflare.com/turnstile/get-started/)
- [Turnstile 服务端验证](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Workers 请求地区数据](https://developers.cloudflare.com/workers/runtime-apis/request/)

当前这一步只完成前端与接入约定。Workers 代码、D1 数据库、Turnstile 真实验证和线上提交测试，留待账号注册完成后继续。
