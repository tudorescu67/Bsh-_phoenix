#!/usr/bin/env bash
set -euo pipefail

HOST="${VPS_HOST:-${1:-}}"
TARGET_DIR="${VPS_TARGET_DIR:-${2:-/var/www/phoenix-dashboard}}"

if [[ -z "$HOST" ]]; then
  echo "Usage: ./deploy-vps.sh <user@host> [target-dir]"
  echo "Example: ./deploy-vps.sh root@185.203.118.214 /var/www/phoenix-dashboard"
  exit 1
fi

echo "Deploying to $HOST:$TARGET_DIR"
rsync -avz --delete --exclude '.git' --exclude 'node_modules' ./ "$HOST:$TARGET_DIR/"
ssh "$HOST" "cd '$TARGET_DIR' && npm install --omit=dev && (pm2 delete phoenix-dashboard >/dev/null 2>&1 || true) && pm2 start \"npx serve . -l 3000\" --name phoenix-dashboard"
echo "Deploy completed. Open: http://$HOST:3000"
