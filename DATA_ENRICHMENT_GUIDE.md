# 🌾 Sugarcane Yield Prediction - Data Enrichment Guide

## Overview

This guide explains how to transform your basic sugarcane dataset into a comprehensive ML-ready dataset with **Weather + Soil + NDVI + Variety + Historical Yield** features.

---

## 📊 What You Currently Have vs What You Need

### ✅ What Your Current Dataset Has:
- Crop year
- State & District
- Season
- Area (hectares)
- Historical yield (tonnes/hectare)
- Some scattered NDVI, soil, and weather data

### ❌ What's Missing for ML Modeling:
- **Weather**: Rainfall, temperature, humidity (by growth stage)
- **NDVI**: Vegetation indices at different growth stages
- **Variety**: Sugarcane variety information
- **Soil**: pH, NPK, moisture (structured)
- **Irrigation**: Type and availability
- **Historical patterns**: Temporal features

---

## 🎯 Solution: Automated Enrichment Pipeline

We've created 4 Python modules to enrich your data:

### 1. **data_enrichment_pipeline.py**
   - Core enrichment orchestrator
   - Creates clean base structure
   - Adds variety, irrigation, historical features
   - Generates ML-ready dataset

### 2. **weather_data_fetcher.py**
   - Fetches weather data from free APIs (NASA POWER, Open-Meteo)
   - Adds: rainfall, temperature, humidity
   - Creates growth-stage specific features

### 3. **ndvi_data_fetcher.py**
   - Extracts NDVI from existing datasets
   - Simulates realistic NDVI for missing data
   - Creates vegetation health indicators

### 4. **run_complete_enrichment.py**
   - Master script that runs everything
   - One-command execution
   - Generates quality reports

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```powershell
pip install pandas numpy requests
```

### Step 2: Run the Pipeline

**Option A: Process Everything (will take time)**
```powershell
python run_complete_enrichment.py
```

**Option B: Test with Sample (recommended first)**
```powershell
python run_complete_enrichment.py --sample 100
```

**Option C: Skip External APIs (faster)**
```powershell
python run_complete_enrichment.py --skip-weather --skip-ndvi
```

### Step 3: Check Results

Your enriched datasets will be in `enriched_data/` folder:
- `FINAL_ML_READY_SUGARCANE_DATASET.csv` - Main file for ML
- `DATA_DICTIONARY.md` - Explains all features
- `DATA_QUALITY_REPORT.txt` - Data completeness report

---

## 📁 Output Dataset Structure

Your final ML-ready dataset will have these feature categories:

### 🌍 Location Features
- `state`, `district`, `latitude`, `longitude`

### 📅 Temporal Features
- `year`, `crop_year`, `season`, `decade`, `years_since_2000`

### 🌾 Farm/Crop Features
- `area_hectare`
- `variety` (Co 86032, CoM 0265, Co 0238, etc.)
- `maturity` (Early/Mid-late)
- `irrigation_type`, `irrigation_availability`

### ☁️ Weather Features
- `rainfall_mm`, `avg_temperature_c`, `max_temperature_c`, `min_temperature_c`
- `humidity_percent`, `rainy_days`, `dry_spell_days`
- **Growth Stage Specific**:
  - `rainfall_early_growth` (Month 1-3)
  - `rainfall_vegetative` (Month 4-6)
  - `rainfall_grand_growth` (Month 7-9)
  - `rainfall_maturity` (Month 10-12)
  - `temp_early_growth`, `temp_vegetative`, etc.

### 🌱 Soil Features
- `soil_ph`, `soil_moisture`
- `nitrogen_kg_ha`, `phosphorus_kg_ha`, `potassium_kg_ha`
- `organic_carbon`, `soil_type`

### 🛰️ NDVI/Satellite Features
- `ndvi_30d`, `ndvi_60d`, `ndvi_90d`, `ndvi_120d`, `ndvi_150d`
- `ndvi_mean`, `ndvi_max`, `ndvi_min`, `ndvi_std`
- `ndvi_trend`
- `vegetation_health` (Good/Moderate/Poor)

### 🧬 Variety Characteristics
- `drought_tolerance`
- `salinity_tolerance`
- `waterlogging_tolerance`
- `ratooning_ability`

### 📈 Historical Features
- `prev_year_yield` - Last year's yield for same location
- `yield_3yr_avg` - 3-year moving average
- `historical_avg_yield` - Historical average for location
- `yield_vs_historical` - Deviation from average

### 🔧 Derived Features
- `temp_stress` - Temperature outside optimal range
- `rainfall_sufficient` - Rainfall > 1500mm indicator
- Climate indices and interactions

### 🎯 Target Variable
- `yield` - **Sugarcane yield in tonnes/hectare** (your prediction target)

---

## 📊 Expected Dataset Size

- **Records**: 15,000-20,000 (depending on data cleaning)
- **Features**: 50-70 features
- **File Size**: 5-15 MB

---

## 🔄 Pipeline Workflow

```
combined_sugarcane_dataset.csv (your current data)
              │
              ├──► Step 1: Base Structure Creation
              │    └─► Clean and standardize core features
              │
              ├──► Step 2: Variety Assignment
              │    └─► Map varieties using state/district/year
              │
              ├──► Step 3: Weather Enrichment
              │    └─► Fetch from NASA POWER / Open-Meteo APIs
              │
              ├──► Step 4: Soil Enrichment
              │    └─► Extract from existing soil datasets
              │
              ├──► Step 5: NDVI Enrichment
              │    └─► Match from existing + simulate realistic values
              │
              ├──► Step 6: Historical Features
              │    └─► Calculate temporal patterns
              │
              ├──► Step 7: Feature Engineering
              │    └─► Create derived features
              │
              └──► Step 8: Final ML Dataset
                   └─► FINAL_ML_READY_SUGARCANE_DATASET.csv
```

---

## 🎓 Feature Engineering Examples

### Weather Features by Growth Stage

Sugarcane has a 12-month crop cycle. Weather impacts vary by stage:

| Growth Stage | Months | Key Weather Need |
|--------------|--------|------------------|
| Early Growth | 1-3 | Moderate rainfall, warm temp |
| Vegetative | 4-6 | High rainfall, optimal temp |
| Grand Growth | 7-9 | Maximum rainfall, high temp |
| Maturity | 10-12 | Reduced rainfall, moderate temp |

The pipeline creates separate rainfall and temperature features for each stage.

### NDVI Time Series

NDVI (0-1 scale) indicates vegetation health:

| Stage | Days | Expected NDVI |
|-------|------|---------------|
| Establishment | 30 | 0.2-0.35 |
| Vegetative | 60 | 0.4-0.6 |
| Peak Growth | 90 | 0.65-0.85 |
| Maturation | 120-150 | 0.5-0.7 |

### Historical Features

These help the model learn temporal patterns:
- **prev_year_yield**: Last year's yield for same location
- **yield_3yr_avg**: Moving average (smooths anomalies)
- **yield_vs_historical**: Whether above/below normal

---

## ⚙️ Advanced Options

### Custom Weather API

To use your own weather API, modify `weather_data_fetcher.py`:

```python
def fetch_custom_weather(self, lat, lon, date):
    # Your API call here
    response = requests.get(f"YOUR_API_URL?lat={lat}&lon={lon}&date={date}")
    return response.json()
```

### Google Earth Engine for NDVI

For real satellite data (requires GEE account):

```python
import ee
ee.Initialize()

def fetch_real_ndvi(lat, lon, start_date, end_date):
    point = ee.Geometry.Point([lon, lat])
    collection = ee.ImageCollection('COPERNICUS/S2_SR') \
        .filterBounds(point) \
        .filterDate(start_date, end_date)
    # Process NDVI...
```

### Custom Variety Mapping

Edit variety assignment logic in `data_enrichment_pipeline.py`:

```python
def _assign_variety(self, row, variety_map):
    # Your custom logic here
    if row['district'] == 'Mandya':
        return 'Co 86032'
    # ...
```

---

## 📋 Data Quality Checklist

After running the pipeline, check:

- [ ] **Yield**: > 90% complete (target variable is critical)
- [ ] **Location**: State/District present for all records
- [ ] **Year**: Valid years (1970-2024)
- [ ] **Weather**: At least rainfall and temperature
- [ ] **NDVI**: Mean NDVI between 0.2-0.9
- [ ] **Variety**: Realistic varieties for each state
- [ ] **Soil**: pH between 5-9, NPK > 0

Review the `DATA_QUALITY_REPORT.txt` for detailed analysis.

---

## 🤖 Ready for ML Modeling

Once enrichment is complete, you can train models:

### Recommended Approach

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

# Load data
df = pd.read_csv('enriched_data/FINAL_ML_READY_SUGARCANE_DATASET.csv')

# Prepare features
feature_cols = [col for col in df.columns if col != 'yield']
X = df[feature_cols]
y = df['yield']

# Handle categoricals
categorical_cols = ['state', 'district', 'season', 'variety', 'maturity', 
                   'irrigation_type', 'soil_type', 'vegetation_health']

# One-hot encode or label encode
# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train models
rf_model = RandomForestRegressor(n_estimators=100)
xgb_model = XGBRegressor(n_estimators=100)

# Fit and predict...
```

### Feature Importance Analysis

After training, analyze which features matter most:

```python
# Random Forest
importances = rf_model.feature_importances_
feature_importance_df = pd.DataFrame({
    'feature': feature_cols,
    'importance': importances
}).sort_values('importance', ascending=False)

print(feature_importance_df.head(20))
```

Expected important features:
1. Historical yield features (prev_year_yield, yield_3yr_avg)
2. NDVI mean/max (vegetation health)
3. Rainfall (especially grand growth stage)
4. Temperature (especially maturity stage)
5. Variety characteristics
6. Soil NPK
7. Area cultivated

---

## 🚨 Troubleshooting

### Problem: Weather API Fails

**Solution**: Use `--skip-weather` flag, then manually add weather data later:

```python
# Load your weather CSV
weather_df = pd.read_csv('your_weather_data.csv')

# Merge with enriched dataset
df = pd.read_csv('enriched_data/step1_base_enriched.csv')
df = df.merge(weather_df, on=['state', 'district', 'year'], how='left')
```

### Problem: Too Few Complete Records

**Solution**: Impute missing values before training:

```python
from sklearn.impute import SimpleImputer

# For numerical features
imputer = SimpleImputer(strategy='median')
X_imputed = imputer.fit_transform(X)

# For categorical features
X['variety'].fillna('Co 86032', inplace=True)  # Most common variety
```

### Problem: NDVI Values Look Unrealistic

**Solution**: Filter outliers and recalibrate:

```python
df = df[(df['ndvi_mean'] >= 0.1) & (df['ndvi_mean'] <= 0.95)]
```

### Problem: Too Many Features (Overfitting Risk)

**Solution**: Feature selection:

```python
from sklearn.feature_selection import SelectKBest, f_regression

selector = SelectKBest(f_regression, k=30)
X_selected = selector.fit_transform(X, y)
selected_features = X.columns[selector.get_support()]
```

---

## 📚 Additional Data Sources

To further improve your dataset:

### Weather Data
- **IMD (India Meteorological Department)**: Official Indian weather data
- **OpenWeatherMap**: Historical weather API (paid)
- **Visual Crossing**: Weather history API

### Satellite/NDVI
- **Google Earth Engine**: Free Sentinel-2, Landsat data (requires account)
- **Sentinel Hub**: Commercial satellite API
- **Planet Labs**: High-resolution satellite imagery

### Soil Data
- **NBSS&LUP**: National Bureau of Soil Survey (India)
- **ISRIC SoilGrids**: Global soil data
- **FAO Soil Portal**: UN soil database

### Variety Information
- **ICAR-SBI**: Indian Council of Agricultural Research - Sugarcane Breeding Institute
- **State Agricultural Universities**: Variety-specific data
- **AICRP-Sugarcane**: All India Coordinated Research Project data

---

## 💡 Tips for College Project

### Project Presentation Points

1. **Problem Statement**: 
   - "Predicting sugarcane yield before harvest using climate + soil + satellite data"

2. **Data Challenge**: 
   - "Existing datasets lacked integrated weather, NDVI, and variety information"

3. **Solution**: 
   - "Built automated pipeline to enrich 18K+ records with 60+ features from multiple sources"

4. **Innovation**: 
   - Growth-stage specific weather features
   - NDVI temporal patterns
   - Variety-specific characteristics
   - Historical yield trends

5. **ML Models**:
   - Random Forest (ensemble learning)
   - XGBoost (gradient boosting)
   - Compare performance (RMSE, MAE, R²)

6. **Results**:
   - Show feature importance
   - Variety comparison (Co 86032 vs CoM 0265 vs others)
   - State-wise analysis
   - Yield forecast accuracy

### Report Structure

```
1. Introduction
   - Sugarcane importance in India
   - Need for yield prediction

2. Literature Review
   - Existing yield prediction methods
   - Machine learning in agriculture

3. Data Collection & Enrichment
   - Base dataset description
   - Enrichment methodology (YOUR PIPELINE!)
   - Data sources

4. Feature Engineering
   - Weather features by growth stage
   - NDVI time series
   - Historical patterns
   - Variety characteristics

5. Methodology
   - Random Forest algorithm
   - XGBoost algorithm
   - Train/test split
   - Hyperparameter tuning

6. Results
   - Model performance metrics
   - Feature importance analysis
   - Variety comparison
   - State-wise analysis

7. Discussion
   - Key findings
   - Practical applications
   - Limitations

8. Conclusion & Future Work

9. References

10. Appendix
    - Data dictionary
    - Code snippets
    - Additional charts
```

---

## 📞 Support

If you encounter issues:

1. **Check the logs**: Pipeline prints detailed progress
2. **Review DATA_QUALITY_REPORT.txt**: Identifies missing data
3. **Start with sample**: Use `--sample 100` first
4. **Skip failing steps**: Use `--skip-weather` or `--skip-ndvi`

---

## 🎉 Summary

You now have a complete pipeline to transform your basic dataset into a comprehensive ML-ready dataset with:

✅ **50-70 features** across 7 categories  
✅ **Weather** data by growth stage  
✅ **NDVI** vegetation indices  
✅ **Variety** characteristics  
✅ **Soil** properties  
✅ **Historical** patterns  
✅ **Quality reports** and documentation

**Run this command to start:**

```powershell
python run_complete_enrichment.py --sample 100
```

Then review the output and proceed with full enrichment!

---

**Good luck with your project! 🌾🚀**
