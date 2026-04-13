# OpenClaw Release Guide

## Goal

Publish this repository as one OpenClaw-compatible skill project.

This repo already contains:

- `SKILL.md`
- bundled MCP server entry: `src/mcp/index.ts`
- bundled REST API entry: `src/index.ts`

## Local Install

Place or link the repo into:

```text
<workspace>/skills/elderly-care/
```

Then start a new OpenClaw session so the skill snapshot refreshes.

## Manual Clone Paths For Other IDEs

| Client | Path |
|------|------|
| OpenClaw | `<workspace>/skills/elderly-care/` |
| Cursor | `.cursor/skills/elderly-care/` |
| Claude Code | `.claude/skills/elderly-care/` |
| Generic | `.agents/skills/elderly-care/` |

## Local Credential Setup

```bash
cp .env.local.example .env.local
```

Recommended live config:

```dotenv
CMS_PROVIDER=zhique
ELDERLY_SKILL_ACCESS_TOKEN=appId=xxx&appSecret=xxx&orgCode=xxx
ZHIQUE_API_BASE_URL=https://business.myxbx.com/hm
```

Mock config:

```dotenv
ELDERLY_SKILL_API_TOKEN=skill-elderly-local-token
```

## Local Run Commands

MCP:

```bash
./scripts/start-local-mcp.sh
```

REST:

```bash
./scripts/start-local-rest.sh
```

## Current Distribution Story

Today:

- publish this repo itself
- let users clone or symlink it into their skill directory

Future:

```bash
openclaw skills install elderly-care
```

That command becomes valid after you publish the skill to ClawHub.

## Future ClawHub Publishing Path

When you are ready to publish from this repo:

```bash
clawhub skill publish .
```

Or publish from the copied skill folder path if you keep a dedicated release checkout.

## Release Checklist

1. `npm run build`
2. `npm test -- --runInBand`
3. Verify `SKILL.md`
4. Verify `.env.local.example`
5. Verify README install instructions
6. Verify MCP startup works with real credentials
