# TPTI 开发测试版

运行 `node tools/tpti/server.mjs`（Node.js 24），通过
`http://127.0.0.1:4173/projects.html` 打开项目页，再点击测试入口。

- 页面地址为 `/project/tpti/`，提交接口为 `POST /project/tpti/api/responses`。
- 答卷与选填意见保存在 `tools/tpti/data/responses.sqlite`，该目录已被 Git 忽略。
- 部署时通过 `TPTI_DATA_DIR` 指定持久磁盘，通过 `HOST` 与 `PORT` 指定监听地址及端口。由现有站点的反向代理把答卷接口转发至该服务，或使用该服务提供项目页和问卷。
- 纯静态部署需要另行部署同路径的答卷接口。未连接收集服务时，页面会保留本机答卷并提示提交失败。
