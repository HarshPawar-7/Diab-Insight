"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List, Dict
from enum import Enum

# Enums
class GenderEnum(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class SmokingStatusEnum(str, Enum):
    NEVER = "Never"
    FORMER = "Former"
    CURRENT = "Current"

class RiskCategoryEnum(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"

class DiabetesStageEnum(str, Enum):
    NO_DIABETES = "No Diabetes"
    PRE_DIABETES = "Pre-Diabetes"
    TYPE_2 = "Type 2"
    TYPE_1 = "Type 1"
    GESTATIONAL = "Gestational"

class DFUClassEnum(str, Enum):
    HEALTHY = "healthy"
    EARLY_DFU = "early_dfu"
    ADVANCED_DFU = "advanced_dfu"

# User Registration Schema
class UserRegisterRequest(BaseModel):
    """User registration with demographic & static medical history"""
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    name: str = Field(..., min_length=2, description="Full name")
    age: int = Field(..., ge=18, le=100)
    gender: GenderEnum
    ethnicity: str
    bmi: float = Field(..., ge=10, le=60)
    family_history_diabetes: bool
    hypertension_history: bool
    cardiovascular_history: bool
    smoking_status: SmokingStatusEnum
    alcohol_consumption_per_week: int = Field(..., ge=0, le=50)
    education_level: str
    income_level: str
    employment_status: str

class UserRegisterResponse(BaseModel):
    user_id: str
    email: str
    name: str
    age: int
    gender: str
    ethnicity: str
    education_level: str
    income_level: str
    employment_status: str
    smoking_status: str
    bmi: float
    family_history_diabetes: bool
    hypertension_history: bool
    cardiovascular_history: bool
    created_at: datetime
    message: str

class UserLoginRequest(BaseModel):
    """User login credentials"""
    email: str
    password: str

class UserLoginResponse(BaseModel):
    user_id: str
    email: str
    name: str
    age: int
    gender: str
    ethnicity: str
    education_level: str
    income_level: str
    employment_status: str
    smoking_status: str
    bmi: float
    family_history_diabetes: bool
    hypertension_history: bool
    cardiovascular_history: bool
    message: str

class UserProfileResponse(BaseModel):
    user_id: str
    age: int
    gender: str
    bmi: float
    family_history_diabetes: bool

# Daily Check-in Schema (7-day questionnaire)
class DailyCheckinRequest(BaseModel):
    """Daily questionnaire entry"""
    user_id: str
    diet_score: float = Field(..., ge=1, le=10, description="Diet quality 1-10")
    physical_activity_minutes: int = Field(..., ge=0, le=1000)
    sleep_hours: float = Field(..., ge=2, le=12)
    screen_time_hours: float = Field(..., ge=0, le=24)
    hydration_glasses: int = Field(..., ge=0, le=20)
    stress_level: int = Field(..., ge=1, le=5)
    preferred_checkin_time: Optional[str] = None  # HH:MM format for first checkin

class DailyCheckinResponse(BaseModel):
    entry_id: str
    user_id: str
    entry_date: str
    message: str

class CheckinHistoryResponse(BaseModel):
    user_id: str
    entries: List[Dict]
    days_completed: int
    ready_for_prediction: bool
    preferred_checkin_time: Optional[str] = None
    already_completed_today: bool = False
    preferred_checkin_time: Optional[str] = None
    already_completed_today: bool = False

# Prediction Request/Response
class PredictionRequest(BaseModel):
    """Request diabetes risk prediction"""
    user_id: str

class AggregatedFeatures(BaseModel):
    """Aggregated 7-day features for prediction"""
    user_id: str
    age: int
    gender: str
    diet_score: float
    physical_activity_minutes_per_week: int
    sleep_hours_per_day: float
    screen_time_hours_per_day: float
    family_history_diabetes: bool
    hypertension_history: bool
    cardiovascular_history: bool
    bmi: float
    waist_to_hip_ratio: float
    smoking_status: str
    alcohol_consumption_per_week: int

class PredictionResponse(BaseModel):
    user_id: str
    risk_score: float = Field(..., ge=0, le=1)
    risk_category: RiskCategoryEnum
    confidence: float
    predicted_at: datetime
    model_version: str
    recommendations_prompt: str

class PredictionHistoryResponse(BaseModel):
    user_id: str
    predictions: List[PredictionResponse]
    trend: Optional[str]

# Recommendations Schema
class RecommendationItem(BaseModel):
    category: str
    priority: str
    title: str
    description: str
    action_items: List[str]

class RecommendationsResponse(BaseModel):
    user_id: str
    risk_category: str
    risk_score: float
    recommendations: List[RecommendationItem]
    deficiencies: List[str]
    strengths: List[str]
    priority_focus: str
    generated_at: datetime

# DFU Scan Schema
class DFUScanRequest(BaseModel):
    """DFU scan request - image upload"""
    user_id: str
    image_quality: Optional[str] = "auto"

class GradCAMResult(BaseModel):
    x: int
    y: int
    width: int
    height: int
    severity: float

class DFUScanResponse(BaseModel):
    scan_id: str
    user_id: str
    dfu_detected: bool
    prediction_label: DFUClassEnum
    confidence: float
    affected_area: Optional[GradCAMResult]
    scanned_at: datetime
    model_version: str
    next_steps: List[str]

class DFUScanHistoryResponse(BaseModel):
    user_id: str
    scans: List[DFUScanResponse]
    total_scans: int

# Insole/IoT Schema (Phase 4)
class InsoleReadingRequest(BaseModel):
    """ESP32 posts sensor data"""
    user_id: str
    device_id: str
    pressure_heel: float
    pressure_metatarsal: float
    pressure_toe: float
    temp_celsius: float
    moisture_level: float

class InsoleReadingResponse(BaseModel):
    reading_id: str
    user_id: str
    received_at: datetime
    status: str
    risk_assessment: Optional[Dict]

# Health check
class HealthCheckResponse(BaseModel):
    status: str
    service: str
    models_loaded: Dict[str, bool]
    database_connected: bool
    timestamp: datetime
