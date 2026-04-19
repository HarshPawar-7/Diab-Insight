"""
DIABINSIGHT - Multi-tier Diabetes Diagnostic & Lifestyle Intervention System
FastAPI Application Entry Point

All 4 Phases Implemented:
1. Phase 1: 7-Day Predictive Behavioral Model (XGBoost)
2. Phase 2: Lifestyle & Nutritional Recommendations  
3. Phase 3: Computer Vision DFU Detection (MobileNetV2 / Pre-trained)
4. Phase 4: Smart Foot Insole IoT Integration (Prototype)

Architecture: Monolithic with service layer separation
Database: SQLite (dev) / PostgreSQL (prod)
Frontend: React/Next.js
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from app.database import init_db
from app.routers import router
from app.services import (
    get_prediction_service,
    get_dfu_service,
    get_recommendation_engine
)

# ============================================================
# LOGGING CONFIGURATION
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================
# LIFESPAN EVENTS
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup
    logger.info("🚀 DIABINSIGHT API Starting...")
    
    # Initialize database
    init_db()
    logger.info("✅ Database initialized")
    
    # Load ML models
    logger.info("🧠 Loading ML models...")
    pred_service = get_prediction_service()
    dfu_service = get_dfu_service()
    rec_engine = get_recommendation_engine()
    
    models_status = {
        'diabetes_predictor_app': pred_service.app_model is not None,
        'diabetes_predictor_clinical': pred_service.clinical_model is not None,
        'dfu_detector': dfu_service.model is not None,
        'recommendation_engine': rec_engine is not None
    }
    
    for model_name, loaded in models_status.items():
        status = "✅" if loaded else "⚠️"
        logger.info(f"{status} {model_name}: {'Loaded' if loaded else 'Not Found'}")
    
    logger.info("🎉 DIABINSIGHT API Ready!")
    
    yield
    
    # Shutdown
    logger.info("🛑 DIABINSIGHT API Shutting down...")
    logger.info("✅ Cleanup complete")

# ============================================================
# APPLICATION INITIALIZATION
# ============================================================

app = FastAPI(
    title="DIABINSIGHT API",
    description="""
    Multi-tier diabetes diagnostic and lifestyle intervention system.
    
    **Features:**
    - Phase 1: 7-day behavioral risk prediction
    - Phase 2: Personalized lifestyle recommendations
    - Phase 3: DFU detection via computer vision
    - Phase 4: IoT smart insole integration
    
    **Documentation:**
    - [System Architecture](https://github.com/your-repo/docs/ARCHITECTURE.md)
    - [API Guide](https://github.com/your-repo/docs/API_DOCUMENTATION.md)
    - [Model Training](https://github.com/your-repo/docs/MODEL_TRAINING.md)
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# ============================================================
# CORS MIDDLEWARE
# ============================================================

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite dev
    "http://localhost:8000",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",  # Vite dev (127.0.0.1 variant)
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"✅ CORS enabled for: {', '.join(CORS_ORIGINS)}")

# ============================================================
# INCLUDE ROUTERS
# ============================================================

app.include_router(router)

# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/", tags=["Info"])
async def root():
    """Welcome endpoint"""
    return {
        "message": "Welcome to DIABINSIGHT",
        "version": "1.0.0",
        "status": "Active",
        "documentation": {
            "interactive": "/docs",
            "alternative": "/redoc"
        },
        "endpoints": {
            "health": "/api/v1/health",
            "users": "/api/v1/users",
            "checkin": "/api/v1/checkin",
            "predict": "/api/v1/predict",
            "recommendations": "/api/v1/recommendations",
            "dfu": "/api/v1/dfu",
            "insole": "/api/v1/insole"
        }
    }

# ============================================================
# ERROR HANDLERS
# ============================================================

from fastapi.exception_handlers import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "path": str(request.url),
            "timestamp": __import__('datetime').datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "details": exc.errors(),
            "path": str(request.url)
        }
    )

# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
