#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  scripts/build.sh — Compile the C++ VectorDB server         ║
# ╚══════════════════════════════════════════════════════════════╝
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo ""
echo "  ┌─ VectorDB Build ─────────────────────────────────────┐"

# Check for g++
if ! command -v g++ &>/dev/null; then
  echo "  │  ✗  g++ not found. Install: sudo apt install g++"
  echo "  └──────────────────────────────────────────────────────┘"
  exit 1
fi

# Check for OpenSSL
if ! pkg-config --exists openssl 2>/dev/null; then
  echo "  │  ✗  OpenSSL not found. Install: sudo apt install libssl-dev"
  echo "  └──────────────────────────────────────────────────────┘"
  exit 1
fi

OPENSSL_FLAGS=$(pkg-config --cflags --libs openssl)

echo "  │  Compiler : $(g++ --version | head -1)"
echo "  │  OpenSSL  : $(pkg-config --modversion openssl)"
echo "  │  Source   : server/main.cpp"
echo "  │  Output   : ./db"
echo "  │"
echo "  │  Compiling... (this takes ~10 seconds)"

g++ -std=c++17 -O2 -Wall -Wextra -Wno-unused-parameter \
    -DCPPHTTPLIB_OPENSSL_SUPPORT \
    -I./server \
    -o db \
    server/main.cpp \
    -lpthread $OPENSSL_FLAGS

echo "  │  ✓  Build successful → ./db"
echo "  └──────────────────────────────────────────────────────┘"
echo ""
