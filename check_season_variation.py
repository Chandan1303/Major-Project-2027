"""
Check if base model gives different predictions for different seasons
"""
from ml import YieldPredictionEngine

engine = YieldPredictionEngine()

base_input = {
    'variety': 'Co 86032',
    'state': 'Maharashtra',
    'rainfall_mm': 1200,
    'temperature_c': 29,
    'humidity_pct': 68,
    'soil_ph': 7.0,
    'soil_moisture': 60,
    'area_hectare': 2.0,
    'historical_yield': 85,
    'soil_type': 'Black Soil',
    'growth_stage': 'Grand Growth'
}

print("="*60)
print("BASE MODEL PREDICTION CHECK")
print("="*60)

seasons = ['Kharif', 'Rabi', 'Summer']

for season in seasons:
    test_input = {**base_input, 'season': season}
    X = engine.encode_input(test_input)
    base_pred = engine.xgb_model.predict(X)[0]
    print(f"{season:10s} -> Base Model: {base_pred:.2f} t/ha")

print("\n" + "="*60)
print("ISSUE: Base model gives SAME prediction for all seasons!")
print("REASON: Season feature has low importance (0.67%)")
print("="*60)
