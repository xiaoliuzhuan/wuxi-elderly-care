# Skill 生态调研与本项目优化建议

日期：2026-04-13

## 核心结论

- Codex 的 `skill` 是作者编写工作流的目录格式，核心文件是 `SKILL.md`；如果要让别人稳定安装，官方更推荐把 skill 打包成 `plugin` 分发。
- OpenClaw 同样支持 `SKILL.md` 目录，但更强调加载优先级、会话快照、allowlist 和运行时环境注入；官方公共分发面是 ClawHub。
- GitHub Copilot 也支持同类 skill 目录，项目级和个人级安装路径都很明确，且会基于 `description` 做隐式匹配。
- 这个仓库目前更像“一个可运行的 REST API 后端”，还不是“一个可安装、可发布、可被 agent 稳定调用的 skill 包”。

## 1. 创建流程

### Codex

- Skill 是一个目录，至少包含 `SKILL.md`。
- `SKILL.md` 需要 `name` 和 `description`。
- 可选补充 `scripts/`、`references/`、`assets/`、`agents/openai.yaml`。
- Codex 先读取 skill 元数据，再按需加载完整指令。

来源：
- https://developers.openai.com/codex/skills

### OpenClaw

- 使用 AgentSkills 兼容格式。
- 核心也是带 YAML frontmatter 的 `SKILL.md`。
- 支持 OpenClaw 扩展字段，例如 `user-invocable`、`disable-model-invocation`、`command-dispatch`、`metadata.openclaw.*`。
- 还支持基于二进制、环境变量、配置项的加载时过滤。

来源：
- https://docs.openclaw.ai/tools/skills

### GitHub Copilot

- 同样要求 skill 目录 + `SKILL.md`。
- 项目级目录支持 `.github/skills`、`.claude/skills`、`.agents/skills`。
- 个人级目录支持 `~/.copilot/skills`、`~/.claude/skills`、`~/.agents/skills`。

来源：
- https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills
- https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-skills

## 2. 发布与安装

### Codex

- 官方把 plugin 作为“可安装分发单元”。
- 手工构建 plugin 时，需要 `.codex-plugin/plugin.json`。
- plugin 可以打包 `skills/` 目录。
- Codex 官方 `openai/skills` 仓库提供 curated / experimental skill，支持通过 `$skill-installer` 安装，也支持直接给 GitHub 目录 URL。

来源：
- https://developers.openai.com/codex/plugins
- https://developers.openai.com/codex/plugins/build
- https://github.com/openai/skills

### OpenClaw

- 官方公共分发面是 ClawHub。
- 用户安装 skill：`openclaw skills install <slug>`。
- 发布 skill：`clawhub skill publish <path>`。
- 也支持 `clawhub install`、`clawhub sync` 之类的注册表工作流。

来源：
- https://docs.openclaw.ai/tools/clawhub

### GitHub Copilot

- 更偏“放到约定目录即可被发现”，不是单独的中心化注册表发布模型。
- 重点是把 skill 放到支持的仓库目录或个人目录。

来源：
- https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills

## 3. 调用方式

### Codex

- 支持显式调用：在 CLI/IDE 中通过 `/skills` 或 `$` 提及 skill。
- 支持隐式调用：任务与 `description` 匹配时自动启用。

来源：
- https://developers.openai.com/codex/skills

### OpenClaw

- 明确支持 `/skill <name> [input]`。
- 技能也可以注册成直接 slash command。
- 会在会话开始时快照技能集合；技能变更通常在新 session 生效。
- 会把符合条件的 skill 注入当前 agent 运行环境，并可按 agent allowlist 限制可见技能。

来源：
- https://docs.openclaw.ai/tools/slash-commands
- https://docs.openclaw.ai/tools/skills

说明：
- 目前没有看到足够一手资料可以确认 OpenClaw 是否像 Codex / Copilot 一样稳定支持“完全依赖自然语言的隐式自动匹配”，因此这里不做强结论。

### GitHub Copilot

- 会根据 prompt 和 skill 的 `description` 决定是否使用 skill。
- skill 被选中后，`SKILL.md` 会注入上下文。

来源：
- https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-skills

## 4. 本项目当前状态判断

这个仓库已经具备一个“skill 后端服务”的雏形，但还缺少对外可安装、可理解、可复用的一层包装。

当前更像：

- 一个 TypeScript + Express 的只读 API 服务
- 带 CMS 适配层、鉴权、限流、缓存、测试
- 但缺少 README、SKILL 清单、插件清单、分发入口

## 5. 最值得优先做的优化

### P0：先修正确性和对外一致性

1. `openapi.yaml` 仍然是“拈花湾景区”旧规格，和当前养老服务接口完全不一致。
2. 统计中间件仍然按 `scenic` 路径提取工具名，导致统计口径错误。
3. 默认日期使用 UTC 切片，亚洲时区在凌晨会出现“默认查询前一天”的问题。

### P1：补齐可发布能力

1. 增加仓库级 `README.md`，说明用途、启动方式、环境变量、接口、部署方法。
2. 根据目标生态补一个最小 skill 包装层：
   - OpenClaw：`skills/<name>/SKILL.md` 或可发布到 ClawHub 的 skill 目录
   - Codex：本地 skill 目录；如果要给别人安装，补 `.codex-plugin/plugin.json`
   - Copilot：`.agents/skills/<name>/SKILL.md` 或 `.github/skills/<name>/SKILL.md`
3. 把“何时使用这个 skill、何时不要使用”写窄，减少误触发。

### P1：补齐运行安全与运维边界

1. `config` 里仍有默认 Bearer token fallback，生产环境容易误带开发默认值。
2. `.gitignore` 只忽略 `.env`，没有覆盖 `.env.*`，后续容易误提交环境文件。
3. Dockerfile 直接复制 `.env.production` 进镜像，不利于密钥外置和环境分离。

### P2：补齐测试盲区

- 当前 `npm test -- --runInBand` 通过，但覆盖率只有约 61%。
- `CmsHttpAdapter`、错误分支、限流边界、统计逻辑、缓存分支覆盖明显不足。

## 6. 推荐落地顺序

1. 修 `openapi.yaml` 与代码不一致问题。
2. 修 `stats.ts` 的路径提取和 `todayStr()` 的时区问题。
3. 补 README。
4. 选一个主分发面先打样：
   - 如果你主要面向 OpenClaw 用户：先做 OpenClaw skill + ClawHub
   - 如果你主要面向 Codex 用户：先做 Codex plugin
   - 如果你想跨生态最低成本复用：先做通用 `SKILL.md` 目录，再分别加薄包装
5. 最后补测试和 CI。

## 7. 我对本项目的判断

最值得做的不是先“继续堆接口”，而是先把它从“一个后端服务仓库”升级成“一个能被 agent 生态识别、安装、调用、维护的 skill 产品”。

如果只做一个最小闭环，最划算的路径是：

1. 修正 API 文档和代码一致性
2. 增加 README
3. 增加一个窄描述的 `SKILL.md`
4. 按目标生态补 OpenClaw 或 Codex 的安装壳

