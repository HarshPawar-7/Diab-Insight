"""
Services module - Business logic and ML services
"""

from app.services.ml_predictor import DiabetesPredictionService, get_prediction_service
from app.services.dfu_classifier import DFUDetectionService, get_dfu_service
from app.services.recommender import RecommendationEngine, get_recommendation_engine

__all__ = [
    'DiabetesPredictionService',
    'get_prediction_service',
    'DFUDetectionService',
    'get_dfu_service',
    'RecommendationEngine',
    'get_recommendation_engine'
]
