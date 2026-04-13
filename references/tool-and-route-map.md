# Tool And Route Map

## MCP Tools

| Tool | REST Fallback | Description |
|------|------|------|
| `get_elderly_activities` | `GET /openapi/v1/elderly/activities` | Query community activities |
| `get_elderly_courses` | `GET /openapi/v1/elderly/courses` | Query senior courses |
| `get_elderly_clubs` | `GET /openapi/v1/elderly/clubs` | Query hobby clubs |
| `get_meal_points` | `GET /openapi/v1/elderly/meal-points` | Query meal service points |
| `get_home_care_stations` | `GET /openapi/v1/elderly/home-care-stations` | Query home-care stations |

## Supported Query Parameters

| Capability | Parameters |
|------|------|
| activities | `date`, `community`, `category` |
| courses | `community`, `category` |
| clubs | `community`, `category` |
| meal-points | `district`, `street` |
| home-care-stations | `district`, `street`, `service` |

## Backend Priority

1. MCP tools
2. Local REST API

This priority is intentional for the current OpenClaw-first phase.

Both backends now live in this same repo.
