# NDVI Monitoring Module - Integration Guide

## ✅ What Was Created (Non-Invasive)

### 1. Backend Services (New Files)
- `ml/ndvi_service.py` - Core NDVI calculation and health classification service
- `backend/ndvi_routes.py` - API endpoints for NDVI monitoring

### 2. Integration Required

Add ONE LINE to your existing `backend/app.py`:

```python
# At the top with other imports (around line 60-70):
from backend.ndvi_routes import register_ndvi_routes

# After app initialization (around line 150-200, after CORS setup):
register_ndvi_routes(app)
```

That's it! No other modifications to existing code needed.

---

## 📡 API Endpoints Added

### 1. Get Current NDVI
```http
GET /api/ndvi/current?state=Karnataka&district=Mandya
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-10-01T14:30:00",
    "location": {
      "state": "Karnataka",
      "district": "Mandya"
    },
    "data_source": "historical",
    "ndvi_data": {
      "source": "Historical Data",
      "region": "Mandya",
      "total_records": 3250,
      "ndvi_mean": 0.687,
      "ndvi_median": 0.695,
      "ndvi_std": 0.124,
      "ndvi_min": 0.245,
      "ndvi_max": 0.892,
      "average_health": {
        "category": "Good",
        "ndvi_value": 0.687,
        "description": "Healthy vegetation with good biomass",
        "color": "#22c55e",
        "icon": "✓",
        "recommendations": [
          "Maintain good agricultural practices",
          "Regular monitoring for any stress signs",
          "Continue balanced nutrient management"
        ],
        "action_required": false
      }
    }
  }
}
```

### 2. Get Historical NDVI Statistics
```http
GET /api/ndvi/historical?state=Karnataka&district=Belagavi
```

### 3. Calculate NDVI (GEE - if enabled)
```http
POST /api/ndvi/calculate
Content-Type: application/json

{
  "latitude": 15.8497,
  "longitude": 74.4977,
  "start_date": "2026-09-01",
  "end_date": "2026-10-01",
  "buffer_meters": 1000
}
```

**Response (with GEE):**
```json
{
  "success": true,
  "data": {
    "source": "Sentinel-2 (Google Earth Engine)",
    "ndvi": 0.724,
    "health": {
      "category": "Excellent",
      "description": "Dense, healthy vegetation with optimal growth",
      "color": "#10b981",
      "icon": "✅",
      "recommendations": [
        "Maintain current irrigation and fertilization schedule",
        "Monitor for pest/disease despite good health",
        "Continue optimal management practices"
      ],
      "action_required": false
    },
    "observation_date": "2026-09-28",
    "cloud_coverage_percent": 8.3,
    "location": {
      "latitude": 15.8497,
      "longitude": 74.4977,
      "buffer_meters": 1000
    },
    "images_available": 3,
    "resolution_meters": 10,
    "satellite": "Sentinel-2"
  }
}
```

### 4. Get Health Classification Thresholds
```http
GET /api/ndvi/health-thresholds
```

**Response:**
```json
{
  "success": true,
  "data": {
    "thresholds": [
      {
        "category": "Excellent",
        "ndvi_range": {"min": 0.7, "max": 1.0},
        "description": "Dense, healthy vegetation with optimal growth",
        "color": "#10b981",
        "icon": "✅",
        "action_required": false,
        "recommendations": [...]
      },
      {
        "category": "Good",
        "ndvi_range": {"min": 0.6, "max": 0.7},
        ...
      },
      ...
    ]
  }
}
```

### 5. Service Status
```http
GET /api/ndvi/status
```

---

## 🎨 Health Classification Categories

| Category | NDVI Range | Color | Description |
|----------|------------|-------|-------------|
| **Excellent** | 0.7 - 1.0 | 🟢 Green | Dense, healthy vegetation |
| **Good** | 0.6 - 0.7 | 🟢 Light Green | Healthy vegetation with good biomass |
| **Moderate** | 0.4 - 0.6 | 🟡 Yellow | Moderate vegetation, improvement possible |
| **Fair** | 0.3 - 0.4 | 🟠 Orange | Sparse vegetation, stress indicators |
| **Poor** | 0.2 - 0.3 | 🔴 Red | Very sparse vegetation, significant stress |
| **Critical** | 0.0 - 0.2 | 🔴 Dark Red | Bare soil or severely stressed crops |

---

## 🔧 Google Earth Engine Setup (Optional)

The module works **WITHOUT Google Earth Engine** using historical NDVI data.

To enable real-time Sentinel-2 data:

### 1. Install Google Earth Engine
```bash
pip install earthengine-api
```

### 2. Authenticate
```bash
earthengine authenticate
```

Follow the authentication flow in browser.

### 3. Update Service Initialization
In `backend/ndvi_routes.py`, change:
```python
ndvi_service = create_ndvi_service(use_gee=False)
```
to:
```python
ndvi_service = create_ndvi_service(use_gee=True)
```

### 4. Add GEE Project ID to .env
```env
GEE_PROJECT_ID=your_gee_project_id
```

---

## 📊 Data Sources

### Historical Data (Always Available)
- **Belagavi**: `cleaned_data/NDVI_belagavi_cleaned.csv`
- **Mandya**: `cleaned_data/NDVI_mandya_cleaned.csv`
- **Punjab**: `cleaned_data/NDVI_punjab_cleaned.csv`
- **Tamil Nadu**: `cleaned_data/NDVI_tamil_nadu_cleaned.csv`

### Real-time Data (GEE Required)
- **Satellite**: Sentinel-2 Surface Reflectance
- **Resolution**: 10 meters
- **Bands**: B8 (NIR), B4 (Red)
- **Cloud Filter**: < 20% cloud coverage
- **Update Frequency**: Every 5-10 days

---

## 🧪 Testing the Integration

### 1. Test Service Status
```bash
curl http://localhost:5000/api/ndvi/status
```

### 2. Test Historical NDVI (Karnataka)
```bash
curl "http://localhost:5000/api/ndvi/current?state=Karnataka&district=Mandya"
```

### 3. Test Historical NDVI (Punjab)
```bash
curl "http://localhost:5000/api/ndvi/current?state=Punjab&district=Punjab"
```

### 4. Test Health Thresholds
```bash
curl http://localhost:5000/api/ndvi/health-thresholds
```

---

## 🎯 Next Steps for Frontend Integration

1. **Update CropHealthPage.jsx** to call NDVI endpoints
2. **Add NDVI visualization** (gauge, chart, map)
3. **Display health recommendations**
4. **Show historical trends** (if available)

See `NDVI_FRONTEND_INTEGRATION.md` for frontend code examples.

---

## 📝 Notes

- ✅ **No modification** to existing ML models, predictions, or database
- ✅ **Standalone module** - can be disabled without affecting other features
- ✅ **Works offline** - Uses historical data when GEE not available
- ✅ **Professional classification** - Research-based health thresholds
- ✅ **Cloud handling** - Automatically filters cloudy images
- ✅ **Error handling** - Graceful fallback to historical data

---

## 🐛 Troubleshooting

### "No historical NDVI data available"
- Check if `cleaned_data/NDVI_*.csv` files exist
- Available regions: Belagavi, Mandya, Punjab, Tamil Nadu

### "Google Earth Engine not available"
- GEE is optional - service works with historical data
- To enable: Install `earthengine-api` and authenticate

### "NDVI calculation failed"
- Check cloud coverage (may be too high)
- Try different date range
- Fallback to historical data automatically

---

**Module Status**: ✅ Production Ready  
**Integration Required**: 1 line in app.py  
**Breaking Changes**: None  
**Dependencies Added**: `earthengine-api` (optional)
