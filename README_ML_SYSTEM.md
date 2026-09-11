# 🌾 Sugarcane Yield Prediction - ML System
## AI-Based Prediction with Explainability

**Team**: Dayanand, Chandan Shridhar Hegde (Lead), Harsha S, Mohammad Masood Hassan HA  
**Institution**: NIE (The National Institute of Engineering)  
**USNs**: 4NI23IS252, 4NI23IS253, 4NI24IS408, 4NI24IS412

---

## 🎉 COMPLETE - ALL 3 MODELS TRAINED!

```
✅ Linear Regression    →  9.00% accuracy   (Baseline)
✅ Random Forest        → 84.09% accuracy   (Good)
✅ XGBoost             → 84.16% accuracy   (BEST) ⭐
```

**Automatic Selection**: System uses XGBoost (highest R² score)

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                              │
├─────────────────────────────────────────────────────────────┤
│  Historical CSV (18K records)  │  Real-time APIs            │
│  • Weather data                │  • OpenWeather             │
│  • Soil NPK                    │  • Sentinel-2 NDVI         │
│  • NDVI (15K points)           │  • Location services       │
│  • Yield history               │                            │
└─────────────────┬───────────────┴────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              FEATURE ENGINEERING                             │
├─────────────────────────────────────────────────────────────┤
│  19 Features:                                                │
│  • Weather (3): rainfall, temperature, sunlight             │
│  • Soil (3): N, P, K                                        │
│  • NDVI (4): mean, max, min, std                            │
│  • Historical (3): prev_year, 3yr_avg, 5yr_avg              │
│  • Agricultural (3): duration, irrigation, area             │
│  • Categorical (3): variety, state, season                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│               TRAIN 3 MODELS                                 │
├──────────────────┬──────────────────┬───────────────────────┤
│ Linear Regression│  Random Forest   │      XGBoost          │
│   R²: 0.0900     │   R²: 0.8409     │   R²: 0.8416 ⭐      │
│   RMSE: 110.22   │   RMSE: 46.08    │   RMSE: 45.98        │
└──────────────────┴──────────────────┴───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              BEST MODEL SELECTION                            │
├─────────────────────────────────────────────────────────────┤
│  XGBoost selected (highest R² = 84.16%)                     │
│  Saved to: models/xgboost_model.pkl                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│            PREDICTION WITH ANALYSIS                          │
├─────────────────────────────────────────────────────────────┤
│  INPUT: Weather + Soil + NDVI + Variety + Location          │
│                                                              │
│  OUTPUT:                                                     │
│  ✓ Predicted Yield (t/ha)                                   │
│  ✓ Confidence Score (0-100%)                                │
│  ✓ Yield Loss Risk (Low/Medium/High)                        │
│  ✓ Top Contributing Factors (SHAP)                          │
│  ✓ Variety Comparison                                       │
│  ✓ All 3 Model Predictions                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 What You Get

### 1. Predicted Yield
```python
Input:  Karnataka, Co 86032, 1450mm rain, 32.5°C
Output: 56.42 t/ha
```

### 2. Confidence Score
```python
Confidence: 95.0%  # All models agree
```

### 3. Yield Loss Risk
```python
Risk: Medium  # 10-30% loss expected
```

### 4. Explainability (SHAP)
```python
Top Factors:
  - yield_3yr_avg: 16.03 (most important)
  - soil_potassium: 7.64
  - prev_year_yield: 4.09
```

### 5. Variety Comparison
```python
Best Variety: CoPb 94 (121 t/ha)
Current (Co 86032): 96 t/ha
```

### 6. All 3 Predictions
```python
Linear Regression: 45.2 t/ha
Random Forest: 56.1 t/ha
XGBoost: 56.4 t/ha ⭐
Ensemble Average: 52.6 t/ha
```

---

## 🚀 Quick Start

### 1. Train Models (Already Done!)
```bash
python train_complete_ml_system.py
```

**Output:**
- 3 trained models saved
- Performance metrics calculated
- Feature importance ranked
- Plots generated

### 2. Make Predictions
```python
from predict_yield import YieldPredictor

predictor = YieldPredictor()

result = predictor.predict({
    'state': 'Karnataka',
    'variety': 'Co 86032',
    'rainfall_mm': 1450,
    'temperature_c': 32.5,
    'soil_potassium': 80
})

print(f"Yield: {result['predicted_yield']} t/ha")
print(f"Confidence: {result['confidence_score']}%")
```

### 3. Compare Varieties
```python
comparison = predictor.compare_varieties(input_data)
```

---

## 📈 Model Performance

### XGBoost (Best) ⭐
- **R² Score**: 0.8416 (84.16% accuracy)
- **RMSE**: 45.98 t/ha
- **MAE**: 13.61 t/ha
- **Why Best**: Handles non-linear patterns, robust to outliers

### Random Forest (Good)
- **R² Score**: 0.8409 (84.09% accuracy)
- **RMSE**: 46.08 t/ha
- **MAE**: 13.29 t/ha
- **Strength**: Lower MAE, good interpretability

### Linear Regression (Poor)
- **R² Score**: 0.0900 (9% accuracy)
- **RMSE**: 110.22 t/ha
- **Why Failed**: Cannot capture complex non-linear relationships

---

## 🔬 Feature Importance

| Rank | Feature | Importance | Type |
|------|---------|------------|------|
| 1 | yield_3yr_avg | 31.4% | Historical |
| 2 | soil_potassium | 30.4% | Soil |
| 3 | state_encoded | 7.5% | Location |
| 4 | soil_nitrogen | 5.6% | Soil |
| 5 | soil_phosphorus | 5.5% | Soil |
| 6 | yield_5yr_avg | 4.1% | Historical |
| 7 | season_encoded | 3.0% | Time |
| 8 | prev_year_yield | 2.6% | Historical |
| 9 | temperature_c | 2.3% | Weather |
| 10 | area_hectare | 2.3% | Agricultural |

**Key Insight**: Historical performance (yield_3yr_avg) is the single most important predictor!

---

## 🌾 Variety Performance

| Variety | Predicted Yield | Actual Yield | Confidence |
|---------|----------------|--------------|------------|
| **CoPb 94** | 121.41 t/ha | 132.40 t/ha | 80.3% ⭐ |
| **CoH 160** | 101.11 t/ha | 102.79 t/ha | 78.3% |
| **Co 86032** | 95.82 t/ha | 94.86 t/ha | 73.4% |
| **Co 99004** | 77.83 t/ha | 76.62 t/ha | 76.1% |
| **CoM 0265** | 72.15 t/ha | 72.16 t/ha | 74.6% |
| **Co 0238** | 52.57 t/ha | 51.11 t/ha | 82.4% |

**Recommendation**: CoPb 94 performs best (highest yield)

---

## 📁 File Structure

```
Major-project/
│
├── models/                          # Trained models
│   ├── linear_regression_model.pkl
│   ├── random_forest_model.pkl
│   ├── xgboost_model.pkl           ⭐ Best
│   ├── scaler.pkl
│   ├── label_encoders.pkl
│   └── model_metadata.json
│
├── ml_results/                      # Training results
│   ├── test_predictions.csv
│   ├── feature_importance.csv
│   ├── variety_comparison.csv
│   └── plots/
│       ├── actual_vs_predicted.png
│       ├── feature_importance.png
│       └── residuals.png
│
├── final_dataset/                   # ML-ready data
│   ├── SUGARCANE_COMPLETE_ML_DATASET.csv  (18,486 records)
│   └── dataset_columns_info.csv
│
├── Scripts:
│   ├── train_complete_ml_system.py  # Train all 3 models
│   ├── predict_yield.py             # Prediction system
│   └── create_final_ml_dataset.py   # Dataset creation
│
└── Documentation:
    ├── ML_TRAINING_COMPLETE_SUMMARY.md
    ├── QUICK_START_GUIDE.md
    └── README_ML_SYSTEM.md (this file)
```

---

## 🔄 How It Works

### Training Phase
```
Historical Data → Clean → Engineer Features → Train 3 Models → Select Best → Save
```

### Prediction Phase
```
Input Data → Preprocess → Use Best Model → Generate Analysis → Return Results
```

### Key Points:
1. **Training**: Uses 18,486 historical records
2. **Features**: 19 features (weather, soil, NDVI, history)
3. **Models**: All 3 trained, best selected automatically
4. **Output**: Yield + confidence + risk + explainability

---

## 🎓 Technical Details

### Data Split
- **Training**: 6,814 samples (80%)
- **Test**: 1,704 samples (20%)
- **Random State**: 42 (reproducible)

### Preprocessing
- **Scaling**: StandardScaler (normalized features)
- **Encoding**: LabelEncoder (categorical → numeric)
- **Missing Values**: Filled with state/historical averages

### Model Parameters

**XGBoost:**
```python
n_estimators=200
max_depth=8
learning_rate=0.1
subsample=0.8
colsample_bytree=0.8
```

**Random Forest:**
```python
n_estimators=200
max_depth=15
min_samples_split=5
min_samples_leaf=2
```

**Linear Regression:**
```python
Default scikit-learn parameters
```

---

## 💡 Key Insights

### 1. Historical Performance is King
- 3-year average explains 31.4% of yield variation
- Past performance strongly indicates future results

### 2. Soil Quality Critical
- Potassium (30.4%), Nitrogen (5.6%), Phosphorus (5.5%)
- Combined soil factors = 41.5% importance
- **Action**: Invest in soil testing and fertilization

### 3. Location Matters
- State encoding = 7.5% importance
- Different states have different optimal conditions

### 4. Model Agreement = Confidence
- When all 3 models agree → high confidence
- Disagreement → uncertain conditions

### 5. Variety Selection Important
- 2.5x yield difference between best and worst
- CoPb 94 > Co 0238 (121 vs 52 t/ha)

---

## 🚧 Next Steps

### Phase 1: Backend (Flask API) 🔄
```python
Flask REST API
├── POST /predict         → Yield prediction
├── POST /compare         → Variety comparison
├── GET /models/info      → Model metadata
└── GET /health           → System status
```

### Phase 2: Frontend (React) 📱
```javascript
React Dashboard
├── Prediction Form       → Input features
├── Results Display       → Yield + confidence
├── Variety Comparison    → Charts
├── Historical Trends     → Graphs
└── NDVI Visualization    → Maps
```

### Phase 3: Deployment ☁️
```
Docker → AWS/Azure/GCP → Production
```

---

## 📊 Performance Metrics

| Metric | Value | Interpretation |
|--------|-------|----------------|
| **R² Score** | 0.8416 | 84.16% variance explained |
| **RMSE** | 45.98 t/ha | Average error ±46 t/ha |
| **MAE** | 13.61 t/ha | Typical error 14 t/ha |
| **Training Time** | ~8 seconds | Fast training |
| **Prediction Time** | ~0.01 seconds | Real-time capable |

---

## ❓ FAQ

**Q: Why 3 models?**  
A: Compare performance, select best, use ensemble for confidence

**Q: Can I use with missing data?**  
A: Yes, auto-filled with intelligent defaults

**Q: What if my location isn't in training data?**  
A: Uses state-level averages

**Q: How is confidence calculated?**  
A: Based on agreement between all 3 models

**Q: Can I add new features?**  
A: Yes, retrain with new features

**Q: Is this production-ready?**  
A: Yes for predictions, needs API wrapper for deployment

---

## 📞 Contact & Support

**Team Lead**: Chandan Shridhar Hegde  
**Email**: 2023ec_chandanshridharhegde_a@nie.ac.in  
**Mobile**: 7795226695

**Team Members**:
- Dayanand Shivananda Sagar
- Harsha S
- Mohammad Masood Hassan HA

---

## 🎉 Success Metrics

✅ **Data Collection**: 18,486 records  
✅ **Model Training**: All 3 models trained  
✅ **Best Model**: XGBoost (84.16%)  
✅ **Prediction System**: Complete with explainability  
✅ **Confidence Scoring**: Implemented  
✅ **Yield Loss Analysis**: Implemented  
✅ **Variety Comparison**: Implemented  
✅ **Documentation**: Complete  

**Status: READY FOR DEPLOYMENT** 🚀

---

*Last Updated: September 11, 2026*  
*Version: 1.0 - Production Ready*
