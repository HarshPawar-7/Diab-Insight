# DIABINSIGHT — Master Agent Context Document
> **For any agent, developer, or collaborator working on this project: read this document in full before writing a single line of code. This is the single source of truth.**

---

## 1. Project Identity

**DiabInsight** is a multi-tier diagnostic and lifestyle intervention system for diabetes prevention, risk prediction, and complication detection. It is being built as both a functional application and a research paper submission.

**Core Value Proposition:** Replace single-snapshot diabetes risk forms with longitudinal (7-day) behavioral tracking, augmented by computer vision screening for diabetic foot ulcers (DFU) and an IoT smart insole prototype.

**Development Status:** Active. ML prediction model is partially built but accuracy is below acceptable thresholds. DFU vision model is not yet integrated. Hardware is in the research/planning phase.

---

## 2. System Architecture — Four Phases

### Phase 1 — 7-Day Predictive Behavioral Model (PRIMARY, build first)
Users answer a ~2-minute daily questionnaire for 7 days. Time-series data is aggregated (moving average / weighted score) to smooth anomalies. Aggregated vector is fed to an ML classifier to produce a probabilistic diabetes risk score.

### Phase 2 — Lifestyle & Nutrition Recommendation Engine
Acts on Phase 1 output. Rule-based or collaborative filtering maps risk score + identified deficits (e.g., high sugar + low activity) to a personalized dietary/exercise roadmap.

### Phase 3 — Computer Vision for DFU Detection
User uploads a plantar (sole) image. A CNN classifies it as healthy vs. early/advanced DFU. Output highlights risk regions and prompts clinical consultation.

### Phase 4 — Smart Foot Insole (Hardware, future scope)
ESP32/Arduino microcontroller reads FSR pressure sensors, DHT temperature sensors, and moisture/GSR sensors. Data feeds into the backend as an additional risk signal. This is a prototype / future-scope item for the research paper.

---

## 3. Dataset — Full Specification

**File:** `diabetes_dataset.csv`
**Rows:** 100,000 | **Columns:** 31 | **No missing values**

### 3.1 Target Variables
| Column | Type | Notes |
|---|---|---|
| `diagnosed_diabetes` | int (0/1) | Primary binary target. Distribution: 59,998 positive (60%), 40,002 negative (40%). Mild class imbalance — use `class_weight='balanced'` or stratified sampling. |
| `diabetes_stage` | str | Multi-class target: `No Diabetes` (7,981), `Pre-Diabetes` (31,845), `Type 2` (59,774), `Gestational` (278), `Type 1` (122). Highly imbalanced for multi-class tasks. |
| `diabetes_risk_score` | float | Pre-computed risk score — **DO NOT use as a feature**, it leaks the target. Only use as a reference or secondary output. |

### 3.2 Feature Groups

**Demographic / Lifestyle (Non-Invasive — ideal for 7-day questionnaire)**
| Column | Type | Notes |
|---|---|---|
| `age` | int | 18–90 |
| `gender` | str | Male, Female, Other — encode with OrdinalEncoder or drop |
| `ethnicity` | str | Asian, White, Hispanic, Black, Other |
| `education_level` | str | No formal, Highschool, Graduate, Postgraduate |
| `income_level` | str | Low, Lower-Middle, Middle, Upper-Middle, High |
| `employment_status` | str | Employed, Unemployed, Retired, Student |
| `smoking_status` | str | Never, Former, Current |
| `alcohol_consumption_per_week` | int | Units per week |
| `physical_activity_minutes_per_week` | int | Critical lifestyle signal |
| `diet_score` | float | Score — likely 0–10 or similar range |
| `sleep_hours_per_day` | float | |
| `screen_time_hours_per_day` | float | |
| `family_history_diabetes` | int (0/1) | Strong predictor |

**Medical History (Collected once at registration)**
| Column | Type |
|---|---|
| `hypertension_history` | int (0/1) |
| `cardiovascular_history` | int (0/1) |

**Biometrics (Non-Invasive — can collect at registration or estimate)**
| Column | Type |
|---|---|
| `bmi` | float |
| `waist_to_hip_ratio` | float |
| `systolic_bp` | int |
| `diastolic_bp` | int |
| `heart_rate` | int |

**Clinical Lab Values (Invasive — should NOT be collected in the app questionnaire; use only for model training)**
| Column | Type | Notes |
|---|---|---|
| `cholesterol_total` | int | Do NOT ask users for this in the app UI |
| `hdl_cholesterol` | int | |
| `ldl_cholesterol` | int | |
| `triglycerides` | int | |
| `glucose_fasting` | int | **Highly predictive but invasive** |
| `glucose_postprandial` | int | |
| `insulin_level` | float | |
| `hba1c` | float | **Single strongest predictor** |

### 3.3 Feature Engineering Instructions
- **Drop from training features:** `diabetes_risk_score`, `diabetes_stage` (if predicting `diagnosed_diabetes`), `diagnosed_diabetes` (if predicting `diabetes_stage`)
- **Encode categoricals:** Use `pd.get_dummies` or `sklearn.preprocessing.OrdinalEncoder` for: `gender`, `ethnicity`, `education_level`, `income_level`, `employment_status`, `smoking_status`
- **Scale numerics:** StandardScaler or MinMaxScaler for all float/int features before feeding to SVM or neural models. Tree-based models (XGBoost, Random Forest) do not strictly require scaling.
- **Handle class imbalance:** Use `class_weight='balanced'` in sklearn models, or `scale_pos_weight` in XGBoost. SMOTE is an option but likely not needed with 100K rows.

---

## 4. ML Model — Current Problem & Fix

### 4.1 Why Accuracy Is Low (Likely Causes)
1. **Lab features excluded in app but included in training:** If you train on `hba1c`, `glucose_fasting`, etc., but the app can't collect them, train/serve mismatch destroys real-world performance.
2. **Categoricals not encoded:** Passing raw string columns breaks tree models silently or raises errors that fall back to bad defaults.
3. **`diabetes_risk_score` included as a feature:** This directly leaks the target — model overfits training, fails on real users.
4. **No hyperparameter tuning:** Default XGBoost/RF settings are rarely optimal.
5. **Wrong evaluation metric:** With 60/40 imbalance, accuracy is misleading. Use AUC-ROC, F1, and precision-recall.

### 4.2 Recommended Model Pipeline

```python
# RECOMMENDED STACK
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score

# FEATURE SPLIT — for app (non-invasive) vs full model
NON_INVASIVE_FEATURES = [
    'age', 'gender', 'ethnicity', 'education_level', 'income_level',
    'employment_status', 'smoking_status', 'alcohol_consumption_per_week',
    'physical_activity_minutes_per_week', 'diet_score', 'sleep_hours_per_day',
    'screen_time_hours_per_day', 'family_history_diabetes',
    'hypertension_history', 'cardiovascular_history',
    'bmi', 'waist_to_hip_ratio', 'systolic_bp', 'diastolic_bp', 'heart_rate'
]

FULL_CLINICAL_FEATURES = NON_INVASIVE_FEATURES + [
    'cholesterol_total', 'hdl_cholesterol', 'ldl_cholesterol',
    'triglycerides', 'glucose_fasting', 'glucose_postprandial',
    'insulin_level', 'hba1c'
]

# DO NOT INCLUDE: diabetes_risk_score, diabetes_stage (for binary task)
TARGET = 'diagnosed_diabetes'
```

### 4.3 Expected Achievable Accuracy
- **Non-invasive features only:** AUC-ROC ~0.78–0.84, F1 ~0.75–0.82
- **Full clinical features (hba1c + glucose):** AUC-ROC ~0.95–0.99 (hba1c alone is near-diagnostic)
- **For the app:** Train on non-invasive features. Present this honestly in the paper — clinical model is the ceiling, app model is the practical version.

### 4.4 Model to Use
**Primary:** XGBoost (`XGBClassifier`) — best balance of accuracy, speed, and feature importance
**Fallback/Ensemble:** RandomForest + XGBoost soft-vote ensemble
**Avoid for this dataset:** Plain Logistic Regression (underperforms on non-linear feature interactions), vanilla SVM (slow on 100K rows)

---

## 5. 7-Day Questionnaire Design

The app collects these fields daily from the user. All are non-invasive.

| Daily Fields | Notes |
|---|---|
| Diet quality (sugar intake, carb intake, vegetable servings) | Maps to `diet_score` |
| Physical activity minutes | Maps to `physical_activity_minutes_per_week` (summed) |
| Sleep hours | Maps to `sleep_hours_per_day` |
| Screen time hours | Maps to `screen_time_hours_per_day` |
| Hydration (glasses of water) | Additional signal |
| Stress level (1–5 self-report) | Additional signal |

**Collected once at registration:**
`age`, `gender`, `bmi`, `waist_to_hip_ratio`, `family_history_diabetes`, `hypertension_history`, `cardiovascular_history`, `smoking_status`, `alcohol_consumption_per_week`, `education_level`, `income_level`, `employment_status`, `ethnicity`

**Aggregation before prediction:**
- Mean of 7-day readings for `diet_score`, `sleep_hours_per_day`, `screen_time_hours_per_day`
- Sum → convert to per-week for `physical_activity_minutes_per_week`
- Apply weighted average (recent days weight more) to smooth "cheat day" anomalies

---

## 6. DFU Detection — Computer Vision

### 6.1 The Problem
No custom DFU dataset is available and training from scratch is not feasible within the project timeline.

### 6.2 Recommended Pre-trained / Available Models

**Option A — Use a Pre-trained Model from Research (Best Quality)**
- **DFUC2021 Challenge Models:** The Diabetic Foot Ulcer Challenge 2021 produced several published models with open weights. Check: https://dfu-challenge.github.io/
- **Papers with Code:** Search "diabetic foot ulcer detection" — several ResNet/EfficientNet models have associated GitHub repos with weights: https://paperswithcode.com/task/diabetic-foot-ulcer-detection

**Option B — Hugging Face Hub (Fastest Integration)**
- Search: `diabetic foot ulcer` on https://huggingface.co/models
- Models based on `google/vit-base-patch16-224` or `microsoft/resnet-50` fine-tuned on DFU datasets are available.
- Integration: `from transformers import pipeline; classifier = pipeline("image-classification", model="<model_id>")`

**Option C — Transfer Learning Workaround (If no weights found)**
- Use a wound classification model instead — DFU is a subset of chronic wound classification.
- Base model: `EfficientNetB3` or `MobileNetV2` pretrained on ImageNet, fine-tuned on:
  - **AZH Wound Care dataset** (publicly available wound images)
  - **Medetec wound dataset**
- Fine-tune only the classification head (freeze backbone). Even 200–500 images produce acceptable results.

**Option D — Azure/Google Vision API (Quickest MVP)**
- Use Azure Custom Vision or Google AutoML Vision with a small curated DFU image set (50–100 images sourced from published medical papers with open licenses).
- Not recommended for final paper but acceptable for prototype demo.

### 6.3 Integration Architecture
```
User uploads image (plantar region)
    → Resize to 224×224
    → Normalize (ImageNet mean/std)
    → Forward pass through DFU CNN
    → Output: {healthy: 0.12, early_dfu: 0.71, advanced_dfu: 0.17}
    → If early_dfu or advanced_dfu > 0.5 → trigger clinical referral alert
    → Grad-CAM visualization → highlight risk region on image
```

### 6.4 Grad-CAM for Localization
Even if the model is a classifier (not a segmentation model), use **Grad-CAM** to produce a heatmap overlay showing which region of the foot triggered the prediction. This is critical for clinical trust and research paper credibility.
```python
# Library: pytorch-grad-cam
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
```

---

## 7. Technology Stack

### Backend
- **Language:** Python 3.10+
- **API Framework:** FastAPI (preferred over Flask for async support and auto-docs)
- **Database:** PostgreSQL via Supabase (handles time-series daily entries + image storage)
- **ORM:** SQLAlchemy or Supabase Python client

### ML / AI
- **Prediction Model:** XGBoost + scikit-learn pipeline, serialized with `joblib`
- **DFU Vision Model:** PyTorch (preferred) or TensorFlow/Keras
- **Grad-CAM:** `pytorch-grad-cam` library
- **Model Serving:** FastAPI endpoint, model loaded once at startup

### Frontend
- **Framework:** React (Next.js recommended for SSR + Vercel deployment)
- **UI:** Tailwind CSS
- **Charts:** Recharts or Chart.js for risk score visualization
- **Deployment:** Vercel

### Hardware (Phase 4)
- **Microcontroller:** ESP32 (preferred over Arduino Uno — has WiFi built-in, can POST to backend directly)
- **Sensors:**
  - Pressure: FSR402 Force Sensitive Resistors (4 per insole, mapped to heel, metatarsal, toe regions)
  - Temperature: MLX90614 IR temperature sensor (contactless, more accurate than DHT for skin surface)
  - Moisture/GSR: Grove GSR sensor or DIY electrodes
- **Communication:** ESP32 → WiFi → HTTPS POST → FastAPI backend
- **Data Schema:** `{user_id, timestamp, pressure_heel, pressure_metatarsal, pressure_toe, temp_celsius, moisture_level}`

---

## 8. Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    age INT, gender TEXT, ethnicity TEXT,
    bmi FLOAT, waist_to_hip_ratio FLOAT,
    family_history_diabetes BOOLEAN,
    hypertension_history BOOLEAN,
    cardiovascular_history BOOLEAN,
    smoking_status TEXT,
    alcohol_per_week INT,
    education_level TEXT,
    income_level TEXT,
    employment_status TEXT
);

-- Daily check-in entries
CREATE TABLE daily_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    entry_date DATE,
    diet_score FLOAT,
    physical_activity_minutes INT,
    sleep_hours FLOAT,
    screen_time_hours FLOAT,
    hydration_glasses INT,
    stress_level INT -- 1-5
);

-- Prediction results
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    predicted_at TIMESTAMP DEFAULT NOW(),
    risk_score FLOAT, -- 0.0 to 1.0 probability
    risk_category TEXT, -- Low / Moderate / High
    feature_snapshot JSONB -- store the aggregated 7-day vector used
);

-- DFU scan results
CREATE TABLE dfu_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    scanned_at TIMESTAMP DEFAULT NOW(),
    image_url TEXT, -- stored in Supabase storage
    prediction_label TEXT, -- healthy / early_dfu / advanced_dfu
    confidence FLOAT,
    gradcam_url TEXT -- heatmap overlay image URL
);

-- IoT insole readings (Phase 4)
CREATE TABLE insole_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    recorded_at TIMESTAMP DEFAULT NOW(),
    pressure_heel FLOAT,
    pressure_metatarsal FLOAT,
    pressure_toe FLOAT,
    temp_celsius FLOAT,
    moisture_level FLOAT
);
```

---

## 9. API Endpoints

```
POST /api/v1/users/register          → create user profile
POST /api/v1/checkin/daily           → submit daily questionnaire entry
GET  /api/v1/checkin/history/{uid}   → get 7-day history
POST /api/v1/predict/diabetes        → run prediction on aggregated 7-day data
GET  /api/v1/predict/history/{uid}   → get past predictions
POST /api/v1/dfu/scan                → upload foot image, get DFU classification
GET  /api/v1/recommendations/{uid}   → get lifestyle recommendations based on last prediction
POST /api/v1/insole/reading          → ESP32 posts sensor data (Phase 4)
```

---

## 10. Recommendation Engine — Logic

Based on `risk_category` from Phase 1 output + identified deficit features:

| Risk | Trigger Condition | Recommendations |
|---|---|---|
| Low | risk_score < 0.35 | Maintain current habits, general wellness tips |
| Moderate | 0.35 ≤ risk_score < 0.65 | Targeted: increase activity if below 150 min/week, reduce sugar if diet_score < 5 |
| High | risk_score ≥ 0.65 | Urgent: consult a physician, specific meal plans, daily activity targets, DFU screening prompt |

**Implementation:** Start with rule-based logic. For paper, frame as a "knowledge-base-driven recommendation engine" — acceptable academically and faster to build.

---

## 11. Research Paper Structure

1. **Abstract** — Dual approach: longitudinal behavioral ML + DFU computer vision
2. **Introduction** — Diabetes prevalence, complications (neuropathy, ulcers), gap in current tools
3. **Related Work** — PIMA dataset models, DFU detection literature, wearable sensor systems
4. **Proposed System** — All 4 phases with architecture diagrams
5. **Dataset & Preprocessing** — 100K row dataset, 31 features, encoding strategy, class distribution
6. **Model Evaluation** — Present two models: (a) non-invasive app model, (b) full clinical model. Report AUC-ROC, F1, Precision, Recall, Confusion Matrix
7. **DFU Detection** — Transfer learning approach, Grad-CAM visualization results
8. **Hardware Prototype** — Smart insole design, sensor justification (pressure + temp = DFU risk)
9. **Results & Discussion** — Accuracy, limitations (no real clinical validation), ethical considerations
10. **Conclusion & Future Scope** — Full hardware integration, clinical trial, smartphone-based DFU scan

---

## 12. Critical Decisions & Known Issues

| Issue | Decision |
|---|---|
| Lab values (hba1c, glucose) not collectible in app | Train TWO models: one with all features (report in paper), one with only non-invasive features (deploy in app). Be transparent in paper. |
| DFU model — no dataset/time to train | Use pre-trained weights from DFUC2021 or Hugging Face. Frame as "transfer learning with domain-specific pre-trained weights." |
| Class imbalance (60/40 binary) | Use `class_weight='balanced'` in all sklearn models; `scale_pos_weight` in XGBoost |
| `diabetes_risk_score` column | **Never** include as input feature — it leaks the target. Use only for reference/validation. |
| Hardware timeline | Phase 4 is explicitly future scope. Document sensor logic and data schema in paper regardless of whether hardware is built. |
| Multi-class (diabetes_stage) | Highly imbalanced (Type 1: 122 cases). Use macro-averaged F1. Consider dropping Gestational/Type1 classes or grouping them for the app model. |

---

## 13. File & Folder Structure (Recommended)

```
diabinsight/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app
│   │   ├── routers/
│   │   │   ├── users.py
│   │   │   ├── checkin.py
│   │   │   ├── predict.py
│   │   │   ├── dfu.py
│   │   │   └── insole.py
│   │   ├── models/               # DB models (SQLAlchemy)
│   │   ├── schemas/              # Pydantic schemas
│   │   └── services/
│   │       ├── ml_predictor.py   # XGBoost inference
│   │       ├── dfu_classifier.py # CNN inference + Grad-CAM
│   │       └── recommender.py    # Rule-based recommendations
│   ├── ml/
│   │   ├── train_predictor.py    # Model training script
│   │   ├── evaluate.py
│   │   └── artifacts/
│   │       ├── xgb_model.joblib
│   │       └── preprocessor.joblib
│   └── requirements.txt
├── frontend/
│   ├── pages/
│   │   ├── index.js              # Landing/onboarding
│   │   ├── checkin.js            # Daily questionnaire
│   │   ├── results.js            # Risk score dashboard
│   │   └── dfu-scan.js          # Upload foot image
│   └── components/
├── hardware/
│   ├── esp32_firmware/
│   │   └── insole_sensor.ino
│   └── wiring_diagram.png
├── data/
│   └── diabetes_dataset.csv
└── AGENT_CONTEXT.md              # This file
```

---

## 14. Quick-Start for Any Agent

1. **Read this file completely.** Do not skip sections.
2. **Do not use `diabetes_risk_score` as a training feature.**
3. **Do not use `hba1c` or `glucose_fasting` in the app-facing model** — only in the research/paper model.
4. **Primary target is `diagnosed_diabetes` (binary).** Secondary target is `diabetes_stage` (multi-class, treat separately).
5. **Primary ML model is XGBoost.** Encode all categoricals before training.
6. **DFU model: look for pre-trained weights first.** Do not attempt to train from scratch.
7. **For any new feature or endpoint, check the DB schema in Section 8 and extend it there first.**
8. **Evaluate models using AUC-ROC and F1, not raw accuracy.**

---

*Last updated: Based on DIABINSIGHT_Brief.pdf + diabetes_dataset.csv (100K rows, 31 cols). Maintained by the project owner.*
