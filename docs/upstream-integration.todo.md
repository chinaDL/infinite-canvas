# 上游绑定与身份接入讨论

本文件是本次接入讨论、准备核查及实施的唯一恢复进度来源。用户已明确要求“改代码吧”，按已认可方案完成两边开发，不部署或合并分支。

## 已知目标与待确认信息

- 用户目标：部署时绑定一个上游；用户点击上游新增菜单后，画布能获得对应用户的信息。
- 已确认：上游为 New API，用户完全可控，可以修改其登录和 API。
- 已确认：画布使用单独的域名，不部署在 New API 的子路径。
- 最新约束：用户希望取消预先登记 client 的要求，询问安全的其他身份接入方法；原应用登记设计尚未认可。
- 用户最新提出：菜单打开新页，由上游签发一次性随机 code，30 秒有效、每个用户同时仅一个；画布兑换账号、余额、分组及 Key 信息，用户选择自己的 Key 调用 New API 生成。当前要求评估可行性与问题，尚未授权实现。
- 最新明确：code 为 64 个随机大小写字母与数字，30 秒有效、每用户同时一个、一次性使用；Key 仅限当前登录用户本人，可一次交付，用户也接受在 New API 菜单入口展示本人 Key 列表供选择后交付；持久化沿用画布已有行为，不单独改策略。用户当前询问“绑定发起页面如何实现”，尚未授权产品实现。
- 最新范围修正：以画布现有上游/渠道配置能力为准，尽量少改画布；如果每个渠道只支持一个 Key，New API 菜单应单选一个本人 Key 后进入新页认证，只向画布交付一个 Key。此前多选/全选不再作为默认设计。
- 最新确认：在部署绑定模式下，画布只能有一个上游渠道；用户不能新增渠道或修改上游地址，渠道基础配置只允许修改 Key；base URL 由部署配置固定。用户仍在补充功能设计，未要求开始整体实现。
- 最新简化：固定上游场景去掉 URL 参数导入；配置文件导入/导出和浏览器本地配置均不包含渠道地址，运行时唯一读取部署 base URL。Key、模型等其他配置继续按已有能力处理。
- 最新明确：用户资料不用显示；有本地 Key 或没有本地 Key 都可直接访问画布，直接访问不兑换 code；切换账号或 Key 时本地项目、素材不隔离；首次进入有 Key 才自动获取模型；上游永远是用户自己的 New API，不考虑更换上游或旧 Key 发给其他上游的场景。
- 最新确认：用户理解了用户身份由 launch 的面板登录鉴权确定、challenge 只绑定兑换页面的职责，并表示方案没问题；当前询问是否具备开发条件，未要求本轮启动业务实现。

## TODO

- [x] 核对现有接入点并提出可讨论方案。
  - 已读取：已有项目理解记录、brainstorming 技能、`runtime-config.ts`、`env.ts`、`use-user-store.ts`、`user-status-actions.tsx`、`use-config-store.ts` 凭据导入片段、`pages/config/index.tsx`、`docker-compose.yml`。
  - 源码结论：当前部署运行期配置仅含统计变量；URL 凭据导入只写入模型渠道；user store 有用户类型但无登录/加载用户实现。配置导入不等于身份认证。
  - 已向用户询问上游类型及接口改造能力，等待回复；未选定认证协议或新增后端。
  - 验证方式：`cat`、`sed`、`rg --files`、`git status --short`，成功；仅新增本讨论记录，无构建/测试/服务进程。
  - 外部资料错误：`web.run` 打开 RFC 9700 和 OIDC Core 时返回 HTTP 500，明确报错为当前通道不支持 `/v1/alpha/search`。归类为工具服务配置问题，不当作可退避恢复的网络超时；不重复调用该通道。
  - 替代资料通道：`grok_search.web_fetch` 读取 RFC 9700 返回 `isError: true`，未提供具体原因；无法判定为网络问题，已停止外部资料调用。本轮没有成功取得外部标准原文，不将方案表述为已完成规范核验。
  - 已形成条件性建议：部署配置绑定上游公开地址；上游负责认证并返回真实当前用户；同源可复用会话，跨站优先复用现有 OAuth/OIDC 授权码流程；模型调用凭据与用户身份分开处理。
  - 验证结论：源码现状已核实，方案仅用于讨论；当前未修改产品代码、无运行测试。
- [x] 结合用户反馈明确登录衔接、用户数据范围及部署方式。
  - 完成依据：用户表示“了解了，没问题”；固定上游、单 Key、一次性交接、页面绑定、直接访问及本地数据共用等规则已收敛。通过本地源码静态核查和多轮文档回读验证设计一致，业务实现及运行验证尚未开始。
  - [x] 按最新五项决定收敛设计，已完成文档静态核对。
    - 修改文件：`docs/upstream-integration-design.md` 与本恢复文件；不显示资料、开放直接访问、直接访问不兑换、本地项目/素材不隔离、首次有 Key 自动获取模型、不考虑更换上游，均纳入当前设计。流程图和双方改动表已同步移除画布身份状态接入与过时待定项。
    - 最小改动建议：画布只消费兑换得到的 Key，不维护或持久化用户身份，手动换 Key 后由 New API 按当前 Key 鉴权；此前兑换响应的 user 字段可保留，用户没有要求接口删除资料。自动读取复用现有模型服务，保留模型能力、脚本及用户选择；不额外增加每次编辑 Key 自动刷新的行为。
    - 已核对源码：`fetchChannelModels` / `fetchImageModels` 返回排序后的模型名称；现有 ModelSelectModal 具有手动读取入口；channel-editor-drawer 和 normalizeChannelModels 已有名称转模型、能力识别及保留模型设置的逻辑。
    - 验证命令：目标 `sed`、`cat docs/upstream-integration-design.md`、`rg -n` 检索过时表述、`git status --short`。文档回读一致，过时表述检索无命中（rg 退出码 1 为预期，不是执行失败）。首次批量文档输出截断，已单独读取完整设计及恢复文件尾部补齐；产品 pending-test 只读取开头，不将截断输出视为全量验收。无网络调用或新错误。
    - 验证边界：仅更新设计，没有业务代码、测试/构建命令或测试进程；产品 TODO 与 pending-test 已检查本轮变更范围，和 CHANGELOG 均无已实现功能需更新。New API 工作区未修改。
    - 下一步：向用户反馈收敛后的访问、换 Key 和模型读取行为，继续接收设计意见；尚未授权开始业务实现。
  - 已收到用户反馈：New API 完全可控；本机存在 `/Users/whaz/soft/new-api/`，只读核查其认证代码，不修改上游。
  - 已完成上游只读核查：根及 web 的 AGENTS、`docs/authentication.md`、`router/api-router.go`、`router/relay-router.go`、`middleware/auth.go`、`controller/auth_session.go`、`controller/user.go`、Cookie 配置及会话符号。大批量输出曾被截断，已用目标函数/分段读取核实关键行为。
  - 已验证：该本地版本面板使用内存 JWT + HttpOnly Refresh Cookie；Cookie 路径 `/api/user/auth`，SameSite=Strict，未设跨域 Domain；`UserAuth` 读取 Bearer，不直接读取 Refresh Cookie，也不依赖 `New-Api-User`。refresh 会轮换 Cookie，返回访问令牌、用户和会话；前端还需要复用标签页间刷新协调机制。
  - 已验证用户数据：`/api/user/self` 与 `/api/user/models` 经过 UserAuth；用户 DTO 包含稳定 ID、用户名、显示名、分组和额度，未看到头像字段，不能承诺现有接口提供头像。
  - 已验证模型鉴权：`/v1` 经过 TokenAuth；`/pg/chat/completions`、`/pg/images/generations`、`/pg/images/edits` 可用面板 UserAuth。不要笼统声称所有生成接口都必须新建 API Key，也不要将 `/pg` 当前能力扩大到视频/音频。
  - 外部文档补充核查成功：Context7 `/quantumnous/new-api-docs-v1` 的当前用户接口与 API 鉴权文档；确认 self 用于当前登录用户、标准 `/v1` 用 API Key。具体会话行为以本地源码为准，不套用官方旧接口说明。
  - 条件性推荐：允许同源时使用同一公开域名下独立子路径，复用 New API 会话；画布首次访问调用 refresh 获取内存令牌和用户，后续可读 self。独立域名时再讨论应用授权码交换及其必要改造，不能只代理 refresh 就假定 Cookie 能共享。
  - 部署限制：画布路由当前没有 basename，同域子路径需要适配路由和静态资源，不能称为现成可直接部署；上游必须按最终部署代码再次核对。
  - 验证方式：`sed`、`rg -n`、Context7 文档查询、`git status --short`；只读分析成功，未运行测试/构建，无测试服务进程。已改文件仅本恢复记录；工作区另有上一轮项目理解记录，均为未跟踪文档。
  - 最新用户反馈：画布会单独配置域名，不采用同域子路径；后续按独立域名方案讨论，不再推进子路径适配。
  - 当前讨论方向：菜单先打开画布，由画布发起带 PKCE 和 state 的授权请求；New API 利用自身登录态完成授权，再返回一次性授权码，由画布兑换限定权限的应用访问凭据。该能力需要在 New API 新增，不能把已有第三方登录功能当作已有授权服务端。
  - 已独立核实方案资料：Context7 成功读取 `/panva/oauth4webapi` 的授权码请求、PKCE S256、state 校验和公共客户端 None 文档；纯前端可作为无 client secret 的公共客户端。此处只确认协议方向，没有选定实现库或声称 New API 已提供这些接口。
  - 本轮拟反馈：独立域名采用授权码 + PKCE；New API 菜单先进入画布，再由画布发起授权，回调只携带一次性 code/state，不传长期 API Key；New API 限定回调地址、应用权限与允许访问的前端来源。画布部署配置只保存公开地址和应用 ID。
  - 本轮验证：读取本恢复文件、Context7 查询及本文件局部更新成功；只改讨论记录，没有产品实现、构建/测试或启动进程；产品 TODO、pending-test、CHANGELOG 无需修改。
  - 最新请求：用户要求带参数的设计和流程图，用于检查方案；尚未确认模型生成范围。继续在当前讨论项内准备可审阅设计，按独立域名、新页面打开、画布纯前端进行提案，生成权限标为可选。
  - 本轮交付子步骤：落盘设计草案，包含部署配置、应用登记、授权/回调/兑换/用户接口、会话恢复与可选生成流程；交叉检查参数和流程一致后提交用户审阅，不编写产品代码。
  - 已完成并验证：新增 `docs/upstream-integration-design.md`，包含两个部署环境变量、New API 应用登记 JSON、菜单及授权 URL、授权/兑换请求参数、用户资料响应、完整 Mermaid 时序图和可选生成流程图。
  - 草案关键取舍：画布纯前端；应用凭据仅放内存；刷新/到期后通过顶层授权跳转恢复，明确可能打断操作。自有应用信任、默认新标签页和无长期 refresh token 均为提案，不视为用户已确认。
  - 草案校对：分段读取完整设计，核对菜单/回调/授权端点和参数一致，明确 New API 页需先同源恢复面板访问令牌，新增应用凭据不能直接当现有模型 API Key。授权码原子消费、来源会话撤销、账号数据隔离和不重放生成请求均已说明。
  - 本轮验证方式与结果：Context7 查询成功；`sed` 完整分段阅读及 `git status --short` 成功；只新增设计并更新本讨论记录。无构建/测试命令，无服务进程；检查产品 TODO 与 pending-test 后确认没有可更新的已实现变更，CHANGELOG 无需修改。
  - 本轮进行中：比较不登记 client 的接入方案。优先评估固定画布菜单地址 + 一次性票据，复用菜单地址限定接收方；另比较仅展示用户信息时的严格 origin/source 校验 postMessage，以及增加服务端后的票据兑换。区分“不登记 client”与“完全不配置接收方”。
  - 已完成本轮比较并落盘：`docs/upstream-integration-design.md` 开头新增无 client 替代方案；原方案明确标记为参考、未采纳。推荐复用运营者设置的菜单地址作为服务端可信接收方，画布只配置上游 URL；票据绑定 PKCE 和来源会话，exchange 基础响应直接返回用户快照，持续接口凭据只在需求明确后增加。
  - 备选结论：仅展示资料可采用严格校验 origin/source/随机请求标识的 postMessage；需可用窗口引用，无法单独解决后续服务端鉴权。Context7 成功读取 MDN postMessage、opener 和 COOP 文档，已记录来源与限制。
  - 本轮变更与验证：只更新设计与恢复记录；通过资料查询及文档局部回读核对方案边界，无业务代码修改、构建/测试或启动进程。没有已实现功能或产品待办状态变化，产品 TODO、pending-test、CHANGELOG 无需修改。
  - 当前评估子步骤：按用户的新提案核查菜单直接访问接口的认证、完整模型 Key 的读取能力和保护、一次性缓存的原子语义、票据被截获或替换后的影响。30 秒和每用户同时一个是用户提出的边界，无需重新要求确认；“64 位”需澄清字符数与随机位数。
  - 新增源码证据：`middleware/auth.go` 只从 Authorization 读取面板身份；`controller/auth_session.go` refresh 只读专用 Cookie；`controller/token.go` 的列表/GetToken 返回掩码，GetTokenKey 按 token ID + 当前用户校验后返回完整 key，路由为 POST `/api/token/:id/key`，附限流、禁缓存和审计；批量完整 Key 另有接口。
  - 已完成本轮评估：设计文件顶部新增用户 30 秒单 code + 模型 Key 提案的可行性、入口改动、原子兑换、票据窃取/登录串号、Key 暴露与持续有效性、数据快照和账号隔离问题；以前设计标为历史备选，不重新推动 client 登记。
  - 补充已验证：模型 Key 有状态、到期、额度、模型、分组及 IP 等约束；`/api/usage/token/` 仅在 Key 开启 allow_user_quota_query 时返回账号额度，不能混同账号余额与 Key 余额。普通完整 Key 获取并无额外 2FA 路由，反馈仅描述实际限流、审计、归属和禁缓存，不虚构验证要求。
  - 本轮资料与变更：Context7 成功读取 OWASP 单次随机 URL 凭据与 CSRF 指导；只更新 `docs/upstream-integration-design.md` 和本恢复文件，未运行构建/测试、未启动进程，没有需写入产品 TODO、pending-test 或 CHANGELOG 的已实现变更。
  - 本轮进行中：按最新已明确规则收敛，并详细说明页面绑定实现；拟用原 New API 页面与新画布接入窗口的 postMessage 握手，画布生成内存 verifier、只发 challenge，原页面带自身 Bearer 申请绑定 code 后定向回传，画布 code + verifier 兑换。不再索要已确认的 Key 范围、字符集或持久化选择。
  - 已完成本轮说明设计：顶部更新 `docs/upstream-integration-design.md`，记录 A-Z/a-z/0-9 共 64 字符的 code、30 秒单次单用户一份、上游选择本人 Key 一次性交付和沿用现有保存机制；提供窗口握手参数、签发/兑换接口、S256 绑定及成功后的清理流程。
  - 已核对安全与限制：发送精确 targetOrigin，接收双向检查 origin/source/state，签发绑定首个有效窗口事务；verifier 仅在画布内存及兑换 POST 中出现，验证正确后原子消费 code。绑定证明秘密持有者，不冒称物理设备绑定；实际部署若 noopener/COOP 导致窗口通道不可用则停止，不回退为裸 code。
  - 验证：Context7 成功取得 MDN postMessage/open/opener 与 PKCE S256 文档；新设计段落完整回读成功。一次 rg 包含不存在的 `web/nginx.conf` 返回退出码 2，属于检索路径问题；`rg --files` 已确认实际为根 `nginx.conf`。New API 目标目录未匹配 COOP 文本（退出码 1）；未声称线上头已验证。无产品代码修改、构建/测试或启动进程；产品 TODO、pending-test、CHANGELOG 无功能变更需更新。
  - 本轮进行中：核对 ModelChannel、渠道凭据导入和模型解析的实际结构，按最小画布改动原则收敛到单 Key 契约；检查同 baseUrl 导入是更新还是新增，避免误称整个画布只支持一个上游。
  - 已完成本轮核查：ModelChannel 每渠道一个字符串 apiKey，AiConfig.channels 支持多个渠道；channel-editor-drawer 每渠道一个密码输入框，app-config-modal 可新增渠道。已有 importChannelCredentials 按规范化 baseUrl 匹配第一个已有渠道并更新 Key（保留渠道 ID/模型），否则新增 models 为空的渠道；未自动拉取模型。
  - 已完成当前设计更新：New API 单选本人 Key，launch 请求改为单个 token_id，缓存绑定一个 token，exchange 仅交付一个 Key；画布复用既有 importChannelCredentials 和持久化，按上游地址更新对应渠道，不新增多 Key 列表或轮换能力。已说明首次模型配置仍需走现有入口，账号隔离不能从 URL 匹配导入推定已存在。
  - 本轮验证：`sed` 读取类型/导入/持久化，`rg` 核对实际 UI 字段，结果一致；一次 zsh 通配符 `web/src/components/config*` 未匹配，已用 `rg --files` 定位正确组件后完成核查，属于检索路径错误。只改设计与本记录，无构建/测试或启动进程，产品 TODO、pending-test、CHANGELOG 无已实现变更需更新。
  - 本轮进行中：将用户新增的固定单渠道要求纳入当前设计，核查 UI、配置文件导入、URL 凭据导入、持久化恢复和请求配置解析入口，避免只隐藏编辑控件但其他正常入口仍可更改部署地址。
  - 已完成本轮设计更新：`docs/upstream-integration-design.md` 当前规则新增固定上游模式，唯一渠道、base URL 以部署配置为准、基础字段仅 Key 可编辑；复用 channels 数组但约束为一项，所有普通配置入口统一处理，交接更新固定渠道 Key。
  - 已完成源码核对：配置 UI 可新增/删除并改 URL；URL 参数导入走 importChannelCredentials；持久化 merge 会恢复整个 channels；config-file 通过 setState 直接覆盖完整 config；请求解析从选中渠道取 baseUrl。设计明确这些入口均需纳入约束，不能只隐藏 UI。
  - 本轮验证：`sed`、`cat`、`rg` 静态阅读成功，文档补丁成功；仅改设计和恢复记录，无业务代码、构建/测试或启动进程；产品 TODO、pending-test、CHANGELOG 没有已实现功能或正式待办状态变化需更新。
  - 本轮进行中：把“禁止覆盖 base URL”进一步收敛为“渠道地址不属于用户配置”，更新设计中的导入、导出、持久化字段和 URL 导入范围；既有源码已核实，不重复读取。
  - 已完成：更新当前设计并回读验证，固定上游下移除旧 URL 凭据导入；配置文件导出/导入及浏览器持久化/恢复均不写入或读取渠道地址字段，运行时从部署配置补齐固定地址，其他用户配置照常处理。
  - 本轮变更与验证：只修改设计和本恢复记录；apply_patch 与 sed 回读成功，无业务代码改动、构建/测试或启动进程；产品 TODO、pending-test、CHANGELOG 无已实现变更需更新。
  - [x] 按用户“给我一个详细的总结”请求，整理唯一有效的完整方案。已重写 `docs/upstream-integration-design.md`，移除被替代的 client 登记、多 Key 和 URL 回调方案；讨论历史保留在本恢复文件。
    - 已完成内容：区分用户已确认规则、建议窗口握手与两个 POST 接口、待定产品行为；补齐时序图、单渠道约束、配置导入/导出/本地恢复排除地址、双方改动及失败处理。
    - 核对结果：64 个字母数字字符、30 秒、每用户一个、一次消费、单个 token_id 和单个 Key 的契约一致；code 不放 URL，verifier 仅保存在新页内存并提交兑换；资料快照与模型 Key 持续权限分开说明。保留余额刷新、直接访问、切换身份/本地数据、首次模型配置和部署切换凭据归属为待定，不误写为已确认需求。
    - 修改文件：仅 `docs/upstream-integration-design.md` 与本恢复文件。验证命令：`cat docs/upstream-integration-design.md`、产品进度文档局部 `sed`、`git status --short`，均退出码 0。pending-test 输出有截断，仅将已读部分用于确认本轮没有实现项，不声称审阅其全部内容。未执行测试或构建，无测试进程，无网络调用或新错误。
    - 文档检查：本轮仅设计审阅，没有产品实现或正式 TODO 状态变化，`docs/content/docs/progress/todo.mdx`、`pending-test.mdx` 与 `CHANGELOG.md` 无需修改。
  - [x] 回答 launch 的面板访问令牌来源，完成本地 New API 目标代码核查并补充设计。
    - 证据：`controller/user.go` 的 writeLoginResponse 返回 data.access_token；`web/src/stores/auth-store.ts` 的 setBundle 保存到内存 auth.accessToken；`web/src/lib/http-client.ts` 的请求拦截器自动添加 Bearer；`controller/auth_session.go` 与 `web/src/lib/auth-session.ts` 通过 HttpOnly Refresh Cookie 恢复 access_token；`web/src/lib/api.ts` 导出既有 api 客户端。
    - 结论：菜单复用已登录面板的 api 客户端，无需用户额外创建或填写登录令牌；该凭据只在 New API 内部调用 launch，不给画布。它与用户选中的模型 API Key 不同。
    - 变更：仅本恢复记录与 `docs/upstream-integration-design.md` 的签发说明。验证：目标 sed 读取成功；一次 rg 使用不存在的 use-login.ts 路径返回 2，属于检索路径错误，所需登录与 store 证据已通过实际存在文件确认，无需阻塞或重做；早先大范围 rg 截断已用目标读取补齐。未运行测试/构建，无服务进程，产品进度文档与 CHANGELOG 无实际变更需更新。
  - 最新用户授权与分工：New API 项目固定为 `/Users/whaz/soft/new-api`；后续 New API 接口由本助手完成，并按该项目约束同步记录自定义功能。用户本轮确认后续实施能力与责任，未要求立即启动业务实现。
  - [x] 已核对 New API 自定义功能维护要求，并落盘后续实施责任。
    - 已读：根 `AGENTS.md`，`CUSTOM_FEATURES.md` 的功能总表、记录结构和后续维护/合并流程。大段清单输出中间截断，未将本次读取冒称为所有已有功能的逐项验收；与新功能登记相关条款和格式已完整取得。
    - 确认：本助手后续负责 New API 的 launch/exchange 接口及相关接入，在实现时同步向根 CUSTOM_FEATURES 追加稳定编号，记录行为、入口文件、配置/数据、回归方法和限制；编号保留供 main 合并核对，不将计划描述为已经实现，也不写真实凭据。
    - 已检查工作区：`git status --short` 显示 CUSTOM_FEATURES、router/api-router、权限/审计和多处前端已有修改，以及钱包充值功能等未跟踪文件；未修改 New API 工作区，后续不得覆盖或回滚这些改动。当前清单到 CF-015，实际新增编号需以实施时的最新清单为准。
    - 修改：仅当前画布仓库 `docs/upstream-integration-design.md` 与本恢复记录。验证：cat、rg、git status 静态读取成功；未执行测试/构建，无测试进程，无产品实现，产品 TODO、pending-test 和 CHANGELOG 无变更需更新。
  - 该步骤已完成：最新五项产品行为和身份鉴权解释均已获得用户认可，继续执行后面的准备核查或实施步骤，不重复已完成的方案讨论。
- [x] 核对开发准备条件，记录已批准的方案及剩余部署配置。
  - 已核对：New API 根 AGENTS 的开发、安全验证与自定义功能维护规则，`go.mod`、`common/redis.go` 及 Redis 原子脚本既有调用位置；画布的 runtime-config 和 docker-entrypoint。源码支持复用现有 Redis / 内存架构和 config.js 配置注入，无需要用户补充决定的业务阻塞项。
  - 实施取舍已记录到设计：单实例内存缓存加锁，多实例共用 Redis；共享缓存故障不能回退各实例独立内存。缓存包装在调试模式下有打印 value/obj 的行为，后续敏感交接缓存应避免通过此路径泄露 code、verifier 或完整 Key。
  - 运行配置边界：真实 New API / 画布域名可在部署时填入；HTTPS、准确 origin 的 CORS 与 opener / COOP 在联调时验证。当前只核查可开发性，不表示 Redis 服务、域名、跨域或实际窗口通信已运行验证。
  - 工作区复核：画布仍仅三个未跟踪设计/恢复文档；本轮 New API git status 未列出受跟踪文件修改，列出未跟踪工具目录及可执行文件。早期讨论记录中的受跟踪修改状态已发生变化，实施前以最新状态为准，保留所有用户文件。
  - 修改文件：`docs/upstream-integration-design.md` 与本恢复文件。验证命令：cat / sed / rg 的目标读取、两个仓库的 git status；均成功。初次批量输出截断，根开发与认证约束已通过目标段落重新读取；CUSTOM_FEATURES 本轮只检索相关条目，未做功能全量验收。无网络调用或新错误。
  - 未运行测试/构建，未启动进程，未修改业务代码或 New API 工作区。产品 TODO、pending-test 与 CHANGELOG 没有已实现功能或正式实施任务状态变化需更新。
  - 下一步恢复位置：本轮向用户回答已具备开发条件；用户发起实施后，从下一个未开始步骤继续，不重复已完成核查。
- [x] 读取实施约束与适用 OWASP 指导，定位实际改动点。
  - 已获实施授权；已读取画布根约束、New API web 约束及 Go 技能（首次批量输出截断，需补齐未读约束）。工作区只保留设计记录和用户既有未跟踪文件。
  - 下一步：补齐目录约束与必读技能，核对接口鉴权、缓存、菜单、画布配置/初始化源码，记录适用安全控制后再编辑业务代码。
  - 已补齐双方目录约束、New API shadcn-ui 技能及本地组件 API，继续既有已确认设计，不重复审批。
  - 适用控制：OWASP Authentication、Session Management、OAuth2、CSRF 指导中的安全随机、S256 绑定、精确 origin/source、服务端归属/活会话校验、30 秒一次性消费、响应禁缓存及无凭据审计；已读仓库内此前保存的官方指导原文。ASVS 稳定版资料继续补齐，不宣称合规认证。
  - 已核对：GenerateRandomCharsKey、ValidateLoginSession、GetTokenByIds、CriticalRateLimit、TokenOperationAudit、现有 Redis 客户端、菜单/弹窗封装和画布配置链路。
  - 外部 web 工具再次返回通道不支持 /v1/alpha/search（500），属工具配置错误，停止该通道；仅追加保存缺失官方原文，不重复业务动作。
  - 无业务代码改动；无测试/构建/服务进程。
- [x] 实现 New API 固定画布配置、单次 code 缓存与 launch/exchange 接口。
  - 已写入 New API common/canvas.go、service/canvas.go、middleware/canvas.go、controller/canvas.go，并接入 router/api-router.go、middleware/audit.go、controller/misc.go、.env.example。
  - 静态核对：固定 origin、S256、64 字符 CSPRNG、30 秒、Redis Lua/内存锁替换及消费、活会话及 Key 归属校验、共享限流与审计、no-store 均已接入；后续集中回归。
  - 格式化尝试 gofmt 不在当前 PATH（退出 127，外部工具路径问题）；待定位已安装 Go。ASVS 补充下载读超时，已保留现有指导资料，停止该外部请求，不影响本地业务进度。
- [x] 实现 New API 菜单、本人 Key 单选和窗口握手。
  - 已新增 web/src/features/canvas/{api.ts,handoff.ts,canvas-menu-item.tsx}；接入侧边栏类型/过滤/渲染与 SystemStatus。菜单读取本人掩码 Key 列表，单选可用 Key，新窗口握手验证 origin/source/state/challenge；复用 singleUseAuthorization 的先刷新、禁止重放逻辑。
  - 复用候选已检查：components/dialog.tsx、ui/select.tsx、ui/sidebar.tsx、features/keys/api.ts；现有 chat preset 直接传 Key 的链接不适合一次性交接，新增业务握手；通用弹窗/选择/按钮未重复实现。
  - 已定位 Go 工具 /Users/whaz/sdk/go1.26.0/bin/gofmt，相关 Go 文件格式化成功。菜单国际化及专项回归留待集中验证步骤。
- [x] 实现画布固定单渠道、配置保存/导入/导出排除地址及删除 URL 凭据导入。
  - 已修改 runtime-config.ts、vite-env.d.ts、docker-entrypoint.sh、docker-compose.yml、use-config-store.ts、config-file.ts、app-config-modal.tsx、channel-editor-drawer.tsx。
  - 用户配置改为单个 channel 的 Key/models 与允许的标量偏好；本地恢复和文件导入不接受 channels/baseUrl，导出不包含渠道地址。运行时固定 default/New API/OpenAI，buildApiUrl 和请求解析固定部署地址。
  - UI 已去掉渠道增删、名称/协议/地址编辑；保留 Key、模型和脚本入口。URL 导入 store 动作已移除，ClientRootInit 在下步一起替换。
  - 验证：目标源码回读；按画布约束未执行语法检查/构建。安全行为测试后续执行。
- [x] 实现画布接入握手、兑换 Key 与首次模型读取。
  - 新增 services/api/new-api.ts、initialize-models.ts、pages/auth/new-api/index.tsx；路由已接入。ClientRootInit 删除全部 URL 凭据导入，首次有 Key 获取模型；接入页等待新 Key 后获取，失败保留原 Key。
  - 临时 verifier/state 仅内存，postMessage 定向且检查 source/origin/state；兑换无 Cookie、禁止 redirect、取消不写入 Key；失败不阻止直接进入画布。已处理 StrictMode 初次 effect 清理不得取消尚未发出的握手。
  - 用户身份不入 store，不改项目/素材隔离。模型初始化保留能力/脚本和选择，响应到达时 Key 已变更则丢弃旧结果。
  - 验证：源码回读；无构建或运行服务。
- [x] 完成针对性交接安全验证、检查改动并清理测试进程。
  - OWASP 官方 GitHub API 已读取 ASVS 5.0.0 的 V3、V7、V10；适用控制记录为 v5.0.0-3.4.2、3.5.1/3.5.3/3.5.5、7.2.1/7.2.3、7.4.1/7.4.2，借鉴 10.4.3/10.4.6 的短时/S256 规则。该实现是自有 Key 交接，不声明为完整 OAuth/OIDC 服务或完整 ASVS 合规认证。
  - New API 前端选择器及握手 7 项通过；lint 发现并修复多行 if 的花括号、type-only 导入、测试按钮 type，最终涉及文件 lint 通过；增加 Sidebar 原有回归最后确认中。
  - 画布新安全测试 6 项通过，既有模型选择 8 项单独执行通过。首次存储测试失败来自测试环境缺少 window.localStorage；已修正测试夹具，未增加产品兼容分支。两个文件独立运行避免已有测试模块缓存/存储桩互相影响。
  - 画布依赖按 bun.lock 安装成功，锁文件未变；未执行画布语法检查/类型检查/生产构建。New API TypeScript 检查已通过，新增测试后的最终结果见日志。
  - 验证日志：画布 docs/validation/upstream/；New API .codex/validation/canvas/。测试无常驻服务，后台测试任务正在最后回收；未启动生产服务或实际扣费请求。
  - 剩余人工范围：真实 HTTPS 双域名窗口通信、代理 COOP/弹窗设置、真实模型调用及 Docker 部署；不以单元测试代替生产联调。
  - New API controller/canvas_test.go 已加入 memory/Redis 两种缓存下的真实登录、本人 Key、错误 origin/verifier、重放、替换、并发、Redis 30 秒过期、禁用 Key、撤销会话、无凭据审计测试。命令 TMPDIR=<仓库>/.codex/validation/canvas/tmp go test ./controller -run '^TestCanvasHandoff$' -count=1 通过，进程已退出；日志在 New API .codex/validation/canvas/go-test.log。
  - New API bun run typecheck 通过（后续新增测试后需复查）。新增握手与选择器前端测试正在运行。
  - 画布安全配置/模型初始化测试已写入 web/tests/upstream-config.test.ts；首次执行因未安装 React 依赖失败，归类本地依赖错误，正在按 lockfile 安装依赖，不构建画布。
  - 两次工具命令目录/参数错误已纠正：国际化脚本首次 workdir 错误无写入，重新执行成功；Bun --cwd run 次序只输出帮助未执行测试，已改正确 cwd，不视为通过。
  - OWASP 已从保存的官方页面确认当前稳定版 ASVS 5.0.0；使用 GitHub 官方 API 补齐具体章节，最多本次一次替代读取。
- [x] 更新设计状态、画布产品文档/CHANGELOG、New API CUSTOM_FEATURES，交付改动和部署配置。
  - 已更新画布 AGENTS、CHANGELOG、文档索引、双语 pending-test、设计状态与部署说明，以及 New API CUSTOM_FEATURES 的 CF-016；New API 最终 typecheck、涉及文件 lint 和 20 项前端回归均通过。
  - 最后核查发现 launch 尚未登记面板 PAT 路由策略；当前先补充 session-only 声明，并将公开 exchange/OPTIONS 纳入既有路由完整性回归的豁免表，运行该回归后完成交付。不是需求阻塞，不重做已完成步骤。
  - 已补充 New API middleware/access_token_routes.go 的 session-only 声明、router/access_token_scope_test.go 的公开兑换/预检豁免及 controller/canvas_test.go 的禁用账号回归；gofmt 成功。命令 TMPDIR="$PWD/.codex/validation/canvas/tmp" go test ./router ./controller -run '^(TestAccessTokenRouteRulesCoverEveryDashboardRoute|TestCanvasHandoff|TestCanvasOriginConfiguration)$' -count=1 通过，两包退出码 0，日志 final-go-test.log，进程已退出。部署说明与 CF-016 同步了实际入口和验证命令。
  - 已复核双语产品 TODO：现有两项均属 Agent 后续工作，无本次上游事项需要迁移，确认无需修改。双语 pending-test 已将旧 URL 导入验收改为“参数不再改变配置”，补充账号禁用与无地址配置导出；CHANGELOG 保留既有历史版本记录。
  - 已回收全部已知测试会话。历史进程 76868 返回退出码 1 且无旧输出，不据此推断其具体失败原因；最终配置测试、模型选择测试均在独立进程通过，其余最终检查退出码 0，无常驻测试服务。
  - 最终静态核对：双方 git status/diff 与相关代码、部署说明及双语待测条目回读一致；New API 七种 locale 均可解析且包含交接文案，web/.env.example 已列为新文件，依赖锁文件未改，用户原有未跟踪内容未动。
  - 交付结论：两边业务实现和针对性回归完成；New API 已登记 CF-016，画布已记录 CHANGELOG/pending-test。未执行画布类型检查或生产构建，未提交、合并或部署。真实 HTTPS 双域名、代理响应头/弹窗、Docker 和实际生图保留待人工部署验收，无待恢复开发步骤。

- [x] 回答菜单名称与位置，并修复核查时发现的翻译资源层级错误。
  - 已确认入口位于 New API 左侧 Chat 分组首项，前端要求 status.canvas_base_url 非空，且管理员/用户没有关闭整个聊天分组。
  - 新发现：七种 locale 的新增画布文案被写在 JSON 根层，实际 i18next 使用 translation 命名空间，先前只校验了根层键存在，未验证实际翻译解析。当前将本次新增文案移入 translation，并通过真实 i18next 解析检查。
  - 路径核查首次读取不存在的 i18n/index.ts 返回 1/2，已用 rg 定位实际 config.ts，属于本地路径错误。
  - 已修复 New API 七种 locale：仅将本次 10 个画布文案写入现有 translation；通过 bun 运行真实 i18next createInstance，逐语言验证 exists/t 解析以及中文菜单「无限画布」，70 个键检查通过，进程退出码 0。日志 .codex/validation/canvas/menu-i18n.log；未启动常驻服务或执行构建。
  - 已同步 CUSTOM_FEATURES CF-016 的实际菜单位置、显示条件与翻译验证；检查画布产品 TODO/pending-test，功能与待验收范围未改变，无需新增条目。此次翻译修正归入已记录的同一接入功能，不新增版本级变更记录。当前无待恢复开发步骤。

- [x] 核对静态构建后的上游配置方法，补充 Caddy 部署说明。
  - 已读取 runtime-config、index.html、docker-entrypoint 和 package scripts：浏览器先载入 /config.js，运行期 NEW_API_BASE_URL 优先于构建时 VITE_NEW_API_BASE_URL；静态文件不会读取 Caddy 进程环境变量。
  - 下一步核对 public 配置文件与 Vite 输出目录，参考 Caddy 官方配置说明，记录构建后配置及 SPA 回退示例；不执行部署或构建。
  - 检索包含不存在的 web/.gitignore 导致退出码 2，属于本地路径错误；关键源码已读取，继续使用实际存在路径。
  - 已核对 web/public/config.js 默认空配置、index.html 加载顺序、vite.config.ts 未覆盖输出目录及已安装 Vite 默认 outDir=dist。Context7 读取 Caddy 官方 SPA/route/header 文档成功。
  - 修改 docs/upstream-integration-deployment.md，补充构建前变量、构建后 config.js、Caddy 原反代和直接托管两种示例、配置缓存与重复发布保留规则。未修改业务代码、执行构建/测试、运行 Caddy 或部署，无需清理进程。
  - 已检查产品 TODO/pending-test，本次仅补充使用说明，功能与待验收项无变化，无需修改；不新增 CHANGELOG 记录。下一步向用户说明按实际发布目录编辑 config.js 即可，无待恢复开发步骤。

## 文档与变更边界

- 当前已获得两边业务实现授权，执行进度与验证结果按以上步骤持续落盘。
- 完成时同步画布产品 TODO、pending-test、CHANGELOG 和 New API CUSTOM_FEATURES，未验证事项如实记录。

## 早期讨论历史（已被当前设计替代，不作为后续执行依据）

以下保留最早阶段的假设，不作为后续执行依据；当前有效规则以 `upstream-integration-design.md` 为准，包括不登记 client、一次性交付所选模型 Key、固定唯一上游，以及本地项目/素材不按账号隔离。下文关于账号隔离的早期建议已被用户决定替代。

- 部署层只固定上游地址/接入类型等公开配置，不把管理员密钥或统一用户密钥注入前端运行期配置。
- 先前备选同源部署已排除：用户明确采用独立域名，不再推进子路径适配。
- 独立站点：若上游已有 OAuth/OIDC，优先授权码 + PKCE；如果没有认证协议，需要先定义上游授权/会话交换接口，不直接传长期 API Key 或相信 URL 中的 userId。
- 上游菜单可以先打开画布，由画布发起标准认证跳转，复用用户在上游的登录态；具体 iframe 方案须在确认宿主方式后另行确定。
- 身份识别与生成调用是两件事：用户名/头像等通过用户接口读取；余额、可用模型和生成授权应根据需要单独返回或查询，不能假设上游登录 Cookie 可直接调用模型 API。
- 本地 New API 实际用户 DTO 未见头像字段；本轮只将用户名、显示名、分组、额度作为已有可读取字段，头像如需展示需另定来源。
- 当前浏览器业务数据没有账号命名空间；如果同一浏览器支持切换账号，需要按稳定上游标识与用户 ID 隔离状态，避免把本地记录或模型凭据显示给另一个账号。云端存储不是本次默认范围。
