#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/frontend"

echo "======================================================================"
echo "               ECOVISION FRONTEND INITIALIZATION & LAUNCH"
echo "======================================================================"

if ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] Node.js / npm was not found on your PATH!"
    echo "Please install Node.js 18+ or 20+ LTS from https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[INFO] Frontend dependencies not found."
    echo "[INFO] Running 'npm install' automatically..."
    npm install
    echo "[SUCCESS] Frontend dependencies installed."
fi

echo "======================================================================"
echo "Launching React 19 + Vite Frontend on http://localhost:5173 ..."
echo "Proxying API calls to Flask Backend on http://127.0.0.1:5001 ..."
echo "======================================================================"
exec npm run dev

