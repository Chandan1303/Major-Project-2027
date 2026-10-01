"""
Test what the backend API actually returns
"""
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

# Simulate backend prediction
from ml.yield_model import YieldPredictionEngine

test_input = {
    "state": "Karnataka",
    "variety": "Co 94012",
    "season": "Summer",
    "area": 2.5,
    "soil_ph": 7.2,
    "soil_moisture": 62.0,
    "rainfall": 1200.0,
    "temperature": 29.5,
    "humidity": 70.0,
    "historical_yield": 95.0
}

print("=" * 80)
print("BACKEND API RESPONSE TEST")
print("=" * 80)
print()

engine = YieldPredictionEngine()
result = engine.predict(test_input)

print("Full Response:")
print(json.dumps(result, indent=2, default=str))

print()
print("=" * 80)
print("KEY FIELDS CHECK")
print("=" * 80)
print()

# Check critical fields
checks = {
    "predicted_yield": result.get("predicted_yield"),
    "selected_model": result.get("selected_model"),
    "model_agreement": result.get("model_agreement"),
    "models_comparison": result.get("models_comparison"),
    "confidence": result.get("confidence")
}

for key, value in checks.items():
    status = "OK" if value is not None else "MISS"
    print(f"{status} {key}: {value}")

print()
print("=" * 80)
print("MODELS_COMPARISON DETAIL")
print("=" * 80)
print()

if "models_comparison" in result:
    mc = result["models_comparison"]
    print(f"OK random_forest: {mc.get('random_forest')}")
    print(f"OK xgboost: {mc.get('xgboost')}")
    print(f"OK selected: {mc.get('selected')}")
    print(f"OK rf_base: {mc.get('rf_base')}")
    print(f"OK xgb_base: {mc.get('xgb_base')}")
else:
    print("MISS models_comparison not found in result!")

print()
print("=" * 80)
