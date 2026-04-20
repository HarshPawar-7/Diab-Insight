"""
DFU (Diabetic Foot Ulcer) Detection Service - Gemini Vision Clinical Specialist
Pure Gemini-based detection with clinical specialist prompting
Provides ulcer detection, classification, and severity scoring
Advanced preprocessing for medical imaging optimization
"""

import numpy as np
from pathlib import Path
from typing import Dict, Optional, List
from PIL import Image, ImageEnhance, ImageFilter
import io
import warnings
import base64
import os
warnings.filterwarnings('ignore')

# Gemini Vision API - Primary detection system
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    print("❌ google-generativeai not installed. Install with: pip install google-generativeai")
    print("   Gemini Vision is REQUIRED for DFU detection.")


class DFUClassifier:
    """
    Diabetic Foot Ulcer Detection using Google Gemini Vision - Clinical Specialist Mode
    
    Strategy:
    - Google Gemini Vision 1.5 as primary clinical specialist
    - Advanced medical prompting for expert-level diagnosis
    - Ulcer severity classification and scoring
    - Medical-grade confidence and clinical assessment
    
    Diagnosis Categories:
    - healthy: No ulcer detected
    - early_dfu: Early stage diabetic foot ulcer (small, superficial)
    - advanced_dfu: Advanced/severe diabetic foot ulcer (large, deep, infected)
    
    Severity Score: 0.0-1.0
    - 0.0: Healthy
    - 0.1-0.4: Early DFU (mild)
    - 0.4-0.7: Moderate DFU
    - 0.7-1.0: Advanced/Severe DFU
    """
    
    LABEL_MAP = {
        "healthy": "healthy",
        "early_dfu": "early_dfu",
        "advanced_dfu": "advanced_dfu"
    }
    
    SEVERITY_LEVELS = {
        "healthy": 0.0,
        "early_dfu": 0.5,
        "advanced_dfu": 1.0
    }
    
    SUPPORTED_FORMATS = {'jpg', 'jpeg', 'png', 'webp', 'bmp'}
    
    def __init__(self, model_name: str = "gemini", device: str = None, use_ensemble: bool = True):
        """
        Initialize DFU classifier with Gemini Vision clinical specialist
        
        Args:
            model_name: Model identifier (ignored - uses Gemini only)
            device: Device setting (ignored - Gemini is cloud-based)
            use_ensemble: Always True - Gemini is the only model
        """
        self.model_name = "gemini-vision-clinical"
        self.device = "cloud"
        self.use_gemini = True
        
        self.gemini_model = None
        self.current_model_name = None  # Track which model is actually working
        
        print(f"🔧 Initializing DFU Classifier - Gemini Vision Clinical Specialist")
        print(f"   Model: Gemini Cloud (Multimodal)")
        print(f"   Mode: Clinical Expert Diagnosis with Severity Scoring")
        
        self._initialize_gemini()
    
    def _initialize_gemini(self):
        """Initialize Gemini Vision API as clinical specialist"""
        if not HAS_GEMINI:
            print(f"❌ google-generativeai required. Install with: pip install google-generativeai")
            return
        
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                print(f"❌ GEMINI_API_KEY environment variable not set")
                print(f"   Add GEMINI_API_KEY to your .env file")
                return
            
            genai.configure(api_key=api_key)
            # Try latest models first - they all support multimodal vision
            models_to_try = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-pro-latest", "gemini-flash-latest"]
            
            for model_name in models_to_try:
                try:
                    self.gemini_model = genai.GenerativeModel(model_name)
                    print(f"✅ Gemini initialized with: {model_name}")
                    print(f"   Ready for clinical DFU diagnosis (multimodal vision enabled)")
                    self.current_model_name = model_name
                    return
                except Exception as model_err:
                    print(f"   ⚠️  {model_name} not available, trying next...")
                    continue
            
            print(f"❌ No suitable Gemini models available")
            self.gemini_model = None
            
        except Exception as e:
            print(f"❌ Failed to initialize Gemini: {e}")
    
    def preprocess_image(self, image_input) -> Image.Image:
        """
        Preprocess image with medical imaging optimizations
        
        Optimizations for DFU detection:
        - Resize to standard medical dimensions
        - Enhance contrast for ulcer boundary visibility
        - Apply brightness adjustment
        - Light sharpening for edge enhancement
        - Normalize for Gemini Vision input
        
        Args:
            image_input: PIL Image, numpy array, file path, or bytes
            
        Returns:
            PIL Image (RGB, optimized for medical analysis)
        """
        try:
            # Load image
            if isinstance(image_input, str):
                img = Image.open(image_input)
            elif isinstance(image_input, bytes):
                img = Image.open(io.BytesIO(image_input))
            elif isinstance(image_input, np.ndarray):
                img = Image.fromarray(image_input.astype(np.uint8))
            else:
                img = image_input
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to standard dimension (maintain aspect ratio with padding if needed)
            # Standard is 1024x1024 for Gemini Vision optimal analysis
            img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
            
            # MEDICAL IMAGE OPTIMIZATION: Enhance contrast for better DFU visibility
            # Critical for detecting subtle ulcer characteristics
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.6)  # Increase contrast by 60%
            
            # Enhance brightness for better visibility
            brightness_enhancer = ImageEnhance.Brightness(img)
            img = brightness_enhancer.enhance(1.15)  # 15% brightness boost
            
            # Enhance color saturation to highlight skin variations
            color_enhancer = ImageEnhance.Color(img)
            img = color_enhancer.enhance(1.2)  # 20% saturation increase
            
            # Apply light sharpening to enhance edges (ulcer boundaries)
            img = img.filter(ImageFilter.SHARPEN)
            
            return img
        
        except Exception as e:
            print(f"⚠️  Preprocessing failed: {e}. Using original image.")
            if isinstance(image_input, Image.Image):
                return image_input
            else:
                return Image.new('RGB', (512, 512))
    
    def predict(self, image_input) -> Dict:
        """
        Diagnose DFU status using Gemini Vision clinical specialist
        
        Strategy:
        1. Preprocess image with medical imaging optimizations
        2. Send to Gemini with clinical specialist prompt
        3. Parse medical diagnosis with severity scoring
        4. Return comprehensive clinical assessment
        
        Args:
            image_input: PIL Image, numpy array, file path, or bytes
            
        Returns:
            {
                'prediction_label': 'healthy' | 'early_dfu' | 'advanced_dfu',
                'confidence': 0.0-1.0,
                'severity_score': 0.0-1.0,  (NEW: Ulcer severity rating)
                'dfu_detected': bool,
                'clinical_assessment': str,  (NEW: Clinical notes)
                'probabilities': {...},
                'model_version': 'gemini_clinical_v1.0',
                'affected_area': str  (NEW: Affected area description)
            }
        """
        if not self.gemini_model:
            return {
                'error': 'Gemini model not initialized',
                'prediction_label': 'healthy',
                'confidence': 0.0,
                'severity_score': 0.0,
                'dfu_detected': False
            }
        
        try:
            # Preprocess with medical imaging optimizations
            image = self.preprocess_image(image_input)
            
            # Get Gemini diagnosis with clinical specialist prompting
            diagnosis_result = self._get_gemini_clinical_diagnosis(image)
            
            # Handle error responses
            if diagnosis_result and 'error' in diagnosis_result:
                return diagnosis_result
            
            if not diagnosis_result:
                raise Exception("Gemini diagnosis failed")
            
            return diagnosis_result
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"❌ Prediction failed: {e}")
            
            # Check if it's a quota error
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                return {
                    'error': 'quota_limit',
                    'message': 'API quota exceeded. Please try again in a moment or upgrade your plan.',
                    'prediction_label': 'healthy',
                    'confidence': 0.0,
                    'severity_score': 0.0,
                    'dfu_detected': False
                }
            
            return {
                'error': str(e),
                'prediction_label': 'healthy',
                'confidence': 0.0,
                'severity_score': 0.0,
                'dfu_detected': False
            }
    
    def _get_gemini_clinical_diagnosis(self, image: Image.Image) -> Dict:
        """
        Get comprehensive DFU diagnosis from Gemini as clinical specialist
        
        Returns:
            Complete diagnosis with severity and clinical assessment
        """
        try:
            # Convert PIL image to bytes for Gemini
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='PNG')
            img_bytes = img_byte_arr.getvalue()
            
            # CLINICAL SPECIALIST PROMPT
            # Positioned as expert DFU diagnostician
            clinical_prompt = """You are an expert clinical podiatrist and diabetic foot care specialist with 20+ years of experience diagnosing diabetic foot ulcers (DFU).

TASK: Analyze this foot image and provide a comprehensive clinical assessment.

DIAGNOSTIC FRAMEWORK:
1. Examine for ulcer presence and characteristics (size, depth, borders, color, signs of infection)
2. Assess surrounding tissue (erythema, edema, callus formation, maceration)
3. Evaluate for neuropathic vs ischemic indicators
4. Classify severity based on Wagner classification

RESPONSE FORMAT - You MUST follow this EXACTLY:

DIAGNOSIS: [healthy/early_dfu/advanced_dfu]
CONFIDENCE: [0.0-1.0 - your diagnostic confidence based on clinical evidence]
SEVERITY_SCORE: [0.0-1.0 - ulcer severity where 0=healthy, 1=worst possible]
AFFECTED_AREA: [specific anatomical location if ulcer detected, otherwise "N/A"]
CLINICAL_ASSESSMENT: [Brief clinical findings and observations]
WAGNER_CLASS: [0-5 if DFU detected, N/A if healthy]
RISK_INDICATORS: [comma-separated list of concerning findings if any]

DIAGNOSTIC CRITERIA:
- HEALTHY: No visible ulceration, normal skin appearance, no concerning signs
- EARLY_DFU: Small (<2cm), superficial ulcer, good margin definition, minimal surrounding inflammation, low infection signs
- ADVANCED_DFU: Large (>2cm), deep ulcer, poor margin definition, significant surrounding inflammation, signs of infection, or wet gangrene

Be conservative in diagnosis - if you see any ulceration, classify as at least early_dfu.
Focus on clinical accuracy and patient safety."""

            # Call Gemini Vision API with image
            print(f"🔬 Requesting Gemini clinical specialist diagnosis...")
            print(f"   Using model: {self.current_model_name}")
            
            response = self.gemini_model.generate_content([
                clinical_prompt,
                {"mime_type": "image/png", "data": base64.b64encode(img_bytes).decode()}
            ])
            
            response_text = response.text
            print(f"📊 Gemini clinical response received ({len(response_text)} chars)")
            
            # Parse comprehensive diagnostic response
            diagnosis = self._parse_clinical_response(response_text)
            
            print(f"✅ Clinical Diagnosis: {diagnosis['prediction_label']}")
            print(f"   Confidence: {diagnosis['confidence']:.2%}")
            print(f"   Severity: {diagnosis['severity_score']:.2f}/1.0")
            if diagnosis['affected_area'] != "N/A":
                print(f"   Location: {diagnosis['affected_area']}")
            
            return diagnosis
        
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Gemini clinical diagnosis failed: {error_msg}")
            
            # Handle API key errors (400)
            if "400" in error_msg or "API_KEY_INVALID" in error_msg or "expired" in error_msg.lower():
                print(f"⚠️  API KEY ERROR - Key is expired or invalid")
                return {"error": "api_key_invalid", "message": "API key is expired or invalid. Please update the API key in .env file."}
            
            # Handle quota limit errors (429)
            if "429" in error_msg or "quota" in error_msg.lower():
                print(f"⚠️  API QUOTA LIMIT REACHED")
                print(f"   Free tier limit: 5 requests/minute")
                print(f"   Please wait before retrying or upgrade to paid plan")
                return {"error": "quota_limit", "message": "API quota exceeded. Please try again in a moment or upgrade your plan."}
            
            # If 404 error, try fallback models
            if "404" in error_msg and self.current_model_name:
                print(f"⚠️  Model {self.current_model_name} not available, trying fallback...")
                fallback_models = ["gemini-2.5-pro", "gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"]
                
                for fallback_model in fallback_models:
                    if fallback_model == self.current_model_name:
                        continue
                    
                    try:
                        print(f"   Attempting fallback: {fallback_model}")
                        self.gemini_model = genai.GenerativeModel(fallback_model)
                        self.current_model_name = fallback_model
                        
                        # Retry with fallback model
                        response = self.gemini_model.generate_content([
                            clinical_prompt,
                            {"mime_type": "image/png", "data": base64.b64encode(img_bytes).decode()}
                        ])
                        
                        response_text = response.text
                        diagnosis = self._parse_clinical_response(response_text)
                        
                        print(f"✅ Fallback {fallback_model} successful!")
                        print(f"✅ Clinical Diagnosis: {diagnosis['prediction_label']}")
                        return diagnosis
                        
                    except Exception as fallback_err:
                        print(f"   ❌ Fallback {fallback_model} failed: {fallback_err}")
                        continue
            
            # Return generic error
            return {"error": "diagnosis_failed", "message": str(e)}
    
    def _parse_clinical_response(self, response_text: str) -> Dict:
        """Parse Gemini clinical specialist response into structured diagnosis"""
        
        diagnosis = "healthy"
        confidence = 0.5
        severity_score = 0.0
        affected_area = "N/A"
        clinical_assessment = ""
        full_response = response_text
        
        # Parse response line by line
        lines = response_text.split('\n')
        for line in lines:
            line_lower = line.lower()
            
            if line.startswith('DIAGNOSIS:'):
                diag_text = line.split(':', 1)[1].strip().lower()
                if 'advanced' in diag_text:
                    diagnosis = 'advanced_dfu'
                elif 'early' in diag_text or ('dfu' in diag_text and 'healthy' not in diag_text):
                    diagnosis = 'early_dfu'
                else:
                    diagnosis = 'healthy'
            
            elif line.startswith('CONFIDENCE:'):
                try:
                    conf_str = line.split(':', 1)[1].strip()
                    confidence = float(conf_str)
                    confidence = max(0.0, min(1.0, confidence))
                except:
                    confidence = 0.5
            
            elif line.startswith('SEVERITY_SCORE:'):
                try:
                    sev_str = line.split(':', 1)[1].strip()
                    severity_score = float(sev_str)
                    severity_score = max(0.0, min(1.0, severity_score))
                except:
                    severity_score = self.SEVERITY_LEVELS.get(diagnosis, 0.5)
            
            elif line.startswith('AFFECTED_AREA:'):
                affected_area = line.split(':', 1)[1].strip()
                if affected_area.lower() == "n/a":
                    affected_area = "N/A"
            
            elif line.startswith('CLINICAL_ASSESSMENT:'):
                clinical_assessment = line.split(':', 1)[1].strip()
        
        # Build probability distribution
        if diagnosis == 'healthy':
            probs = {'healthy': min(0.99, confidence), 'early_dfu': 0.005, 'advanced_dfu': 0.005}
        elif diagnosis == 'early_dfu':
            probs = {'healthy': 1 - confidence, 'early_dfu': confidence * 0.7, 'advanced_dfu': confidence * 0.3}
        else:  # advanced_dfu
            probs = {'healthy': 1 - confidence, 'early_dfu': confidence * 0.3, 'advanced_dfu': confidence * 0.7}
        
        dfu_detected = diagnosis != "healthy"
        
        # If severity not explicitly set, use label-based default
        if severity_score == 0.0 and diagnosis != "healthy":
            severity_score = self.SEVERITY_LEVELS.get(diagnosis, 0.5)
        
        return {
            'prediction_label': diagnosis,
            'confidence': min(confidence, 0.99),  # Cap at 99% for safety
            'severity_score': severity_score,
            'dfu_detected': dfu_detected,
            'affected_area': affected_area if affected_area else "N/A",
            'clinical_assessment': clinical_assessment,
            'probabilities': probs,
            'model_version': 'gemini_clinical_v1.0',
            'full_response': full_response
        }
    
    def generate_gradcam(self, image_input, output_path: Optional[str] = None) -> Optional[np.ndarray]:
        """
        NOTE: Grad-CAM visualization not available with Gemini-only architecture.
        
        Gemini Vision provides text-based clinical assessment instead of visual heatmaps.
        For interpretability, refer to the clinical_assessment field in the prediction result.
        
        Args:
            image_input: Image to analyze (ignored - Gemini uses text output)
            output_path: Optional path to save visualization (will be skipped)
            
        Returns:
            None (use clinical_assessment text instead)
        """
        print("ℹ️  Grad-CAM heatmap visualization not available in Gemini-only mode.")
        print("   Gemini provides detailed clinical text assessment instead.")
        return None


# Singleton instance
_dfu_classifier_instance = None

def get_dfu_classifier(model_name: str = "gemini", use_ensemble: bool = True) -> DFUClassifier:
    """
    Get or initialize the DFU classifier singleton with Gemini Vision clinical specialist
    
    Args:
        model_name: Model identifier (ignored - uses Gemini only)
        use_ensemble: Always True - Gemini is the primary specialist model
    
    Returns:
        DFUClassifier with Gemini Vision clinical specialist diagnosis
    """
    global _dfu_classifier_instance
    if _dfu_classifier_instance is None:
        _dfu_classifier_instance = DFUClassifier(model_name="gemini", use_ensemble=True)
    return _dfu_classifier_instance


# Wrapper for backward compatibility
class DFUDetectionService:
    """Backward compatibility wrapper for DFU detection service"""
    
    def __init__(self):
        self.classifier = get_dfu_classifier()
    
    @property
    def model(self):
        return self.classifier.gemini_model
    
    def predict(self, image_input):
        return self.classifier.predict(image_input)
    
    def generate_gradcam(self, image_input, output_path):
        return self.classifier.generate_gradcam(image_input, output_path)


# Factory function
def get_dfu_service():
    """Initialize and return DFU detection service"""
    return DFUDetectionService()
