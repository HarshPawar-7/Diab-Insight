"""Check actual user data in database"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal, init_db
from app.models import User

# Initialize database
init_db()

# Get session
db = SessionLocal()

print("="*60)
print("CHECKING USER DATA IN DATABASE")
print("="*60)

try:
    users = db.query(User).all()
    
    if not users:
        print("\n❌ No users found in database")
    else:
        print(f"\n✅ Found {len(users)} user(s)\n")
        
        for i, user in enumerate(users, 1):
            print(f"User #{i}: {user.email}")
            print(f"  Name: {user.name}")
            print(f"  Age: {user.age}")
            print(f"  Gender: '{user.gender}' (type: {type(user.gender).__name__})")
            print(f"  BMI: {user.bmi}")
            print(f"  Smoking Status: '{user.smoking_status}' (type: {type(user.smoking_status).__name__})")
            print(f"  Family History Diabetes: {user.family_history_diabetes}")
            print(f"  Hypertension History: {user.hypertension_history}")
            print(f"  Cardiovascular History: {user.cardiovascular_history}")
            print(f"  Alcohol per week: {user.alcohol_consumption_per_week}")
            print()
            
            # Check what the prediction would look like with this data
            from app.database import get_prediction_service
            
            features = {
                'age': user.age,
                'gender': user.gender,
                'bmi': user.bmi,
                'family_history_diabetes': user.family_history_diabetes,
                'hypertension_history': user.hypertension_history,
                'cardiovascular_history': user.cardiovascular_history,
                'smoking_status': user.smoking_status,
                'alcohol_consumption_per_week': user.alcohol_consumption_per_week,
                'physical_activity_minutes_per_week': 50,
                'diet_score': 6.5,
                'sleep_hours_per_day': 7.0,
                'screen_time_hours_per_day': 4.0
            }
            
            print(f"  🤖 Predicting with these features...")
            pred_service = get_prediction_service()
            result = pred_service.predict_app_model(features)
            
            if 'error' in result and result['error']:
                print(f"  ❌ PREDICTION ERROR: {result['error']}")
            else:
                print(f"  ✅ Risk Score: {result['risk_score']:.1%}")
                print(f"  ✅ Category: {result['risk_category']}")
                print(f"  ✅ Confidence: {result['confidence']:.1%}")
            print()
            
finally:
    db.close()

print("="*60)
