"""
Final Karnataka Prediction - Single Model (XGBoost Only)
Removes duplicate humidity and provides clear recommendation
"""
from ml import YieldPredictionEngine
import json

print("="*80)
print("KARNATAKA SUGARCANE YIELD PREDICTION")
print("Single Model: XGBoost Gradient Boosting")
print("="*80)

engine = YieldPredictionEngine()

# Your exact input (FIXED - humidity only once)
karnataka_input = {
    # Location & Crop
    "state": "Karnataka",
    "district": "Bagalkot",
    "variety": "Co 94012",
    "season": "Summer",
    "location": "Bagalkot, Karnataka",
    
    # Farm Details
    "area_hectare": 2.5,
    "planting_date": "2025-10-15",
    "growth_stage": "Grand Growth",
    
    # Soil Parameters (3)
    "soil_type": "Black Soil",
    "soil_ph": 7.2,
    "soil_moisture": 62.0,
    
    # Weather Parameters (3) - HUMIDITY ONCE!
    "rainfall_mm": 1200.0,
    "temperature_c": 29.5,
    "humidity_pct": 70.0,  # SINGLE ENTRY - NOT DUPLICATE
    
    # Historical Performance
    "historical_yield": 95.0,
}

print("\n" + "="*80)
print("INPUT VERIFICATION")
print("="*80)

# Check for duplicate humidity
humidity_fields = [k for k in karnataka_input.keys() if 'humidity' in k.lower()]
print(f"\n✓ Humidity fields found: {len(humidity_fields)}")
if len(humidity_fields) == 1:
    print(f"✓ CORRECT: Single humidity field = {karnataka_input['humidity_pct']}%")
else:
    print(f"✗ ERROR: {len(humidity_fields)} humidity fields (should be 1)")

print(f"\n📋 Input Summary (11 Core Parameters):")
print(f"  1. State: {karnataka_input['state']}")
print(f"  2. District: {karnataka_input['district']}")
print(f"  3. Variety: {karnataka_input['variety']}")
print(f"  4. Season: {karnataka_input['season']}")
print(f"  5. Soil Type: {karnataka_input['soil_type']}")
print(f"  6. Soil pH: {karnataka_input['soil_ph']}")
print(f"  7. Soil Moisture: {karnataka_input['soil_moisture']}%")
print(f"  8. Rainfall: {karnataka_input['rainfall_mm']} mm")
print(f"  9. Temperature: {karnataka_input['temperature_c']}°C")
print(f" 10. Humidity: {karnataka_input['humidity_pct']}%")
print(f" 11. Historical Yield: {karnataka_input['historical_yield']} t/ha")

# Run prediction
print("\n" + "="*80)
print("RUNNING XGBOOST PREDICTION")
print("="*80)

result = engine.predict(karnataka_input)

print(f"\n✅ Model: {result['model_used']}")
print(f"✅ Algorithm: {result['algorithm']}")

print("\n" + "="*80)
print("PREDICTION RESULTS")
print("="*80)

print(f"\n📊 YIELD FORECAST:")
print(f"  Base Model Prediction: {result['base_model_yield']} t/ha")
print(f"  Season Adjustment Factor: ×{result['season_adjustment']}")
print(f"  ─────────────────────────────────────")
print(f"  FINAL PREDICTED YIELD: {result['predicted_yield']} t/ha")
print(f"  ─────────────────────────────────────")
print(f"  Total Production: {result['expected_production']} tons")
print(f"  Farm Area: {karnataka_input['area_hectare']} hectares")

print(f"\n🎯 CONFIDENCE & RISK:")
print(f"  Prediction Confidence: {result['confidence']}%")
print(f"  Risk Level: {result['risk']}")
print(f"  Crop Health Status: {result['crop_health']}")

print(f"\n📈 YIELD RANGE (90% Confidence):")
print(f"  Lower Bound: {result['expected_range']['low']} t/ha")
print(f"  Predicted: {result['predicted_yield']} t/ha")
print(f"  Upper Bound: {result['expected_range']['high']} t/ha")

print(f"\n💰 YIELD GAP ANALYSIS:")
print(f"  Reference Yield (Optimal): {result['reference_yield']} t/ha")
print(f"  Your Prediction: {result['predicted_yield']} t/ha")
print(f"  Expected Loss: {result['expected_loss_t']} t/ha ({result['expected_loss_pct']}%)")

# Season Intelligence
intel = result['variety_season_intelligence']
suitability = intel['season_suitability']

print("\n" + "="*80)
print("VARIETY-SEASON ANALYSIS")
print("="*80)

print(f"\n🌱 SEASON SUITABILITY:")
if suitability['is_suitable']:
    print(f"  ✅ {suitability['message']}")
else:
    print(f"  ⚠️  {suitability['message']}")

print(f"\n  Current Season: {karnataka_input['season']}")
print(f"  Season Multiplier: ×{suitability['yield_multiplier']}")
print(f"  Recommended Season: {suitability['recommended_season']}")

# Optimization opportunity
if not suitability['is_suitable']:
    opt = intel['yield_optimization']
    print(f"\n💡 YIELD OPTIMIZATION OPPORTUNITY:")
    print(f"  Current Yield (Summer): {opt['predicted_yield']} t/ha")
    print(f"  Potential (Optimal Season): {opt['potential_yield_optimal_season']} t/ha")
    print(f"  ═══════════════════════════════════════════")
    print(f"  POTENTIAL GAIN: +{opt['potential_gain']} t/ha (+{opt['gain_percentage']}%)")
    print(f"  ═══════════════════════════════════════════")
    
    # Economic impact
    gain_tons = opt['potential_gain'] * karnataka_input['area_hectare']
    price_per_ton = 5000  # ₹5,000 per ton (example)
    revenue_gain = gain_tons * price_per_ton
    
    print(f"\n  Economic Impact (@ ₹{price_per_ton:,}/ton):")
    print(f"    Additional Production: {gain_tons:.2f} tons")
    print(f"    Additional Revenue: ₹{revenue_gain:,.0f}")

# Input Quality
print("\n" + "="*80)
print("INPUT QUALITY ANALYSIS")
print("="*80)

print(f"\n🎯 Parameter Assessment:")
for param, analysis in intel['input_analysis'].items():
    status_icon = "✓" if analysis['status'] == 'Optimal' else "○" if analysis['status'] == 'Acceptable' else "⚠"
    print(f"  {status_icon} {param.replace('_', ' ').title():15s}: {analysis['message']}")

# Recommendations
print("\n" + "="*80)
print("ACTIONABLE RECOMMENDATIONS")
print("="*80)

print(f"\n💡 Top Priority Actions:")
high_priority = [r for r in intel['recommendations'] if r['priority'] == 'High']
medium_priority = [r for r in intel['recommendations'] if r['priority'] == 'Medium']
info_priority = [r for r in intel['recommendations'] if r['priority'] == 'Info']

if high_priority:
    print(f"\n  🔴 HIGH PRIORITY:")
    for i, rec in enumerate(high_priority, 1):
        print(f"    {i}. {rec['icon']} {rec['message']}")
        print(f"       Impact: {rec['impact']}")

if medium_priority:
    print(f"\n  🟡 MEDIUM PRIORITY:")
    for i, rec in enumerate(medium_priority, 1):
        print(f"    {i}. {rec['icon']} {rec['message']}")

if info_priority:
    print(f"\n  🟢 INFORMATION:")
    for rec in info_priority:
        print(f"    • {rec['icon']} {rec['message']}")

# Feature Importance
print("\n" + "="*80)
print("MODEL INSIGHTS")
print("="*80)

print(f"\n🔝 Top 5 Factors Influencing Prediction:")
for i, feat in enumerate(result['feature_importance'][:5], 1):
    print(f"  {i}. {feat['feature']:20s}: {feat['pct']:5.1f}% importance")

print("\n" + "="*80)
print("FINAL RECOMMENDATION")
print("="*80)

# Decision logic
if not suitability['is_suitable']:
    print(f"\n⚠️  RECOMMENDATION: CONSIDER SEASON CHANGE")
    print(f"\n  Current Plan:")
    print(f"    Season: Summer")
    print(f"    Expected Yield: {result['predicted_yield']} t/ha")
    print(f"    Total Production: {result['expected_production']} tons")
    print(f"    Revenue (@ ₹5000/ton): ₹{result['expected_production'] * 5000:,.0f}")
    
    opt = intel['yield_optimization']
    optimal_production = opt['potential_yield_optimal_season'] * karnataka_input['area_hectare']
    
    print(f"\n  Recommended Plan:")
    print(f"    Season: {suitability['recommended_season']}")
    print(f"    Expected Yield: {opt['potential_yield_optimal_season']} t/ha")
    print(f"    Total Production: {optimal_production:.2f} tons")
    print(f"    Revenue (@ ₹5000/ton): ₹{optimal_production * 5000:,.0f}")
    
    print(f"\n  ✅ BENEFIT: +₹{(optimal_production - result['expected_production']) * 5000:,.0f}")
else:
    print(f"\n✅ RECOMMENDATION: PROCEED WITH CURRENT PLAN")
    print(f"\n  Your season choice is optimal for this variety.")
    print(f"  Expected yield: {result['predicted_yield']} t/ha")
    print(f"  Continue with current inputs and management practices.")

# Save results
output_file = 'karnataka_prediction_final.json'
with open(output_file, 'w') as f:
    json.dump(result, f, indent=2)

print(f"\n💾 Full results saved to: {output_file}")

print("\n" + "="*80)
print("PREDICTION COMPLETE")
print("="*80)
print(f"\nModel: XGBoost Gradient Boosting")
print(f"Confidence: {result['confidence']}%")
print(f"Predicted Yield: {result['predicted_yield']} t/ha")
print(f"Total Production: {result['expected_production']} tons")
print("="*80)
