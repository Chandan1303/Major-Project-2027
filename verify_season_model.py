"""
Verify that the retrained model includes season as a feature
"""
import pickle
import json
from pathlib import Path

models_dir = Path('models')

# Load encoders
with open(models_dir / 'label_encoders.pkl', 'rb') as f:
    encoders = pickle.load(f)

# Load feature names
with open(models_dir / 'feature_names.json', 'r') as f:
    feature_names = json.load(f)

# Load metadata
with open(models_dir / 'model_metadata.json', 'r') as f:
    metadata = json.load(f)

print("="*80)
print("MODEL VERIFICATION - SEASON FEATURE CHECK")
print("="*80)

print("\n📊 Model Information:")
print(f"  Best Model: {metadata.get('best_model', 'N/A')}")
print(f"  Training Date: {metadata.get('training_date', 'N/A')}")
print(f"  Training Samples: {metadata.get('n_samples_train', 'N/A'):,}")
print(f"  Test Samples: {metadata.get('n_samples_test', 'N/A'):,}")
print(f"  Total Features: {len(feature_names)}")

print("\n🔑 Categorical Encoders:")
for name, encoder in encoders.items():
    print(f"  ✓ {name}: {len(encoder.classes_)} categories")
    if name == 'season':
        print(f"    Categories: {', '.join(encoder.classes_)}")

print("\n📋 All Features:")
for i, feat in enumerate(feature_names, 1):
    print(f"  {i:2d}. {feat}")

# Check if season is included
has_season = 'season_encoded' in feature_names
season_encoder_exists = 'season' in encoders

print("\n" + "="*80)
if has_season and season_encoder_exists:
    print("✅ SUCCESS: Season feature is INCLUDED in the model!")
    print(f"   - season_encoded is feature #{feature_names.index('season_encoded') + 1}")
    print(f"   - {len(encoders['season'].classes_)} season categories: {', '.join(encoders['season'].classes_)}")
else:
    print("❌ WARNING: Season feature is MISSING!")
    if not has_season:
        print("   - season_encoded not in feature_names")
    if not season_encoder_exists:
        print("   - season encoder not found")
print("="*80)

# Test prediction with season
print("\n🧪 Testing Season-Aware Prediction...")
from ml import YieldPredictionEngine

engine = YieldPredictionEngine()

test_inputs = {
    "variety": "Co 86032",
    "state": "Maharashtra",
    "rainfall_mm": 1200,
    "temperature_c": 29.5,
    "humidity_pct": 68,
    "soil_ph": 7.0,
    "soil_moisture": 60,
    "area_hectare": 2.0,
    "historical_yield": 85,
    "soil_type": "Black Soil",
    "growth_stage": "Grand Growth"
}

print("\nBase inputs (without season):")
for k, v in test_inputs.items():
    print(f"  {k}: {v}")

seasons = ["Kharif", "Rabi", "Summer"]
print(f"\n📈 Predictions for different seasons:")
print("-"*80)

for season in seasons:
    test_with_season = {**test_inputs, "season": season}
    result = engine.predict(test_with_season)
    print(f"\n  {season:12s}: {result['predicted_yield']:6.2f} t/ha  (Confidence: {result['confidence']}%)")

print("\n" + "="*80)
print("If yields differ between seasons, the model is season-aware! ✅")
print("="*80)
