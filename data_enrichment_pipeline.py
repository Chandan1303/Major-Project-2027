"""
Comprehensive Data Enrichment Pipeline for Sugarcane Yield Prediction
=====================================================================

This pipeline enriches the base sugarcane dataset with:
1. Weather data (rainfall, temperature, humidity)
2. Soil data (pH, moisture, NPK)
3. NDVI time series (vegetation indices)
4. Sugarcane variety information
5. Historical yield features

Output: ML-ready dataset for XGBoost/Random Forest modeling
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class SugarcaneDataEnrichment:
    """Main orchestrator for data enrichment pipeline"""
    
    def __init__(self, base_csv_path, variety_csv_path, output_dir='enriched_data'):
        """
        Initialize the enrichment pipeline
        
        Parameters:
        -----------
        base_csv_path : str
            Path to combined_sugarcane_dataset.csv
        variety_csv_path : str
            Path to sugarcane_varieties_master.csv
        output_dir : str
            Directory to save enriched datasets
        """
        self.base_csv_path = base_csv_path
        self.variety_csv_path = variety_csv_path
        self.output_dir = output_dir
        
        # Load data
        print("📂 Loading base datasets...")
        self.base_df = pd.read_csv(base_csv_path, low_memory=False)
        # Handle potential CSV parsing issues with variety data
        try:
            self.variety_df = pd.read_csv(variety_csv_path, on_bad_lines='skip', engine='python')
        except:
            # Fallback: try with different settings
            self.variety_df = pd.read_csv(variety_csv_path, sep=',', quotechar='"', on_bad_lines='warn', engine='python')
        
        print(f"✅ Loaded {len(self.base_df)} base records")
        print(f"✅ Loaded {len(self.variety_df)} variety records")
        
    def create_base_structure(self):
        """
        Extract core features from the messy base CSV
        Create a clean starting point for enrichment
        """
        print("\n🏗️  Creating base structure...")
        
        # Extract key columns that actually have data
        key_cols = ['record_id', 'crop_year', 'year', 'state_name', 'district_name', 
                   'season', 'area_hectare', 'production_tonnes', 'yield_t_ha', 
                   'yield_tons_per_hectare', 'latitude', 'longitude']
        
        # Select columns that exist
        available_cols = [col for col in key_cols if col in self.base_df.columns]
        base_clean = self.base_df[available_cols].copy()
        
        # Standardize year column
        if 'year' not in base_clean.columns and 'crop_year' in base_clean.columns:
            base_clean['year'] = base_clean['crop_year']
        elif 'crop_year' not in base_clean.columns and 'year' in base_clean.columns:
            base_clean['crop_year'] = base_clean['year']
            
        # Standardize yield column
        yield_cols = ['yield_t_ha', 'yield_tons_per_hectare']
        for col in yield_cols:
            if col in base_clean.columns:
                base_clean['yield'] = pd.to_numeric(base_clean[col], errors='coerce')
                break
        
        # Clean up state/district names
        if 'state_name' in base_clean.columns:
            base_clean['state'] = base_clean['state_name'].str.strip().str.title()
        if 'district_name' in base_clean.columns:
            base_clean['district'] = base_clean['district_name'].str.strip().str.title()
            
        # Remove rows with no yield data
        if 'yield' in base_clean.columns:
            base_clean = base_clean[base_clean['yield'].notna() & (base_clean['yield'] > 0)]
        
        print(f"✅ Created base structure with {len(base_clean)} valid records")
        
        self.enriched_df = base_clean
        return self
    
    def add_variety_information(self):
        """
        Assign sugarcane varieties based on state, district, year logic
        """
        print("\n🌱 Adding variety information...")
        
        if 'state' not in self.enriched_df.columns:
            print("⚠️  No state column found, skipping variety assignment")
            return self
        
        # Create variety mapping based on state and year
        variety_map = self._create_variety_mapping()
        
        # Assign varieties
        self.enriched_df['variety'] = self.enriched_df.apply(
            lambda row: self._assign_variety(row, variety_map), axis=1
        )
        
        # Add variety characteristics
        variety_features = ['maturity', 'drought_tolerance', 'salinity_tolerance', 
                          'waterlogging_tolerance', 'ratooning_ability']
        
        for feature in variety_features:
            feat_col = feature.title().replace('_', '_')
            if feat_col in self.variety_df.columns:
                variety_dict = dict(zip(
                    self.variety_df['Variety_Name'], 
                    self.variety_df[feat_col]
                ))
                self.enriched_df[feature] = self.enriched_df['variety'].map(variety_dict)
        
        print(f"✅ Assigned varieties to {self.enriched_df['variety'].notna().sum()} records")
        
        return self
    
    def _create_variety_mapping(self):
        """Create state/year to variety mapping"""
        variety_map = {}
        
        # Group varieties by state and year
        for _, row in self.variety_df.iterrows():
            states = str(row['Recommended_States']).split(',')
            year = row['Year_of_Release']
            variety = row['Variety_Name']
            
            for state in states:
                state = state.strip().title()
                if pd.notna(state) and state != 'Nan':
                    key = (state, year)
                    if key not in variety_map:
                        variety_map[key] = []
                    variety_map[key].append(variety)
        
        return variety_map
    
    def _assign_variety(self, row, variety_map):
        """Assign variety to a single row based on state and year"""
        if pd.isna(row.get('state')) or pd.isna(row.get('year')):
            return np.nan
        
        state = str(row['state']).strip().title()
        year = int(row['year'])
        
        # Try exact match
        key = (state, year)
        if key in variety_map and variety_map[key]:
            # Return the most common variety for that state/year
            return variety_map[key][0]
        
        # Try recent years (within 5 years)
        for year_offset in range(1, 6):
            for year_delta in [year_offset, -year_offset]:
                key = (state, year + year_delta)
                if key in variety_map and variety_map[key]:
                    return variety_map[key][0]
        
        # Default varieties by major state
        state_defaults = {
            'Karnataka': 'Co 86032',
            'Maharashtra': 'CoM 0265',
            'Uttar Pradesh': 'Co 0238',
            'Tamil Nadu': 'Co 86032',
            'Punjab': 'CoPb 94',
            'Haryana': 'CoH 160',
        }
        
        for state_key, default_variety in state_defaults.items():
            if state_key.lower() in state.lower():
                return default_variety
        
        return 'Co 86032'  # Most common default
    
    def add_weather_features(self):
        """
        Add weather features using available weather data
        For now, creates template structure - can be filled with API data later
        """
        print("\n☁️  Adding weather features...")
        
        # Template weather features (to be filled with real data)
        weather_features = {
            'rainfall_mm': np.nan,
            'avg_temperature_c': np.nan,
            'max_temperature_c': np.nan,
            'min_temperature_c': np.nan,
            'humidity_percent': np.nan,
            'rainy_days': np.nan,
            'dry_spell_days': np.nan,
            
            # Growth stage specific (example for sugarcane: 12-month crop)
            'rainfall_early_growth': np.nan,  # Month 1-3
            'rainfall_vegetative': np.nan,    # Month 4-6
            'rainfall_grand_growth': np.nan,  # Month 7-9
            'rainfall_maturity': np.nan,      # Month 10-12
            
            'temp_early_growth': np.nan,
            'temp_vegetative': np.nan,
            'temp_grand_growth': np.nan,
            'temp_maturity': np.nan,
        }
        
        for feature, default_value in weather_features.items():
            if feature not in self.enriched_df.columns:
                self.enriched_df[feature] = default_value
        
        # If we have any existing weather data in base df, use it
        weather_cols = ['rainfall_mm', 'avg_temperature_celsius', 'humidity']
        for col in weather_cols:
            if col in self.base_df.columns:
                matched_col = self._match_weather_column(col)
                if matched_col:
                    self.enriched_df[matched_col] = pd.to_numeric(
                        self.base_df[col], errors='coerce'
                    )
        
        print("✅ Weather feature structure created")
        print("⚠️  Fill with real weather API data using WeatherDataFetcher")
        
        return self
    
    def _match_weather_column(self, col):
        """Match base column name to enriched column name"""
        mapping = {
            'rainfall_mm': 'rainfall_mm',
            'avg_temperature_celsius': 'avg_temperature_c',
            'humidity': 'humidity_percent'
        }
        return mapping.get(col)
    
    def add_soil_features(self):
        """
        Add soil features using available soil datasets
        """
        print("\n🌍 Adding soil features...")
        
        # Template soil features
        soil_features = {
            'soil_ph': np.nan,
            'soil_moisture': np.nan,
            'nitrogen_kg_ha': np.nan,
            'phosphorus_kg_ha': np.nan,
            'potassium_kg_ha': np.nan,
            'organic_carbon': np.nan,
            'soil_type': np.nan,
        }
        
        for feature, default_value in soil_features.items():
            if feature not in self.enriched_df.columns:
                self.enriched_df[feature] = default_value
        
        # Map existing soil data from base
        soil_col_mapping = {
            'soil_ph': 'soil_ph',
            'soil_ph1': 'soil_ph',
            'nitrogen': 'nitrogen_kg_ha',
            'phosphorus': 'phosphorus_kg_ha',
            'phosphorous': 'phosphorus_kg_ha',
            'potassium': 'potassium_kg_ha',
            'organic_matter': 'organic_carbon',
            'organic_matter1': 'organic_carbon',
            'moisture': 'soil_moisture',
        }
        
        for base_col, enriched_col in soil_col_mapping.items():
            if base_col in self.base_df.columns:
                values = pd.to_numeric(self.base_df[base_col], errors='coerce')
                # Only update if we have more non-null values
                if values.notna().sum() > self.enriched_df[enriched_col].notna().sum():
                    self.enriched_df[enriched_col] = values
        
        filled_count = sum(self.enriched_df[list(soil_features.keys())].notna().any())
        print(f"✅ Soil features added ({filled_count} features have some data)")
        
        return self
    
    def add_ndvi_features(self):
        """
        Add NDVI time series features
        Template structure for satellite data
        """
        print("\n🛰️  Adding NDVI features...")
        
        # NDVI features at different growth stages
        ndvi_features = {
            'ndvi_30d': np.nan,    # 30 days after planting
            'ndvi_60d': np.nan,    # 60 days
            'ndvi_90d': np.nan,    # 90 days (peak vegetative)
            'ndvi_120d': np.nan,   # 120 days
            'ndvi_150d': np.nan,   # 150 days
            'ndvi_mean': np.nan,   # Average across season
            'ndvi_max': np.nan,    # Maximum NDVI
            'ndvi_min': np.nan,    # Minimum NDVI
            'ndvi_std': np.nan,    # Standard deviation
            'ndvi_trend': np.nan,  # Growth trend
        }
        
        for feature, default_value in ndvi_features.items():
            if feature not in self.enriched_df.columns:
                self.enriched_df[feature] = default_value
        
        # If base df has NDVI columns, use them
        ndvi_cols = [col for col in self.base_df.columns if 'ndvi' in col.lower()]
        if ndvi_cols:
            # Try to extract useful NDVI data
            for col in ndvi_cols:
                if 'fusion' in col.lower() or 's2' in col.lower():
                    values = pd.to_numeric(self.base_df[col], errors='coerce')
                    # Use as mean NDVI if available
                    if values.notna().sum() > 0:
                        self.enriched_df['ndvi_mean'] = values
                        break
        
        print("✅ NDVI feature structure created")
        print("⚠️  Fill with Sentinel-2/Landsat data using NDVIDataFetcher")
        
        return self
    
    def add_irrigation_features(self):
        """
        Add irrigation-related features
        """
        print("\n💧 Adding irrigation features...")
        
        irrigation_features = {
            'irrigation_type': 'Unknown',
            'irrigation_availability': np.nan,
            'num_irrigations': np.nan,
        }
        
        for feature, default_value in irrigation_features.items():
            if feature not in self.enriched_df.columns:
                self.enriched_df[feature] = default_value
        
        # Try to infer from area data
        if 'sugarcane_irrigated_area_1000_ha' in self.base_df.columns:
            irr_area = pd.to_numeric(
                self.base_df['sugarcane_irrigated_area_1000_ha'], 
                errors='coerce'
            )
            self.enriched_df['irrigation_availability'] = (irr_area > 0).astype(int)
        
        print("✅ Irrigation features added")
        
        return self
    
    def add_historical_yield_features(self):
        """
        Add historical yield features for temporal patterns
        """
        print("\n📊 Adding historical yield features...")
        
        if 'yield' not in self.enriched_df.columns:
            print("⚠️  No yield column found, skipping historical features")
            return self
        
        # Sort by location and year
        sort_cols = []
        if 'state' in self.enriched_df.columns:
            sort_cols.append('state')
        if 'district' in self.enriched_df.columns:
            sort_cols.append('district')
        if 'year' in self.enriched_df.columns:
            sort_cols.append('year')
        
        if sort_cols:
            self.enriched_df = self.enriched_df.sort_values(sort_cols)
        
        # Group by state and district
        group_cols = [col for col in ['state', 'district'] if col in self.enriched_df.columns]
        
        if group_cols:
            # Previous year yield
            self.enriched_df['prev_year_yield'] = self.enriched_df.groupby(
                group_cols
            )['yield'].shift(1)
            
            # 3-year average yield
            self.enriched_df['yield_3yr_avg'] = self.enriched_df.groupby(
                group_cols
            )['yield'].transform(lambda x: x.rolling(window=3, min_periods=1).mean())
            
            # Historical average for location
            self.enriched_df['historical_avg_yield'] = self.enriched_df.groupby(
                group_cols
            )['yield'].transform('mean')
            
            # Yield trend (compared to historical average)
            self.enriched_df['yield_vs_historical'] = (
                self.enriched_df['yield'] - self.enriched_df['historical_avg_yield']
            ) / self.enriched_df['historical_avg_yield']
        
        print("✅ Historical yield features added")
        
        return self
    
    def add_derived_features(self):
        """
        Add derived/engineered features
        """
        print("\n🔧 Adding derived features...")
        
        # Temperature-based features
        if 'avg_temperature_c' in self.enriched_df.columns:
            self.enriched_df['temp_stress'] = self.enriched_df['avg_temperature_c'].apply(
                lambda x: 1 if pd.notna(x) and (x < 20 or x > 35) else 0
            )
        
        # Rainfall sufficiency
        if 'rainfall_mm' in self.enriched_df.columns:
            self.enriched_df['rainfall_sufficient'] = self.enriched_df['rainfall_mm'].apply(
                lambda x: 1 if pd.notna(x) and x >= 1500 else 0
            )
        
        # NDVI health indicator
        if 'ndvi_mean' in self.enriched_df.columns:
            self.enriched_df['vegetation_health'] = self.enriched_df['ndvi_mean'].apply(
                lambda x: 'Good' if pd.notna(x) and x > 0.6 
                         else 'Moderate' if pd.notna(x) and x > 0.4 
                         else 'Poor' if pd.notna(x) 
                         else 'Unknown'
            )
        
        # Year-based features
        if 'year' in self.enriched_df.columns:
            self.enriched_df['decade'] = (self.enriched_df['year'] // 10) * 10
            self.enriched_df['years_since_2000'] = self.enriched_df['year'] - 2000
        
        print("✅ Derived features added")
        
        return self
    
    def create_ml_ready_dataset(self):
        """
        Create the final ML-ready dataset with proper structure
        """
        print("\n🎯 Creating ML-ready dataset...")
        
        # Define the desired column order
        id_cols = ['record_id']
        
        location_cols = ['state', 'district', 'latitude', 'longitude']
        
        time_cols = ['year', 'crop_year', 'season', 'decade', 'years_since_2000']
        
        farm_cols = ['area_hectare', 'variety', 'maturity', 'irrigation_type', 
                    'irrigation_availability', 'num_irrigations']
        
        weather_cols = ['rainfall_mm', 'avg_temperature_c', 'max_temperature_c', 
                       'min_temperature_c', 'humidity_percent', 'rainy_days', 
                       'dry_spell_days', 'temp_stress', 'rainfall_sufficient',
                       'rainfall_early_growth', 'rainfall_vegetative', 
                       'rainfall_grand_growth', 'rainfall_maturity',
                       'temp_early_growth', 'temp_vegetative', 
                       'temp_grand_growth', 'temp_maturity']
        
        soil_cols = ['soil_ph', 'soil_moisture', 'nitrogen_kg_ha', 
                    'phosphorus_kg_ha', 'potassium_kg_ha', 'organic_carbon', 
                    'soil_type']
        
        ndvi_cols = ['ndvi_30d', 'ndvi_60d', 'ndvi_90d', 'ndvi_120d', 'ndvi_150d',
                    'ndvi_mean', 'ndvi_max', 'ndvi_min', 'ndvi_std', 'ndvi_trend',
                    'vegetation_health']
        
        variety_cols = ['drought_tolerance', 'salinity_tolerance', 
                       'waterlogging_tolerance', 'ratooning_ability']
        
        historical_cols = ['prev_year_yield', 'yield_3yr_avg', 
                          'historical_avg_yield', 'yield_vs_historical']
        
        target_col = ['yield']
        
        other_cols = ['production_tonnes']
        
        # Select columns that exist
        all_desired_cols = (id_cols + location_cols + time_cols + farm_cols + 
                          weather_cols + soil_cols + ndvi_cols + variety_cols + 
                          historical_cols + other_cols + target_col)
        
        existing_cols = [col for col in all_desired_cols if col in self.enriched_df.columns]
        
        self.ml_ready_df = self.enriched_df[existing_cols].copy()
        
        print(f"✅ ML-ready dataset created with {len(existing_cols)} features")
        print(f"   Total records: {len(self.ml_ready_df)}")
        
        return self
    
    def get_data_quality_report(self):
        """
        Generate a data quality report
        """
        print("\n📋 Data Quality Report")
        print("=" * 60)
        
        if not hasattr(self, 'ml_ready_df'):
            print("⚠️  ML-ready dataset not created yet")
            return
        
        df = self.ml_ready_df
        
        # Overall stats
        print(f"\nTotal Records: {len(df)}")
        print(f"Total Features: {len(df.columns)}")
        
        # Completeness by category
        categories = {
            'Location': ['state', 'district', 'latitude', 'longitude'],
            'Time': ['year', 'season'],
            'Farm': ['area_hectare', 'variety', 'irrigation_type'],
            'Weather': ['rainfall_mm', 'avg_temperature_c', 'humidity_percent'],
            'Soil': ['soil_ph', 'nitrogen_kg_ha', 'phosphorus_kg_ha', 'potassium_kg_ha'],
            'NDVI': ['ndvi_mean', 'ndvi_max', 'ndvi_min'],
            'Historical': ['prev_year_yield', 'historical_avg_yield'],
            'Target': ['yield']
        }
        
        print("\n" + "=" * 60)
        print("DATA COMPLETENESS BY CATEGORY")
        print("=" * 60)
        
        for category, cols in categories.items():
            existing_cols = [c for c in cols if c in df.columns]
            if existing_cols:
                completeness = df[existing_cols].notna().mean().mean() * 100
                print(f"{category:15s}: {completeness:5.1f}% complete")
        
        # Top missing features
        print("\n" + "=" * 60)
        print("TOP 10 FEATURES BY COMPLETENESS")
        print("=" * 60)
        
        completeness = df.notna().mean().sort_values(ascending=False)
        for col, pct in completeness.head(10).items():
            print(f"{col:30s}: {pct*100:5.1f}%")
        
        # Bottom 10
        print("\n" + "=" * 60)
        print("TOP 10 MISSING FEATURES (Need Data!)")
        print("=" * 60)
        
        for col, pct in completeness.tail(10).items():
            print(f"{col:30s}: {pct*100:5.1f}% (Missing: {(1-pct)*100:.1f}%)")
        
        # Yield statistics
        if 'yield' in df.columns:
            print("\n" + "=" * 60)
            print("TARGET VARIABLE (YIELD) STATISTICS")
            print("=" * 60)
            print(df['yield'].describe())
        
        return completeness
    
    def save_datasets(self):
        """
        Save the enriched datasets
        """
        print(f"\n💾 Saving datasets to {self.output_dir}/...")
        
        import os
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Save ML-ready dataset
        if hasattr(self, 'ml_ready_df'):
            ml_path = f"{self.output_dir}/ml_ready_sugarcane_dataset.csv"
            self.ml_ready_df.to_csv(ml_path, index=False)
            print(f"✅ Saved: {ml_path}")
        
        # Save full enriched dataset
        if hasattr(self, 'enriched_df'):
            full_path = f"{self.output_dir}/full_enriched_sugarcane_dataset.csv"
            self.enriched_df.to_csv(full_path, index=False)
            print(f"✅ Saved: {full_path}")
        
        # Save data dictionary
        self._save_data_dictionary()
        
        print("✅ All datasets saved successfully!")
        
        return self
    
    def _save_data_dictionary(self):
        """Save a data dictionary explaining all features"""
        
        dictionary = """
# Sugarcane ML Dataset - Data Dictionary
==========================================

## Identification
- record_id: Unique identifier for each record

## Location Features
- state: State name
- district: District name
- latitude: Latitude coordinate
- longitude: Longitude coordinate

## Temporal Features
- year: Crop year
- crop_year: Same as year
- season: Growing season (Kharif/Rabi/Summer)
- decade: Decade (e.g., 2010, 2020)
- years_since_2000: Years since 2000

## Farm/Crop Features
- area_hectare: Cultivated area in hectares
- variety: Sugarcane variety name
- maturity: Maturity type (Early/Mid-late)
- irrigation_type: Type of irrigation
- irrigation_availability: Irrigation available (0/1)
- num_irrigations: Number of irrigations

## Weather Features
- rainfall_mm: Total rainfall in mm
- avg_temperature_c: Average temperature in Celsius
- max_temperature_c: Maximum temperature
- min_temperature_c: Minimum temperature
- humidity_percent: Average humidity percentage
- rainy_days: Number of rainy days
- dry_spell_days: Number of consecutive dry days
- temp_stress: Temperature stress indicator (0/1)
- rainfall_sufficient: Sufficient rainfall indicator (0/1)

### Growth Stage Weather
- rainfall_early_growth: Rainfall during early growth (month 1-3)
- rainfall_vegetative: Rainfall during vegetative stage (month 4-6)
- rainfall_grand_growth: Rainfall during grand growth (month 7-9)
- rainfall_maturity: Rainfall during maturity (month 10-12)
- temp_early_growth: Temperature during early growth
- temp_vegetative: Temperature during vegetative stage
- temp_grand_growth: Temperature during grand growth
- temp_maturity: Temperature during maturity

## Soil Features
- soil_ph: Soil pH value
- soil_moisture: Soil moisture content
- nitrogen_kg_ha: Nitrogen content (kg/ha)
- phosphorus_kg_ha: Phosphorus content (kg/ha)
- potassium_kg_ha: Potassium content (kg/ha)
- organic_carbon: Organic carbon content
- soil_type: Soil type classification

## NDVI/Satellite Features
- ndvi_30d: NDVI at 30 days after planting
- ndvi_60d: NDVI at 60 days
- ndvi_90d: NDVI at 90 days (peak vegetative)
- ndvi_120d: NDVI at 120 days
- ndvi_150d: NDVI at 150 days
- ndvi_mean: Average NDVI across season
- ndvi_max: Maximum NDVI value
- ndvi_min: Minimum NDVI value
- ndvi_std: Standard deviation of NDVI
- ndvi_trend: NDVI growth trend
- vegetation_health: Vegetation health category (Good/Moderate/Poor)

## Variety Characteristics
- drought_tolerance: Drought tolerance level
- salinity_tolerance: Salinity tolerance level
- waterlogging_tolerance: Waterlogging tolerance level
- ratooning_ability: Ratooning ability level

## Historical Yield Features
- prev_year_yield: Previous year's yield for same location
- yield_3yr_avg: 3-year moving average yield
- historical_avg_yield: Historical average for location
- yield_vs_historical: Deviation from historical average (ratio)

## Target Variable
- yield: Sugarcane yield in tonnes/hectare (t/ha)

## Other
- production_tonnes: Total production in tonnes

==========================================
Data Types:
- Numerical: All measurements, yields, areas, weather data
- Categorical: state, district, season, variety, maturity, irrigation_type, soil_type, vegetation_health
- Binary: irrigation_availability, temp_stress, rainfall_sufficient, tolerance levels

Recommended Encoding:
- One-Hot: season, maturity, soil_type, vegetation_health
- Label: state, district (too many categories)
- Ordinal: tolerance levels (Low < Moderate < High)
- Binary: Already 0/1

==========================================
"""
        
        dict_path = f"{self.output_dir}/DATA_DICTIONARY.md"
        with open(dict_path, 'w') as f:
            f.write(dictionary)
        
        print(f"✅ Saved: {dict_path}")


def main():
    """
    Main execution function
    """
    print("=" * 60)
    print("🌾 SUGARCANE DATA ENRICHMENT PIPELINE 🌾")
    print("=" * 60)
    
    # Initialize pipeline
    pipeline = SugarcaneDataEnrichment(
        base_csv_path='combined_sugarcane_dataset.csv',
        variety_csv_path='backend/data/sugarcane_varieties_master.csv',
        output_dir='enriched_data'
    )
    
    # Run enrichment steps
    pipeline.create_base_structure()
    pipeline.add_variety_information()
    pipeline.add_weather_features()
    pipeline.add_soil_features()
    pipeline.add_ndvi_features()
    pipeline.add_irrigation_features()
    pipeline.add_historical_yield_features()
    pipeline.add_derived_features()
    pipeline.create_ml_ready_dataset()
    
    # Generate report
    pipeline.get_data_quality_report()
    
    # Save datasets
    pipeline.save_datasets()
    
    print("\n" + "=" * 60)
    print("✅ ENRICHMENT COMPLETE!")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Fill weather data using WeatherDataFetcher")
    print("2. Fill NDVI data using NDVIDataFetcher")
    print("3. Enhance soil data with SoilDataMatcher")
    print("4. Review data quality report")
    print("5. Begin ML modeling!")
    

if __name__ == "__main__":
    main()
