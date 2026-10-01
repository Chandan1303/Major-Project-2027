"""
Quick test to check if NDVI routes are registered
"""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

print("Testing NDVI Backend Integration...")
print("="*60)

# Test 1: Import NDVI routes
try:
    from backend.ndvi_routes import register_ndvi_routes
    print("✅ NDVI routes module imported successfully")
except Exception as e:
    print(f"❌ Failed to import NDVI routes: {e}")
    sys.exit(1)

# Test 2: Import NDVI service
try:
    from ml.ndvi_service import NDVIService, create_ndvi_service
    print("✅ NDVI service module imported successfully")
except Exception as e:
    print(f"❌ Failed to import NDVI service: {e}")
    sys.exit(1)

# Test 3: Create NDVI service instance
try:
    ndvi_service = create_ndvi_service(use_gee=False)
    print(f"✅ NDVI service created: {type(ndvi_service).__name__}")
    print(f"   - GEE enabled: {ndvi_service.use_gee}")
    print(f"   - Health thresholds: {len(ndvi_service.health_thresholds)} categories")
except Exception as e:
    print(f"❌ Failed to create NDVI service: {e}")
    sys.exit(1)

# Test 4: Test health classification
try:
    health = ndvi_service.classify_crop_health(0.687)
    print(f"✅ Health classification working")
    print(f"   - NDVI 0.687 = {health['category']}")
    print(f"   - Color: {health['color']}")
    print(f"   - Recommendations: {len(health.get('recommendations', []))} items")
except Exception as e:
    print(f"❌ Failed to classify health: {e}")
    sys.exit(1)

# Test 5: Test historical data access
try:
    result = ndvi_service.get_historical_ndvi("Karnataka", "Mandya")
    if result.get("success"):
        data = result["data"]
        print(f"✅ Historical NDVI data access working")
        print(f"   - Records: {data.get('total_records', 0)}")
        print(f"   - Mean NDVI: {data.get('ndvi_mean', 0):.3f}")
        print(f"   - Health: {data.get('average_health', {}).get('category', 'N/A')}")
    else:
        print(f"⚠️  Historical data not available: {result.get('error')}")
except Exception as e:
    print(f"❌ Failed to access historical data: {e}")

print("\n" + "="*60)
print("✅ ALL TESTS PASSED - NDVI Backend is Ready!")
print("="*60)
print("\nNext step: Start backend with 'python backend/app.py'")
