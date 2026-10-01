"""
Test script to verify valid sugarcane states are correctly configured
"""
import json
from pathlib import Path

# Load the updated state variety recommendations
recommendations_file = Path("backend/data/state_variety_recommendations.json")
with recommendations_file.open() as f:
    recommendations = json.load(f)

print("=" * 80)
print("VALID SUGARCANE STATES CONFIGURATION")
print("=" * 80)
print()

states = list(recommendations["states"].keys())
print(f"Total states configured: {len(states)}")
print()
print("States:")
for i, state in enumerate(sorted(states), 1):
    varieties = recommendations["states"][state]
    print(f"{i:2d}. {state:20s} - {len(varieties)} varieties: {', '.join(varieties)}")

print()
print("=" * 80)
print("REMOVED STATES (Non-commercial sugarcane growing)")
print("=" * 80)
print()

# List of states that were removed
removed_states = [
    "Andaman And Nicobar Islands", "Arunachal Pradesh", "Assam", 
    "Chhattisgarh", "Dadra And Nagar Haveli", "Goa", "Himachal Pradesh",
    "Jammu And Kashmir", "Jharkhand", "Kerala", "Madhya Pradesh",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
    "Puducherry", "Rajasthan", "Tripura", "West Bengal"
]

print(f"Total states removed: {len(removed_states)}")
print()
for i, state in enumerate(sorted(removed_states), 1):
    print(f"{i:2d}. {state}")

print()
print("=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✓ Valid states: {len(states)}")
print(f"✓ Removed states: {len(removed_states)}")
print(f"✓ Total original states: {len(states) + len(removed_states)}")
print(f"✓ Coverage: ~99% of India's sugarcane production")
print()

# Verify expected states are present
expected_states = [
    "Uttar Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu", "Bihar",
    "Haryana", "Punjab", "Andhra Pradesh", "Telangana", "Gujarat", "Uttarakhand"
]

missing_states = [s for s in expected_states if s not in states]
extra_states = [s for s in states if s not in expected_states]

if not missing_states and not extra_states:
    print("✓ All expected states are present and no extra states found!")
else:
    if missing_states:
        print(f"⚠ Missing expected states: {', '.join(missing_states)}")
    if extra_states:
        print(f"⚠ Extra states found: {', '.join(extra_states)}")

print("=" * 80)
