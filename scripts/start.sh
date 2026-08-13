#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  scripts/start.sh — Production start                        ║
# ║                                                              ║
# ║  1. Loads .env                                               ║
# ║  2. Builds C++ server                                        ║
# ║  3. Builds frontend (npm run build → frontend/dist)         ║
# ║  4. Serves everything from ./db on :8080                     ║
# ║                                                              ║
# ║  Usage:   ./scripts/start.sh                                 ║
# ╚══════════════════════════════════════════════════════════════╝
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── Load .env ─────────────────────────────────────────────────
if [ -f .env ]; then
  set -a; source .env; set +a
  echo "  ✓  Loaded .env"
fi

if [ -z "${NVIDIA_API_KEY:-}" ]; then
  echo ""
  echo "  ⚠  NVIDIA_API_KEY is not set."
  echo "     RAG features will be disabled."
  echo "     Get a free key at: https://build.nvidia.com"
  echo ""
fi

echo ""
echo "  ┌─ VectorDB Production Build ──────────────────────────┐"

# ── Build C++ server ──────────────────────────────────────────
echo "  │  Step 1/3 — Compiling C++ server..."
bash "$ROOT/scripts/build.sh"

# ── Build frontend ────────────────────────────────────────────
echo "  │  Step 2/3 — Building frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
  echo "  │  Installing npm dependencies..."
  npm install --silent
fi

node node_modules/vite/bin/vite.js build --outDir dist 2>&1 | grep -v "^$" | sed 's/^/  │  /'
cd "$ROOT"
echo "  │  ✓  Frontend built → frontend/dist"
echo "  │"

# ── Start server ──────────────────────────────────────────────
echo "  │  Step 3/3 — Starting server..."
echo "  │"
echo "  │  App  → http://localhost:8080"
echo "  │  API  → http://localhost:8080/search"
echo "  │"
echo "  │  Press Ctrl+C to stop"
echo "  └──────────────────────────────────────────────────────┘"
echo ""

./db
