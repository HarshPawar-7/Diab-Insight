"""
Recommendation Engine Service (Phase 2)
Generates personalized lifestyle and nutrition recommendations based on Phase 1 risk score and deficits.
"""

import pandas as pd
import os
from typing import Dict, List

class DiabInsightRecommender:
    def __init__(self, food_dataset_path: str = None):
        # Default to the dataset in the data folder if none provided
        if food_dataset_path is None:
            # Assumes running from backend root or main app
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            food_dataset_path = os.path.join(base_dir, 'data', 'pred_food.csv')
            
        try:
            self.foods = pd.read_csv(food_dataset_path)
            # Clean up column names to prevent trailing/leading whitespace issues
            self.foods.columns = self.foods.columns.str.strip()
        except Exception as e:
            print(f"Warning: Could not load food dataset from {food_dataset_path}. Error: {e}")
            # Mock empty DataFrame with required columns if file missing
            self.foods = pd.DataFrame(columns=[
                'Food Name', 'Glycemic Index', 'Calories', 'Carbohydrates', 
                'Fiber Content', 'Suitable for Diabetes', 'Suitable for Blood Pressure', 
                'Sodium Content'
            ])
            
        self.lifestyle_matrix = self._build_lifestyle_matrix()
        
    def _build_lifestyle_matrix(self) -> Dict:
        """Matrix mapping identified deficits to actionable lifestyle recommendations"""
        return {
            'low_activity': {
                'high_risk': "Start with 15 minutes of brisk walking after meals. Post-meal walks significantly lower postprandial blood glucose spikes.",
                'low_risk': "Aim for 150 minutes of moderate aerobic activity this week."
            },
            'poor_diet': {
                'high_risk': "Replace sugary beverages with infused water or unsweetened tea. Stick strictly to the recommended foods (GI < 55).",
                'low_risk': "Focus on complex carbs and keep an eye on portion sizes. Occasional treats are okay, but prioritize fiber."
            },
            'poor_sleep': {
                'high_risk': "Cortisol (stress hormone) directly increases blood glucose. Prioritize 7-8 hours of sleep and consider 10 minutes of mindfulness to stabilize morning fasting glucose levels.",
                'low_risk': "Try to maintain a consistent sleep schedule of 7-8 hours for optimal metabolic health."
            },
            'high_bp': {
                'high_risk': "Strictly monitor your sodium intake (< 140mg/serving) and choose foods optimized for blood pressure control.",
                'low_risk': "Keep an eye on salty snacks and ensure you are getting enough potassium-rich foods."
            },
            'high_stress': {
                'high_risk': "High stress levels spike insulin resistance. Incorporate 5-10 minutes of deep breathing exercises daily.",
                'low_risk': "Manage daily stress through light activities and hobbies to prevent long-term metabolic strain."
            }
        }

    def _determine_deficits(self, features: Dict) -> List[str]:
        """Map raw features to recognized deficit keys"""
        deficits = []
        if features.get('physical_activity_minutes_per_week', 150) < 150:
            deficits.append('low_activity')
        if features.get('diet_score', 10) < 5:
            deficits.append('poor_diet')
        if features.get('sleep_hours_per_day', 7) < 6.5:
            deficits.append('poor_sleep')
        if features.get('hypertension_history', False):
            deficits.append('high_bp')
        if features.get('stress_level', 1) > 3:
            deficits.append('high_stress')
        return deficits

    def recommend_foods(self, risk_score: float, user_deficits: List[str]) -> List[Dict]:
        """Uses pandas to filter and rank foods based on tiered risk constraints"""
        if self.foods.empty:
            return [{"food": "Water", "reason": "Always a healthy choice."}]
            
        recommendations = self.foods.copy()
        
        # 1. Base Filtering based on Risk Score
        if risk_score > 0.70:
            # High Risk: Strict Diabetic Constraints
            mask = recommendations['Suitable for Diabetes'] == 1
            if mask.any(): recommendations = recommendations[mask]
            
            mask = recommendations['Glycemic Index'] < 55
            if mask.any(): recommendations = recommendations[mask]
            
        elif risk_score > 0.40:
            # Moderate Risk: Preventative Constraints
            mask = recommendations['Glycemic Index'] < 65
            if mask.any(): recommendations = recommendations[mask]
            
            # Ensure decent fiber to carb ratio, handle zero division
            carb_mask = recommendations['Carbohydrates'] > 0
            if carb_mask.any():
                ratio_mask = (recommendations['Fiber Content'] / recommendations['Carbohydrates']) > 0.1
                combined = ~carb_mask | ratio_mask
                if combined.any(): recommendations = recommendations[combined]
            
        # 2. Deficit-Specific Filtering
        if 'high_bp' in user_deficits:
            mask = recommendations['Suitable for Blood Pressure'] == 1
            if mask.any(): recommendations = recommendations[mask]
            
            mask = recommendations['Sodium Content'] < 140
            if mask.any(): recommendations = recommendations[mask]
            
        if 'needs_weight_loss' in user_deficits:
            recommendations = recommendations.sort_values(by='Calories', ascending=True)

        # 3. Sort by Nutritional Value
        # Drop duplicates to prevent the same food appearing multiple times
        if 'Food Name' in recommendations.columns:
            recommendations = recommendations.drop_duplicates(subset=['Food Name'])

        # Lowest GI and Highest Fiber
        recommendations = recommendations.sort_values(
            by=['Glycemic Index', 'Fiber Content'], 
            ascending=[True, False]
        )
        
        # Take top 15 and sample 5 for variety (if enough foods exist), otherwise take what we have
        if len(recommendations) > 5:
            top_foods = recommendations.head(15).sample(5).to_dict('records')
        else:
            top_foods = recommendations.to_dict('records')
        
        # Format the output to exactly match the requested schema
        nutrition_plan = []
        for f in top_foods:
            food_name = str(f.get('Food Name', 'Healthy Snack')).strip()
            gi = int(f.get('Glycemic Index', 0))
            reason = f'Low GI ({gi})'
            
            if f.get('Fiber Content', 0) > 3:
                reason += ' and high fiber.'
            elif f.get('Suitable for Blood Pressure', 0) == 1 and 'high_bp' in user_deficits:
                reason += ' and manages blood pressure.'
            else:
                reason += ' and diabetes safe.'
                
            nutrition_plan.append({"food": food_name, "reason": reason})
            
        return nutrition_plan

    def recommend_lifestyle(self, risk_score: float, user_deficits: List[str]) -> List[str]:
        """Maps deficits to specific lifestyle advice strings"""
        goals = []
        risk_level = 'high_risk' if risk_score > 0.40 else 'low_risk'
        
        for deficit in user_deficits:
            if deficit in self.lifestyle_matrix:
                goals.append(self.lifestyle_matrix[deficit][risk_level])
                
        # Add a default goal if no specific deficits trigger
        if not goals:
            goals.append("Maintain your current healthy habits. Keep exercising and eating balanced meals.")
            
        return goals

    def generate_recommendations(self, risk_score: float, features: Dict) -> Dict:
        """Main pipeline combining food and lifestyle recommendations"""
        deficits = self._determine_deficits(features)
        
        nutrition_plan = self.recommendFoods(risk_score, deficits)
        lifestyle_goals = self.recommendLifestyle(risk_score, deficits)
        
        return {
            "nutrition_plan": nutrition_plan,
            "lifestyle_goals": lifestyle_goals
        }

    # Alias to snake_case for consistency
    recommend_foods = recommendFoods = recommend_foods
    recommend_lifestyle = recommendLifestyle = recommend_lifestyle

def get_recommendation_engine() -> DiabInsightRecommender:
    """Dependency injection provider"""
    return DiabInsightRecommender()
