# Backend Application Structure

## Directory Layout
```
app/
├── main.py                 # FastAPI application entry point
├── database.py             # SQLAlchemy configuration & session management
├── __init__.py            # Package initialization
│
├── routers/
│   └── __init__.py        # All API endpoints (10 endpoints, 6 routers)
│
├── models/
│   └── __init__.py        # SQLAlchemy ORM models (6 tables)
│
├── schemas/
│   └── __init__.py        # Pydantic request/response validation
│
└── services/
    ├── __init__.py        # Service exports
    ├── ml_predictor.py    # Phase 1: XGBoost diabetes risk prediction
    ├── dfu_classifier.py  # Phase 3: DFU detection with Grad-CAM
    └── recommender.py     # Phase 2: Rule-based recommendations
```

## Architecture Pattern: Clean Separation of Concerns

```
HTTP Request
    ↓
[Router/Endpoint] ← Handles HTTP, validation via Pydantic schemas
    ↓
[Service Layer]   ← Business logic, ML inference, database queries
    ↓
[Database]        ← SQLAlchemy ORM models
    ↓
HTTP Response
```

## Key Components

### 1. main.py (FastAPI Application)
- ✅ FastAPI initialization
- ✅ Lifespan events (startup/shutdown)
- ✅ CORS middleware
- ✅ Error handlers
- ✅ Router registration
- ✅ Interactive API docs at `/docs`

### 2. routers/__init__.py (API Endpoints)
**10 Endpoints across 6 routers:**
- `UserRouter` (2): register, profile
- `CheckinRouter` (2): daily entry, history
- `PredictionRouter` (2): predict, history
- `RecommendationRouter` (1): get recommendations
- `DFURouter` (1): scan for ulcers
- `InsoleRouter` (1): IoT sensor readings
- `HealthRouter` (1): service status

### 3. models/__init__.py (Database)
**6 SQLAlchemy Tables:**
- `User` - Demographics + medical history
- `DailyEntry` - 7-day questionnaire responses
- `Prediction` - Risk scores + timestamps
- `DFUScan` - Image analysis results
- `Recommendation` - Generated interventions
- `InsoleReading` - IoT sensor data

### 4. schemas/__init__.py (Validation)
**Pydantic Models:**
- UserRegisterRequest/Response
- DailyCheckinRequest/Response
- PredictionRequest/Response
- RecommendationsResponse
- DFUScanRequest/Response
- InsoleReadingRequest/Response
- Enums: GenderEnum, SmokingStatusEnum, RiskCategoryEnum

### 5. services/ (Business Logic)

#### ml_predictor.py (Phase 1: Risk Prediction)
- `DiabetesPredictionService`
- Dual models: app (13 features) + clinical (22 features)
- Risk categorization (Low/Moderate/High)
- Feature importance analysis
- Prediction explanations

#### dfu_classifier.py (Phase 3: DFU Detection)
- `DFUDetectionService`
- Pre-trained model support (PyTorch/TensorFlow)
- Image validation & preprocessing
- Grad-CAM localization heatmaps
- Risk-level classification
- Fallback heuristic (red channel detection)

#### recommender.py (Phase 2: Recommendations)
- `RecommendationEngine`
- 8 deficiency types detection
- Priority-based recommendations
- Risk-level-scaled action items
- Motivational messaging
- Rule-based database (transparent, interpretable)

### 6. database.py (Database Configuration)
- SQLAlchemy engine setup
- Support for SQLite (dev) & PostgreSQL (prod)
- Session management (Dependency Injection)
- Connection pooling
- Table initialization

## Development Workflow

### 1. Adding a New Feature
Example: Add weight_kg field to user

**Step 1:** Update database model
```python
# models/__init__.py
class User(Base):
    ...
    weight_kg: float = Column(Float)
```

**Step 2:** Update Pydantic schema
```python
# schemas/__init__.py
class UserRegisterRequest(BaseModel):
    ...
    weight_kg: float = Field(..., ge=30, le=200)
```

**Step 3:** Update API endpoint
```python
# routers/__init__.py
user.weight_kg = request.weight_kg
```

**Step 4:** Database migration (if using Alembic)
```bash
alembic revision --autogenerate -m "Add weight_kg"
alembic upgrade head
```

### 2. Testing an Endpoint
```bash
# Start API
python -m uvicorn app.main:app --reload

# Test via curl
curl -X POST http://localhost:8000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{...}'

# Or use interactive docs
# http://localhost:8000/docs
```

### 3. Debugging
```python
# Enable SQL logging
# In database.py: engine = create_engine(DATABASE_URL, echo=True)

# Test service directly
from app.services import get_prediction_service
service = get_prediction_service()
result = service.predict_app_model({...})
print(result)
```

## File Size Summary
```
routers/__init__.py      ~300 lines (10 endpoints)
models/__init__.py       ~300 lines (6 tables + relationships)
schemas/__init__.py      ~500 lines (10+ validation models)
services/ml_predictor.py ~400 lines (dual XGBoost models)
services/dfu_classifier  ~450 lines (pre-trained CNN + Grad-CAM)
services/recommender.py  ~500 lines (rule-based engine)
main.py                  ~200 lines (FastAPI initialization)
database.py              ~80 lines (SQLAlchemy setup)
─────────────────────────────────────────────────────
TOTAL                    ~2,730 lines
```

## Critical Design Rules

✅ **DO:**
- Separate HTTP handlers (routers) from business logic (services)
- Validate all inputs with Pydantic schemas
- Use SQLAlchemy ORM for database access
- Keep services stateless and testable
- Use dependency injection for database sessions

❌ **DON'T:**
- Import routers from services (one-way dependency)
- Mix HTTP logic with business logic
- Use raw SQL queries (use SQLAlchemy)
- Hard-code configuration values
- Ignore Pydantic validation

## Dependencies

### FastAPI Stack
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pydantic` - Data validation
- `python-multipart` - File uploads

### Database
- `sqlalchemy` - ORM
- `alembic` - Migrations

### ML Models
- `xgboost` - Decision trees
- `scikit-learn` - Preprocessing
- `torch`/`tensorflow` - Neural networks
- `pillow` - Image processing

## Startup Sequence

```
1. uvicorn starts app.main:app
2. FastAPI lifespan startup
   ├── init_db() creates tables
   ├── get_prediction_service() loads XGBoost models
   ├── get_dfu_service() loads DFU detector
   └── get_recommendation_engine() initializes rule DB
3. CORS middleware enabled
4. Routers registered
5. API ready at http://localhost:8000
```

## Environment Variables

```bash
# Required
DATABASE_URL=sqlite:///./app/data/diabinsight.db
# OR
DATABASE_URL=postgresql://user:pass@localhost:5432/diabinsight

# Optional
LOG_LEVEL=INFO
ML_ARTIFACTS_DIR=./ml/artifacts
ENVIRONMENT=development  # or 'production'
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## Next Steps

1. ✅ Services implemented
2. ✅ API routers created
3. ✅ Database models defined
4. 🔄 Train ML models (`python ml/train_model_optimized.py`)
5. 🔄 Set up PostgreSQL database
6. 🔄 Add JWT authentication
7. 🔄 Frontend integration

---
**Last Updated:** April 2024
