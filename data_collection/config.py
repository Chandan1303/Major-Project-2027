"""
Data Collection Configuration
==============================

Store your API keys and configuration here.
"""

import os
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data_collection" / "collected_data"
RAW_DATA_DIR = PROJECT_ROOT / "data_collection" / "raw_data"
PROCESSED_DATA_DIR = PROJECT_ROOT / "data_collection" / "processed_data"

# Create directories if they don't exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

# API Keys - Replace with your actual keys
class APIKeys:
    """
    API Keys for various data sources
    """
    
    # OpenWeather API (you will provide)
    OPENWEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY_HERE"
    
    # MOSDAC API (Indian satellite data)
    # Register at: https://www.mosdac.gov.in/
    MOSDAC_USERNAME = "YOUR_MOSDAC_USERNAME"
    MOSDAC_PASSWORD = "YOUR_MOSDAC_PASSWORD"
    
    # Google Earth Engine (Sentinel-2)
    # Setup: https://earthengine.google.com/
    GEE_PROJECT_ID = "YOUR_GEE_PROJECT_ID"  # Optional, can be None for default
    
    # ISRO Bhuvan API
    # Register at: https://bhuvan-app1.nrsc.gov.in/api/
    BHUVAN_API_KEY = "YOUR_BHUVAN_API_KEY"  # If available
    
    @classmethod
    def load_from_env(cls):
        """Load API keys from environment variables or .env file"""
        cls.OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', cls.OPENWEATHER_API_KEY)
        cls.MOSDAC_USERNAME = os.getenv('MOSDAC_USERNAME', cls.MOSDAC_USERNAME)
        cls.MOSDAC_PASSWORD = os.getenv('MOSDAC_PASSWORD', cls.MOSDAC_PASSWORD)
        cls.GEE_PROJECT_ID = os.getenv('GEE_PROJECT_ID', cls.GEE_PROJECT_ID)
        cls.BHUVAN_API_KEY = os.getenv('BHUVAN_API_KEY', cls.BHUVAN_API_KEY)


# Load from environment if available
try:
    from dotenv import load_dotenv
    load_dotenv(PROJECT_ROOT / '.env')
    APIKeys.load_from_env()
except:
    pass


# Data Collection Settings
class CollectionConfig:
    """Configuration for data collection"""
    
    # Date ranges for historical data
    START_YEAR = 2018
    END_YEAR = 2024
    
    # Sugarcane growing season in India
    KHARIF_START = (10, 1)   # October 1
    KHARIF_END = (3, 31)     # March 31
    RABI_START = (2, 1)      # February 1
    RABI_END = (7, 31)       # July 31
    SUMMER_START = (1, 1)    # January 1
    SUMMER_END = (5, 31)     # May 31
    
    # Sugarcane varieties to analyze
    VARIETIES = [
        'Co 86032',
        'Co 0238',
        'CoC 671',
        'Co 99004',
        'CoM 0265',
        'Co 0118',
        'Co 94012',
        'CoSnk 14201'
    ]
    
    # Major sugarcane states and districts
    LOCATIONS = {
        'Uttar Pradesh': ['Muzaffarnagar', 'Meerut', 'Bijnor', 'Saharanpur', 'Bareilly'],
        'Maharashtra': ['Pune', 'Kolhapur', 'Sangli', 'Satara', 'Ahmednagar', 'Solapur'],
        'Karnataka': ['Mandya', 'Belagavi', 'Mysuru', 'Bagalkot', 'Shivamogga'],
        'Tamil Nadu': ['Coimbatore', 'Erode', 'Salem', 'Thanjavur', 'Tiruchirappalli'],
        'Punjab': ['Jalandhar', 'Gurdaspur', 'Amritsar', 'Ludhiana'],
        'Haryana': ['Yamuna Nagar', 'Karnal', 'Kurukshetra'],
        'Gujarat': ['Surat', 'Navsari', 'Bharuch', 'Valsad'],
        'Andhra Pradesh': ['East Godavari', 'West Godavari', 'Krishna', 'Visakhapatnam'],
        'Bihar': ['Champaran', 'Siwan', 'Gopalganj', 'Darbhanga'],
    }
    
    # Weather parameters to collect
    WEATHER_PARAMS = [
        'temperature_2m_max',
        'temperature_2m_min',
        'temperature_2m_mean',
        'precipitation_sum',
        'precipitation_hours',
        'windspeed_10m_max',
        'shortwave_radiation_sum',
        'et0_fao_evapotranspiration',
        'relativehumidity_2m_mean'
    ]
    
    # Soil parameters
    SOIL_PARAMS = [
        'soil_ph',
        'soil_moisture',
        'nitrogen',
        'phosphorus',
        'potassium',
        'organic_carbon',
        'soil_texture'
    ]
    
    # NDVI collection settings
    NDVI_COLLECTION_INTERVAL = 15  # days
    NDVI_CLOUD_THRESHOLD = 20  # percent
    
    # Rate limiting
    API_RATE_LIMIT_DELAY = 1  # seconds between API calls
    MAX_RETRIES = 3


# District coordinates (centroids for major sugarcane districts)
DISTRICT_COORDINATES = {
    # Karnataka
    'Mandya': {'lat': 12.5244, 'lon': 76.8958},
    'Belagavi': {'lat': 15.8497, 'lon': 74.4977},
    'Mysuru': {'lat': 12.2958, 'lon': 76.6394},
    'Bagalkot': {'lat': 16.1691, 'lon': 75.6948},
    'Shivamogga': {'lat': 13.9299, 'lon': 75.5681},
    
    # Maharashtra
    'Pune': {'lat': 18.5204, 'lon': 73.8567},
    'Kolhapur': {'lat': 16.7050, 'lon': 74.2433},
    'Sangli': {'lat': 16.8524, 'lon': 74.5653},
    'Satara': {'lat': 17.6805, 'lon': 74.0183},
    'Ahmednagar': {'lat': 19.0948, 'lon': 74.7480},
    'Solapur': {'lat': 17.6599, 'lon': 75.9064},
    
    # Uttar Pradesh
    'Muzaffarnagar': {'lat': 29.4727, 'lon': 77.7085},
    'Meerut': {'lat': 28.9845, 'lon': 77.7064},
    'Bijnor': {'lat': 29.3732, 'lon': 78.1369},
    'Saharanpur': {'lat': 29.9680, 'lon': 77.5460},
    'Bareilly': {'lat': 28.3670, 'lon': 79.4304},
    
    # Tamil Nadu
    'Coimbatore': {'lat': 11.0168, 'lon': 76.9558},
    'Erode': {'lat': 11.3410, 'lon': 77.7172},
    'Salem': {'lat': 11.6643, 'lon': 78.1460},
    'Thanjavur': {'lat': 10.7870, 'lon': 79.1378},
    'Tiruchirappalli': {'lat': 10.7905, 'lon': 78.7047},
    
    # Punjab
    'Jalandhar': {'lat': 31.3260, 'lon': 75.5762},
    'Gurdaspur': {'lat': 32.0411, 'lon': 75.4056},
    'Amritsar': {'lat': 31.6340, 'lon': 74.8723},
    'Ludhiana': {'lat': 30.9010, 'lon': 75.8573},
    
    # Haryana
    'Yamuna Nagar': {'lat': 30.1290, 'lon': 77.2674},
    'Karnal': {'lat': 29.6857, 'lon': 76.9905},
    'Kurukshetra': {'lat': 29.9729, 'lon': 76.8783},
    
    # Gujarat
    'Surat': {'lat': 21.1702, 'lon': 72.8311},
    'Navsari': {'lat': 20.9500, 'lon': 72.9333},
    'Bharuch': {'lat': 21.7051, 'lon': 72.9959},
    'Valsad': {'lat': 20.5992, 'lon': 72.9342},
    
    # Andhra Pradesh
    'East Godavari': {'lat': 17.2840, 'lon': 81.9849},
    'West Godavari': {'lat': 16.7148, 'lon': 81.1027},
    'Krishna': {'lat': 16.5193, 'lon': 80.6305},
    'Visakhapatnam': {'lat': 17.6868, 'lon': 83.2185},
    
    # Bihar
    'Champaran': {'lat': 27.0534, 'lon': 84.6325},
    'Siwan': {'lat': 26.2190, 'lon': 84.3560},
    'Gopalganj': {'lat': 26.4697, 'lon': 84.4387},
    'Darbhanga': {'lat': 26.1542, 'lon': 85.8918},
}


# Output file names
OUTPUT_FILES = {
    'weather': 'weather_data_collected.csv',
    'ndvi': 'ndvi_data_collected.csv',
    'soil': 'soil_data_collected.csv',
    'final_dataset': 'FINAL_SUGARCANE_DATASET.csv',
    'metadata': 'data_collection_metadata.json'
}
