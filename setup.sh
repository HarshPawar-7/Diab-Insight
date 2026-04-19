#!/bin/bash

# DIABINSIGHT Project Setup Script
# This script sets up the complete project environment

echo "🏥 DIABINSIGHT Setup Script"
echo "=========================================="
echo ""

# Check Python version
echo "🐍 Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Python version: $python_version"
echo ""

# Create backend virtual environment
echo "📦 Setting up backend environment..."
if [ ! -d "backend/venv" ]; then
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    echo "   Installing Python dependencies..."
    pip install -r requirements.txt
    echo "   ✅ Backend environment ready"
    cd ..
else
    echo "   ✅ Backend environment already exists"
fi

echo ""

# Setup frontend
echo "🎨 Setting up frontend environment..."
if [ ! -d "frontend/node_modules" ]; then
    cd frontend
    npm install
    echo "   ✅ Frontend dependencies installed"
    cd ..
else
    echo "   ✅ Frontend dependencies already installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "================================"
echo ""
echo "1️⃣  Train the models (optional - pre-trained models will be used)"
echo ""
echo "   Backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python train_model_optimized.py"
echo "   python train_dfu_model_optimized.py"
echo ""
echo "2️⃣  Start the backend server"
echo ""
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn app:app --reload --port 8000"
echo ""
echo "   API will be available at: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "3️⃣  In a new terminal, start the frontend"
echo ""
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "   Frontend will be available at: http://localhost:5173"
echo ""
echo "4️⃣  Open your browser and visit"
echo ""
echo "   http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "   - README.md (project overview)"
echo "   - docs/ARCHITECTURE.md (system design)"
echo "   - docs/API_DOCUMENTATION.md (API reference)"
echo "   - docs/MODEL_TRAINING.md (training guide)"
echo ""
