# 🌾 Sugarcane Yield Prediction - Data Collection System

**Team Members:**
- Dayanand Shivananda Sagar (4NI23IS252)
- Chandan Shridhar Hegde (4NI23IS253) - Team Lead
- Harsha S (4NI24IS408)
- Mohammad Masood Hassan HA (4NI24IS412)

**Institution:** NIE, Mysuru

---

## 📋 Project Overview

AI-based sugarcane yield prediction system using:
- **Machine Learning**: XGBoost, Random Forest
- **Climate Data**: OpenWeather API, MOSDAC
- **Satellite Data**: Sentinel-2 (Google Earth Engine) for NDVI
- **Variety Analysis**: Co 86032, Co 0238, CoC 671, Co 99004, CoM 0265
- **Web Platform**: React.js + Flask + MySQL

---

## 🎯 Data Collection Objectives

Collect comprehensive data for accurate yield prediction:

1. **Climate Data**
   - Rainfall, Temperature, Humidity
   - Weather patterns by growth stage
   - Historical weather records (2018-2024)

2. **Satellite Data (NDVI)**
   - Sentinel-2 imagery via Google Earth Engine
   - Vegetation health monitoring
   - Crop growth analysis

3. **Soil Characteristics**
   - pH, Moisture, NPK
   - Soil texture and type

4. **Variety Information**
   - Performance data for different varieties
   - Tolerance characteristics

5. **Historical Yield**
   - Past yield records
   - Temporal patterns

---

## 📦 Files Created

### Core Modules
```
data_collection/
├── config.py                    - Configuration & API keys
├── openweather_collector.py     - OpenWeather API collector
├── mosdac_collector.py          - MOSDAC (Indian satellite) collector
├── gee_ndvi_collector.py        - Google Earth Engine NDVI collector
├── collect_all_data.py          - Master coordinator
├── .env.example                 - API key template
└── README_DATA_COLLECTION.md    - This file

Generated folders:
├── collected_data/              - Raw collected data
├── raw_data/                    - Intermediate data
└── processed_data/              - Final ML-ready dataset
```

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```powershell
pip install pandas numpy requests python-dotenv
pip install earthengine-api  # For Google Earth Engine (optional)
```

### Step 2: Configure API Keys

1. **Copy the environment template:**
```powershell
cd data_collection
copy .env.example .env
```

2. **Get API Keys:**

#### OpenWeather API (Required)
- Register: https://openweathermap.org/api
- Free tier: 1,000 calls/day
- Add to `.env`: `OPENWEATHER_API_KEY=your_key_here`

#### Google Earth Engine (For real Sentinel-2 data)
- Sign up: https://earthengine.google.com/
- Install: `pip install earthengine-api`
- Authenticate: `earthengine authenticate`
- Add to `.env`: `GEE_PROJECT_ID=your_project_id`

#### MOSDAC (Indian Satellite Data)
- Register: https://www.mosdac.gov.in/
- Add credentials to `.env`

3. **Edit `.env` file:**
```env
OPENWEATHER_API_KEY=your_actual_key_here
GEE_PROJECT_ID=your_gee_project_id
MOSDAC_USERNAME=your_username
MOSDAC_PASSWORD=your_password
```

---

## 📊 Data Collection Process

### Quick Start (All Data Sources)

```powershell
cd data_collection
python collect_all_data.py
```

This will:
1. ✅ Collect weather data from OpenWeather
2. ✅ Collect MOSDAC satellite data
3. ✅ Collect NDVI from Sentinel-2 (or simulate)
4. ✅ Load your existing dataset
5. ✅ Merge all sources
6. ✅ Create final ML-ready dataset

### Individual Collectors

**Collect OpenWeather data only:**
```powershell
python openweather_collector.py
```

**Collect MOSDAC data:**
```powershell
python mosdac_collector.py
```

**Collect NDVI data:**
```powershell
python gee_ndvi_collector.py
```

---

## 🗺️ Coverage

### States & Districts

Data collected for major sugarcane regions:

- **Uttar Pradesh**: Muzaffarnagar, Meerut, Bijnor, Saharanpur, Bareilly
- **Maharashtra**: Pune, Kolhapur, Sangli, Satara, Ahmednagar, Solapur
- **Karnataka**: Mandya, Belagavi, Mysuru, Bagalkot, Shivamogga
- **Tamil Nadu**: Coimbatore, Erode, Salem, Thanjavur, Tiruchirappalli
- **Punjab**: Jalandhar, Gurdaspur, Amritsar, Ludhiana
- **Haryana**: Yamuna Nagar, Karnal, Kurukshetra
- **Gujarat**: Surat, Navsari, Bharuch, Valsad
- **Andhra Pradesh**: East/West Godavari, Krishna, Visakhapatnam
- **Bihar**: Champaran, Siwan, Gopalganj, Darbhanga

**Total**: 9 states, 40+ districts

### Time Period

- **Historical Data**: 2018-2024
- **Weather**: Daily records
- **NDVI**: Every 15 days (Sentinel-2 revisit time)

---

## 📈 Data Sources

### 1. OpenWeather API
- **Data**: Temperature, humidity, rainfall, wind speed, clouds
- **Coverage**: Global
- **Update**: Real-time + historical
- **Cost**: FREE (1,000 calls/day)
- **Website**: https://openweathermap.org/api

### 2. MOSDAC (Indian Satellite Data)
- **Data**: INSAT-3D/3DR weather, rainfall, temperature
- **Coverage**: India-specific
- **Update**: Daily
- **Cost**: FREE (registration required)
- **Website**: https://www.mosdac.gov.in/

### 3. Google Earth Engine (Sentinel-2)
- **Data**: NDVI, satellite imagery
- **Resolution**: 10m
- **Revisit**: 5 days (combined satellites)
- **Cost**: FREE for research/education
- **Website**: https://earthengine.google.com/

### 4. Existing Dataset
- **Your dataset**: combined_sugarcane_dataset.csv
- **Records**: 18,000+
- **Contains**: Historical yield, state, district, season

### 5. Variety Master Data
- **File**: backend/data/sugarcane_varieties_master.csv
- **Varieties**: 57 varieties with characteristics
- **Contains**: Tolerance, maturity, CCS%, yield potential

---

## 🎯 Output Dataset Structure

### Final Dataset: `FINAL_SUGARCANE_DATASET.csv`

**Columns (60+)**:

#### Identification
- `state`, `district`, `year`, `season`

#### Farm Details
- `area_hectare`, `variety`

#### Weather (OpenWeather)
- `temperature`, `humidity`, `rainfall_mm`
- `wind_speed`, `clouds`, `pressure`

#### Climate (MOSDAC)
- `rainfall_mosdac`, `temp_max_mosdac`, `temp_min_mosdac`
- `humidity_mosdac`

#### Satellite (NDVI)
- `ndvi_mean`, `ndvi_max`, `ndvi_min`, `ndvi_std`

#### Historical
- `yield` (target variable)

---

## 💡 Usage Examples

### Example 1: Quick Test

```powershell
# Test OpenWeather API
python openweather_collector.py

# Select option 1 for current weather
# This will collect data for all 40+ districts
```

### Example 2: Full Collection

```powershell
# Run complete pipeline
python collect_all_data.py

# Output: processed_data/FINAL_SUGARCANE_DATASET.csv
```

### Example 3: Custom Date Range

Edit `config.py`:
```python
class CollectionConfig:
    START_YEAR = 2020  # Change this
    END_YEAR = 2024    # And this
```

Then run:
```powershell
python collect_all_data.py
```

---

## 📊 Data Quality & Validation

### Automatic Checks

The system performs:
- ✅ API response validation
- ✅ Data type checking
- ✅ Range validation (e.g., NDVI: 0-1, temp: -50 to 60°C)
- ✅ Duplicate detection
- ✅ Missing value reporting

### Quality Report

After collection, check:
```
processed_data/data_collection_metadata.json
```

Contains:
- Collection timestamp
- Sources used
- Records collected per source
- Data completeness statistics

---

## 🔧 Troubleshooting

### Issue: OpenWeather API Error 401

**Problem**: Invalid API key

**Solution**:
1. Check your API key at https://openweathermap.org/api
2. Verify it's active (may take 10 minutes after registration)
3. Update `.env` file

### Issue: Google Earth Engine Error

**Problem**: Not authenticated

**Solution**:
```powershell
pip install earthengine-api
earthengine authenticate
# Follow browser authentication
```

### Issue: MOSDAC Data Empty

**Problem**: MOSDAC requires registration and specific API endpoints

**Solution**:
- System uses simulated data if MOSDAC not configured
- For real data: Register at https://www.mosdac.gov.in/
- Update API endpoints in `mosdac_collector.py`

### Issue: Existing Dataset Not Found

**Problem**: `combined_sugarcane_dataset.csv` not in correct location

**Solution**:
```powershell
# Run from project root, not from data_collection folder
cd C:\Users\chand\OneDrive\Desktop\Major-project
python data_collection\collect_all_data.py
```

---

## 📝 Data Collection Best Practices

### 1. Rate Limiting
- APIs have rate limits (1,000/day for OpenWeather free tier)
- System automatically adds delays between requests
- For large collections, run overnight

### 2. Data Backup
- Raw collected data saved in `collected_data/`
- Keep backups before merging
- Processed data in `processed_data/`

### 3. Incremental Collection
- Collect data in stages (weather → NDVI → merge)
- Test with small samples first
- Validate before full collection

### 4. API Key Security
- Never commit `.env` file to Git
- Use `.env.example` as template
- Keep API keys confidential

---

## 📈 Next Steps After Collection

### 1. Data Exploration
```python
import pandas as pd

df = pd.read_csv('processed_data/FINAL_SUGARCANE_DATASET.csv')

print(df.info())
print(df.describe())
print(df.isnull().sum())
```

### 2. Feature Engineering
- Create growth-stage weather features
- Calculate NDVI trends
- Add variety characteristics
- Compute historical averages

### 3. ML Modeling
- Split train/test (80/20)
- Train XGBoost Regressor
- Train Random Forest Regressor
- Compare performance
- Analyze feature importance

### 4. Web Integration
- Load data into MySQL database
- Create Flask APIs
- Build React.js dashboard
- Deploy system

---

## 📞 Support & Contact

**Team Lead**: Chandan Shridhar Hegde  
**Email**: 2023ec_chandanshridharhegde_a@nie.ac.in  
**Mobile**: 7795226695

**Project Repository**: [Your GitHub link]

---

## 📚 References

### APIs & Data Sources
- OpenWeather: https://openweathermap.org/api
- Google Earth Engine: https://earthengine.google.com/
- MOSDAC: https://www.mosdac.gov.in/
- Sentinel-2: https://sentinel.esa.int/

### Academic References
- XGBoost: Chen & Guestrin (2016)
- Random Forest: Breiman (2001)
- NDVI for Crop Monitoring: Rouse et al. (1974)
- Sugarcane Yield Prediction: [Your references]

---

## ✅ Checklist

Before starting collection:
- [ ] Python 3.7+ installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created with API keys
- [ ] OpenWeather API key active
- [ ] Existing dataset present
- [ ] Sufficient disk space (1-2 GB)

After collection:
- [ ] Check `data_collection_metadata.json`
- [ ] Verify final dataset exists
- [ ] Review data completeness
- [ ] Backup collected data
- [ ] Ready for ML modeling

---

**Created**: September 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
