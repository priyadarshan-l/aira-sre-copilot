#!/bin/bash
# setup.sh - Create Python virtual environment and install AIRA dependencies

echo "=========================================================="
echo "      AIRA - SRE Agent Environment Setup Script"
echo "=========================================================="

# 1. Check Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed. Please install Python 3.10+."
    exit 1
fi

echo "✔ Python3 found: $(python3 --version)"

# 2. Create Virtual Environment
echo -e "\nStep 1: Creating virtual environment (.venv)..."
if [ -d ".venv" ]; then
    echo "⚠ Virtual environment (.venv) already exists. Re-using it."
else
    python3 -m venv .venv
    echo "✔ Virtual environment created."
fi

# 3. Activate Virtual Environment
echo -e "\nStep 2: Activating virtual environment..."
source .venv/bin/activate
echo "✔ Virtual environment activated."

# 4. Upgrade Pip
echo -e "\nStep 3: Upgrading pip..."
pip install --upgrade pip

# 5. Install Dependencies
echo -e "\nStep 4: Installing dependencies from backend/requirements.txt..."
if [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
else
    echo "⚠ Warn: backend/requirements.txt not found! Installing core dependencies manually..."
    pip install fastapi uvicorn websockets gymnasium numpy torch stable-baselines3 chromadb sentence-transformers langchain langchain-community langchain-openai python-dotenv requests pydantic google-generativeai python-socketio
fi

# 6. Install Telemetry & Simulation Requirements
echo -e "\nStep 5: Installing host telemetry dependencies..."
pip install psutil

echo -e "\n=========================================================="
echo "✔ Setup Completed Successfully!"
echo "=========================================================="
echo "To run the backend:"
echo "  1. Source the virtual environment: source .venv/bin/activate"
echo "  2. Start the API: ./run_backend.sh"
echo ""
echo "To run the frontend:"
echo "  1. Open a new terminal"
echo "  2. Start the dev server: ./run_frontend.sh"
echo "=========================================================="
