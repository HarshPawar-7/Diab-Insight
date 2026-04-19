"""
Recommendation Engine Service
Generates personalized lifestyle recommendations based on risk score and identified deficiencies
"""

from typing import Dict, List, Tuple
import json

class RecommendationEngine:
    """
    Rule-based recommendation system
    Maps risk scores and deficiencies to personalized recommendations
    """
    
    def __init__(self):
        """Initialize with recommendation database"""
        self.recommendation_db = self._build_recommendation_db()
    
    def _build_recommendation_db(self) -> Dict:
        """
        Build the recommendation database
        Maps deficiency + risk level → specific recommendations
        """
        return {
            'low_activity': {
                'category': 'Exercise',
                'priority_low': 'Start light activity (15-20 min/day)',
                'priority_moderate': 'Increase to 150 min/week moderate exercise',
                'priority_high': 'Urgent: 150+ min/week with strength training',
                'action_items_low': [
                    'Take 10-minute walks daily',
                    'Use stairs instead of elevators',
                    'Stretch for 5 minutes each morning',
                    'Try light yoga or tai chi'
                ],
                'action_items_moderate': [
                    'Brisk walking 30 minutes daily',
                    'Join a fitness class',
                    'Add strength training 2x/week',
                    'Use fitness tracker to monitor progress'
                ],
                'action_items_high': [
                    'Start supervised fitness program',
                    'Combine cardio + strength training',
                    'Daily 30-45 minute sessions',
                    'Work with fitness trainer or coach'
                ]
            },
            'poor_diet': {
                'category': 'Diet',
                'priority_low': 'Improve diet quality gradually',
                'priority_moderate': 'Reduce simple carbs and sugar',
                'priority_high': 'Strict dietary modifications required',
                'action_items_low': [
                    'Add one fruit/vegetable per meal',
                    'Reduce sugary drinks',
                    'Choose whole grains when possible',
                    'Plan meals ahead'
                ],
                'action_items_moderate': [
                    'Replace white rice/bread with brown alternatives',
                    'Eliminate sugary drinks completely',
                    'Reduce processed food intake',
                    'Consult nutritionist for meal planning',
                    'Track daily food intake'
                ],
                'action_items_high': [
                    'Follow diabetes-specific diet plan',
                    'Work with registered dietitian',
                    'Eliminate added sugars entirely',
                    'Reduce refined carbohydrates to < 40g/day',
                    'Monitor blood glucose response to foods'
                ]
            },
            'poor_sleep': {
                'category': 'Lifestyle',
                'priority_low': 'Improve sleep consistency',
                'priority_moderate': 'Aim for 7-8 hours nightly',
                'priority_high': 'Strict sleep schedule essential',
                'action_items_low': [
                    'Set consistent bedtime',
                    'Reduce screen time before bed',
                    'Try relaxation techniques',
                    'Maintain cool, dark bedroom'
                ],
                'action_items_moderate': [
                    'Sleep 7-8 hours nightly',
                    'No screens 1 hour before bed',
                    'Limit caffeine after 2 PM',
                    'Exercise during day (not evening)',
                    'Practice meditation or deep breathing'
                ],
                'action_items_high': [
                    'Strict sleep schedule: same time daily',
                    'Sleep study evaluation if insomnia',
                    'No electronics in bedroom',
                    'Consider sleep specialist consultation',
                    'May require sleep medications'
                ]
            },
            'high_screen_time': {
                'category': 'Lifestyle',
                'priority_low': 'Gradually reduce screen time',
                'priority_moderate': 'Limit to < 6 hours/day',
                'priority_high': 'Reduce significantly (< 4 hours/day)',
                'action_items_low': [
                    'Take 10-min break every hour',
                    'Dim screen brightness',
                    'Use blue light filter',
                    'Alternate activities'
                ],
                'action_items_moderate': [
                    'Aim for max 6 hours/day',
                    'No screens during meals',
                    'Replace 1 hour screen time with activity',
                    'Set daily screen time limits'
                ],
                'action_items_high': [
                    'Reduce to 4 hours/day maximum',
                    'Delete unnecessary apps',
                    'Use app limiters',
                    'Establish screen-free times (6 PM - 9 PM)',
                    'Find hobby to replace screen time'
                ]
            },
            'high_alcohol': {
                'category': 'Diet',
                'priority_low': 'Moderate alcohol consumption',
                'priority_moderate': 'Limit to 1-2 drinks/week',
                'priority_high': 'Eliminate alcohol entirely',
                'action_items_low': [
                    'Reduce drinks per week by 25%',
                    'Switch to lower-alcohol options',
                    'Alternate with non-alcoholic drinks'
                ],
                'action_items_moderate': [
                    'Limit to < 2 drinks per week',
                    'Avoid binge drinking',
                    'Track alcohol consumption',
                    'Replace with healthier beverages'
                ],
                'action_items_high': [
                    'Eliminate all alcohol',
                    'Join support group if needed',
                    'Identify and avoid triggers',
                    'Seek counseling if alcohol dependent'
                ]
            },
            'smoker': {
                'category': 'Lifestyle',
                'priority_moderate': 'Quit smoking',
                'priority_high': 'Urgent: Quit smoking now',
                'action_items_moderate': [
                    'Set quit date within 2 weeks',
                    'Use nicotine replacement therapy',
                    'Join smoking cessation program',
                    'Consult physician for medications'
                ],
                'action_items_high': [
                    'Quit smoking immediately',
                    'Prescription: Varenicline or Bupropion',
                    'Daily support group attendance',
                    'Medical supervision required'
                ]
            },
            'high_bmi': {
                'category': 'Exercise + Diet',
                'priority_moderate': 'Weight loss through diet + exercise',
                'priority_high': 'Aggressive weight loss program',
                'action_items_moderate': [
                    'Target: 5-10% weight loss (3-6 months)',
                    'Combine reduced calories + exercise',
                    'Monitor weight weekly',
                    'Work with nutritionist'
                ],
                'action_items_high': [
                    'Target: 10-15% weight loss',
                    'Supervised diet program (low-carb)',
                    'Daily exercise 300 min/week',
                    'Medical weight loss clinic',
                    'Consider GLP-1 agonist medications'
                ]
            },
            'family_history': {
                'category': 'Medical',
                'priority_moderate': 'Regular screening recommended',
                'priority_high': 'Frequent monitoring essential',
                'action_items_moderate': [
                    'HbA1c test every 3-6 months',
                    'Annual diabetes screening',
                    'Track blood glucose at home',
                    'Regular physician visits'
                ],
                'action_items_high': [
                    'Monthly physician check-ins',
                    'Continuous glucose monitor (optional)',
                    'Specialist care: endocrinologist',
                    'Intensive glucose management'
                ]
            }
        }
    
    def generate_recommendations(self, 
                                risk_score: float,
                                features: Dict) -> Dict:
        """
        Generate personalized recommendations based on risk and features
        
        Returns: {
            recommendations: List[RecommendationItem],
            deficiencies: List[str],
            strengths: List[str],
            priority_focus: str
        }
        """
        
        # Identify deficiencies
        deficiencies = self._identify_deficiencies(features)
        
        # Identify strengths
        strengths = self._identify_strengths(features)
        
        # Categorize risk
        if risk_score < 0.35:
            risk_category = 'Low'
        elif risk_score < 0.65:
            risk_category = 'Moderate'
        else:
            risk_category = 'High'
        
        # Generate recommendations based on deficiencies and risk
        recommendations = []
        for deficiency in deficiencies:
            rec = self._get_recommendation(deficiency, risk_category)
            if rec:
                recommendations.append(rec)
        
        # Add medical recommendations if at risk
        if risk_category in ['Moderate', 'High']:
            medical_rec = {
                'category': 'Medical',
                'priority': 'High' if risk_category == 'High' else 'Medium',
                'title': 'Medical Consultation',
                'description': 'Schedule appointment with physician for diabetes screening and monitoring',
                'action_items': [
                    'Schedule HbA1c and fasting glucose test',
                    'Book appointment with physician',
                    'Bring family history information',
                    'Discuss medication options if needed'
                ]
            }
            recommendations.append(medical_rec)
        
        # Determine priority focus
        priority_focus = self._determine_priority_focus(deficiencies, risk_score)
        
        return {
            'risk_category': risk_category,
            'risk_score': risk_score,
            'recommendations': recommendations,
            'deficiencies': deficiencies,
            'strengths': strengths,
            'total_recommendations': len(recommendations),
            'priority_focus': priority_focus,
            'message': self._get_motivational_message(risk_category, deficiencies)
        }
    
    def _identify_deficiencies(self, features: Dict) -> List[str]:
        """Identify lifestyle deficiencies from features"""
        deficiencies = []
        
        if features.get('physical_activity_minutes_per_week', 0) < 150:
            deficiencies.append('low_activity')
        
        if features.get('diet_score', 0) < 5:
            deficiencies.append('poor_diet')
        
        if features.get('sleep_hours_per_day', 0) < 6.5:
            deficiencies.append('poor_sleep')
        
        if features.get('screen_time_hours_per_day', 0) > 7:
            deficiencies.append('high_screen_time')
        
        if features.get('alcohol_consumption_per_week', 0) > 2:
            deficiencies.append('high_alcohol')
        
        if features.get('smoking_status') == 'Current':
            deficiencies.append('smoker')
        
        if features.get('bmi', 0) > 30:
            deficiencies.append('high_bmi')
        
        if features.get('family_history_diabetes'):
            deficiencies.append('family_history')
        
        return deficiencies
    
    def _identify_strengths(self, features: Dict) -> List[str]:
        """Identify positive lifestyle factors"""
        strengths = []
        
        if features.get('physical_activity_minutes_per_week', 0) >= 150:
            strengths.append('Regular physical activity')
        
        if features.get('diet_score', 0) >= 7:
            strengths.append('Good diet quality')
        
        if features.get('sleep_hours_per_day', 0) >= 7:
            strengths.append('Adequate sleep')
        
        if features.get('screen_time_hours_per_day', 0) < 5:
            strengths.append('Low screen time')
        
        if features.get('smoking_status') == 'Never':
            strengths.append('Non-smoker')
        
        if features.get('bmi', 0) < 25:
            strengths.append('Healthy BMI')
        
        if not features.get('hypertension_history'):
            strengths.append('No hypertension')
        
        return strengths
    
    def _get_recommendation(self, deficiency: str, risk_category: str) -> Dict:
        """Get specific recommendation for a deficiency"""
        db = self.recommendation_db.get(deficiency)
        
        if not db:
            return None
        
        # Map risk category to priority
        priority_key = f'priority_{risk_category.lower()}'
        action_key = f'action_items_{risk_category.lower()}'
        
        # Fallback if risk level not in db
        if priority_key not in db:
            priority_key = 'priority_moderate'
            action_key = 'action_items_moderate'
        
        return {
            'category': db['category'],
            'priority': risk_category,
            'title': db.get(priority_key, ''),
            'description': self._get_description(deficiency, risk_category),
            'action_items': db.get(action_key, [])
        }
    
    def _get_description(self, deficiency: str, risk_category: str) -> str:
        """Get detailed description for recommendation"""
        descriptions = {
            'low_activity': 'Physical inactivity is a major risk factor for diabetes. Regular exercise improves insulin sensitivity.',
            'poor_diet': 'High sugar and processed food intake increases diabetes risk. Whole foods and balanced nutrition are essential.',
            'poor_sleep': 'Insufficient sleep disrupts glucose metabolism. 7-8 hours nightly is recommended.',
            'high_screen_time': 'Excessive screen time leads to sedentary lifestyle and poor health outcomes.',
            'high_alcohol': 'High alcohol consumption affects glucose levels and liver function.',
            'smoker': 'Smoking significantly increases diabetes complications risk.',
            'high_bmi': 'Overweight increases insulin resistance. Weight loss is crucial for risk reduction.',
            'family_history': 'Genetic predisposition requires proactive monitoring and prevention.'
        }
        return descriptions.get(deficiency, '')
    
    def _determine_priority_focus(self, deficiencies: List[str], risk_score: float) -> str:
        """Determine the single most important area to focus on"""
        if not deficiencies:
            return 'Maintain current healthy habits'
        
        # Prioritize by impact
        priority_order = ['high_bmi', 'smoker', 'low_activity', 'poor_diet', 'family_history']
        
        for deficiency in priority_order:
            if deficiency in deficiencies:
                if deficiency == 'high_bmi':
                    return 'Weight Loss Through Diet & Exercise'
                elif deficiency == 'smoker':
                    return 'Smoking Cessation'
                elif deficiency == 'low_activity':
                    return 'Increase Physical Activity'
                elif deficiency == 'poor_diet':
                    return 'Improve Diet Quality'
                elif deficiency == 'family_history':
                    return 'Regular Medical Monitoring'
        
        return 'Lifestyle Improvement'
    
    def _get_motivational_message(self, risk_category: str, deficiencies: List[str]) -> str:
        """Generate encouraging message"""
        if risk_category == 'Low':
            return '🎉 Great job! Your diabetes risk is low. Keep up these healthy habits!'
        elif risk_category == 'Moderate':
            return '⚠️ You have moderate risk. Small lifestyle changes can make a big difference!'
        else:
            return '🚨 High risk detected. Immediate action is needed. You can reverse this trend!'


def get_recommendation_engine():
    """Factory function"""
    return RecommendationEngine()
