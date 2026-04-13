#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
DEFAULT_ENV_FILE="$ROOT_DIR/.env.skill"
ENV_FILE=${ELDERLY_SKILL_ENV_FILE:-"$ROOT_DIR/.env.local"}
DIST_ENTRY="$ROOT_DIR/dist/index.js"

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

TOKEN=${ELDERLY_SKILL_API_TOKEN:-${ELDERLY_SKILL_TOKEN:-sk-default-dev-token}}

if [ -z "${CHANNELS_CONFIG:-}" ]; then
  export CHANNELS_CONFIG="[{\"channelId\":\"ch_local\",\"name\":\"本地技能渠道\",\"token\":\"$TOKEN\",\"rateLimit\":50,\"enabled\":true}]"
fi

needs_build=0

if [ ! -f "$DIST_ENTRY" ]; then
  needs_build=1
elif find "$ROOT_DIR/src" "$ROOT_DIR/scripts" "$ROOT_DIR/package.json" "$ROOT_DIR/tsconfig.json" \
  -type f -newer "$DIST_ENTRY" | grep -q .; then
  needs_build=1
fi

if [ "$needs_build" -eq 1 ]; then
  echo "Building skill-elderly-care REST runtime..." >&2
  npm --prefix "$ROOT_DIR" run build >/dev/null
fi

exec node "$DIST_ENTRY"
