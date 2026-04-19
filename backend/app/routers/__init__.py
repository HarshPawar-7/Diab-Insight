"""
API Routers - All endpoints organized by functionality
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import io
from PIL import Image

from app.database import get_db
from app.services import get_prediction_service, get_dfu_service, get_recommendation_engine
from app.schemas import (
    UserRegisterRequest, UserRegisterResponse, UserProfileResponse,
    UserLoginRequest, UserLoginResponse,
    DailyCheckinRequest, DailyCheckinResponse, CheckinHistoryResponse,
    PredictionRequest, PredictionResponse, PredictionHistoryResponse,
    RecommendationsResponse, DFUScanRequest, DFUScanResponse,
    InsoleReadingRequest, InsoleReadingResponse, HealthCheckResponse
)
from app.utils import hash_password, verify_password
from app.models import User, DailyEntry, Prediction, DFUScan, Recommendation, InsoleReading

# Initialize router
router = APIRouter(prefix="/api/v1", tags=["DIABINSIGHT API v1"])

# ============================================================
# HEALTH & STATUS ENDPOINTS
# ============================================================

@router.get("/health", response_model=HealthCheckResponse)
async def health_check(db: Session = Depends(get_db)):
    """Service health check"""
    # Check database connection
    try:
        db.execute("SELECT 1")
        db_connected = True
    except:
        db_connected = False
    
    # Check models
    pred_service = get_prediction_service()
    dfu_service = get_dfu_service()
    
    return HealthCheckResponse(
        status="ok",
        service="DIABINSIGHT - Multi-tier Diabetes Diagnostic System",
        models_loaded={
            "diabetes_predictor_app": pred_service.app_model is not None,
            "diabetes_predictor_clinical": pred_service.clinical_model is not None,
            "dfu_detector": dfu_service.model is not None
        },
        database_connected=db_connected,
        timestamp=datetime.utcnow()
    )

# ============================================================
# USER ENDPOINTS
# ============================================================

users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.post("/register", response_model=UserRegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    request: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register new user with email, password, and demographic data"""
    try:
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Create user with hashed password
        user = User(
            email=request.email,
            password_hash=hash_password(request.password),
            name=request.name,
            age=request.age,
            gender=request.gender.value,
            ethnicity=request.ethnicity,
            education_level=request.education_level,
            income_level=request.income_level,
            employment_status=request.employment_status,
            smoking_status=request.smoking_status.value,
            alcohol_consumption_per_week=request.alcohol_consumption_per_week,
            family_history_diabetes=request.family_history_diabetes,
            hypertension_history=request.hypertension_history,
            cardiovascular_history=request.cardiovascular_history,
            bmi=request.bmi
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return UserRegisterResponse(
            user_id=user.id,
            email=user.email,
            name=user.name,
            created_at=user.created_at,
            message="User registered successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )

@users_router.post("/login", response_model=UserLoginResponse)
async def login_user(
    request: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    try:
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        return UserLoginResponse(
            user_id=user.id,
            email=user.email,
            name=user.name,
            message="Login successful"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Login failed: {str(e)}"
        )

@users_router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get user profile"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserProfileResponse(
        user_id=user.id,
        age=user.age,
        gender=user.gender,
        bmi=user.bmi,
        family_history_diabetes=user.family_history_diabetes
    )

# ============================================================
# DAILY CHECK-IN ENDPOINTS (7-day questionnaire)
# ============================================================

checkin_router = APIRouter(prefix="/checkin", tags=["Daily Check-in"])

@checkin_router.post("/daily", response_model=DailyCheckinResponse)
async def submit_daily_checkin(
    request: DailyCheckinRequest,
    db: Session = Depends(get_db)
):
    """Submit daily questionnaire entry - one per 24 hours only"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get the most recent entry for this user
        last_entry = db.query(DailyEntry).filter(
            DailyEntry.user_id == request.user_id
        ).order_by(DailyEntry.entry_date.desc()).first()
        
        # If there's a recent entry, check if 24 hours have passed
        if last_entry:
            time_since_last = datetime.utcnow() - last_entry.entry_date
            if time_since_last < timedelta(hours=24):
                hours_remaining = 24 - int(time_since_last.total_seconds() / 3600)
                next_time = last_entry.entry_date + timedelta(hours=24)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"You can submit your next assessment in {hours_remaining} hours (at {next_time.strftime('%H:%M')})"
                )
        
        # Store preferred checkin time on first submission
        if request.preferred_checkin_time and not user.preferred_checkin_time:
            user.preferred_checkin_time = request.preferred_checkin_time
            db.add(user)
            db.commit()
        
        # Create entry
        entry = DailyEntry(
            user_id=request.user_id,
            entry_date=datetime.utcnow(),
            diet_score=request.diet_score,
            physical_activity_minutes=request.physical_activity_minutes,
            sleep_hours=request.sleep_hours,
            screen_time_hours=request.screen_time_hours,
            hydration_glasses=request.hydration_glasses,
            stress_level=request.stress_level
        )
        
        db.add(entry)
        db.commit()
        db.refresh(entry)
        
        return DailyCheckinResponse(
            entry_id=entry.id,
            user_id=entry.user_id,
            entry_date=entry.entry_date.isoformat(),
            message="Daily entry recorded"
        )
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{type(e).__name__}: {str(e)}"
        )

@checkin_router.get("/history/{user_id}", response_model=CheckinHistoryResponse)
async def get_checkin_history(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get user's 7-day check-in history and daily lock status"""
    # Get user to get preferred time
    user = db.query(User).filter(User.id == user_id).first()
    
    # Get last 7 days of entries
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    entries = db.query(DailyEntry).filter(
        DailyEntry.user_id == user_id,
        DailyEntry.entry_date >= seven_days_ago
    ).order_by(DailyEntry.entry_date.desc()).all()
    
    # Check if already completed in the last 24 hours
    already_completed_today = False
    next_available_time = None
    
    if entries:  # If they have at least one entry
        last_entry_time = entries[0].entry_date
        time_until_next = last_entry_time + timedelta(hours=24)
        already_completed_today = datetime.utcnow() < time_until_next
        
        if already_completed_today:
            next_available_time = time_until_next.strftime("%Y-%m-%d %H:%M")
    
    entries_data = [
        {
            'date': entry.entry_date.isoformat(),
            'diet_score': entry.diet_score,
            'activity_minutes': entry.physical_activity_minutes,
            'sleep_hours': entry.sleep_hours,
            'screen_time': entry.screen_time_hours
        }
        for entry in entries
    ]
    
    return CheckinHistoryResponse(
        user_id=user_id,
        entries=entries_data,
        days_completed=len(entries),
        ready_for_prediction=len(entries) >= 7,
        preferred_checkin_time=user.preferred_checkin_time if user else None,
        already_completed_today=already_completed_today
    )

# ============================================================
# PREDICTION ENDPOINTS (Phase 1)
# ============================================================

predict_router = APIRouter(prefix="/predict", tags=["Phase 1 - Risk Prediction"])

@predict_router.post("/diabetes", response_model=PredictionResponse)
async def predict_diabetes_risk(
    request: PredictionRequest,
    db: Session = Depends(get_db)
):
    """Predict diabetes risk based on 7-day aggregated data"""
    try:
        # Get user
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get last 7 days of entries
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        entries = db.query(DailyEntry).filter(
            DailyEntry.user_id == request.user_id,
            DailyEntry.entry_date >= seven_days_ago
        ).all()
        
        if len(entries) < 7:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient data: {len(entries)}/7 days completed"
            )
        
        # Aggregate 7-day data
        avg_diet = sum(e.diet_score for e in entries) / len(entries)
        avg_activity = sum(e.physical_activity_minutes for e in entries) / len(entries)
        avg_sleep = sum(e.sleep_hours for e in entries) / len(entries)
        avg_screen = sum(e.screen_time_hours for e in entries) / len(entries)
        
        features = {
            'age': user.age,
            'gender': user.gender,
            'bmi': user.bmi,
            'family_history_diabetes': user.family_history_diabetes,
            'hypertension_history': user.hypertension_history,
            'cardiovascular_history': user.cardiovascular_history,
            'smoking_status': user.smoking_status,
            'alcohol_consumption_per_week': user.alcohol_consumption_per_week,
            'physical_activity_minutes_per_week': int(avg_activity * 7),
            'diet_score': avg_diet,
            'sleep_hours_per_day': avg_sleep,
            'screen_time_hours_per_day': avg_screen
        }
        
        # Get prediction from app model (non-invasive)
        pred_service = get_prediction_service()
        result = pred_service.predict_app_model(features)
        
        if 'error' in result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result['error']
            )
        
        # Save prediction to database
        prediction = Prediction(
            user_id=request.user_id,
            risk_score=result['risk_score'],
            risk_category=result['risk_category'],
            confidence=result['confidence'],
            model_version=result['model_version'],
            model_type=result['model_type'],
            feature_snapshot=features
        )
        
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
        
        return PredictionResponse(
            user_id=prediction.user_id,
            risk_score=prediction.risk_score,
            risk_category=prediction.risk_category,
            confidence=prediction.confidence,
            predicted_at=prediction.created_at,
            model_version=prediction.model_version,
            recommendations_prompt="Get personalized recommendations based on your risk profile"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@predict_router.get("/history/{user_id}", response_model=PredictionHistoryResponse)
async def get_prediction_history(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get user's prediction history"""
    predictions = db.query(Prediction).filter(
        Prediction.user_id == user_id
    ).order_by(Prediction.created_at.desc()).all()
    
    pred_responses = [
        PredictionResponse(
            user_id=p.user_id,
            risk_score=p.risk_score,
            risk_category=p.risk_category,
            confidence=p.confidence,
            predicted_at=p.created_at,
            model_version=p.model_version,
            recommendations_prompt=""
        )
        for p in predictions
    ]
    
    # Determine trend
    trend = None
    if len(predictions) >= 2:
        recent = predictions[0].risk_score
        previous = predictions[1].risk_score
        if recent < previous:
            trend = "improving"
        elif recent > previous:
            trend = "worsening"
        else:
            trend = "stable"
    
    return PredictionHistoryResponse(
        user_id=user_id,
        predictions=pred_responses,
        trend=trend
    )

# ============================================================
# RECOMMENDATIONS ENDPOINT (Phase 2)
# ============================================================

recommendations_router = APIRouter(prefix="/recommendations", tags=["Phase 2 - Recommendations"])

@recommendations_router.get("/{user_id}", response_model=RecommendationsResponse)
async def get_recommendations(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get personalized recommendations"""
    # Get most recent prediction
    prediction = db.query(Prediction).filter(
        Prediction.user_id == user_id
    ).order_by(Prediction.created_at.desc()).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No prediction found for this user"
        )
    
    # Get recommendation engine
    rec_engine = get_recommendation_engine()
    
    # Generate recommendations
    rec_result = rec_engine.generate_recommendations(
        risk_score=prediction.risk_score,
        features=prediction.feature_snapshot
    )
    
    return RecommendationsResponse(
        user_id=user_id,
        risk_category=rec_result['risk_category'],
        risk_score=rec_result['risk_score'],
        recommendations=rec_result['recommendations'],
        deficiencies=rec_result['deficiencies'],
        strengths=rec_result['strengths'],
        priority_focus=rec_result['priority_focus'],
        generated_at=datetime.utcnow()
    )

# ============================================================
# DFU DETECTION ENDPOINT (Phase 3)
# ============================================================

dfu_router = APIRouter(prefix="/dfu", tags=["Phase 3 - DFU Detection"])

@dfu_router.post("/scan", response_model=DFUScanResponse)
async def scan_for_dfu(
    user_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload foot image for DFU detection"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate file
        if file.size > 10 * 1024 * 1024:  # 10 MB
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 10MB limit"
            )
        
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Get DFU detection service
        dfu_service = get_dfu_service()
        result = dfu_service.detect(image)
        
        # Save scan to database
        scan = DFUScan(
            user_id=user_id,
            image_path=f"scans/{user_id}/{datetime.utcnow().isoformat()}_{file.filename}",
            prediction_label=result['prediction_label'],
            confidence=result['confidence'],
            dfu_detected=result['dfu_detected'],
            affected_area=result.get('affected_area'),
            model_version='v1.0',
            model_name='DFUC2021-pretrained'
        )
        
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        return DFUScanResponse(
            scan_id=scan.id,
            user_id=scan.user_id,
            dfu_detected=scan.dfu_detected,
            prediction_label=scan.prediction_label,
            confidence=scan.confidence,
            affected_area=scan.affected_area,
            scanned_at=scan.created_at,
            model_version=scan.model_version,
            next_steps=result.get('next_steps', [])
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ============================================================
# IOT/INSOLE ENDPOINT (Phase 4)
# ============================================================

insole_router = APIRouter(prefix="/insole", tags=["Phase 4 - IoT Sensors"])

@insole_router.post("/reading", response_model=InsoleReadingResponse)
async def submit_insole_reading(
    request: InsoleReadingRequest,
    db: Session = Depends(get_db)
):
    """Submit smart insole sensor reading"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create reading
        reading = InsoleReading(
            user_id=request.user_id,
            device_id=request.device_id,
            recorded_at=datetime.utcnow(),
            pressure_heel=request.pressure_heel,
            pressure_metatarsal=request.pressure_metatarsal,
            pressure_toe=request.pressure_toe,
            temp_celsius=request.temp_celsius,
            moisture_level=request.moisture_level
        )
        
        # Simple risk assessment
        if request.temp_celsius > 33 and request.pressure_toe > 50:
            reading.risk_indicator = "High"
        elif request.temp_celsius > 32:
            reading.risk_indicator = "Moderate"
        else:
            reading.risk_indicator = "Low"
        
        db.add(reading)
        db.commit()
        db.refresh(reading)
        
        return InsoleReadingResponse(
            reading_id=reading.id,
            user_id=reading.user_id,
            received_at=reading.created_at,
            status="received",
            risk_assessment={
                'temperature': reading.temp_celsius,
                'pressure_toe': reading.pressure_toe,
                'risk_indicator': reading.risk_indicator
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Include all routers
router.include_router(users_router)
router.include_router(checkin_router)
router.include_router(predict_router)
router.include_router(recommendations_router)
router.include_router(dfu_router)
router.include_router(insole_router)
