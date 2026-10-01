"""
Test script to simulate the API response for states
Shows what the frontend will receive from the backend
"""
import json
from pathlib import Path

print("=" * 80)
print("SIMULATED API RESPONSES")
print("=" * 80)
print()

# Simulate /api/agriculture/options response
recommendations_file = Path("backend/data/state_variety_recommendations.json")
with recommendations_file.open() as f:
    recommendations = json.load(f)

states = sorted(recommendations["states"].keys())

print("1. GET /api/agriculture/options")
print("-" * 80)
print("Response (states field):")
print(json.dumps({"states": states}, indent=2))
print()
print(f"Total states returned: {len(states)}")
print()

# Show varieties for each state
print("2. Varieties by State")
print("-" * 80)
for state in states:
    varieties = recommendations["states"][state]
    print(f"   {state:20s} → {len(varieties)} varieties: {', '.join(varieties)}")

print()
print("=" * 80)
print("FRONTEND DROPDOWN PREVIEW")
print("=" * 80)
print()
print("State Dropdown Options:")
print("  <option value=''>Choose a supported state</option>")
for state in states:
    print(f"  <option value='{state}'>{state}</option>")

print()
print("=" * 80)
print("COMPARISON")
print("=" * 80)
print()
print("Before: 31-32 states (including invalid ones)")
print("After:  11 states (only major producers)")
print()
print("States REMOVED from dropdown:")
removed = [
    "Andaman And Nicobar Islands", "Arunachal Pradesh", "Assam",
    "Chhattisgarh", "Dadra And Nagar Haveli", "Goa", "Himachal Pradesh",
    "Jammu And Kashmir", "Jharkhand", "Kerala", "Madhya Pradesh",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
    "Puducherry", "Rajasthan", "Tripura", "West Bengal"
]
for state in removed:
    print(f"  ✗ {state}")

print()
print("States KEPT in dropdown:")
for state in states:
    print(f"  ✓ {state}")

print()
print("=" * 80)
