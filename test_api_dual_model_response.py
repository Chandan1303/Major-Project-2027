"""
Simulates the exact API response that frontend will receive
Shows what will be displayed in the UI
"""
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from ml.yield_model import YieldPredictionEngine

# Sample input
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
print("API RESPONSE PREVIEW - DUAL MODEL MODE")
print("=" * 80)
print()

engine = YieldPredictionEngine()
result = engine.predict(test_input)

print("📡 BACKEND API RESPONSE:")
print("-" * 80)
print(json.dumps({
    "predicted_yield": result["predicted_yield"],
    "selected_model": result["selected_model"],
    "model_agreement": result["model_agreement"],
    "models_comparison": result["models_comparison"],
    "confidence": result["confidence"],
    "season_adjustment": result["season_adjustment"]
}, indent=2))

print()
print("=" * 80)
print("🎨 FRONTEND DISPLAY PREVIEW")
print("=" * 80)
print()

print("┌─────────────────────────────────────────────────────────────┐")
print("│                  Dual Model Comparison                      │")
print("│                     [Best Auto-Selected]                    │")
print("├─────────────────────────────────────────────────────────────┤")
print("│                                                             │")
print("│  ┌──────────────────────┐    ┌──────────────────────┐     │")

# Random Forest box
rf_yield = result["models_comparison"]["random_forest"]
rf_selected = result["selected_model"] == "Random Forest"
rf_border = "═" if rf_selected else "─"

print(f"│  │ 🌲 Random Forest    │    │ 🚀 XGBoost          │     │")
if rf_selected:
    print(f"│  │   [✓ SELECTED]      │    │                     │     │")
else:
    print(f"│  │                     │    │   [✓ SELECTED]      │     │")

print(f"│  │                     │    │                     │     │")
print(f"│  │   {rf_yield:5.2f} t/ha    │    │   {result['models_comparison']['xgboost']:5.2f} t/ha    │     │")
print(f"│  │                     │    │                     │     │")
print(f"│  │ R²=0.8187           │    │ R²=0.8387           │     │")
print(f"│  └──────────────────────┘    └──────────────────────┘     │")
print("│                                                             │")
print(f"│  {result['selected_model']} selected (R²={0.8387 if result['selected_model']=='XGBoost' else 0.8187:.4f})              │")
print(f"│  Model agreement: {result['model_agreement']:.1f}%                                  │")
print(f"│  Prediction ID #23                                          │")
print("└─────────────────────────────────────────────────────────────┘")

print()
print("=" * 80)
print("📊 KEY METRICS DISPLAYED")
print("=" * 80)
print()

print(f"Final Prediction (Selected): {result['predicted_yield']} t/ha")
print(f"Selected Model: {result['selected_model']}")
print(f"Model Agreement: {result['model_agreement']}%")
print(f"Confidence: {result['confidence']}%")
print()
print("Both Predictions (After Season Adjustment):")
print(f"  • Random Forest: {result['models_comparison']['random_forest']} t/ha")
print(f"  • XGBoost: {result['models_comparison']['xgboost']} t/ha")
print()
print("Base Predictions (Before Season Adjustment):")
print(f"  • Random Forest: {result['models_comparison']['rf_base']} t/ha")
print(f"  • XGBoost: {result['models_comparison']['xgb_base']} t/ha")
print()
print(f"Season: {test_input['season']}")
print(f"Season Multiplier: ×{result['season_adjustment']}")
print()
print("=" * 80)
