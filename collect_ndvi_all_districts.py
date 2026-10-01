"""
Collect NDVI data for all major sugarcane districts in India
Using Google Earth Engine + Sentinel-2 satellite imagery

Author: Chandan (Lead), Dayanand, Harsha, Mohammad
Date: 2026-10-01
"""

import json
import pandas as pd
import ee
from datetime import datetime, timedelta
import os
import time

# District coordinates (approximate center points for major sugarcane regions)
DISTRICT_COORDINATES = {
    # Uttar Pradesh - Expanded
    "Muzaffarnagar": {"lat": 29.4727, "lon": 77.7085},
    "Meerut": {"lat": 28.9845, "lon": 77.7064},
    "Bijnor": {"lat": 29.3730, "lon": 78.1363},
    "Saharanpur": {"lat": 29.9680, "lon": 77.5460},
    "Bareilly": {"lat": 28.3640, "lon": 79.4150},
    "Lakhimpur Kheri": {"lat": 27.9470, "lon": 80.7790},
    "Deoria": {"lat": 26.5024, "lon": 83.7791},
    "Basti": {"lat": 26.8050, "lon": 82.7382},
    "Gonda": {"lat": 27.1333, "lon": 81.9667},
    "Gorakhpur": {"lat": 26.7606, "lon": 83.3732},
    "Pilibhit": {"lat": 28.6250, "lon": 79.8050},
    "Shahjahanpur": {"lat": 27.8830, "lon": 79.9050},
    "Bulandshahr": {"lat": 28.4067, "lon": 77.8498},
    
    # Maharashtra - Expanded
    "Kolhapur": {"lat": 16.7050, "lon": 74.2433},
    "Sangli": {"lat": 16.8544, "lon": 74.5641},
    "Satara": {"lat": 17.6805, "lon": 74.0183},
    "Ahmednagar": {"lat": 19.0948, "lon": 74.7480},
    "Pune": {"lat": 18.5204, "lon": 73.8567},
    "Solapur": {"lat": 17.6599, "lon": 75.9064},
    "Nashik": {"lat": 19.9975, "lon": 73.7898},
    "Jalgaon": {"lat": 21.0077, "lon": 75.5626},
    "Dhule": {"lat": 20.9042, "lon": 74.7749},
    "Nandurbar": {"lat": 21.3667, "lon": 74.2333},
    "Beed": {"lat": 18.9894, "lon": 75.7636},
    "Osmanabad": {"lat": 18.1773, "lon": 76.0407},
    
    # Karnataka - Expanded (Including Uttara Kannada)
    "Belagavi": {"lat": 15.8497, "lon": 74.4977},
    "Mandya": {"lat": 12.5244, "lon": 76.8950},
    "Mysuru": {"lat": 12.2958, "lon": 76.6394},
    "Bagalkot": {"lat": 16.1875, "lon": 75.6972},
    "Shivamogga": {"lat": 13.9299, "lon": 75.5681},
    "Vijayapura": {"lat": 16.8302, "lon": 75.7100},
    "Chikkamagaluru": {"lat": 13.3161, "lon": 75.7720},
    "Davangere": {"lat": 14.4644, "lon": 75.9218},
    "Raichur": {"lat": 16.2076, "lon": 77.3463},
    "Bellary": {"lat": 15.1394, "lon": 76.9214},
    "Chitradurga": {"lat": 14.2226, "lon": 76.3980},
    "Uttara Kannada": {"lat": 14.7937, "lon": 74.6869},
    
    # Tamil Nadu - Expanded
    "Coimbatore": {"lat": 11.0168, "lon": 76.9558},
    "Erode": {"lat": 11.3410, "lon": 77.7172},
    "Salem": {"lat": 11.6643, "lon": 78.1460},
    "Thanjavur": {"lat": 10.7870, "lon": 79.1378},
    "Tiruchirappalli": {"lat": 10.7905, "lon": 78.7047},
    "Cuddalore": {"lat": 11.7480, "lon": 79.7714},
    "Tirunelveli": {"lat": 8.7139, "lon": 77.7567},
    "Thoothukudi": {"lat": 8.7642, "lon": 78.1348},
    "Villupuram": {"lat": 11.9395, "lon": 79.4924},
    "Namakkal": {"lat": 11.2189, "lon": 78.1677},
    "Karur": {"lat": 10.9601, "lon": 78.0766},
    "Perambalur": {"lat": 11.2321, "lon": 78.8794},
    
    # Andhra Pradesh - Expanded
    "East Godavari": {"lat": 17.0005, "lon": 82.0000},
    "West Godavari": {"lat": 16.7500, "lon": 81.5000},
    "Krishna": {"lat": 16.5500, "lon": 80.6200},
    "Visakhapatnam": {"lat": 17.6868, "lon": 83.2185},
    "Guntur": {"lat": 16.3067, "lon": 80.4365},
    "Prakasam": {"lat": 15.3500, "lon": 79.5833},
    "Chittoor": {"lat": 13.2172, "lon": 79.1003},
    "Nellore": {"lat": 14.4426, "lon": 79.9865},
    
    # Gujarat - Expanded
    "Surat": {"lat": 21.1702, "lon": 72.8311},
    "Navsari": {"lat": 20.9500, "lon": 72.9200},
    "Bharuch": {"lat": 21.7051, "lon": 72.9959},
    "Valsad": {"lat": 20.5992, "lon": 72.9342},
    "Tapi": {"lat": 21.1333, "lon": 73.4167},
    "Narmada": {"lat": 21.8713, "lon": 73.5094},
    "Ahmedabad": {"lat": 23.0225, "lon": 72.5714},
    "Kheda": {"lat": 22.7497, "lon": 72.6839},
    
    # Haryana
    "Yamuna Nagar": {"lat": 30.1290, "lon": 77.2674},
    "Karnal": {"lat": 29.6857, "lon": 76.9905},
    "Kurukshetra": {"lat": 29.9695, "lon": 76.8783},
    
    # Punjab
    "Jalandhar": {"lat": 31.3260, "lon": 75.5762},
    "Gurdaspur": {"lat": 32.0409, "lon": 75.4057},
    "Amritsar": {"lat": 31.6340, "lon": 74.8723},
    
    # Bihar - Expanded
    "Champaran": {"lat": 26.9850, "lon": 84.5200},
    "Siwan": {"lat": 26.2183, "lon": 84.3560},
    "Gopalganj": {"lat": 26.4686, "lon": 84.4386},
    "Muzaffarpur": {"lat": 26.1225, "lon": 85.3906},
    "Saran": {"lat": 25.9260, "lon": 84.8575},
    "Darbhanga": {"lat": 26.1542, "lon": 85.8918},
    "Vaishali": {"lat": 25.9820, "lon": 85.1319},
    
    # Telangana - Expanded
    "Nizamabad": {"lat": 18.6725, "lon": 78.0941},
    "Medak": {"lat": 18.0499, "lon": 78.2647},
    "Karimnagar": {"lat": 18.4386, "lon": 79.1288},
    "Khammam": {"lat": 17.2473, "lon": 80.1514},
    "Warangal": {"lat": 17.9784, "lon": 79.6005},
    "Nalgonda": {"lat": 17.0501, "lon": 79.2672},
    "Sangareddy": {"lat": 17.6211, "lon": 78.0831},
}


def initialize_gee():
    """Initialize Google Earth Engine"""
    try:
        ee.Initialize()
        print("✅ Google Earth Engine initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize GEE: {e}")
        print("\n🔧 To authenticate:")
        print("   1. Run: earthengine authenticate")
        print("   2. Follow the browser authentication flow")
        print("   3. Re-run this script")
        return False


def collect_ndvi_for_district(district_name, lat, lon, state, buffer_km=10):
    """
    Collect NDVI data for a district using Sentinel-2
    
    Args:
        district_name: District name
        lat: Latitude
        lon: Longitude
        state: State name
        buffer_km: Radius in kilometers around center point
    
    Returns:
        DataFrame with NDVI time series
    """
    try:
        # Create point geometry with buffer (convert km to degrees, ~111km per degree)
        buffer_deg = buffer_km / 111.0
        point = ee.Geometry.Point([lon, lat])
        region = point.buffer(buffer_deg * 111320)  # Convert to meters
        
        # Date range: Last 2 years for comprehensive data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=730)  # 2 years
        
        # Load Sentinel-2 Surface Reflectance collection
        s2 = ee.ImageCollection('COPERNICUS/S2_SR') \
            .filterBounds(region) \
            .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
        
        # Function to calculate NDVI
        def add_ndvi(image):
            ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            return image.addBands(ndvi)
        
        # Add NDVI band to all images
        s2_ndvi = s2.map(add_ndvi)
        
        # Get NDVI values as list
        def extract_ndvi(image):
            ndvi_mean = image.select('NDVI').reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=region,
                scale=10,
                maxPixels=1e9
            ).get('NDVI')
            
            return ee.Feature(None, {
                'date': image.date().format('YYYY-MM-dd'),
                'ndvi': ndvi_mean,
                'cloud_cover': image.get('CLOUDY_PIXEL_PERCENTAGE')
            })
        
        # Extract NDVI values
        ndvi_features = s2_ndvi.map(extract_ndvi)
        ndvi_data = ndvi_features.getInfo()
        
        # Convert to DataFrame
        records = []
        for feature in ndvi_data['features']:
            props = feature['properties']
            if props.get('ndvi') is not None:
                records.append({
                    'date': props['date'],
                    'district': district_name,
                    'state': state,
                    'latitude': lat,
                    'longitude': lon,
                    'ndvi': props['ndvi'],
                    'cloud_cover': props.get('cloud_cover', 0)
                })
        
        df = pd.DataFrame(records)
        
        if len(df) > 0:
            print(f"✅ {district_name}: Collected {len(df)} NDVI records")
        else:
            print(f"⚠️  {district_name}: No data available (check coordinates or date range)")
        
        return df
        
    except Exception as e:
        print(f"❌ {district_name}: Failed - {str(e)}")
        return pd.DataFrame()


def main():
    """Collect NDVI data for all districts"""
    print("=" * 80)
    print("NDVI Data Collection for Major Sugarcane Districts")
    print("Using: Sentinel-2 Satellite Imagery via Google Earth Engine")
    print("=" * 80)
    print()
    
    # Initialize GEE
    if not initialize_gee():
        return
    
    # Load state-district mapping
    with open('backend/data/india-states-districts.json', 'r', encoding='utf-8') as f:
        geography = json.load(f)
    
    # Create state lookup
    district_to_state = {}
    for item in geography:
        for district in item['districts']:
            district_to_state[district] = item['state']
    
    # Collect data for all districts
    all_data = []
    total_districts = len(DISTRICT_COORDINATES)
    
    for idx, (district, coords) in enumerate(DISTRICT_COORDINATES.items(), 1):
        state = district_to_state.get(district, "Unknown")
        print(f"\n[{idx}/{total_districts}] Collecting: {district}, {state}")
        
        df = collect_ndvi_for_district(
            district_name=district,
            lat=coords['lat'],
            lon=coords['lon'],
            state=state,
            buffer_km=15  # 15km radius for good district coverage
        )
        
        if len(df) > 0:
            all_data.append(df)
        
        # Rate limiting: Wait 2 seconds between requests
        if idx < total_districts:
            time.sleep(2)
    
    # Combine all data
    if all_data:
        combined_df = pd.concat(all_data, ignore_index=True)
        
        # Sort by district and date
        combined_df['date'] = pd.to_datetime(combined_df['date'])
        combined_df = combined_df.sort_values(['state', 'district', 'date'])
        
        # Save complete dataset
        output_file = 'cleaned_data/NDVI_all_districts_complete.csv'
        combined_df.to_csv(output_file, index=False, encoding='utf-8')
        
        print("\n" + "=" * 80)
        print("📊 COLLECTION SUMMARY")
        print("=" * 80)
        print(f"Total districts processed: {len(DISTRICT_COORDINATES)}")
        print(f"Total NDVI records: {len(combined_df):,}")
        print(f"Date range: {combined_df['date'].min()} to {combined_df['date'].max()}")
        print(f"Output file: {output_file}")
        print()
        
        # Summary by state
        print("\n📍 Records by State:")
        print(combined_df.groupby('state').size().sort_values(ascending=False).to_string())
        
        print("\n📍 Records by District:")
        district_summary = combined_df.groupby(['state', 'district']).size().reset_index(name='records')
        district_summary = district_summary.sort_values('records', ascending=False)
        print(district_summary.to_string(index=False))
        
        # Save individual district files
        print("\n💾 Saving individual district files...")
        for state in combined_df['state'].unique():
            state_data = combined_df[combined_df['state'] == state]
            for district in state_data['district'].unique():
                district_data = state_data[state_data['district'] == district]
                safe_name = district.lower().replace(' ', '_')
                district_file = f'cleaned_data/NDVI_{safe_name}_cleaned.csv'
                district_data.to_csv(district_file, index=False, encoding='utf-8')
                print(f"   ✅ {district_file} ({len(district_data)} records)")
        
        print("\n✅ NDVI data collection completed successfully!")
        
    else:
        print("\n❌ No NDVI data was collected. Check GEE authentication and coordinates.")


if __name__ == "__main__":
    main()
