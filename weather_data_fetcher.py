"""
Weather Data Fetcher for Sugarcane Dataset
===========================================

Fetches weather data from multiple sources:
1. NASA POWER API (Free, historical global weather)
2. Open-Meteo API (Free, historical weather)
3. Local weather CSV files if available

Features retrieved:
- Rainfall (daily, monthly aggregations)
- Temperature (min, max, average)
- Humidity
- Solar radiation
- Wind speed
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
import time
import json

class WeatherDataFetcher:
    """
    Fetch weather data for sugarcane locations and time periods
    """
    
    def __init__(self, enriched_csv_path):
        """
        Initialize with the enriched dataset
        
        Parameters:
        -----------
        enriched_csv_path : str
            Path to the enriched dataset CSV
        """
        self.df = pd.read_csv(enriched_csv_path)
        print(f"📂 Loaded {len(self.df)} records for weather enrichment")
        
    def fetch_nasa_power_data(self, lat, lon, start_year, end_year):
        """
        Fetch weather data from NASA POWER API
        Free and reliable for agricultural data
        
        Parameters:
        -----------
        lat : float
            Latitude
        lon : float
            Longitude
        start_year : int
            Start year
        end_year : int
            End year
            
        Returns:
        --------
        dict : Weather data for the period
        """
        # NASA POWER API endpoint
        base_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        
        # Parameters for sugarcane agriculture
        parameters = [
            "PRECTOTCORR",  # Precipitation
            "T2M",          # Temperature at 2m
            "T2M_MAX",      # Maximum temperature
            "T2M_MIN",      # Minimum temperature
            "RH2M",         # Relative humidity
            "ALLSKY_SFC_SW_DWN",  # Solar radiation
            "WS2M",         # Wind speed
        ]
        
        params = {
            "parameters": ",".join(parameters),
            "community": "AG",  # Agricultural community
            "longitude": lon,
            "latitude": lat,
            "start": f"{start_year}0101",
            "end": f"{end_year}1231",
            "format": "JSON"
        }
        
        try:
            print(f"  Fetching NASA POWER data for ({lat}, {lon}), {start_year}-{end_year}...", end=" ")
            response = requests.get(base_url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                print("✅")
                return data
            else:
                print(f"❌ Status {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return None
    
    def fetch_open_meteo_data(self, lat, lon, start_date, end_date):
        """
        Fetch weather data from Open-Meteo API
        Free historical weather data
        
        Parameters:
        -----------
        lat : float
            Latitude
        lon : float
            Longitude
        start_date : str
            Start date (YYYY-MM-DD)
        end_date : str
            End date (YYYY-MM-DD)
            
        Returns:
        --------
        dict : Weather data
        """
        base_url = "https://archive-api.open-meteo.com/v1/archive"
        
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date,
            "end_date": end_date,
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "temperature_2m_mean",
                "precipitation_sum",
                "relative_humidity_2m_mean",
            ],
            "timezone": "Asia/Kolkata"
        }
        
        try:
            print(f"  Fetching Open-Meteo data for ({lat}, {lon})...", end=" ")
            response = requests.get(base_url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                print("✅")
                return data
            else:
                print(f"❌ Status {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return None
    
    def aggregate_weather_data(self, weather_data, data_source='nasa'):
        """
        Aggregate daily weather data to useful features
        
        Parameters:
        -----------
        weather_data : dict
            Raw weather data from API
        data_source : str
            'nasa' or 'open-meteo'
            
        Returns:
        --------
        dict : Aggregated features
        """
        if not weather_data:
            return {}
        
        try:
            if data_source == 'nasa':
                params = weather_data.get('properties', {}).get('parameter', {})
                
                # Extract daily data
                rainfall = list(params.get('PRECTOTCORR', {}).values())
                temp_avg = list(params.get('T2M', {}).values())
                temp_max = list(params.get('T2M_MAX', {}).values())
                temp_min = list(params.get('T2M_MIN', {}).values())
                humidity = list(params.get('RH2M', {}).values())
                
            elif data_source == 'open-meteo':
                daily = weather_data.get('daily', {})
                
                rainfall = daily.get('precipitation_sum', [])
                temp_avg = daily.get('temperature_2m_mean', [])
                temp_max = daily.get('temperature_2m_max', [])
                temp_min = daily.get('temperature_2m_min', [])
                humidity = daily.get('relative_humidity_2m_mean', [])
            
            # Clean data (remove -999 or None values)
            rainfall = [r for r in rainfall if r is not None and r >= 0]
            temp_avg = [t for t in temp_avg if t is not None and t > -50]
            temp_max = [t for t in temp_max if t is not None and t > -50]
            temp_min = [t for t in temp_min if t is not None and t > -50]
            humidity = [h for h in humidity if h is not None and h >= 0]
            
            # Calculate aggregations
            aggregated = {
                'rainfall_mm': sum(rainfall) if rainfall else np.nan,
                'avg_temperature_c': np.mean(temp_avg) if temp_avg else np.nan,
                'max_temperature_c': max(temp_max) if temp_max else np.nan,
                'min_temperature_c': min(temp_min) if temp_min else np.nan,
                'humidity_percent': np.mean(humidity) if humidity else np.nan,
                'rainy_days': sum(1 for r in rainfall if r > 1),
                'dry_spell_days': self._calculate_max_dry_spell(rainfall),
            }
            
            # Calculate growth stage weather (assuming 12-month crop)
            if len(rainfall) >= 90:  # Need at least 3 months of data
                days_per_stage = len(rainfall) // 4
                
                aggregated['rainfall_early_growth'] = sum(rainfall[:days_per_stage])
                aggregated['rainfall_vegetative'] = sum(rainfall[days_per_stage:2*days_per_stage])
                aggregated['rainfall_grand_growth'] = sum(rainfall[2*days_per_stage:3*days_per_stage])
                aggregated['rainfall_maturity'] = sum(rainfall[3*days_per_stage:])
                
                if temp_avg:
                    aggregated['temp_early_growth'] = np.mean(temp_avg[:days_per_stage])
                    aggregated['temp_vegetative'] = np.mean(temp_avg[days_per_stage:2*days_per_stage])
                    aggregated['temp_grand_growth'] = np.mean(temp_avg[2*days_per_stage:3*days_per_stage])
                    aggregated['temp_maturity'] = np.mean(temp_avg[3*days_per_stage:])
            
            return aggregated
            
        except Exception as e:
            print(f"  ⚠️  Error aggregating data: {str(e)}")
            return {}
    
    def _calculate_max_dry_spell(self, rainfall):
        """Calculate maximum consecutive dry days"""
        if not rainfall:
            return np.nan
        
        max_dry = 0
        current_dry = 0
        
        for r in rainfall:
            if r < 1:  # Less than 1mm considered dry
                current_dry += 1
                max_dry = max(max_dry, current_dry)
            else:
                current_dry = 0
        
        return max_dry
    
    def enrich_dataset_with_weather(self, sample_size=None, use_cache=True):
        """
        Enrich the dataset with weather data
        
        Parameters:
        -----------
        sample_size : int, optional
            Number of records to process (for testing)
        use_cache : bool
            Whether to cache API responses
            
        Returns:
        --------
        pd.DataFrame : Enriched dataset
        """
        print("\n☁️  Enriching dataset with weather data...")
        print("=" * 60)
        
        # Filter records that need weather data
        df_to_enrich = self.df.copy()
        
        if sample_size:
            df_to_enrich = df_to_enrich.head(sample_size)
            print(f"📊 Processing sample of {sample_size} records")
        
        # Cache for API responses
        weather_cache = {}
        
        # Group by location and year to minimize API calls
        location_groups = df_to_enrich.groupby(['state', 'district', 'year'])
        
        print(f"📍 Found {len(location_groups)} unique location-year combinations")
        print("\nFetching weather data...")
        
        enriched_records = []
        
        for (state, district, year), group in location_groups:
            # Get representative coordinates
            lat = group['latitude'].iloc[0] if 'latitude' in group.columns else None
            lon = group['longitude'].iloc[0] if 'longitude' in group.columns else None
            
            # If no coordinates, try to geocode or use state/district center
            if pd.isna(lat) or pd.isna(lon):
                lat, lon = self._get_location_coordinates(state, district)
            
            if pd.isna(lat) or pd.isna(lon):
                print(f"  ⚠️  Skipping {state}/{district}/{year} - no coordinates")
                continue
            
            # Create cache key
            cache_key = f"{lat:.2f}_{lon:.2f}_{year}"
            
            # Check cache
            if use_cache and cache_key in weather_cache:
                weather_features = weather_cache[cache_key]
            else:
                # Fetch weather data
                start_date = f"{int(year)}-01-01"
                end_date = f"{int(year)}-12-31"
                
                # Try Open-Meteo first (faster)
                weather_data = self.fetch_open_meteo_data(lat, lon, start_date, end_date)
                weather_features = self.aggregate_weather_data(weather_data, 'open-meteo')
                
                # If failed, try NASA POWER
                if not weather_features:
                    weather_data = self.fetch_nasa_power_data(lat, lon, int(year), int(year))
                    weather_features = self.aggregate_weather_data(weather_data, 'nasa')
                
                # Cache the result
                if use_cache:
                    weather_cache[cache_key] = weather_features
                
                # Rate limiting
                time.sleep(0.5)
            
            # Update all records in this group
            for idx, row in group.iterrows():
                row_dict = row.to_dict()
                row_dict.update(weather_features)
                enriched_records.append(row_dict)
        
        # Create enriched dataframe
        enriched_df = pd.DataFrame(enriched_records)
        
        print(f"\n✅ Enriched {len(enriched_df)} records with weather data")
        
        return enriched_df
    
    def _get_location_coordinates(self, state, district):
        """
        Get approximate coordinates for state/district
        Uses predefined centroids for major sugarcane states/districts
        """
        # Major sugarcane district coordinates
        district_coords = {
            # Karnataka
            'Mandya': (12.5244, 76.8958),
            'Belgaum': (15.8497, 74.4977),
            'Belagavi': (15.8497, 74.4977),
            'Mysuru': (12.2958, 76.6394),
            'Mysore': (12.2958, 76.6394),
            'Bagalkot': (16.1691, 75.6948),
            'Shimoga': (13.9299, 75.5681),
            
            # Maharashtra
            'Pune': (18.5204, 73.8567),
            'Kolhapur': (16.7050, 74.2433),
            'Sangli': (16.8524, 74.5653),
            'Satara': (17.6805, 74.0183),
            'Ahmednagar': (19.0948, 74.7480),
            'Solapur': (17.6599, 75.9064),
            
            # Uttar Pradesh
            'Muzaffarnagar': (29.4727, 77.7085),
            'Meerut': (28.9845, 77.7064),
            'Bijnor': (29.3732, 78.1369),
            'Saharanpur': (29.9680, 77.5460),
            'Bareilly': (28.3670, 79.4304),
            
            # Tamil Nadu
            'Coimbatore': (11.0168, 76.9558),
            'Erode': (11.3410, 77.7172),
            'Salem': (11.6643, 78.1460),
            'Thanjavur': (10.7870, 79.1378),
            'Tiruchirappalli': (10.7905, 78.7047),
            
            # Punjab
            'Jalandhar': (31.3260, 75.5762),
            'Gurdaspur': (32.0411, 75.4056),
            'Amritsar': (31.6340, 74.8723),
            
            # Haryana
            'Yamuna Nagar': (30.1290, 77.2674),
            'Karnal': (29.6857, 76.9905),
        }
        
        # State centroids as fallback
        state_coords = {
            'Karnataka': (15.3173, 75.7139),
            'Maharashtra': (19.7515, 75.7139),
            'Uttar Pradesh': (26.8467, 80.9462),
            'Tamil Nadu': (11.1271, 78.6569),
            'Punjab': (31.1471, 75.3412),
            'Haryana': (29.0588, 76.0856),
            'Gujarat': (22.2587, 71.1924),
            'Andhra Pradesh': (15.9129, 79.7400),
            'Bihar': (25.0961, 85.3131),
        }
        
        # Try district first
        if district in district_coords:
            return district_coords[district]
        
        # Try state
        if state in state_coords:
            return state_coords[state]
        
        # Default to Karnataka center
        return (15.3173, 75.7139)
    
    def save_enriched_dataset(self, enriched_df, output_path):
        """Save the weather-enriched dataset"""
        enriched_df.to_csv(output_path, index=False)
        print(f"\n💾 Saved weather-enriched dataset: {output_path}")
        
        # Print summary
        weather_cols = ['rainfall_mm', 'avg_temperature_c', 'humidity_percent']
        print("\n📊 Weather Data Summary:")
        for col in weather_cols:
            if col in enriched_df.columns:
                completeness = enriched_df[col].notna().mean() * 100
                print(f"   {col:25s}: {completeness:5.1f}% complete")


def main():
    """Main execution"""
    print("=" * 60)
    print("☁️  WEATHER DATA ENRICHMENT")
    print("=" * 60)
    
    # Initialize fetcher
    fetcher = WeatherDataFetcher('enriched_data/ml_ready_sugarcane_dataset.csv')
    
    # Enrich dataset (start with sample)
    print("\n⚠️  Starting with 50 records for testing...")
    print("    Remove sample_size parameter to process all records")
    
    enriched_df = fetcher.enrich_dataset_with_weather(sample_size=50)
    
    # Save result
    fetcher.save_enriched_dataset(
        enriched_df, 
        'enriched_data/weather_enriched_dataset.csv'
    )
    
    print("\n✅ Weather enrichment complete!")
    print("\nNote: This uses free APIs (Open-Meteo and NASA POWER)")
    print("For production, consider:")
    print("- IMD (India Meteorological Department) data")
    print("- Local weather station data")
    print("- Paid weather APIs for better coverage")


if __name__ == "__main__":
    main()
