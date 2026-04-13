---
name: elderly-care
description: Query Wuxi elderly-care activities, courses, clubs, meal points, and home-care stations. Use this whenever the user asks about Wuxi senior activities, courses, neighborhood services, meal assistance, or local elderly-care resources. Prefer the bundled MCP tools when available; otherwise use the local REST API.
user-invocable: true
---

# elderly-care

Use this skill when the user asks about elderly-care information in Wuxi, including:

- community activities
- senior courses
- hobby clubs
- meal service points
- home-care stations

This skill is OpenClaw-first. This repo contains both the MCP server and the REST API. Prefer the built-in MCP server. Use the built-in REST API as a fallback path.

This packaged copy exists so the same repository can be exposed through Codex plugin packaging as well as direct skill-directory installs.

## Preferred Backend

Prefer these MCP tools when they are available:

- `get_elderly_activities`
- `get_elderly_courses`
- `get_elderly_clubs`
- `get_meal_points`
- `get_home_care_stations`

These direct `get_elderly_*` tools appear only after the client connects this repo's bundled MCP server, typically via `./scripts/start-local-mcp.sh`.

This repo already ships a bundled `.env.skill`, so supported clients can use the upstream-backed tools right after setup without manually filling environment variables. Use `.env.local` only when you intentionally want to override the bundled defaults.

If MCP tools are not available, use the local REST API:

- Base URL: `http://127.0.0.1:3200/openapi/v1/elderly`
- Auth: `Authorization: Bearer <ELDERLY_SKILL_API_TOKEN>`
- Default local token: `elderly-skill-local-token`

## Tool And Route Map

- `get_elderly_activities` <-> `GET /activities`
- `get_elderly_courses` <-> `GET /courses`
- `get_elderly_clubs` <-> `GET /clubs`
- `get_meal_points` <-> `GET /meal-points`
- `get_home_care_stations` <-> `GET /home-care-stations`

## Query Hints

- Activities support `date`, `community`, `category`
- Courses support `community`, `category`
- Clubs support `community`, `category`
- Meal points support `district`, `street`
- Home-care stations support `district`, `street`, `service`

When the user asks for "nearby" but no district, street, or community is provided, do not invent location awareness. Either:

- use the most relevant city-level/default results, or
- ask one concise follow-up if location materially changes the answer

## Output Rules

- Answer with the most relevant results first
- Mention the filters used when they matter
- If no result matches, say that clearly instead of guessing
- Do not invent policy eligibility, subsidy rules, or medical advice
- If data came from local fallback data, say so when it matters

## Boundaries

Do not use this skill for:

- medical diagnosis
- legal eligibility determination
- emergency dispatch
- outbound booking or external messaging

## Local Setup

This repo supports a bundled `.env.skill` plus an optional local `.env.local` override file.

- For local MCP startup, use `./scripts/start-local-mcp.sh`
- For local REST startup, use `./scripts/start-local-rest.sh`
- For MCP dev mode, use `npm run dev:mcp`
