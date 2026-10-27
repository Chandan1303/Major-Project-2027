"""
Test the Geography API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5000"

print("=" * 80)
print("Testing Geography APIs")
print("=" * 80)

# Test 1: Get all states
print("\n1. GET /api/geography/states")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/api/geography/states")
    data = response.json()
    
    if data.get("success"):
        states = data["data"]["states"]
        print(f"✅ SUCCESS: Found {len(states)} states")
        for state in states:
            print(f"   - {state['name']} ({state['district_count']} districts)")
    else:
        print(f"❌ ERROR: {data.get('message')}")
except Exception as e:
    print(f"❌ EXCEPTION: {e}")

# Test 2: Get districts for Maharashtra
print("\n2. GET /api/geography/districts?state=Maharashtra")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/api/geography/districts?state=Maharashtra")
    data = response.json()
    
    if data.get("success"):
        districts = data["data"]["districts"]
        print(f"✅ SUCCESS: Found {len(districts)} districts in Maharashtra")
        print(f"   Districts: {', '.join(districts[:5])}...")
    else:
        print(f"❌ ERROR: {data.get('message')}")
except Exception as e:
    print(f"❌ EXCEPTION: {e}")

# Test 3: Get districts for Karnataka
print("\n3. GET /api/geography/districts?state=Karnataka")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/api/geography/districts?state=Karnataka")
    data = response.json()
    
    if data.get("success"):
        districts = data["data"]["districts"]
        print(f"✅ SUCCESS: Found {len(districts)} districts in Karnataka")
        print(f"   Districts: {', '.join(districts)}")
    else:
        print(f"❌ ERROR: {data.get('message')}")
except Exception as e:
    print(f"❌ EXCEPTION: {e}")

# Test 4: Get varieties for Maharashtra
print("\n4. GET /api/geography/varieties?state=Maharashtra")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/api/geography/varieties?state=Maharashtra")
    data = response.json()
    
    if data.get("success"):
        varieties = data["data"]["varieties"]
        print(f"✅ SUCCESS: Found {len(varieties)} varieties for Maharashtra")
        print(f"   Varieties: {', '.join(varieties)}")
    else:
        print(f"❌ ERROR: {data.get('message')}")
except Exception as e:
    print(f"❌ EXCEPTION: {e}")

# Test 5: Get varieties for Karnataka
print("\n5. GET /api/geography/varieties?state=Karnataka")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/api/geography/varieties?state=Karnataka")
    data = response.json()
    
    if data.get("success"):
        varieties = data["data"]["varieties"]
        print(f"✅ SUCCESS: Found {len(varieties)} varieties for Karnataka")
        print(f"   Varieties: {', '.join(varieties)}")
    else:
        print(f"❌ ERROR: {data.get('message')}")
except Exception as e:
    print(f"❌ EXCEPTION: {e}")

# Test 6: Get varieties for Tamil Nadu
print("\n6. GET /api/geography/varieties?state=Tamil Nadu")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/api/geography/varieties?state=Tamil Nadu")
    data = response.json()
    
    if data.get("success"):
        varieties = data["data"]["varieties"]
        print(f"✅ SUCCESS: Found {len(varieties)} varieties for Tamil Nadu")
        print(f"   Varieties: {', '.join(varieties)}")
    else:
        print(f"❌ ERROR: {data.get('message')}")
except Exception as e:
    print(f"❌ EXCEPTION: {e}")

# Test 7: Get varieties for Uttar Pradesh
print("\n7. GET /api/geography/varieties?state=Uttar Pradesh")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/api/geography/varieties?state=Uttar Pradesh")
    data = response.json()
    
    if data.get("success"):
        varieties = data["data"]["varieties"]
        print(f"✅ SUCCESS: Found {len(varieties)} varieties for Uttar Pradesh")
        print(f"   Varieties: {', '.join(varieties)}")
    else:
        print(f"❌ ERROR: {data.get('message')}")
except Exception as e:
    print(f"❌ EXCEPTION: {e}")

print("\n" + "=" * 80)
print("Summary: State-Specific Varieties")
print("=" * 80)
all_states = ["Uttar Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu", "Bihar", 
              "Haryana", "Punjab", "Andhra Pradesh", "Telangana", "Gujarat", "Uttarakhand"]

for state in all_states:
    try:
        response = requests.get(f"{BASE_URL}/api/geography/varieties?state={state}")
        data = response.json()
        if data.get("success"):
            varieties = data["data"]["varieties"]
            print(f"{state:20s} → {len(varieties)} varieties: {', '.join(varieties)}")
    except:
        pass

print("\n" + "=" * 80)
print("✅ All Geography API tests completed!")
print("=" * 80)
