"""
Create mock NDVI data for new districts by copying from existing data
This is a quick solution for testing/demo purposes
"""
import pandas as pd
from pathlib import Path

# GPS coordinates for new districts
NEW_DISTRICTS = {
    # Karnataka - New Districts
    "Vijayapura": {"lat": 16.8302, "lon": 75.7100, "state": "Karnataka"},
    "Chikkamagaluru": {"lat": 13.3161, "lon": 75.7720, "state": "Karnataka"},
    "Davangere": {"lat": 14.4644, "lon": 75.9218, "state": "Karnataka"},
    "Raichur": {"lat": 16.2076, "lon": 77.3463, "state": "Karnataka"},
    "Bellary": {"lat": 15.1394, "lon": 76.9214, "state": "Karnataka"},
    "Chitradurga": {"lat": 14.2226, "lon": 76.3980, "state": "Karnataka"},
    "Uttara Kannada": {"lat": 14.7937, "lon": 74.6869, "state": "Karnataka"},
    
    # Uttar Pradesh - New Districts
    "Basti": {"lat": 26.8050, "lon": 82.7382, "state": "Uttar Pradesh"},
    "Gonda": {"lat": 27.1333, "lon": 81.9667, "state": "Uttar Pradesh"},
    "Gorakhpur": {"lat": 26.7606, "lon": 83.3732, "state": "Uttar Pradesh"},
    "Pilibhit": {"lat": 28.6250, "lon": 79.8050, "state": "Uttar Pradesh"},
    "Shahjahanpur": {"lat": 27.8830, "lon": 79.9050, "state": "Uttar Pradesh"},
    "Bulandshahr": {"lat": 28.4067, "lon": 77.8498, "state": "Uttar Pradesh"},
    
    # Maharashtra - New Districts
    "Nashik": {"lat": 19.9975, "lon": 73.7898, "state": "Maharashtra"},
    "Jalgaon": {"lat": 21.0077, "lon": 75.5626, "state": "Maharashtra"},
    "Dhule": {"lat": 20.9042, "lon": 74.7749, "state": "Maharashtra"},
    "Nandurbar": {"lat": 21.3667, "lon": 74.2333, "state": "Maharashtra"},
    "Beed": {"lat": 18.9894, "lon": 75.7636, "state": "Maharashtra"},
    "Osmanabad": {"lat": 18.1773, "lon": 76.0407, "state": "Maharashtra"},
    
    # Tamil Nadu - New Districts
    "Tirunelveli": {"lat": 8.7139, "lon": 77.7567, "state": "Tamil Nadu"},
    "Thoothukudi": {"lat": 8.7642, "lon": 78.1348, "state": "Tamil Nadu"},
    "Villupuram": {"lat": 11.9395, "lon": 79.4924, "state": "Tamil Nadu"},
    "Namakkal": {"lat": 11.2189, "lon": 78.1677, "state": "Tamil Nadu"},
    "Karur": {"lat": 10.9601, "lon": 78.0766, "state": "Tamil Nadu"},
    "Perambalur": {"lat": 11.2321, "lon": 78.8794, "state": "Tamil Nadu"},
    
    # Andhra Pradesh - New Districts
    "Guntur": {"lat": 16.3067, "lon": 80.4365, "state": "Andhra Pradesh"},
    "Prakasam": {"lat": 15.3500, "lon": 79.5833, "state": "Andhra Pradesh"},
    "Chittoor": {"lat": 13.2172, "lon": 79.1003, "state": "Andhra Pradesh"},
    "Nellore": {"lat": 14.4426, "lon": 79.9865, "state": "Andhra Pradesh"},
    
    # Gujarat - New Districts
    "Tapi": {"lat": 21.1333, "lon": 73.4167, "state": "Gujarat"},
    "Narmada": {"lat": 21.8713, "lon": 73.5094, "state": "Gujarat"},
    "Ahmedabad": {"lat": 23.0225, "lon": 72.5714, "state": "Gujarat"},
    "Kheda": {"lat": 22.7497, "lon": 72.6839, "state": "Gujarat"},
    
    # Bihar - New Districts
    "Muzaffarpur": {"lat": 26.1225, "lon": 85.3906, "state": "Bihar"},
    "Saran": {"lat": 25.9260, "lon": 84.8575, "state": "Bihar"},
    "Darbhanga": {"lat": 26.1542, "lon": 85.8918, "state": "Bihar"},
    "Vaishali": {"lat": 25.9820, "lon": 85.1319, "state": "Bihar"},
    
    # Telangana - New Districts
    "Khammam": {"lat": 17.2473, "lon": 80.1514, "state": "Telangana"},
    "Warangal": {"lat": 17.9784, "lon": 79.6005, "state": "Telangana"},
    "Nalgonda": {"lat": 17.0501, "lon": 79.2672, "state": "Telangana"},
    "Sangareddy": {"lat": 17.6211, "lon": 78.0831, "state": "Telangana"},
}

def create_mock_ndvi_file(district_name, coords):
    """Create a mock NDVI CSV file for a district"""
    
    # Read template from Belagavi
    template_file = Path("cleaned_data/NDVI_belagavi_cleaned.csv")
    if not template_file.exists():
        print(f"❌ Template file not found: {template_file}")
        return False
    
    # Read template data
    df = pd.read_csv(template_file)
    
    # Update coordinates and region name
    df['latitude'] = coords['lat']
    df['longitude'] = coords['lon']
    df['region'] = district_name
    
    # Add some variation to NDVI values (±5%) to make it look different
    import numpy as np
    np.random.seed(hash(district_name) % 2**32)  # Deterministic variation
    variation = np.random.uniform(0.95, 1.05, size=len(df))
    df['ndvi'] = (df['ndvi'] * variation).clip(0.1, 1.0)  # Keep in valid range
    
    # Create output filename
    safe_name = district_name.lower().replace(' ', '_')
    output_file = Path(f"cleaned_data/NDVI_{safe_name}_cleaned.csv")
    
    # Save
    df.to_csv(output_file, index=False, encoding='utf-8')
    
    return True

def main():
    """Create mock NDVI files for all new districts"""
    print("=" * 80)
    print("Creating Mock NDVI Data for New Districts")
    print("=" * 80)
    print()
    
    created_count = 0
    failed_count = 0
    
    for district, coords in NEW_DISTRICTS.items():
        print(f"Creating NDVI data for {district}, {coords['state']}...", end=" ")
        
        if create_mock_ndvi_file(district, coords):
            created_count += 1
            print("✅")
        else:
            failed_count += 1
            print("❌")
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Successfully created: {created_count} files")
    print(f"❌ Failed: {failed_count} files")
    print(f"📁 Location: cleaned_data/NDVI_*_cleaned.csv")
    print()
    print("⚠️  NOTE: This is MOCK DATA for testing/demo purposes only!")
    print("   For production, collect real satellite data using:")
    print("   python collect_ndvi_all_districts.py")
    print()
    print("🔄 Next step: Restart backend to load new NDVI files")
    print("   python run_backend.py")
    print("=" * 80)

if __name__ == "__main__":
    main()
