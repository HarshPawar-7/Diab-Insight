# 🏗️ DIABINSIGHT System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│              React + Vite + Responsive UI                    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Phase 1    │  │   Phase 2    │  │   Phase 3    │       │
│  │  Risk Form   │  │  Recom Panel │  │  Image Upld  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                        │
│                   FastAPI + Uvicorn                          │
│                  CORS Enabled • Load Balanced                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Phase 1: Predictive Behavioral Modeling              │   │
│  │ ├─ Feature Engineering Module                        │   │
│  │ ├─ XGBoost Risk Classifier                          │   │
│  │ └─ Risk Score Calculator                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Phase 2: Recommendation Engine                       │   │
│  │ ├─ Rule-Based Pathway Generator                      │   │
│  │ ├─ Nutritional Database                             │   │
│  │ └─ Exercise Recommendation Mapper                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Phase 3: Computer Vision DFU Detection              │   │
│  │ ├─ Image Preprocessing Module                        │   │
│  │ ├─ MobileNetV2 CNN Classifier                       │   │
│  │ ├─ Localization & Heatmap Generator                 │   │
│  │ └─ Risk Assessment Mapper                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Phase 4: Hardware IoT Integration (Future)          │   │
│  │ ├─ Sensor Data Aggregation                          │   │
│  │ ├─ Real-time Monitoring Pipeline                    │   │
│  │ └─ Alert Generation System                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Models    │  │   Datasets   │  │  Caches &    │       │
│  │  (Weights)   │  │              │  │  Logs        │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  [PostgreSQL / Supabase - Production Ready]                 │
│  [CSV Files - Development]                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Phase 1: Predictive Behavioral Modeling

**Purpose**: Longitudinal diabetes risk assessment using 7-day lifestyle data

**Technology Stack**:
- **ML Framework**: XGBoost
- **Preprocessing**: scikit-learn pipelines
- **Validation**: Stratified K-Fold cross-validation

**Data Flow**:
```
User Input (12 features)
    ↓
Feature Engineering (creates 4 derived features)
    ↓
Standardization & Normalization
    ↓
XGBoost Classifier
    ↓
Risk Score (0-1 probability)
    ↓
Risk Category (Low/Moderate/High)
```

**Key Metrics**:
- Features: 16 (12 original + 4 engineered)
- Model Accuracy: 85.2%
- F1-Score: 0.842
- ROC-AUC: 0.891

**API Endpoint**: `POST /predict-risk`

---

### Phase 2: Lifestyle & Nutritional Recommendations

**Purpose**: Generate personalized interventions based on risk assessment

**Technology Stack**:
- **Framework**: Python rule-based system
- **Data Source**: Nutritional database
- **Delivery**: REST API

**Data Flow**:
```
Risk Score & Feature Analysis
    ↓
Identify Deficiencies
    ↓
Match Deficiencies to Recommendations
    ↓
Prioritize by Impact
    ↓
Return Actionable Recommendations
    ↓
Generate Action Items
```

**Output Categories**:
1. **Dietary**: Specific food recommendations, macronutrient targets
2. **Exercise**: Tailored workout plans, intensity levels
3. **Lifestyle**: Sleep, stress management, hydration
4. **Medical**: When to seek professional help

**API Endpoint**: `GET /recommendations?risk_score={score}`

---

### Phase 3: Computer Vision DFU Detection

**Purpose**: Early detection of Diabetic Foot Ulcers from images

**Technology Stack**:
- **Base Model**: MobileNetV2 (pre-trained on ImageNet)
- **Framework**: TensorFlow/Keras
- **Input**: 224×224×3 RGB images
- **Approach**: Transfer learning + fine-tuning

**Model Architecture**:
```
Input (224×224×3)
    ↓
Data Augmentation Layer
    ├─ Random Flip (H)
    ├─ Random Rotation (±15°)
    ├─ Random Zoom (±15%)
    └─ Random Translation (±10%)
    ↓
Preprocessing (MobileNetV2)
    ↓
Base Model (MobileNetV2 - Frozen)
    │
    ├─ [Conv Blocks with Residual Connections]
    │
    ↓
Global Average Pooling
    ↓
Custom Classification Head
    ├─ Dense 512 (ReLU) + Batch Norm + Dropout(0.5)
    ├─ Dense 256 (ReLU) + Batch Norm + Dropout(0.4)
    ├─ Dense 128 (ReLU) + Batch Norm + Dropout(0.3)
    ↓
Dense 2 (Softmax) → [Healthy, DFU Risk]
```

**Performance Metrics**:
- Accuracy: 92.5%
- Precision: 0.89
- Recall: 0.94
- Input Images: 400 synthetic (200 healthy + 200 DFU)

**Training Strategy**:
1. **Phase 1**: Train with frozen base (10 epochs)
   - Learning rate: 1e-4
   - Optimizer: Adam
   - Loss: Sparse Categorical Crossentropy

2. **Phase 2**: Fine-tune with unfrozen base (10 epochs)
   - Learning rate: 1e-5
   - Early stopping: patience 5
   - Learning rate reduction: factor 0.5, patience 3

**API Endpoint**: `POST /detect-dfu` (multipart/form-data)

---

### Phase 4: Hardware IoT Integration (Prototype)

**Purpose**: Real-time monitoring with smart insole sensors

**Sensors**:
1. **Pressure Sensors** (FSR - Force Sensitive Resistors)
   - Detects abnormal weight distribution
   - Peak plantar pressure areas mapped

2. **Temperature Sensors** (DHT22)
   - Measures localized inflammation
   - Baseline vs. elevated detection

3. **Moisture Sensors** (Capacitive)
   - Skin integrity assessment
   - Sweat and moisture tracking

**Data Pipeline**:
```
Arduino/ESP32 Microcontroller
    ├─ Pressure Data (Analog → Digital)
    ├─ Temperature Data (Digital)
    └─ Moisture Data (Capacitive)
    ↓
Serial/WiFi Communication
    ↓
Backend Processing
    ├─ Normalization
    ├─ Anomaly Detection
    └─ Risk Calculation
    ↓
Database Storage
    ↓
Dashboard Visualization
    ↓
Alert System
```

---

## Database Schema (Production)

```sql
-- Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Phase 1: Daily Assessment Data
CREATE TABLE daily_assessments (
    assessment_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    assessment_date DATE,
    age INTEGER,
    bmi FLOAT,
    physical_activity_minutes INTEGER,
    sleep_hours FLOAT,
    diet_score FLOAT,
    ... (other features)
    created_at TIMESTAMP
);

-- Phase 1: Risk Scores
CREATE TABLE risk_assessments (
    risk_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    risk_score FLOAT,
    risk_category VARCHAR(20),
    features_version INTEGER,
    model_version VARCHAR(50),
    created_at TIMESTAMP
);

-- Phase 2: Recommendations
CREATE TABLE recommendations (
    rec_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    risk_id UUID REFERENCES risk_assessments,
    category VARCHAR(50),
    priority VARCHAR(20),
    title VARCHAR(255),
    description TEXT,
    action_items JSON,
    created_at TIMESTAMP
);

-- Phase 3: DFU Detections
CREATE TABLE dfu_detections (
    detection_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    image_path VARCHAR(500),
    dfu_detected BOOLEAN,
    risk_level VARCHAR(20),
    confidence FLOAT,
    affected_area JSON,
    model_version VARCHAR(50),
    created_at TIMESTAMP
);

-- Phase 4: Sensor Data (Future)
CREATE TABLE sensor_readings (
    reading_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    pressure_mpa FLOAT,
    temperature_celsius FLOAT,
    moisture_percent FLOAT,
    timestamp TIMESTAMP
);
```

---

## Deployment Architecture

### Development
```
Local Machine
├─ Backend (FastAPI) on 8000
├─ Frontend (Vite) on 5173
└─ Local CSV datasets
```

### Production
```
Docker Containers
├─ Backend Service
│  ├─ FastAPI + Gunicorn
│  ├─ Model weights
│  └─ Environment config
├─ Frontend Service
│  ├─ Nginx/Vercel
│  └─ Optimized build
└─ Database
   ├─ PostgreSQL/Supabase
   └─ Image storage (S3)
```

---

## Security Considerations

1. **Data Encryption**
   - TLS for all API communications
   - Encrypted patient data at rest
   - HIPAA-compliant storage

2. **Authentication**
   - JWT tokens for API access
   - OAuth 2.0 for user authentication
   - Role-based access control (RBAC)

3. **Rate Limiting**
   - API rate limits per user
   - DDoS protection
   - Request validation

4. **Model Security**
   - Model versioning and integrity checks
   - Input validation before model inference
   - Output sanitization

---

## Performance Optimization

### Phase 1 (XGBoost)
- **Latency**: < 50ms
- **Memory**: ~50MB (model weights)
- **Throughput**: 100+ predictions/second

### Phase 3 (DFU Detection)
- **Latency**: < 2 seconds (GPU), ~4 seconds (CPU)
- **Memory**: ~80MB (model weights)
- **Throughput**: 5-10 images/second per GPU

### Optimization Strategies
1. Model quantization for edge deployment
2. Batch processing for high throughput
3. Caching prediction results
4. Asynchronous processing for long-running tasks

---

## Monitoring & Logging

```
Application Layer
├─ Request/Response logging
├─ API performance metrics
└─ Error tracking

Model Layer
├─ Prediction confidence monitoring
├─ Model drift detection
└─ Performance metrics tracking

Infrastructure
├─ CPU/Memory usage
├─ API latency
└─ Error rates & alerts
```

---

## Future Enhancements

1. **Real-time Monitoring** (Phase 4 expansion)
   - IoT sensor integration
   - Continuous risk monitoring
   - Predictive alerting

2. **Advanced Analytics**
   - Population-level risk trends
   - Treatment outcome tracking
   - Longitudinal cohort analysis

3. **AI/ML Improvements**
   - Federated learning for privacy
   - Personalized model adaptation
   - Multi-modal data fusion

4. **Clinical Integration**
   - EHR system integration
   - Telemedicine capabilities
   - Clinical trial support

---

**Document Version**: 1.0.0
**Last Updated**: April 2026
