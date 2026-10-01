import pandas as pd
import json

# Load dataset
df = pd.read_csv('final_dataset/SUGARCANE_AGRONOMIC_ML_DATASET.csv')

# Extract state-variety mapping
state_varieties = {}
for state in sorted(df['state'].unique()):
    varieties = sorted(df[df['state'] == state]['variety'].unique().tolist())
    state_varieties[state] = varieties

# Print as JSON
print(json.dumps(state_varieties, indent=2))

# Also show counts
print("\n" + "="*80)
print("State-Variety Distribution with Record Counts:")
print("="*80)
for state in sorted(state_varieties.keys()):
    print(f"\n{state}:")
    state_df = df[df['state'] == state]
    for variety in state_varieties[state]:
        count = len(state_df[state_df['variety'] == variety])
        print(f"  - {variety}: {count} records")
