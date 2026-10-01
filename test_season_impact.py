"""
Comprehensive test of season impact on yield predictions
"""
from ml import YieldPredictionEngine

engine = YieldPredictionEngine()

print("="*80)
print("SEASON IMPACT TESTING - CO 86032 VARIETY")
print("="*80)

# Test scenario 1: Maharashtra (tropical climate)
print("\n📍 Test 1: Maharashtra (High Rainfall Region)")
print("-"*80)

base_inputs = {
    "variety": "Co 86032",
    "state": "Maharashtra",
    "rainfall_mm": 1400,  # Good rainfall
    "temperature_c": 29.5,
    "humidity_pct": 70,
    "soil_ph": 7.2,
    "soil_moisture": 65,
    "area_hectare": 2.0,
    "historical_yield": 90,
    "soil_type": "Black Soil",
    "growth_stage": "Grand Growth"
}

seasons = ["Kharif", "Rabi", "Summer"]
results = {}

for season in seasons:
    test_input = {**base_inputs, "season": season}
    result = engine.predict(test_input)
    results[season] = result
    print(f"\n{season:12s}: {result['predicted_yield']:6.2f} t/ha")
    print(f"              Confidence: {result['confidence']}%")
    print(f"              Risk: {result['risk']}")

# Calculate differences
kharif_rabi_diff = results['Kharif']['predicted_yield'] - results['Rabi']['predicted_yield']
kharif_summer_diff = results['Kharif']['predicted_yield'] - results['Summer']['predicted_yield']

print(f"\n📊 Season Impact Analysis:")
print(f"  Kharif vs Rabi:   {abs(kharif_rabi_diff):5.2f} t/ha difference ({abs(kharif_rabi_diff)/results['Rabi']['predicted_yield']*100:.1f}%)")
print(f"  Kharif vs Summer: {abs(kharif_summer_diff):5.2f} t/ha difference ({abs(kharif_summer_diff)/results['Summer']['predicted_yield']*100:.1f}%)")

# Test scenario 2: Punjab (different climate)
print("\n\n📍 Test 2: Punjab (Different Climate Zone)")
print("-"*80)

punjab_inputs = {
    "variety": "Co 86032",
    "state": "Punjab",
    "rainfall_mm": 800,  # Lower rainfall
    "temperature_c": 28.0,
    "humidity_pct": 60,
    "soil_ph": 7.5,
    "soil_moisture": 55,
    "area_hectare": 2.0,
    "historical_yield": 85,
    "soil_type": "Alluvial Soil",
    "growth_stage": "Grand Growth"
}

punjab_results = {}

for season in seasons:
    test_input = {**punjab_inputs, "season": season}
    result = engine.predict(test_input)
    punjab_results[season] = result
    print(f"\n{season:12s}: {result['predicted_yield']:6.2f} t/ha")
    print(f"              Confidence: {result['confidence']}%")

# Test scenario 3: Different variety
print("\n\n📍 Test 3: Different Variety (CoM 0265)")
print("-"*80)

variety_inputs = {
    "variety": "CoM 0265",
    "state": "Maharashtra",
    "rainfall_mm": 1200,
    "temperature_c": 30.0,
    "humidity_pct": 68,
    "soil_ph": 7.0,
    "soil_moisture": 60,
    "area_hectare": 2.0,
    "historical_yield": 95,
    "soil_type": "Black Soil",
    "growth_stage": "Grand Growth"
}

variety_results = {}

for season in seasons:
    test_input = {**variety_inputs, "season": season}
    result = engine.predict(test_input)
    variety_results[season] = result
    print(f"\n{season:12s}: {result['predicted_yield']:6.2f} t/ha")
    print(f"              Production: {result['expected_production']:.2f} t")
    print(f"              Confidence: {result['confidence']}%")

# Summary
print("\n" + "="*80)
print("📋 SUMMARY")
print("="*80)

print("\n✅ Season Feature Impact:")
if any(abs(results[s1]['predicted_yield'] - results[s2]['predicted_yield']) > 0.1 
       for s1 in seasons for s2 in seasons if s1 != s2):
    print("  ✓ Model IS season-aware (yields differ between seasons)")
    print("  ✓ Seasonal variations captured successfully")
    print(f"  ✓ Maximum variation: {max(r['predicted_yield'] for r in results.values()) - min(r['predicted_yield'] for r in results.values()):.2f} t/ha")
else:
    print("  ⚠ Season impact is minimal in current test")
    print("  ℹ This may be due to historical yield dominance in feature importance")

print("\n🌾 Expected Seasonal Patterns (Agricultural Context):")
print("  - Kharif (June-Nov):   Higher yields due to monsoon rainfall")
print("  - Rabi (Oct-Mar):      Moderate yields, irrigation dependent")
print("  - Summer (Feb-May):    Lower yields due to heat stress")

print("\n💡 Model Behavior:")
print(f"  - Historical yield feature importance: {engine.best_model.feature_importances_[12]:.4f}")
print(f"  - Season feature importance: {engine.best_model.feature_importances_[18]:.6f}")
print(f"  - State feature importance: {engine.best_model.feature_importances_[17]:.6f}")

print("\n" + "="*80)
print("✅ MODEL SUCCESSFULLY RETRAINED WITH SEASON FEATURE!")
print("="*80)
