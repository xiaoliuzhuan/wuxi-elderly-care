# 知鹊AI养老顾问 AI Skill

版本 | 协议 | 后端 | 传输方式
--- | --- | --- | ---
1.0.0 | MIT | 内置 MCP + 内置 REST API | MCP `stdio` / REST `HTTP`

[English](./README.md) | 简体中文

这是一个由无锡知鹊康养推出的面向无锡居家养老信息查询的 AI Skill。

安装后，你的 AI 助手可以帮助查询：

- 社区文娱活动
- 老年大学兴趣课程
- 兴趣爱好社团
- 惠老助餐点
- 居家养老服务站

这个仓库现在就是你唯一需要发布的项目。

它已经同时包含：

- `SKILL.md` 作为 skill 入口
- 内置 MCP server，用来直接暴露 `get_elderly_*` 工具
- 内置 REST API，用作本地 fallback
- 仓库内置 `.env.skill`，默认承载这个 skill 的 5 个只读上游接口接入配置
- 可选 `.env.local` 覆盖层，只有在你明确想替换默认配置时才需要
- 面向常见客户端的一键 setup 脚本

## 关于这个 Skill

这个 Skill 面向无锡本地化的居家养老服务信息。

项目 | 内容
--- | ---
活动查询 | 适合老年群体的文化、体育、健康、社交活动
课程查询 | 老年大学和社区兴趣课程
社团查询 | 本地兴趣社团与固定活动
助餐点查询 | 惠老助餐点地址与联系电话
服务站查询 | 居家养老服务站与服务内容

## 这个 Skill 能做什么

当前这个 Skill 对外提供 5 个 MCP 工具和 5 个 REST 接口，两者能力面保持一致。

能力 | 你可以问 | MCP Tool | REST 接口
--- | --- | --- | ---
社区活动 | “明天尚泽社区有什么活动？” | `get_elderly_activities` | `GET /openapi/v1/elderly/activities`
兴趣课程 | “有没有适合老人的舞蹈课？” | `get_elderly_courses` | `GET /openapi/v1/elderly/courses`
兴趣社团 | “附近有什么老年社团？” | `get_elderly_clubs` | `GET /openapi/v1/elderly/clubs`
惠老助餐 | “新吴区旺庄街道有哪些助餐点？” | `get_meal_points` | `GET /openapi/v1/elderly/meal-points`
居家养老站 | “附近有哪些居家养老服务站？” | `get_home_care_stations` | `GET /openapi/v1/elderly/home-care-stations`

## OpenClaw GitHub 安装提示词

如果你是在 OpenClaw 里让助手帮你安装，直接用这段：

```text
请帮我从 GitHub 安装 elderly-care skill。
仓库地址是 https://github.com/xiaoliuzhuan/wuxi-elderly-care 。
请按 README 完成 OpenClaw 安装。
如果当前会话未识别到这个 skill，请提醒我开启一个新 session。
```

## OpenClaw GitHub 更新提示词

如果你已经安装过这个 skill，想让 OpenClaw 帮你更新到最新版本，直接用这段：

```text
请帮我把已经安装的 elderly-care skill 更新到最新版本。
仓库地址是 https://github.com/xiaoliuzhuan/wuxi-elderly-care 。
请按 README 完成 OpenClaw 更新，不要卸载或重复安装；优先在现有安装基础上更新到最新代码，并确保 OpenClaw 重新加载最新 skill。
更新完成后，请帮我确认这个示例问题现在可以正常得到结论：
明天尚泽社区有什么活动？
如果当前会话还没有识别到更新后的 skill，请提醒我重启 OpenClaw 或开启一个新 session。
```

### 已安装用户怎么更新

对已经安装过的 OpenClaw 用户来说，通常不需要卸载重装，也不需要重新跑一遍安装提示词。

现在更推荐的方式是：

- 让 OpenClaw 按上面的“更新提示词”帮你把仓库同步到最新版本
- 更新后重启 OpenClaw，或者至少开启一个新 session
- 直接测试示例问题，确认新能力已经生效

当前仓库的启动脚本已经支持“构建产物过期时自动重编”，所以已安装用户更新后通常也不需要再手动执行 `npm run build`。

<!--
## 真正的安装逻辑

一个“正常可用”的安装其实分成两层：

1. Skill 发现
   客户端从 skill 目录读取 `SKILL.md`，知道什么时候该触发这个 skill。
2. 工具调用
   如果你希望客户端直接出现 `get_elderly_*` 这些 MCP 工具，就还需要把这个仓库内置的 MCP server 接进去。

所以结论是：

- 只把仓库克隆进 skill 目录，已经足够让客户端“认识这个 skill”
- 只把仓库克隆进 skill 目录，还不足以让客户端直接调用 MCP 工具
- 如果还没接 MCP，也可以先启动本地 REST API，在支持这种方式的环境里作为 fallback
-->

## 一键安装

如果你不希望用户手动改 skill 目录和 MCP 配置，这个仓库现在已经内置 setup 脚本：

```bash
npm run setup:openclaw
npm run setup:claude
npm run setup:cursor
npm run setup:codex
```

常用快捷命令：

```bash
npm run setup:common
npm run setup:all
```

这些脚本会自动完成：

- 默认直接使用仓库内置的 `.env.skill`
- 默认按知鹊数据源模式初始化
- 缺依赖时执行 `npm install`
- 执行 `npm run build`
- 把 skill 安装到对应客户端的用户级 skill 目录
- 对支持的客户端自动注册内置 MCP server
- 对 OpenClaw，如果仓库真实路径不在 skill 根目录内，会自动把真实仓库目录补进 `skills.load.extraDirs`
- 如果发现同名旧软链，setup 脚本会提示是否替换；非交互场景可加 `--replace-existing-link`

对 `OpenClaw`、`Claude Code`、`Cursor` 和 `Codex` 来说，这意味着 setup 跑完后就能直接使用，不需要用户再手动补环境变量。

当前自动化程度：

客户端 | Skill 安装 | MCP 注册
--- | --- | ---
OpenClaw | 自动 | 自动
Claude Code | 自动 | 自动
Cursor | 自动 | 自动
Codex | 自动 | 自动
Windsurf | 自动，best effort | 打印配置片段，手动粘贴
Trae | 自动 | 打印配置片段，手动粘贴

## 首次初始化

如果你想走最短路径，直接执行上面的 setup 命令即可。

如果你是手动初始化，再执行：

```bash
npm install
npm run build
```

仓库现在自带一个 `.env.skill`，默认就是知鹊模式，而且优先用一个 skill 专用接入令牌来描述：

```dotenv
CMS_PROVIDER=zhique
ELDERLY_SKILL_ACCESS_TOKEN=appId=xxx&appSecret=xxx&orgCode=xxx
```

这里的 `ELDERLY_SKILL_ACCESS_TOKEN` 仅对这个 skill 的 5 个只读养老查询接口生效，不是通用平台权限。当前仓库已经把这份 bundled token 接进默认运行链路里了。

`.env.local.example` 现在只作为可选覆盖模板存在。只有当你明确想替换默认配置时，才需要复制成 `.env.local`。

如果你更习惯旧格式，也仍然兼容：

```dotenv
CMS_PROVIDER=zhique
ZHIQUE_API_BASE_URL=https://business.myxbx.com/hm
ZHIQUE_APP_ID=...
ZHIQUE_APP_SECRET=...
ZHIQUE_ORG_CODE=...
ELDERLY_SKILL_API_TOKEN=elderly-skill-local-token
```

## 手动安装到 Skill 目录

把这个仓库克隆到对应客户端的 skill 目录。

客户端 | Skill 目录 | Skill 识别 | 直接 MCP 工具
--- | --- | --- | ---
OpenClaw | `~/skills/elderly-care/` | 已核验 | 接好 MCP 后已核验
Claude Code | `~/.claude/skills/elderly-care/` | 已核验 | 接好 MCP 后已核验
Windsurf | `~/.windsurf/skills/elderly-care/` | best effort | MCP 走手动片段
Cursor | `~/.cursor/skills/elderly-care/` | 本机已核验 | 接好 MCP 后已核验
Trae | `~/.trae/skills/elderly-care/` | 本机已核验 | MCP 走手动片段
Codex | `~/.codex/skills/elderly-care/` | 按本机产品形态已核验 | 接好 MCP 后已核验

示例：

```bash
git clone <repo-url> ~/.claude/skills/elderly-care
```

## 从 GitHub 仓库安装

仓库地址：

```text
https://github.com/xiaoliuzhuan/wuxi-elderly-care
```

### 给个人助手的一句话

如果你是发给 AI 编程助手、个人助手或普通用户，直接用这段就够了：

```text
请帮我安装 elderly-care skill。
GitHub 仓库地址是 https://github.com/xiaoliuzhuan/wuxi-elderly-care 。
```

### 给懂技术用户的命令

先执行通用步骤：

```bash
git clone https://github.com/xiaoliuzhuan/wuxi-elderly-care.git
cd wuxi-elderly-care
npm install
```

再根据客户端执行对应命令：

OpenClaw

```bash
npm run setup:openclaw
```

Claude Code

```bash
npm run setup:claude
```

Cursor

```bash
npm run setup:cursor
```

Codex

```bash
npm run setup:codex
```

安装完成后重启客户端，让新的 skill 和 MCP 配置生效。

### 直接克隆到客户端 Skill 目录

如果你希望直接克隆到某个客户端的 skill 目录，也可以按客户端这样执行：

Claude Code

```bash
git clone https://github.com/xiaoliuzhuan/wuxi-elderly-care.git ~/.claude/skills/elderly-care
cd ~/.claude/skills/elderly-care
npm install
npm run setup:claude
```

Codex

```bash
git clone https://github.com/xiaoliuzhuan/wuxi-elderly-care.git ~/.codex/skills/elderly-care
cd ~/.codex/skills/elderly-care
npm install
npm run setup:codex
```

## 连接仓库内置 MCP Server

只要客户端支持 stdio MCP，现在仓库统一使用直接脚本路径：

```bash
./scripts/start-local-mcp.sh
```

对采用 JSON 风格 MCP 配置文件的客户端，可以参考这个通用结构：

```json
{
  "mcpServers": {
    "elderly-care": {
      "command": "/绝对路径/wuxi-elderly-care/scripts/start-local-mcp.sh",
      "args": []
    }
  }
}
```

客户端 | MCP 接法
--- | ---
OpenClaw | `npm run setup:openclaw` 会把 `elderly-care` 写入 `~/.openclaw/openclaw.json` 的 `mcp.servers`，并在需要时自动补 `skills.load.extraDirs`
Claude Code | `npm run setup:claude` 会调用 `claude mcp add -s user`
Windsurf | `npm run setup:windsurf` 会安装 skill，并打印 MCP 配置片段
Cursor | `npm run setup:cursor` 会写入 `~/.cursor/mcp.json`
Trae | `npm run setup:trae` 会安装 skill，并打印 MCP 配置片段
Codex | `npm run setup:codex` 会调用 `codex mcp add`

## 本地运行

启动 MCP：

```bash
./scripts/start-local-mcp.sh
```

或者 MCP 开发模式：

```bash
npm run dev:mcp
```

启动 REST：

```bash
./scripts/start-local-rest.sh
```

## REST Fallback

如果某个客户端暂时还没接 MCP，也可以先跑本地 REST API：

- Base URL: `http://127.0.0.1:3200/openapi/v1/elderly`
- 认证头: `Authorization: Bearer <ELDERLY_SKILL_API_TOKEN>`
- 这个本地调用令牌只对当前 skill 的本地 REST fallback 生效
- 默认本地令牌: `elderly-skill-local-token`

示例：

```bash
curl -s -H "Authorization: Bearer elderly-skill-local-token" \
  http://127.0.0.1:3200/openapi/v1/elderly/meal-points
```

## 当前目录结构

```text
wuxi-elderly-care/
├── .agents/
│   └── plugins/
│       └── marketplace.json
├── .codex-plugin/
│   └── plugin.json
├── .mcp.json
├── SKILL.md
├── skills/
│   └── elderly-care/
│       └── SKILL.md
├── skill.json
├── README.md
├── README.zh-CN.md
├── LICENSE
├── .env.skill
├── .env.local.example
├── scripts/
│   ├── install-client.mjs
│   ├── start-local-mcp.sh
│   └── start-local-rest.sh
├── src/
│   ├── mcp/
│   │   └── index.ts
│   ├── adapter/
│   ├── controller/
│   ├── service/
│   ├── middleware/
│   ├── model/
│   ├── exception/
│   └── __tests__/
├── openapi.yaml
└── package.json
```

<!--
## 兼容性结论

现在最实用的结论是：

- OpenClaw 仍然是最适合优先发布的目标
- Claude Code、Cursor、Codex 现在已经可以直接从这个仓库里一键 setup
- Windsurf 和 Trae 现在至少可以一键安装 skill，MCP 先走自动生成片段
- Trae 在这台机器上已经能看到标准 skill 目录结构，但我还是建议你在真正对外写死之前，做一次完整的端到端实测
- 真正的集成边界不是 `SKILL.md`，而是客户端有没有把这个仓库的 MCP server 接进去
- 对外分发时，最轻的方式就是只让用户补一行 `ELDERLY_SKILL_ACCESS_TOKEN`
-->
