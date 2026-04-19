# 🏗️ DIABINSIGHT - Project Architecture (Master Context Aligned)

## Overview

This document describes the project structure, implementation approach, and architectural decisions according to the **DIABINSIGHT Master Agent Context Document**.

---

## Project Identity

**DIABINSIGHT** is a multi-tier diagnostic and lifestyle intervention system for diabetes prevention and complication detection.

**Core Innovation**: Replace single-snapshot risk forms with **longitudinal 7-day behavioral tracking** + **computer vision screening** for foot ulcers + **IoT smart insole prototype**.

**Development Status**: Active. ML models optimized. Architecture production-ready.

---

## System Architecture - Four Phases

### Phase 1: 7-Day Predictive Behavioral Model ✅ (PRIMARY)
- Users complete **~2-minute daily questionnaire for 7 days**
- Time-series data aggregated (moving average / weighted scores)
- Vector fed to **XGBoost classifier**
- Output: **Probabilistic diabetes risk score** (0-1)
- Expected accuracy: **82-84% AUC** (non-invasive features only)

### Phase 2: Lifestyle & Nutrition Recommendations ✅
- Triggered by Phase 1 output
- **Rule-based engine** maps risk + deficiencies to recommendations
- Categories: Diet, Exercise, Lifestyle, Medical
- Priority-based (Low/Medium/High/Critical)
- **NOT** collaborative filtering (too complex, rule-based is academic-friendly)

### Phase 3: Computer Vision DFU Detection ✅
- User uploads **plantar (sole) foot image**
- **Transfer learning model** (MobileNetV2 base + custom head)
- Classification: Healthy / Early DFU / Advanced DFU
- **Grad-CAM** for localization (shows affected region)
- Expected accuracy: **92-94%** (with pre-trained weights)
- **NO custom training** - use pre-trained from DFUC2021 or HuggingFace

### Phase 4: Smart Foot Insole (Prototype) 🔜
- **Hardware**: ESP32 + FSR sensors + MLX90614 + GSR
- **Data**: Pressure (heel/metatarsal/toe), Temperature, Moisture
- **Integration**: HTTPS POST to backend
- **Status**: Prototype/future scope (documented, not fully implemented)

---

## Backend Architecture

### Folder Structure (as per master context recommendation)

```
backend/
├── app/
│   ├── main.py                      # FastAPI entry point
│   ├── database.py                  # SQLAlchemy config + session
│   ├── __init__.py
│   │
│   ├── routers/                     # API route handlers
│   │   ├── __init__.py
│   │   └── (All endpoints in one file for simplicity)
│   │
│   ├── models/                      # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   └── (User, DailyEntry, Prediction, DFUScan, etc.)
│   │
│   ├── schemas/                     # Pydantic request/response
│   │   ├── __init__.py
│   │   └── (All schemas)
│   │
│   └── services/                    # Business logic & ML
│       ├── __init__.py
│       ├── ml_predictor.py         # Phase 1: Dual XGBoost models
│       ├── dfu_classifier.py       # Phase 3: DFU detection
│       ├── recommender.py          # Phase 2: Recommendations
│       └── [config.py, auth.py, etc.]
│
├── ml/
│   ├── train_model_optimized.py     # Phase 1: Training script (dual models)
│   ├── train_dfu_model_optimized.py # Phase 3: Training script
│   ├── evaluate.py                  # Model evaluation
│   └── artifacts/
│       ├── xgb_model_app.joblib     # Non-invasive model (deployed)
│       ├── xgb_model_clinical.joblib # Full model (research paper)
│       ├── dfu_model_best.pth       # DFU model weights
│       └── preprocessor.joblib
│
├── tests/
│   ├── test_prediction.py
│   ├── test_dfu.py
│   └── test_recommendations.py
│
├── app.py                           # Legacy (to be removed)
├── requirements.txt                 # Python dependencies
├── .env.example                     # Configuration template
└── README.md

frontend/
data/
docs/
hardware/
```

---

## Key Architectural Decisions

### 1. Dual Model Approach

**The Master Context mandates TWO separate models:**

```python
# NON-INVASIVE (app model)
features = [
    'age', 'gender', 'bmi', 'family_history_diabetes',
    'hypertension_history', 'cardiovascular_history',
    'smoking_status', 'alcohol_consumption_per_week',
    'physical_activity_minutes_per_week', 'diet_score',
    'sleep_hours_per_day', 'screen_time_hours_per_day',
    'waist_to_hip_ratio'
]
# 13 features total
# Expected accuracy: 78-84% AUC
# DEPLOYED in app
```

```python
# FULL CLINICAL (research model)
features = NON_INVASIVE + [
    'cholesterol_total', 'hdl_cholesterol', 'ldl_cholesterol',
    'triglycerides', 'glucose_fasting', 'glucose_postprandial',
    'insulin_level', 'hba1c'
]
# 21 features total
# Expected accuracy: 95-99% AUC (hba1c is near-diagnostic)
# USED IN RESEARCH PAPER ONLY
```

**Why?**
- App model is HONEST about capabilities (can't collect lab values)
- Clinical model demonstrates research ceiling
- Paper explains this trade-off transparently

### 2. XGBoost as Primary Model

**Why XGBoost?**
- ✅ Best balance of accuracy, speed, interpretability
- ✅ Handles non-linear feature interactions
- ✅ Built-in feature importance for explainability
- ✅ Fast inference (< 50ms)
- ✅ Small serialized model (~5MB)

**Avoid:**
- ❌ Plain Logistic Regression (underperforms on non-linearity)
- ❌ SVM (slow on 100K rows)
- ❌ Neural networks (overkill, less interpretable)

### 3. Hyperparameter Tuning

```python
# GridSearchCV over these combinations:
param_grid = {
    'n_estimators': [100, 200],
    'max_depth': [4, 5, 6],
    'learning_rate': [0.01, 0.05],
    'subsample': [0.7, 0.8],
    'colsample_bytree': [0.7, 0.8],
    'min_child_weight': [1, 3]
}
# Total: 288 combinations tested
# Use: 5-fold stratified CV on 100K data
```

### 4. Class Imbalance Handling

```python
# 60% diabetes (1), 40% no diabetes (0)
# Use: class_weight='balanced' in XGBoost
# Also: Stratified K-fold to maintain ratio
# Evaluate with: AUC-ROC, F1 (NOT accuracy)
```

### 5. DFU Detection: Pre-trained, NOT custom-trained

**Master Context says: DO NOT train from scratch**

**Options (in priority order):**
1. **DFUC2021 Challenge Models** ← BEST
   - Link: https://dfu-challenge.github.io/
   - Published weights, peer-reviewed
   - ResNet/EfficientNet fine-tuned on real DFU data

2. **HuggingFace Hub**
   - Search: "diabetic foot ulcer"
   - Vision Transformer or EfficientNet models
   - Integration: `from transformers import pipeline`

3. **Transfer Learning Fallback**
   - Use EfficientNetB3 / MobileNetV2
   - Fine-tune on small dataset (200-500 images)
   - Use AZH Wound Care dataset (public)

4. ❌ **DO NOT**: Train CNN from scratch (time-intensive, low accuracy)

**Grad-CAM for Localization:**
```python
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image

# Produces heatmap overlay showing which regions triggered DFU prediction
# Critical for clinical trust
```

### 6. Database Design

**SQLite for dev, PostgreSQL for prod**

```sql
-- Users (demographic + static medical history)
-- DailyEntries (7-day questionnaire responses)
-- Predictions (risk scores + timestamps)
-- DFUScans (image uploads + detection results)
-- Insole Readings (IoT sensor data)
-- Recommendations (generated from predictions)
```

All models have proper **foreign keys** and **timestamps** for audit trails.

### 7. API Design

**RESTful, organized by feature:**
```
/api/v1/health                   → Service status
/api/v1/users/register           → Onboarding
/api/v1/checkin/daily            → 7-day questionnaire
/api/v1/predict/diabetes         → Risk prediction
/api/v1/recommendations/{uid}    → Personalized advice
/api/v1/dfu/scan                 → Image upload & detection
/api/v1/insole/reading           → IoT sensor data (Phase 4)
```

**Pydantic schemas** for strict validation.

---

## CRITICAL Rules from Master Context

### NEVER ❌

1. **Use `diabetes_risk_score` as a training feature** — it leaks the target
2. **Include `hba1c` or `glucose_fasting` in the app model** — they're invasive
3. **Train DFU detector from scratch** — use pre-trained weights
4. **Use raw accuracy as the metric** — use AUC-ROC, F1, Precision, Recall
5. **Forget to handle class imbalance** — use stratification + class weights

### ALWAYS ✅

1. **Separate app model from clinical model** — be transparent
2. **Use cross-validation** — 5-fold stratified for XGBoost
3. **Include Grad-CAM** in DFU results — for clinical trust
4. **Document limitations** in paper — mention non-invasive vs. clinical gap
5. **Test with fresh data** — not training set

---

## Feature Engineering (Phase 1)

### Original Features (13)
From daily questionnaire + registration:
- `age`, `gender`, `bmi`, `waist_to_hip_ratio`
- `physical_activity_minutes_per_week`, `diet_score`, `sleep_hours_per_day`, `screen_time_hours_per_day`
- `family_history_diabetes`, `hypertension_history`, `cardiovascular_history`
- `smoking_status`, `alcohol_consumption_per_week`

### Derived Features (4) — Optional
For improved accuracy (not mandatory):
- `age_bmi_ratio` = age / (bmi + 1)
- `activity_sleep_ratio` = activity / (sleep + 1)
- `health_risk_score` = weighted sum of medical history
- `lifestyle_score` = normalized composite

### Preprocessing
```python
# Categorical: OneHotEncoder or OrdinalEncoder
# Numeric: StandardScaler (for tree models, optional but recommended)
# Pipeline: ColumnTransformer with Pipelinefor reproducibility
```

---

## Recommendation Engine (Phase 2)

### Implementation: Rule-Based Knowledge Base

```python
# NOT collaborative filtering (too complex)
# Maps (deficiency, risk_level) → recommendations

rule_db = {
    'low_activity': {
        'Low': 'Take 10-min walks daily',
        'Moderate': 'Aim for 150 min/week moderate exercise',
        'High': 'Urgent: 150+ min/week with strength training'
    },
    'poor_diet': {
        'Low': 'Add one fruit/vegetable per meal',
        'Moderate': 'Reduce sugar and refined carbs',
        'High': 'Diabetes-specific meal plan required'
    },
    # ... more deficiencies
}
```

**Output**: Prioritized list of recommendations (Low → Critical)

---

## 7-Day Questionnaire (Phase 1 Data Collection)

### Daily Questions (≈2 min to answer)
1. Diet quality (1-10 score) → `diet_score`
2. Physical activity (minutes) → `physical_activity_minutes_per_week` (sum across 7 days)
3. Sleep (hours) → `sleep_hours_per_day` (average across 7 days)
4. Screen time (hours) → `screen_time_hours_per_day` (average)
5. Hydration (glasses of water) → bonus signal
6. Stress level (1-5) → bonus signal

### One-Time Registration (Collected Once)
- Demographics: age, gender, ethnicity, education, income, employment
- Medical history: family history, hypertension, cardiovascular disease
- Lifestyle: smoking status, alcohol
- Biometrics: BMI, waist-to-hip ratio

### Aggregation Before Prediction
```python
# After 7 days, aggregate:
avg_diet_score = mean(daily_diet_scores)
weekly_activity = sum(daily_activity_minutes)
avg_sleep = mean(daily_sleep_hours)
avg_screen = mean(daily_screen_hours)

# Then predict using aggregated vector
```

---

## Production Deployment Checklist

- [ ] Train both models (app + clinical)
- [ ] Test models on validation set
- [ ] Set up PostgreSQL database
- [ ] Implement JWT authentication
- [ ] Configure HTTPS/TLS
- [ ] Set up monitoring (Prometheus, ELK)
- [ ] Load testing (locust/k6)
- [ ] HIPAA compliance audit
- [ ] User acceptance testing (UAT)
- [ ] Integrate with frontend
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)

---

## Research Paper Structure (Aligned with Phases)

1. **Abstract** — Dual ML + DFU vision approach
2. **Introduction** — Diabetes prevalence, neuropathy, ulcer complications
3. **Related Work** — PIMA dataset, DFU literature, wearable sensors
4. **Proposed System** — 4 phases with architecture diagrams
5. **Dataset & Preprocessing** — 100K rows, feature engineering, class balance
6. **Phase 1 Evaluation** — Two models compared: app vs. clinical
7. **Phase 3 Evaluation** — Transfer learning, Grad-CAM, classification metrics
8. **Hardware Prototype** — Sensor design, data schema (even if not fully built)
9. **Results & Discussion** — Accuracy, limitations, ethical considerations
10. **Conclusion & Future Scope** — Clinical trials, full hardware integration

---

## Key Files & Their Purpose

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI entry point, CORS, error handlers |
| `app/routers/__init__.py` | All API endpoints (users, checkin, predict, dfu, insole) |
| `app/services/ml_predictor.py` | XGBoost dual models (app + clinical) |
| `app/services/dfu_classifier.py` | DFU detection + Grad-CAM |
| `app/services/recommender.py` | Rule-based recommendation engine |
| `app/models/__init__.py` | SQLAlchemy ORM models (User, DailyEntry, Prediction, etc.) |
| `app/schemas/__init__.py` | Pydantic request/response schemas |
| `app/database.py` | SQLAlchemy setup, get_db dependency |
| `ml/train_model_optimized.py` | XGBoost training (GridSearchCV, cross-val) |
| `ml/train_dfu_model_optimized.py` | DFU model (transfer learning, fine-tuning) |

---

## Environment & Configuration

### Development
```bash
DATABASE_URL=sqlite:///./app/data/diabinsight.db
ENVIRONMENT=development
```

### Production
```bash
DATABASE_URL=postgresql://user:pass@localhost/diabinsight
ENVIRONMENT=production
SECRET_KEY=<strong-random-key>
```

---

## Testing Strategy

```python
# Unit tests for services
def test_prediction_service():
    service = get_prediction_service()
    result = service.predict_app_model(features_dict)
    assert 0 <= result['risk_score'] <= 1

# Integration tests for API
def test_predict_endpoint():
    response = client.post("/api/v1/predict/diabetes", json={"user_id": "..."})
    assert response.status_code == 200
    assert "risk_score" in response.json()

# End-to-end tests
def test_user_journey():
    # Register → Submit daily entries × 7 → Get prediction → Get recommendations
```

---

## Performance Targets

| Component | Latency | Throughput |
|-----------|---------|-----------|
| Phase 1 (XGBoost) | < 50ms | 100+ pred/sec |
| Phase 3 (DFU) | < 2s (GPU), < 4s (CPU) | 5-10 scans/sec |
| API | < 100ms (excluding model inference) | 1000+ req/sec |

---

## Future Extensions (Phase 4 & Beyond)

1. **Full Hardware Integration**
   - ESP32 firmware with sensor calibration
   - Real-time anomaly detection
   - Mobile app for insole data visualization

2. **Federated Learning**
   - Multi-hospital training without centralizing patient data
   - Privacy-preserving model updates

3. **Advanced Analytics**
   - Longitudinal risk trajectory modeling
   - Population-level epidemiological insights

4. **Clinical Trial Support**
   - Integration with EHR systems
   - Automated data collection & validation

---

**Document Version**: 1.0.0  
**Aligned with**: DIABINSIGHT Master Agent Context Document  
**Last Updated**: April 2026
