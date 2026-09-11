"""
Master Data Collection Script
==============================

Coordinates all data collection from multiple sources:
1. OpenWeather API
2. MOSDAC (Indian satellite)
3. Google Earth Engine (Sentinel-2 NDVI)
4. Existing dataset integration

Outputs a single ML-ready dataset.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import json

from config import CollectionConfig, OUTPUT_FILES, DATA_DIR, PROCESSED_DATA_DIR
from openweather_collector import OpenWeatherCollector
from mosdac_collector import MOSDACCollector
from gee_ndvi_collector import GEENDVICollector


class MasterDataCollector:
    """
    Coordinates all data collection and creates final dataset
    """
    
    def __init__(self):
        """Initialize master collector"""
        print("=" * 70)
        print("  SUGARCANE DATA COLLECTION SYSTEM")
        print("  Team: Dayanand, Chandan, Harsha, Mohammad")
        print("  Project: AI-Based Sugarcane Yield Prediction")
        print("=" * 70)
        
        self.collectors = {
            'openweather': OpenWeatherCollector(),
            'mosdac': MOSDACCollector(),
            'gee_ndvi': GEENDVICollector()
        }
        
        self.collected_data = {}
        self.metadata = {
            'collection_date': datetime.now().isoformat(),
            'date_range': f"{CollectionConfig.START_YEAR}-{CollectionConfig.END_YEAR}",
            'sources': [],
            'records_collected': {}
        }
    
    def collect_weather_data(self):
        """
        Collect weather data from OpenWeather
        
        Returns:
        --------
        pd.DataFrame : Weather data
        """
        print("\n" + "=" * 70)
        print("STEP 1: WEATHER DATA COLLECTION (OpenWeather API)")
        print("=" * 70)
        
        try:
            # Collect current weather
            weather_df = self.collectors['openweather'].collect_for_all_districts('current')
            
            if not weather_df.empty:
                self.collectors['openweather'].save_data(weather_df, OUTPUT_FILES['weather'])
                self.collected_data['weather'] = weather_df
                self.metadata['sources'].append('OpenWeather API')
                self.metadata['records_collected']['weather'] = len(weather_df)
                
                print(f"\n✅ Weather data: {len(weather_df)} records")
                return weather_df
            else:
                print("\n⚠️  No weather data collected")
                return pd.DataFrame()
                
        except Exception as e:
            print(f"\n❌ Weather collection failed: {str(e)}")
            return pd.DataFrame()
    
    def collect_mosdac_data(self):
        """
        Collect data from MOSDAC
        
        Returns:
        --------
        pd.DataFrame : MOSDAC data
        """
        print("\n" + "=" * 70)
        print("STEP 2: MOSDAC DATA COLLECTION (Indian Satellite)")
        print("=" * 70)
        
        try:
            mosdac_df = self.collectors['mosdac'].collect_for_districts(
                start_year=CollectionConfig.START_YEAR,
                end_year=CollectionConfig.END_YEAR
            )
            
            if not mosdac_df.empty:
                self.collectors['mosdac'].save_data(mosdac_df, 'mosdac_data_collected.csv')
                self.collected_data['mosdac'] = mosdac_df
                self.metadata['sources'].append('MOSDAC')
                self.metadata['records_collected']['mosdac'] = len(mosdac_df)
                
                print(f"\n✅ MOSDAC data: {len(mosdac_df)} records")
                return mosdac_df
            else:
                print("\n⚠️  No MOSDAC data collected")
                return pd.DataFrame()
                
        except Exception as e:
            print(f"\n❌ MOSDAC collection failed: {str(e)}")
            return pd.DataFrame()
    
    def collect_ndvi_data(self):
        """
        Collect NDVI data from Google Earth Engine
        
        Returns:
        --------
        pd.DataFrame : NDVI data
        """
        print("\n" + "=" * 70)
        print("STEP 3: NDVI DATA COLLECTION (Sentinel-2/GEE)")
        print("=" * 70)
        
        try:
            ndvi_df = self.collectors['gee_ndvi'].collect_for_districts(
                start_year=CollectionConfig.START_YEAR,
                end_year=CollectionConfig.END_YEAR,
                use_gee=self.collectors['gee_ndvi'].initialized
            )
            
            if not ndvi_df.empty:
                self.collectors['gee_ndvi'].save_data(ndvi_df, OUTPUT_FILES['ndvi'])
                self.collected_data['ndvi'] = ndvi_df
                source = 'Google Earth Engine (Sentinel-2)' if self.collectors['gee_ndvi'].initialized else 'Simulated NDVI'
                self.metadata['sources'].append(source)
                self.metadata['records_collected']['ndvi'] = len(ndvi_df)
                
                print(f"\n✅ NDVI data: {len(ndvi_df)} records")
                return ndvi_df
            else:
                print("\n⚠️  No NDVI data collected")
                return pd.DataFrame()
                
        except Exception as e:
            print(f"\n❌ NDVI collection failed: {str(e)}")
            return pd.DataFrame()
    
    def load_existing_dataset(self):
        """
        Load your existing sugarcane dataset
        
        Returns:
        --------
        pd.DataFrame : Existing dataset
        """
        print("\n" + "=" * 70)
        print("STEP 4: LOADING EXISTING DATASET")
        print("=" * 70)
        
        existing_file = Path("combined_sugarcane_dataset.csv")
        
        if existing_file.exists():
            print(f"📂 Loading: {existing_file}")
            df = pd.read_csv(existing_file, low_memory=False)
            
            print(f"✅ Loaded: {len(df)} records, {len(df.columns)} columns")
            
            # Extract key columns
            key_cols = ['state_name', 'district_name', 'year', 'season', 
                       'area_hectare', 'yield_t_ha', 'yield_tons_per_hectare']
            
            available_cols = [col for col in key_cols if col in df.columns]
            
            if available_cols:
                df_clean = df[available_cols].copy()
                
                # Standardize names
                if 'state_name' in df_clean.columns:
                    df_clean['state'] = df_clean['state_name']
                if 'district_name' in df_clean.columns:
                    df_clean['district'] = df_clean['district_name']
                
                # Standardize yield
                if 'yield_t_ha' in df_clean.columns:
                    df_clean['yield'] = pd.to_numeric(df_clean['yield_t_ha'], errors='coerce')
                elif 'yield_tons_per_hectare' in df_clean.columns:
                    df_clean['yield'] = pd.to_numeric(df_clean['yield_tons_per_hectare'], errors='coerce')
                
                # Remove invalid yields
                df_clean = df_clean[df_clean['yield'].notna() & (df_clean['yield'] > 0)]
                
                self.collected_data['existing'] = df_clean
                self.metadata['sources'].append('Existing Dataset')
                self.metadata['records_collected']['existing'] = len(df_clean)
                
                print(f"✅ Clean records: {len(df_clean)}")
                return df_clean
            else:
                print("⚠️  Key columns not found in existing dataset")
                return pd.DataFrame()
        else:
            print(f"⚠️  File not found: {existing_file}")
            return pd.DataFrame()
    
    def load_variety_data(self):
        """
        Load sugarcane variety master data
        
        Returns:
        --------
        pd.DataFrame : Variety data
        """
        variety_file = Path("backend/data/sugarcane_varieties_master.csv")
        
        if variety_file.exists():
            print(f"\n📂 Loading variety data: {variety_file}")
            df = pd.read_csv(variety_file, on_bad_lines='skip', engine='python')
            
            print(f"✅ Loaded: {len(df)} varieties")
            
            self.collected_data['varieties'] = df
            return df
        else:
            print(f"⚠️  Variety file not found: {variety_file}")
            return pd.DataFrame()
    
    def merge_all_data(self):
        """
        Merge all collected data into single dataset
        
        Returns:
        --------
        pd.DataFrame : Final merged dataset
        """
        print("\n" + "=" * 70)
        print("STEP 5: MERGING ALL DATA SOURCES")
        print("=" * 70)
        
        # Start with existing dataset as base
        if 'existing' in self.collected_data:
            final_df = self.collected_data['existing'].copy()
            print(f"📊 Base dataset: {len(final_df)} records")
        else:
            print("❌ No base dataset available")
            return pd.DataFrame()
        
        # Merge weather data
        if 'weather' in self.collected_data and not self.collected_data['weather'].empty:
            weather_df = self.collected_data['weather'][['state', 'district', 'temperature', 
                                                         'humidity', 'rainfall_mm']].copy()
            
            # Group by state/district and take mean
            weather_agg = weather_df.groupby(['state', 'district']).mean().reset_index()
            
            final_df = final_df.merge(
                weather_agg,
                on=['state', 'district'],
                how='left',
                suffixes=('', '_current')
            )
            
            print(f"  ✅ Merged weather data")
        
        # Merge MOSDAC data
        if 'mosdac' in self.collected_data and not self.collected_data['mosdac'].empty:
            mosdac_df = self.collected_data['mosdac'].copy()
            
            # Convert date to year
            mosdac_df['year'] = pd.to_datetime(mosdac_df['date']).dt.year
            
            # Aggregate by state/district/year
            mosdac_agg = mosdac_df.groupby(['state', 'district', 'year']).agg({
                'rainfall_mm': 'sum',
                'temperature_max': 'mean',
                'temperature_min': 'mean',
                'humidity': 'mean'
            }).reset_index()
            
            mosdac_agg.columns = ['state', 'district', 'year', 'rainfall_mosdac', 
                                 'temp_max_mosdac', 'temp_min_mosdac', 'humidity_mosdac']
            
            final_df = final_df.merge(
                mosdac_agg,
                on=['state', 'district', 'year'],
                how='left'
            )
            
            print(f"  ✅ Merged MOSDAC data")
        
        # Merge NDVI data
        if 'ndvi' in self.collected_data and not self.collected_data['ndvi'].empty:
            ndvi_df = self.collected_data['ndvi'].copy()
            
            # Convert date to year
            ndvi_df['year'] = pd.to_datetime(ndvi_df['date']).dt.year
            
            # Aggregate by state/district/year
            ndvi_agg = ndvi_df.groupby(['state', 'district', 'year']).agg({
                'ndvi': ['mean', 'max', 'min', 'std']
            }).reset_index()
            
            ndvi_agg.columns = ['state', 'district', 'year', 'ndvi_mean', 'ndvi_max', 'ndvi_min', 'ndvi_std']
            
            final_df = final_df.merge(
                ndvi_agg,
                on=['state', 'district', 'year'],
                how='left'
            )
            
            print(f"  ✅ Merged NDVI data")
        
        print(f"\n✅ Final dataset: {len(final_df)} records, {len(final_df.columns)} columns")
        
        return final_df
    
    def save_final_dataset(self, df):
        """
        Save final merged dataset
        
        Parameters:
        -----------
        df : pd.DataFrame
            Final dataset
        """
        if df.empty:
            print("\n❌ No data to save")
            return
        
        output_path = PROCESSED_DATA_DIR / OUTPUT_FILES['final_dataset']
        df.to_csv(output_path, index=False)
        
        print(f"\n💾 Saved final dataset: {output_path}")
        print(f"   Records: {len(df)}")
        print(f"   Features: {len(df.columns)}")
        print(f"   Size: {output_path.stat().st_size / (1024**2):.2f} MB")
        
        # Save metadata
        metadata_path = PROCESSED_DATA_DIR / OUTPUT_FILES['metadata']
        with open(metadata_path, 'w') as f:
            json.dump(self.metadata, f, indent=2)
        
        print(f"   Metadata: {metadata_path}")
        
        # Print summary
        print(f"\n📊 Dataset Summary:")
        print(f"   States: {df['state'].nunique() if 'state' in df.columns else 'N/A'}")
        print(f"   Districts: {df['district'].nunique() if 'district' in df.columns else 'N/A'}")
        if 'year' in df.columns:
            print(f"   Years: {df['year'].min():.0f} - {df['year'].max():.0f}")
        if 'yield' in df.columns:
            print(f"   Avg Yield: {df['yield'].mean():.2f} t/ha")
        
        # Data completeness
        print(f"\n📈 Data Completeness:")
        key_features = ['yield', 'rainfall_mm', 'temperature', 'humidity', 'ndvi_mean']
        for feat in key_features:
            if feat in df.columns:
                completeness = df[feat].notna().mean() * 100
                print(f"   {feat:20s}: {completeness:5.1f}%")
    
    def run_full_collection(self):
        """
        Run complete data collection pipeline
        """
        print(f"\n⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Step 1: Collect weather data
        self.collect_weather_data()
        
        # Step 2: Collect MOSDAC data
        self.collect_mosdac_data()
        
        # Step 3: Collect NDVI data
        self.collect_ndvi_data()
        
        # Step 4: Load existing data
        self.load_existing_dataset()
        
        # Load variety data
        self.load_variety_data()
        
        # Step 5: Merge all data
        final_df = self.merge_all_data()
        
        # Step 6: Save final dataset
        if not final_df.empty:
            self.save_final_dataset(final_df)
        
        print("\n" + "=" * 70)
        print("✅ DATA COLLECTION COMPLETE!")
        print("=" * 70)
        print(f"\n⏱️  Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"\n📁 Output Directory: {PROCESSED_DATA_DIR}")
        print(f"\n🎯 Next Steps:")
        print(f"   1. Review: {OUTPUT_FILES['final_dataset']}")
        print(f"   2. Check metadata: {OUTPUT_FILES['metadata']}")
        print(f"   3. Start ML modeling with XGBoost/Random Forest")


def main():
    """
    Main execution
    """
    collector = MasterDataCollector()
    collector.run_full_collection()


if __name__ == "__main__":
    main()
