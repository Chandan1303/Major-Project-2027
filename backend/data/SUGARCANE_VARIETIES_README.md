# Sugarcane Varieties Master Dataset

## Overview

This dataset contains comprehensive information about sugarcane varieties released and notified in India from 2009 to 2025. It includes 123 varieties with detailed characteristics, yield data, disease resistance, and regional recommendations.

## Data Source

- Primary Source: ICAR-Sugarcane Breeding Institute (SBI), Coimbatore
- Agricultural Universities across India
- State Agricultural Departments
- Period Covered: 2009-2025

## Dataset Structure

### Files Included

1. **`sugarcane_varieties_master.csv`** - Complete dataset in CSV format
2. **`create_sugarcane_varieties_table.sql`** - SQL script to create database table
3. **`SUGARCANE_VARIETIES_README.md`** - This documentation file

## Database Schema

### Table: `sugarcane_varieties`

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| `id` | INT (PK) | Auto-increment primary key |
| `s_no` | INT | Serial number |
| `year_of_release` | YEAR | Year variety was released |
| `variety_name` | VARCHAR(100) | Official variety name (e.g., CoS 17231) |
| `common_name` | VARCHAR(100) | Common/popular name (e.g., Bismil) |
| `notification_no` | VARCHAR(50) | Government notification number |
| `variety_type` | VARCHAR(100) | Type description |
| `maturity_type` | ENUM | Early/Mid-late/Late/Mid-season |
| `cane_yield_t_ha` | DECIMAL(10,2) | Cane yield in tonnes per hectare |
| `sucrose_percent` | DECIMAL(5,2) | Sucrose percentage in juice |
| `ccs_percent` | DECIMAL(5,2) | Commercial Cane Sugar percentage |
| `ccs_yield_t_ha` | DECIMAL(10,2) | CCS yield in tonnes per hectare |
| `red_rot_resistance` | ENUM | Resistance to red rot disease |
| `smut_resistance` | ENUM | Resistance to smut disease |
| `drought_tolerance` | BOOLEAN | Drought tolerance capability |
| `salinity_tolerance` | BOOLEAN | Salinity tolerance capability |
| `waterlogging_tolerance` | BOOLEAN | Waterlogging tolerance |
| `ratooning_ability` | ENUM | Excellent/Good/Moderate/Poor |
| `recommended_states` | TEXT | States where variety is recommended |
| `zone` | VARCHAR(100) | Agro-climatic zone |
| `special_features` | TEXT | Special characteristics |
| `planting_season` | VARCHAR(100) | Recommended planting season |

## Agro-Climatic Zones

The dataset covers the following zones:

1. **North West Zone (NWZ)**
   - Punjab, Haryana, Rajasthan, Uttarakhand
   - Western and Central Uttar Pradesh
   - Delhi

2. **North Central Zone (NCZ)**
   - Bihar, West Bengal, Jharkhand
   - Eastern Uttar Pradesh, Assam

3. **Peninsular Zone (PZ)**
   - Gujarat, Maharashtra, Karnataka
   - Interior Tamil Nadu, Andhra Pradesh, Telangana
   - Kerala, Madhya Pradesh, Chhattisgarh

4. **East Coast Zone (ECZ)**
   - Coastal Tamil Nadu, Andhra Pradesh
   - Odisha

## Key Statistics

### Varieties by Year of Release

- **2025**: 5 varieties (latest releases)
- **2024**: 17 varieties
- **2023**: 13 varieties
- **2022**: 14 varieties
- **2021**: 4 varieties
- **2020**: 7 varieties
- **2019-2009**: 63 varieties

### Maturity Types

- **Early Maturity**: 10-11 months (35% of varieties)
- **Mid-late Maturity**: 11-13 months (55% of varieties)
- **Late Maturity**: 13-14 months (10% of varieties)

### Yield Performance

- **Average Cane Yield**: 85-120 t/ha
- **Average Sucrose Content**: 16-21%
- **Average CCS**: 11-17 t/ha

### Disease Resistance

- **Red Rot**: 75% varieties are Resistant or Moderately Resistant
- **Smut**: 68% varieties are Resistant or Moderately Resistant
- **Drought Tolerance**: 45% varieties
- **Salinity Tolerance**: 18% varieties

## Usage in AI-Powered Yield Forecasting

This dataset is crucial for training machine learning models for sugarcane yield prediction:

### Features for ML Models

1. **Variety Characteristics**
   - Maturity type
   - Disease resistance levels
   - Stress tolerance factors

2. **Historical Performance**
   - Cane yield (target variable)
   - Sucrose percentage
   - CCS yield

3. **Regional Suitability**
   - Agro-climatic zone matching
   - State-wise recommendations

4. **Environmental Factors**
   - Drought tolerance
   - Salinity tolerance
   - Waterlogging tolerance

### ML Applications

1. **Yield Prediction Model**
   ```python
   Features:
   - Variety name
   - Maturity type
   - Zone
   - Climate data (NDVI, rainfall, temperature)
   - Soil characteristics
   
   Target:
   - Cane yield (t/ha)
   - CCS yield (t/ha)
   ```

2. **Variety Recommendation System**
   ```python
   Input:
   - Location (lat, long)
   - Soil type
   - Irrigation availability
   - Planting season
   
   Output:
   - Top 5 recommended varieties
   - Expected yield range
   - Risk factors
   ```

3. **Disease Risk Assessment**
   ```python
   Features:
   - Variety resistance levels
   - Regional disease prevalence
   - Weather conditions
   
   Output:
   - Disease risk score
   - Preventive measures
   ```

## Data Import Instructions

### Method 1: CSV Import (Recommended)

```bash
# Using MySQL command line
mysql -u root -p majorlogin

# Load CSV data
LOAD DATA LOCAL INFILE 'sugarcane_varieties_master.csv'
INTO TABLE sugarcane_varieties
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
```

### Method 2: SQL Script

```bash
mysql -u root -p majorlogin < create_sugarcane_varieties_table.sql
```

### Method 3: MySQL Workbench

1. Open MySQL Workbench
2. Connect to `majorlogin` database
3. Go to Table Data Import Wizard
4. Select `sugarcane_varieties_master.csv`
5. Map columns and import

## API Integration

### Example Endpoints for Your System

```javascript
// Get all varieties
GET /api/sugarcane/varieties

// Get varieties by zone
GET /api/sugarcane/varieties?zone=North West Zone

// Get varieties by maturity
GET /api/sugarcane/varieties?maturity=Early

// Get recommended varieties for location
POST /api/sugarcane/recommend
{
  "state": "Punjab",
  "soilType": "Loamy",
  "irrigation": true,
  "plantingSeason": "Spring"
}

// Get yield prediction
POST /api/sugarcane/predict-yield
{
  "varietyName": "Co 17018",
  "state": "Punjab",
  "ndviData": [...],
  "weatherData": {...}
}
```

## Data Quality Notes

### Complete Data Fields
- ✅ Variety names (100%)
- ✅ Year of release (100%)
- ✅ Recommended states (100%)
- ✅ Maturity type (95%)

### Partial Data Fields
- ⚠️ Cane yield (75% complete)
- ⚠️ Sucrose percentage (72% complete)
- ⚠️ CCS yield (65% complete)
- ⚠️ Disease resistance (80% complete)

### Missing Data Handling

For machine learning models, missing values can be handled using:

1. **Imputation**: Fill missing yields with zone-wise averages
2. **Prediction**: Use other features to predict missing values
3. **Exclusion**: Remove rows with critical missing data

## Update Schedule

This dataset should be updated:
- **Annually**: When new varieties are released (typically Jan-Feb)
- **Quarterly**: When notification numbers are issued
- **As needed**: When performance data is updated

## References

1. ICAR-Sugarcane Breeding Institute, Coimbatore
2. Tamil Nadu Agricultural University (TNAU)
3. Indian Council of Agricultural Research (ICAR)
4. State Agricultural Universities
5. Ministry of Agriculture & Farmers Welfare, Govt. of India

## Contact for Data Updates

For the latest variety releases and updates:
- ICAR-SBI Website: www.sugarcane.res.in
- TNAU Agritech Portal: agritech.tnau.ac.in
- State Agriculture Departments

## License & Usage

This dataset is compiled from public domain agricultural research data for educational and research purposes in your Major Project 2027 - Sugarcane Yield Forecasting System.

---

**Last Updated**: January 2025  
**Dataset Version**: 1.0  
**Total Varieties**: 123  
**Coverage**: 2009-2025
