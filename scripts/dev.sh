#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  scripts/dev.sh — Full dev stack with hot-reload            ║
# ║                                                              ║
# ║  Starts:  1. C++ VectorDB server  → :8080                   ║
# ║           2. Vite frontend dev    → :5173                    ║
# ║                                                              ║
# ║  Usage:   ./scripts/dev.sh                                   ║
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
  echo "     RAG and document embedding will be disabled."
  echo "     Get a free key at: https://build.nvidia.com"
  echo "     Then add to .env:  NVIDIA_API_KEY=nvapi-..."
  echo ""
fi

# ── Build server ──────────────────────────────────────────────
echo ""
echo "  ┌─ VectorDB Dev Mode ──────────────────────────────────┐"
echo "  │  Building C++ server..."

bash "$ROOT/scripts/build.sh"

# ── Start server in background ────────────────────────────────
echo "  │  Starting server on :8080..."
./db &
SERVER_PID=$!

# Give server a moment to bind
sleep 1

if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo "  │  ✗  Server failed to start"
  echo "  └──────────────────────────────────────────────────────┘"
  exit 1
fi

echo "  │  ✓  Server PID $SERVER_PID running on http://localhost:8080"
echo "  │"

# ── Install frontend deps if needed ──────────────────────────
if [ ! -d "frontend/node_modules" ]; then
  echo "  │  Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

echo "  │  Starting Vite dev server on :5173..."
echo "  │"
echo "  │  Frontend → http://localhost:5173"
echo "  │  Backend  → http://localhost:8080"
echo "  │"
echo "  │  Press Ctrl+C to stop everything"
echo "  └──────────────────────────────────────────────────────┘"
echo ""

# Kill server when script exits
trap "echo ''; echo '  Shutting down...'; kill $SERVER_PID 2>/dev/null; exit 0" SIGINT SIGTERM EXIT

# Start Vite (foreground — blocking)
cd frontend
node node_modules/vite/bin/vite.js
