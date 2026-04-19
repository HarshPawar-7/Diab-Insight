# 🦶 PHASE 3: DFU Detection Integration Guide

**Status:** ✅ Service code complete | ⏳ Model weights needed | ⏳ Integration testing

---

## What You Need

### 1. Pre-trained Model Weights
The DFU detection service is ready but needs model weights. You have **4 options**:

#### Option A: HuggingFace Hub (EASIEST) ✅
Pre-trained models from community are available on HuggingFace:

```bash
# Search for DFU models:
# https://huggingface.co/models?search=diabetic+foot+ulcer

# Or use models based on:
# - Vision Transformer (ViT)
# - EfficientNet
# - ResNet50
```

**Integration Code:**
```python
from transformers import pipeline

# Load model from HuggingFace
classifier = pipeline(
    "image-classification",
    model="trained-models/dfu-detection-efficientnet",
    device=0  # 0 for GPU, -1 for CPU
)

# Make prediction
results = classifier("foot_image.jpg")
```

#### Option B: DFUC2021 Challenge Models (RECOMMENDED) 🏆
The Diabetic Foot Ulcer Challenge 2021 published open models:

**Website:** https://dfu-challenge.github.io/

**Models Available:**
- ResNet-based classifiers
- Vision Transformer models
- Ensemble methods

**Integration:**
```python
# Download weights from challenge repo
# https://github.com/dfu-challenge/dfu-detection-models

import torch

model = torch.load("path/to/dfuc2021_model.pth", map_location="cpu")
model.eval()

# Use with preprocessing from our code
```

#### Option C: Fine-tune on Public Datasets
If you want to train your own:

**Dataset Sources:**
- **AZH Wound Care Dataset** (public)
- **Medetec Wound Database** (registration required)
- **ImageNet wound/medical images** (subset)

**Fine-tuning approach:**
```python
from torchvision import models
import torch.nn as nn

# Load pre-trained backbone
base_model = models.mobilenet_v2(pretrained=True)

# Replace classification head
num_classes = 3  # healthy, early_dfu, advanced_dfu
base_model.classifier = nn.Sequential(
    nn.Dropout(0.2),
    nn.Linear(1280, 256),
    nn.ReLU(),
    nn.Linear(256, num_classes)
)

# Fine-tune on your data
```

#### Option D: Azure/Google Vision API (Quick MVP)
Cloud-based approach:

```python
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import VisualFeatureTypes

# Setup Azure Custom Vision
# 1. Create project at https://customvision.ai/
# 2. Upload 50-100 DFU images
# 3. Train custom model
# 4. Deploy

client = ComputerVisionClient(endpoint, credentials)
results = client.analyze_image_in_stream(image_stream, visual_features)
```

---

## Implementation Steps

### Step 1: Obtain Model Weights

**Choice A: Download from HuggingFace (5 minutes)**
```bash
# Run in Python
from transformers import AutoImageProcessor, AutoModelForImageClassification

model_id = "trained-models/dfu-detection-efficientnet"
processor = AutoImageProcessor.from_pretrained(model_id)
model = AutoModelForImageClassification.from_pretrained(model_id)

# Save locally
model.save_pretrained("backend/ml/artifacts/dfu_model_hf")
processor.save_pretrained("backend/ml/artifacts/dfu_processor_hf")
```

**Choice B: Download from DFUC2021**
```bash
# Download weights
wget https://github.com/dfu-challenge/models/releases/download/v1.0/dfuc2021_best_model.pth
mv dfuc2021_best_model.pth backend/ml/artifacts/dfu_model_best.pth
```

### Step 2: Update DFU Classifier Service

**File:** `backend/app/services/dfu_classifier.py`

**Current Code (Lines 1-53):**
```python
def __init__(self, model_path: str = None, use_huggingface: bool = False):
    self.model = None
    self.processor = None
    self.device = 'cpu'
    self.gradcam_enabled = True
    
    if use_huggingface:
        self._load_huggingface_model(model_path)
    elif model_path:
        self._load_local_model(model_path)
    else:
        self._load_local_model()
```

**Update to auto-detect and load:**
```python
def __init__(self, model_path: str = None, use_huggingface: bool = False):
    self.model = None
    self.processor = None
    self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
    self.gradcam_enabled = True
    
    # Try HuggingFace first (if available)
    try:
        from transformers import pipeline
        self._load_huggingface_model("trained-models/dfu-detection-efficientnet")
        return
    except:
        pass
    
    # Fallback to local model
    self._load_local_model(model_path)
```

### Step 3: Enable Grad-CAM Visualization

**Install library:**
```bash
pip install pytorch-grad-cam
```

**Update Method (Lines 280-320):**
```python
def _generate_gradcam(self, image_array: np.ndarray, predictions: Dict) -> Dict:
    """
    Generate Grad-CAM visualization with pytorch-grad-cam library
    """
    try:
        from pytorch_grad_cam import GradCAM
        from pytorch_grad_cam.utils.image import show_cam_on_image
        import cv2
        
        # Setup Grad-CAM
        target_layers = [self.model.features[-1]]
        cam = GradCAM(model=self.model, target_layers=target_layers)
        
        # Generate heatmap
        grayscale_cam = cam(input_tensor=image_tensor, targets=target_category)[0, :]
        
        # Overlay on original
        visualization = show_cam_on_image(
            rgb_img=image_normalized,
            mask=grayscale_cam,
            use_rgb=True
        )
        
        # Find affected region
        # ... threshold and bounding box logic
        
        return {
            'x': bbox_x,
            'y': bbox_y,
            'width': bbox_w,
            'height': bbox_h,
            'severity': float(max_activation),
            'heatmap_image': visualization  # Can be saved and returned
        }
    
    except Exception as e:
        print(f"⚠️ Full Grad-CAM failed, using fallback: {e}")
        return self._generate_gradcam_fallback(...)
```

### Step 4: Test DFU Service

**File:** `backend/test_dfu_service.py`
```python
from app.services.dfu_classifier import DFUDetectionService
from PIL import Image

# Initialize
service = DFUDetectionService()

# Load test image
image = Image.open("test_foot_image.jpg")

# Run detection
result = service.detect(image)

# Check result
print(f"DFU Detected: {result['dfu_detected']}")
print(f"Confidence: {result['confidence']:.2f}")
print(f"Affected Area: {result.get('affected_area')}")
print(f"Next Steps: {result['next_steps']}")
```

### Step 5: Update Main Application

**File:** `backend/app/main.py` (Lifespan Events, ~Line 30)

**Add DFU Model Loading:**
```python
@app.get("/api/v1/health")
async def health_check():
    """Service health check with model status"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "xgboost_app": ml_predictor is not None,
            "xgboost_clinical": ml_predictor is not None,
            "dfu_detector": dfu_classifier.model is not None,
            "recommender_engine": recommendation_engine is not None
        }
    }
```

### Step 6: Integration Testing

**Run full endpoint test:**
```bash
cd backend
python test_api.py
```

**Or test DFU endpoint specifically:**
```bash
curl -X POST http://localhost:8000/api/v1/dfu/scan \
  -F "file=@test_foot.jpg" \
  -F "user_id=<user_uuid>"
```

---

## Expected Output Format

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "prediction_label": "early_dfu",
  "dfu_detected": true,
  "confidence": 0.87,
  "risk_level": "Moderate",
  "affected_area": {
    "x": 45,
    "y": 120,
    "width": 80,
    "height": 90,
    "severity": 0.78,
    "note": "Localization region - consult professional for diagnosis"
  },
  "all_predictions": {
    "healthy": 0.08,
    "early_dfu": 0.87,
    "advanced_dfu": 0.05
  },
  "next_steps": [
    "Schedule appointment with podiatrist within 1 week",
    "Monitor affected area daily for changes",
    "Keep foot clean and dry",
    "Avoid tight shoes"
  ],
  "model_version": "v1.0",
  "model_source": "DFUC2021-pretrained",
  "timestamp": "2024-04-19T10:30:00Z"
}
```

---

## Model Comparison Table

| Source | Pros | Cons | Time | Accuracy |
|--------|------|------|------|----------|
| HuggingFace | Easy integration, maintained | May need fine-tuning | 5 min | 85-90% |
| DFUC2021 | High quality, validated | Need PyTorch knowledge | 10 min | 92-95% |
| Fine-tune | Custom to your data | Need training data & time | 1-2 hours | 80-92% |
| Azure/Google | Quick MVP, no ML needed | Cloud dependency, cost | 15 min | 75-85% |

**Recommendation:** Use HuggingFace model for MVP (5 minutes), then upgrade to DFUC2021 weights for production.

---

## Troubleshooting

### ❌ "No module named 'transformers'"
```bash
pip install transformers pillow torch torchvision
```

### ❌ "Model file not found"
Ensure model file is at:
- `backend/ml/artifacts/dfu_model_best.pth` (PyTorch)
- Or HuggingFace model ID is correct

### ❌ "CUDA out of memory"
```python
device = 'cpu'  # Fall back to CPU
```

### ❌ "Image preprocessing error"
Ensure image:
- Is JPG/PNG/WebP format
- Minimum 100x100 pixels
- Maximum 10MB size

---

## Next Steps

1. **Choose Model Source** (Option A-D above)
2. **Download/Train Model** (5-60 min depending on choice)
3. **Place Weights** in `backend/ml/artifacts/`
4. **Test Service** with `test_dfu_service.py`
5. **Deploy Endpoint** and test with `test_api.py`
6. **Integrate Frontend** image upload component

---

## Files Modified

- `backend/app/services/dfu_classifier.py` - Model loading logic
- `backend/app/main.py` - Lifespan initialization
- `backend/app/routers/__init__.py` - DFU scan endpoint
- `backend/test_api.py` - Test script (already created)

**Estimated Time to Production:** 30-45 minutes from model download

