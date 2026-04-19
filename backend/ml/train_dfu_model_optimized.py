"""
Optimized DFU (Diabetic Foot Ulcer) Detection Model Training
Enhanced with: Better data augmentation, transfer learning, validation strategies
"""

import numpy as np
from pathlib import Path
import pickle
import argparse
import json

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def create_enhanced_dfu_model(input_shape=(224, 224, 3)):
    """
    Create enhanced CNN model for DFU detection with better architecture
    Uses MobileNetV2 with improved training strategy
    """
    if not TF_AVAILABLE:
        raise ImportError("TensorFlow is required. Install with: pip install tensorflow")
    
    # Load pre-trained MobileNetV2
    base_model = keras.applications.MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze base layers for transfer learning
    base_model.trainable = False
    
    # Build model with improved architecture
    model = keras.Sequential([
        layers.Input(shape=input_shape),
        
        # Data augmentation layer (integrated)
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.15),
        layers.RandomTranslation(0.1, 0.1),
        
        # Preprocessing
        keras.applications.mobilenet_v2.preprocess_input,
        
        # Base model
        base_model,
        
        # Custom classification head
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dense(512, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.Dropout(0.5),
        layers.BatchNormalization(),
        layers.Dense(256, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.Dropout(0.4),
        layers.BatchNormalization(),
        layers.Dense(128, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.Dropout(0.3),
        layers.Dense(2, activation='softmax')  # 2 classes: Healthy, DFU Risk
    ])
    
    return model, base_model


def create_enhanced_synthetic_dataset(samples_per_class=200):
    """
    Create enhanced synthetic training data with better variations
    """
    print("🔄 Creating enhanced synthetic DFU dataset...")
    
    images = []
    labels = []
    
    # Class 0: Healthy feet (realistic variations)
    print("   Generating healthy foot images...")
    for i in range(samples_per_class):
        # Base healthy foot appearance
        img = np.random.normal(215, 12, (224, 224, 3))
        
        # Add natural skin texture
        texture = np.random.normal(0, 5, (224, 224, 3))
        img = img + texture
        
        # Add random light variations (natural lighting)
        light_map = np.random.normal(1, 0.1, (224, 224, 3))
        img = img * light_map
        
        # Random slight color variations
        if np.random.random() > 0.5:
            img[:, :, 0] += np.random.normal(5, 3, (224, 224))  # Slight redness
        
        img = np.clip(img, 0, 255).astype(np.float32) / 255.0
        images.append(img)
        labels.append(0)
    
    # Class 1: DFU Risk (realistic pathological features)
    print("   Generating DFU risk foot images...")
    for i in range(samples_per_class):
        # Base foot appearance
        img = np.random.normal(200, 15, (224, 224, 3))
        
        # Add texture
        texture = np.random.normal(0, 5, (224, 224, 3))
        img = img + texture
        
        # Add inflammation zones (multiple areas)
        num_lesions = np.random.randint(1, 3)
        for _ in range(num_lesions):
            x = np.random.randint(30, 194)
            y = np.random.randint(30, 194)
            size = np.random.randint(20, 60)
            
            # Inflamed area (redness + swelling effect)
            img[x:x+size, y:y+size, 0] = np.clip(
                img[x:x+size, y:y+size, 0] + np.random.normal(50, 10, (size, size)), 
                0, 255
            )
            img[x:x+size, y:y+size, 1:] = np.clip(
                img[x:x+size, y:y+size, 1:] - np.random.normal(20, 5, (size, size)), 
                0, 255
            )
            
            # Add darker center (ulcer-like appearance)
            center_size = size // 2
            img[x+size//4:x+size//4+center_size, y+size//4:y+size//4+center_size] = np.clip(
                img[x+size//4:x+size//4+center_size, y+size//4:y+size//4+center_size] - 40,
                0, 255
            )
        
        img = np.clip(img, 0, 255).astype(np.float32) / 255.0
        images.append(img)
        labels.append(1)
    
    X = np.array(images)
    y = np.array(labels)
    
    print(f"✅ Dataset created: {X.shape}")
    print(f"   Healthy images: {(y == 0).sum()}")
    print(f"   DFU Risk images: {(y == 1).sum()}\n")
    
    return X, y


def train_dfu_model_enhanced(epochs=30, batch_size=32):
    """
    Train DFU detection model with enhanced strategy
    """
    print("="*60)
    print("🚀 Training Enhanced DFU Detection Model")
    print("="*60 + "\n")
    
    # Create and compile model
    model, base_model = create_enhanced_dfu_model()
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-4),
        loss=keras.losses.SparseCategoricalCrossentropy(),
        metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
    )
    
    print("✅ Model compiled successfully\n")
    
    # Create dataset
    X, y = create_enhanced_synthetic_dataset(samples_per_class=200)
    
    # Split data
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"📊 Data split:")
    print(f"   Training: {X_train.shape[0]} samples")
    print(f"   Validation: {X_val.shape[0]} samples\n")
    
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            Path(__file__).parent / 'best_dfu_model_checkpoint.h5',
            monitor='val_accuracy',
            save_best_only=True,
            verbose=0
        )
    ]
    
    # Train model
    print("🔄 Training model...\n")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=1
    )
    
    print("\n✅ Training completed!\n")
    
    # Unfreeze base model layers for fine-tuning
    print("🔧 Fine-tuning base model layers...")
    base_model.trainable = True
    
    # Compile with lower learning rate
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-5),
        loss=keras.losses.SparseCategoricalCrossentropy(),
        metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
    )
    
    # Fine-tune
    history_ft = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=10,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=1
    )
    
    print("\n✅ Fine-tuning completed!\n")
    
    # Evaluate
    print("📈 Model Evaluation:")
    val_loss, val_acc, val_precision, val_recall = model.evaluate(
        X_val, y_val, verbose=0
    )
    print(f"   Validation Accuracy: {val_acc:.4f}")
    print(f"   Validation Precision: {val_precision:.4f}")
    print(f"   Validation Recall: {val_recall:.4f}")
    print(f"   Validation Loss: {val_loss:.4f}\n")
    
    # Save model
    model_path = Path(__file__).parent / "diabetic_foot_uIcer_optimized.h5"
    model.save(model_path)
    print(f"💾 Model saved to {model_path}\n")
    
    # Save metrics
    metrics = {
        'val_accuracy': float(val_acc),
        'val_precision': float(val_precision),
        'val_recall': float(val_recall),
        'val_loss': float(val_loss),
        'training_epochs': epochs + 10,
        'model_type': 'MobileNetV2 with transfer learning',
        'input_shape': [224, 224, 3]
    }
    
    metrics_path = Path(__file__).parent / "dfu_model_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"📊 Metrics saved to {metrics_path}")
    print("\n✅ DFU model training and optimization complete!")
    
    return model, history


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train DFU Detection Model')
    parser.add_argument('--epochs', type=int, default=30, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    
    args = parser.parse_args()
    
    model, history = train_dfu_model_enhanced(epochs=args.epochs, batch_size=args.batch_size)
