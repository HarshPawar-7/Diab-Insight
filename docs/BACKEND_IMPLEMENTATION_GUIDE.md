# 🚀 DIABINSIGHT - Backend Implementation Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
# Copy example config
cp .env.example .env

# Edit .env as needed (optional for local development)
# DATABASE_URL, CORS_ORIGINS, LOG_LEVEL, etc.
```

### 3. Train Models (First Time Only)
```bash
# Phase 1: XGBoost diabetes risk predictor
python ml/train_model_optimized.py
# Output: ml/artifacts/xgb_model_app.joblib, xgb_model_clinical.joblib

# Phase 3: DFU detection (uses pre-trained MobileNetV2)
python ml/train_dfu_model_optimized.py
# Output: ml/artifacts/dfu_model_best.pth
```

### 4. Run API Server
```bash
# Development (with auto-reload)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# OR using the entry point
python app/main.py

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 5. Test API
```bash
# Health check
curl http://localhost:8000/api/v1/health

# Interactive API docs
# Open browser: http://localhost:8000/docs
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                           │
│              Vite Dev Server (http://localhost:3000)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTP REST API
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    FASTAPI BACKEND                               │
│              (http://localhost:8000)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   API ROUTERS                             │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  /api/v1/users/*           → User registration           │   │
│  │  /api/v1/checkin/*         → Daily questionnaire         │   │
│  │  /api/v1/predict/*         → Risk prediction (Phase 1)   │   │
│  │  /api/v1/recommendations/* → Recommendations (Phase 2)   │   │
│  │  /api/v1/dfu/*             → DFU detection (Phase 3)     │   │
│  │  /api/v1/insole/*          → IoT sensors (Phase 4)       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│         ┌────────────────────┼────────────────────┐             │
│         │                    │                    │             │
│  ┌──────▼───────┐    ┌──────▼───────┐    ┌──────▼──────────┐   │
│  │   SERVICES   │    │   DATABASE   │    │  ML MODELS     │   │
│  ├──────────────┤    ├──────────────┤    ├────────────────┤   │
│  │ - Predictor  │    │ - SQLAlchemy │    │ - XGBoost App  │   │
│  │ - DFU Detect │    │ - User       │    │ - XGBoost Clin │   │
│  │ - Recommender│    │ - DailyEntry │    │ - DFU Model    │   │
│  │              │    │ - Prediction │    │                │   │
│  │              │    │ - DFUScan    │    │                │   │
│  │              │    │ - Insole     │    │                │   │
│  └──────────────┘    └──────────────┘    └────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │
              ┌────────────┴────────────┐
              │                         │
    ┌─────────▼──────────┐   ┌─────────▼──────────┐
    │    SQLite (Dev)    │   │ PostgreSQL (Prod) │
    │  diabinsight.db    │   │  (Cloud Hosted)   │
    └────────────────────┘   └───────────────────┘
```

---

## API Endpoints (Complete Reference)

### Health & Status

```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "DIABINSIGHT - Multi-tier Diabetes Diagnostic System",
  "models_loaded": {
    "diabetes_predictor_app": true,
    "diabetes_predictor_clinical": true,
    "dfu_detector": true
  },
  "database_connected": true,
  "timestamp": "2024-04-15T10:30:00Z"
}
```

---

### Phase 1: User Registration

```http
POST /api/v1/users/register
Content-Type: application/json

{
  "age": 45,
  "gender": "male",
  "ethnicity": "Asian",
  "education_level": "Graduate",
  "income_level": "50000-75000",
  "employment_status": "Employed",
  "smoking_status": "Never",
  "alcohol_consumption_per_week": 1.5,
  "family_history_diabetes": true,
  "hypertension_history": false,
  "cardiovascular_history": false,
  "bmi": 28.5,
  "waist_to_hip_ratio": 0.95
}
```

**Response:**
```json
{
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "created_at": "2024-04-15T10:30:00Z",
  "message": "User registered successfully"
}
```

---

### Phase 1: Daily Check-in

```http
POST /api/v1/checkin/daily
Content-Type: application/json

{
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "diet_score": 7,
  "physical_activity_minutes": 45,
  "sleep_hours": 7.5,
  "screen_time_hours": 6.0,
  "hydration_glasses": 8,
  "stress_level": 3
}
```

**Response:**
```json
{
  "entry_id": "entry_12345",
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "entry_date": "2024-04-15T10:30:00Z",
  "message": "Daily entry recorded"
}
```

---

### Phase 1: Get Prediction

```http
POST /api/v1/predict/diabetes
Content-Type: application/json

{
  "user_id": "user_550e8400e29b41d4a716446655440000"
}
```

**Requirements:**
- User must have completed 7 daily entries

**Response:**
```json
{
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "risk_score": 0.62,
  "risk_category": "Moderate",
  "confidence": 0.92,
  "predicted_at": "2024-04-15T10:30:00Z",
  "model_version": "app_v1.0",
  "recommendations_prompt": "Get personalized recommendations based on your risk profile"
}
```

---

### Phase 2: Get Recommendations

```http
GET /api/v1/recommendations/{user_id}
```

**Response:**
```json
{
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "risk_category": "Moderate",
  "risk_score": 0.62,
  "recommendations": [
    {
      "category": "Exercise",
      "priority": "Moderate",
      "title": "Increase to 150 min/week moderate exercise",
      "description": "Physical inactivity is a major risk factor...",
      "action_items": [
        "Brisk walking 30 minutes daily",
        "Join a fitness class",
        "Add strength training 2x/week",
        "Use fitness tracker to monitor progress"
      ]
    },
    {
      "category": "Diet",
      "priority": "High",
      "title": "Reduce simple carbs and sugar",
      "action_items": [...]
    }
  ],
  "deficiencies": ["low_activity", "poor_diet"],
  "strengths": ["Good sleep quality", "Non-smoker"],
  "priority_focus": "Increase Physical Activity",
  "generated_at": "2024-04-15T10:30:00Z"
}
```

---

### Phase 3: DFU Detection (Image Upload)

```http
POST /api/v1/dfu/scan?user_id=USER_ID
Content-Type: multipart/form-data

file: <binary JPEG/PNG image of foot sole>
```

**Response:**
```json
{
  "scan_id": "scan_12345",
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "dfu_detected": false,
  "prediction_label": "healthy",
  "confidence": 0.98,
  "affected_area": null,
  "scanned_at": "2024-04-15T10:30:00Z",
  "model_version": "v1.0",
  "next_steps": ["Continue regular foot care", "Monitor for any changes"]
}
```

---

### Phase 4: IoT Insole Reading

```http
POST /api/v1/insole/reading
Content-Type: application/json

{
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "device_id": "insole_esp32_001",
  "pressure_heel": 85,
  "pressure_metatarsal": 120,
  "pressure_toe": 60,
  "temp_celsius": 31.5,
  "moisture_level": 45
}
```

**Response:**
```json
{
  "reading_id": "reading_12345",
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "received_at": "2024-04-15T10:30:00Z",
  "status": "received",
  "risk_assessment": {
    "temperature": 31.5,
    "pressure_toe": 60,
    "risk_indicator": "Low"
  }
}
```

---

## File Structure Breakdown

### Core Application Files

```
backend/
├── app/
│   ├── main.py                 # 200 lines | FastAPI initialization, lifespan
│   ├── database.py             # 80 lines  | SQLAlchemy setup, session management
│   ├── __init__.py             # 15 lines  | Module exports
│   │
│   ├── routers/
│   │   └── __init__.py         # 300 lines | All API endpoints
│   │
│   ├── models/
│   │   └── __init__.py         # 300 lines | SQLAlchemy ORM models
│   │
│   ├── schemas/
│   │   └── __init__.py         # 500 lines | Pydantic request/response models
│   │
│   └── services/
│       ├── __init__.py         # 20 lines | Module exports
│       ├── ml_predictor.py     # 400 lines | Phase 1: XGBoost (app + clinical)
│       ├── dfu_classifier.py   # 450 lines | Phase 3: DFU detection + Grad-CAM
│       └── recommender.py      # 500 lines | Phase 2: Rule-based recommendations
│
├── ml/
│   ├── train_model_optimized.py    # 300 lines | XGBoost training (GridSearchCV)
│   ├── train_dfu_model_optimized.py # 250 lines | Transfer learning (MobileNetV2)
│   └── artifacts/                  # Model files (.joblib, .pth, .pkl)
│
└── requirements.txt            # Python dependencies
```

### Total LOC
- **Application Logic**: ~1500 lines (routers, models, schemas, services, database)
- **ML Training**: ~550 lines
- **Total Backend**: ~2050 lines

---

## Development Workflow

### Adding a New Feature (Example: Add Weight Field)

1. **Update Database Model** (`app/models/__init__.py`)
   ```python
   class User(Base):
       # ...
       weight_kg: float = Column(Float)
   ```

2. **Update Pydantic Schema** (`app/schemas/__init__.py`)
   ```python
   class UserRegisterRequest(BaseModel):
       # ...
       weight_kg: float = Field(..., ge=30, le=200)
   ```

3. **Update API Endpoint** (`app/routers/__init__.py`)
   ```python
   user.weight_kg = request.weight_kg
   ```

4. **Migrate Database** (if using Alembic)
   ```bash
   alembic revision --autogenerate -m "Add weight field"
   alembic upgrade head
   ```

---

## Testing

### Unit Tests
```bash
pytest tests/test_prediction.py -v
pytest tests/test_dfu.py -v
pytest tests/test_recommendations.py -v
```

### Integration Tests (API)
```bash
# Start server in one terminal
python -m uvicorn app.main:app --reload

# Run tests in another
python -m pytest tests/test_api_endpoints.py -v
```

### Load Testing
```bash
# Install
pip install locust

# Run
locust -f tests/load_test.py --host=http://localhost:8000
```

---

## Debugging

### Enable SQL Logging
```python
# In app/database.py
engine = create_engine(DATABASE_URL, echo=True)
```

### Check Model Predictions
```bash
python
>>> from app.services import get_prediction_service
>>> service = get_prediction_service()
>>> result = service.predict_app_model({...})
>>> print(result)
```

### Check DFU Model
```bash
python
>>> from app.services import get_dfu_service
>>> service = get_dfu_service()
>>> result = service.detect(image)
>>> print(result)
```

---

## Deployment

### Docker
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t diabinsight-backend .
docker run -p 8000:8000 -e DATABASE_URL=postgresql://... diabinsight-backend
```

### Heroku / AWS / GCP / Azure
Use standard Python WSGI/ASGI deployment (uvicorn is ASGI-compatible).

---

## Common Issues

### Issue: `ModuleNotFoundError: No module named 'app'`
**Solution:** Ensure you're running from `backend/` directory:
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Issue: `FileNotFoundError: [Errno 2] No such file or directory: 'ml/artifacts/xgb_model_app.joblib'`
**Solution:** Train models first:
```bash
python ml/train_model_optimized.py
```

### Issue: `Database is locked` (SQLite)
**Solution:** SQLite is single-writer. For production, use PostgreSQL:
```bash
pip install psycopg2-binary
export DATABASE_URL=postgresql://user:pass@localhost/diabinsight
```

---

## Performance Optimization

### Caching Predictions
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def predict(risk_score):
    # Cached predictions
```

### Database Indexing
```python
# Already implemented in models/__init__.py
create_indexes(engine)
```

### Model Quantization
```bash
# For production: Convert XGBoost to ONNX for faster inference
pip install onnx onnxruntime
# Then use ONNX runtime instead of joblib
```

---

## Next Steps

1. ✅ **Backend API** — COMPLETE
2. 🔄 **Frontend Integration** — Connect React to API endpoints
3. 🔄 **Database Setup** — Deploy PostgreSQL (cloud or local)
4. 🔄 **Authentication** — Add JWT tokens for security
5. 🔄 **Monitoring** — Set up Prometheus + Grafana
6. 🔄 **CI/CD** — GitHub Actions for automated testing/deployment

---

**Version**: 1.0.0  
**Last Updated**: April 2024
