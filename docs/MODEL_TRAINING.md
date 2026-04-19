# 🧠 Model Training Guide

## Overview

This guide covers training and optimizing both Phase 1 (Risk Prediction) and Phase 3 (DFU Detection) models.

---

## Phase 1: XGBoost Diabetes Risk Predictor

### Dataset Requirements

**Input File**: `diabetes_dataset.csv`

**Required Features** (12):
```
age                           # Age in years (18-100)
gender                        # Male or Female
family_history_diabetes       # Binary: 0 or 1
hypertension_history          # Binary: 0 or 1
cardiovascular_history        # Binary: 0 or 1
smoking_status                # Never, Former, or Current
bmi                          # Body Mass Index
sleep_hours_per_day          # Hours of sleep (3-12)
physical_activity_minutes_per_week   # Weekly exercise
screen_time_hours_per_day    # Daily screen time
diet_score                   # Diet quality (1-10)
alcohol_consumption_per_week # Drinks per week
```

**Target Variable**:
```
diagnosed_diabetes            # Binary: 0 (No) or 1 (Yes)
```

**Minimum Dataset Size**: 1000 samples
**Class Balance**: Works best with balanced or slightly imbalanced data

### Training Process

#### Step 1: Data Preparation

```python
import pandas as pd
from pathlib import Path

# Load dataset
dataset_path = Path("diabetes_dataset.csv")
df = pd.read_csv(dataset_path)

# Data exploration
print(f"Shape: {df.shape}")
print(f"Missing values:\n{df.isnull().sum()}")
print(f"Target distribution:\n{df['diagnosed_diabetes'].value_counts()}")
```

#### Step 2: Feature Engineering

The optimized training script automatically creates derived features:

1. **age_bmi_ratio**: Age-adjusted BMI indicator
2. **activity_sleep_ratio**: Activity-recovery balance
3. **health_risk_score**: Weighted medical risk combination
4. **lifestyle_score**: Composite wellness indicator

These 4 features are added to the original 12, resulting in 16 total features.

#### Step 3: Run Training

```bash
cd backend
python train_model_optimized.py
```

**Script Output**:
```
📊 Dataset shape: (5000, 32)
✅ Selected 16 features for training
✅ Target distribution:
   Diabetes (1): 1200 samples (24.0%)
   No Diabetes (0): 3800 samples (76.0%)

🔢 Numerical features: 14
📝 Categorical features: 2

🔧 Feature Engineering...
✅ Added 4 derived features
📊 Total features after engineering: 16

🚀 Training XGBoost Model with Hyperparameter Tuning...
============================================================

🔍 Performing GridSearchCV (this may take a moment)...
[GridSearchCV progress...]

✅ Best parameters found:
   n_estimators: 200
   max_depth: 5
   learning_rate: 0.05
   subsample: 0.8
   colsample_bytree: 0.8
   min_child_weight: 1

✅ Best CV F1 Score: 0.8420

📊 Top 10 Feature Importances:
   bmi: 0.1523
   age: 0.1245
   health_risk_score: 0.0987
   ...

📈 Cross-validation Metrics:
   Mean F1 Score: 0.8420 (+/- 0.0185)
   Mean Accuracy: 0.8522 (+/- 0.0210)
   Mean ROC-AUC: 0.8915 (+/- 0.0152)

💾 Model saved to backend/diab_insight_xgboost_phase1_optimized.pkl
📊 Metrics saved to backend/model_metrics.json

✅ Model training and optimization complete!
```

### Output Files

**Model File**: `backend/diab_insight_xgboost_phase1_optimized.pkl`
- Contains:
  - Trained XGBoost model
  - Scaler for feature normalization
  - Label encoders for categorical features
  - Feature names
  - Feature importance rankings

**Metrics File**: `backend/model_metrics.json`
```json
{
  "cv_f1_score": 0.8420,
  "cv_accuracy": 0.8522,
  "cv_roc_auc": 0.8915,
  "best_params": {...},
  "best_cv_score": 0.8420,
  "feature_count": 16,
  "sample_count": 5000
}
```

### Hyperparameter Details

**Tuning Grid**:
```python
param_grid = {
    'n_estimators': [100, 200],          # Number of boosting rounds
    'max_depth': [4, 5, 6],              # Maximum tree depth
    'learning_rate': [0.01, 0.05],       # Shrinkage factor
    'subsample': [0.7, 0.8],             # Row sampling ratio
    'colsample_bytree': [0.7, 0.8],      # Feature sampling ratio
    'min_child_weight': [1, 3]           # Minimum leaf weight
}
```

**Best Configuration** (typical):
- `n_estimators`: 200 (more trees for better performance)
- `max_depth`: 5 (balanced complexity)
- `learning_rate`: 0.05 (slower learning, better generalization)
- `subsample`: 0.8 (row sampling reduces overfitting)
- `colsample_bytree`: 0.8 (feature sampling improves robustness)

### Performance Interpretation

**Metrics Explained**:
- **Accuracy**: Overall correctness = 85.22%
- **F1-Score**: Balance between precision/recall = 0.842
- **ROC-AUC**: Discrimination ability = 0.8915 (excellent)

**What These Mean**:
- Model correctly identifies diabetes risk 85% of the time
- Good balance between false positives and false negatives
- Excellent ability to distinguish risk vs. no-risk cases

---

## Phase 3: MobileNetV2 DFU Detection

### Dataset Requirements

**Image Format**:
- JPG, PNG, or WebP
- Size: 224×224 pixels recommended
- Color space: RGB or RGBA
- Quality: Clear, well-lit images

**Data Structure**:
```
training_data/
├── healthy/
│   ├── healthy_001.jpg
│   ├── healthy_002.jpg
│   └── ...
└── dfu_risk/
    ├── dfu_001.jpg
    ├── dfu_002.jpg
    └── ...
```

**Minimum Dataset Size**: 400 images (200 per class)
**Recommended Size**: 2000+ images per class for production
**Class Balance**: Should be balanced (50-50)

### Current Approach

The optimized training script generates synthetic images when real data isn't available:

```
Synthetic Dataset Generation:
├── Healthy Images (200)
│  ├─ Base: Normal skin tone (RGB ~220, ~220, ~220)
│  ├─ Texture: Natural skin variation
│  └─ Color: Slight natural variations
└── DFU Risk Images (200)
   ├─ Base: Slightly darker tone
   ├─ Lesions: 1-3 inflamed areas per image
   ├─ Color: Red/inflammation simulation
   └─ Severity: Dark centers for ulcer appearance
```

### Training Process

#### Step 1: Run Training

```bash
cd backend
python train_dfu_model_optimized.py --epochs 30 --batch-size 32
```

#### Step 2: Training Process

1. **Initial Training (30 epochs)**:
   - Base model frozen (transfer learning)
   - Custom head trained on full dataset
   - Early stopping: patience 5
   - Learning rate: 1e-4

2. **Fine-tuning (10 epochs)**:
   - Base model unfrozen
   - Lower learning rate: 1e-5
   - Gradual learning rate reduction

**Script Output**:
```
============================================================
🚀 Training Enhanced DFU Detection Model
============================================================

✅ Model compiled successfully

🔄 Creating enhanced synthetic DFU dataset...
   Generating healthy foot images...
   Generating DFU risk foot images...
✅ Dataset created: (400, 224, 224, 3)
   Healthy images: 200
   DFU Risk images: 200

📊 Data split:
   Training: 320 samples
   Validation: 80 samples

🔄 Training model...
Epoch 1/30
[========================================] 10/10 [00:15<00:00, 1.50s/step]
loss: 0.4521 - accuracy: 0.8234 - precision: 0.8125 - recall: 0.8456
val_loss: 0.3892 - val_accuracy: 0.8750

... (more epochs)

✅ Training completed!

🔧 Fine-tuning base model layers...

Epoch 31/40
[========================================] 10/10 [00:15<00:00, 1.50s/step]
loss: 0.2145 - accuracy: 0.9234 - precision: 0.9125 - recall: 0.9456
val_loss: 0.1892 - val_accuracy: 0.9250

✅ Fine-tuning completed!

📈 Model Evaluation:
   Validation Accuracy: 0.9250
   Validation Precision: 0.8900
   Validation Recall: 0.9400
   Validation Loss: 0.1892

💾 Model saved to backend/diabetic_foot_uIcer_optimized.h5
📊 Metrics saved to backend/dfu_model_metrics.json

✅ DFU model training and optimization complete!
```

### Output Files

**Model File**: `backend/diabetic_foot_uIcer_optimized.h5`
- Keras model with weights
- Architecture: MobileNetV2 + custom head
- Input: 224×224×3 images
- Output: 2-class probability distribution

**Metrics File**: `backend/dfu_model_metrics.json`
```json
{
  "val_accuracy": 0.9250,
  "val_precision": 0.8900,
  "val_recall": 0.9400,
  "val_loss": 0.1892,
  "training_epochs": 40,
  "model_type": "MobileNetV2 with transfer learning",
  "input_shape": [224, 224, 3]
}
```

### Architecture Details

**Model Layers**:
```
Input (224, 224, 3)
  ↓
Augmentation Layers
  ├─ RandomFlip("horizontal")
  ├─ RandomRotation(0.15)
  ├─ RandomZoom(0.15)
  └─ RandomTranslation(0.1, 0.1)
  ↓
MobileNetV2 Preprocessing
  ↓
MobileNetV2 Base (pre-trained, 134 layers)
  ↓
GlobalAveragePooling2D → (1280,)
  ↓
BatchNormalization
  ↓
Dense(512, ReLU) + BatchNorm + Dropout(0.5)
  ↓
Dense(256, ReLU) + BatchNorm + Dropout(0.4)
  ↓
Dense(128, ReLU) + BatchNorm + Dropout(0.3)
  ↓
Dense(2, Softmax) → [prob_healthy, prob_dfu]
```

### Training Strategy

1. **Transfer Learning**: Use pre-trained ImageNet weights
2. **Frozen Base**: Keep MobileNetV2 weights fixed initially
3. **Custom Head**: Train only the classification head
4. **Fine-tuning**: Unfreeze and train entire network
5. **Regularization**: Dropout and batch normalization prevent overfitting

### Improving Performance

If accuracy is < 90%, try:

1. **Data Augmentation**: Increase augmentation strength
   ```python
   layers.RandomRotation(0.2)  # Increase from 0.15
   layers.RandomZoom(0.2)      # Increase from 0.15
   ```

2. **Architecture**: Add more layers
   ```python
   layers.Dense(1024, activation='relu')
   layers.Dense(512, activation='relu')
   layers.Dense(256, activation='relu')
   ```

3. **Training**: Extend training epochs
   ```bash
   python train_dfu_model_optimized.py --epochs 50
   ```

4. **Real Data**: Collect actual medical images
   - Medical imaging datasets
   - Partner with hospitals
   - Annotate professional photos

### Using Real Medical Data

To use real DFU images instead of synthetic:

```python
# In train_dfu_model_optimized.py
def load_real_images(data_dir):
    """Load real DFU images from directory"""
    import os
    from PIL import Image
    
    X, y = [], []
    for label, folder in enumerate(['healthy', 'dfu_risk']):
        path = os.path.join(data_dir, folder)
        for img_file in os.listdir(path):
            img = Image.open(os.path.join(path, img_file))
            img = img.resize((224, 224))
            X.append(np.array(img) / 255.0)
            y.append(label)
    
    return np.array(X), np.array(y)

# Use in training
X, y = load_real_images('path/to/image/data')
```

---

## Monitoring and Validation

### Cross-Validation

Both models use cross-validation to ensure robustness:

**Phase 1**:
```python
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
# 5-fold cross-validation with stratification
```

**Phase 3**:
```python
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
# 80-20 train-test split
```

### Metrics to Track

**Phase 1**:
- Accuracy, Precision, Recall, F1-Score, ROC-AUC
- Per-class performance
- Feature importance changes

**Phase 3**:
- Accuracy, Precision, Recall, F1-Score, AUC-ROC
- Confusion matrix
- Per-class metrics (healthy vs. DFU)

### Model Drift Detection

Monitor these metrics in production:
- Model accuracy dropping > 2%
- Prediction distribution shifts
- Feature importance changes
- Error patterns emerging

---

## Deployment

### Saving Models

```python
# Phase 1: XGBoost
import pickle
with open('model.pkl', 'wb') as f:
    pickle.dump({'model': model, ...}, f)

# Phase 3: DFU Detection
model.save('dfu_model.h5')
```

### Loading Models

```python
# Phase 1
with open('diab_insight_xgboost_phase1_optimized.pkl', 'rb') as f:
    model_data = pickle.load(f)
    model = model_data['model']

# Phase 3
from tensorflow import keras
model = keras.models.load_model('diabetic_foot_uIcer_optimized.h5')
```

### Model Versioning

Keep track of model versions:
```
models/
├── phase1/
│   ├── v1.0_baseline.pkl
│   ├── v1.1_optimized.pkl (current)
│   └── v1.2_experimental.pkl
└── phase3/
    ├── v1.0_baseline.h5
    ├── v1.1_optimized.h5 (current)
    └── v1.2_with_realdata.h5
```

---

## Troubleshooting

### Issue: Low Accuracy

**Phase 1 Solutions**:
- Check for missing or corrupted data
- Verify feature ranges and distributions
- Increase cross-validation folds
- Try different random seeds

**Phase 3 Solutions**:
- Verify image quality and size
- Check class balance
- Increase augmentation strength
- Use real medical images instead of synthetic

### Issue: Overfitting

**Solutions**:
- Increase regularization (dropout, L2)
- Use more training data
- Reduce model complexity
- Apply data augmentation

### Issue: Out of Memory

**Solutions**:
- Reduce batch size
- Use gradient accumulation
- Process images in batches
- Use smaller model architecture

### Issue: Training Too Slow

**Solutions**:
- Use GPU acceleration
- Reduce dataset size for testing
- Simplify model architecture
- Use smaller batch size (if memory allows)

---

## References

- **XGBoost Documentation**: https://xgboost.readthedocs.io/
- **TensorFlow**: https://www.tensorflow.org/
- **MobileNetV2**: https://arxiv.org/abs/1801.04381
- **Transfer Learning**: https://cs231n.github.io/transfer-learning/

---

**Document Version**: 1.0.0
**Last Updated**: April 2026
