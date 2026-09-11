"""
Google Earth Engine NDVI Collector
===================================

Collects Sentinel-2 satellite imagery and calculates NDVI
for sugarcane monitoring.

Setup Required:
1. Install: pip install earthengine-api
2. Authenticate: earthengine authenticate
3. Initialize in your project
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
from pathlib import Path

from config import APIKeys, CollectionConfig, DISTRICT_COORDINATES, DATA_DIR


# Try to import Earth Engine
try:
    import ee
    GEE_AVAILABLE = True
except ImportError:
    GEE_AVAILABLE = False
    print("⚠️  Google Earth Engine not installed.")
    print("   Install with: pip install earthengine-api")


class GEENDVICollector:
    """
    Collect NDVI data from Sentinel-2 using Google Earth Engine
    """
    
    def __init__(self, project_id=None):
        """
        Initialize GEE NDVI collector
        
        Parameters:
        -----------
        project_id : str
            Google Earth Engine project ID (optional)
        """
        self.project_id = project_id or APIKeys.GEE_PROJECT_ID
        self.initialized = False
        
        if GEE_AVAILABLE:
            try:
                if self.project_id and self.project_id != "YOUR_GEE_PROJECT_ID":
                    ee.Initialize(project=self.project_id)
                else:
                    ee.Initialize()
                
                self.initialized = True
                print("✅ Google Earth Engine initialized")
            except Exception as e:
                print(f"❌ GEE initialization failed: {str(e)}")
                print("   Run: earthengine authenticate")
        else:
            print("📝 GEE not available - will use simulation mode")
    
    def calculate_ndvi(self, image):
        """
        Calculate NDVI from Sentinel-2 image
        
        NDVI = (NIR - RED) / (NIR + RED)
        
        Parameters:
        -----------
        image : ee.Image
            Sentinel-2 image
            
        Returns:
        --------
        ee.Image : NDVI image
        """
        if not self.initialized:
            return None
        
        nir = image.select('B8')  # NIR band
        red = image.select('B4')  # Red band
        
        ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI')
        
        return image.addBands(ndvi)
    
    def fetch_sentinel2_ndvi(self, lat, lon, start_date, end_date, buffer_m=5000):
        """
        Fetch Sentinel-2 NDVI time series for a location
        
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
        buffer_m : int
            Buffer around point in meters
            
        Returns:
        --------
        list : NDVI values with dates
        """
        if not self.initialized:
            return None
        
        try:
            # Create point geometry
            point = ee.Geometry.Point([lon, lat])
            region = point.buffer(buffer_m)
            
            # Load Sentinel-2 collection
            collection = ee.ImageCollection('COPERNICUS/S2_SR') \
                .filterBounds(point) \
                .filterDate(start_date, end_date) \
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CollectionConfig.NDVI_CLOUD_THRESHOLD))
            
            # Calculate NDVI for each image
            collection_ndvi = collection.map(self.calculate_ndvi)
            
            # Extract NDVI time series
            def extract_ndvi(image):
                ndvi = image.select('NDVI').reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=10  # 10m resolution
                ).get('NDVI')
                
                return ee.Feature(None, {
                    'date': image.date().format('YYYY-MM-dd'),
                    'ndvi': ndvi
                })
            
            ndvi_series = collection_ndvi.map(extract_ndvi).getInfo()
            
            # Convert to list
            ndvi_data = []
            for feature in ndvi_series['features']:
                props = feature['properties']
                if props['ndvi'] is not None:
                    ndvi_data.append({
                        'date': props['date'],
                        'ndvi': props['ndvi']
                    })
            
            return ndvi_data
            
        except Exception as e:
            print(f"  ❌ GEE fetch error: {str(e)}")
            return None
    
    def simulate_ndvi_data(self, start_date, end_date, location_name=""):
        """
        Simulate realistic NDVI time series for sugarcane
        
        Sugarcane NDVI pattern (12-month crop):
        - Month 1-2: 0.2-0.35 (establishment)
        - Month 3-4: 0.4-0.6 (vegetative)
        - Month 5-8: 0.65-0.85 (peak growth)
        - Month 9-11: 0.5-0.7 (maturation)
        - Month 12: 0.4-0.6 (pre-harvest)
        
        Parameters:
        -----------
        start_date : str
            Start date (YYYY-MM-DD)
        end_date : str
            End date (YYYY-MM-DD)
        location_name : str
            Location name
            
        Returns:
        --------
        list : Simulated NDVI data
        """
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        
        ndvi_data = []
        current = start
        
        # Base NDVI varies by location/season
        base_ndvi = 0.65 + np.random.uniform(-0.05, 0.05)
        
        while current <= end:
            # Days since planting (assume Oct 1 planting for Kharif)
            planting_date = datetime(current.year, 10, 1)
            if current < planting_date:
                planting_date = datetime(current.year - 1, 10, 1)
            
            days_since_planting = (current - planting_date).days
            months = days_since_planting / 30
            
            # NDVI growth curve
            if months < 2:
                ndvi_base = 0.28
            elif months < 4:
                ndvi_base = 0.50
            elif months < 8:
                ndvi_base = 0.75
            elif months < 11:
                ndvi_base = 0.60
            else:
                ndvi_base = 0.50
            
            # Add variation
            ndvi = ndvi_base + np.random.normal(0, 0.05)
            ndvi = max(0.1, min(0.95, ndvi))  # Clip to valid range
            
            ndvi_data.append({
                'date': current.strftime('%Y-%m-%d'),
                'ndvi': round(ndvi, 4)
            })
            
            # Sample every 15 days (Sentinel-2 revisit time)
            current += timedelta(days=CollectionConfig.NDVI_COLLECTION_INTERVAL)
        
        return ndvi_data
    
    def collect_for_districts(self, start_year=2020, end_year=2024, use_gee=True):
        """
        Collect NDVI data for all districts
        
        Parameters:
        -----------
        start_year : int
            Start year
        end_year : int
            End year
        use_gee : bool
            Use actual GEE or simulation
            
        Returns:
        --------
        pd.DataFrame : NDVI data
        """
        print(f"\n🛰️  Collecting NDVI data ({start_year}-{end_year})...")
        print("=" * 70)
        
        if use_gee and not self.initialized:
            print("⚠️  GEE not available, using simulation mode")
            use_gee = False
        
        all_data = []
        
        for state, districts in CollectionConfig.LOCATIONS.items():
            print(f"\n🗺️  {state}")
            
            for district in districts:
                if district not in DISTRICT_COORDINATES:
                    continue
                
                coords = DISTRICT_COORDINATES[district]
                location_name = f"{district}, {state}"
                
                print(f"  📡 {district}...", end=" ")
                
                for year in range(start_year, end_year + 1):
                    start_date = f"{year}-01-01"
                    end_date = f"{year}-12-31"
                    
                    if use_gee:
                        ndvi_series = self.fetch_sentinel2_ndvi(
                            coords['lat'],
                            coords['lon'],
                            start_date,
                            end_date
                        )
                    else:
                        ndvi_series = self.simulate_ndvi_data(
                            start_date,
                            end_date,
                            location_name
                        )
                    
                    if ndvi_series:
                        for point in ndvi_series:
                            point['state'] = state
                            point['district'] = district
                            point['latitude'] = coords['lat']
                            point['longitude'] = coords['lon']
                            point['year'] = year
                            all_data.append(point)
                    
                    # Rate limiting for GEE
                    if use_gee:
                        time.sleep(1)
                
                print(f"✅ ({len([d for d in all_data if d['district'] == district])} points)")
        
        if all_data:
            df = pd.DataFrame(all_data)
            print(f"\n✅ Collected {len(df)} NDVI records")
            return df
        else:
            return pd.DataFrame()
    
    def save_data(self, df, filename=None):
        """
        Save NDVI data
        
        Parameters:
        -----------
        df : pd.DataFrame
            NDVI data
        filename : str
            Output filename
        """
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"ndvi_sentinel2_{timestamp}.csv"
        
        output_path = DATA_DIR / filename
        df.to_csv(output_path, index=False)
        
        print(f"\n💾 Saved: {output_path}")
        print(f"   Records: {len(df)}")
        print(f"   Size: {output_path.stat().st_size / 1024:.2f} KB")
        
        # Summary statistics
        if not df.empty:
            print(f"\n📊 NDVI Summary:")
            print(f"   Mean: {df['ndvi'].mean():.3f}")
            print(f"   Min: {df['ndvi'].min():.3f}")
            print(f"   Max: {df['ndvi'].max():.3f}")
            print(f"   Std: {df['ndvi'].std():.3f}")


def main():
    """
    Main execution
    """
    print("=" * 70)
    print("  GOOGLE EARTH ENGINE - SENTINEL-2 NDVI COLLECTION")
    print("=" * 70)
    
    collector = GEENDVICollector()
    
    if not collector.initialized:
        print("\n📝 Using simulation mode (GEE not configured)")
        print("\n   To use real Sentinel-2 data:")
        print("   1. Install: pip install earthengine-api")
        print("   2. Authenticate: earthengine authenticate")
        print("   3. Run this script again")
    
    # Collect NDVI data
    df = collector.collect_for_districts(
        start_year=CollectionConfig.START_YEAR,
        end_year=CollectionConfig.END_YEAR,
        use_gee=collector.initialized
    )
    
    if not df.empty:
        collector.save_data(df, 'ndvi_sentinel2_collected.csv')
    
    print("\n" + "=" * 70)
    print("✅ NDVI data collection complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
