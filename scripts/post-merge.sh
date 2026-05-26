#!/bin/bash
set -e

echo "[post-merge] Installing frontend dependencies..."
cd frontend && npm install --legacy-peer-deps --yes
cd ..

echo "[post-merge] Installing backend dependencies..."
cd backend && pip install -r requirements.txt -q
cd ..

echo "[post-merge] Syncing to GitHub..."
if [ -n "$GITHUB_TOKEN" ]; then
  REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/OduaiAbrb/GP2Official.git"
  PUSH_OUTPUT=$(git push "$REPO_URL" HEAD:main --force-with-lease 2>&1) || {
    echo "$PUSH_OUTPUT" | sed "s/${GITHUB_TOKEN}/***REDACTED***/g"
    echo "[post-merge] WARNING: GitHub push failed (non-fatal). Run 'git push origin main' manually if needed."
  }
  echo "$PUSH_OUTPUT" | sed "s/${GITHUB_TOKEN}/***REDACTED***/g"
else
  echo "[post-merge] WARNING: GITHUB_TOKEN not set — skipping GitHub sync. Set the secret to enable auto-push."
fi

echo "[post-merge] Done."
