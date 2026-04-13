# 居家养老项目现状与整合分析

日期：2026-04-13

## 一、项目现状总览

当前实际上有两个并列项目：

- REST API：
  `/Users/xiaoliuzhuan/agents/learning-continue/skill-elderly-care/`
- MCP Server：
  `/Users/xiaoliuzhuan/agents/learning-continue/mcp-elderly-care/`

它们服务的是同一个业务域：居家养老服务信息查询。

但它们不是同一个产物的两个目录，而是两个不同协议、不同发布方式、不同运行方式的交付面。

## 二、你提供的当前项目信息整理

### 1. REST API：`skill-elderly-care`

端口：`3200`

目录结构：

```text
src/
├── index.ts                        # 入口
├── config/index.ts                 # 配置 + 参数校验
├── controller/ElderlyController.ts # 5 个 GET 路由
├── service/ElderlyService.ts       # 业务逻辑 + 缓存
├── adapter/
│   ├── CmsReadOnlyAdapter.ts       # 只读接口（5 个方法）
│   ├── CmsHttpAdapter.ts           # HTTP 实现 + 熔断
│   └── MockCmsAdapter.ts           # 内置 mock 数据（无锡本地化）
├── model/types.ts                  # 全部 DTO 定义
├── middleware/                     # auth / rateLimit / traceId / stats
├── exception/handler.ts            # 异常处理
└── __tests__/api.test.ts           # 12 个测试全部通过
```

接口列表：

| 接口 | 说明 |
|------|------|
| `GET /openapi/v1/elderly/activities` | 社区文娱活动，支持 `date/community/category` |
| `GET /openapi/v1/elderly/courses` | 老年大学兴趣课程 |
| `GET /openapi/v1/elderly/clubs` | 兴趣爱好社团 |
| `GET /openapi/v1/elderly/meal-points` | 惠老助餐点，支持 `district/street` |
| `GET /openapi/v1/elderly/home-care-stations` | 居家养老服务站，支持 `service` |

快速启动：

```bash
cd skill-elderly-care
npm run dev:mock
```

测试请求：

```bash
curl -s -H "Authorization: Bearer sk-default-dev-token" \
  http://localhost:3200/openapi/v1/elderly/meal-points | python3 -m json.tool
```

与原项目的区别：

- 端口改为 `3200`
- 路由前缀改为 `/openapi/v1/elderly/`
- Redis key 前缀改为 `skill:elderly:`
- 原项目代码零修改，可并行运行
- Mock 数据已切换为无锡本地化内容

### 2. MCP Server：`mcp-elderly-care`

它暴露了 5 个 MCP Tool：

| Tool | 说明 |
|------|------|
| `get_elderly_activities` | 查询文娱活动 |
| `get_elderly_courses` | 查询兴趣课程 |
| `get_elderly_clubs` | 查询兴趣社团 |
| `get_meal_points` | 查询惠老助餐点 |
| `get_home_care_stations` | 查询居家养老服务站 |

README 中给出的使用方式是：

- Claude Desktop 通过 `claude_desktop_config.json` 安装
- Cursor 通过 `.cursor/mcp.json` 安装
- 运行入口是 `npx mcp-elderly-care`

这说明它是一个面向 MCP 客户端分发的工具包，而不是 HTTP 服务。

## 三、两个项目真实关系是什么

### 结论先说

这两个项目不是“重复造了同一个东西”，而是：

- 一个是协议层为 HTTP 的服务网关
- 一个是协议层为 MCP 的 Agent 工具服务

它们理论上应该共享同一套领域逻辑，但目前实际上没有共享。

### 当前真实结构

当前混在一起的其实是三层能力：

1. 数据接入层
2. 领域归一化层
3. 协议暴露层

而两个项目对这三层的切分方式不一样。

#### `skill-elderly-care`

更像：

- 数据接入层：`CmsHttpAdapter` / `MockCmsAdapter`
- 领域归一化层：`ElderlyService` + DTO + 参数 schema
- 协议暴露层：Express REST API

#### `mcp-elderly-care`

更像：

- 数据接入层：`ApiBridge` 直接请求知鹊外部接口
- 领域归一化层：在 `ApiBridge` 中顺手完成过滤和别名匹配
- 协议暴露层：MCP Tool

所以问题不是“有没有两个项目”，而是“领域逻辑被写了两次，边界不统一”。

## 四、当前不一致点

### 1. 两边并没有真正复用同一数据源抽象

REST API 侧：

- `src/adapter/CmsHttpAdapter.ts` 走的是内部 CMS 风格接口
- 方法都是 `GET /activities`、`GET /courses` 这种归一化接口

MCP 侧：

- `mcp-elderly-care/src/api-bridge.ts` 直接请求知鹊外部接口
- 路径是 `/api/foreign-api/activity/list`、`/course/list`、`/club/list`
- 请求方式是带签名的 `POST`

这说明目前没有共享统一的上游接入层。

### 2. 两边数据模型不一致

REST API 侧 DTO 是归一化后的业务字段，比如：

- `activityId`
- `name`
- `category`
- `startTime`
- `community`

MCP 侧保留了更多知鹊原始字段，比如：

- `id`
- `tyspe`
- `siteName`
- `activeTime`
- `activeDec`

这意味着两边现在只是“功能名一致”，并不是“输出契约一致”。

### 3. 过滤和别名逻辑只存在于 MCP 侧

MCP 里有：

- 分类别名映射
- 模糊匹配
- 服务标签匹配

这些逻辑写在 `mcp-elderly-care/src/api-bridge.ts` 里。

REST API 侧目前更多是假定上游 CMS 已经支持参数筛选，自己没有沉淀同样的领域映射规则。

这会导致一个风险：

同样问“health”或“meal_delivery”，两个系统将来很可能返回不同结果。

### 4. 运行形态完全不同

REST API：

- 是服务进程
- 有端口
- 有鉴权、限流、traceId、stats、缓存
- 适合被多个客户端复用

MCP：

- 是 stdio 进程
- 适合被 Claude Desktop / Cursor / 支持 MCP 的客户端直接安装
- 当前没有缓存、限流、trace 统计
- 更像桌面 Agent 的工具插件

### 5. 测试与工程成熟度不同

REST API：

- 已有 `12` 个测试并通过

MCP：

- `package.json` 里有 `test` 脚本
- 但当前没有任何测试文件
- 实测 `npm test` 会报 `No tests found`

所以目前更成熟的是 REST API 这一侧。

### 6. MCP 看起来“像是支持接 REST API”，但其实还没有接上

`mcp-elderly-care/src/index.ts` 里有 `SKILL_API_BASE_URL` 这个环境变量名。

但它后面的实现仍然是：

- 固定请求知鹊外部接口路径
- 固定做签名头
- 固定按知鹊返回结构解析

所以从现状看，`SKILL_API_BASE_URL` 这个名字会让人误以为它能直接切到 REST API，但实际上还不行。

这也是当前架构最容易让人误判的地方。

## 五、到底要不要整合

## 结论

要整合。

但不建议把它们“合并成一个项目/一个进程/一个 npm 包”。

更合理的是：

- 保留两个交付面
- 整合成一套共享领域核心

也就是：

- REST API 继续作为 HTTP 网关
- MCP 继续作为 MCP 工具包
- 但两边共享一套 service / DTO / adapter / filter 逻辑

## 六、为什么不建议直接硬合成一个

### 不建议方案 A：让 MCP 直接替代 REST API

原因：

- MCP 只适合 Agent 客户端，不适合普通服务集成
- 没有天然 HTTP 接口，不利于调试、监控、第三方调用
- 失去 REST API 已有的缓存、鉴权、限流和可观测性价值

### 不建议方案 B：让 REST API 直接替代 MCP

原因：

- Claude Desktop / Cursor 这类客户端吃的是 MCP，不是你的 Express 服务
- 这样会失去 `npx mcp-elderly-care` 这种直接安装体验

### 不建议方案 C：让 MCP 立刻改成“纯调用 REST API”

这个方案不是完全不能做，但不建议作为第一步。

原因：

- MCP 现在的优势是独立安装即可使用
- 一旦完全依赖 REST API，就会变成“必须先起一个 HTTP 服务”
- 对桌面端用户来说，使用门槛反而更高

除非你的目标是：

- 统一走中心化部署
- 所有客户端都连同一个已部署 REST 网关

否则直接改成“远程依赖 REST”会损失 MCP 当前的独立性。

## 七、最合理的整合方式

推荐目标架构：

```text
elderly-care/
├── packages/
│   └── elderly-care-core/      # 领域核心：DTO、过滤、别名映射、service、adapter interface
├── apps/
│   ├── skill-elderly-care/     # REST API 壳
│   └── mcp-elderly-care/       # MCP 壳
└── docs/
```

### 核心思想

把真正应该共享的东西抽出来：

- DTO 定义
- 查询参数 schema
- 分类别名映射
- 文本匹配 / 服务匹配逻辑
- 数据源接口
- mock 数据

然后保留两个不同协议壳：

- HTTP 壳
- MCP 壳

### 这样做的好处

1. 业务语义只有一份，不会漂移
2. MCP 和 REST 返回的数据结构可以真正统一
3. Mock 数据只维护一份
4. 测试可以先测核心，再测各协议壳
5. 将来再加 skill/plugin 壳也更容易

## 八、我更推荐的落地路线

### 第一阶段：先不搬目录，先统一“源头”

先做最小整合，不动部署方式：

1. 确认哪一层是事实上的数据源标准
2. 统一 DTO 与筛选语义
3. 把分类别名、匹配逻辑抽成共享模块
4. 让 REST 和 MCP 都依赖这套共享模块

### 第二阶段：决定上游接入策略

这里有两条路。

#### 路线 1：共享核心，分别接上游

- REST 继续走 CMS / mock
- MCP 继续走知鹊外部 API
- 两边共享归一化和语义层

适合：

- 两个上游接口长期都会存在
- 部署环境不同
- 想先降低重复逻辑

#### 路线 2：REST 成为统一网关，MCP 改成薄客户端

- REST 负责所有接入、缓存、观测、鉴权
- MCP 只调用 REST API

适合：

- 你会长期部署 REST 服务
- 希望所有客户端都走统一网关
- 希望缓存、统计、限流全部集中治理

不适合：

- 想让 MCP 保持“装上就能独立用”的体验

## 九、基于当前情况，我的建议

### 推荐判断

短期：

- 不要把 `mcp-elderly-care` 删除或并进 `skill-elderly-care`
- 也不要急着让 MCP 强依赖 REST API

中期：

- 应该把两者放进同一个上层工作区治理
- 抽一个共享核心包
- 先统一数据模型和筛选规则

长期：

- 如果 REST 会成为正式稳定网关，再考虑让 MCP 增加一种“REST backend mode”
- 这样既保留独立模式，也支持中心化模式

### 一句话版本

最好的方向不是“二选一”，而是：

`一个领域核心 + 两个协议壳 + 未来再加 skill/plugin 壳`

## 十、和前面 skill 调研结果怎么接上

前面的调研结论是：

- OpenClaw / Codex / Copilot 的 skill 是“调用和提示层”
- MCP 是“工具协议层”
- REST API 是“服务接口层”

所以这三者不是替代关系，而是分层关系。

比较合理的组合是：

```text
数据源 / 领域核心
    ↓
REST API / MCP Server
    ↓
Skill / Plugin / IDE 配置
```

也就是说：

- `skill-elderly-care` 不是 skill 本体，它更像 backend gateway
- `mcp-elderly-care` 不是 skill 本体，它是 MCP tool server
- 真正给 OpenClaw / Codex / Copilot 安装的，应该是：
  - `SKILL.md`
  - plugin 包
  - MCP 配置

## 十一、当前最值得马上补的事项

1. 给两个项目写一份统一的总览文档，明确：
   - 谁是 REST
   - 谁是 MCP
   - 谁面向什么客户端
2. 修复 `skill-elderly-care/openapi.yaml` 的旧景区文档遗留问题
3. 给 `mcp-elderly-care` 增加最小测试
4. 明确 `SKILL_API_BASE_URL` 的语义，避免误导
5. 开始抽共享 DTO / filter / alias 模块

## 十二、最终判断

当前的真实情况是：

- 你已经有了一个较成熟的 REST API 雏形
- 也已经有了一个可安装的 MCP Server 雏形
- 它们主题一致，但还不是一套统一架构
- 当前最核心的问题不是“有没有两个项目”，而是“领域核心被复制了两遍”

所以正确动作不是“把其中一个砍掉”，而是：

- 先承认它们应该同时存在
- 再把重复的领域逻辑收口到一处

