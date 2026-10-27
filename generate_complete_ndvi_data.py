"""
Generate NDVI data for ALL sugarcane-growing districts in India
Complete coverage: 100+ districts across 11 states
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path

# District coordinates (comprehensive list)
DISTRICT_COORDINATES = {
    # Uttar Pradesh (15 districts)
    "Muzaffarnagar": {"lat": 29.4727, "lon": 77.7085},
    "Meerut": {"lat": 28.9845, "lon": 77.7064},
    "Bijnor": {"lat": 29.3730, "lon": 78.1363},
    "Saharanpur": {"lat": 29.9680, "lon": 77.5460},
    "Bareilly": {"lat": 28.3640, "lon": 79.4150},
    "Lakhimpur Kheri": {"lat": 27.9470, "lon": 80.7790},
    "Deoria": {"lat": 26.5024, "lon": 83.7791},
    "Bulandshahr": {"lat": 28.4066, "lon": 77.8498},
    "Moradabad": {"lat": 28.8389, "lon": 78.7768},
    "Gorakhpur": {"lat": 26.7606, "lon": 83.3732},
    "Gonda": {"lat": 27.1333, "lon": 81.9617},
    "Basti": {"lat": 26.8086, "lon": 82.7386},
    "Sultanpur": {"lat": 26.2646, "lon": 82.0736},
    "Ballia": {"lat": 25.7561, "lon": 84.1489},
    "Shahjahanpur": {"lat": 27.8900, "lon": 79.9100},
    
    # Maharashtra (14 districts)
    "Kolhapur": {"lat": 16.7050, "lon": 74.2433},
    "Sangli": {"lat": 16.8544, "lon": 74.5641},
    "Satara": {"lat": 17.6805, "lon": 74.0183},
    "Ahmednagar": {"lat": 19.0948, "lon": 74.7480},
    "Pune": {"lat": 18.5204, "lon": 73.8567},
    "Solapur": {"lat": 17.6599, "lon": 75.9064},
    "Nashik": {"lat": 19.9975, "lon": 73.7898},
    "Jalgaon": {"lat": 21.0077, "lon": 75.5626},
    "Dhule": {"lat": 20.9015, "lon": 74.7774},
    "Nandurbar": {"lat": 21.3667, "lon": 74.2500},
    "Aurangabad": {"lat": 19.8762, "lon": 75.3433},
    "Beed": {"lat": 18.9894, "lon": 75.7585},
    "Latur": {"lat": 18.3983, "lon": 76.5604},
    "Osmanabad": {"lat": 18.1774, "lon": 76.0405},
    
    # Karnataka (14 districts - "Sugar Bowl of Karnataka")
    "Belagavi": {"lat": 15.8497, "lon": 74.4977},
    "Bagalkot": {"lat": 16.1875, "lon": 75.6972},
    "Vijayapura": {"lat": 16.8302, "lon": 75.7100},
    "Mandya": {"lat": 12.5244, "lon": 76.8950},
    "Mysuru": {"lat": 12.2958, "lon": 76.6394},
    "Chamrajanagar": {"lat": 11.9259, "lon": 76.9393},
    "Shivamogga": {"lat": 13.9299, "lon": 75.5681},
    "Uttara Kannada": {"lat": 14.7951, "lon": 74.6869},
    "Bidar": {"lat": 17.9134, "lon": 77.5301},
    "Raichur": {"lat": 16.2000, "lon": 77.3667},
    "Bellary": {"lat": 15.1394, "lon": 76.9214},
    "Davangere": {"lat": 14.4644, "lon": 75.9217},
    "Chitradurga": {"lat": 14.2226, "lon": 76.4010},
    "Hassan": {"lat": 13.0033, "lon": 76.0977},
    
    # Tamil Nadu (14 districts)
    "Coimbatore": {"lat": 11.0168, "lon": 76.9558},
    "Erode": {"lat": 11.3410, "lon": 77.7172},
    "Salem": {"lat": 11.6643, "lon": 78.1460},
    "Thanjavur": {"lat": 10.7870, "lon": 79.1378},
    "Tiruchirappalli": {"lat": 10.7905, "lon": 78.7047},
    "Cuddalore": {"lat": 11.7480, "lon": 79.7714},
    "Villupuram": {"lat": 11.9401, "lon": 79.4861},
    "Tiruvannamalai": {"lat": 12.2253, "lon": 79.0747},
    "Vellore": {"lat": 12.9165, "lon": 79.1325},
    "Namakkal": {"lat": 11.2189, "lon": 78.1677},
    "Karur": {"lat": 10.9601, "lon": 78.0766},
    "Pudukkottai": {"lat": 10.3833, "lon": 78.8000},
    "Nagapattinam": {"lat": 10.7672, "lon": 79.8449},
    "Tiruvarur": {"lat": 10.7730, "lon": 79.6345},
    
    # Andhra Pradesh (10 districts)
    "East Godavari": {"lat": 17.0005, "lon": 82.0000},
    "West Godavari": {"lat": 16.7500, "lon": 81.5000},
    "Krishna": {"lat": 16.5500, "lon": 80.6200},
    "Visakhapatnam": {"lat": 17.6868, "lon": 83.2185},
    "Guntur": {"lat": 16.3067, "lon": 80.4365},
    "Prakasam": {"lat": 15.3500, "lon": 79.5833},
    "Nellore": {"lat": 14.4426, "lon": 79.9865},
    "Vizianagaram": {"lat": 18.1167, "lon": 83.4000},
    "Srikakulam": {"lat": 18.2949, "lon": 83.8938},
    "Chittoor": {"lat": 13.2172, "lon": 79.1003},
    
    # Gujarat (8 districts)
    "Surat": {"lat": 21.1702, "lon": 72.8311},
    "Navsari": {"lat": 20.9500, "lon": 72.9200},
    "Bharuch": {"lat": 21.7051, "lon": 72.9959},
    "Valsad": {"lat": 20.5992, "lon": 72.9342},
    "Tapi": {"lat": 21.1333, "lon": 73.4167},
    "Vadodara": {"lat": 22.3072, "lon": 73.1812},
    "Kheda": {"lat": 22.7500, "lon": 72.6833},
    "Anand": {"lat": 22.5645, "lon": 72.9289},
    
    # Haryana (6 districts)
    "Yamuna Nagar": {"lat": 30.1290, "lon": 77.2674},
    "Karnal": {"lat": 29.6857, "lon": 76.9905},
    "Kurukshetra": {"lat": 29.9695, "lon": 76.8783},
    "Ambala": {"lat": 30.3781, "lon": 76.7821},
    "Panipat": {"lat": 29.3909, "lon": 76.9635},
    "Rohtak": {"lat": 28.8955, "lon": 76.5892},
    
    # Punjab (7 districts)
    "Jalandhar": {"lat": 31.3260, "lon": 75.5762},
    "Gurdaspur": {"lat": 32.0409, "lon": 75.4057},
    "Amritsar": {"lat": 31.6340, "lon": 74.8723},
    "Ludhiana": {"lat": 30.9010, "lon": 75.8573},
    "Patiala": {"lat": 30.3398, "lon": 76.3869},
    "Sangrur": {"lat": 30.2450, "lon": 75.8450},
    "Ferozepur": {"lat": 30.9180, "lon": 74.6140},
    
    # Bihar (8 districts)
    "Champaran": {"lat": 26.9850, "lon": 84.5200},
    "Siwan": {"lat": 26.2183, "lon": 84.3560},
    "Gopalganj": {"lat": 26.4686, "lon": 84.4386},
    "Muzaffarpur": {"lat": 26.1209, "lon": 85.3647},
    "Darbhanga": {"lat": 26.1542, "lon": 85.8918},
    "Samastipur": {"lat": 25.8658, "lon": 85.7820},
    "Vaishali": {"lat": 25.9820, "lon": 85.1314},
    "Saran": {"lat": 25.9206, "lon": 84.7480},
    
    # Telangana (6 districts)
    "Nizamabad": {"lat": 18.6725, "lon": 78.0941},
    "Medak": {"lat": 18.0499, "lon": 78.2647},
    "Karimnagar": {"lat": 18.4386, "lon": 79.1288},
    "Nalgonda": {"lat": 17.0500, "lon": 79.2667},
    "Khammam": {"lat": 17.2473, "lon": 80.1514},
    "Warangal": {"lat": 17.9784, "lon": 79.6000},
    
    # Uttarakhand (3 districts)
    "Haridwar": {"lat": 29.9457, "lon": 78.1642},
    "Dehradun": {"lat": 30.3165, "lon": 78.0322},
    "Udham Singh Nagar": {"lat": 28.9800, "lon": 79.4100},
}

# Climate zones
CLIMATE_ZONES = {
    "Uttar Pradesh": "subtropical_humid",
    "Maharashtra": "tropical_dry",
    "Karnataka": "tropical_savanna",
    "Tamil Nadu": "tropical_dry",
    "Andhra Pradesh": "tropical_wet_dry",
    "Gujarat": "semi_arid",
    "Haryana": "subtropical_dry",
    "Punjab": "subtropical_humid",
    "Bihar": "humid_subtropical",
    "Telangana": "semi_arid",
    "Uttarakhand": "subtropical_montane",
}

# NDVI parameters by climate zone
ZONE_PARAMS = {
    "subtropical_humid": {"base": 0.60, "amplitude": 0.15, "noise": 0.05},
    "tropical_dry": {"base": 0.53, "amplitude": 0.12, "noise": 0.06},
    "tropical_savanna": {"base": 0.58, "amplitude": 0.14, "noise": 0.05},
    "tropical_wet_dry": {"base": 0.55, "amplitude": 0.13, "noise": 0.06},
    "semi_arid": {"base": 0.48, "amplitude": 0.11, "noise": 0.07},
    "subtropical_dry": {"base": 0.52, "amplitude": 0.12, "noise": 0.06},
    "humid_subtropical": {"base": 0.62, "amplitude": 0.16, "noise": 0.05},
    "subtropical_montane": {"base": 0.56, "amplitude": 0.13, "noise": 0.06},
}


def generate_ndvi_timeseries(district_name, state, lat, lon, days=730):
    """Generate realistic NDVI time series"""
    climate_zone = CLIMATE_ZONES.get(state, "tropical_savanna")
    params = ZONE_PARAMS[climate_zone]
    
    end_date = datetime.now()
    dates = [end_date - timedelta(days=i) for i in range(days, 0, -1)]
    
    ndvi_values = []
    for date in dates:
        day_of_year = date.timetuple().tm_yday
        seasonal = params['amplitude'] * np.sin(2 * np.pi * day_of_year / 365 - np.pi/2)
        ndvi = params['base'] + seasonal + np.random.normal(0, params['noise'])
        ndvi = np.clip(ndvi, 0.2, 0.85)
        ndvi_values.append(ndvi)
    
    df = pd.DataFrame({
        'date': [d.strftime('%Y-%m-%d') for d in dates],
        'district': district_name,
        'state': state,
        'latitude': lat,
        'longitude': lon,
        'ndvi': ndvi_values,
        'cloud_cover': np.random.uniform(0, 15, len(dates)),
        'data_source': 'synthetic_climate_based'
    })
    
    return df


def main():
    print("=" * 80)
    print("COMPLETE NDVI Data Generation - All Sugarcane Districts")
    print("=" * 80)
    
    # Load complete district list
    with open('backend/data/sugarcane_districts_complete.json', 'r', encoding='utf-8') as f:
        geography = json.load(f)
    
    district_to_state = {}
    for item in geography:
        for district in item['districts']:
            district_to_state[district] = item['state']
    
    all_data = []
    total_districts = len(DISTRICT_COORDINATES)
    
    print(f"\nGenerating NDVI data for {total_districts} districts...\n")
    
    for idx, (district, coords) in enumerate(DISTRICT_COORDINATES.items(), 1):
        state = district_to_state.get(district, "Unknown")
        climate_zone = CLIMATE_ZONES.get(state, "tropical_savanna")
        
        print(f"[{idx}/{total_districts}] {district}, {state} ({climate_zone})")
        
        df = generate_ndvi_timeseries(
            district_name=district,
            state=state,
            lat=coords['lat'],
            lon=coords['lon'],
            days=730
        )
        
        all_data.append(df)
        
        # Save individual file
        safe_name = district.lower().replace(' ', '_')
        district_file = f'cleaned_data/NDVI_{safe_name}_cleaned.csv'
        df.to_csv(district_file, index=False, encoding='utf-8')
        print(f"   ✅ {district_file}")
    
    # Combine all
    combined_df = pd.concat(all_data, ignore_index=True)
    combined_df['date'] = pd.to_datetime(combined_df['date'])
    combined_df = combined_df.sort_values(['state', 'district', 'date'])
    
    output_file = 'cleaned_data/NDVI_all_districts_complete.csv'
    combined_df.to_csv(output_file, index=False, encoding='utf-8')
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total districts: {len(DISTRICT_COORDINATES)}")
    print(f"Total records: {len(combined_df):,}")
    print(f"Date range: {combined_df['date'].min()} to {combined_df['date'].max()}")
    print(f"\n📍 Districts by State:")
    for state in sorted(combined_df['state'].unique()):
        count = len(combined_df[combined_df['state'] == state]['district'].unique())
        print(f"   {state}: {count} districts")
    
    print("\n✅ Complete NDVI data generated!")


if __name__ == "__main__":
    main()
