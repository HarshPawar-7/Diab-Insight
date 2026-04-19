#!/bin/bash
# DIABINSIGHT Backend - Setup & Verification Script

echo "🔧 DIABINSIGHT Backend Setup & Verification"
echo "==========================================="
echo ""

# Check Python version
echo "✓ Checking Python..."
python --version

# Check directory structure
echo ""
echo "✓ Checking directory structure..."
directories=(
    "backend/app"
    "backend/app/routers"
    "backend/app/models"
    "backend/app/schemas"
    "backend/app/services"
    "backend/ml"
    "backend/ml/artifacts"
    "backend/tests"
    "data"
    "docs"
)

for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ❌ $dir (MISSING)"
    fi
done

# Check critical files
echo ""
echo "✓ Checking critical files..."
files=(
    "backend/app/main.py"
    "backend/app/database.py"
    "backend/app/__init__.py"
    "backend/app/routers/__init__.py"
    "backend/app/models/__init__.py"
    "backend/app/schemas/__init__.py"
    "backend/app/services/__init__.py"
    "backend/app/services/ml_predictor.py"
    "backend/app/services/dfu_classifier.py"
    "backend/app/services/recommender.py"
    "backend/requirements.txt"
    "backend/.env.example"
    "docs/PROJECT_ARCHITECTURE_MASTER_ALIGNED.md"
    "docs/BACKEND_IMPLEMENTATION_GUIDE.md"
    "docs/BACKEND_COMPLETION_STATUS.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        echo "  ✅ $file ($lines lines)"
    else
        echo "  ❌ $file (MISSING)"
    fi
done

# Check Python dependencies
echo ""
echo "✓ Checking Python dependencies..."
pip list | grep -E "fastapi|pydantic|sqlalchemy|xgboost|pandas" | while read line; do
    echo "  ✅ $line"
done

echo ""
echo "✓ All checks complete!"
echo ""
echo "Next steps:"
echo "1. Install dependencies: pip install -r backend/requirements.txt"
echo "2. Configure environment: cp backend/.env.example backend/.env"
echo "3. Train models: python backend/ml/train_model_optimized.py"
echo "4. Start API: python -m uvicorn app.main:app --reload --port 8000"
echo "5. Test API: http://localhost:8000/docs"
