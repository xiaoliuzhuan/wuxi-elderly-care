#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
DEFAULT_ENV_FILE="$ROOT_DIR/.env.skill"
ENV_FILE=${ELDERLY_SKILL_ENV_FILE:-"$ROOT_DIR/.env.local"}

if [ -f "$DEFAULT_ENV_FILE" ]; then
  set -a
  . "$DEFAULT_ENV_FILE"
  set +a
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

if [ ! -f "$ROOT_DIR/dist/mcp/index.js" ]; then
  echo "Building skill-elderly-care..." >&2
  npm --prefix "$ROOT_DIR" run build >/dev/null
fi

exec node "$ROOT_DIR/dist/mcp/index.js"
