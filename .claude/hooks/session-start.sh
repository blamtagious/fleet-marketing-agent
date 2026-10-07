#!/bin/bash
# Installs dependencies in Claude Code cloud sessions so `npm run check` and `npm test` work.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
if [ ! -d node_modules ] || [ ! -x node_modules/.bin/tsx ]; then
  npm install --no-audit --no-fund --silent
fi
