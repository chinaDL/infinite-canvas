# New API 固定上游接入

本次修改包含 `/Users/whaz/soft/infinite-canvas` 和 `/Users/whaz/soft/new-api` 两个仓库。需要部署两边修改后的版本；官方原版镜像不包含本次功能。

## 部署参数

| 部署位置 | 参数 | 示例 |
| --- | --- | --- |
| 画布 Docker 环境变量 | `NEW_API_BASE_URL` | `https://api.example.com` |
| 画布本地开发或静态构建 | `VITE_NEW_API_BASE_URL` | `https://api.example.com` |
| New API 环境变量 | `CANVAS_BASE_URL` | `https://canvas.example.com` |

地址填写站点根地址，不含 `/v1`、子路径、查询参数或用户名密码；可以有末尾 `/`。生产使用 HTTPS，本机开发允许 `http://localhost:端口` 或 `http://127.0.0.1:端口`。

画布容器启动时将公开上游地址写入 `config.js`，优先于构建变量。`docker-compose.yml` 从环境或 Compose 的 `.env` 读取 `NEW_API_BASE_URL`。本地开发可参考 `web/.env.example`，使用 `web/.env.local` 提供 Vite 变量。不得在运行期配置中放入 API Key、管理员密钥或面板访问令牌。

New API 的 `CANVAS_BASE_URL` 留空或无效时不显示入口，也不签发 code。设置后由 `/api/status` 向菜单提供公开 origin，菜单打开固定 `/auth/new-api/start`；不需要登记 client。多实例 New API 必须配置同一个 Redis，单实例可使用内存缓存；Redis 连接出错时不会退回独立内存。

## 静态构建与 Caddy

在 `web/` 执行 `bun run build` 后产物位于 `web/dist/`。构建前可使用 `VITE_NEW_API_BASE_URL=https://api.example.com bun run build`；已经构建完成时，也可以直接将实际发布目录里的 `config.js` 改为以下内容，无需重新构建：

```js
window.__RUNTIME_CONFIG__ = {
  NEW_API_BASE_URL: "https://api.example.com"
};
```

如果该文件已有统计配置，保留已有字段并添加 `NEW_API_BASE_URL`。页面在应用代码前加载 `/config.js`，其中非空运行期值优先于构建时变量。只修改服务器 `.env` 或给 Caddy 进程设置环境变量，不会自动改写静态产物。

若 Caddy 反代现有静态服务器，继续使用原代理目标，并避免缓存该配置文件；以下 `127.0.0.1:3000` 替换为实际目标：

```caddyfile
canvas.example.com {
    header /config.js >Cache-Control "no-store"
    reverse_proxy 127.0.0.1:3000
}
```

被代理的静态服务器需要提供修改后的 `config.js`，并将 `/canvas`、`/auth/new-api/start` 等前端路由回退到 `index.html`。如果改由 Caddy 直接托管产物，可使用以下站点配置，将根目录改为实际发布目录：

```caddyfile
canvas.example.com {
    root * /srv/infinite-canvas/dist
    handle /config.js {
        header Cache-Control "no-store"
        file_server
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}
```

每次重新构建或覆盖发布目录后，要重新生成/保留这份运行期配置；也可以在构建前维护 `web/public/config.js`，让构建复制到产物中。部署后访问 `https://你的画布域名/config.js` 确认返回 JavaScript 和正确上游地址，再刷新画布。修改 Caddyfile 需要重新加载 Caddy，仅修改静态 `config.js` 不需要重启 Caddy。

配置方式参考 Caddy 官方的 [SPA 模式](https://caddyserver.com/docs/caddyfile/patterns) 与 [响应头指令](https://caddyserver.com/docs/caddyfile/directives/header)。上述示例已对照源码与官方文档核对，本轮未运行 Caddy 或实际发布。

## 操作行为

1. 用户登录 New API，点击「无限画布」，在本人 Key 列表中单选一把可用 Key，然后点击「进入画布」。列表使用掩码 Key，完整 Key 不经过菜单窗口消息。
2. 新画布页生成内存 verifier/state，向原面板发送 S256 challenge。原面板沿用自身登录 Bearer 调用 `POST /api/canvas/launch`。
3. 服务端检查登录会话和 Key 归属后签发 64 位大小写字母数字 code，30 秒有效，同用户新 code 替换旧 code。原页面通过定向窗口消息交给新页面。
4. 新页面携带 code/verifier 调用 `POST /api/canvas/exchange`。服务端原子消费，检查来源会话、账号和所选 Key，再返回用户快照与单个 Key。画布只保存 Key，不显示或持久化用户资料。
5. 交接成功更新唯一渠道，读取模型并进入 `/canvas`。模型读取失败不撤销已交付的 Key，也不阻止进入。

直接访问画布不调用交接接口。有本地 Key 时首次自动获取模型，没有 Key 时也能使用画布，生成前再配置 Key。手动更换 Key 后后续请求使用新 Key，不建立另一套身份。账号和 Key 切换不隔离或清空浏览器项目、素材。

用户配置只保存单个 `channel.apiKey`、`channel.models` 及既有偏好。导入和本地恢复按允许字段读取；夹带 `baseUrl`、`channels`、协议或名称不会覆盖部署渠道。导出和本地保存不含渠道地址。Key 仍沿用当前产品的浏览器本地保存及配置导出行为。

## 部署联调

- 两个站点需要允许本流程保留 opener。不要用 `noopener` 打开接入页。若反向代理启用了 COOP，New API 可按页面策略使用 `same-origin-allow-popups`，画布接入页不能以 `same-origin` 切断跨域 opener；常见组合为原面板 `same-origin-allow-popups`、接入页 `unsafe-none`。实际以浏览器验收为准。
- 兑换接口只允许 `CANVAS_BASE_URL` 对应精确 origin。反向代理不得将它改成通配 CORS，也不得缓存 launch/exchange 响应。浏览器模型请求继续使用 New API 既有 `/v1` 接口和 CORS。
- 刷新未完成交接的接入页会丢失 verifier，需要从菜单重新进入。关闭原页面、弹窗被拦截或代理切断窗口关系时可取消并直接访问画布，不降级为仅凭 code 兑换。
- 成功响应丢失不能重用已消费 code。交接和生成均不因此自动重放。
- 用户已取得的模型 Key 不因面板退出自动撤销；后续额度、分组、模型、IP、有效期等权限继续由 New API 模型接口检查。
- 本轮没有真实部署或付费生图测试，没有验证 Docker 静态资源发布链路；这些事项保留在 pending-test。

## 已执行验证

New API 根目录（Go 测试临时目录位于仓库内）：

```sh
TMPDIR="$PWD/.codex/validation/canvas/tmp" go test ./router ./controller -run '^(TestAccessTokenRouteRulesCoverEveryDashboardRoute|TestCanvasHandoff|TestCanvasOriginConfiguration)$' -count=1
```

New API `web/`：

```sh
bun run typecheck
bun run test src/features/canvas/__tests__ src/hooks/__tests__/sidebar-config.test.tsx
```

涉及 TypeScript 文件的 oxlint 已执行。服务端用例覆盖面板路由策略完整性、真实面板 JWT、本人 Key、错误证明/来源、重放、同用户替换、并发唯一成功、30 秒 Redis 过期、撤销会话、禁用账号/Key 及审计不含凭据；Redis 通过 miniredis 执行同一 Lua。真实多实例 Redis 与浏览器双域名尚待联调。生产数据库结构和 ORM 行为未改动，测试使用 SQLite，未声称执行三数据库迁移验收。

画布 `web/` 分别执行：

```sh
VITE_NEW_API_BASE_URL=https://new-api.example.com bun test tests/upstream-config.test.ts
VITE_NEW_API_BASE_URL=https://new-api.example.com bun test tests/model-selection.test.ts
```

覆盖配置注入不能改变请求目标、本地保存/恢复不含地址、固定单渠道、无 Key 不读模型、保留模型脚本/选择、换 Key 后丢弃旧列表响应、兑换固定 URL 且不带 Cookie/不跟随重定向。按画布约束未执行类型检查或生产构建。恢复进度和完整日志位置见 `upstream-integration.todo.md`。

## 安全依据与范围

参考 [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)、[Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)、[OAuth2](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)、[CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) 及 [ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0)。本次对应控制为 v5.0.0-3.4.2、3.5.1、3.5.3、3.5.5、7.2.1、7.2.3、7.4.1、7.4.2；短时 code 与 S256 参考 10.4.3、10.4.6。

这是同一运营者控制下的 Key 一次性交接，不是完整 OAuth/OIDC 服务器，也不宣称整个应用已通过 ASVS。固定地址限制配置入口和内置请求，不是浏览器网络沙箱；用户自定义脚本、插件、本地转发代理及 WebDAV 的既有网络能力不在本次调整范围内。
