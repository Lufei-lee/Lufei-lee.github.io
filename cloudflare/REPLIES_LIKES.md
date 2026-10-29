# 留言回复与点赞 / Replies and likes

部署顺序：先执行 migrations/0001_replies_likes.sql，再部署 worker.mjs，最后发布前端。
Migration is additive and idempotent. Deploy the Worker before the frontend.

- 原留言表保留不变；回复关系存在 message_replies，回复正文仍在 messages。
- 回复与新留言一样默认 pending，审核通过后才公开。父留言隐藏后，其回复也不公开。
- 一层回复；公开列表最多 50 条主留言和 500 条回复。
- 留言、回复、点赞/取消点赞均不需要人机验证；每个匿名浏览器标识对每条留言最多一赞。
- 浏览器使用 localStorage 保存随机标识及已赞状态；服务端只保存标识的 HMAC。清空浏览器数据或更换浏览器无法实现跨设备去重；这不是账户身份系统。
- 留言及回复共用每 IP 每 10 分钟最多 3 次限制；点赞独立限制为 30 次。只保存短期 HMAC，不存储原始 IP。
- 点赞接口是设置 liked 布尔值，不是翻转：重试相同请求不会重复累加或意外取消。
- 现有审核入口不变。审核回复时仍修改 messages.status；message_replies 可查询其父留言。
- 回复对象与草稿一同保存至 sessionStorage，提交成功后清除。

Verification: node --test cloudflare/worker.test.mjs

TURNSTILE_SECRET 仅保留作为原有 HMAC 私钥使用，以维持点赞去重标识连续；不再调用 Turnstile 服务。
