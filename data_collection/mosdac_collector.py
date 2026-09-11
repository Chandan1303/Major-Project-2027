"""
MOSDAC Data Collector
=====================

Collects meteorological and satellite data from MOSDAC
(Meteorological and Oceanographic Satellite Data Archival Centre)

MOSDAC provides:
- INSAT-3D/3DR weather data
- Rainfall data
- Temperature, humidity
- Cloud cover
- Wind data
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
import json
from pathlib import Path

from config import APIKeys, CollectionConfig, DISTRICT_COORDINATES, DATA_DIR


class MOSDACCollector:
    """
    Collect data from MOSDAC (Indian satellite data)
    """
    
    def __init__(self, username=None, password=None):
        """
        Initialize MOSDAC collector
        
        Parameters:
        -----------
        username : str
            MOSDAC username
        password : str
            MOSDAC password
        """
        self.username = username or APIKeys.MOSDAC_USERNAME
        self.password = password or APIKeys.MOSDAC_PASSWORD
        
        self.base_url = "https://www.mosdac.gov.in/data"
        self.session = requests.Session()
        
        print(f"📡 MOSDAC Collector initialized")
        
        if self.username == "YOUR_MOSDAC_USERNAME":
            print("⚠️  WARNING: Please register at https://www.mosdac.gov.in/ and set credentials")
    
    def login(self):
        """
        Authenticate with MOSDAC
        
        Returns:
        --------
        bool : Success status
        """
        if self.username == "YOUR_MOSDAC_USERNAME":
            print("❌ MOSDAC credentials not configured")
            return False
        
        # MOSDAC login endpoint (update based on actual API)
        login_url = f"{self.base_url}/login"
        
        try:
            response = self.session.post(
                login_url,
                data={
                    'username': self.username,
                    'password': self.password
                },
                timeout=10
            )
            
            if response.status_code == 200:
                print("✅ MOSDAC authentication successful")
                return True
            else:
                print(f"❌ MOSDAC authentication failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ MOSDAC login error: {str(e)}")
            return False
    
    def fetch_rainfall_data(self, lat, lon, start_date, end_date, location_name=""):
        """
        Fetch rainfall data from MOSDAC
        
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
        location_name : str
            Location name
            
        Returns:
        --------
        list : Rainfall data
        """
        # This is a template - actual API endpoints may differ
        # MOSDAC typically provides data through FTP or specific data portals
        
        print(f"  📊 Fetching MOSDAC rainfall for {location_name}...")
        
        try:
            # Example API call structure (adjust based on actual MOSDAC API)
            url = f"{self.base_url}/rainfall"
            
            params = {
                'lat': lat,
                'lon': lon,
                'start_date': start_date,
                'end_date': end_date,
                'product': 'INSAT3D'  # or IMD GPM
            }
            
            response = self.session.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ {location_name}: Rainfall data received")
                return data
            else:
                print(f"  ⚠️  {location_name}: Status {response.status_code}")
                return None
                
        except Exception as e:
            print(f"  ❌ {location_name}: Error - {str(e)}")
            return None
    
    def fetch_insat_data(self, lat, lon, date, location_name=""):
        """
        Fetch INSAT-3D/3DR satellite data
        
        INSAT provides:
        - Temperature
        - Humidity
        - Outgoing Longwave Radiation (OLR)
        - Cloud imagery
        
        Parameters:
        -----------
        lat : float
            Latitude
        lon : float
            Longitude
        date : str
            Date (YYYY-MM-DD)
        location_name : str
            Location name
            
        Returns:
        --------
        dict : INSAT data
        """
        print(f"  🛰️  Fetching INSAT data for {location_name}...")
        
        try:
            url = f"{self.base_url}/insat"
            
            params = {
                'lat': lat,
                'lon': lon,
                'date': date,
                'satellite': 'INSAT3D'
            }
            
            response = self.session.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ {location_name}: INSAT data received")
                return data
            else:
                print(f"  ⚠️  {location_name}: Status {response.status_code}")
                return None
                
        except Exception as e:
            print(f"  ❌ {location_name}: Error - {str(e)}")
            return None
    
    def simulate_mosdac_data(self, lat, lon, start_date, end_date, location_name=""):
        """
        Simulate MOSDAC data structure
        (Use this until you have actual MOSDAC API access)
        
        Parameters:
        -----------
        lat : float
            Latitude
        lon : float
            Longitude
        start_date : str
            Start date
        end_date : str
            End date
        location_name : str
            Location name
            
        Returns:
        --------
        list : Simulated data
        """
        print(f"  📝 Generating template MOSDAC data for {location_name}")
        
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        
        data_points = []
        current = start
        
        while current <= end:
            # Simulate realistic Indian monsoon patterns
            month = current.month
            
            # Monsoon months (June-September) have higher rainfall
            if month in [6, 7, 8, 9]:
                rainfall_base = 150
            elif month in [10, 11]:
                rainfall_base = 50
            else:
                rainfall_base = 20
            
            point = {
                'location': location_name,
                'latitude': lat,
                'longitude': lon,
                'date': current.strftime('%Y-%m-%d'),
                'rainfall_mm': max(0, rainfall_base + np.random.normal(0, 30)),
                'temperature_max': 28 + np.random.normal(0, 5),
                'temperature_min': 18 + np.random.normal(0, 3),
                'humidity': 65 + np.random.normal(0, 15),
                'cloud_cover': np.random.uniform(20, 80),
                'data_source': 'MOSDAC_TEMPLATE'
            }
            
            data_points.append(point)
            current += timedelta(days=1)
        
        return data_points
    
    def collect_for_districts(self, start_year=2020, end_year=2024):
        """
        Collect MOSDAC data for all configured districts
        
        Parameters:
        -----------
        start_year : int
            Start year
        end_year : int
            End year
            
        Returns:
        --------
        pd.DataFrame : Collected data
        """
        print(f"\n📍 Collecting MOSDAC data ({start_year}-{end_year})...")
        print("=" * 70)
        
        all_data = []
        
        for state, districts in CollectionConfig.LOCATIONS.items():
            print(f"\n🗺️  {state}")
            
            for district in districts:
                if district not in DISTRICT_COORDINATES:
                    continue
                
                coords = DISTRICT_COORDINATES[district]
                location_name = f"{district}, {state}"
                
                start_date = f"{start_year}-01-01"
                end_date = f"{end_year}-12-31"
                
                # Use simulated data until actual API is configured
                data_points = self.simulate_mosdac_data(
                    coords['lat'],
                    coords['lon'],
                    start_date,
                    end_date,
                    location_name
                )
                
                for point in data_points:
                    point['state'] = state
                    point['district'] = district
                    all_data.append(point)
                
                print(f"  ✅ {district}: {len(data_points)} data points")
                
                # Rate limiting
                time.sleep(0.1)
        
        if all_data:
            df = pd.DataFrame(all_data)
            print(f"\n✅ Collected {len(df)} MOSDAC records")
            return df
        else:
            return pd.DataFrame()
    
    def save_data(self, df, filename=None):
        """
        Save collected data
        
        Parameters:
        -----------
        df : pd.DataFrame
            Data to save
        filename : str
            Output filename
        """
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"mosdac_data_{timestamp}.csv"
        
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
    print("  MOSDAC DATA COLLECTION")
    print("=" * 70)
    
    collector = MOSDACCollector()
    
    print("\n📝 NOTE: Using simulated MOSDAC data structure")
    print("   To use real MOSDAC data:")
    print("   1. Register at https://www.mosdac.gov.in/")
    print("   2. Add credentials to .env file")
    print("   3. Update API endpoints in mosdac_collector.py")
    
    # Collect data
    df = collector.collect_for_districts(
        start_year=CollectionConfig.START_YEAR,
        end_year=CollectionConfig.END_YEAR
    )
    
    if not df.empty:
        collector.save_data(df, 'mosdac_data_collected.csv')
        
        # Show summary
        print("\n📊 Data Summary:")
        print(f"   States: {df['state'].nunique()}")
        print(f"   Districts: {df['district'].nunique()}")
        print(f"   Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"   Avg rainfall: {df['rainfall_mm'].mean():.1f} mm")
        print(f"   Avg temp: {df['temperature_max'].mean():.1f}°C")
    
    print("\n" + "=" * 70)
    print("✅ MOSDAC data collection complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
