# 居家养老项目：OpenClaw 优先视角重整分析

日期：2026-04-13

## 结论先说

如果当前第一目标是：

- 先让 OpenClaw 用户能安装
- 先让 agent 能稳定触发
- 先把 skill 发布到 ClawHub

那我们现在这套 `REST API + MCP Server + 未来 skill` 的路线，确实有一点过度设计了。

更准确地说：

- 不是“领域建模过度”
- 而是“交付层次铺得太早、太多”

和 `jinguyuan-dumpling-skill` 对比后，我更建议把路线改成：

`OpenClaw Skill 优先，MCP 作为唯一后端，REST API 暂时降级为可选项`

## 一、为什么你会觉得 `jinguyuan-dumpling-skill` 更简单

这个感觉是对的。

从公开信息看，`jinguyuan-dumpling-skill` 的主线非常短：

1. 一个 `SKILL.md`
2. 一个可访问的 MCP 端点
3. 一个 README 说明怎么装
4. 发布到 ClawHub / GitHub / Gitee

公开页面能确认的点：

- Gitee README 明确写了这是一个 Skill，接入方式是配置一个 Streamable HTTP 的 MCP 端点。
- Gitee `SKILL.md` 明确写了触发场景、边界、降级策略、调用哪个 MCP tool。
- 它已经按 OpenClaw/Skill 的思路来组织，而不是先做一套服务矩阵。

来源：

- `README.md · 金谷园饺子馆/jinguyuan-dumpling-skill - Gitee.com`
  https://gitee.com/JinGuYuan/jinguyuan-dumpling-skill/blob/main/README.md
- `SKILL.md · 金谷园饺子馆/jinguyuan-dumpling-skill - Gitee.com`
  https://gitee.com/JinGuYuan/jinguyuan-dumpling-skill/blob/main/SKILL.md

## 二、从 OpenClaw 官方文档看，最小可用路径本来就不复杂

OpenClaw 官方文档确认了几点：

1. Skill 本质上就是一个目录，里面有 `SKILL.md`
2. OpenClaw 原生支持从工作区 `skills/` 加载 skill
3. 原生支持 `openclaw skills install <slug>`
4. 发布公共 skill 可以走 `clawhub skill publish <path>`
5. 工作区 skill 优先级最高，天然适合先本地打样再发布

来源：

- OpenClaw Skills
  https://docs.openclaw.ai/tools/skills
- ClawHub
  https://docs.openclaw.ai/tools/clawhub

文档里我这次最看重的几个事实：

- Skill 是一个带 `SKILL.md` 的目录
- `<workspace>/skills` 优先级最高
- OpenClaw session 会对可见技能做快照，skill 更新通常在新 session 生效
- OpenClaw 有 per-agent allowlist 和运行时 env 注入
- ClawHub 是 OpenClaw 官方公共分发面

这意味着：

如果我们的目标是 OpenClaw skill，第一版其实根本不需要先铺一套 REST API 产品化层。

## 三、我们现在到底“多”在哪里

### 当前我们有三层东西

1. `skill-elderly-care`
   - Express REST API
   - auth / rateLimit / traceId / stats / cache
   - mock / CMS adapter

2. `mcp-elderly-care`
   - MCP Server
   - 5 个 tool
   - 直接对接知鹊上游

3. 计划中的 skill / plugin 分发层

如果最终用户是 OpenClaw 用户，那么他们真正关心的是：

- 有没有 `SKILL.md`
- 能不能装
- 能不能触发
- 能不能稳定拿到结果

而不是：

- 你有没有单独跑一个 Express 网关
- 有没有 Redis key prefix
- 有没有单独的 OpenAPI 文档

所以从 OpenClaw-first 的产品视角看，我们现在“多”的主要是：

- 多了一个对最终用户不直接可见的 REST API 交付面
- 多了一套和 MCP 并行存在但尚未统一的 DTO / adapter / 过滤逻辑
- 多了一条会分散注意力的“以后再包装成 skill”的中间路线

## 四、和 `jinguyuan-dumpling-skill` 对比后，我的判断

## 结论

是的，和它相比，我们现在偏重了。

但要补一句：

我们不是“技术做得太重”，而是“把第二阶段、第三阶段的东西提前做了”。

### `jinguyuan-dumpling-skill` 的优点

- 用户路径短
- Skill 就是交付面本身
- README / SKILL / MCP endpoint 的关系非常直接
- 非常适合 OpenClaw / ClawHub 场景

### 它的代价

从公开页面也能看出一些脆弱点：

- README 版本号和 `SKILL.md` frontmatter 版本号不一致
- 很多静态示例和兜底数据直接写进 `SKILL.md`
- Skill 文档本身承担了产品说明、协议说明、运行说明、fallback 说明，后期容易膨胀

这说明它“简单”，但也“容易漂”。

### 我们的优点

- REST API 这边已经有测试、缓存、鉴权、限流、trace 等工程骨架
- 更利于以后做中心化网关
- 更利于多客户端复用

### 我们的问题

- 对 OpenClaw-first 来说，第一版投入超出了必要范围
- 两套后端边界没有统一
- 还没有真正产出最关键的东西：一个可安装的 OpenClaw skill

## 五、如果现在优先 OpenClaw，我建议怎么改

## 新推荐路线

把优先级改成：

1. `OpenClaw Skill`
2. `MCP Server`
3. `REST API`

也就是：

- 先做一个真正可安装、可发布的 OpenClaw skill
- Skill 背后只绑定一个后端
- 这个后端优先用 MCP，而不是 REST
- REST 先不作为主交付面

## 六、为什么我建议“Skill + MCP”而不是“Skill + REST”

原因很简单：

`jinguyuan-dumpling-skill` 之所以显得轻，就是因为它的 skill 和后端之间几乎没有多余层。

对于 OpenClaw 来说，MCP 更接近“agent 真正要调用的能力接口”。

如果我们现在走：

`OpenClaw Skill -> MCP Server`

那路径是顺的。

如果走：

`OpenClaw Skill -> REST API -> 上游`

你会多出：

- 一层 HTTP 网关维护
- 一层 auth / rateLimit / trace / OpenAPI 文档维护
- 一套用户并不直接消费的接口产品化成本

这在 MVP 阶段不划算。

## 七、我现在最推荐的最小架构

```text
elderly-care/
├── skill/
│   └── SKILL.md
├── mcp-elderly-care/
│   ├── src/
│   ├── README.md
│   └── package.json
└── docs/
```

### 解释

- `skill/`
  - 这是 OpenClaw 用户真正安装和发布的东西
  - 以后发布到 ClawHub 的也是这个目录

- `mcp-elderly-care/`
  - 这是唯一后端
  - 负责对接知鹊、返回 5 个 tool

- `skill-elderly-care/`
  - 先不删
  - 但从主路线里降级为“未来可选网关”

## 八、对应到我们这个项目，最该删掉的不是代码，而是“主叙事”

我不建议你现在真的去删掉 `skill-elderly-care`。

因为它以后可能还有价值：

- 做中心化部署
- 做缓存和观测
- 做非 MCP 客户端接入
- 做统一数据出口

但我建议立刻把主叙事改掉：

不是“我们有 REST API 和 MCP Server”

而是：

“我们现在做的是一个 OpenClaw skill，后端暂时由 MCP 提供能力，REST API 是预研产物/后备方案”

这个变化很重要，因为它会直接改变你接下来写 README、写 SKILL.md、写 ClawHub 发布说明的方式。

## 九、OpenClaw-first 版本下，我们应该怎么落地

### P0：先做真正的 skill 交付面

新增一个技能目录，例如：

```text
skills/elderly-care/
└── SKILL.md
```

`SKILL.md` 里应该写清楚：

- 什么时候触发
- 支持哪些问题
- 调哪个 MCP tool
- 哪些问题不回答
- 如果超时怎么降级
- 如果数据缺失怎么诚实回应

### P0：MCP 作为唯一权威后端

把当前 `mcp-elderly-care` 视作第一优先后端。

需要补的不是新协议，而是：

- 补测试
- 补更清晰的 README
- 明确它给 skill 提供哪 5 个工具
- 确认本地运行 / 远程运行哪种是主模式

### P1：决定 MCP 是本地安装还是远程端点

这里有两条路。

#### 路线 A：本地 MCP

优点：

- 私有化简单
- 不需要公网服务

缺点：

- 用户要装 MCP server
- 使用门槛比远程端点高

#### 路线 B：远程 Streamable HTTP MCP

优点：

- 最像 `jinguyuan-dumpling-skill`
- 最适合 ClawHub + OpenClaw 直接分发
- 用户体验最好

缺点：

- 你要运维一个远程服务

如果现在是为了 OpenClaw 用户体验，我更偏向：

`远程 MCP endpoint + OpenClaw Skill`

### P2：REST API 暂时收缩角色

我建议把 `skill-elderly-care` 的定位改成：

- 内部实验
- 将来如果需要再升格为统一网关

而不是当前主路线。

## 十、重新回答“我们是不是过度设计了”

我的答案是：

### 对 OpenClaw-first 目标来说：是，有一点

过度的地方主要在：

- 太早把 REST API 产品化
- 太早维护多种交付面
- 还没先把真正要交付给用户的 `SKILL.md` 做出来

### 但不是所有东西都该砍

不该砍的是：

- 领域边界意识
- DTO 归一化意识
- 测试意识
- mock 数据意识

真正该砍的是：

- MVP 阶段不必要的交付层复杂度

## 十一、我现在的最终建议

如果你让我给一个明确决策，我会选：

### 推荐决策

1. 暂时停止把 `skill-elderly-care` 当主项目
2. 把 `mcp-elderly-care` 提升为主后端
3. 新建一个 OpenClaw skill 目录作为真正主交付物
4. 先面向 ClawHub / `openclaw skills install` 这条链路设计
5. REST API 保留，但从主路线降级

### 一句话版本

先别做“三件套”。

先做成“一件真正能装能用的 OpenClaw skill”，后面再决定要不要补 REST 网关。

## 十二、下一步最值得做的具体动作

1. 新建 `skills/elderly-care/SKILL.md`
2. 以 OpenClaw 文档格式补 frontmatter 和 `metadata.openclaw`
3. 把当前 5 个 MCP tool 映射进 skill 使用说明
4. 为 `mcp-elderly-care` 补最小测试
5. 把 `skill-elderly-care` 标注成“optional/internal”

