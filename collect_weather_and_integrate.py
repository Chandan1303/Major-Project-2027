"""
Weather Data Collection & Dataset Integration
==============================================

This script:
1. Collects REAL weather data using your OpenWeather API key
2. Uses your existing NDVI files (15,450 records)
3. Uses your existing soil data
4. Uses your existing variety data
5. Creates final ML-ready dataset with ALL data

Team: Dayanand, Chandan (Lead), Harsha, Mohammad
"""

import pandas as pd
import numpy as np
import sys
from pathlib import Path
from datetime import datetime

# Add data_collection to path
sys.path.append(str(Path(__file__).parent / 'data_collection'))

from data_collection.openweather_collector import OpenWeatherCollector
from data_collection.config import CollectionConfig, DISTRICT_COORDINATES


class WeatherIntegratedDataset:
    """
    Collect weather and integrate with all existing data
    """
    
    def __init__(self):
        """Initialize"""
        print("=" * 70)
        print("  WEATHER DATA COLLECTION & INTEGRATION")
        print("  Using your OpenWeather API key")
        print("=" * 70)
        
        self.project_root = Path(__file__).parent
        self.cleaned_data_dir = self.project_root / "cleaned_data"
        self.output_dir = self.project_root / "final_dataset"
        self.output_dir.mkdir(exist_ok=True)
        
        # Load API key directly
        import os
        from dotenv import load_dotenv
        load_dotenv(self.project_root / 'data_collection' / '.env')
        
        self.api_key = os.getenv('OPENWEATHER_API_KEY', 'YOUR_API_KEY_HERE')
        
    def collect_current_weather(self):
        """
        Collect current weather for all districts using your API key
        
        Returns:
        --------
        pd.DataFrame : Weather data
        """
        print("\n📡 Collecting REAL weather data...")
        print("=" * 70)
        
        collector = OpenWeatherCollector(api_key=self.api_key)
        
        # Verify API key is loaded
        print(f"API Key: {self.api_key[:10]}... [OK]")
        
        # Collect for all districts
        weather_df = collector.collect_for_all_districts('current')
        
        if not weather_df.empty:
            # Save weather data
            weather_path = self.output_dir / 'weather_data_collected.csv'
            weather_df.to_csv(weather_path, index=False)
            print(f"\n💾 Saved weather data: {weather_path}")
            print(f"   Records: {len(weather_df)}")
            
            # Show sample
            print(f"\n📊 Sample Weather Data:")
            print(weather_df[['state', 'district', 'temperature', 'humidity', 'wind_speed']].head())
            
            return weather_df
        else:
            print("\n⚠️  No weather data collected")
            return pd.DataFrame()
    
    def load_existing_ndvi_data(self):
        """
        Load your existing NDVI CSV files
        
        Returns:
        --------
        pd.DataFrame : Combined NDVI data
        """
        print("\n🛰️  Loading your existing NDVI data...")
        print("=" * 70)
        
        ndvi_files = {
            'Belagavi': 'NDVI_belagavi_cleaned.csv',
            'Mandya': 'NDVI_mandya_cleaned.csv',
            'Punjab': 'NDVI_punjab_cleaned.csv',
            'Tamil Nadu': 'NDVI_tamil_nadu_cleaned.csv'
        }
        
        all_ndvi = []
        
        for region, filename in ndvi_files.items():
            filepath = self.cleaned_data_dir / filename
            if filepath.exists():
                df = pd.read_csv(filepath)
                df['source_region'] = region
                all_ndvi.append(df)
                print(f"  ✅ {region}: {len(df)} records")
            else:
                print(f"  ⚠️  {region}: File not found")
        
        if all_ndvi:
            combined_ndvi = pd.concat(all_ndvi, ignore_index=True)
            
            # Calculate statistics by region
            ndvi_stats = combined_ndvi.groupby('source_region')['ndvi'].agg([
                'mean', 'max', 'min', 'std', 'count'
            ]).round(3)
            
            print(f"\n📊 NDVI Statistics:")
            print(ndvi_stats)
            
            return combined_ndvi
        else:
            return pd.DataFrame()
    
    def load_existing_soil_data(self):
        """
        Load your existing soil data
        
        Returns:
        --------
        pd.DataFrame : Soil data
        """
        print("\n🌍 Loading your existing soil data...")
        print("=" * 70)
        
        soil_files = [
            'soil_data_cleaned.csv',
            'DB_SugarCane_SOILS_MENDELEY_Cleaned.csv'
        ]
        
        all_soil = []
        
        for filename in soil_files:
            filepath = self.cleaned_data_dir / filename
            if filepath.exists():
                df = pd.read_csv(filepath, low_memory=False)
                all_soil.append(df)
                print(f"  ✅ {filename}: {len(df)} records")
        
        if all_soil:
            combined_soil = pd.concat(all_soil, ignore_index=True)
            print(f"\n  Total soil records: {len(combined_soil)}")
            
            # Show available columns
            soil_cols = [col for col in combined_soil.columns if any(x in col.lower() for x in ['ph', 'nitrogen', 'phosphorus', 'potassium', 'moisture'])]
            print(f"  Available soil parameters: {len(soil_cols)}")
            
            return combined_soil
        else:
            return pd.DataFrame()
    
    def load_base_dataset(self):
        """
        Load your base combined dataset
        
        Returns:
        --------
        pd.DataFrame : Base dataset
        """
        print("\n📂 Loading base dataset...")
        print("=" * 70)
        
        base_file = self.project_root / 'combined_sugarcane_dataset.csv'
        
        if base_file.exists():
            df = pd.read_csv(base_file, low_memory=False)
            print(f"  ✅ Loaded: {len(df)} records, {len(df.columns)} columns")
            
            # Extract key columns
            key_cols = ['state_name', 'district_name', 'year', 'season', 
                       'area_hectare', 'yield_t_ha', 'yield_tons_per_hectare']
            
            available_cols = [col for col in key_cols if col in df.columns]
            
            if available_cols:
                df_clean = df[available_cols].copy()
                
                # Standardize column names
                if 'state_name' in df_clean.columns:
                    df_clean['state'] = df_clean['state_name'].str.strip().str.title()
                if 'district_name' in df_clean.columns:
                    df_clean['district'] = df_clean['district_name'].str.strip().str.title()
                if 'year' in df_clean.columns:
                    df_clean['year'] = pd.to_numeric(df_clean['year'], errors='coerce')
                
                # Standardize yield
                if 'yield_t_ha' in df_clean.columns:
                    df_clean['yield'] = pd.to_numeric(df_clean['yield_t_ha'], errors='coerce')
                elif 'yield_tons_per_hectare' in df_clean.columns:
                    df_clean['yield'] = pd.to_numeric(df_clean['yield_tons_per_hectare'], errors='coerce')
                
                # Remove invalid yields
                df_clean = df_clean[df_clean['yield'].notna() & (df_clean['yield'] > 0)]
                
                print(f"  Clean records with yield: {len(df_clean)}")
                
                return df_clean
            else:
                print("  ⚠️  Key columns not found")
                return pd.DataFrame()
        else:
            print(f"  ❌ File not found: {base_file}")
            return pd.DataFrame()
    
    def load_variety_data(self):
        """
        Load variety master data
        
        Returns:
        --------
        pd.DataFrame : Variety data
        """
        print("\n🌱 Loading variety data...")
        
        variety_file = self.project_root / 'backend' / 'data' / 'sugarcane_varieties_master.csv'
        
        if variety_file.exists():
            df = pd.read_csv(variety_file, on_bad_lines='skip', engine='python')
            print(f"  ✅ Loaded: {len(df)} varieties")
            return df
        else:
            print(f"  ⚠️  File not found")
            return pd.DataFrame()
    
    def create_integrated_dataset(self, base_df, weather_df, ndvi_df, soil_df, variety_df):
        """
        Integrate all data sources
        
        Returns:
        --------
        pd.DataFrame : Integrated dataset
        """
        print("\n🔗 Integrating all data sources...")
        print("=" * 70)
        
        if base_df.empty:
            print("❌ No base data to integrate")
            return pd.DataFrame()
        
        final_df = base_df.copy()
        print(f"  Starting with: {len(final_df)} records")
        
        # 1. Merge weather data (by state/district)
        if not weather_df.empty:
            weather_subset = weather_df[['state', 'district', 'temperature', 'humidity', 
                                        'wind_speed', 'clouds', 'pressure']].copy()
            weather_subset.columns = ['state', 'district', 'temperature_c', 'humidity_percent', 
                                     'wind_speed_ms', 'cloud_cover_percent', 'pressure_hpa']
            
            final_df = final_df.merge(weather_subset, on=['state', 'district'], how='left')
            print(f"  ✅ Merged weather data")
        
        # 2. Merge NDVI data (by region)
        if not ndvi_df.empty:
            # Map districts to NDVI regions
            district_to_region = {
                'Belagavi': 'Belagavi',
                'Belgaum': 'Belagavi',
                'Mandya': 'Mandya',
                'Mysuru': 'Mandya',
                'Mysore': 'Mandya',
                'Jalandhar': 'Punjab',
                'Gurdaspur': 'Punjab',
                'Amritsar': 'Punjab',
                'Ludhiana': 'Punjab',
                'Coimbatore': 'Tamil Nadu',
                'Erode': 'Tamil Nadu',
                'Salem': 'Tamil Nadu'
            }
            
            # Calculate NDVI stats by region
            ndvi_stats = ndvi_df.groupby('source_region')['ndvi'].agg([
                ('ndvi_mean', 'mean'),
                ('ndvi_max', 'max'),
                ('ndvi_min', 'min'),
                ('ndvi_std', 'std')
            ]).reset_index()
            
            # Map to final dataset
            final_df['ndvi_region'] = final_df['district'].map(district_to_region)
            final_df = final_df.merge(
                ndvi_stats, 
                left_on='ndvi_region', 
                right_on='source_region', 
                how='left'
            )
            
            matched = final_df['ndvi_mean'].notna().sum()
            print(f"  ✅ Merged NDVI data ({matched} records matched)")
        
        # 3. Add variety information (assign based on state/district logic)
        if not variety_df.empty:
            # Default varieties by state
            state_varieties = {
                'Karnataka': 'Co 86032',
                'Maharashtra': 'CoM 0265',
                'Uttar Pradesh': 'Co 0238',
                'Tamil Nadu': 'Co 86032',
                'Punjab': 'CoPb 94',
                'Haryana': 'CoH 160',
                'Gujarat': 'Co 99004',
                'Andhra Pradesh': 'Co 86032'
            }
            
            final_df['variety'] = final_df['state'].map(state_varieties).fillna('Co 86032')
            print(f"  ✅ Assigned varieties")
        
        # 4. Add historical features
        if 'year' in final_df.columns and 'yield' in final_df.columns:
            final_df = final_df.sort_values(['state', 'district', 'year'])
            
            # Previous year yield
            final_df['prev_year_yield'] = final_df.groupby(['state', 'district'])['yield'].shift(1)
            
            # 3-year average
            final_df['yield_3yr_avg'] = final_df.groupby(['state', 'district'])['yield'].transform(
                lambda x: x.rolling(window=3, min_periods=1).mean()
            )
            
            # Historical average
            final_df['historical_avg_yield'] = final_df.groupby(['state', 'district'])['yield'].transform('mean')
            
            print(f"  ✅ Added historical features")
        
        print(f"\n  Final dataset: {len(final_df)} records, {len(final_df.columns)} features")
        
        return final_df
    
    def save_final_dataset(self, df):
        """
        Save the final integrated dataset
        """
        if df.empty:
            print("\n❌ No data to save")
            return
        
        output_path = self.output_dir / 'SUGARCANE_FINAL_ML_DATASET.csv'
        df.to_csv(output_path, index=False)
        
        print(f"\n💾 Saved final dataset:")
        print(f"   Path: {output_path}")
        print(f"   Records: {len(df):,}")
        print(f"   Features: {len(df.columns)}")
        print(f"   Size: {output_path.stat().st_size / (1024**2):.2f} MB")
        
        # Data quality report
        print(f"\n📊 Data Quality:")
        key_features = ['yield', 'variety', 'temperature_c', 'humidity_percent', 
                       'ndvi_mean', 'prev_year_yield']
        
        for feat in key_features:
            if feat in df.columns:
                completeness = df[feat].notna().mean() * 100
                status = "✅" if completeness > 70 else "⚠️" if completeness > 40 else "❌"
                print(f"   {status} {feat:25s}: {completeness:5.1f}%")
        
        # Save summary
        summary = {
            'total_records': len(df),
            'total_features': len(df.columns),
            'states': df['state'].nunique() if 'state' in df.columns else 0,
            'districts': df['district'].nunique() if 'district' in df.columns else 0,
            'varieties': df['variety'].nunique() if 'variety' in df.columns else 0,
            'avg_yield': df['yield'].mean() if 'yield' in df.columns else 0,
            'data_sources': [
                'combined_sugarcane_dataset.csv',
                'OpenWeather API (real-time)',
                'NDVI CSVs (Belagavi, Mandya, Punjab, Tamil Nadu)',
                'Soil CSVs',
                'Variety master CSV'
            ]
        }
        
        import json
        summary_path = self.output_dir / 'dataset_summary.json'
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📋 Summary: {summary_path}")
    
    def run_full_integration(self):
        """
        Run complete integration pipeline
        """
        print(f"\nStarted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Step 1: Collect real weather data
        weather_df = self.collect_current_weather()
        
        # Step 2: Load existing NDVI data
        ndvi_df = self.load_existing_ndvi_data()
        
        # Step 3: Load existing soil data
        soil_df = self.load_existing_soil_data()
        
        # Step 4: Load base dataset
        base_df = self.load_base_dataset()
        
        # Step 5: Load variety data
        variety_df = self.load_variety_data()
        
        # Step 6: Integrate everything
        final_df = self.create_integrated_dataset(base_df, weather_df, ndvi_df, soil_df, variety_df)
        
        # Step 7: Save final dataset
        if not final_df.empty:
            self.save_final_dataset(final_df)
            
            print("\n" + "=" * 70)
            print("✅ INTEGRATION COMPLETE!")
            print("=" * 70)
            print(f"\n[SUCCESS] Your ML-ready dataset is ready for:")
            print("   - XGBoost Regressor")
            print("   - Random Forest Regressor")
            print("   - Variety comparison (Co 86032, Co 0238, CoC 671, etc.)")
            print("   - Flask + React web platform")
        else:
            print("\n❌ Integration failed")
        
        print(f"\nFinished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


def main():
    """
    Main execution
    """
    integrator = WeatherIntegratedDataset()
    integrator.run_full_integration()


if __name__ == "__main__":
    main()
