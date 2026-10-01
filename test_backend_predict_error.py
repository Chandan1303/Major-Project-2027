"""
Test to reproduce the backend 500 error
"""
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

try:
    print("Importing YieldPredictionEngine...")
    from ml.yield_model import YieldPredictionEngine
    
    print("Initializing engine...")
    engine = YieldPredictionEngine()
    
    print("Creating test input...")
    test_input = {
        "state": "Karnataka",
        "district": "Mysuru",
        "variety": "Co 94012",
        "season": "Kharif",
        "area": 2.5,
        "soil_type": "Black Soil",
        "soil_ph": 7.2,
        "soil_moisture": 62.0,
        "rainfall": 1200.0,
        "temperature": 29.5,
        "humidity": 70.0,
        "historical_yield": 95.0,
        "growth_stage": "Grand Growth"
    }
    
    print("Calling predict()...")
    result = engine.predict(test_input)
    
    print("\n" + "=" * 80)
    print("SUCCESS! Prediction completed without errors")
    print("=" * 80)
    print(f"Predicted Yield: {result.get('predicted_yield')} t/ha")
    print(f"Selected Model: {result.get('selected_model')}")
    print(f"Model Agreement: {result.get('model_agreement')}%")
    print(f"Models Comparison: {result.get('models_comparison')}")
    
except Exception as e:
    print("\n" + "=" * 80)
    print("ERROR OCCURRED!")
    print("=" * 80)
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    print("\nFull Traceback:")
    print("-" * 80)
    traceback.print_exc()
    print("=" * 80)
