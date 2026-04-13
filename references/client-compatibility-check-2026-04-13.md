# Client Compatibility Check

Date: 2026-04-13

## Core Conclusion

This repo is now in a good single-project shape.

The important distinction is:

- skill installation: can the client discover `SKILL.md` from its skill directory?
- direct tool invocation: can the client also connect the bundled MCP server and expose `get_elderly_*` tools?

The earlier confusion was not really "too much architecture". It was that installation and invocation were being treated as the same thing.

They are not the same thing.

## Practical Matrix

Client | Skill loading | MCP support | Direct `get_elderly_*` tools | Setup automation | Confidence
--- | --- | --- | --- | --- | ---
OpenClaw | Yes | Yes | Yes, after MCP config | Full | Verified
Claude Code | Yes | Yes | Yes, after MCP config | Full | Verified
Windsurf | Yes | Yes | Yes, after MCP config | Partial | Verified
Cursor | Yes | Yes | Yes, after MCP config | Full | Verified in product + docs mix
Trae | Yes on this machine | Not fully re-verified in this pass | Not fully re-verified in this pass | Partial | Local evidence only
Codex | Yes | Yes | Yes, after MCP config | Full | Verified

## What "Verified" Means Here

### OpenClaw

Verified from official docs:

- `SKILL.md` skills
- workspace `skills/`
- `openclaw skills install`
- external MCP server support through OpenClaw MCP tooling

Practical conclusion:

- OpenClaw remains the cleanest first release target
- this repo can be installed as a skill and can expose direct tools once MCP is connected
- this repo can now also auto-write the OpenClaw MCP entry into `~/.openclaw/openclaw.json`

### Claude Code

Verified from official docs:

- `.claude/skills/`
- `~/.claude/skills/`
- project `.mcp.json`
- `claude mcp add`

Local evidence on this machine also shows Claude Code loading user skill directories in debug logs.

Practical conclusion:

- Claude Code can both discover this skill and connect its bundled MCP server
- this repo can now automate that with `npm run setup:claude`

### Windsurf

Verified from official docs:

- `.windsurf/skills/<skill-name>/`
- `.agents/skills/<skill-name>/`
- `SKILL.md` loading
- MCP support and configuration surface

Practical conclusion:

- Windsurf is structurally compatible with this repo model
- this repo currently automates the skill install path and prints an MCP snippet, but does not auto-write Windsurf MCP config yet

### Cursor

Verified from mixed evidence:

- official Cursor docs confirm MCP support
- the installed Cursor app on this machine ships built-in skills that explicitly reference:
  - `.cursor/skills/`
  - `~/.cursor/skills/`
- this machine also already has `~/.cursor/mcp.json`

Practical conclusion:

- Cursor is no longer just a guess here
- the public doc trail for manual skill-path setup was weaker than some other clients, but the product itself clearly uses the expected skill directories
- this repo can auto-install the skill and write `~/.cursor/mcp.json`

### Trae

Verified locally, but not fully from public docs in this pass:

- this machine has `~/.trae/skills/`
- that directory already contains symlinked skills

What remains weaker:

- I did not surface enough current first-party public documentation for Trae skill install and MCP hookup to claim full verification

Practical conclusion:

- this repo likely fits Trae as well
- still do one end-to-end manual product test before claiming Trae support publicly
- this repo currently automates the skill install path and prints an MCP snippet, but does not auto-write Trae MCP config yet

### Codex

Verified from official docs and local product layout:

- `SKILL.md`
- explicit and implicit invocation
- MCP support through Codex MCP config
- this machine uses `~/.codex/skills/` as the practical user skill directory

Practical conclusion:

- Codex can use the same single-repo package model
- for broad public distribution, plugins may still be a stronger packaging layer than bare skills, but local/project install is fully valid
- this repo can now automate both skill install and MCP registration with `npm run setup:codex`

## Deep Analysis

### Is this repo still overdesigned?

Less than before.

What was actually overcomplicated earlier was the delivery story:

- one repo for REST
- one repo for MCP
- and a future repo for the actual skill

That made the user-facing install path heavier than it needed to be.

Now the design is much healthier:

- one repo
- one `SKILL.md`
- one bundled MCP server
- one bundled REST fallback

That is not overdesign. That is a reasonable "single source of truth" package.

### What is the remaining complexity?

The remaining complexity is integration complexity, not repository complexity.

Every client needs two things:

1. a skill directory install
2. an MCP hookup, if you want direct tools

This is why the most honest release story is:

- "run `npm run setup:<client>` when that client is supported by the installer"
- "prefer a single `ELDERLY_SKILL_ACCESS_TOKEN` instead of three separate upstream fields"
- "treat that token as scoped only to this skill's five read-only interfaces"

### What should not be claimed?

Do not claim:

- "clone only and everything will immediately expose MCP tools"
- "all clients are equally verified from first-party public docs"

The repo is now structurally correct, but some clients still rely on local-product evidence rather than equally strong public docs.

## Source Notes

### OpenClaw

- Skills:
  https://docs.openclaw.ai/tools/skills
- Creating skills:
  https://docs.openclaw.ai/tools/creating-skills
- ClawHub:
  https://docs.openclaw.ai/tools/clawhub
- MCP:
  https://docs.openclaw.ai/tools/mcp

### Claude Code

- Slash commands and skills:
  https://docs.anthropic.com/en/docs/claude-code/slash-commands
- MCP:
  https://docs.anthropic.com/en/docs/claude-code/mcp

### Windsurf

- Skills:
  https://docs.windsurf.com/windsurf/cascade/skills
- MCP:
  https://docs.windsurf.com/windsurf/cascade/mcp

### Cursor

- MCP:
  https://docs.cursor.com/context/model-context-protocol

Local product evidence:

- built-in Cursor skills on this machine explicitly document `.cursor/skills/` and `~/.cursor/skills/`

### Codex

- Skills:
  https://developers.openai.com/codex/skills
- MCP:
  https://developers.openai.com/codex/mcp

### Trae

Local product evidence on this machine:

- `~/.trae/skills/` exists
- that directory already contains linked skills

Public first-party docs were not strong enough in this pass for a higher-confidence claim.
