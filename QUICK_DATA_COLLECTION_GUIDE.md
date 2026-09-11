# ⚡ Quick Data Collection Guide

**For**: Sugarcane Yield Prediction Project  
**Team**: Dayanand, Chandan, Harsha, Mohammad

---

## 🎯 You Already Have 95% of Data!

Your `cleaned_data` folder contains:
- ✅ NDVI data (4 regions)
- ✅ Soil data (pH, NPK, moisture)
- ✅ Irrigation data
- ✅ Historical yield
- ✅ 57 Variety data

**You just need to INTEGRATE it!**

---

## 🚀 ONE Command to Rule Them All

```powershell
python data_collection\integrate_existing_data.py
```

**This will:**
1. Load all your 20 cleaned CSV files
2. Load your base dataset (combined_sugarcane_dataset.csv)
3. Load variety data (57 varieties)
4. Run enrichment pipeline
5. Create final ML-ready dataset

**Time**: 5-10 minutes  
**Output**: `enriched_data/FINAL_SUGARCANE_DATASET_INTEGRATED.csv`

---

## 📊 What You'll Get

**Final Dataset Features** (60-70 columns):

### ✅ From Your Existing Files:
- Year, State, District, Season
- Area cultivated
- **NDVI** (from your 4 NDVI CSV files)
- **Soil** (pH, NPK from your soil CSV files)
- **Irrigation** (from your irrigation CSV files)
- **Variety** (Co 86032, Co 0238, CoC 671, etc.)
- **Historical Yield** (from your yield CSV files)

### ✅ Generated Features:
- NDVI mean/max/min/std
- Historical yield patterns
- Growth stage indicators
- Derived features

### ✅ Optional (if you add API key):
- Current weather (OpenWeather API)
- Fresh NDVI (Google Earth Engine)

---

## 🔑 Optional: Add Weather API (5 minutes)

If you want current weather data:

**Step 1**: Get free API key
- Go to: https://openweathermap.org/api
- Register (free, 1000 calls/day)
- Copy your API key

**Step 2**: Add to environment
```powershell
cd data_collection
copy .env.example .env
# Edit .env and add: OPENWEATHER_API_KEY=your_key_here
```

**Step 3**: Run integration
```powershell
python data_collection\integrate_existing_data.py
```

Now it will also fetch current weather for all districts!

---

## 📈 After Integration - Start ML Modeling

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

# Load your integrated dataset
df = pd.read_csv('enriched_data/FINAL_SUGARCANE_DATASET_INTEGRATED.csv')

print(f"Records: {len(df)}")
print(f"Features: {len(df.columns)}")
print(f"\nColumns: {df.columns.tolist()}")

# Check data quality
print(f"\nYield completeness: {df['yield'].notna().mean()*100:.1f}%")
print(f"NDVI completeness: {df['ndvi_mean'].notna().mean()*100:.1f}%")
print(f"Soil completeness: {df['soil_ph'].notna().mean()*100:.1f}%")

# Prepare for ML
X = df.drop(['yield'], axis=1)
y = df['yield']

# Encode categoricals
X = pd.get_dummies(X, drop_first=True)

# Handle missing values
X = X.fillna(X.median())

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train XGBoost
xgb = XGBRegressor(n_estimators=100, random_state=42)
xgb.fit(X_train, y_train)

# Train Random Forest
rf = RandomForestRegressor(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)

# Evaluate
print(f"\nXGBoost R²: {xgb.score(X_test, y_test):.3f}")
print(f"Random Forest R²: {rf.score(X_test, y_test):.3f}")

# Feature importance
importances = pd.DataFrame({
    'feature': X_train.columns,
    'importance': rf.feature_importances_
}).sort_values('importance', ascending=False)

print("\nTop 10 Important Features:")
print(importances.head(10))
```

---

## 🎯 Your Project Objectives - Status

| Objective | Status | Data Source |
|-----------|--------|-------------|
| Climate data integration | ✅ READY | Your CSVs + optional API |
| Soil characteristics | ✅ READY | Your soil CSVs |
| NDVI vegetation info | ✅ READY | Your 4 NDVI CSVs |
| Variety analysis | ✅ READY | Your variety CSV |
| Predict yield | ✅ READY | Train XGBoost/RF |
| Variety comparison | ✅ READY | Co 86032, 0238, CoC 671, etc. |
| Web platform | 🔜 NEXT | Flask + React |

---

## 📁 File Structure After Integration

```
Major-project/
├── combined_sugarcane_dataset.csv          # Your base data
├── cleaned_data/                           # Your 20 cleaned files
│   ├── NDVI_*.csv                         # ✅ Used
│   ├── soil_*.csv                         # ✅ Used
│   └── irrigation_*.csv                   # ✅ Used
│
├── backend/data/
│   └── sugarcane_varieties_master.csv     # ✅ Used
│
├── data_collection/
│   ├── integrate_existing_data.py         # ⭐ RUN THIS
│   ├── config.py
│   └── ...
│
└── enriched_data/                          # Generated
    └── FINAL_SUGARCANE_DATASET_INTEGRATED.csv  # ⭐ USE THIS FOR ML
```

---

## ✅ Checklist

Before running:
- [ ] You're in project root: `C:\Users\chand\OneDrive\Desktop\Major-project`
- [ ] You have Python 3.7+
- [ ] You have pandas, numpy installed (`pip install pandas numpy`)

Run integration:
- [ ] `python data_collection\integrate_existing_data.py`

After integration:
- [ ] Check output: `enriched_data/FINAL_SUGARCANE_DATASET_INTEGRATED.csv`
- [ ] Load in Python and verify
- [ ] Start ML modeling with XGBoost and Random Forest

---

## 🚨 Common Issues

**Issue**: "File not found: combined_sugarcane_dataset.csv"

**Solution**: Make sure you're in project root:
```powershell
cd C:\Users\chand\OneDrive\Desktop\Major-project
python data_collection\integrate_existing_data.py
```

---

**Issue**: "ModuleNotFoundError: No module named 'pandas'"

**Solution**:
```powershell
pip install pandas numpy requests python-dotenv
```

---

**Issue**: "No enriched data available"

**Solution**: Check if base CSV exists:
```powershell
dir combined_sugarcane_dataset.csv
dir backend\data\sugarcane_varieties_master.csv
```

---

## 📞 Summary

**You don't need to collect new data!**

You already have:
- ✅ 20 cleaned CSV files
- ✅ NDVI for 4 regions
- ✅ Comprehensive soil data
- ✅ Variety information
- ✅ Historical yield

**Just run:**
```powershell
python data_collection\integrate_existing_data.py
```

**Then start ML modeling!** 🚀

---

**Next**: Train XGBoost and Random Forest, compare varieties, build Flask + React web app!
