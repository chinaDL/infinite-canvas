# 项目理解与恢复记录

本文件是本次项目梳理的唯一进度来源。只从唯一的 `[~]` 项继续；已完成项不重复执行。本次仅阅读代码并保存理解记录，不修改业务逻辑，不启动服务、构建或测试。

## 进度

- [x] 核对项目规则、目录、版本和当前待办。
  - 已读取：`AGENTS.md`、`README.md`、`docs/index.md`、各子项目 `package.json`、`VERSION`、`docs/content/docs/progress/todo.mdx`、`docs/content/docs/progress/pending-test.mdx`。
  - 已核实：当前分支 `dabai`，初始工作区干净，根版本 `v0.20.0`；包含 Web、Canvas Agent、本地代理、插件和文档站。
  - 阅读命令：`rg --files`、`cat`、`git status --short`、`git branch --show-current`。命令成功，无错误。
  - 验证结果：目录和依赖清单相互吻合；产品 TODO 主要为 Claude Agent SDK 适配和 Skill/本地记忆扩展。待测试列表已有大量已实现功能，不将其误判为未实现。
  - 已修改文件：仅本恢复记录；无测试命令、无错误。
- [x] 梳理前端入口、画布交互、生成调用与本地存储。
  - 已核实子步骤：启动与路由（`main.tsx`、`router.tsx`、`AppProviders`、`UserLayout`）；画布类型与项目持久化（`types/canvas.ts`、`stores/canvas/use-canvas-store.ts`、`lib/localforage-storage.ts`）；参考资源组装（`canvas-node-generation.ts`）。
  - 结果：React 19/Vite 7；8 个业务路由；节点包含图片、文本、配置、视频、音频、组及插件类型。项目 store 保存节点、连线、视口、会话等；主编辑状态在画布项目页面。资源引用会展开组并按节点去重。
  - 验证方式：`cat`、`sed`、`rg -n` 静态交叉阅读，无运行测试。首次读取大型项目页输出被截断，后续改用符号检索和分段读取；这不是网络错误。
  - 已修改文件：仅本恢复记录。
  - 后续已核实：`project.tsx` 的项目恢复、状态保存、生成入口；`infinite-canvas.tsx` 的手动平移缩放；`use-config-store.ts` 的渠道/模型/协议/脚本选择；`services/api/{image,video,audio,model-plugin}.ts` 的调用入口；`services/{image-storage,file-storage}.ts` 的 Blob 存储与引用清理。
  - 结果：自绘 DOM/React 节点和连接，无 React Flow 依赖；OpenAI 与 Gemini 协议、自定义模型脚本共存；浏览器直连为默认方式，可开启本地代理。图片预览与原图分离，预览不是长期业务内容。工作台历史各有独立 object store。
  - 验证结果：页面调用与服务导出、数据类型、存储键交叉匹配；只做静态阅读，未运行构建/测试，无测试进程。
- [x] 梳理本地 Agent、代理、插件与同步边界。
  - 已核实子步骤：Agent `index.ts` 分 HTTP/MCP 启动；`server/http.ts` 提供鉴权、事件流、快照、工具结果、会话/Skill 接口；`server/mcp.ts` 转发工具到本地 HTTP；`codex-client.ts` 启动 Codex app-server stdio。
  - 前端 `local-agent-panel.tsx` 维护 SSE 与工具确认，`use-agent-bridge.ts` 将操作应用回页面状态并复用生成入口。`canvas-proxy/index.js` 是独立 Node HTTP 转发器，不是业务后端。
  - 已核实插件与同步：`plugin-loader.ts` 动态导入插件并注册节点；`use-plugin-store.ts` 在本地保存插件源码/开关；`app-sync.ts` 对画布、素材、图片历史、视频历史分别同步，包含画布删除标记。
  - 验证方式与结果：`sed`、`rg -n` 静态对照成功，未启动 Agent/代理或进行网络调用。已修改文件仅本记录。
  - 补充核实：Agent 协议版本为 6，消息元数据存储版本独立为 1；主题通过 `canvasThemes` / `AppProviders` 管理，国际化默认中文并支持英文；提示词来源是标准 JSON；Docker 构建 Vite 产物，由 Nginx 提供静态页面。
  - 结果：没有项目业务后端或 Go 服务；本地 Agent、代理都是独立可选工具。Agent 用户配置/元数据在用户目录 `.infinite-canvas`，本次未读写这些实际用户数据。未验收部署运行效果。
- [x] 保存后续改动定位说明，确认功能待办和待测试文档是否需要更新。
  - 已检查英文与中文产品 TODO，已阅读待测试文档；本次没有功能变更，因此两类文档及 CHANGELOG 无需修改。
  - 已完成：下方保存架构、生成链路、存储/同步边界、Agent/插件边界及按功能定位表。
  - 验证命令：`git status --short`、`git diff --stat`、目标文档 `git diff`、本文件状态 `rg -n`；结果为仅新增 `docs/project-understanding.todo.md`，业务代码、产品 TODO、待测试文档和 CHANGELOG 均无改动。无错误，未执行测试、无测试进程。
  - 恢复位置：本次梳理已完成，无进行中步骤；后续收到具体需求后先核对对应源码现状，再建立该需求的恢复 TODO。

## 恢复与验证约定

- 每个独立步骤完成即记录已读/已改文件、验证方式与结果，再推进下一项。
- 当前仅新增本文件；无业务代码修改，未执行测试，无测试进程。
- 网络错误时保留当前 `[~]` 和完成记录；先落盘失败原因及恢复点，再决定是否需要外部重试。

## 后续改动定位

以下是当前分支的源码阅读结论，不代表已运行验收；后续实现前仍需核对相关文件的新改动。

### 整体结构

| 目录 | 职责 |
| --- | --- |
| `web/` | 主应用：React 19、Vite 7、TypeScript、React Router 7、Ant Design 6、Tailwind 4、Zustand 5；图片/视频工作台、画布、素材、提示词、配置。 |
| `canvas-agent/` | TypeScript/Node/Express 本地服务，连接 Codex app-server，提供 HTTP、SSE、MCP、会话与 Skill 管理；Claude CLI 适配代码保留，界面目前主要开放 Codex。 |
| `canvas-proxy/` | 独立 Node HTTP 转发 CLI，默认 `127.0.0.1:23210`，解决浏览器跨域并转发流式响应。 |
| `plugins/canvas/` | 节点插件 SDK、注册表、示例：Markdown、SVG、HTML、全景、便利贴。 |
| `plugins/infinite-canvas/` | Codex/ZCode 插件入口与画布操作 Skill，连接本地 Agent。 |
| `docs/` | 独立 Next.js/Fumadocs 中英文文档站；`docs/index.md` 为 AI 文档索引。 |

应用入口为 `web/src/main.tsx` → `AppProviders` → `router.tsx` → `UserLayout`。业务路由包括 `/`、`/image`、`/video`、`/assets`、`/prompts`、`/canvas`、`/canvas/:id`、`/config`。全局 Agent 面板挂载在 `UserLayout`。

### 画布与生成数据流

1. `pages/canvas/project.tsx` 负责当前项目编辑状态：节点、连线、视口、选择、撤销重做、生成控制、各类编辑弹窗。当前约 3476 行，是核心业务入口，改动应限定在相关逻辑内。
2. `components/canvas/infinite-canvas.tsx` 管理画布平移、缩放、键盘工具切换和背景；`canvas-node.tsx`、`canvas-connections.tsx` 等负责节点与连线展示。使用 React/DOM 和自有几何逻辑，未依赖 React Flow。
3. `types/canvas.ts` 定义节点、元数据、连线。内置节点为图片、文本、生成配置、视频、音频、组；节点类型允许插件字符串。多图和多文本结果保存在节点元数据的 `images` / `texts` 中。
4. `canvas-node-generation.ts`、`canvas-resource-references.ts` 解析连线和 `@[node:...]`；组展开为资源，重复引用按节点去重；普通提示词与配置节点 composer 的组装规则不同。
5. `canvas-generation-helpers.ts` 合并节点和全局生成配置；`use-config-store.ts` 解析渠道、能力、模型和调用脚本；`services/api/{image,video,audio}.ts` 负责外部请求。
6. 图片/文本支持 OpenAI 与 Gemini 路径；视频有任务创建、轮询、结果下载和恢复；音频内置走 speech 接口。模型自定义脚本通过 `model-plugin.ts` 执行，独立于画布节点插件。
7. 结果通过 `image-storage.ts` / `file-storage.ts` 保存 Blob，节点记录 `storageKey` 和元数据；页面再调用 `useCanvasStore.updateProject` 持久化项目。

### 存储与同步边界

- 项目、素材、已安装插件使用 Zustand + localforage；主要数据库名为 `infinite-canvas`。
- `app_state` 保存业务状态，`image_files` 保存原图，`image_previews` 保存预览，`media_files` 保存视频/音频；图片与视频工作台历史分别在 `image_generation_logs`、`video_generation_logs`。
- `blob:` URL 只是当前浏览器会话的展示地址，持久引用以 `storageKey` 为准；打开项目会补水恢复资源 URL。
- 原图、预览和历史引用的生命周期要一起考虑；清理图片时会读取工作台历史引用，避免误删。预览不应进入业务导出和同步内容。
- 配置 store 当前使用 Zustand 默认持久化（localStorage），包括渠道、API Key 与 WebDAV 设置；语言、面板宽度等小配置也在 localStorage。新增业务数据仍遵循项目约束，默认 localforage。
- AI 请求默认由浏览器直连；开启本地代理时经 `withLocalProxy` 改写地址。不能假设有业务后端代管 API Key。
- `services/app-sync.ts` 已实现可配置的 WebDAV 同步，分画布、素材、图片历史、视频历史四域；画布有删除标记。它不是账号云同步。

### Agent 与插件边界

- Agent 链路：前端 `local-agent-panel.tsx` ⇄ HTTP/SSE ⇄ `canvas-agent/src/server/http.ts` ⇄ Codex app-server。MCP 子进程通过 `server/mcp.ts` 调用本地 `/api/tools`。
- 网页通过 `use-agent-bridge.ts` 发布画布快照与操作能力；工具修改最终进入 `canvas-agent-ops.ts` 和页面状态，生成操作复用页面生成入口。
- 消息按 `threadId`、`turnId`、`itemId` 归属；历史与实时数据的合并需保持现有权威关系。前端消息/审批/工具状态与本地 Agent 元数据文件是不同层，不应混用。
- `node-registry.ts` 统一注册内置和插件节点；`plugin-loader.ts` 下载/执行插件，`use-plugin-host.tsx` 提供宿主能力；`CanvasNodeDefinition.resource` 让插件节点参与生成参考。
- 节点插件直接在页面执行，模型脚本也在浏览器执行；二者都是现有扩展边界，新增功能先判断是否可以沿用。

### 按需求查找文件

| 改动方向 | 优先入口 |
| --- | --- |
| 画布拖拽、缩放、连线、分组、快捷键 | `pages/canvas/project.tsx`、`components/canvas/infinite-canvas.tsx`、`lib/canvas/canvas-node-geometry.ts` |
| 节点展示、工具条、提示词与参考选择 | `components/canvas/canvas-node.tsx`、`canvas-node-hover-toolbar.tsx`、`canvas-node-prompt-panel.tsx`、`canvas-config-composer.tsx` |
| 生成参数、模型/渠道、请求协议 | `stores/use-config-store.ts`、`lib/media-size.ts`、`components/*-settings-panel.tsx`、`services/api/` |
| 图片和视频工作台 | `pages/image/index.tsx`、`pages/video/index.tsx` |
| 素材与提示词来源 | `pages/assets/`、`stores/use-asset-store.ts`、`pages/prompts/`、`services/api/prompts.ts`、`prompt-source-runtime.ts` |
| 项目保存、媒体存储、导入导出、WebDAV | `stores/canvas/use-canvas-store.ts`、`services/*storage.ts`、`lib/canvas/canvas-export.ts`、`services/app-sync.ts` |
| Agent 对话、历史、审批、工具 | `components/agent/`、`stores/use-agent-store.ts`、`pages/canvas/hooks/use-agent-bridge.ts`、`canvas-agent/src/` |
| 节点插件 | `types/canvas-plugin.ts`、`lib/canvas/plugin-*.ts`、`plugins/canvas/sdk/` |
| 主题与语言 | `lib/canvas-theme.ts`、`lib/app-theme.ts`、`stores/use-theme-store.ts`、`i18n/locales/` |

表中 `web/src/` 内路径均相对于该目录；其他目录写仓库相对路径。

### 文档与实施约束

- 功能文档部分描述落后于源码，例如仍只列三种节点；后续以源码和待验收记录交叉确认，不把文档文字直接当成当前能力上限。
- 当前产品 TODO 集中在 Claude Agent SDK 适配、工具队列、Skill 网络安装/资源文件和本地记忆；本次没有完成任何产品待办，也没有新增待测试功能。
- 只在明确需求范围内修改；使用中文沟通和 UTF-8；UI 不新增说明描述，沿用画布主题与扁平交互风格。
- 新增/调整超时、重试、大小或并发等行为边界需要先说明并取得确认。不得自行合并 main、覆盖用户改动或顺手重构。
- 按项目要求，本次不构建、不做语法检查、不启动服务/测试；阅读结果只用于理解架构，不作运行成功声明。
