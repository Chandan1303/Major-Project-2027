"""
Check Google Earth Engine Setup
Quick diagnostic to see if GEE is ready for NDVI collection
"""

import sys

print("=" * 60)
print("Google Earth Engine Setup Check")
print("=" * 60)

# Step 1: Check if earthengine-api is installed
print("\n1️⃣ Checking if earthengine-api is installed...")
try:
    import ee
    print("   ✅ earthengine-api is installed")
    print(f"   📦 Version: {ee.__version__}")
except ImportError:
    print("   ❌ earthengine-api NOT installed")
    print("\n   🔧 To install:")
    print("      pip install earthengine-api")
    sys.exit(1)

# Step 2: Check if authenticated
print("\n2️⃣ Checking authentication status...")
try:
    ee.Initialize()
    print("   ✅ Google Earth Engine is authenticated and ready!")
    print("   🎉 You can now collect NDVI data")
    
    # Test a simple query
    print("\n3️⃣ Testing GEE access...")
    image = ee.Image('COPERNICUS/S2_SR/20230101T000000_20230101T000000_T43QGA')
    info = image.getInfo()
    print("   ✅ Successfully connected to Sentinel-2 data")
    
except Exception as e:
    print(f"   ❌ Not authenticated: {e}")
    print("\n   🔧 To authenticate:")
    print("      1. Run: earthengine authenticate")
    print("      2. Follow browser instructions")
    print("      3. Paste the authorization code")
    print("      4. Re-run this script")
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ All checks passed! Ready to collect NDVI data")
print("=" * 60)
print("\n📝 Next step:")
print("   python collect_ndvi_all_districts.py")
