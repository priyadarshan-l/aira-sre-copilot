#!/bin/bash
# run_backend.sh - Start the FastAPI backend inside virtual environment

echo "=========================================================="
echo "          Starting AIRA FastAPI Backend API"
echo "=========================================================="

# Check if .venv exists
if [ ! -d ".venv" ]; then
    echo "❌ Error: Virtual environment (.venv) not found. Please run ./setup.sh first."
    exit 1
fi

# Activate virtual environment
source .venv/bin/activate

# Set PYTHONPATH to root workspace directory
export PYTHONPATH=$(pwd)

# Start backend
python3 -m backend.api.app
