"""
SQLAlchemy database models for DIABINSIGHT
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    """User profile - demographic and static medical history"""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Authentication
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    
    # Demographics
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    ethnicity = Column(String(50), nullable=False)
    education_level = Column(String(50), nullable=False)
    income_level = Column(String(50), nullable=False)
    employment_status = Column(String(50), nullable=False)
    
    # Lifestyle
    smoking_status = Column(String(20), nullable=False)
    alcohol_consumption_per_week = Column(Integer, nullable=False)
    
    # Medical History
    family_history_diabetes = Column(Boolean, nullable=False)
    hypertension_history = Column(Boolean, nullable=False)
    cardiovascular_history = Column(Boolean, nullable=False)
    
    # Biometrics
    bmi = Column(Float, nullable=False)
    
    # Daily Checkin Preferences
    preferred_checkin_time = Column(String(5), nullable=True)  # HH:MM format (e.g., "09:00")
    
    # Relationships
    daily_entries = relationship("DailyEntry", back_populates="user")
    predictions = relationship("Prediction", back_populates="user")
    dfu_scans = relationship("DFUScan", back_populates="user")
    insole_readings = relationship("InsoleReading", back_populates="user")


class DailyEntry(Base):
    """Daily questionnaire entry - part of 7-day assessment"""
    __tablename__ = "daily_entries"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Daily responses
    entry_date = Column(DateTime, nullable=False)
    diet_score = Column(Float, nullable=False)
    physical_activity_minutes = Column(Integer, nullable=False)
    sleep_hours = Column(Float, nullable=False)
    screen_time_hours = Column(Float, nullable=False)
    hydration_glasses = Column(Integer, nullable=False)
    stress_level = Column(Integer, nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="daily_entries")


class Prediction(Base):
    """Diabetes risk prediction result"""
    __tablename__ = "predictions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Prediction outputs
    risk_score = Column(Float, nullable=False)  # 0.0 to 1.0
    risk_category = Column(String(20), nullable=False)  # Low, Moderate, High
    confidence = Column(Float, nullable=False)
    predicted_stage = Column(String(50), nullable=True)  # No Diabetes, Pre-Diabetes, Type 2, etc.
    
    # Model information
    model_version = Column(String(20), nullable=False)  # app_v1.0, clinical_v1.0, etc.
    model_type = Column(String(50), nullable=False)  # xgboost, ensemble, etc.
    
    # Feature snapshot - JSON of aggregated 7-day vector
    feature_snapshot = Column(JSON, nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="predictions")


class DFUScan(Base):
    """Diabetic Foot Ulcer detection scan result"""
    __tablename__ = "dfu_scans"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Image and storage
    image_path = Column(String(500), nullable=True)  # S3 or Supabase path
    
    # Prediction
    prediction_label = Column(String(50), nullable=False)  # healthy, early_dfu, advanced_dfu
    confidence = Column(Float, nullable=False)
    dfu_detected = Column(Boolean, nullable=False)
    
    # Localization
    affected_area = Column(JSON, nullable=True)  # {x, y, width, height, severity}
    gradcam_path = Column(String(500), nullable=True)  # Heatmap overlay path
    
    # Model information
    model_version = Column(String(20), nullable=False)
    model_name = Column(String(100), nullable=False)  # e.g., "MobileNetV2-DFUC2021"
    
    # Relationship
    user = relationship("User", back_populates="dfu_scans")


class InsoleReading(Base):
    """IoT Smart Insole sensor reading (Phase 4)"""
    __tablename__ = "insole_readings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Device info
    device_id = Column(String(100), nullable=False)
    
    # Sensor readings
    recorded_at = Column(DateTime, nullable=False)
    pressure_heel = Column(Float, nullable=False)
    pressure_metatarsal = Column(Float, nullable=False)
    pressure_toe = Column(Float, nullable=False)
    temp_celsius = Column(Float, nullable=False)
    moisture_level = Column(Float, nullable=False)
    
    # Optional analysis
    risk_indicator = Column(String(50), nullable=True)  # Low, Medium, High
    notes = Column(Text, nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="insole_readings")


class Recommendation(Base):
    """Generated recommendation based on prediction"""
    __tablename__ = "recommendations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    prediction_id = Column(String(36), ForeignKey("predictions.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Recommendation content
    category = Column(String(50), nullable=False)  # Diet, Exercise, Lifestyle, Medical
    priority = Column(String(20), nullable=False)  # Low, Medium, High, Critical
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    action_items = Column(JSON, nullable=False)  # List of specific actions
    
    # Metadata
    deficiency_type = Column(String(100), nullable=True)  # What deficiency triggered this
    impact_score = Column(Float, nullable=True)  # How much this recommendation helps


# Index definitions for performance
def create_indexes(engine):
    """Create indexes for common queries"""
    from sqlalchemy import text
    
    with engine.begin() as conn:
        # User lookups
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_users_age ON users(age)"
        ))
        
        # Daily entries - get recent for user
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_daily_user_date ON daily_entries(user_id, entry_date)"
        ))
        
        # Predictions - get recent for user
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_predictions_user_date ON predictions(user_id, created_at)"
        ))
        
        # DFU scans - get recent for user
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_dfu_user_date ON dfu_scans(user_id, created_at)"
        ))
        
        # Insole readings - get recent for user
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_insole_user_date ON insole_readings(user_id, recorded_at)"
        ))
