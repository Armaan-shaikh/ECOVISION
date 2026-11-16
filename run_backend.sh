#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "======================================================================"
echo "               ECOVISION BACKEND INITIALIZATION & LAUNCH"
echo "======================================================================"

if [ ! -f "backend/venv/bin/python" ]; then
    echo "[INFO] Python virtual environment not found in backend/venv."
    echo "[INFO] Setting up virtual environment automatically..."
    if command -v python3 >/dev/null 2>&1; then
        PYTHON_CMD=python3
    elif command -v python >/dev/null 2>&1; then
        PYTHON_CMD=python
    else
        echo "[ERROR] Python 3.10+ was not found on your PATH!"
        echo "Please install Python 3.10, 3.11, or 3.12."
        exit 1
    fi
    echo "[INFO] Using: $($PYTHON_CMD --version)"
    $PYTHON_CMD -m venv backend/venv
    backend/venv/bin/python -m pip install --upgrade pip
    backend/venv/bin/python -m pip install -r backend/requirements.txt
    echo "[SUCCESS] Virtual environment configured."
fi

if [ ! -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
    echo "[INFO] Creating backend/.env from template..."
    cp backend/.env.example backend/.env
fi

echo "======================================================================"
echo "Launching EcoVision Flask REST API on http://127.0.0.1:5001 ..."
echo "Press Ctrl+C in this terminal to stop the server."
echo "======================================================================"
exec backend/venv/bin/python backend/run.py
