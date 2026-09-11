"""
Smart Data Integration Script
==============================

This script USES your existing cleaned datasets and enrichment pipeline,
and only collects NEW data from APIs where needed.

What you already have:
- ✅ combined_sugarcane_dataset.csv (base data)
- ✅ 20 cleaned CSV files in cleaned_data/
- ✅ NDVI data (4 files: Belagavi, Mandya, Punjab, Tamil Nadu)
- ✅ Soil data (2 files)
- ✅ Irrigation data (3 files)
- ✅ data_enrichment_pipeline.py
- ✅ weather_data_fetcher.py
- ✅ ndvi_data_fetcher.py
- ✅ soil_data_matcher.py

What this script does:
1. Loads your existing enriched data
2. Identifies missing data (gaps)
3. Only collects NEW data from APIs where needed
4. Integrates everything into final dataset
"""

import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import sys
import os

# Add parent directory to path to import existing modules
sys.path.append(str(Path(__file__).parent.parent))

from data_enrichment_pipeline import SugarcaneDataEnrichment
from data_collection.openweather_collector import OpenWeatherCollector
from data_collection.config import CollectionConfig, DATA_DIR, PROCESSED_DATA_DIR


class SmartDataIntegrator:
    """
    Intelligently integrates existing data and only fetches what's missing
    """
    
    def __init__(self):
        """Initialize integrator"""
        print("=" * 70)
        print("  SMART DATA INTEGRATION")
        print("  Uses existing cleaned data + fills gaps with API calls")
        print("=" * 70)
        
        self.project_root = Path(__file__).parent.parent
        self.cleaned_data_dir = self.project_root / "cleaned_data"
        self.existing_enriched = None
        
    def analyze_existing_data(self):
        """
        Analyze what data you already have
        
        Returns:
        --------
        dict : Summary of existing data
        """
        print("\n📊 Analyzing existing data...")
        print("=" * 70)
        
        summary = {
            'base_dataset': None,
            'ndvi_files': [],
            'soil_files': [],
            'irrigation_files': [],
            'weather_files': [],
            'variety_file': None
        }
        
        # Check base dataset
        base_file = self.project_root / "combined_sugarcane_dataset.csv"
        if base_file.exists():
            df = pd.read_csv(base_file, low_memory=False)
            summary['base_dataset'] = {
                'path': str(base_file),
                'records': len(df),
                'columns': len(df.columns),
                'size_mb': base_file.stat().st_size / (1024**2)
            }
            print(f"✅ Base dataset: {len(df):,} records, {len(df.columns)} columns")
        else:
            print("❌ Base dataset not found")
        
        # Check NDVI files
        ndvi_files = list(self.cleaned_data_dir.glob("NDVI_*.csv"))
        for f in ndvi_files:
            df = pd.read_csv(f)
            summary['ndvi_files'].append({
                'name': f.name,
                'records': len(df),
                'location': f.stem.replace('NDVI_', '').replace('_cleaned', '')
            })
            print(f"✅ NDVI: {f.name} ({len(df)} records)")
        
        # Check soil files
        soil_files = ['soil_data_cleaned.csv', 'DB_SugarCane_SOILS_MENDELEY_Cleaned.csv']
        for fname in soil_files:
            f = self.cleaned_data_dir / fname
            if f.exists():
                df = pd.read_csv(f)
                summary['soil_files'].append({
                    'name': fname,
                    'records': len(df)
                })
                print(f"✅ Soil: {fname} ({len(df)} records)")
        
        # Check irrigation files
        irr_pattern = ['irrigation_*.csv', '*irrigation*.csv']
        for pattern in irr_pattern:
            for f in self.cleaned_data_dir.glob(pattern):
                if f.name not in [s['name'] for s in summary['irrigation_files']]:
                    df = pd.read_csv(f)
                    summary['irrigation_files'].append({
                        'name': f.name,
                        'records': len(df)
                    })
                    print(f"✅ Irrigation: {f.name} ({len(df)} records)")
        
        # Check variety file
        variety_file = self.project_root / "backend" / "data" / "sugarcane_varieties_master.csv"
        if variety_file.exists():
            df = pd.read_csv(variety_file, on_bad_lines='skip', engine='python')
            summary['variety_file'] = {
                'path': str(variety_file),
                'varieties': len(df)
            }
            print(f"✅ Variety data: {len(df)} varieties")
        
        print(f"\n📈 Summary:")
        print(f"   Base dataset: {'✅ Found' if summary['base_dataset'] else '❌ Missing'}")
        print(f"   NDVI files: {len(summary['ndvi_files'])} files")
        print(f"   Soil files: {len(summary['soil_files'])} files")
        print(f"   Irrigation files: {len(summary['irrigation_files'])} files")
        print(f"   Variety data: {'✅ Found' if summary['variety_file'] else '❌ Missing'}")
        
        return summary
    
    def run_existing_enrichment_pipeline(self):
        """
        Run your existing data_enrichment_pipeline.py
        
        Returns:
        --------
        pd.DataFrame : Enriched data
        """
        print("\n🔧 Running existing enrichment pipeline...")
        print("=" * 70)
        
        try:
            # Initialize existing pipeline
            pipeline = SugarcaneDataEnrichment(
                base_csv_path='combined_sugarcane_dataset.csv',
                variety_csv_path='backend/data/sugarcane_varieties_master.csv',
                output_dir='enriched_data'
            )
            
            # Run enrichment steps
            print("  Running enrichment steps...")
            (pipeline
             .create_base_structure()
             .add_variety_information()
             .add_weather_features()
             .add_soil_features()
             .add_ndvi_features()
             .add_irrigation_features()
             .add_historical_yield_features()
             .add_derived_features()
             .create_ml_ready_dataset())
            
            print(f"\n✅ Enrichment complete:")
            print(f"   Records: {len(pipeline.ml_ready_df):,}")
            print(f"   Features: {len(pipeline.ml_ready_df.columns)}")
            
            self.existing_enriched = pipeline.ml_ready_df
            return pipeline.ml_ready_df
            
        except Exception as e:
            print(f"❌ Enrichment failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame()
    
    def identify_missing_weather_data(self, df):
        """
        Check which locations/years need weather data
        
        Parameters:
        -----------
        df : pd.DataFrame
            Enriched dataset
            
        Returns:
        --------
        list : Locations needing weather data
        """
        print("\n🔍 Identifying missing weather data...")
        
        weather_cols = ['rainfall_mm', 'avg_temperature_c', 'humidity_percent']
        existing_weather_cols = [col for col in weather_cols if col in df.columns]
        
        if not existing_weather_cols:
            print("  ⚠️  No weather columns found in enriched dataset")
            return []
        
        # Check completeness
        for col in existing_weather_cols:
            completeness = df[col].notna().mean() * 100
            print(f"  {col:25s}: {completeness:5.1f}% complete")
        
        # Identify missing locations
        if 'state' in df.columns and 'district' in df.columns:
            missing = df[df[existing_weather_cols].isna().any(axis=1)]
            missing_locations = missing.groupby(['state', 'district']).size()
            
            if len(missing_locations) > 0:
                print(f"\n  📍 {len(missing_locations)} locations need weather data")
                return list(missing_locations.index)
            else:
                print("  ✅ Weather data complete!")
                return []
        
        return []
    
    def fetch_missing_weather_data(self, missing_locations):
        """
        Fetch weather data only for missing locations
        
        Parameters:
        -----------
        missing_locations : list
            List of (state, district) tuples
            
        Returns:
        --------
        pd.DataFrame : New weather data
        """
        if not missing_locations:
            return pd.DataFrame()
        
        print(f"\n☁️  Fetching weather for {len(missing_locations)} locations...")
        
        collector = OpenWeatherCollector()
        
        if collector.api_key == "YOUR_OPENWEATHER_API_KEY_HERE":
            print("⚠️  OpenWeather API key not configured")
            print("   Weather data will remain incomplete")
            return pd.DataFrame()
        
        # Fetch current weather for missing locations only
        all_weather = []
        
        for state, district in missing_locations:
            # Get coordinates for this location
            from data_collection.config import DISTRICT_COORDINATES
            
            if district in DISTRICT_COORDINATES:
                coords = DISTRICT_COORDINATES[district]
                location_name = f"{district}, {state}"
                
                weather = collector.fetch_current_weather(
                    coords['lat'],
                    coords['lon'],
                    location_name
                )
                
                if weather:
                    weather['state'] = state
                    weather['district'] = district
                    all_weather.append(weather)
        
        if all_weather:
            return pd.DataFrame(all_weather)
        else:
            return pd.DataFrame()
    
    def create_final_dataset(self):
        """
        Create final ML-ready dataset using existing data + any new data
        
        Returns:
        --------
        pd.DataFrame : Final dataset
        """
        print("\n🎯 Creating final ML-ready dataset...")
        print("=" * 70)
        
        # Step 1: Analyze existing data
        summary = self.analyze_existing_data()
        
        # Step 2: Run existing enrichment pipeline
        enriched_df = self.run_existing_enrichment_pipeline()
        
        if enriched_df.empty:
            print("❌ No enriched data available")
            return pd.DataFrame()
        
        # Step 3: Check for missing weather data
        missing_locations = self.identify_missing_weather_data(enriched_df)
        
        # Step 4: Fetch missing weather data if needed
        if missing_locations:
            new_weather = self.fetch_missing_weather_data(missing_locations)
            
            if not new_weather.empty:
                # Merge new weather data
                print(f"\n  Merging {len(new_weather)} new weather records...")
                
                weather_cols = ['state', 'district', 'temperature', 'humidity', 'rainfall']
                new_weather_subset = new_weather[['state', 'district', 'temperature', 'humidity']].copy()
                new_weather_subset.columns = ['state', 'district', 'avg_temperature_c', 'humidity_percent']
                
                enriched_df = enriched_df.merge(
                    new_weather_subset,
                    on=['state', 'district'],
                    how='left',
                    suffixes=('', '_new')
                )
                
                # Fill missing values with new data
                if 'avg_temperature_c_new' in enriched_df.columns:
                    enriched_df['avg_temperature_c'].fillna(enriched_df['avg_temperature_c_new'], inplace=True)
                    enriched_df.drop('avg_temperature_c_new', axis=1, inplace=True)
                
                if 'humidity_percent_new' in enriched_df.columns:
                    enriched_df['humidity_percent'].fillna(enriched_df['humidity_percent_new'], inplace=True)
                    enriched_df.drop('humidity_percent_new', axis=1, inplace=True)
        
        # Step 5: Save final dataset
        output_path = PROCESSED_DATA_DIR / "FINAL_SUGARCANE_DATASET_INTEGRATED.csv"
        enriched_df.to_csv(output_path, index=False)
        
        print(f"\n💾 Saved final dataset:")
        print(f"   Path: {output_path}")
        print(f"   Records: {len(enriched_df):,}")
        print(f"   Features: {len(enriched_df.columns)}")
        print(f"   Size: {output_path.stat().st_size / (1024**2):.2f} MB")
        
        # Data quality summary
        print(f"\n📊 Data Quality Summary:")
        key_features = ['yield', 'variety', 'rainfall_mm', 'avg_temperature_c', 
                       'humidity_percent', 'ndvi_mean', 'soil_ph']
        
        for feat in key_features:
            if feat in enriched_df.columns:
                completeness = enriched_df[feat].notna().mean() * 100
                status = "✅" if completeness > 70 else "⚠️" if completeness > 40 else "❌"
                print(f"   {status} {feat:25s}: {completeness:5.1f}%")
        
        return enriched_df


def main():
    """
    Main execution
    """
    print("\n" + "=" * 70)
    print("  SMART DATA INTEGRATION FOR SUGARCANE YIELD PREDICTION")
    print("  Uses your existing data + fills gaps smartly")
    print("=" * 70)
    
    integrator = SmartDataIntegrator()
    
    # Create final dataset
    final_df = integrator.create_final_dataset()
    
    if not final_df.empty:
        print("\n" + "=" * 70)
        print("✅ INTEGRATION COMPLETE!")
        print("=" * 70)
        print("\n🎯 Your ML-ready dataset is ready:")
        print("   enriched_data/FINAL_SUGARCANE_DATASET_INTEGRATED.csv")
        print("\n📈 Next steps:")
        print("   1. Load dataset in Python/Jupyter")
        print("   2. Train XGBoost model")
        print("   3. Train Random Forest model")
        print("   4. Analyze feature importance")
        print("   5. Compare varieties (Co 86032, Co 0238, CoC 671, etc.)")
    else:
        print("\n❌ Integration failed. Check errors above.")


if __name__ == "__main__":
    main()
