#!/usr/bin/env python3
"""
Check which Gemini models are available in your API
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load from backend .env
backend_env = Path(__file__).parent / "backend" / ".env"
if backend_env.exists():
    load_dotenv(backend_env)
else:
    load_dotenv()

try:
    import google.generativeai as genai
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not set")
        print(f"   Checked: {backend_env}")
        print(f"   Try running from backend directory with: export GEMINI_API_KEY='your_key'")
        exit(1)
    
    print(f"✅ Using API key: {api_key[:20]}...")
    genai.configure(api_key=api_key)
    
    print("🔍 Fetching available Gemini models...\n")
    
    models = genai.list_models()
    
    print("📋 Available Models:")
    print("=" * 60)
    
    vision_models = []
    text_models = []
    
    for model in models:
        model_name = model.name.replace('models/', '')
        display_name = model.display_name if hasattr(model, 'display_name') else model_name
        
        # Check if model supports vision
        if hasattr(model, 'supported_generation_methods'):
            methods = model.supported_generation_methods
            print(f"\n✅ {model_name}")
            print(f"   Display: {display_name}")
            print(f"   Methods: {methods}")
            
            if 'generateContent' in methods:
                if 'vision' in model_name.lower() or 'pro' in model_name.lower():
                    vision_models.append(model_name)
                else:
                    text_models.append(model_name)
    
    print("\n" + "=" * 60)
    print("\n🎯 RECOMMENDATIONS:")
    
    if vision_models:
        print(f"\n✅ Vision models available:")
        for m in vision_models:
            print(f"   - {m}")
    else:
        print(f"\n⚠️  No vision-capable models found")
    
    if text_models:
        print(f"\n📝 Text models available:")
        for m in text_models:
            print(f"   - {m}")
    
    if not vision_models and not text_models:
        print("\n❌ No generateContent models found!")
        print("   Check your API key and permissions")
    
except ImportError:
    print("❌ google-generativeai not installed")
    print("   pip install google-generativeai")
except Exception as e:
    print(f"❌ Error: {e}")
