"""
Test the Flask /api/ml/predict endpoint directly with a POST request
This simulates what the frontend does
"""
import requests
import json

# Backend URL
BASE_URL = "http://localhost:5000"

# Test payload (matching frontend structure)
test_data = {
    "state": "Karnataka",
    "district": "Mysuru",
    "variety": "Co 94012",
    "season": "Summer",
    "area": 2.5,
    "soil_type": "Black Soil",
    "soil_ph": 7.2,
    "soil_moisture": 62.0,
    "rainfall": 1200.0,
    "temperature": 29.5,
    "humidity": 70.0,
    "historical_yield": 95.0,
    "growth_stage": "Grand Growth",
    "location": "Mysuru, Karnataka"
}

print("=" * 80)
print("Testing Flask /api/ml/predict endpoint")
print("=" * 80)
print(f"URL: {BASE_URL}/api/ml/predict")
print(f"Payload:")
print(json.dumps(test_data, indent=2))
print("=" * 80)

try:
    response = requests.post(
        f"{BASE_URL}/api/ml/predict",
        json=test_data,
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print("\nResponse Body:")
    
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        
        if data.get("success"):
            pred_data = data.get("data", {})
            print("\n" + "=" * 80)
            print("✅ SUCCESS!")
            print("=" * 80)
            print(f"Predicted Yield: {pred_data.get('predicted_yield')} t/ha")
            print(f"Selected Model: {pred_data.get('selected_model')}")
            print(f"Model Agreement: {pred_data.get('model_agreement')}%")
            print(f"Season Adjustment: {pred_data.get('season_adjustment')}x")
            print(f"Models Comparison: {pred_data.get('models_comparison')}")
        else:
            print("\n❌ Request succeeded but success=False")
            print(f"Message: {data.get('message')}")
    else:
        print(response.text)
        print("\n" + "=" * 80)
        print(f"❌ HTTP {response.status_code} ERROR")
        print("=" * 80)
        
except requests.exceptions.ConnectionError:
    print("\n" + "=" * 80)
    print("❌ CONNECTION ERROR")
    print("=" * 80)
    print("Backend is not running!")
    print("Start it with: python backend/app.py")
    
except Exception as e:
    print("\n" + "=" * 80)
    print("❌ ERROR")
    print("=" * 80)
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    import traceback
    traceback.print_exc()
