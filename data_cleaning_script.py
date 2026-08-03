"""
AI-Based Sugarcane Yield Forecasting - Data Cleaning Script
============================================================

Project: AI-Based Sugarcane Yield Forecasting and Smart Agricultural Decision Support System
Team: USN: 4NI23IS252, 4NI23IS253, 4NI24IS408, 4NI24IS412

This script cleans all CSV and Excel files collected for the sugarcane yield forecasting project.
Each file is cleaned separately and saved in the 'cleaned_data' folder.

Cleaning Operations:
- Remove duplicate rows
- Standardize column names (lowercase, underscores)
- Handle missing values appropriately
- Convert data types as needed
- Remove unnecessary columns
- Filter relevant data for sugarcane analysis
"""

import pandas as pd
import numpy as np
import os

# Create cleaned_data folder if it doesn't exist
output_folder = r'c:\Users\chand\OneDrive\Desktop\Folders\cleaned_data'
os.makedirs(output_folder, exist_ok=True)

print("="*80)
print("SUGARCANE YIELD FORECASTING - DATA CLEANING SCRIPT")
print("="*80)
print()

# ============================================================================
# 1. DATASET.csv - Main Training Dataset
# ============================================================================
print("1. Cleaning DATASET.csv...")
df = pd.read_csv(r'c:\Users\chand\OneDrive\Desktop\Folders\DATASET.csv')
print(f"   Original shape: {df.shape}")

# Remove duplicates
df = df.drop_duplicates()

# Standardize column names
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

# Ensure proper data types
numeric_columns = ['rainfall_mm', 'avg_temperature_celsius', 'sunlight_hours_per_day', 
                   'nitrogen_n_kg_per_acre', 'phosphorus_p_kg_per_acre', 'potassium_k_kg_per_acre',
                   'crop_duration_days', 'irrigation_frequency_per_month', 'yield_quintal_per_acre']

for col in numeric_columns:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Standardize seed variety names
df['seed_variety'] = df['seed_variety'].str.strip()

# Save
df.to_csv(f'{output_folder}/DATASET_cleaned.csv', index=False)
print(f"   Cleaned shape: {df.shape}")
print(f"   Varieties: {df['seed_variety'].unique()}")
print("   ✓ Saved to: cleaned_data/DATASET_cleaned.csv\n")


# ============================================================================
# 2. DB_SugarCane_SOILS_MENDELEY.csv - Soil Characteristics Data
# ============================================================================
print("2. Cleaning DB_SugarCane_SOILS_MENDELEY.csv...")
df = pd.read_csv(r'c:\Users\chand\OneDrive\Desktop\Folders\DB_SugarCane_SOILS_MENDELEY.csv', 
                 encoding='utf-8')
print(f"   Original shape: {df.shape}")

# Remove duplicates
df = df.drop_duplicates()

# Standardize column names
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_').str.replace('%', 'pct')

# Remove duplicate columns (ending with '1')
duplicate_cols = [col for col in df.columns if col.endswith('1')]
df = df.drop(columns=duplicate_cols)

# Drop final evaluation column (categorical summary)
if 'final_evaluation' in df.columns:
    df = df.drop(columns=['final_evaluation'])

# Keep rows with at least 70% data
df = df.dropna(thresh=len(df.columns)*0.7)

# Save
df.to_csv(f'{output_folder}/soil_data_cleaned.csv', index=False)
print(f"   Cleaned shape: {df.shape}")
print(f"   Soil samples: {df.shape[0]}")
print("   ✓ Saved to: cleaned_data/soil_data_cleaned.csv\n")


# ============================================================================
# 3. dataset_sugarcane_height.csv - Growth and NDVI Time Series Data
# ============================================================================
print("3. Cleaning dataset_sugarcane_height.csv...")
df = pd.read_csv(r'c:\Users\chand\OneDrive\Desktop\Folders\dataset_sugarcane_height.csv')
print(f"   Original shape: {df.shape}")

# Remove duplicates
df = df.drop_duplicates()

# Standardize column names
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

# Convert date to datetime
df['date'] = pd.to_datetime(df['date'], format='%m/%d/%Y', errors='coerce')

# Drop rows with missing dates
df = df.dropna(subset=['date'])

# Save
df.to_csv(f'{output_folder}/sugarcane_height_cleaned.csv', index=False)
print(f"   Cleaned shape: {df.shape}")
print(f"   Date range: {df['date'].min()} to {df['date'].max()}")
print("   ✓ Saved to: cleaned_data/sugarcane_height_cleaned.csv\n")


# ============================================================================
# 4. Crop wise irrigation.csv - Historical Irrigation Data
# ============================================================================
print("4. Cleaning Crop wise irrigation.csv...")
df = pd.read_csv(r'c:\Users\chand\OneDrive\Desktop\Folders\Crop wise irrigation.csv')
print(f"   Original shape: {df.shape}")

# Remove duplicates
df = df.drop_duplicates()

# Standardize column names
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

# Convert irrigated area to numeric
df['sugarcane_irrigated_area_(1000_ha)'] = pd.to_numeric(
    df['sugarcane_irrigated_area_(1000_ha)'], errors='coerce'
)

# Filter only Karnataka state data
df = df[df['state_name'] == 'Karnataka'].copy()

# Drop rows with missing values
df = df.dropna()

# Save
df.to_csv(f'{output_folder}/irrigation_data_cleaned.csv', index=False)
print(f"   Cleaned shape: {df.shape}")
print(f"   Year range: {df['year'].min()} to {df['year'].max()}")
print(f"   Districts: {df['dist_name'].nunique()}")
print("   ✓ Saved to: cleaned_data/irrigation_data_cleaned.csv\n")


# ============================================================================
# 5. data_core.csv - Fertilizer Recommendation Data (Filter Sugarcane Only)
# ============================================================================
print("5. Cleaning data_core.csv (Sugarcane data only)...")
df = pd.read_csv(r'c:\Users\chand\OneDrive\Desktop\Folders\data_core.csv')
print(f"   Original shape: {df.shape}")

# Filter only Sugarcane crop data
df = df[df['Crop Type'] == 'Sugarcane'].copy()

# Remove duplicates
df = df.drop_duplicates()

# Standardize column names
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

# Drop rows with missing values
df = df.dropna()

# Save
df.to_csv(f'{output_folder}/fertilizer_data_sugarcane_cleaned.csv', index=False)
print(f"   Cleaned shape: {df.shape}")
print(f"   Soil types: {df['soil_type'].unique()}")
print("   ✓ Saved to: cleaned_data/fertilizer_data_sugarcane_cleaned.csv\n")


# ============================================================================
# 6. Table_6.3_gross_irrigated_area_Sugercane.csv - Punjab Irrigation Data
# ============================================================================
print("6. Cleaning Table_6.3_gross_irrigated_area_Sugercane.csv...")
df = pd.read_csv(r'c:\Users\chand\OneDrive\Desktop\Folders\Table_6.3_gross_irrigated_area_Sugercane.csv')
print(f"   Original shape: {df.shape}")

# Set district as index
df = df.set_index('District/Year')

# Convert all values to numeric, handle special values
for col in df.columns:
    df[col] = df[col].replace('(a)', 0)
    df[col] = df[col].replace('NA', pd.NA)
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Reset index
df = df.reset_index()
df.rename(columns={'District/Year': 'district'}, inplace=True)

# Standardize column names
df.columns = df.columns.str.strip().str.lower()

# Save
df.to_csv(f'{output_folder}/gross_irrigated_area_cleaned.csv', index=False)
print(f"   Cleaned shape: {df.shape}")
print(f"   Districts: {df['district'].nunique()}")
print("   ✓ Saved to: cleaned_data/gross_irrigated_area_cleaned.csv\n")


# ============================================================================
# 7. NDVI Data Files - Satellite Vegetation Index (Multiple Regions)
# ============================================================================
ndvi_files = [
    ('Sugarcane_NDVI belagavi.csv', 'Belagavi'),
    ('Sugarcane_NDVI_mandya.csv', 'Mandya'),
    ('Sugarcane_NDVI_punjab.csv', 'Punjab'),
    ('Sugarcane_NDVI_tamilnadu.csv', 'Tamil Nadu')
]

for idx, (filename, region) in enumerate(ndvi_files, 7):
    print(f"{idx}. Cleaning {filename}...")
    df = pd.read_csv(f'c:\\Users\\chand\\OneDrive\\Desktop\\Folders\\{filename}')
    print(f"   Original shape: {df.shape}")
    
    # Remove duplicates
    df = df.drop_duplicates()
    
    # Drop .geo column (redundant with lat/long)
    if '.geo' in df.columns:
        df = df.drop(columns=['.geo'])
    
    # Standardize column names
    df.columns = df.columns.str.strip().str.lower().str.replace(':', '_')
    
    # Drop rows with missing NDVI
    df = df.dropna(subset=['ndvi'])
    
    # Add region identifier
    df['region'] = region
    
    # Save
    output_name = f"NDVI_{region.lower().replace(' ', '_')}_cleaned.csv"
    df.to_csv(f'{output_folder}/{output_name}', index=False)
    print(f"   Cleaned shape: {df.shape}")
    print(f"   NDVI range: {df['ndvi'].min():.3f} to {df['ndvi'].max():.3f}")
    print(f"   ✓ Saved to: cleaned_data/{output_name}\n")


# ============================================================================
# 11. Crop_SUGARCANE_HARVESTED - District-wise Harvest Data
# ============================================================================
print("11. Cleaning Crop_SUGARCANE_HARVESTED...")
df = pd.read_csv(r'c:\Users\chand\OneDrive\Desktop\Folders\Crop_SUGARCANE_HARVESTED_Area_in_Hectares_Production_in_Tonnes_Yield_in_Kgs_Hectare.csv')
print(f"   Original shape: {df.shape}")

# Remove State Total row
df = df[df['SlNo'] != 'NA']

# Remove duplicates
df = df.drop_duplicates()

# Standardize column names
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

# Convert SlNo to numeric
df['slno'] = pd.to_numeric(df['slno'], errors='coerce')

# Drop rows with missing district names
df = df.dropna(subset=['district_name'])

# Save
df.to_csv(f'{output_folder}/sugarcane_harvested_cleaned.csv', index=False)
print(f"   Cleaned shape: {df.shape}")
print(f"   Districts: {df['district_name'].nunique()}")
print("   ✓ Saved to: cleaned_data/sugarcane_harvested_cleaned.csv\n")


# ============================================================================
# 12. Crop_SUGARCANE_PLANTED - District-wise Planting Data
# ============================================================================
print("12. Cleaning Crop_SUGARCANE_PLANTED...")
df = pd.read_csv(r'c:\Users\chand\OneDrive\Desktop\Folders\Crop_SUGARCANE_PLANTED_Area_in_Hectares_Production_in_Tonnes_Yield_in_Kgs_Hectare.csv')
print(f"   Original shape: {df.shape}")

# Remove State Total row
df = df[df['SlNo'] != 'NA']

# Remove duplicates
df = df.drop_duplicates()

# Standardize column names
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

# Convert SlNo to numeric
df['slno'] = pd.to_numeric(df['slno'], errors='coerce')

# Drop rows with missing district names
df = df.dropna(subset=['district_name'])

# Save
df.to_csv(f'{output_folder}/sugarcane_planted_cleaned.csv', index=False)
print(f"   Cleaned shape: {df.shape}")
print(f"   Districts: {df['district_name'].nunique()}")
print("   ✓ Saved to: cleaned_data/sugarcane_planted_cleaned.csv\n")


# ============================================================================
# 13. productivity_of_sugarcane_in_2018_19.csv - Tamil Nadu Yield Data
# ============================================================================
print("13. Cleaning productivity_of_sugarcane_in_2018_19.csv...")
df = pd.read_csv(r'c:\Users\chand\OneDrive\Desktop\Folders\productivity_of_sugarcane_in_2018_19.csv')
print(f"   Original shape: {df.shape}")

# Remove duplicates
df = df.drop_duplicates()

# Standardize column names
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

# Convert 'NA' to NaN and then to numeric
df['average_yield_of_sugarcane_(in_tonnes/ha)'] = df['average_yield_of_sugarcane_(in_tonnes/ha)'].replace('NA', pd.NA)
df['average_yield_of_sugarcane_(in_tonnes/ha)'] = pd.to_numeric(
    df['average_yield_of_sugarcane_(in_tonnes/ha)'], errors='coerce'
)

# Remove Chennai (has NA), keep State average
df = df[df['district'] != 'Chennai']

# Save
df.to_csv(f'{output_folder}/productivity_2018_19_cleaned.csv', index=False)
print(f"   Cleaned shape: {df.shape}")
print(f"   Yield range: {df['average_yield_of_sugarcane_(in_tonnes/ha)'].min()} to {df['average_yield_of_sugarcane_(in_tonnes/ha)'].max()} tonnes/ha")
print("   ✓ Saved to: cleaned_data/productivity_2018_19_cleaned.csv\n")


# ============================================================================
# 14. Sugarcane Productivity Dataset- NDVI.xlsx - Comprehensive Dataset
# ============================================================================
print("14. Cleaning Sugarcane Productivity Dataset- NDVI.xlsx...")
df = pd.read_excel(r'c:\Users\chand\OneDrive\Desktop\Folders\Sugarcane Productivity Dataset- NDVI.xlsx')
print(f"   Original shape: {df.shape}")

# Remove duplicates
df = df.drop_duplicates()

# Standardize column names
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

# Drop rows with missing values
df = df.dropna()

# Save as CSV
df.to_csv(f'{output_folder}/productivity_NDVI_cleaned.csv', index=False)
print(f"   Cleaned shape: {df.shape}")
print("   ✓ Saved to: cleaned_data/productivity_NDVI_cleaned.csv\n")


# ============================================================================
# SUMMARY
# ============================================================================
print("="*80)
print("DATA CLEANING COMPLETED SUCCESSFULLY!")
print("="*80)
print()
print("Summary of Cleaned Files:")
print("-" * 80)

cleaned_files = sorted([f for f in os.listdir(output_folder) if f.endswith('.csv')])
total_size = 0

for i, file in enumerate(cleaned_files, 1):
    filepath = os.path.join(output_folder, file)
    size = os.path.getsize(filepath)
    total_size += size
    df = pd.read_csv(filepath)
    print(f"{i:2d}. {file:<45s} {df.shape[0]:>6d} rows × {df.shape[1]:>3d} cols  {size/1024:>8.2f} KB")

print("-" * 80)
print(f"Total Files: {len(cleaned_files)}")
print(f"Total Size: {total_size/1024:.2f} KB ({total_size/(1024*1024):.2f} MB)")
print()
print("All cleaned files are saved in: cleaned_data/")
print("="*80)
