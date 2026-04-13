# ZhiQue AI Elderly Care Advisor Skill

Version | License | Backend | Transport
--- | --- | --- | ---
1.0.0 | MIT | Bundled MCP + Bundled REST API | MCP `stdio` / REST `HTTP`

English | [简体中文](./README.zh-CN.md)

This is an AI Skill from Wuxi ZhiQue Elderly Care for querying localized elderly-care information in Wuxi.

After installation, your AI assistant can help query:

- community activities
- senior courses
- hobby clubs
- meal service points
- home-care stations

This repository is intended to be the only project you publish.

It already includes:

- `SKILL.md` for skill discovery
- a bundled MCP server for direct `get_elderly_*` tool calls
- a bundled REST API for local fallback
- bundled `.env.skill` runtime access for this skill's 5 read-only upstream interfaces
- optional `.env.local` overrides when you intentionally need to replace the bundled defaults
- one-command setup scripts for supported clients

## About This Skill

This skill is built for localized elderly-care information in Wuxi.

Category | Coverage
--- | ---
Activities | Cultural, sports, health, and social activities for older adults
Courses | Senior university and community interest courses
Clubs | Local hobby clubs and recurring group activities
Meal Points | Meal assistance points with address and contact details
Home-care Stations | Home-care stations and supported services

## What This Skill Can Do

This skill currently exposes 5 MCP tools and 5 REST endpoints for the same capability surface.

Capability | You can ask | MCP Tool | REST Endpoint
--- | --- | --- | ---
Community Activities | "What activities are available tomorrow in Shangze Community?" | `get_elderly_activities` | `GET /openapi/v1/elderly/activities`
Courses | "Are there any dance classes suitable for seniors?" | `get_elderly_courses` | `GET /openapi/v1/elderly/courses`
Clubs | "What elderly clubs are nearby?" | `get_elderly_clubs` | `GET /openapi/v1/elderly/clubs`
Meal Points | "Which meal service points are available on Wangzhuang Street in Xinwu District?" | `get_meal_points` | `GET /openapi/v1/elderly/meal-points`
Home-care Stations | "Which home-care stations are nearby?" | `get_home_care_stations` | `GET /openapi/v1/elderly/home-care-stations`

## OpenClaw GitHub Install Prompt

If you want OpenClaw to help install this skill from GitHub, use this:

```text
Please help me install the elderly-care skill from GitHub.
The repository is https://github.com/xiaoliuzhuan/wuxi-elderly-care .
Please follow the README and complete the OpenClaw installation.
If the current session does not recognize the skill, remind me to start a new session.
```

<!--
## Install Reality

A normal installation still has two separate layers:

1. Skill discovery  
   The client reads `SKILL.md` from its skill directory and understands when to trigger this skill.
2. Tool invocation  
   If you want direct `get_elderly_*` MCP tools, the client must also connect this repo's bundled MCP server.

So the practical conclusion is:

- cloning this repo into a skill directory is enough for skill discovery
- cloning this repo into a skill directory is not enough for direct MCP tool calls
- if MCP is not connected yet, you can still start the local REST API as a fallback where that environment allows local HTTP access
-->

## One-Command Setup

If you do not want users to manually edit skill paths and MCP config, this repo already includes setup scripts:

```bash
npm run setup:openclaw
npm run setup:claude
npm run setup:cursor
npm run setup:codex
```

Useful shortcuts:

```bash
npm run setup:common
npm run setup:all
```

These scripts automatically:

- use the bundled `.env.skill` by default
- initialize the repo in ZhiQue-backed mode
- run `npm install` if dependencies are missing
- run `npm run build`
- install the skill into the target client's user-level skill directory
- auto-register the bundled MCP server for supported clients
- for OpenClaw, if the real repo path lives outside the configured skill root, add that real path to `skills.load.extraDirs` automatically

For `OpenClaw`, `Claude Code`, `Cursor`, and `Codex`, that means users can start using the skill right after setup without manually filling environment variables.

Current automation level:

Client | Skill install | MCP registration
--- | --- | ---
OpenClaw | Automatic | Automatic
Claude Code | Automatic | Automatic
Cursor | Automatic | Automatic
Codex | Automatic | Automatic
Windsurf | Automatic, best effort | Snippet printed for manual paste
Trae | Automatic | Snippet printed for manual paste

## First-Time Setup

If you want the shortest path, run one of the setup commands above and stop there.

If you prefer manual bootstrapping first, run:

```bash
npm install
npm run build
```

The repo ships with a bundled `.env.skill` file. It starts in ZhiQue mode and prefers one skill-scoped access token:

```dotenv
CMS_PROVIDER=zhique
ELDERLY_SKILL_ACCESS_TOKEN=appId=xxx&appSecret=xxx&orgCode=xxx
```

`ELDERLY_SKILL_ACCESS_TOKEN` is intended to apply only to this skill's 5 read-only elderly-care queries, not as a general platform credential.

`.env.local.example` is only an optional override template now. Use it only when you intentionally want to replace the bundled defaults.

The older expanded format is still supported:

```dotenv
CMS_PROVIDER=zhique
ZHIQUE_API_BASE_URL=https://business.myxbx.com/hm
ZHIQUE_APP_ID=...
ZHIQUE_APP_SECRET=...
ZHIQUE_ORG_CODE=...
ELDERLY_SKILL_API_TOKEN=elderly-skill-local-token
```

## Manual Installation To A Skill Directory

Clone this repository into the skill directory used by your client.

Client | Skill directory | Skill loading | Direct MCP tools
--- | --- | --- | ---
OpenClaw | `~/skills/elderly-care/` | Verified | Verified after MCP config
Claude Code | `~/.claude/skills/elderly-care/` | Verified | Verified after MCP config
Windsurf | `~/.windsurf/skills/elderly-care/` | Best effort | Manual MCP snippet
Cursor | `~/.cursor/skills/elderly-care/` | Locally verified | Verified after MCP config
Trae | `~/.trae/skills/elderly-care/` | Locally verified | Manual MCP snippet
Codex | `~/.codex/skills/elderly-care/` | Verified from local product setup | Verified after MCP config

Example:

```bash
git clone <repo-url> ~/.claude/skills/elderly-care
```

## Install From The GitHub Repo

Repository URL:

```text
https://github.com/xiaoliuzhuan/wuxi-elderly-care
```

### One-line prompt for personal assistants

If you are sending this to an AI coding assistant or a non-technical user, this shorter prompt is enough:

```text
Please install the elderly-care skill for me.
The GitHub repository is https://github.com/xiaoliuzhuan/wuxi-elderly-care .
```

### Commands for technical users

Run the shared steps first:

```bash
git clone https://github.com/xiaoliuzhuan/wuxi-elderly-care.git
cd wuxi-elderly-care
npm install
```

Then run the matching setup command for your client:

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

After installation, restart the client so the new skill and MCP configuration are reloaded.

### Clone directly into a client skill directory

If you want to clone directly into a client skill directory, use the matching path:

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

## Connect The Bundled MCP Server

For clients that support stdio MCP servers, the repo uses this direct script path:

```bash
./scripts/start-local-mcp.sh
```

For clients that use JSON-style MCP config files, use a shape like this:

```json
{
  "mcpServers": {
    "elderly-care": {
      "command": "/ABSOLUTE/PATH/TO/wuxi-elderly-care/scripts/start-local-mcp.sh",
      "args": []
    }
  }
}
```

Client | MCP hookup
--- | ---
OpenClaw | `npm run setup:openclaw` writes `elderly-care` into `~/.openclaw/openclaw.json` under `mcp.servers` and adds `skills.load.extraDirs` when needed
Claude Code | `npm run setup:claude` runs `claude mcp add -s user`
Windsurf | `npm run setup:windsurf` installs the skill and prints an MCP snippet
Cursor | `npm run setup:cursor` writes `~/.cursor/mcp.json`
Trae | `npm run setup:trae` installs the skill and prints an MCP snippet
Codex | `npm run setup:codex` runs `codex mcp add`

## Local Run Commands

Start MCP:

```bash
./scripts/start-local-mcp.sh
```

Or MCP dev mode:

```bash
npm run dev:mcp
```

Start REST:

```bash
./scripts/start-local-rest.sh
```

## REST Fallback

If a client does not have MCP connected yet, you can still run the local REST API:

- Base URL: `http://127.0.0.1:3200/openapi/v1/elderly`
- Auth header: `Authorization: Bearer <ELDERLY_SKILL_API_TOKEN>`
- This local API token only applies to this skill's local REST fallback
- Default local token: `elderly-skill-local-token`

Example:

```bash
curl -s -H "Authorization: Bearer elderly-skill-local-token" \
  http://127.0.0.1:3200/openapi/v1/elderly/meal-points
```

## Current Directory Structure

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
## Compatibility Conclusion

The most practical conclusion right now is:

- OpenClaw is still the best first release target
- Claude Code, Cursor, and Codex can already be set up from inside this repo with one command
- Windsurf and Trae can at least install the skill automatically, even though MCP still uses a printed snippet in this version
- Trae looks structurally compatible on this machine, but one full end-to-end product test is still recommended before making stronger public claims
- the real integration boundary is not `SKILL.md`; it is whether the client has the bundled MCP server connected
- for external distribution, the lightest configuration story is still just one `ELDERLY_SKILL_ACCESS_TOKEN`
-->
