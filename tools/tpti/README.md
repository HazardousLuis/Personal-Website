# TPTI 开发测试版

运行 `node tools/tpti/server.mjs`（Node.js 24），通过
`http://127.0.0.1:4173/projects.html` 打开项目页，再点击测试入口。

- 页面地址为 `/project/tpti/`，提交接口为 `POST /project/tpti/api/responses`。
- 答卷与选填意见保存在 `tools/tpti/data/responses.sqlite`，该目录已被 Git 忽略。
- 部署时通过 `TPTI_DATA_DIR` 指定持久磁盘，通过 `HOST` 与 `PORT` 指定监听地址及端口。由现有站点的反向代理把答卷接口转发至该服务，或使用该服务提供项目页和问卷。
- 纯静态部署需要另行部署同路径的答卷接口。未连接收集服务时，页面会保留本机答卷并提示提交失败。

## Vercel 部署

个人站点保持原有静态部署，`vercel.json` 将答卷提交转发到 `api/tpti-responses.js`。
在同一个 Vercel 项目中连接 Upstash Redis，让 Preview 和 Production 获得对应环境的
`KV_REST_API_URL` 与 `KV_REST_API_TOKEN`（也支持 `UPSTASH_REDIS_REST_*`）。
建议测试和正式答卷使用不同的数据库。答卷保存在 Redis 哈希 `tpti:responses:v1`，字段名是答卷 ID。
提交重试复用同一个 ID，已有记录不会被覆盖。没有公开读取接口。
