"""
Test Karnataka-specific prediction with correct 11 agronomic features
"""
from ml import YieldPredictionEngine
import json

print("="*80)
print("KARNATAKA PREDICTION TEST - 11 AGRONOMIC FEATURES")
print("="*80)

engine = YieldPredictionEngine()

# Your exact input from the form
karnataka_input = {
    # Location
    "state": "Karnataka",
    "district": "Bagalkot",
    
    # Variety & Season
    "variety": "Co 94012",
    "season": "Summer",
    
    # Farm Details
    "area_hectare": 2.5,
    "location": "Bagalkot, Karnataka",
    
    # Soil Parameters (3 features)
    "soil_type": "Black Soil",  # Black (Regur/Clay)
    "soil_ph": 7.2,
    "soil_moisture": 62.0,
    
    # Weather Parameters (3 features)
    "rainfall_mm": 1200.0,
    "temperature_c": 29.5,
    "humidity_pct": 70.0,  # ONLY ONCE - NOT TWICE!
    
    # Crop Parameters (3 features)
    "planting_date": "2025-10-15",
    "growth_stage": "Grand Growth",
    "historical_yield": 95.0,
}

print("\n📋 Input Parameters (11 Agronomic Features):")
print("-"*80)
print(f"1. State: {karnataka_input['state']}")
print(f"2. District: {karnataka_input['district']}")
print(f"3. Variety: {karnataka_input['variety']}")
print(f"4. Season: {karnataka_input['season']}")
print(f"5. Soil Type: {karnataka_input['soil_type']}")
print(f"6. Soil pH: {karnataka_input['soil_ph']}")
print(f"7. Soil Moisture: {karnataka_input['soil_moisture']}%")
print(f"8. Rainfall: {karnataka_input['rainfall_mm']} mm")
print(f"9. Temperature: {karnataka_input['temperature_c']}°C")
print(f"10. Humidity: {karnataka_input['humidity_pct']}%")  # SINGLE ENTRY
print(f"11. Historical Yield: {karnataka_input['historical_yield']} t/ha")
print(f"\nAdditional:")
print(f"  - Area: {karnataka_input['area_hectare']} ha")
print(f"  - Growth Stage: {karnataka_input['growth_stage']}")

# Run prediction
print("\n" + "="*80)
print("RUNNING PREDICTION...")
print("="*80)

try:
    result = engine.predict(karnataka_input)
    
    print("\n✅ PREDICTION SUCCESSFUL")
    print("-"*80)
    
    print(f"\n📊 Yield Prediction:")
    print(f"  Base Model Yield: {result['base_model_yield']} t/ha")
    print(f"  Season Adjustment: ×{result['season_adjustment']}")
    print(f"  Final Predicted Yield: {result['predicted_yield']} t/ha")
    print(f"  Total Production: {result['expected_production']} tons (for {karnataka_input['area_hectare']} ha)")
    
    print(f"\n🎯 Confidence & Risk:")
    print(f"  Confidence Score: {result['confidence']}%")
    print(f"  Risk Level: {result['risk']}")
    print(f"  Crop Health: {result['crop_health']}")
    
    print(f"\n📈 Yield Analysis:")
    print(f"  Expected Range: {result['expected_range']['low']} - {result['expected_range']['high']} t/ha")
    print(f"  Reference Yield: {result['reference_yield']} t/ha")
    print(f"  Expected Loss: {result['expected_loss_t']} t/ha ({result['expected_loss_pct']}%)")
    
    # Season intelligence
    intel = result['variety_season_intelligence']
    
    print(f"\n🌱 Season Suitability:")
    print(f"  {intel['season_suitability']['message']}")
    print(f"  Season Multiplier: {intel['season_suitability']['yield_multiplier']}")
    print(f"  Recommended Season: {intel['season_suitability']['recommended_season']}")
    
    if not intel['season_suitability']['is_suitable']:
        opt = intel['yield_optimization']
        print(f"\n⚠️ Yield Optimization Opportunity:")
        print(f"  Current Yield: {opt['predicted_yield']} t/ha")
        print(f"  Potential (Optimal Season): {opt['potential_yield_optimal_season']} t/ha")
        print(f"  Potential Gain: {opt['potential_gain']} t/ha (+{opt['gain_percentage']}%)")
    
    print(f"\n💡 Top Recommendations:")
    for i, rec in enumerate(intel['recommendations'][:5], 1):
        print(f"  {i}. [{rec['priority']}] {rec['icon']} {rec['message']}")
    
    print(f"\n🎯 Input Quality Analysis:")
    for param, analysis in intel['input_analysis'].items():
        print(f"  {param:15s}: {analysis['message']}")
    
    print(f"\n🔝 Top 5 Feature Importance:")
    for i, feat in enumerate(result['feature_importance'][:5], 1):
        print(f"  {i}. {feat['feature']:20s}: {feat['pct']:5.1f}%")
    
    # Save detailed result
    with open('karnataka_prediction_result.json', 'w') as f:
        json.dump(result, f, indent=2)
    print(f"\n💾 Full result saved to: karnataka_prediction_result.json")
    
    print("\n" + "="*80)
    print("✅ PREDICTION COMPLETE")
    print("="*80)
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

# Verify no duplicate humidity
print("\n" + "="*80)
print("VERIFICATION: HUMIDITY FIELD COUNT")
print("="*80)

humidity_keys = [k for k in karnataka_input.keys() if 'humidity' in k.lower()]
print(f"Humidity-related keys: {humidity_keys}")
print(f"Count: {len(humidity_keys)}")

if len(humidity_keys) == 1:
    print("✅ CORRECT: Only ONE humidity field present")
else:
    print(f"❌ ERROR: {len(humidity_keys)} humidity fields found (should be 1)")
