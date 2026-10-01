"""
Test Dual Model Selection
Verifies that both Random Forest and XGBoost run and best prediction is selected
"""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from ml.yield_model import YieldPredictionEngine

# Sample Karnataka input
test_input = {
    "state": "Karnataka",
    "district": "Mysuru",
    "location": "Mysuru, Karnataka",
    "variety": "Co 94012",
    "season": "Summer",
    "area_hectare": 2.5,
    "soil_type": "Black Soil",
    "soil_ph": 7.2,
    "soil_moisture": 62.0,
    "rainfall_mm": 1200.0,
    "temperature_c": 29.5,
    "humidity_pct": 70.0,
    "growth_stage": "Grand Growth",
    "historical_yield": 95.0
}

print("=" * 80)
print("DUAL MODEL SELECTION TEST")
print("=" * 80)
print()

# Initialize engine
print("Loading models...")
engine = YieldPredictionEngine()
print(f"✓ Best model selected: {engine.best_model_name.upper()}")
print(f"✓ Best model R²: {engine.best_r2:.4f}")
print()

# Run prediction
print("Running dual model prediction...")
result = engine.predict(test_input)
print()

print("=" * 80)
print("PREDICTION RESULTS")
print("=" * 80)
print()

# Display both model predictions
models_comp = result.get("models_comparison", {})
print("📊 Model Predictions (with season adjustment):")
print(f"   🌲 Random Forest: {models_comp.get('random_forest', 'N/A')} t/ha")
print(f"   🚀 XGBoost:       {models_comp.get('xgboost', 'N/A')} t/ha")
print()

print("📊 Base Predictions (before season adjustment):")
print(f"   🌲 Random Forest: {models_comp.get('rf_base', 'N/A')} t/ha")
print(f"   🚀 XGBoost:       {models_comp.get('xgb_base', 'N/A')} t/ha")
print()

# Display selected model
print("✅ SELECTED PREDICTION:")
print(f"   Model: {result.get('selected_model', 'Unknown')}")
print(f"   Yield: {result.get('predicted_yield', 'N/A')} t/ha")
print(f"   Confidence: {result.get('confidence', 'N/A')}%")
print(f"   Agreement: {result.get('model_agreement', 'N/A')}%")
print()

# Display season adjustment
print("🌱 Season Intelligence:")
print(f"   Season: {test_input['season']}")
print(f"   Variety: {test_input['variety']}")
print(f"   Season Multiplier: ×{result.get('season_adjustment', 1.0)}")
print(f"   Base Yield: {result.get('base_model_yield', 'N/A')} t/ha")
print(f"   Adjusted Yield: {result.get('predicted_yield', 'N/A')} t/ha")
print()

# Display production details
print("📦 Production Forecast:")
print(f"   Area: {test_input['area_hectare']} ha")
print(f"   Expected Production: {result.get('expected_production', 'N/A')} tonnes")
print(f"   Risk Level: {result.get('risk', 'Unknown')}")
print()

# Check recommendations
if "variety_season_intelligence" in result:
    intel = result["variety_season_intelligence"]
    print("💡 Season Suitability:")
    season_suit = intel.get("season_suitability", {})
    print(f"   Suitable: {season_suit.get('is_suitable', 'Unknown')}")
    print(f"   Message: {season_suit.get('message', 'N/A')}")
    
    opt = intel.get("yield_optimization", {})
    if opt:
        print()
        print("📈 Optimization Potential:")
        print(f"   Current Yield: {opt.get('predicted_yield', 'N/A')} t/ha")
        print(f"   Optimal Season Yield: {opt.get('potential_yield_optimal_season', 'N/A')} t/ha")
        print(f"   Potential Gain: {opt.get('gain_percentage', 'N/A')}%")

print()
print("=" * 80)
print("VERIFICATION")
print("=" * 80)
print()

# Verify dual model is working
checks = []

# Check 1: Both predictions exist
if models_comp.get('random_forest') and models_comp.get('xgboost'):
    checks.append("✓ Both Random Forest and XGBoost predictions generated")
else:
    checks.append("✗ Missing predictions from one or both models")

# Check 2: Selected model is identified
if result.get('selected_model') in ['Random Forest', 'XGBoost']:
    checks.append(f"✓ Best model selected: {result.get('selected_model')}")
else:
    checks.append("✗ Selected model not identified")

# Check 3: Model agreement calculated
if result.get('model_agreement'):
    checks.append(f"✓ Model agreement calculated: {result.get('model_agreement')}%")
else:
    checks.append("✗ Model agreement not calculated")

# Check 4: Season adjustment applied
if result.get('season_adjustment') != 1.0:
    checks.append(f"✓ Season adjustment applied: ×{result.get('season_adjustment')}")
else:
    checks.append("⚠ Season adjustment is neutral (×1.0)")

# Check 5: Predictions are different (not identical)
rf_pred = models_comp.get('random_forest', 0)
xgb_pred = models_comp.get('xgboost', 0)
if rf_pred != xgb_pred:
    diff = abs(rf_pred - xgb_pred)
    checks.append(f"✓ Models show variation: {diff:.2f} t/ha difference")
else:
    checks.append("⚠ Both models gave identical predictions")

for check in checks:
    print(check)

print()
print("=" * 80)
print("TEST COMPLETE")
print("=" * 80)
print()

if all("✓" in c for c in checks):
    print("✅ All checks passed! Dual model selection is working correctly.")
else:
    print("⚠ Some checks failed. Review output above.")
