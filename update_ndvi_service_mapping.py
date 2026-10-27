"""
Auto-generate NDVI district mapping for ndvi_service.py
"""

import json

# Load complete district list
with open('backend/data/sugarcane_districts_complete.json', 'r', encoding='utf-8') as f:
    geography = json.load(f)

# Generate mapping dictionary
print("        # Map districts to NDVI regions (all 105+ districts)")
print("        district_to_region_file = {")

for state_data in geography:
    state = state_data['state']
    districts = state_data['districts']
    
    print(f"            # {state} ({len(districts)} districts)")
    for district in districts:
        safe_name = district.lower().replace(' ', '_')
        print(f'            "{district}": "NDVI_{safe_name}_cleaned.csv",')
    print()

print("        }")
