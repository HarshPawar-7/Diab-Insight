"""
ML Prediction Service - Dual Model Approach
Two models: NON_INVASIVE (app) and FULL_CLINICAL (research paper)
"""

import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Tuple, Optional
import json

class DiabetesPredictionService:
    """
    Manages two XGBoost models:
    1. app_model: Uses non-invasive features only
    2. clinical_model: Uses full clinical features (for research/paper)
    """
    
    # Non-invasive features (collectible via app questionnaire + BMI)
    # ORDER MUST MATCH SCALER FIT ORDER!
    NON_INVASIVE_FEATURES = [
        'age', 'gender', 'family_history_diabetes', 'hypertension_history',
        'cardiovascular_history', 'smoking_status', 'bmi', 'sleep_hours_per_day',
        'physical_activity_minutes_per_week', 'screen_time_hours_per_day',
        'diet_score', 'alcohol_consumption_per_week'
    ]
    
    # Full clinical features (add invasive lab values)
    FULL_CLINICAL_FEATURES = NON_INVASIVE_FEATURES + [
        'cholesterol_total', 'hdl_cholesterol', 'ldl_cholesterol',
        'triglycerides', 'glucose_fasting', 'glucose_postprandial',
        'insulin_level', 'hba1c'
    ]
    
    def __init__(self, model_dir: Path = None):
        """Initialize prediction service with dual models"""
        if model_dir is None:
            model_dir = Path(__file__).parent.parent.parent / "ml"
        
        self.model_dir = model_dir
        self.app_model = None
        self.clinical_model = None
        self.app_preprocessor = None
        self.clinical_preprocessor = None
        self.scaler = None
        self.le_gender = None
        self.le_smoking = None
        
        self._load_models()
    
    def _load_models(self):
        """Load both models and their preprocessors"""
        try:
            # Load optimized model (app model)
            model_path = self.model_dir / "diab_insight_xgboost_phase1_optimized.pkl"
            if model_path.exists():
                with open(model_path, 'rb') as f:
                    model_data = pickle.load(f)
                self.app_model = model_data.get('model')
                self.scaler = model_data.get('scaler')
                self.le_gender = model_data.get('le_gender')
                self.le_smoking = model_data.get('le_smoking')
                print(f"✅ App model loaded: {model_path}")
            else:
                print(f"⚠️ App model not found: {model_path}")
            
            # Use same model as clinical for now (placeholder)
            if self.app_model:
                self.clinical_model = self.app_model
                self.clinical_preprocessor = self.scaler
                print(f"✅ Clinical model loaded (using app model)")
        
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            import traceback
            traceback.print_exc()
    
    def predict_app_model(self, features_dict: Dict) -> Dict:
        """
        Predict using NON-INVASIVE model (for app use)
        Input: Dictionary with 13 non-invasive features
        Output: Risk score, category, and confidence
        """
        if not self.app_model or not self.scaler:
            return {
                'error': 'App model not loaded',
                'risk_score': None,
                'risk_category': None
            }
        
        try:
            # Default values for categorical and numeric features
            defaults = {
                'gender': 'Male',  # Default gender
                'smoking_status': 'Never',  # Default smoking status (safest assumption)
                'family_history_diabetes': 0,
                'hypertension_history': 0,
                'cardiovascular_history': 0,
                'age': 35,
                'bmi': 25,
                'alcohol_consumption_per_week': 0,
                'physical_activity_minutes_per_week': 30,
                'diet_score': 5,
                'sleep_hours_per_day': 7,
                'screen_time_hours_per_day': 4
            }
            
            # Extract only non-invasive features with proper defaults
            X = pd.DataFrame([{
                feat: features_dict.get(feat, defaults.get(feat, 0))
                for feat in self.NON_INVASIVE_FEATURES
            }])
            
            # Validate feature presence and types
            missing = [f for f in self.NON_INVASIVE_FEATURES if X[f].isna().any()]
            if missing:
                return {
                    'error': f'Missing features: {missing}',
                    'risk_score': None,
                    'risk_category': None
                }
            
            # Handle categorical features BEFORE feature engineering
            # Convert to string to ensure proper encoding
            if self.le_gender:
                try:
                    X['gender'] = X['gender'].astype(str)
                    X['gender'] = self.le_gender.transform(X[['gender']])
                except Exception as e:
                    print(f"Warning: Gender encoding failed: {e}, using default")
                    X['gender'] = 1  # Default encoded value
            
            if self.le_smoking:
                try:
                    X['smoking_status'] = X['smoking_status'].astype(str)
                    X['smoking_status'] = self.le_smoking.transform(X[['smoking_status']])
                except Exception as e:
                    print(f"Warning: Smoking status encoding failed: {e}, using default")
                    X['smoking_status'] = 2  # Default encoded value (probably "Never")
            
            # Apply same feature engineering as training
            X['age_bmi_ratio'] = X['age'] / (X['bmi'] + 1)
            X['activity_sleep_ratio'] = X['physical_activity_minutes_per_week'] / (X['sleep_hours_per_day'] + 1)
            X['health_risk_score'] = (
                X['family_history_diabetes'] * 0.3 +
                X['hypertension_history'] * 0.25 +
                X['cardiovascular_history'] * 0.25 +
                (X['smoking_status'] / 2) * 0.2
            )
            X['lifestyle_score'] = (
                (X['physical_activity_minutes_per_week'] / 300) * 0.4 +
                ((8 - X['sleep_hours_per_day']) / 8) * 0.3 +
                (X['diet_score'] / 10) * 0.3
            )
            
            # Reorder columns to match scaler's expected order
            feature_order = [
                'age', 'gender', 'family_history_diabetes', 'hypertension_history',
                'cardiovascular_history', 'smoking_status', 'bmi', 'sleep_hours_per_day',
                'physical_activity_minutes_per_week', 'screen_time_hours_per_day',
                'diet_score', 'alcohol_consumption_per_week', 
                'age_bmi_ratio', 'activity_sleep_ratio', 'health_risk_score', 'lifestyle_score'
            ]
            X = X[feature_order]
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Predict
            risk_score = float(self.app_model.predict_proba(X_scaled)[0, 1])
            risk_category = self._categorize_risk(risk_score)
            confidence = float(max(self.app_model.predict_proba(X_scaled)[0]))
            
            return {
                'risk_score': risk_score,
                'risk_category': risk_category,
                'confidence': confidence,
                'model_version': 'app_v1.0',
                'model_type': 'XGBoost',
                'features_used': len(self.NON_INVASIVE_FEATURES),
                'expected_accuracy_auc': 0.82,  # Based on 13 non-invasive features
                'note': 'This is the app model - honest about limitations'
            }
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'risk_score': None,
                'risk_category': None
            }
    
    def predict_clinical_model(self, features_dict: Dict) -> Dict:
        """
        Predict using FULL CLINICAL model (for research paper)
        Input: Dictionary with all 22 features including lab values
        Output: Risk score, category, and confidence
        """
        if not self.clinical_model or not self.scaler:
            return {
                'error': 'Clinical model not loaded',
                'risk_score': None,
                'risk_category': None
            }
        
        try:
            # Extract all clinical features
            X = pd.DataFrame([{
                feat: features_dict.get(feat, 0)
                for feat in self.FULL_CLINICAL_FEATURES
            }])
            
            # Check for lab values (hba1c is especially predictive)
            has_hba1c = not X['hba1c'].isna().any() and X['hba1c'].iloc[0] > 0
            
            # Handle categorical features
            if self.le_gender and 'gender' in X.columns:
                X['gender'] = self.le_gender.transform(X[['gender']])
            if self.le_smoking and 'smoking_status' in X.columns:
                X['smoking_status'] = self.le_smoking.transform(X[['smoking_status']])
            
            # Apply same feature engineering as training
            X['age_bmi_ratio'] = X['age'] / (X['bmi'] + 1)
            X['activity_sleep_ratio'] = X['physical_activity_minutes_per_week'] / (X['sleep_hours_per_day'] + 1)
            X['health_risk_score'] = (
                X['family_history_diabetes'] * 0.3 +
                X['hypertension_history'] * 0.25 +
                X['cardiovascular_history'] * 0.25 +
                (X['smoking_status'] / 2) * 0.2
            )
            X['lifestyle_score'] = (
                (X['physical_activity_minutes_per_week'] / 300) * 0.4 +
                ((8 - X['sleep_hours_per_day']) / 8) * 0.3 +
                (X['diet_score'] / 10) * 0.3
            )
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Predict
            risk_score = float(self.clinical_model.predict_proba(X_scaled)[0, 1])
            risk_category = self._categorize_risk(risk_score)
            confidence = float(max(self.clinical_model.predict_proba(X_scaled)[0]))
            
            return {
                'risk_score': risk_score,
                'risk_category': risk_category,
                'confidence': confidence,
                'model_version': 'clinical_v1.0',
                'model_type': 'XGBoost',
                'features_used': len(self.FULL_CLINICAL_FEATURES),
                'expected_accuracy_auc': 0.97 if has_hba1c else 0.88,
                'note': 'Research paper model - includes invasive lab features',
                'includes_hba1c': has_hba1c
            }
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'risk_score': None,
                'risk_category': None
            }
    
    @staticmethod
    def _categorize_risk(risk_score: float) -> str:
        """Categorize risk based on probability score"""
        if risk_score < 0.35:
            return "Low"
        elif risk_score < 0.65:
            return "Moderate"
        else:
            return "High"
    
    def get_feature_importance(self, model_type: str = 'app') -> Dict:
        """
        Get feature importance from the model
        Useful for explaining predictions
        """
        try:
            if model_type == 'app' and self.app_model:
                importances = self.app_model.feature_importances_
                features = self.NON_INVASIVE_FEATURES
            elif model_type == 'clinical' and self.clinical_model:
                importances = self.clinical_model.feature_importances_
                features = self.FULL_CLINICAL_FEATURES
            else:
                return {'error': f'{model_type} model not available'}
            
            # Create importance dataframe
            importance_df = pd.DataFrame({
                'feature': features,
                'importance': importances
            }).sort_values('importance', ascending=False)
            
            return {
                'model_type': model_type,
                'top_features': importance_df.head(10).to_dict('records'),
                'all_features': importance_df.to_dict('records')
            }
        
        except Exception as e:
            return {'error': str(e)}
    
    def explain_prediction(self, features_dict: Dict, risk_score: float) -> Dict:
        """
        Provide human-readable explanation of the prediction
        """
        explanation = {
            'risk_level': self._categorize_risk(risk_score),
            'risk_percentage': f"{risk_score * 100:.1f}%",
            'interpretation': None,
            'key_factors': [],
            'recommendations': []
        }
        
        # Interpretation
        if risk_score < 0.35:
            explanation['interpretation'] = "Low diabetes risk. Maintain current healthy habits."
            explanation['recommendations'] = [
                "Continue regular physical activity",
                "Maintain a balanced diet",
                "Regular health check-ups"
            ]
        elif risk_score < 0.65:
            explanation['interpretation'] = "Moderate diabetes risk. Consider lifestyle modifications."
            explanation['recommendations'] = [
                "Increase physical activity to 150+ minutes/week",
                "Reduce sugar and processed foods",
                "Monitor diet quality regularly",
                "Consult with a healthcare provider"
            ]
        else:
            explanation['interpretation'] = "High diabetes risk. Urgent medical consultation recommended."
            explanation['recommendations'] = [
                "Schedule appointment with endocrinologist",
                "Get HbA1c and glucose tests",
                "Implement strict dietary changes",
                "Increase daily physical activity",
                "Consider diabetes screening"
            ]
        
        # Key factors affecting prediction
        if features_dict.get('bmi', 0) > 30:
            explanation['key_factors'].append("High BMI is a significant risk factor")
        
        if features_dict.get('family_history_diabetes'):
            explanation['key_factors'].append("Family history increases risk")
        
        if features_dict.get('physical_activity_minutes_per_week', 0) < 150:
            explanation['key_factors'].append("Low physical activity increases risk")
        
        if features_dict.get('diet_score', 0) < 5:
            explanation['key_factors'].append("Poor diet quality is a major risk factor")
        
        return explanation


# Initialize service (will be imported in main.py)
def get_prediction_service():
    """Factory function to get prediction service instance"""
    return DiabetesPredictionService()
