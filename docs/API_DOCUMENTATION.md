# 📡 API Documentation - DIABINSIGHT

## Base URL

```
Development: http://localhost:8000
Production: https://diabinsight.com/api
```

## Authentication

Currently uses no authentication (development mode).

**Production Implementation**:
```
Authorization: Bearer {JWT_TOKEN}
```

---

## Endpoints Overview

| Phase | Endpoint | Method | Purpose |
|-------|----------|--------|---------|
| Health | `/health` | GET | Service status check |
| **Phase 1** | `/predict-risk` | POST | Predict diabetes risk |
| **Phase 2** | `/recommendations` | GET | Get lifestyle recommendations |
| **Phase 3** | `/detect-dfu` | POST | Detect foot ulcers |
| **Phase 4** | `/sensor-data` | POST | Submit IoT sensor readings |

---

## 1️⃣ Health Check Endpoint

### `GET /health`

Check if the API service and models are available.

**Request**:
```bash
curl http://localhost:8000/health
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "service": "Diab-Insight Phase 1, 2, & 3 API",
  "model_loaded": true,
  "dfu_detector_loaded": true
}
```

**Status Codes**:
- `200 OK`: Service is running
- `503 Service Unavailable`: Models not loaded

---

## 2️⃣ Phase 1: Diabetes Risk Prediction

### `POST /predict-risk`

Predict diabetes risk based on 12 health parameters.

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "age": 45,
  "gender": "Male",
  "family_history_diabetes": 1,
  "hypertension_history": 0,
  "cardiovascular_history": 0,
  "smoking_status": "Never",
  "bmi": 27.5,
  "sleep_hours_per_day": 7.0,
  "physical_activity_minutes_per_week": 150,
  "screen_time_hours_per_day": 6.0,
  "diet_score": 7.2,
  "alcohol_consumption_per_week": 2
}
```

**Request Parameters**:

| Field | Type | Required | Description | Range |
|-------|------|----------|-------------|-------|
| age | float | Yes | Age in years | 18-100 |
| gender | string | Yes | M/Male or F/Female | "Male", "Female" |
| family_history_diabetes | int | Yes | Family history of diabetes | 0-1 (binary) |
| hypertension_history | int | Yes | History of high blood pressure | 0-1 (binary) |
| cardiovascular_history | int | Yes | History of heart disease | 0-1 (binary) |
| smoking_status | string | Yes | Current smoking status | "Never", "Former", "Current" |
| bmi | float | Yes | Body Mass Index | 15.0-60.0 |
| sleep_hours_per_day | float | Yes | Average sleep per night | 3.0-12.0 |
| physical_activity_minutes_per_week | float | Yes | Weekly exercise in minutes | 0-1000 |
| screen_time_hours_per_day | float | Yes | Daily screen exposure in hours | 0-24 |
| diet_score | float | Yes | Diet quality score (1-10) | 1.0-10.0 |
| alcohol_consumption_per_week | float | Yes | Alcoholic drinks per week | 0-50 |

**Response** (200 OK):
```json
{
  "risk_category": "Moderate",
  "calculated_probability": 0.65,
  "at_risk_flag": true,
  "message": "Your diabetes risk is elevated. Consider lifestyle modifications.",
  "confidence": 0.87
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| risk_category | string | "Low", "Moderate", or "High" |
| calculated_probability | float | Risk probability (0.0-1.0) |
| at_risk_flag | boolean | True if risk >= 0.5 |
| message | string | Human-readable assessment |
| confidence | float | Model confidence (0.0-1.0) |

**Risk Categories**:
- **Low** (< 0.33): Implement preventative measures
- **Moderate** (0.33-0.66): Consider lifestyle changes
- **High** (> 0.66): Seek medical consultation

**Error Responses**:

```json
// 400 Bad Request - Invalid input
{
  "detail": "age must be between 18 and 100"
}

// 500 Internal Server Error - Model not loaded
{
  "detail": "Model not loaded"
}
```

**Example cURL**:
```bash
curl -X POST http://localhost:8000/predict-risk \
  -H "Content-Type: application/json" \
  -d '{
    "age": 45,
    "gender": "Male",
    "family_history_diabetes": 1,
    "hypertension_history": 0,
    "cardiovascular_history": 0,
    "smoking_status": "Never",
    "bmi": 27.5,
    "sleep_hours_per_day": 7.0,
    "physical_activity_minutes_per_week": 150,
    "screen_time_hours_per_day": 6.0,
    "diet_score": 7.2,
    "alcohol_consumption_per_week": 2
  }'
```

**Example Python**:
```python
import requests

url = "http://localhost:8000/predict-risk"
payload = {
    "age": 45,
    "gender": "Male",
    "family_history_diabetes": 1,
    "hypertension_history": 0,
    "cardiovascular_history": 0,
    "smoking_status": "Never",
    "bmi": 27.5,
    "sleep_hours_per_day": 7.0,
    "physical_activity_minutes_per_week": 150,
    "screen_time_hours_per_day": 6.0,
    "diet_score": 7.2,
    "alcohol_consumption_per_week": 2
}

response = requests.post(url, json=payload)
result = response.json()
print(f"Risk: {result['risk_category']}")
print(f"Probability: {result['calculated_probability']:.1%}")
```

---

## 2️⃣ Phase 2: Recommendations

### `GET /recommendations`

Get personalized recommendations based on risk score and features.

**Request Parameters**:

```
GET /recommendations?risk_score=0.65&focus_areas=diet,activity
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| risk_score | float | Yes | Risk score from Phase 1 (0.0-1.0) |
| focus_areas | string | No | Comma-separated focus areas |

**Response** (200 OK):
```json
{
  "recommendations": [
    {
      "category": "Diet",
      "priority": "High",
      "title": "Reduce Simple Carbohydrates",
      "description": "Limit intake of white bread, sugary drinks, and processed foods.",
      "action_items": [
        "Replace white rice with brown rice",
        "Drink water instead of sugary beverages",
        "Choose whole grain bread",
        "Limit desserts to 2-3 times per week"
      ]
    },
    {
      "category": "Exercise",
      "priority": "High",
      "title": "Increase Physical Activity",
      "description": "Aim for 150 minutes of moderate aerobic activity per week.",
      "action_items": [
        "Start with 30 minutes of brisk walking daily",
        "Add strength training 2-3 times per week",
        "Reduce sedentary time by standing more often",
        "Join a fitness class or sports activity"
      ]
    }
  ],
  "deficiencies": [
    "Low physical activity",
    "Poor diet quality"
  ],
  "strengths": [
    "Good sleep duration",
    "No smoking history"
  ],
  "total_recommendations": 8,
  "priority_focus": "Exercise and Diet"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| recommendations | array | List of recommendation objects |
| category | string | Recommendation category (Diet, Exercise, Lifestyle, Medical) |
| priority | string | "Low", "Medium", "High", "Critical" |
| title | string | Short recommendation title |
| description | string | Detailed explanation |
| action_items | array | Specific actionable steps |
| deficiencies | array | Identified weak areas |
| strengths | array | Positive lifestyle factors |
| total_recommendations | int | Total number of recommendations |
| priority_focus | string | Primary area to focus on |

**Example cURL**:
```bash
curl "http://localhost:8000/recommendations?risk_score=0.65"
```

---

## 3️⃣ Phase 3: DFU Detection

### `POST /detect-dfu`

Analyze a foot image for Diabetic Foot Ulcer risk.

**Request Headers**:
```
Content-Type: multipart/form-data
```

**Request Body**:
```
file: <image file> (JPG, PNG, or WEBP)
```

**Request Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Foot image (max 10MB) |
| image_quality | string | No | "auto" (default), "low", "medium", "high" |

**Response** (200 OK):
```json
{
  "dfu_detected": true,
  "risk_level": "Moderate",
  "confidence": 0.87,
  "affected_area": {
    "x": 120,
    "y": 150,
    "width": 80,
    "height": 100,
    "severity_score": 0.72
  },
  "recommendations": "Consult a podiatrist immediately. Keep the area clean and dry.",
  "next_steps": [
    "Schedule appointment with podiatrist within 1 week",
    "Monitor the affected area daily",
    "Maintain proper foot hygiene",
    "Avoid tight shoes",
    "Apply prescribed medication if available"
  ]
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| dfu_detected | boolean | DFU risk detected (true/false) |
| risk_level | string | "Low", "Moderate", "High" |
| confidence | float | Model confidence (0.0-1.0) |
| affected_area | object | Location and severity of detected area |
| affected_area.x | int | X-coordinate of affected region |
| affected_area.y | int | Y-coordinate of affected region |
| affected_area.width | int | Width of affected region |
| affected_area.height | int | Height of affected region |
| affected_area.severity_score | float | Severity score (0.0-1.0) |
| recommendations | string | Recommended actions |
| next_steps | array | Specific next steps |

**Supported Image Formats**:
- JPG/JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- Max file size: 10 MB
- Recommended resolution: 512×512 or higher
- Format: RGB or RGBA

**Example cURL**:
```bash
curl -X POST http://localhost:8000/detect-dfu \
  -F "file=@foot_image.jpg"
```

**Example Python**:
```python
import requests

url = "http://localhost:8000/detect-dfu"
files = {"file": open("foot_image.jpg", "rb")}

response = requests.post(url, files=files)
result = response.json()

print(f"DFU Detected: {result['dfu_detected']}")
print(f"Risk Level: {result['risk_level']}")
print(f"Confidence: {result['confidence']:.1%}")
print(f"Affected Area: {result['affected_area']}")
```

**Error Responses**:

```json
// 400 Bad Request - No file provided
{
  "detail": "No file provided"
}

// 413 Payload Too Large - File exceeds size limit
{
  "detail": "File size exceeds 10MB limit"
}

// 415 Unsupported Media Type - Invalid image format
{
  "detail": "File format not supported. Use JPG, PNG, or WebP"
}

// 500 Internal Server Error - Model not loaded
{
  "detail": "DFU detector not loaded"
}
```

---

## 4️⃣ Phase 4: Sensor Data (Future)

### `POST /sensor-data`

Submit IoT sensor readings from smart insole.

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

**Request Body**:
```json
{
  "user_id": "user123",
  "device_id": "insole_001",
  "readings": [
    {
      "timestamp": "2024-04-19T10:30:00Z",
      "pressure_kpa": 45.2,
      "temperature_celsius": 31.5,
      "moisture_percent": 65.0
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "status": "accepted",
  "readings_stored": 1,
  "risk_assessment": {
    "current_risk": "Low",
    "alert_triggered": false,
    "recommendations": "Normal foot condition detected"
  }
}
```

---

## Rate Limiting

Currently no rate limits (development mode).

**Production Implementation**:
- 100 requests per minute per user
- 1000 requests per minute per API key
- Burst limit: 20 requests per 10 seconds

**Response Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1619865000
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid input parameters |
| 413 | Payload Too Large | File exceeds size limit |
| 415 | Unsupported Media Type | Invalid image format |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server/model error |
| 503 | Service Unavailable | Models not loaded |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-04-19T10:30:00Z"
}
```

---

## Testing

### Using Interactive API Docs

Start backend and visit:
```
http://localhost:8000/docs
```

### Using ReDoc

```
http://localhost:8000/redoc
```

### Postman Collection

[Import collection from `/docs/postman_collection.json`]

---

## Best Practices

1. **Input Validation**
   - Always validate user inputs before sending
   - Use appropriate data types and ranges

2. **Error Handling**
   - Implement retry logic for failed requests
   - Log errors for debugging

3. **Performance**
   - Cache predictions when possible
   - Use batch requests for multiple predictions
   - Implement request queuing for DFU detection

4. **Security**
   - Never expose API keys in client-side code
   - Use HTTPS in production
   - Validate and sanitize all inputs

5. **Monitoring**
   - Track API response times
   - Monitor error rates
   - Set up alerts for service unavailability

---

**API Version**: 1.0.0
**Last Updated**: April 2026
**Status**: Production Ready ✅
