"""
Final ML Dataset Creator - Using ALL Your Existing Data
========================================================

Uses:
1. DATASET_cleaned.csv (rainfall, temperature, sunlight, soil NPK) - 91 records
2. NDVI CSVs (Belagavi, Mandya, Punjab, Tamil Nadu) - 15,446 records
3. combined_sugarcane_dataset.csv (historical yield) - 18,486 records
4. Variety master (57 varieties)
5. Irrigation data

NO APIs needed - Everything from your existing files!

Team: Dayanand, Chandan (Lead), Harsha, Mohammad
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

print("="*70)
print("FINAL ML DATASET CREATOR - COMPLETE VERSION")
print("Using ALL your existing data files")
print("="*70)
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# Paths
project_root = Path(__file__).parent
cleaned_data = project_root / 'cleaned_data'
output_dir = project_root / 'final_dataset'
output_dir.mkdir(exist_ok=True)

# =============================================================================
# STEP 1: Load Primary Weather Dataset
# =============================================================================
print("[1/7] Loading primary weather dataset...")
print("-" * 70)

weather_file = cleaned_data / 'DATASET_cleaned.csv'
if weather_file.exists():
    weather_df = pd.read_csv(weather_file)
    print(f"  Loaded DATASET_cleaned.csv: {len(weather_df)} records")
    print(f"  Columns: {list(weather_df.columns)}")
    print(f"\n  Sample data:")
    print(weather_df.head(2))
else:
    print("  ERROR: DATASET_cleaned.csv not found!")
    weather_df = pd.DataFrame()

# =============================================================================
# STEP 2: Load Historical Yield Data
# =============================================================================
print("\n[2/7] Loading historical yield data...")
print("-" * 70)

base_file = project_root / 'combined_sugarcane_dataset.csv'
if base_file.exists():
    base_df = pd.read_csv(base_file, low_memory=False)
    print(f"  Loaded combined_sugarcane_dataset.csv: {len(base_df)} records")
    
    # Extract key columns
    key_cols = ['state_name', 'district_name', 'year', 'season', 
               'area_hectare', 'yield_t_ha', 'yield_tons_per_hectare']
    available_cols = [col for col in key_cols if col in base_df.columns]
    
    if available_cols:
        historical_df = base_df[available_cols].copy()
        
        # Standardize
        if 'state_name' in historical_df.columns:
            historical_df['state'] = historical_df['state_name'].str.strip().str.title()
        if 'district_name' in historical_df.columns:
            historical_df['district'] = historical_df['district_name'].str.strip().str.title()
        if 'yield_t_ha' in historical_df.columns:
            historical_df['yield'] = pd.to_numeric(historical_df['yield_t_ha'], errors='coerce')
        elif 'yield_tons_per_hectare' in historical_df.columns:
            historical_df['yield'] = pd.to_numeric(historical_df['yield_tons_per_hectare'], errors='coerce')
        
        historical_df = historical_df[historical_df['yield'].notna() & (historical_df['yield'] > 0)]
        print(f"  Clean records with yield: {len(historical_df)}")
    else:
        historical_df = pd.DataFrame()
else:
    print("  ERROR: combined_sugarcane_dataset.csv not found!")
    historical_df = pd.DataFrame()

# =============================================================================
# STEP 3: Load NDVI Data
# =============================================================================
print("\n[3/7] Loading NDVI data...")
print("-" * 70)

ndvi_files = {
    'Belagavi': 'NDVI_belagavi_cleaned.csv',
    'Mandya': 'NDVI_mandya_cleaned.csv',
    'Punjab': 'NDVI_punjab_cleaned.csv',
    'Tamil Nadu': 'NDVI_tamil_nadu_cleaned.csv'
}

all_ndvi = []
for region, filename in ndvi_files.items():
    filepath = cleaned_data / filename
    if filepath.exists():
        ndvi_df = pd.read_csv(filepath)
        ndvi_df['region'] = region
        all_ndvi.append(ndvi_df)
        print(f"  {region:15s}: {len(ndvi_df):,} records")

if all_ndvi:
    combined_ndvi = pd.concat(all_ndvi, ignore_index=True)
    
    # Calculate statistics by region
    ndvi_stats = combined_ndvi.groupby('region')['ndvi'].agg([
        ('ndvi_mean', 'mean'),
        ('ndvi_max', 'max'),
        ('ndvi_min', 'min'),
        ('ndvi_std', 'std')
    ]).reset_index()
    
    print(f"\n  Total NDVI records: {len(combined_ndvi):,}")
    print(f"\n  NDVI Statistics:")
    print(ndvi_stats.to_string(index=False))
else:
    ndvi_stats = pd.DataFrame()

# =============================================================================
# STEP 4: Load Irrigation Data
# =============================================================================
print("\n[4/7] Loading irrigation data...")
print("-" * 70)

irrigation_file = cleaned_data / 'Crop wise irrigation_Cleaned.csv'
if irrigation_file.exists():
    irrigation_df = pd.read_csv(irrigation_file)
    print(f"  Loaded: {len(irrigation_df)} irrigation records")
    print(f"  Years: {irrigation_df['Year'].min()} - {irrigation_df['Year'].max()}")
else:
    irrigation_df = pd.DataFrame()

# =============================================================================
# STEP 5: Load Variety Master
# =============================================================================
print("\n[5/7] Loading variety master...")
print("-" * 70)

variety_file = project_root / 'backend' / 'data' / 'sugarcane_varieties_master.csv'
if variety_file.exists():
    variety_df = pd.read_csv(variety_file, on_bad_lines='skip', engine='python')
    print(f"  Loaded: {len(variety_df)} varieties")
else:
    print("  Variety file not found")
    variety_df = pd.DataFrame()

# =============================================================================
# STEP 6: Integrate All Data
# =============================================================================
print("\n[6/7] Integrating all data sources...")
print("-" * 70)

# Start with historical yield data
if not historical_df.empty:
    final_df = historical_df.copy()
    print(f"  Base: {len(final_df)} records from historical data")
    
    # Add historical features
    if 'year' in final_df.columns and 'yield' in final_df.columns:
        final_df = final_df.sort_values(['state', 'district', 'year'])
        final_df['prev_year_yield'] = final_df.groupby(['state', 'district'])['yield'].shift(1)
        final_df['yield_3yr_avg'] = final_df.groupby(['state', 'district'])['yield'].transform(
            lambda x: x.rolling(window=3, min_periods=1).mean()
        )
        final_df['yield_5yr_avg'] = final_df.groupby(['state', 'district'])['yield'].transform(
            lambda x: x.rolling(window=5, min_periods=1).mean()
        )
        print(f"  Added historical yield features")
    
    # Merge NDVI
    if not ndvi_stats.empty:
        district_to_region = {
            'Belagavi': 'Belagavi', 'Belgaum': 'Belagavi',
            'Mandya': 'Mandya', 'Mysuru': 'Mandya', 'Mysore': 'Mandya',
            'Jalandhar': 'Punjab', 'Gurdaspur': 'Punjab', 'Amritsar': 'Punjab', 
            'Ludhiana': 'Punjab', 'Patiala': 'Punjab',
            'Coimbatore': 'Tamil Nadu', 'Erode': 'Tamil Nadu', 'Salem': 'Tamil Nadu',
            'Villupuram': 'Tamil Nadu', 'Cuddalore': 'Tamil Nadu'
        }
        
        final_df['ndvi_region'] = final_df['district'].map(district_to_region)
        final_df = final_df.merge(ndvi_stats, left_on='ndvi_region', right_on='region', how='left')
        matched = final_df['ndvi_mean'].notna().sum()
        print(f"  Merged NDVI: {matched} records matched")
    
    # Add weather data from DATASET_cleaned.csv
    if not weather_df.empty:
        # Create variety-based weather mapping
        variety_weather = weather_df.groupby('seed_variety').agg({
            'rainfall_mm': 'mean',
            'avg_temperature_celsius': 'mean',
            'sunlight_hours_per_day': 'mean',
            'nitrogen_n_kg_per_acre': 'mean',
            'phosphorus_p_kg_per_acre': 'mean',
            'potassium_k_kg_per_acre': 'mean',
            'crop_duration_days': 'mean',
            'irrigation_frequency_per_month': 'mean'
        }).reset_index()
        
        print(f"\n  Weather data by variety:")
        print(variety_weather.to_string(index=False))
    
    # Assign varieties by state
    state_varieties = {
        'Karnataka': 'Co 86032',
        'Maharashtra': 'CoM 0265',
        'Uttar Pradesh': 'Co 0238',
        'Tamil Nadu': 'Co 86032',
        'Punjab': 'CoPb 94',
        'Haryana': 'CoH 160',
        'Gujarat': 'Co 99004',
        'Andhra Pradesh': 'Co 86032',
        'Bihar': 'Co 0238',
        'West Bengal': 'Co 0238'
    }
    
    final_df['variety'] = final_df['state'].map(state_varieties).fillna('Co 86032')
    print(f"\n  Assigned varieties to all records")
    
    # Add weather features based on variety
    if not weather_df.empty:
        # Map variety names (handle different formats)
        variety_map = {
            'Co86032': 'Co 86032',
            'Co0238': 'Co 0238',
            'CoM0265': 'CoM 0265',
            'Co 86032': 'Co 86032',
            'Co 0238': 'Co 0238',
            'CoM 0265': 'CoM 0265'
        }
        
        for idx, row in variety_weather.iterrows():
            variety_key = variety_map.get(row['seed_variety'], row['seed_variety'])
            mask = final_df['variety'] == variety_key
            
            if mask.any():
                final_df.loc[mask, 'rainfall_mm'] = row['rainfall_mm']
                final_df.loc[mask, 'temperature_c'] = row['avg_temperature_celsius']
                final_df.loc[mask, 'sunlight_hours'] = row['sunlight_hours_per_day']
                final_df.loc[mask, 'soil_nitrogen'] = row['nitrogen_n_kg_per_acre']
                final_df.loc[mask, 'soil_phosphorus'] = row['phosphorus_p_kg_per_acre']
                final_df.loc[mask, 'soil_potassium'] = row['potassium_k_kg_per_acre']
                final_df.loc[mask, 'crop_duration_days'] = row['crop_duration_days']
                final_df.loc[mask, 'irrigation_frequency'] = row['irrigation_frequency_per_month']
        
        weather_matched = final_df['rainfall_mm'].notna().sum()
        print(f"  Merged weather data: {weather_matched} records")
    
    print(f"\n  Final integrated dataset: {len(final_df)} records, {len(final_df.columns)} features")

else:
    print("  ERROR: No base data to integrate!")
    final_df = pd.DataFrame()

# =============================================================================
# STEP 7: Save Final Dataset
# =============================================================================
print("\n[7/7] Saving final ML dataset...")
print("-" * 70)

if not final_df.empty:
    output_file = output_dir / 'SUGARCANE_COMPLETE_ML_DATASET.csv'
    final_df.to_csv(output_file, index=False)
    
    print(f"\nSaved: {output_file}")
    print(f"  Records: {len(final_df):,}")
    print(f"  Features: {len(final_df.columns)}")
    print(f"  Size: {output_file.stat().st_size / (1024**2):.2f} MB")
    
    # Data quality report
    print(f"\nData Quality Report:")
    print("="*70)
    
    key_features = [
        'yield', 'variety', 'ndvi_mean', 'rainfall_mm', 'temperature_c',
        'soil_nitrogen', 'soil_phosphorus', 'soil_potassium', 
        'prev_year_yield', 'yield_3yr_avg'
    ]
    
    for feat in key_features:
        if feat in final_df.columns:
            completeness = final_df[feat].notna().mean() * 100
            status = "[OK]  " if completeness > 70 else "[LOW] " if completeness > 40 else "[MISS]"
            print(f"  {status} {feat:25s}: {completeness:6.1f}%")
    
    # Summary statistics
    print(f"\nDataset Summary:")
    print("="*70)
    if 'state' in final_df.columns:
        print(f"  States: {final_df['state'].nunique()}")
    if 'district' in final_df.columns:
        print(f"  Districts: {final_df['district'].nunique()}")
    if 'variety' in final_df.columns:
        print(f"  Varieties: {final_df['variety'].nunique()}")
        print(f"\n  Variety distribution:")
        print(final_df['variety'].value_counts().head(10).to_string())
    if 'yield' in final_df.columns:
        print(f"\n  Yield statistics (t/ha):")
        print(f"    Mean:   {final_df['yield'].mean():.2f}")
        print(f"    Median: {final_df['yield'].median():.2f}")
        print(f"    Min:    {final_df['yield'].min():.2f}")
        print(f"    Max:    {final_df['yield'].max():.2f}")
    
    # Save column info
    column_info = pd.DataFrame({
        'column': final_df.columns,
        'dtype': final_df.dtypes,
        'non_null': final_df.notna().sum(),
        'null_pct': (final_df.isna().sum() / len(final_df) * 100).round(1)
    })
    
    column_file = output_dir / 'dataset_columns_info.csv'
    column_info.to_csv(column_file, index=False)
    print(f"\n  Column info saved: {column_file}")
    
else:
    print("  ERROR: No data to save!")

print("\n" + "="*70)
print("COMPLETE!")
print("="*70)
print(f"Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if not final_df.empty:
    print(f"\nYour complete ML dataset: {output_file}")
    print("\nReady for:")
    print("  - XGBoost Regressor")
    print("  - Random Forest Regressor")
    print("  - Variety comparison analysis")
    print("  - Flask API development")
    print("  - React dashboard")
