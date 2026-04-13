# Upstream Integration Notes

Date: 2026-04-13

## Source of truth

- Proven upstream access file came from the sibling project `mcp-elderly-care/秘钥相关2.txt`
- API contract was cross-checked against `mcp-elderly-care/知鹊API接口文档_V1.0.0_20260410.docx`
- Working bridge implementation was cross-checked against `mcp-elderly-care/src/api-bridge.ts`

## Confirmed ZhiQue contract

The current repo now matches the validated ZhiQue contract used by the sibling MCP project:

- Base URL: `https://business.myxbx.com/hm`
- Endpoints:
  - `/api/foreign-api/activity/list`
  - `/api/foreign-api/course/list`
  - `/api/foreign-api/club/list`
  - `/api/foreign-api/foodsite/list`
  - `/api/foreign-api/site/list`
- Method: `POST`
- Body: `{"orgcode":"..."}`
- Required signed headers:
  - `appId`
  - `timestamp`
  - `nonce`
  - `sign`
- Success response code: `1000`

The Word document also states that the timestamp used for signing must stay aligned with the request timestamp and should be within 1 minute of the access time.

## What changed in this repo

- Added bundled runtime file `.env.skill`
- Moved the proven upstream access into a single bundled `ELDERLY_SKILL_ACCESS_TOKEN`
- Kept `.env.local` as an optional override layer instead of the default runtime requirement
- Updated `src/config/index.ts` so runtime precedence is:
  1. `.env.<NODE_ENV>`
  2. bundled `.env.skill`
  3. custom `ELDERLY_SKILL_ENV_FILE` or local `.env.local`
- Updated both local startup scripts so they load bundled runtime config first, then optional local overrides
- Simplified MCP registration so supported clients no longer need an extra env-file pointer for the default install path

## User-facing result

For supported auto-configured clients:

- OpenClaw
- Claude Code
- Cursor
- Codex

Users can now run setup, install the skill, and start using the 5 upstream-backed tools without manually editing environment variables.

For Windsurf and Trae:

- skill installation is automated
- MCP still uses a printed snippet for manual paste

## Live verification

Live upstream smoke test was run from this repo on 2026-04-13 after bundling the runtime config.

Observed totals:

- activities: 5
- courses: 4
- clubs: 48
- mealPoints: 501
- homeCareStations: 21

This confirms the bundled runtime config and current repo adapter can reach the real ZhiQue upstream successfully.
