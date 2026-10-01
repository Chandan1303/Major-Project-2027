"""
Extract official ICAR-SBI variety recommendations for major states
From sugarcane_varieties_master.csv
"""

import pandas as pd
import re

# Load the CSV with proper error handling
df = pd.read_csv('backend/data/sugarcane_varieties_master.csv', on_bad_lines='skip')

# States we want to focus on
TARGET_STATES = ['Uttar Pradesh', 'Maharashtra', 'Madhya Pradesh', 'Punjab']

# Parse recommended states
def parse_states(recommended_states_str):
    if pd.isna(recommended_states_str):
        return []
    
    # Clean up the string
    states_str = str(recommended_states_str)
    
    # Split by commas and 'and'
    states = re.split(r',|&| and ', states_str)
    
    # Clean each state
    cleaned = []
    for state in states:
        state = state.strip()
        # Remove parenthetical info
        state = re.sub(r'\([^)]*\)', '', state)
        state = state.strip()
        
        # Normalize state names
        state_map = {
            'U.P.': 'Uttar Pradesh',
            'M.P.': 'Madhya Pradesh',
            'MS': 'Maharashtra',
            'T.N.': 'Tamil Nadu',
            'A.P.': 'Andhra Pradesh',
            'W.B.': 'West Bengal',
            'Eastern U.P.': 'Uttar Pradesh',
            'Western U.P.': 'Uttar Pradesh',
            'Central U.P.': 'Uttar Pradesh',
            'Eastern Part of Uttar Pradesh': 'Uttar Pradesh',
            'Central and western Uttar Pradesh': 'Uttar Pradesh',
            'Central and Western Uttar Pradesh': 'Uttar Pradesh',
            'Central and Western part of Uttar Pradesh': 'Uttar Pradesh',
            'Central and Western U.P.': 'Uttar Pradesh',
        }
        
        if state in state_map:
            state = state_map[state]
        
        if state:
            cleaned.append(state)
    
    return list(set(cleaned))

# Extract varieties for each target state
state_varieties = {state: [] for state in TARGET_STATES}

for idx, row in df.iterrows():
    variety = row['Variety_Name']
    recommended = parse_states(row['Recommended_States'])
    
    for state in TARGET_STATES:
        if state in recommended:
            state_varieties[state].append({
                'variety': variety,
                'year': row['Year_of_Release'],
                'maturity': row['Maturity'],
                'yield': row['Cane_Yield_t_ha'],
                'sucrose': row['Sucrose_Percent'],
                'zone': row['Zone']
            })

# Print results
print("="*80)
print("OFFICIAL ICAR-SBI VARIETY RECOMMENDATIONS")
print("="*80)

for state in TARGET_STATES:
    print(f"\n{'='*80}")
    print(f"{state.upper()}")
    print(f"{'='*80}")
    
    varieties = state_varieties[state]
    print(f"Total varieties: {len(varieties)}")
    
    if varieties:
        print("\nTop 10 varieties (by year):")
        sorted_varieties = sorted(varieties, key=lambda x: x['year'], reverse=True)[:10]
        for v in sorted_varieties:
            print(f"  • {v['variety']:20s} | {v['year']} | {v['maturity']:15s} | {v['zone']}")
    
    print(f"\nAll varieties: {', '.join([v['variety'] for v in varieties])}")

# Recommend top 3 varieties for each state
print("\n" + "="*80)
print("RECOMMENDED VARIETIES TO ADD (Top 3 per state)")
print("="*80)

recommendations = {}

for state in TARGET_STATES:
    varieties = state_varieties[state]
    
    # Sort by year (newer first) and take top 5, then we'll manually select 3
    sorted_varieties = sorted(varieties, key=lambda x: x['year'], reverse=True)[:5]
    
    print(f"\n{state}:")
    for v in sorted_varieties:
        print(f"  {v['variety']:20s} | Year: {v['year']} | {v['maturity']}")
    
    recommendations[state] = [v['variety'] for v in sorted_varieties]

print("\n" + "="*80)
print("SUMMARY: Varieties to generate training data for")
print("="*80)

for state, vars in recommendations.items():
    print(f"\n{state}: {len(vars)} varieties")
    for v in vars:
        print(f"  - {v}")
