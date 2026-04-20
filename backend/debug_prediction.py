"""Debug script to check model predictions"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.ml_predictor import DiabetesPredictionService
import json

# Initialize the prediction service
pred_service = DiabetesPredictionService()

print("="*60)
print("CHECKING PREDICTION MODEL")
print("="*60)

# Test with the values from your recent test
test_features = {
    'age': 25,
    'gender': 'Male',
    'bmi': 24.5,
    'family_history_diabetes': 0,
    'hypertension_history': 0,
    'cardiovascular_history': 0,
    'smoking_status': 0,
    'alcohol_consumption_per_week': 0,
    'physical_activity_minutes_per_week': 50,  # 50 min/day avg * 7 = 350/week
    'diet_score': 6.5,  # Average diet score
    'sleep_hours_per_day': 7.0,
    'screen_time_hours_per_day': 4.0
}

print("\n📊 TEST FEATURES:")
print(json.dumps(test_features, indent=2))

print("\n🔍 CHECKING MODEL FILES:")
model_dir = Path(__file__).parent / "ml"
model_files = list(model_dir.glob("*.pkl"))
print(f"Found {len(model_files)} model files:")
for f in model_files:
    print(f"  - {f.name}")

print("\n🤖 APP MODEL STATUS:")
print(f"  Model loaded: {pred_service.app_model is not None}")
print(f"  Scaler loaded: {pred_service.scaler is not None}")
print(f"  LE Gender loaded: {pred_service.le_gender is not None}")
print(f"  LE Smoking loaded: {pred_service.le_smoking is not None}")

if pred_service.app_model:
    print("\n🎯 RUNNING PREDICTION:")
    result = pred_service.predict_app_model(test_features)
    print(json.dumps(result, indent=2))
    
    print("\n📈 ANALYSIS:")
    if 'risk_score' in result and result['risk_score'] is not None:
        score = result['risk_score']
        print(f"  Risk Score: {score:.1%}")
        print(f"  Risk Category: {result.get('risk_category', 'N/A')}")
        print(f"  Confidence: {result.get('confidence', 0):.1%}")
        
        if score < 0.35:
            print(f"  ✅ This is a LOW RISK prediction")
        elif score < 0.65:
            print(f"  ⚠️  This is a MODERATE RISK prediction")
        else:
            print(f"  🔴 This is a HIGH RISK prediction")
    else:
        print(f"  ❌ Error: {result.get('error', 'Unknown error')}")
else:
    print("\n❌ APP MODEL NOT LOADED - Cannot run prediction")
    print("   Checking for model file...")
    model_path = model_dir / "diab_insight_xgboost_phase1_optimized.pkl"
    print(f"   Expected path: {model_path}")
    print(f"   File exists: {model_path.exists()}")
    
    if model_path.exists():
        print(f"   File size: {model_path.stat().st_size} bytes")

print("\n" + "="*60)
