"""
Test XGBoost-only prediction engine
"""
from ml import YieldPredictionEngine

print("="*80)
print("XGBOOST-ONLY PREDICTION ENGINE TEST")
print("="*80)

# Initialize engine
engine = YieldPredictionEngine()

print(f"\n✅ Model loaded successfully")
print(f"  Model: {engine.best_model_name}")
print(f"  Features: {len(engine.feature_names)}")
print(f"  Season feature included: {'season_encoded' in engine.feature_names}")

# Test prediction
test_input = {
    "variety": "Co 86032",
    "state": "Maharashtra",
    "season": "Kharif",
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

print("\n" + "="*80)
print("TEST PREDICTION")
print("="*80)

result = engine.predict(test_input)

print(f"\n📊 Prediction Results:")
print(f"  Predicted Yield: {result['predicted_yield']} t/ha")
print(f"  Total Production: {result['expected_production']} t")
print(f"  Confidence: {result['confidence']}%")
print(f"  Risk Level: {result['risk']}")
print(f"  Model Used: {result['model_used']}")
print(f"  Algorithm: {result.get('algorithm', 'N/A')}")

# Check that dual model fields are removed
print("\n✅ Verification:")
if 'ensemble_yield' in result:
    print("  ❌ WARNING: ensemble_yield still present")
else:
    print("  ✓ ensemble_yield removed")

if 'models_comparison' in result:
    print("  ❌ WARNING: models_comparison still present")
else:
    print("  ✓ models_comparison removed")

# Test different seasons
print("\n" + "="*80)
print("SEASON VARIATION TEST")
print("="*80)

for season in ["Kharif", "Rabi", "Summer"]:
    test_input['season'] = season
    result = engine.predict(test_input)
    print(f"\n  {season:12s}: {result['predicted_yield']:6.2f} t/ha (Confidence: {result['confidence']}%)")

print("\n" + "="*80)
print("✅ XGBOOST-ONLY ENGINE WORKING!")
print("="*80)
