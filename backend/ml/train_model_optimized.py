"""
Optimized XGBoost Model for Diabetes Risk Prediction (Phase 1)
Includes: Better hyperparameter tuning, cross-validation, feature engineering
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score, StratifiedKFold, GridSearchCV
from xgboost import XGBClassifier
import pickle
from pathlib import Path
import json

# Load dataset
dataset_path = Path(__file__).parent.parent / "data" / "diabetes_dataset.csv"
df = pd.read_csv(dataset_path)

print(f"📊 Dataset shape: {df.shape}")
print(f"📊 Columns: {df.columns.tolist()}\n")

# Features for training
feature_cols = [
    'age',
    'gender',
    'family_history_diabetes',
    'hypertension_history',
    'cardiovascular_history',
    'smoking_status',
    'bmi',
    'sleep_hours_per_day',
    'physical_activity_minutes_per_week',
    'screen_time_hours_per_day',
    'diet_score',
    'alcohol_consumption_per_week'
]

target_col = 'diagnosed_diabetes'

# Extract features and target
X = df[feature_cols].copy()
y = df[target_col].copy()

# Handle missing values
X = X.fillna(X.mean(numeric_only=True))

print(f"✅ Selected {len(feature_cols)} features for training")
print(f"✅ Target distribution:")
print(f"   Diabetes (1): {(y == 1).sum()} samples ({(y == 1).sum() / len(y) * 100:.1f}%)")
print(f"   No Diabetes (0): {(y == 0).sum()} samples ({(y == 0).sum() / len(y) * 100:.1f}%)\n")

# Identify categorical and numerical columns
categorical_cols = ['gender', 'smoking_status']
numerical_cols = [col for col in feature_cols if col not in categorical_cols]

print(f"🔢 Numerical features: {len(numerical_cols)}")
print(f"📝 Categorical features: {len(categorical_cols)}\n")

# Encode categorical variables
le_gender = LabelEncoder()
le_smoking = LabelEncoder()

X['gender'] = le_gender.fit_transform(X['gender'])
X['smoking_status'] = le_smoking.fit_transform(X['smoking_status'])

# Feature Engineering
print("🔧 Feature Engineering...")

# Add derived features
X['age_bmi_ratio'] = X['age'] / (X['bmi'] + 1)
X['activity_sleep_ratio'] = X['physical_activity_minutes_per_week'] / (X['sleep_hours_per_day'] + 1)
X['health_risk_score'] = (
    X['family_history_diabetes'] * 0.3 +
    X['hypertension_history'] * 0.25 +
    X['cardiovascular_history'] * 0.25 +
    (X['smoking_status'] / 2) * 0.2  # Normalize smoking status
)
X['lifestyle_score'] = (
    (X['physical_activity_minutes_per_week'] / 300) * 0.4 +
    ((8 - X['sleep_hours_per_day']) / 8) * 0.3 +
    (X['diet_score'] / 10) * 0.3
)

print(f"✅ Added 4 derived features")
print(f"📊 Total features after engineering: {X.shape[1]}\n")

# Normalize numerical features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_scaled = pd.DataFrame(X_scaled, columns=X.columns)

print("🚀 Training XGBoost Model with Hyperparameter Tuning...")
print("="*60)

# Use Stratified K-Fold for imbalanced data
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Hyperparameter grid for tuning
param_grid = {
    'n_estimators': [100, 200],
    'max_depth': [4, 5, 6],
    'learning_rate': [0.01, 0.05],
    'subsample': [0.7, 0.8],
    'colsample_bytree': [0.7, 0.8],
    'min_child_weight': [1, 3]
}

# Base XGBoost model
xgb_base = XGBClassifier(
    random_state=42,
    eval_metric='logloss',
    verbosity=0,
    use_label_encoder=False
)

# Grid search for best hyperparameters
print("\n🔍 Performing GridSearchCV (this may take a moment)...")
grid_search = GridSearchCV(
    xgb_base,
    param_grid,
    cv=skf,
    scoring='f1',
    n_jobs=-1,
    verbose=1
)

grid_search.fit(X_scaled, y)

print(f"\n✅ Best parameters found:")
for param, value in grid_search.best_params_.items():
    print(f"   {param}: {value}")
print(f"✅ Best CV F1 Score: {grid_search.best_score_:.4f}")

# Train final model with best parameters
best_model = grid_search.best_estimator_

# Get feature importances
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': best_model.feature_importances_
}).sort_values('importance', ascending=False)

print(f"\n📊 Top 10 Feature Importances:")
for idx, row in feature_importance.head(10).iterrows():
    print(f"   {row['feature']}: {row['importance']:.4f}")

# Evaluate on cross-validation
print(f"\n📈 Cross-validation Metrics:")
cv_scores = cross_val_score(best_model, X_scaled, y, cv=skf, scoring='f1')
print(f"   Mean F1 Score: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

cv_accuracy = cross_val_score(best_model, X_scaled, y, cv=skf, scoring='accuracy')
print(f"   Mean Accuracy: {cv_accuracy.mean():.4f} (+/- {cv_accuracy.std():.4f})")

cv_roc_auc = cross_val_score(best_model, X_scaled, y, cv=skf, scoring='roc_auc')
print(f"   Mean ROC-AUC: {cv_roc_auc.mean():.4f} (+/- {cv_roc_auc.std():.4f})")

# Save the model
model_path = Path(__file__).parent / "diab_insight_xgboost_phase1_optimized.pkl"
with open(model_path, 'wb') as f:
    pickle.dump({
        'model': best_model,
        'scaler': scaler,
        'le_gender': le_gender,
        'le_smoking': le_smoking,
        'feature_names': X.columns.tolist(),
        'feature_importance': feature_importance.to_dict('records')
    }, f)

print(f"\n💾 Model saved to {model_path}")

# Save metrics
metrics = {
    'cv_f1_score': float(cv_scores.mean()),
    'cv_accuracy': float(cv_accuracy.mean()),
    'cv_roc_auc': float(cv_roc_auc.mean()),
    'best_params': grid_search.best_params_,
    'best_cv_score': float(grid_search.best_score_),
    'feature_count': X.shape[1],
    'sample_count': len(y)
}

metrics_path = Path(__file__).parent / "model_metrics.json"
with open(metrics_path, 'w') as f:
    json.dump(metrics, f, indent=2)

print(f"📊 Metrics saved to {metrics_path}")
print("\n✅ Model training and optimization complete!")
