#!/usr/bin/env bash
# Development launcher: sets up Python venv, installs deps, and runs bun dev
set -euo pipefail

# Create Python virtual environment if missing
if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi

# Activate the virtual environment
# shellcheck disable=SC1091
source .venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Installing JS dependencies..."
bun install

echo "Starting development servers..."

# Run with renderer process logs enabled
ELECTRON_ENABLE_LOGGING=1 bun dev