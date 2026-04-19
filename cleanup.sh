#!/bin/bash
# Cleanup script to remove unnecessary files and directories

echo "🧹 DIABINSIGHT Project Cleanup Script"
echo "=================================="
echo ""

# Remove Python cache directories
echo "🗑️  Removing Python cache directories..."
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null
find . -type d -name .eggs -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete

# Remove test files that aren't needed
echo "📝 Removing unnecessary test files..."
rm -f backend/test_vision.py 2>/dev/null
rm -f test_vision.py 2>/dev/null

# Remove legacy training scripts (keep optimized versions)
echo "📚 Removing old training scripts..."
rm -f backend/train_dfu_model.py 2>/dev/null
rm -f backend/train_model.py 2>/dev/null

# Remove legacy/old model files (keep optimized versions)
echo "🤖 Removing old model files..."
rm -f backend/best_pretrained_model.h5 2>/dev/null
rm -f backend/diab_insight_xgboost_phase1.pkl 2>/dev/null
rm -f backend/diabetic_foot_uIcer.h5 2>/dev/null

# Remove legacy checkpoint files
echo "💾 Removing checkpoint files..."
rm -f backend/best_dfu_model_checkpoint.h5 2>/dev/null

# Remove test data files
echo "🖼️  Removing test image files..."
rm -f backend/test_dfu_detection.py 2>/dev/null
rm -f FootUlcer.jpeg 2>/dev/null
rm -f normal_foot.jpeg 2>/dev/null

# Remove Python virtual environments (keep only for reference)
echo "🐍 Virtual environments found (not removed):"
find . -type d -name venv -o -type d -name .venv | head -5

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Current project structure:"
echo "================================"
find . -type f -name "*.py" -o -name "*.json" -o -name "*.csv" -o -name "*.md" | grep -v venv | sort

echo ""
echo "🎯 Next steps:"
echo "1. Train optimized models: python backend/train_model_optimized.py"
echo "2. Train DFU model: python backend/train_dfu_model_optimized.py"
echo "3. Start backend: uvicorn backend.app:app --reload"
echo "4. Start frontend: cd frontend && npm run dev"
