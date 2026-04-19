# 🚀 IMPLEMENTATION ROADMAP - DIABINSIGHT

**Status:** ML Model Training IN PROGRESS 🔄  
**Next Steps:** Testing → Frontend → DFU → Recommendations

---

## Phase 1: ML Model Training 🔄 IN PROGRESS

```
Current: GridSearchCV running (480 fits)
└─ Estimated time: 20-30 minutes
└─ Output: xgb_model_app.joblib, xgb_model_clinical.joblib
```

**Progress:**
- ✅ Dataset loaded (100,000 samples)
- ✅ Features selected (12 core + 4 derived = 16 total)
- 🔄 GridSearchCV in progress
- ⏳ Model serialization
- ⏳ Evaluation metrics

**Expected Outputs:**
```
backend/ml/artifacts/
├── xgb_model_app.joblib          # Non-invasive model (13 features)
├── xgb_model_clinical.joblib     # Clinical model (22 features)
├── preprocessor_app.joblib       # Feature scaling/encoding
├── feature_names_app.txt         # Column names for app
└── model_metrics.json            # AUC, F1, Precision, Recall
```

---

## Phase 2: API Testing ⏳ READY AFTER TRAINING

Once models are trained, test all 10 endpoints:

```bash
# 1. Start API
cd backend
python -m uvicorn app.main:app --reload --port 8000

# 2. Open in browser
http://localhost:8000/docs

# 3. Test endpoints
GET  /api/v1/health                    # Service status
POST /api/v1/users/register            # Create user
POST /api/v1/checkin/daily            # Daily entry
GET  /api/v1/checkin/history/{uid}    # 7-day history
POST /api/v1/predict/diabetes         # Risk prediction
GET  /api/v1/predict/history/{uid}    # Past predictions
GET  /api/v1/recommendations/{uid}    # Recommendations (Phase 2)
POST /api/v1/dfu/scan                 # DFU detection (Phase 3)
POST /api/v1/insole/reading           # IoT data (Phase 4)
```

**Key Test Sequence:**
1. Register user → Get user_id
2. Submit 7 daily entries
3. Request prediction (automatically aggregates 7 days)
4. Get recommendations
5. Upload foot image (Phase 3)
6. Submit IoT sensor data (Phase 4)

---

## Phase 3: Frontend Setup ⏳ PARALLEL TASK

While API is testing, start frontend:

```bash
cd frontend
npm install
npm run dev
# Visit: http://localhost:5173
```

**Components to Create:**
1. **Landing Page** → User registration form
2. **Checkin Page** → Daily questionnaire (7 pages)
3. **Results Page** → Risk score dashboard
4. **Recommendations Page** → Lifestyle suggestions
5. **DFU Scan Page** → Image upload (Phase 3)
6. **IoT Dashboard** → Sensor visualization (Phase 4)

**API Integration Points:**
- Register endpoint → Store user_id in localStorage
- Daily checkin → POST to /checkin/daily with entries
- Prediction → POST to /predict/diabetes after 7 days
- Recommendations → GET from /recommendations/{user_id}

---

## Phase 2 Implementation: Recommendation Engine 🔴 NEXT

After API testing, implement recommendations service:

### Current Status:
The `backend/app/services/recommender.py` service is already created with:
- ✅ Rule-based logic (8 deficiency types)
- ✅ Priority scaling
- ✅ Risk-level personalization
- ✅ Endpoint integration

### What Remains:
- [ ] Test recommendations engine with actual risk scores
- [ ] Refine rule weights based on medical literature
- [ ] Add motivational messaging variations
- [ ] Connect to database for tracking recommendations

### Deficiency Types (8):
```python
1. Low physical activity       (< 150 min/week)
2. Poor diet quality          (diet_score < 5)
3. Insufficient sleep         (< 7 hours/day)
4. High screen time           (> 6 hours/day)
5. High alcohol consumption   (> 14 units/week)
6. Smoking status             (current smoker)
7. High BMI                   (> 30)
8. Family history of diabetes (positive)
```

### Recommendation Categories:
- **Exercise:** Personalized activity targets
- **Nutrition:** Dietary changes by risk level
- **Sleep:** Habit formation strategies
- **Screening:** DFU and lab test prompts
- **Monitoring:** Frequency of check-ins

---

## Phase 3 Implementation: DFU Detection 🟠 NEXT

After recommendations, implement foot ulcer detection:

### Option A: Pre-trained Model (RECOMMENDED)
1. **Source:** HuggingFace or DFUC2021 Challenge
2. **Integration:** Load weights in dfu_classifier.py
3. **Pipeline:**
   - User uploads plantar image
   - Resize to 224×224
   - Normalize with ImageNet stats
   - Forward pass through CNN
   - Grad-CAM overlay

### Option B: Transfer Learning (If no pre-trained)
1. **Base Model:** MobileNetV2 or EfficientNet
2. **Dataset:** Wound/DFU images from public sources
3. **Fine-tuning:** Custom head for classification
4. **Data Augmentation:** Flip, rotate, zoom

### Integration Checklist:
- [ ] Source pre-trained model weights
- [ ] Implement image preprocessing
- [ ] Add Grad-CAM heatmap generation
- [ ] Create test images for validation
- [ ] Add to API endpoint `/api/v1/dfu/scan`
- [ ] Display results in frontend

### Expected Output:
```json
{
  "prediction": "healthy|early_dfu|advanced_dfu",
  "confidence": 0.92,
  "affected_region": {
    "x": 120,
    "y": 180,
    "width": 100,
    "height": 120,
    "severity": "moderate"
  },
  "gradcam_image_url": "s3://bucket/gradcam_overlay.png",
  "recommendation": "Consult physician for clinical evaluation"
}
```

---

## Phase 4: Hardware Prototype 🔵 FUTURE SCOPE

Smart insole with ESP32 + sensors:

### Components:
- **Microcontroller:** ESP32 (WiFi enabled)
- **Pressure Sensors:** 4x FSR402 (heel, metatarsal, toe)
- **Temperature:** MLX90614 IR sensor
- **Moisture:** Grove GSR sensor
- **Power:** 3000mAh LiPo battery

### Data Flow:
```
ESP32 → WiFi → HTTPS → FastAPI Backend → Database
```

### Data Schema:
```json
{
  "user_id": "uuid",
  "timestamp": "2024-04-19T10:30:00Z",
  "pressure_heel": 250.5,
  "pressure_metatarsal": 180.2,
  "pressure_toe": 120.8,
  "temp_celsius": 32.5,
  "moisture_level": 45.2,
  "risk_indicator": "normal|warning|alert"
}
```

### Implementation:
1. Design firmware (Arduino IDE or Micropython)
2. Sensor calibration protocol
3. Data transmission mechanism
4. Backend ingestion (already in API)
5. Frontend visualization

---

## Critical Path (Next 48 Hours)

```
NOW          ML Training (GridSearchCV 480 fits)
   |         ↓
+15 min      Models Complete
   |         ↓
+20 min      Test API Endpoints  ← Key validation point
   |         ↓
+30 min      Frontend Setup      ← Parallel with API testing
   |         ↓
+60 min      User Flow Testing   ← Register → 7-day → Predict
   |         ↓
+90 min      Recommendations     ← Connect to prediction results
   |         ↓
+120 min     DFU Detection       ← Image upload working
   |         ↓
+180 min     Full System Test    ← All 4 phases working together
```

---

## Checklist: What's Done vs. What's Next

### ✅ COMPLETE (2,500+ lines)
- Backend API (FastAPI) with 10 endpoints
- Database models (6 SQLAlchemy tables)
- Service layer (3 services: Predictor, DFU, Recommender)
- Pydantic validation schemas
- CORS middleware, error handling
- Documentation (12+ files, 3,500+ lines)

### 🔄 IN PROGRESS (Now)
- ML Model Training (Phase 1)

### ⏳ NEXT (Priority Order)
1. API Testing (Phase 0 - Validation)
2. Frontend Components (All phases)
3. Recommendations Engine (Phase 2 - Logic)
4. DFU Detection Integration (Phase 3 - Vision)
5. Hardware Firmware (Phase 4 - Future scope)
6. Security & Auth (JWT tokens)
7. Production Database (PostgreSQL)
8. Cloud Deployment (AWS/GCP/Azure)

---

## File Locations Reference

| Component | Path | Status |
|-----------|------|--------|
| **Backend API** | `backend/app/main.py` | ✅ |
| **ML Predictor** | `backend/app/services/ml_predictor.py` | ✅ |
| **DFU Classifier** | `backend/app/services/dfu_classifier.py` | ✅ |
| **Recommender** | `backend/app/services/recommender.py` | ✅ |
| **API Routes** | `backend/app/routers/__init__.py` | ✅ |
| **DB Models** | `backend/app/models/__init__.py` | ✅ |
| **Schemas** | `backend/app/schemas/__init__.py` | ✅ |
| **Training Script** | `backend/ml/train_model_optimized.py` | 🔄 |
| **DFU Training** | `backend/ml/train_dfu_model_optimized.py` | ⏳ |
| **Frontend** | `frontend/src/` | ⏳ |
| **Docs** | `docs/` | ✅ (12 files) |

---

## Success Metrics

### Phase 1 ✅ (Training)
- [ ] AUC-ROC > 0.82 on app model
- [ ] AUC-ROC > 0.95 on clinical model
- [ ] Models saved to artifacts/
- [ ] Feature importance computed

### Phase 2 🔄 (API)
- [ ] All 10 endpoints return 200 OK
- [ ] Request validation working
- [ ] Response schemas correct
- [ ] Error handling functional

### Phase 3 ⏳ (Frontend)
- [ ] User registration form
- [ ] 7-day questionnaire
- [ ] Results dashboard
- [ ] Recommendations display

### Phase 2 ⏳ (Recommendations)
- [ ] Deficiency detection working
- [ ] Rules firing correctly
- [ ] Priority scaling applied
- [ ] Database storing results

### Phase 3 ⏳ (DFU Detection)
- [ ] Model loading
- [ ] Image preprocessing
- [ ] Prediction accuracy
- [ ] Grad-CAM visualization

---

## Command Reference

```bash
# Training
cd backend && python ml/train_model_optimized.py

# Start API
python -m uvicorn app.main:app --reload --port 8000

# Start Frontend
cd frontend && npm install && npm run dev

# Test API
curl http://localhost:8000/api/v1/health

# Check logs
tail -f <logfile>
```

---

**Next Status Check:** In 20-30 minutes when ML training completes  
**Target:** Full system functional end-to-end within 4 hours

