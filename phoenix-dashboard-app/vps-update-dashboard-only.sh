#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-/home/phoenix/Bsh-_phoenix}"
DASH_DIR="$REPO_DIR/phoenix-dashboard-app"

cd "$REPO_DIR"
git pull --ff-only origin main

cd "$DASH_DIR"
npm ci --omit=dev

pm2 restart phoenix-dashboard-api --update-env || true
pm2 restart phoenix-dashboard --update-env || pm2 start "npx serve . -l 3000" --name phoenix-dashboard
pm2 save

echo "Dashboard update done (bot-core untouched)."
