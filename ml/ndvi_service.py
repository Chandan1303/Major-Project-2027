"""
NDVI Monitoring Service - Separate Module
==========================================
Provides real-time NDVI calculation and crop health monitoring
using Sentinel-2 satellite data via Google Earth Engine.

Features:
- Calculate NDVI for selected location/farm
- Classify crop health based on NDVI values
- Handle cloud coverage and data availability
- Historical NDVI trends
- Integration with existing system (non-invasive)

Author: Chandan (Lead), Dayanand, Harsha, Mohammad
Date: 2026-10-01
"""

import os
import json
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple

# Google Earth Engine (optional - will fallback to historical data)
try:
    import ee
    GEE_AVAILABLE = True
except ImportError:
    GEE_AVAILABLE = False
    print("⚠️  Google Earth Engine not installed. Using historical NDVI data only.")


class NDVIService:
    """
    Professional NDVI Monitoring Service
    Integrates with existing system without modifying core modules
    """
    
    def __init__(self, use_gee=True):
        """
        Initialize NDVI Service
        
        Parameters:
        -----------
        use_gee : bool
            Whether to use Google Earth Engine (requires authentication)
        """
        self.use_gee = use_gee and GEE_AVAILABLE
        self.base_dir = Path(__file__).resolve().parent.parent
        self.historical_data_dir = self.base_dir / "cleaned_data"
        
        # NDVI Health Classification Thresholds (Research-based)
        self.health_thresholds = {
            "Excellent": (0.7, 1.0),    # Dense, healthy vegetation
            "Good": (0.6, 0.7),         # Healthy vegetation
            "Moderate": (0.4, 0.6),     # Moderate vegetation
            "Fair": (0.3, 0.4),         # Sparse vegetation
            "Poor": (0.2, 0.3),         # Very sparse vegetation
            "Critical": (0.0, 0.2)      # Bare soil / stressed crops
        }
        
        # Initialize GEE if available
        if self.use_gee:
            self._initialize_gee()
        else:
            print("📊 NDVI Service initialized with historical data only")
    
    def _initialize_gee(self):
        """Initialize Google Earth Engine"""
        try:
            ee.Initialize()
            print("✅ Google Earth Engine initialized successfully")
        except Exception as e:
            print(f"⚠️  GEE initialization failed: {e}")
            print("   Falling back to historical NDVI data")
            self.use_gee = False
    
    def calculate_ndvi_gee(
        self, 
        latitude: float, 
        longitude: float, 
        start_date: str,
        end_date: str,
        buffer_meters: int = 1000
    ) -> Dict:
        """
        Calculate NDVI using Google Earth Engine Sentinel-2 data
        
        Parameters:
        -----------
        latitude : float
            Latitude of location
        longitude : float
            Longitude of location
        start_date : str
            Start date (YYYY-MM-DD)
        end_date : str
            End date (YYYY-MM-DD)
        buffer_meters : int
            Buffer around point in meters (default: 1000m = 1km)
        
        Returns:
        --------
        dict : NDVI data including value, date, cloud coverage, health classification
        """
        if not self.use_gee:
            return {"error": "Google Earth Engine not available", "fallback": True}
        
        try:
            # Create point geometry
            point = ee.Geometry.Point([longitude, latitude])
            area = point.buffer(buffer_meters)
            
            # Load Sentinel-2 Surface Reflectance collection
            collection = (ee.ImageCollection('COPERNICUS/S2_SR')
                         .filterDate(start_date, end_date)
                         .filterBounds(area)
                         .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)))  # <20% cloud
            
            # Check if images available
            count = collection.size().getInfo()
            if count == 0:
                return {
                    "error": "No cloud-free Sentinel-2 images available for this period",
                    "fallback": True,
                    "reason": "clouds",
                    "location": {"latitude": latitude, "longitude": longitude},
                    "period": {"start": start_date, "end": end_date}
                }
            
            # Calculate NDVI for each image
            def add_ndvi(image):
                # Sentinel-2: Band 8 (NIR), Band 4 (Red)
                nir = image.select('B8')
                red = image.select('B4')
                ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI')
                return image.addBands(ndvi)
            
            collection_ndvi = collection.map(add_ndvi)
            
            # Get most recent image
            latest = collection_ndvi.sort('system:time_start', False).first()
            
            # Extract NDVI value for the area (mean)
            ndvi_mean = latest.select('NDVI').reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=area,
                scale=10,  # Sentinel-2 resolution: 10m
                maxPixels=1e9
            ).getInfo()
            
            # Get image metadata
            image_date = datetime.fromtimestamp(
                latest.get('system:time_start').getInfo() / 1000
            )
            cloud_coverage = latest.get('CLOUDY_PIXEL_PERCENTAGE').getInfo()
            
            ndvi_value = ndvi_mean.get('NDVI')
            
            if ndvi_value is None:
                return {
                    "error": "NDVI calculation failed - no valid pixels",
                    "fallback": True,
                    "reason": "no_data"
                }
            
            # Classify health
            health_category = self.classify_crop_health(ndvi_value)
            
            return {
                "success": True,
                "source": "Sentinel-2 (Google Earth Engine)",
                "ndvi": round(ndvi_value, 3),
                "health": health_category,
                "observation_date": image_date.strftime('%Y-%m-%d'),
                "cloud_coverage_percent": round(cloud_coverage, 1),
                "location": {
                    "latitude": latitude,
                    "longitude": longitude,
                    "buffer_meters": buffer_meters
                },
                "period_requested": {
                    "start": start_date,
                    "end": end_date
                },
                "images_available": count,
                "resolution_meters": 10,
                "satellite": "Sentinel-2"
            }
            
        except Exception as e:
            return {
                "error": f"GEE calculation failed: {str(e)}",
                "fallback": True,
                "reason": "exception"
            }
    
    def classify_crop_health(self, ndvi: float) -> Dict:
        """
        Classify crop health based on NDVI value
        
        Parameters:
        -----------
        ndvi : float
            NDVI value (0.0 to 1.0)
        
        Returns:
        --------
        dict : Health classification with category, description, color, recommendations
        """
        # Determine category
        category = "Unknown"
        for cat, (min_val, max_val) in self.health_thresholds.items():
            if min_val <= ndvi < max_val:
                category = cat
                break
        
        # Detailed descriptions and recommendations
        health_info = {
            "Excellent": {
                "description": "Dense, healthy vegetation with optimal growth",
                "color": "#10b981",  # Green
                "icon": "✅",
                "recommendations": [
                    "Maintain current irrigation and fertilization schedule",
                    "Monitor for pest/disease despite good health",
                    "Continue optimal management practices"
                ],
                "action_required": False
            },
            "Good": {
                "description": "Healthy vegetation with good biomass",
                "color": "#22c55e",  # Light green
                "icon": "✓",
                "recommendations": [
                    "Maintain good agricultural practices",
                    "Regular monitoring for any stress signs",
                    "Continue balanced nutrient management"
                ],
                "action_required": False
            },
            "Moderate": {
                "description": "Moderate vegetation health, some improvement possible",
                "color": "#eab308",  # Yellow
                "icon": "⚠",
                "recommendations": [
                    "Check irrigation adequacy",
                    "Consider soil nutrient testing",
                    "Monitor for water stress or nutrient deficiency",
                    "Increase monitoring frequency"
                ],
                "action_required": True,
                "priority": "Medium"
            },
            "Fair": {
                "description": "Sparse vegetation, stress indicators present",
                "color": "#f97316",  # Orange
                "icon": "⚠️",
                "recommendations": [
                    "Immediate irrigation assessment required",
                    "Check for pest/disease infestation",
                    "Soil analysis recommended",
                    "Consider fertilizer application"
                ],
                "action_required": True,
                "priority": "High"
            },
            "Poor": {
                "description": "Very sparse vegetation, significant stress",
                "color": "#ef4444",  # Red
                "icon": "❌",
                "recommendations": [
                    "URGENT: Field inspection required",
                    "Check irrigation system immediately",
                    "Assess for disease/pest damage",
                    "Consult agricultural expert",
                    "Consider corrective fertilization"
                ],
                "action_required": True,
                "priority": "Critical"
            },
            "Critical": {
                "description": "Bare soil or severely stressed crops",
                "color": "#dc2626",  # Dark red
                "icon": "🚨",
                "recommendations": [
                    "CRITICAL: Immediate action required",
                    "Emergency field inspection",
                    "Assess crop viability",
                    "Check for complete irrigation failure",
                    "Expert consultation mandatory",
                    "Document for insurance/government support"
                ],
                "action_required": True,
                "priority": "Emergency"
            }
        }
        
        result = health_info.get(category, {
            "description": "Unknown health status",
            "color": "#6b7280",
            "icon": "?",
            "recommendations": ["NDVI value out of expected range"],
            "action_required": False
        })
        
        result["category"] = category
        result["ndvi_value"] = round(ndvi, 3)
        result["ndvi_range"] = self.health_thresholds.get(category, (0, 1))
        
        return result
    
    def get_historical_ndvi(
        self, 
        state: str, 
        district: str,
        variety: Optional[str] = None
    ) -> Dict:
        """
        Get historical NDVI data from cleaned CSV files
        
        Parameters:
        -----------
        state : str
            State name
        district : str
            District name
        variety : str, optional
            Sugarcane variety
        
        Returns:
        --------
        dict : Historical NDVI statistics
        """
        # Map districts to NDVI regions (all 46+ districts)
        district_to_region_file = {
            # Karnataka
            "Belagavi": "NDVI_belagavi_cleaned.csv",
            "Mandya": "NDVI_mandya_cleaned.csv",
            "Mysuru": "NDVI_mysuru_cleaned.csv",
            "Bagalkot": "NDVI_bagalkot_cleaned.csv",
            "Shivamogga": "NDVI_shivamogga_cleaned.csv",
            
            # Uttar Pradesh
            "Muzaffarnagar": "NDVI_muzaffarnagar_cleaned.csv",
            "Meerut": "NDVI_meerut_cleaned.csv",
            "Bijnor": "NDVI_bijnor_cleaned.csv",
            "Saharanpur": "NDVI_saharanpur_cleaned.csv",
            "Bareilly": "NDVI_bareilly_cleaned.csv",
            "Lakhimpur Kheri": "NDVI_lakhimpur_kheri_cleaned.csv",
            "Deoria": "NDVI_deoria_cleaned.csv",
            
            # Maharashtra
            "Kolhapur": "NDVI_kolhapur_cleaned.csv",
            "Sangli": "NDVI_sangli_cleaned.csv",
            "Satara": "NDVI_satara_cleaned.csv",
            "Ahmednagar": "NDVI_ahmednagar_cleaned.csv",
            "Pune": "NDVI_pune_cleaned.csv",
            "Solapur": "NDVI_solapur_cleaned.csv",
            
            # Tamil Nadu
            "Coimbatore": "NDVI_coimbatore_cleaned.csv",
            "Erode": "NDVI_erode_cleaned.csv",
            "Salem": "NDVI_salem_cleaned.csv",
            "Thanjavur": "NDVI_thanjavur_cleaned.csv",
            "Tiruchirappalli": "NDVI_tiruchirappalli_cleaned.csv",
            "Cuddalore": "NDVI_cuddalore_cleaned.csv",
            "Tamil Nadu": "NDVI_tamil_nadu_cleaned.csv",  # State-level fallback
            
            # Andhra Pradesh
            "East Godavari": "NDVI_east_godavari_cleaned.csv",
            "West Godavari": "NDVI_west_godavari_cleaned.csv",
            "Krishna": "NDVI_krishna_cleaned.csv",
            "Visakhapatnam": "NDVI_visakhapatnam_cleaned.csv",
            
            # Gujarat
            "Surat": "NDVI_surat_cleaned.csv",
            "Navsari": "NDVI_navsari_cleaned.csv",
            "Bharuch": "NDVI_bharuch_cleaned.csv",
            "Valsad": "NDVI_valsad_cleaned.csv",
            
            # Haryana
            "Yamuna Nagar": "NDVI_yamuna_nagar_cleaned.csv",
            "Karnal": "NDVI_karnal_cleaned.csv",
            "Kurukshetra": "NDVI_kurukshetra_cleaned.csv",
            
            # Punjab
            "Jalandhar": "NDVI_jalandhar_cleaned.csv",
            "Gurdaspur": "NDVI_gurdaspur_cleaned.csv",
            "Amritsar": "NDVI_amritsar_cleaned.csv",
            "Punjab": "NDVI_punjab_cleaned.csv",  # State-level fallback
            
            # Bihar
            "Champaran": "NDVI_champaran_cleaned.csv",
            "Siwan": "NDVI_siwan_cleaned.csv",
            "Gopalganj": "NDVI_gopalganj_cleaned.csv",
            
            # Telangana
            "Nizamabad": "NDVI_nizamabad_cleaned.csv",
            "Medak": "NDVI_medak_cleaned.csv",
            "Karimnagar": "NDVI_karimnagar_cleaned.csv",
            
            # Uttarakhand
            "Haridwar": "NDVI_haridwar_cleaned.csv",
            "Dehradun": "NDVI_dehradun_cleaned.csv",
        }
        
        # Try to find matching file
        ndvi_file = None
        for region, filename in district_to_region_file.items():
            if district.lower() in region.lower() or region.lower() in district.lower():
                ndvi_file = self.historical_data_dir / filename
                break
        
        if ndvi_file and ndvi_file.exists():
            try:
                df = pd.read_csv(ndvi_file)
                
                # Calculate statistics
                stats = {
                    "source": "Historical Data",
                    "region": district,
                    "total_records": len(df),
                    "ndvi_mean": float(df['ndvi'].mean()),
                    "ndvi_median": float(df['ndvi'].median()),
                    "ndvi_std": float(df['ndvi'].std()),
                    "ndvi_min": float(df['ndvi'].min()),
                    "ndvi_max": float(df['ndvi'].max()),
                    "ndvi_p25": float(df['ndvi'].quantile(0.25)),
                    "ndvi_p75": float(df['ndvi'].quantile(0.75))
                }
                
                # Classify average health
                stats["average_health"] = self.classify_crop_health(stats["ndvi_mean"])
                
                return {"success": True, "data": stats}
                
            except Exception as e:
                return {"error": f"Failed to load historical data: {str(e)}"}
        
        return {
            "error": "No historical NDVI data available for this location",
            "available_regions": list(district_to_region_file.keys())
        }
    
    def get_ndvi_for_location(
        self,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        days_back: int = 30
    ) -> Dict:
        """
        Main method: Get NDVI for a location (GEE or historical fallback)
        
        Parameters:
        -----------
        latitude, longitude : float, optional
            GPS coordinates (for GEE)
        state, district : str, optional
            Location names (for historical data)
        days_back : int
            Number of days to look back for satellite images
        
        Returns:
        --------
        dict : NDVI data with health classification
        """
        result = {
            "timestamp": datetime.now().isoformat(),
            "location": {
                "state": state,
                "district": district,
                "latitude": latitude,
                "longitude": longitude
            }
        }
        
        # Try GEE first if coordinates provided
        if self.use_gee and latitude and longitude:
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
            
            gee_result = self.calculate_ndvi_gee(latitude, longitude, start_date, end_date)
            
            if gee_result.get("success"):
                result["ndvi_data"] = gee_result
                result["data_source"] = "realtime"
                return result
            else:
                result["gee_error"] = gee_result.get("error")
                result["fallback_reason"] = gee_result.get("reason")
        
        # Fallback to historical data
        if state and district:
            historical = self.get_historical_ndvi(state, district)
            if historical.get("success"):
                result["ndvi_data"] = historical["data"]
                result["data_source"] = "historical"
                result["note"] = "Using historical NDVI data for this region"
                return result
            else:
                result["error"] = historical.get("error")
        
        result["error"] = "Unable to retrieve NDVI data (no GEE access and no historical data)"
        return result


# Helper function for Flask integration
def create_ndvi_service(use_gee=False):
    """
    Factory function to create NDVI service
    Set use_gee=True only if GEE is properly authenticated
    """
    return NDVIService(use_gee=use_gee)
