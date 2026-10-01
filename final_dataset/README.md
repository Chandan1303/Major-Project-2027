# Sugarcane Yield Prediction - Training Dataset

## Primary Dataset

**File**: `SUGARCANE_COMPLETE_ML_DATASET.csv`  
**Size**: 4.3 MB  
**Records**: ~18,500 samples  
**Purpose**: Main training dataset for dual-model ML system (Random Forest + XGBoost)

### Dataset Features

This dataset contains comprehensive agronomic features for sugarcane yield prediction:

#### Environmental Features
- `rainfall_mm` - Total rainfall during crop cycle
- `temperature_c` - Average temperature
- `sunlight_hours` - Average daily sunlight
- `humidity_pct` - Relative humidity percentage

#### Soil Features
- `soil_type` - Type of soil (Alluvial, Black, Red Loam, Clay Loam, Sandy Loam, Laterite)
- `soil_ph` - Soil pH level
- `soil_moisture` - Soil moisture percentage
- `soil_nitrogen` - Nitrogen content (kg/ha)
- `soil_phosphorus` - Phosphorus content (kg/ha)
- `soil_potassium` - Potassium content (kg/ha)

#### Crop Features
- `variety` - Sugarcane variety (Co 86032, Co 0238, CoM 0265, Co 94012, etc.)
- `season` - Growing season (Kharif, Rabi, Summer)
- `crop_duration_days` - Days from planting to harvest
- `crop_growth_stage` - Current growth stage
- `area_hectare` - Cultivated area

#### Management Features
- `irrigation_frequency` - Number of irrigations per season
- `prev_year_yield` - Previous year's yield (t/ha)
- `yield_3yr_avg` - 3-year average yield (t/ha)
- `yield_5yr_avg` - 5-year average yield (t/ha)

#### Location Features
- `state` - Indian state (11 major sugarcane-growing states)
- `district` - District name

#### Target Variable
- `yield_t_ha` - Actual yield in tonnes per hectare (target for prediction)

### Data Coverage

**Geographic Coverage**: 11 major sugarcane-producing states of India
- Uttar Pradesh
- Maharashtra
- Karnataka
- Tamil Nadu
- Bihar
- Haryana
- Punjab
- Andhra Pradesh
- Telangana
- Gujarat
- Uttarakhand

**Temporal Coverage**: Multiple crop cycles (2018-2025)

**Varieties Covered**: 8 major commercial varieties
- Co 86032 (General purpose)
- Co 0238 (High sucrose)
- CoM 0265 (Drought-resistant)
- Co 94012 (Karnataka variety)
- Co 419 (Karnataka variety)
- Co 62175 (Karnataka variety)
- CoC 671
- Co 99004

### Data Quality

✅ **No NDVI/Satellite data** - Pure agronomic features only  
✅ **Cleaned and validated** - Removed outliers and missing values  
✅ **Balanced distribution** - Covers all seasons, varieties, and regions  
✅ **Real-world data** - Sourced from agricultural datasets and research stations

### Usage in Project

This dataset is loaded by:
- `train_complete_ml_system.py` - Main training script
- `ml/yield_model.py` - Prediction engine initialization

The trained models are saved in the `models/` directory:
- `random_forest_model.pkl` (50.9 MB)
- `xgboost_model.pkl` (3.5 MB)
- `scaler.pkl` - Feature scaler
- `label_encoders.pkl` - Categorical encoders
- `feature_names.json` - Feature list
- `model_metadata.json` - Model performance metrics

### Model Performance

**Random Forest**:
- Training R²: 0.9876
- Test R²: 0.8187
- MAE: 8.32 t/ha
- RMSE: 11.45 t/ha

**XGBoost** (Selected as Best):
- Training R²: 0.9912
- Test R²: 0.8387
- MAE: 7.89 t/ha
- RMSE: 10.78 t/ha

---

**Note**: Other CSV files in this directory are intermediates or backups. Only `SUGARCANE_COMPLETE_ML_DATASET.csv` is required for model training and is version-controlled in the repository.
