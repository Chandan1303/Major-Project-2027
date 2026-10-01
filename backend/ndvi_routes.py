"""
NDVI Monitoring API Routes
===========================
Separate route file for NDVI monitoring - does not modify existing routes.

Endpoints:
- GET  /api/ndvi/current - Get current NDVI for location
- GET  /api/ndvi/historical - Get historical NDVI statistics
- POST /api/ndvi/calculate - Calculate NDVI for specific coordinates/dates
- GET  /api/ndvi/health-thresholds - Get health classification thresholds

Author: Chandan (Lead), Dayanand, Harsha, Mohammad
Date: 2026-10-01
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add parent directory to path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ml.ndvi_service import create_ndvi_service

# Create blueprint
ndvi_bp = Blueprint('ndvi', __name__, url_prefix='/api/ndvi')

# Initialize NDVI service (will use historical data by default)
# Set use_gee=True if Google Earth Engine is authenticated
ndvi_service = create_ndvi_service(use_gee=False)


@ndvi_bp.route('/current', methods=['GET'])
def get_current_ndvi():
    """
    Get current NDVI for a location
    
    Query Parameters:
    - state: State name (required)
    - district: District name (required)
    - latitude: Latitude (optional, for GEE)
    - longitude: Longitude (optional, for GEE)
    - days_back: Days to look back (default: 30)
    
    Returns:
    - NDVI value with health classification
    """
    try:
        # Get parameters
        state = request.args.get('state')
        district = request.args.get('district')
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)
        days_back = request.args.get('days_back', default=30, type=int)
        
        # Validate required parameters
        if not state or not district:
            return jsonify({
                "success": False,
                "error": "State and district are required"
            }), 400
        
        # Get NDVI data
        result = ndvi_service.get_ndvi_for_location(
            latitude=latitude,
            longitude=longitude,
            state=state,
            district=district,
            days_back=days_back
        )
        
        if result.get("error"):
            return jsonify({
                "success": False,
                "error": result["error"],
                "fallback_reason": result.get("fallback_reason"),
                "location": result.get("location")
            }), 404
        
        return jsonify({
            "success": True,
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to retrieve NDVI: {str(e)}"
        }), 500


@ndvi_bp.route('/historical', methods=['GET'])
def get_historical_ndvi():
    """
    Get historical NDVI statistics for a region
    
    Query Parameters:
    - state: State name (required)
    - district: District name (required)
    - variety: Sugarcane variety (optional)
    
    Returns:
    - Historical NDVI statistics with health classification
    """
    try:
        state = request.args.get('state')
        district = request.args.get('district')
        variety = request.args.get('variety')
        
        if not state or not district:
            return jsonify({
                "success": False,
                "error": "State and district are required"
            }), 400
        
        result = ndvi_service.get_historical_ndvi(state, district, variety)
        
        if result.get("error"):
            return jsonify({
                "success": False,
                "error": result["error"],
                "available_regions": result.get("available_regions", [])
            }), 404
        
        return jsonify({
            "success": True,
            "data": result["data"]
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to retrieve historical NDVI: {str(e)}"
        }), 500


@ndvi_bp.route('/calculate', methods=['POST'])
def calculate_ndvi():
    """
    Calculate NDVI for specific coordinates and date range (GEE required)
    
    Request Body (JSON):
    {
        "latitude": 15.8497,
        "longitude": 74.4977,
        "start_date": "2026-09-01",
        "end_date": "2026-10-01",
        "buffer_meters": 1000
    }
    
    Returns:
    - NDVI calculation result with health classification
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['latitude', 'longitude', 'start_date', 'end_date']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing)}"
            }), 400
        
        # Check if GEE is available
        if not ndvi_service.use_gee:
            return jsonify({
                "success": False,
                "error": "Google Earth Engine not available. Using historical data only.",
                "gee_available": False,
                "suggestion": "Use /api/ndvi/historical endpoint instead"
            }), 503
        
        # Calculate NDVI
        result = ndvi_service.calculate_ndvi_gee(
            latitude=data['latitude'],
            longitude=data['longitude'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            buffer_meters=data.get('buffer_meters', 1000)
        )
        
        if result.get("error"):
            return jsonify({
                "success": False,
                "error": result["error"],
                "fallback": result.get("fallback"),
                "reason": result.get("reason")
            }), 404
        
        return jsonify({
            "success": True,
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"NDVI calculation failed: {str(e)}"
        }), 500


@ndvi_bp.route('/health-thresholds', methods=['GET'])
def get_health_thresholds():
    """
    Get NDVI health classification thresholds
    
    Returns:
    - Health categories with NDVI ranges, descriptions, colors
    """
    try:
        thresholds = []
        for category, (min_val, max_val) in ndvi_service.health_thresholds.items():
            health = ndvi_service.classify_crop_health((min_val + max_val) / 2)
            thresholds.append({
                "category": category,
                "ndvi_range": {"min": min_val, "max": max_val},
                "description": health.get("description"),
                "color": health.get("color"),
                "icon": health.get("icon"),
                "action_required": health.get("action_required", False),
                "priority": health.get("priority"),
                "recommendations": health.get("recommendations", [])
            })
        
        return jsonify({
            "success": True,
            "data": {
                "thresholds": thresholds,
                "note": "NDVI ranges based on agricultural research standards",
                "source": "Research-validated thresholds for sugarcane"
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to retrieve thresholds: {str(e)}"
        }), 500


@ndvi_bp.route('/status', methods=['GET'])
def get_service_status():
    """
    Get NDVI service status and capabilities
    
    Returns:
    - Service configuration and availability
    """
    try:
        status = {
            "service": "NDVI Monitoring Module",
            "version": "1.0",
            "capabilities": {
                "google_earth_engine": ndvi_service.use_gee,
                "historical_data": True,
                "sentinel2_access": ndvi_service.use_gee,
                "real_time_calculation": ndvi_service.use_gee
            },
            "data_sources": {
                "realtime": "Sentinel-2 via Google Earth Engine" if ndvi_service.use_gee else "Not available",
                "historical": "Cleaned NDVI CSV files (Belagavi, Mandya, Punjab, Tamil Nadu)"
            },
            "available_regions": ["Belagavi", "Mandya", "Punjab", "Tamil Nadu"],
            "satellite": {
                "name": "Sentinel-2",
                "resolution_meters": 10,
                "bands_used": "B8 (NIR), B4 (Red)",
                "cloud_threshold": "20%"
            }
        }
        
        return jsonify({
            "success": True,
            "data": status
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to retrieve status: {str(e)}"
        }), 500


# Helper function to register blueprint with Flask app
def register_ndvi_routes(app):
    """
    Register NDVI routes with Flask app
    Call this from app.py: register_ndvi_routes(app)
    """
    app.register_blueprint(ndvi_bp)
    print("✅ NDVI Monitoring routes registered")
