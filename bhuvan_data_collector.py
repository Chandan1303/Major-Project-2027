"""
Bhuvan API Data Collector for Sugarcane Yield Prediction
Fetches satellite data from ISRO Bhuvan API
"""

import requests
import pandas as pd
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv('data_collection/.env')

BHUVAN_API_KEY = os.getenv('BHUVAN_API_KEY')
BHUVAN_BASE_URL = 'https://bhuvan-app1.nrsc.gov.in'

class BhuvanCollector:
    def __init__(self, api_key=None):
        self.api_key = api_key or BHUVAN_API_KEY
        self.base_url = BHUVAN_BASE_URL
        
    def get_ndvi_data(self, lat, lon, start_date, end_date):
        """Fetch NDVI data for a location"""
        try:
            url = f"{self.base_url}/api/ndvi"
            params = {
                'lat': lat,
                'lon': lon,
                'start_date': start_date,
                'end_date': end_date,
                'api_key': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"NDVI API Error: {response.status_code}")
                return None
        except Exception as e:
            print(f"NDVI Fetch Error: {e}")
            return None
    
    def get_soil_moisture(self, lat, lon, date=None):
        """Fetch soil moisture data"""
        try:
            if date is None:
                date = datetime.now().strftime('%Y-%m-%d')
                
            url = f"{self.base_url}/api/soil-moisture"
            params = {
                'lat': lat,
                'lon': lon,
                'date': date,
                'api_key': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Soil Moisture API Error: {response.status_code}")
                return None
        except Exception as e:
            print(f"Soil Moisture Fetch Error: {e}")
            return None
    
    def get_crop_data(self, lat, lon, season='kharif', year=None):
        """Fetch crop classification data"""
        try:
            if year is None:
                year = datetime.now().year
                
            url = f"{self.base_url}/api/crop-classification"
            params = {
                'lat': lat,
                'lon': lon,
                'season': season,
                'year': year,
                'api_key': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Crop API Error: {response.status_code}")
                return None
        except Exception as e:
            print(f"Crop Data Fetch Error: {e}")
            return None
    
    def get_agricultural_data(self, lat, lon, start_date=None, end_date=None, season='kharif'):
        """Fetch comprehensive agricultural data"""
        try:
            if start_date is None:
                start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
            if end_date is None:
                end_date = datetime.now().strftime('%Y-%m-%d')
            
            # Fetch all data
            ndvi = self.get_ndvi_data(lat, lon, start_date, end_date)
            soil = self.get_soil_moisture(lat, lon, end_date)
            crop = self.get_crop_data(lat, lon, season)
            
            return {
                'location': {'latitude': lat, 'longitude': lon},
                'ndvi': ndvi,
                'soil_moisture': soil,
                'crop': crop,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Agricultural Data Error: {e}")
            return None

    def collect_for_locations(self, locations, output_file='bhuvan_data_output.json'):
        """
        Collect data for multiple locations
        locations: list of dicts with 'lat', 'lon', 'name'
        """
        results = []
        
        print(f"Collecting Bhuvan data for {len(locations)} locations...")
        
        for i, loc in enumerate(locations, 1):
            print(f"\n[{i}/{len(locations)}] Processing: {loc.get('name', 'Unknown')}")
            print(f"  Coordinates: ({loc['lat']}, {loc['lon']})")
            
            data = self.get_agricultural_data(
                loc['lat'],
                loc['lon'],
                season=loc.get('season', 'kharif')
            )
            
            if data:
                data['location_name'] = loc.get('name', 'Unknown')
                data['state'] = loc.get('state', 'Unknown')
                results.append(data)
                print(f"  ✓ Data collected successfully")
            else:
                print(f"  ✗ Failed to collect data")
        
        # Save results
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n✓ Data saved to: {output_file}")
        print(f"✓ Total locations processed: {len(results)}/{len(locations)}")
        
        return results


if __name__ == '__main__':
    # Example: Major sugarcane producing regions in India
    locations = [
        {'lat': 17.3850, 'lon': 78.4867, 'name': 'Hyderabad', 'state': 'Telangana', 'season': 'kharif'},
        {'lat': 23.0225, 'lon': 72.5714, 'name': 'Ahmedabad', 'state': 'Gujarat', 'season': 'rabi'},
        {'lat': 19.0760, 'lon': 72.8777, 'name': 'Mumbai', 'state': 'Maharashtra', 'season': 'kharif'},
        {'lat': 12.9716, 'lon': 77.5946, 'name': 'Bangalore', 'state': 'Karnataka', 'season': 'kharif'},
        {'lat': 26.9124, 'lon': 75.7873, 'name': 'Jaipur', 'state': 'Rajasthan', 'season': 'rabi'},
        {'lat': 30.7333, 'lon': 76.7794, 'name': 'Chandigarh', 'state': 'Punjab', 'season': 'kharif'},
        {'lat': 25.5941, 'lon': 85.1376, 'name': 'Patna', 'state': 'Bihar', 'season': 'kharif'},
        {'lat': 22.5726, 'lon': 88.3639, 'name': 'Kolkata', 'state': 'West Bengal', 'season': 'kharif'},
        {'lat': 13.0827, 'lon': 80.2707, 'name': 'Chennai', 'state': 'Tamil Nadu', 'season': 'kharif'},
        {'lat': 28.7041, 'lon': 77.1025, 'name': 'Delhi', 'state': 'Delhi', 'season': 'rabi'}
    ]
    
    print("="*70)
    print("BHUVAN DATA COLLECTOR - ISRO SATELLITE DATA")
    print("="*70)
    print(f"\nAPI Key: {'✓ Configured' if BHUVAN_API_KEY else '✗ Missing'}")
    print(f"Base URL: {BHUVAN_BASE_URL}")
    
    if not BHUVAN_API_KEY:
        print("\n⚠️  WARNING: BHUVAN_API_KEY not found in environment")
        print("   Please set it in data_collection/.env")
        exit(1)
    
    collector = BhuvanCollector()
    results = collector.collect_for_locations(
        locations,
        output_file='data_collection/collected_data/bhuvan_satellite_data.json'
    )
    
    print("\n" + "="*70)
    print("COLLECTION COMPLETE!")
    print("="*70)
