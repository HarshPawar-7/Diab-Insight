# Backend ML Training Pipeline

## Directory Structure
```
ml/
├── train_model_optimized.py        # Phase 1: XGBoost training (dual models)
├── train_dfu_model_optimized.py    # Phase 3: DFU detection transfer learning
├── evaluate.py                     # Model evaluation utilities
└── artifacts/
    ├── xgb_model_app.joblib        # Deployed app model (non-invasive)
    ├── xgb_model_clinical.joblib   # Research clinical model
    ├── dfu_model_best.pth          # DFU detection weights
    └── preprocessor.joblib         # Feature pipeline
```

## Training Scripts

### Phase 1: Diabetes Risk Prediction
**File:** `train_model_optimized.py`
```bash
python backend/ml/train_model_optimized.py
```
- Input: `backend/data/diabetes_dataset.csv`
- Output: 
  - `artifacts/xgb_model_app.joblib` (13 features)
  - `artifacts/xgb_model_clinical.joblib` (22 features)
- Method: GridSearchCV (288 params), 5-fold stratified CV
- Expected: 82-84% AUC (app), 95%+ AUC (clinical)

### Phase 3: DFU Detection
**File:** `train_dfu_model_optimized.py`
```bash
python backend/ml/train_dfu_model_optimized.py
```
- Input: Pre-trained MobileNetV2
- Output: `artifacts/dfu_model_best.pth`
- Method: Transfer learning + fine-tuning
- Expected: 92%+ accuracy

## Key Parameters

### XGBoost (Phase 1)
```python
n_estimators: 100-200
max_depth: 4-6
learning_rate: 0.01-0.05
subsample: 0.7-0.8
colsample_bytree: 0.7-0.8
class_weight: 'balanced'  # Important: handles 60/40 imbalance
```

### DFU Model (Phase 3)
```python
base_model: MobileNetV2 (pretrained)
input_size: 224×224
augmentation: flip, rotation, zoom, translation
freeze_base: 10 epochs, then unfreeze
learning_rate: 1e-4 (frozen), 1e-5 (unfrozen)
```

## Critical Rules

❌ **Never:**
- Use `diabetes_risk_score` as training feature (target leakage)
- Include `hba1c` or `glucose_fasting` in app model (invasive)
- Train DFU detector from scratch

✅ **Always:**
- Use stratified CV for class imbalance
- Set `class_weight='balanced'`
- Evaluate with AUC-ROC, F1 (not accuracy)
- Include Grad-CAM for DFU localization

## Feature Sets

### App Model (13 Non-Invasive Features)
- age, gender, bmi, waist_to_hip_ratio
- family_history_diabetes, hypertension_history, cardiovascular_history
- smoking_status, alcohol_consumption_per_week
- physical_activity_minutes_per_week, diet_score
- sleep_hours_per_day, screen_time_hours_per_day

### Clinical Model (22 Features, +9 Labs)
- All app features + 
- cholesterol_total, hdl_cholesterol, ldl_cholesterol, triglycerides
- glucose_fasting, glucose_postprandial, insulin_level
- hba1c

## After Training

Models are automatically loaded by services on startup:
- `app/services/ml_predictor.py` → uses XGBoost models
- `app/services/dfu_classifier.py` → uses DFU model

Test models:
```python
from app.services import get_prediction_service, get_dfu_service

# Test prediction
pred_service = get_prediction_service()
result = pred_service.predict_app_model({...})

# Test DFU
dfu_service = get_dfu_service()
result = dfu_service.detect(image)
```

## Troubleshooting

**Issue:** `FileNotFoundError: xgb_model_app.joblib`
- **Solution:** Run `python backend/ml/train_model_optimized.py`

**Issue:** Model accuracy too low
- **Solution:** Check for feature leakage, ensure class_weight='balanced'

**Issue:** DFU model not found
- **Solution:** Run `python backend/ml/train_dfu_model_optimized.py` or download pre-trained from HuggingFace

## Version History

- **v1.0** (Apr 2024): Initial models, GridSearchCV optimization
- **v1.1** (Planned): ONNX export for faster inference
- **v2.0** (Planned): Multi-algorithm ensemble

---
**Last Updated:** April 2024
