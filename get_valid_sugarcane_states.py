"""
Get valid sugarcane-growing states for the prediction system.
Only include states where sugarcane is commercially cultivated.
"""
import json

# Load the sugarcane states data
with open('sugarcane_growing_states.json', 'r') as f:
    data = json.load(f)

print("="*80)
print("VALID SUGARCANE-GROWING STATES FOR INDIA")
print("="*80)

print("\n🌾 TOP 5 STATES (88% of India's Production):")
print("-"*80)
for i, state in enumerate(data['top_5_states_90_percent_production'], 1):
    # Get details
    details = [s for s in data['major_sugarcane_states'] if s['state'] == state][0]
    print(f"{i}. {state:20s} - {details['production_share']:6s} (Rank #{details['rank']})")

print("\n🌾 RECOMMENDED 11 STATES FOR MODEL (99% Coverage):")
print("-"*80)
for i, state in enumerate(data['recommended_states_for_model'], 1):
    details = [s for s in data['major_sugarcane_states'] if s['state'] == state][0]
    print(f"{i:2d}. {state:20s} - {details['region']:10s} - {details['production_share']}")

print("\n❌ STATES TO EXCLUDE (No Commercial Sugarcane):")
print("-"*80)
for i, state in enumerate(data['non_sugarcane_states'], 1):
    print(f"{i:2d}. {state}")

print("\n" + "="*80)
print("FRONTEND DROPDOWN OPTIONS")
print("="*80)

print("\n📋 Use these states in your dropdown:")
print("-"*80)
print("```javascript")
print("const validSugarcaneStates = [")
for state in data['recommended_states_for_model']:
    print(f'  "{state}",')
print("];")
print("```")

print("\n📋 Or group by region:")
print("-"*80)
print("```javascript")
print("const sugarcaneStatesByRegion = {")

# Group by region
regions = {}
for state_data in data['major_sugarcane_states']:
    if state_data['state'] in data['recommended_states_for_model']:
        region = state_data['region']
        if region not in regions:
            regions[region] = []
        regions[region].append(state_data['state'])

for region, states in sorted(regions.items()):
    print(f'  "{region}": [')
    for state in states:
        print(f'    "{state}",')
    print('  ],')
print("};")
print("```")

print("\n" + "="*80)
print("API VALIDATION")
print("="*80)

print("\n📋 Backend validation code:")
print("-"*80)
print("```python")
print("# Valid sugarcane-growing states")
print("VALID_SUGARCANE_STATES = [")
for state in data['recommended_states_for_model']:
    print(f'    "{state}",')
print("]")
print("")
print("def validate_state(state: str) -> tuple[bool, str]:")
print('    """Validate if state grows sugarcane commercially"""')
print("    if state not in VALID_SUGARCANE_STATES:")
print('        return False, f"State \\"{state}\\" does not have commercial sugarcane cultivation. Please select a valid sugarcane-growing state."')
print("    return True, \"Valid state\"")
print("```")

print("\n" + "="*80)
print("TRAINING DATA VERIFICATION")
print("="*80)

# Check which states in training data should be used
import pandas as pd

try:
    df = pd.read_csv('final_dataset/SUGARCANE_COMPLETE_ML_DATASET.csv')
    training_states = sorted(df['state'].dropna().unique())
    
    valid_in_training = [s for s in training_states if s in data['recommended_states_for_model']]
    invalid_in_training = [s for s in training_states if s not in data['recommended_states_for_model']]
    
    print(f"\n✅ Valid states in training data ({len(valid_in_training)}):")
    for state in valid_in_training:
        count = len(df[df['state'] == state])
        print(f"  ✓ {state:25s} - {count:5d} records")
    
    print(f"\n⚠️  Invalid states in training data ({len(invalid_in_training)}):")
    print("   (These should be filtered out or handled carefully)")
    for state in invalid_in_training:
        count = len(df[df['state'] == state])
        print(f"  ⚠ {state:25s} - {count:5d} records (non-sugarcane state)")
    
    # Statistics
    total_records = len(df)
    valid_records = len(df[df['state'].isin(data['recommended_states_for_model'])])
    invalid_records = total_records - valid_records
    
    print(f"\n📊 Training Data Statistics:")
    print(f"  Total records: {total_records:,}")
    print(f"  Valid state records: {valid_records:,} ({valid_records/total_records*100:.1f}%)")
    print(f"  Invalid state records: {invalid_records:,} ({invalid_records/total_records*100:.1f}%)")
    
    if invalid_records > 0:
        print(f"\n⚠️  Recommendation: Consider filtering out {invalid_records:,} records from non-sugarcane states")
        print(f"   This will improve model accuracy for actual sugarcane-growing regions")

except FileNotFoundError:
    print("\n⚠️  Training dataset not found - skipping verification")

print("\n" + "="*80)
print("✅ COMPLETED")
print("="*80)
