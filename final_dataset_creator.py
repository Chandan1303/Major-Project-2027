"""
Simple Final Dataset Creator
=============================

Creates ML-ready dataset using:
1. Your existing CSV files (NDVI, Soil, etc.)
2. Real weather data from OpenWeather API
3. Your variety data

NO EMOJIS - Windows compatible
"""

import pandas as pd
import numpy as np
import requests
from pathlib import Path
from datetime import datetime
import time

# Your OpenWeather API key (replace with your actual key)
OPENWEATHER_API_KEY = "YOUR_API_KEY_HERE"

# District coordinates for weather data
DISTRICT_COORDS = {
    'Mandya': (12.5244, 76.8958),
    'Belagavi': (15.8497, 74.4977),
    'Mysuru': (12.2958, 76.6394),
    'Pune': (18.5204, 73.8567),
    'Kolhapur': (16.7050, 74.2433),
    'Coimbatore': (11.0168, 76.9558),
    'Jalandhar': (31.3260, 75.5762),
}


def fetch_weather(lat, lon, location_name):
    """Fetch current weather from OpenWeather API"""
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        'lat': lat,
        'lon': lon,
        'appid': OPENWEATHER_API_KEY,
        'units': 'metric'
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return {
                'location': location_name,
                'temperature': data['main']['temp'],
                'humidity': data['main']['humidity'],
                'wind_speed': data['wind']['speed'],
                'clouds': data['clouds']['all'],
                'pressure': data['main']['pressure']
            }
        else:
            print(f"  Error {location_name}: Status {response.status_code}")
            return None
    except Exception as e:
        print(f"  Error {location_name}: {str(e)}")
        return None


print("="*70)
print("FINAL DATASET CREATOR")
print("="*70)
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# Step 1: Load base dataset
print("\n[1/6] Loading base dataset...")
base_df = pd.read_csv('combined_sugarcane_dataset.csv', low_memory=False)
print(f"  Loaded: {len(base_df)} records")

# Extract key columns
key_cols = ['state_name', 'district_name', 'year', 'season', 'area_hectare', 
           'yield_t_ha', 'yield_tons_per_hectare']
available_cols = [col for col in key_cols if col in base_df.columns]
df = base_df[available_cols].copy()

# Standardize
if 'state_name' in df.columns:
    df['state'] = df['state_name'].str.strip().str.title()
if 'district_name' in df.columns:
    df['district'] = df['district_name'].str.strip().str.title()
if 'yield_t_ha' in df.columns:
    df['yield'] = pd.to_numeric(df['yield_t_ha'], errors='coerce')
elif 'yield_tons_per_hectare' in df.columns:
    df['yield'] = pd.to_numeric(df['yield_tons_per_hectare'], errors='coerce')

df = df[df['yield'].notna() & (df['yield'] > 0)]
print(f"  Clean records: {len(df)}")

# Step 2: Collect weather data
print("\n[2/6] Collecting weather data...")
print(f"  API Key: {OPENWEATHER_API_KEY[:10]}...")

weather_data = []
for district, (lat, lon) in DISTRICT_COORDS.items():
    print(f"  Fetching: {district}...", end=" ")
    weather = fetch_weather(lat, lon, district)
    if weather:
        weather_data.append(weather)
        print(f"OK ({weather['temperature']}C)")
    else:
        print("FAILED")
    time.sleep(1)  # Rate limit

if weather_data:
    weather_df = pd.DataFrame(weather_data)
    print(f"\n  Collected: {len(weather_df)} weather records")
else:
    print("\n  No weather data collected")
    weather_df = pd.DataFrame()

# Step 3: Load NDVI data
print("\n[3/6] Loading NDVI data...")
ndvi_files = {
    'Belagavi': 'cleaned_data/NDVI_belagavi_cleaned.csv',
    'Mandya': 'cleaned_data/NDVI_mandya_cleaned.csv',
    'Punjab': 'cleaned_data/NDVI_punjab_cleaned.csv',
    'Tamil Nadu': 'cleaned_data/NDVI_tamil_nadu_cleaned.csv'
}

all_ndvi = []
for region, file in ndvi_files.items():
    if Path(file).exists():
        ndvi_df = pd.read_csv(file)
        ndvi_df['region'] = region
        all_ndvi.append(ndvi_df)
        print(f"  {region}: {len(ndvi_df)} records")

if all_ndvi:
    combined_ndvi = pd.concat(all_ndvi, ignore_index=True)
    ndvi_stats = combined_ndvi.groupby('region')['ndvi'].agg([
        ('ndvi_mean', 'mean'),
        ('ndvi_max', 'max'),
        ('ndvi_min', 'min')
    ]).reset_index()
    print(f"  Total NDVI: {len(combined_ndvi)} records")
else:
    print("  No NDVI data found")
    ndvi_stats = pd.DataFrame()

# Step 4: Load variety data
print("\n[4/6] Loading variety data...")
variety_file = 'backend/data/sugarcane_varieties_master.csv'
if Path(variety_file).exists():
    variety_df = pd.read_csv(variety_file, on_bad_lines='skip', engine='python')
    print(f"  Loaded: {len(variety_df)} varieties")
else:
    print("  Variety file not found")
    variety_df = pd.DataFrame()

# Step 5: Integrate everything
print("\n[5/6] Integrating data...")

# Merge weather
if not weather_df.empty:
    # Map district names
    district_map = {
        'Mandya': 'Mandya',
        'Mysuru': 'Mandya',
        'Belagavi': 'Belagavi',
        'Belgaum': 'Belagavi',
        'Pune': 'Pune',
        'Kolhapur': 'Kolhapur',
        'Coimbatore': 'Coimbatore',
        'Jalandhar': 'Jalandhar'
    }
    
    df['weather_district'] = df['district'].map(district_map)
    df = df.merge(
        weather_df[['location', 'temperature', 'humidity', 'wind_speed']],
        left_on='weather_district',
        right_on='location',
        how='left'
    )
    print(f"  Weather merged: {df['temperature'].notna().sum()} records")

# Merge NDVI
if not ndvi_stats.empty:
    district_to_region = {
        'Belagavi': 'Belagavi',
        'Belgaum': 'Belagavi',
        'Mandya': 'Mandya',
        'Mysuru': 'Mandya',
        'Jalandhar': 'Punjab',
        'Gurdaspur': 'Punjab',
        'Coimbatore': 'Tamil Nadu',
        'Erode': 'Tamil Nadu'
    }
    
    df['ndvi_region'] = df['district'].map(district_to_region)
    df = df.merge(ndvi_stats, left_on='ndvi_region', right_on='region', how='left')
    print(f"  NDVI merged: {df['ndvi_mean'].notna().sum()} records")

# Assign varieties
state_varieties = {
    'Karnataka': 'Co 86032',
    'Maharashtra': 'CoM 0265',
    'Uttar Pradesh': 'Co 0238',
    'Tamil Nadu': 'Co 86032',
    'Punjab': 'CoPb 94',
    'Gujarat': 'Co 99004'
}

df['variety'] = df['state'].map(state_varieties).fillna('Co 86032')
print(f"  Varieties assigned: {df['variety'].notna().sum()} records")

# Add historical features
if 'year' in df.columns:
    df = df.sort_values(['state', 'district', 'year'])
    df['prev_year_yield'] = df.groupby(['state', 'district'])['yield'].shift(1)
    df['yield_3yr_avg'] = df.groupby(['state', 'district'])['yield'].transform(
        lambda x: x.rolling(window=3, min_periods=1).mean()
    )
    print(f"  Historical features added")

# Step 6: Save final dataset
print("\n[6/6] Saving final dataset...")

output_dir = Path('final_dataset')
output_dir.mkdir(exist_ok=True)

output_file = output_dir / 'SUGARCANE_ML_DATASET.csv'
df.to_csv(output_file, index=False)

print(f"\nSaved: {output_file}")
print(f"  Records: {len(df):,}")
print(f"  Features: {len(df.columns)}")
print(f"  Size: {output_file.stat().st_size / (1024**2):.2f} MB")

# Data quality
print("\nData Quality:")
for feat in ['yield', 'variety', 'temperature', 'humidity', 'ndvi_mean', 'prev_year_yield']:
    if feat in df.columns:
        comp = df[feat].notna().mean() * 100
        status = "[OK]" if comp > 70 else "[LOW]" if comp > 40 else "[MISS]"
        print(f"  {status} {feat:20s}: {comp:5.1f}%")

print("\n"+"="*70)
print("COMPLETE!")
print("="*70)
print(f"Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"\nYour ML dataset: {output_file}")
print("\nNext: Train XGBoost and Random Forest models!")
