# 📍 Model Location Guide
**Where Exactly Are Your Trained Models?**

---

## 🎯 EXACT LOCATION

### Main Path:
```
C:\Users\chand\OneDrive\Desktop\Major-project\models\
```

---

## 📁 All Files in Models Folder

### 1. **The 3 Trained Models** 🤖

#### ⭐ XGBoost Model (BEST)
```
📍 Location: C:\Users\chand\OneDrive\Desktop\Major-project\models\xgboost_model.pkl
📊 Size: 1,602 KB (1.6 MB)
🎯 Accuracy: 84.16% (R² Score)
⏰ Created: 11-09-2026 18:33:32
```

#### Random Forest Model
```
📍 Location: C:\Users\chand\OneDrive\Desktop\Major-project\models\random_forest_model.pkl
📊 Size: 24,176 KB (24 MB) - Largest file!
🎯 Accuracy: 84.09% (R² Score)
⏰ Created: 11-09-2026 18:33:32
```

#### Linear Regression Model
```
📍 Location: C:\Users\chand\OneDrive\Desktop\Major-project\models\linear_regression_model.pkl
📊 Size: 1 KB
🎯 Accuracy: 9.00% (R² Score) - Not recommended
⏰ Created: 11-09-2026 18:33:32
```

---

### 2. **Supporting Files** 🔧

#### Scaler (Feature Normalization)
```
📍 Location: C:\Users\chand\OneDrive\Desktop\Major-project\models\scaler.pkl
📊 Size: 1.23 KB
📝 Purpose: Normalizes input features before prediction
```

#### Label Encoders (Category to Number)
```
📍 Location: C:\Users\chand\OneDrive\Desktop\Major-project\models\label_encoders.pkl
📊 Size: 0.89 KB
📝 Purpose: Converts variety, state, season to numbers
```

#### Feature Names (Column Order)
```
📍 Location: C:\Users\chand\OneDrive\Desktop\Major-project\models\feature_names.json
📊 Size: 0.37 KB
📝 Purpose: Remembers exact order of input features
```

#### Model Metadata (Info & Stats)
```
📍 Location: C:\Users\chand\OneDrive\Desktop\Major-project\models\model_metadata.json
📊 Size: 1.59 KB
📝 Purpose: Stores model performance metrics
```

---

## 📂 Folder Structure

```
C:\Users\chand\OneDrive\Desktop\Major-project\
│
├── models/  👈 YOUR MODELS ARE HERE!
│   │
│   ├── xgboost_model.pkl              ⭐ Best model (1.6 MB)
│   ├── random_forest_model.pkl        ✅ Good model (24 MB)
│   ├── linear_regression_model.pkl    ❌ Poor model (1 KB)
│   │
│   ├── scaler.pkl                     🔧 Feature scaler
│   ├── label_encoders.pkl             🔧 Category encoder
│   ├── feature_names.json             📝 Feature list
│   └── model_metadata.json            📊 Performance stats
│
├── ml_results/                        📈 Training results
│   ├── test_predictions.csv
│   ├── feature_importance.csv
│   ├── variety_comparison.csv
│   └── plots/
│       ├── actual_vs_predicted.png
│       ├── feature_importance.png
│       └── residuals.png
│
└── final_dataset/                     💾 Training data
    └── SUGARCANE_COMPLETE_ML_DATASET.csv
```

---

## 🔍 How to Access Models

### Option 1: File Explorer (Windows)
1. Open File Explorer
2. Navigate to: `C:\Users\chand\OneDrive\Desktop\Major-project`
3. Open folder: `models`
4. You'll see all 7 files

### Option 2: Command Line
```bash
cd C:\Users\chand\OneDrive\Desktop\Major-project\models
dir
```

### Option 3: Python Code
```python
from pathlib import Path

model_dir = Path('C:/Users/chand/OneDrive/Desktop/Major-project/models')

# List all files
for file in model_dir.iterdir():
    print(f"{file.name}: {file.stat().st_size / 1024:.2f} KB")
```

---

## 📊 File Sizes Explained

| File | Size | Why This Size? |
|------|------|----------------|
| **random_forest_model.pkl** | 24 MB | Contains 200 decision trees (largest) |
| **xgboost_model.pkl** | 1.6 MB | Compressed tree structure (efficient) ⭐ |
| **linear_regression_model.pkl** | 1 KB | Only 19 coefficients (tiny) |
| **scaler.pkl** | 1.23 KB | Mean and std for 19 features |
| **label_encoders.pkl** | 0.89 KB | Mappings for 3 categories |
| **feature_names.json** | 0.37 KB | List of 19 feature names |
| **model_metadata.json** | 1.59 KB | Performance metrics (text) |

**Total Size**: ~25.7 MB (mostly Random Forest)

---

## 🎯 Which Model is Used?

### When You Run Predictions:
```python
from predict_yield import YieldPredictor

predictor = YieldPredictor()  # Loads ALL 3 models
```

**It loads:**
1. ✅ `xgboost_model.pkl` (primary - best performance)
2. ✅ `random_forest_model.pkl` (secondary - for confidence)
3. ✅ `linear_regression_model.pkl` (tertiary - for ensemble)

**Default prediction uses**: XGBoost (best R² score)

**But you get all 3 predictions** for confidence calculation!

---

## 💾 How to Copy Models

### To Another Location:
```bash
# Copy entire models folder
xcopy "C:\Users\chand\OneDrive\Desktop\Major-project\models" "D:\backup\models" /E /I

# Or just copy XGBoost (best model)
copy "C:\Users\chand\OneDrive\Desktop\Major-project\models\xgboost_model.pkl" "D:\backup\"
```

### To Share with Team:
```bash
# Create a zip file
Compress-Archive -Path "C:\Users\chand\OneDrive\Desktop\Major-project\models" -DestinationPath "models_backup.zip"
```

---

## 🔐 Important Notes

### ⚠️ Don't Delete These Files!
All 7 files are required for predictions:
- 3 model files (the AI brains)
- Scaler (normalizes inputs)
- Encoders (handles categories)
- Feature names (correct order)
- Metadata (performance info)

### ✅ Safe to Delete:
- `ml_results/` folder (just results, not needed for predictions)
- `plots/` folder (just visualizations)

### 🔄 To Retrain:
```bash
python train_complete_ml_system.py
```
This will overwrite files in `models/` folder

---

## 📱 For Deployment

### Copy These to Your Server:
```
models/
├── xgboost_model.pkl        ⭐ REQUIRED
├── random_forest_model.pkl  ⭐ REQUIRED (for confidence)
├── linear_regression_model.pkl ⭐ REQUIRED (for ensemble)
├── scaler.pkl               ⭐ REQUIRED
├── label_encoders.pkl       ⭐ REQUIRED
├── feature_names.json       ⭐ REQUIRED
└── model_metadata.json      ⭐ REQUIRED
```

**All 7 files needed** = 25.7 MB total

---

## 🧪 Quick Test

### Check if models exist:
```bash
cd C:\Users\chand\OneDrive\Desktop\Major-project
dir models\*.pkl
```

### Load and test:
```bash
python predict_yield.py
```

Should output:
```
Loaded ALL 3 models:
  - Linear Regression (R2: 0.0900)
  - Random Forest (R2: 0.8409)
  - XGBoost (R2: 0.8416)

Best Model: XGBOOST (R2: 0.8416)
```

---

## 📞 Summary

### 🎯 Main Location:
```
C:\Users\chand\OneDrive\Desktop\Major-project\models\
```

### ⭐ Best Model:
```
xgboost_model.pkl (1.6 MB)
```

### 📦 Total Files:
```
7 files, 25.7 MB total
```

### ✅ Status:
```
All models trained and saved successfully!
Ready for deployment!
```

---

**Need to move models?** Just copy the entire `models/` folder!  
**Need to share?** Zip the `models/` folder!  
**Need to deploy?** Upload `models/` folder to server!

---

*Guide created: September 11, 2026*
