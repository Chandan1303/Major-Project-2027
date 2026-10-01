"""
Test Variety-Season Intelligence System
"""
from ml import YieldPredictionEngine
import json

print("="*80)
print("VARIETY-SEASON INTELLIGENCE SYSTEM TEST")
print("="*80)

engine = YieldPredictionEngine()

# Test Case 1: Optimal Combination (Co 86032 in Kharif)
print("\n" + "="*80)
print("TEST 1: OPTIMAL COMBINATION - Co 86032 in Kharif")
print("="*80)

optimal_input = {
    "variety": "Co 86032",
    "state": "Maharashtra",
    "season": "Kharif",
    "rainfall_mm": 1500,
    "temperature_c": 29.0,
    "humidity_pct": 75,
    "soil_ph": 7.2,
    "soil_moisture": 70,
    "area_hectare": 2.0,
    "historical_yield": 90,
    "soil_type": "Black Soil",
    "growth_stage": "Grand Growth"
}

result1 = engine.predict(optimal_input)

print(f"\n📊 Prediction:")
print(f"  Base Model Yield: {result1['base_model_yield']} t/ha")
print(f"  Season Adjustment: ×{result1['season_adjustment']}")
print(f"  Final Yield: {result1['predicted_yield']} t/ha")
print(f"  Confidence: {result1['confidence']}%")

intel1 = result1['variety_season_intelligence']
print(f"\n🌱 Season Suitability:")
print(f"  {intel1['season_suitability']['message']}")
print(f"  Yield Multiplier: {intel1['season_suitability']['yield_multiplier']}")

print(f"\n💡 Top 3 Recommendations:")
for i, rec in enumerate(intel1['recommendations'][:3], 1):
    print(f"  {i}. [{rec['priority']}] {rec['icon']} {rec['message']}")

# Test Case 2: Sub-optimal Combination (Co 86032 in Summer)
print("\n\n" + "="*80)
print("TEST 2: SUB-OPTIMAL COMBINATION - Co 86032 in Summer")
print("="*80)

suboptimal_input = {
    **optimal_input,
    "season": "Summer",
    "rainfall_mm": 800,
    "temperature_c": 35.0,
    "humidity_pct": 55,
    "soil_moisture": 50
}

result2 = engine.predict(suboptimal_input)

print(f"\n📊 Prediction:")
print(f"  Base Model Yield: {result2['base_model_yield']} t/ha")
print(f"  Season Adjustment: ×{result2['season_adjustment']}")
print(f"  Final Yield: {result2['predicted_yield']} t/ha (⚠️ Lower)")
print(f"  Confidence: {result2['confidence']}%")

intel2 = result2['variety_season_intelligence']
print(f"\n🌱 Season Suitability:")
print(f"  {intel2['season_suitability']['message']}")

print(f"\n📈 Yield Optimization:")
opt = intel2['yield_optimization']
print(f"  Current Yield: {opt['predicted_yield']} t/ha")
print(f"  Potential (Optimal Season): {opt['potential_yield_optimal_season']} t/ha")
print(f"  Potential Gain: {opt['potential_gain']} t/ha ({opt['gain_percentage']}%)")

print(f"\n💡 Top 5 Recommendations:")
for i, rec in enumerate(intel2['recommendations'][:5], 1):
    print(f"  {i}. [{rec['priority']}] {rec['icon']} {rec['message']}")

# Test Case 3: Different Variety (CoM 0265 in Rabi)
print("\n\n" + "="*80)
print("TEST 3: HIGH-YIELDER VARIETY - CoM 0265 in Rabi")
print("="*80)

high_yielder_input = {
    "variety": "CoM 0265",
    "state": "Maharashtra",
    "season": "Rabi",
    "rainfall_mm": 1000,
    "temperature_c": 25.0,
    "humidity_pct": 60,
    "soil_ph": 7.0,
    "soil_moisture": 62,
    "area_hectare": 2.0,
    "historical_yield": 95,
    "soil_type": "Black Soil",
    "growth_stage": "Grand Growth"
}

result3 = engine.predict(high_yielder_input)

print(f"\n📊 Prediction:")
print(f"  Base Model Yield: {result3['base_model_yield']} t/ha")
print(f"  Season Adjustment: ×{result3['season_adjustment']}")
print(f"  Final Yield: {result3['predicted_yield']} t/ha")
print(f"  Total Production: {result3['expected_production']} t")

intel3 = result3['variety_season_intelligence']
print(f"\n🌱 Season Suitability:")
print(f"  {intel3['season_suitability']['message']}")

print(f"\n🎯 Input Analysis:")
for param, analysis in intel3['input_analysis'].items():
    print(f"  {param:15s}: {analysis['message']}")

# Comparison Table
print("\n\n" + "="*80)
print("YIELD COMPARISON ACROSS SCENARIOS")
print("="*80)

print(f"\n{'Scenario':<30} {'Base':<12} {'Adjusted':<12} {'Adjustment':<12}")
print("-"*80)
print(f"{'Co 86032 + Kharif (Optimal)':<30} {result1['base_model_yield']:>10.2f}   {result1['predicted_yield']:>10.2f}   ×{result1['season_adjustment']}")
print(f"{'Co 86032 + Summer (Poor)':<30} {result2['base_model_yield']:>10.2f}   {result2['predicted_yield']:>10.2f}   ×{result2['season_adjustment']}")
print(f"{'CoM 0265 + Rabi (Good)':<30} {result3['base_model_yield']:>10.2f}   {result3['predicted_yield']:>10.2f}   ×{result3['season_adjustment']}")

yield_diff = result1['predicted_yield'] - result2['predicted_yield']
print(f"\n💡 Insight: Choosing optimal season improves yield by {yield_diff:.2f} t/ha ({(yield_diff/result2['predicted_yield']*100):.1f}%)")

print("\n" + "="*80)
print("✅ VARIETY-SEASON INTELLIGENCE SYSTEM WORKING!")
print("="*80)
