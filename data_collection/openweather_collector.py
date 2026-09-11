"""
OpenWeather API Data Collector
===============================

Collects historical and current weather data for sugarcane regions
using OpenWeather API.
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
import json
from pathlib import Path

from config import APIKeys, CollectionConfig, DISTRICT_COORDINATES, DATA_DIR


class OpenWeatherCollector:
    """
    Collect weather data from OpenWeather API
    """
    
    def __init__(self, api_key=None):
        """
        Initialize collector
        
        Parameters:
        -----------
        api_key : str
            OpenWeather API key
        """
        self.api_key = api_key or APIKeys.OPENWEATHER_API_KEY
        
        if self.api_key == "YOUR_OPENWEATHER_API_KEY_HERE":
            print("⚠️  WARNING: Please set your OpenWeather API key in .env file")
        
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.history_url = "https://history.openweathermap.org/data/2.5/history/city"
        
        print(f"📡 OpenWeather Collector initialized")
    
    def fetch_current_weather(self, lat, lon, location_name=""):
        """
        Fetch current weather for a location
        
        Parameters:
        -----------
        lat : float
            Latitude
        lon : float
            Longitude
        location_name : str
            Name of location (for logging)
            
        Returns:
        --------
        dict : Weather data
        """
        url = f"{self.base_url}/weather"
        
        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'metric'  # Celsius
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                weather_data = {
                    'location': location_name,
                    'latitude': lat,
                    'longitude': lon,
                    'timestamp': datetime.fromtimestamp(data['dt']),
                    'temperature': data['main']['temp'],
                    'feels_like': data['main']['feels_like'],
                    'temp_min': data['main']['temp_min'],
                    'temp_max': data['main']['temp_max'],
                    'pressure': data['main']['pressure'],
                    'humidity': data['main']['humidity'],
                    'wind_speed': data['wind']['speed'],
                    'clouds': data['clouds']['all'],
                    'weather_description': data['weather'][0]['description'],
                    'rain_1h': data.get('rain', {}).get('1h', 0),
                }
                
                print(f"  ✅ {location_name}: {weather_data['temperature']}°C, {weather_data['humidity']}% humidity")
                return weather_data
            
            elif response.status_code == 401:
                print(f"  ❌ Authentication failed. Check your API key.")
                return None
            else:
                print(f"  ⚠️  {location_name}: Status {response.status_code}")
                return None
                
        except Exception as e:
            print(f"  ❌ {location_name}: Error - {str(e)}")
            return None
    
    def fetch_forecast(self, lat, lon, location_name=""):
        """
        Fetch 5-day weather forecast
        
        Parameters:
        -----------
        lat : float
            Latitude
        lon : float
            Longitude
        location_name : str
            Name of location
            
        Returns:
        --------
        list : List of forecast data
        """
        url = f"{self.base_url}/forecast"
        
        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'metric'
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                forecasts = []
                for item in data['list']:
                    forecast = {
                        'location': location_name,
                        'latitude': lat,
                        'longitude': lon,
                        'timestamp': datetime.fromtimestamp(item['dt']),
                        'temperature': item['main']['temp'],
                        'temp_min': item['main']['temp_min'],
                        'temp_max': item['main']['temp_max'],
                        'pressure': item['main']['pressure'],
                        'humidity': item['main']['humidity'],
                        'wind_speed': item['wind']['speed'],
                        'clouds': item['clouds']['all'],
                        'weather_description': item['weather'][0]['description'],
                        'rain_3h': item.get('rain', {}).get('3h', 0),
                        'pop': item.get('pop', 0) * 100,  # Probability of precipitation
                    }
                    forecasts.append(forecast)
                
                print(f"  ✅ {location_name}: {len(forecasts)} forecast points")
                return forecasts
            
            else:
                print(f"  ⚠️  {location_name}: Status {response.status_code}")
                return []
                
        except Exception as e:
            print(f"  ❌ {location_name}: Error - {str(e)}")
            return []
    
    def collect_for_all_districts(self, data_type='current'):
        """
        Collect weather data for all configured districts
        
        Parameters:
        -----------
        data_type : str
            'current' or 'forecast'
            
        Returns:
        --------
        pd.DataFrame : Collected weather data
        """
        print(f"\n📍 Collecting {data_type} weather data for all districts...")
        print("=" * 70)
        
        all_data = []
        
        for state, districts in CollectionConfig.LOCATIONS.items():
            print(f"\n🗺️  {state}")
            
            for district in districts:
                if district in DISTRICT_COORDINATES:
                    coords = DISTRICT_COORDINATES[district]
                    location_name = f"{district}, {state}"
                    
                    if data_type == 'current':
                        weather = self.fetch_current_weather(
                            coords['lat'], 
                            coords['lon'], 
                            location_name
                        )
                        if weather:
                            weather['state'] = state
                            weather['district'] = district
                            all_data.append(weather)
                    
                    elif data_type == 'forecast':
                        forecasts = self.fetch_forecast(
                            coords['lat'], 
                            coords['lon'], 
                            location_name
                        )
                        for forecast in forecasts:
                            forecast['state'] = state
                            forecast['district'] = district
                            all_data.append(forecast)
                    
                    # Rate limiting
                    time.sleep(CollectionConfig.API_RATE_LIMIT_DELAY)
                else:
                    print(f"  ⚠️  {district}: Coordinates not found")
        
        if all_data:
            df = pd.DataFrame(all_data)
            print(f"\n✅ Collected {len(df)} weather records")
            return df
        else:
            print("\n⚠️  No data collected")
            return pd.DataFrame()
    
    def save_data(self, df, filename=None):
        """
        Save collected data to CSV
        
        Parameters:
        -----------
        df : pd.DataFrame
            Data to save
        filename : str
            Output filename
        """
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"openweather_data_{timestamp}.csv"
        
        output_path = DATA_DIR / filename
        df.to_csv(output_path, index=False)
        
        print(f"\n💾 Saved: {output_path}")
        print(f"   Records: {len(df)}")
        print(f"   Size: {output_path.stat().st_size / 1024:.2f} KB")


def main():
    """
    Main execution
    """
    print("=" * 70)
    print("  OPENWEATHER DATA COLLECTION")
    print("=" * 70)
    
    # Initialize collector
    collector = OpenWeatherCollector()
    
    # Check API key
    if collector.api_key == "YOUR_OPENWEATHER_API_KEY_HERE":
        print("\n❌ Please set your OpenWeather API key first!")
        print("\n Steps:")
        print("  1. Get free API key from: https://openweathermap.org/api")
        print("  2. Copy data_collection/.env.example to .env")
        print("  3. Add your API key to .env file")
        return
    
    print("\n📊 Select data collection type:")
    print("  1. Current weather (all districts)")
    print("  2. 5-day forecast (all districts)")
    print("  3. Both")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice in ['1', '3']:
        # Collect current weather
        current_df = collector.collect_for_all_districts('current')
        if not current_df.empty:
            collector.save_data(current_df, 'openweather_current.csv')
    
    if choice in ['2', '3']:
        # Collect forecast
        forecast_df = collector.collect_for_all_districts('forecast')
        if not forecast_df.empty:
            collector.save_data(forecast_df, 'openweather_forecast.csv')
    
    print("\n" + "=" * 70)
    print("✅ OpenWeather data collection complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
