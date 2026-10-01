"""
Enhanced Model Retraining with Variety-Season Interaction Features
This creates engineered features that capture variety-season combinations
"""

import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, RobustScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb

print("="*80)
print("ENHANCED RETRAINING WITH VARIETY-SEASON INTERACTIONS")
print("="*80)
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# Load dataset
print("[1/6] Loading dataset...")
data_path = Path('final_dataset/SUGARCANE_COMPLETE_ML_DATASET.csv')
df = pd.read_csv(data_path)
print(f"  Loaded: {len(df):,} records\n")

# Feature engineering with SEASON and INTERACTIONS
print("[2/6] Creating variety-season interaction features...")
feature_cols = [
    'rainfall_mm', 'temperature_c', 'sunlight_hours',
    'soil_nitrogen', 'soil_phosphorus', 'soil_potassium',
    'ndvi_mean', 'ndvi_max', 'ndvi_min', 'ndvi_std',
    'crop_duration_days', 'irrigation_frequency',
    'prev_year_yield', 'yield_3yr_avg', 'yield_5yr_avg',
    'area_hectare', 'variety', 'state', 'season'
]

available_features = [col for col in feature_cols if col in df.columns]
df_clean = df[available_features + ['yield']].copy()

# Fill missing values
for col in ['ndvi_mean', 'ndvi_max', 'ndvi_min', 'ndvi_std']:
    if col in df_clean.columns:
        df_clean[col] = df_clean[col].fillna(df_clean[col].median())

for col in ['rainfall_mm', 'temperature_c', 'sunlight_hours']:
    if col in df_clean.columns:
        df_clean[col] = df_clean.groupby('variety')[col].transform(
            lambda x: x.fillna(x.mean())
        )

for col in ['soil_nitrogen', 'soil_phosphorus', 'soil_potassium']:
    if col in df_clean.columns:
        df_clean[col] = df_clean[col].fillna(df_clean[col].mean())

for col in ['prev_year_yield', 'yield_3yr_avg', 'yield_5yr_avg']:
    if col in df_clean.columns:
        df_clean[col] = df_clean[col].fillna(method='ffill').fillna(df_clean['yield'].mean())

df_clean = df_clean.dropna(subset=['yield'])
df_clean = df_clean[df_clean['yield'] < 1000]

# CREATE VARIETY-SEASON INTERACTION COLUMN
if 'variety' in df_clean.columns and 'season' in df_clean.columns:
    df_clean['variety_season'] = df_clean['variety'].astype(str) + '_' + df_clean['season'].astype(str)
    print(f"  ✓ Created variety_season interaction feature")
    print(f"  Unique combinations: {df_clean['variety_season'].nunique()}")

print(f"  Clean dataset: {len(df_clean):,} records\n")

# Encode categorical variables INCLUDING VARIETY-SEASON INTERACTION
print("[3/6] Encoding categorical variables...")
categorical_cols = ['variety', 'state', 'season', 'variety_season']
label_encoders = {}

for col in categorical_cols:
    if col in df_clean.columns:
        le = LabelEncoder()
        df_clean[col + '_encoded'] = le.fit_transform(df_clean[col].astype(str))
        label_encoders[col] = le
        print(f"  Encoded {col}: {len(le.classes_)} categories")

numeric_features = [col for col in df_clean.columns 
                   if col not in categorical_cols + ['yield', 'variety_season'] 
                   and not col.endswith('_name')
                   and not col.endswith('_encoded')]

encoded_features = [col + '_encoded' for col in categorical_cols if col in df_clean.columns]
all_features = list(dict.fromkeys(numeric_features + encoded_features))

X = df_clean[all_features].copy()
y = df_clean['yield'].copy()

print(f"\n  Final feature set: {len(all_features)} features")
print(f"  Key features: variety_encoded, season_encoded, variety_season_encoded ✅\n")

# Train-test split
print("[4/6] Splitting and scaling...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"  Training: {len(X_train):,} samples")
print(f"  Test: {len(X_test):,} samples")

X_train = X_train.fillna(0)
X_test = X_test.fillna(0)

scaler = RobustScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

X_train_scaled = pd.DataFrame(X_train_scaled, columns=X_train.columns)
X_test_scaled = pd.DataFrame(X_test_scaled, columns=X_test.columns)

print()

# Train XGBoost with emphasis on variety-season interaction
print("[5/6] Training XGBoost with season awareness...")
print("-"*80)

xgb_model = xgb.XGBRegressor(
    n_estimators=400,           # More trees
    max_depth=10,               # Deeper trees to capture interactions
    learning_rate=0.03,         # Slower learning for better patterns
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=2,         # Less restrictive
    gamma=0.05,                 # Less regularization
    reg_alpha=0.05,
    reg_lambda=0.5,
    random_state=42,
    n_jobs=-1
)

print("\n  Training XGBoost...")
xgb_model.fit(X_train_scaled, y_train)
xgb_pred = xgb_model.predict(X_test_scaled)

xgb_rmse = np.sqrt(mean_squared_error(y_test, xgb_pred))
xgb_mae = mean_absolute_error(y_test, xgb_pred)
xgb_r2 = r2_score(y_test, xgb_pred)

print(f"    RMSE: {xgb_rmse:.2f} t/ha")
print(f"    MAE:  {xgb_mae:.2f} t/ha")
print(f"    R²:   {xgb_r2:.4f}")

# Check feature importance
feature_importance = pd.DataFrame({
    'feature': X_train.columns,
    'importance': xgb_model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nTop 15 Feature Importances:")
print(feature_importance.head(15).to_string(index=False))

# Highlight season-related features
season_features = feature_importance[
    feature_importance['feature'].str.contains('season', case=False)
]
print(f"\n✅ Season-Related Features:")
print(season_features.to_string(index=False))

# Save everything
print("\n[6/6] Saving models and artifacts...")
print("-"*80)

model_dir = Path('models')
model_dir.mkdir(exist_ok=True)

with open(model_dir / 'xgboost_model.pkl', 'wb') as f:
    pickle.dump(xgb_model, f)
print(f"  ✓ Saved: xgboost_model.pkl")

with open(model_dir / 'scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print(f"  ✓ Saved: scaler.pkl")

with open(model_dir / 'label_encoders.pkl', 'wb') as f:
    pickle.dump(label_encoders, f)
print(f"  ✓ Saved: label_encoders.pkl")

with open(model_dir / 'feature_names.json', 'w') as f:
    json.dump(all_features, f, indent=2)
print(f"  ✓ Saved: feature_names.json")

metadata = {
    'best_model': 'xgboost',
    'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'n_samples_train': len(X_train),
    'n_samples_test': len(X_test),
    'n_features': len(all_features),
    'season_feature_added': True,
    'variety_season_interaction_added': True,
    'season_categories': list(label_encoders['season'].classes_) if 'season' in label_encoders else [],
    'variety_season_combinations': list(label_encoders['variety_season'].classes_) if 'variety_season' in label_encoders else [],
    'models_trained': ['xgboost'],
    'test_metrics': {
        'xgboost': {
            'test_rmse': float(xgb_rmse),
            'test_mae': float(xgb_mae),
            'test_r2': float(xgb_r2)
        }
    },
    'feature_importance_top15': feature_importance.head(15).to_dict('records')
}

with open(model_dir / 'model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print(f"  ✓ Saved: model_metadata.json")

print("\n" + "="*80)
print("✅ ENHANCED RETRAINING COMPLETE!")
print("="*80)

# Test season variation
print("\n🧪 Testing Season Variation...")
print("-"*80)

test_inputs = []
for season in ['Kharif', 'Rabi', 'Summer']:
    test_input = pd.DataFrame([{
        'rainfall_mm': 1200,
        'temperature_c': 29,
        'sunlight_hours': 8 if season == 'Kharif' else 9,
        'soil_nitrogen': 200,
        'soil_phosphorus': 40,
        'soil_potassium': 150,
        'ndvi_mean': 0.7,
        'ndvi_max': 0.85,
        'ndvi_min': 0.55,
        'ndvi_std': 0.1,
        'crop_duration_days': 365,
        'irrigation_frequency': 10,
        'prev_year_yield': 85,
        'yield_3yr_avg': 85,
        'yield_5yr_avg': 85,
        'area_hectare': 2.0,
        'variety_encoded': label_encoders['variety'].transform(['Co 86032'])[0] if 'variety' in label_encoders else 0,
        'state_encoded': label_encoders['state'].transform(['Maharashtra'])[0] if 'state' in label_encoders else 0,
        'season_encoded': label_encoders['season'].transform([season])[0] if 'season' in label_encoders else 0,
        'variety_season_encoded': label_encoders['variety_season'].transform([f'Co 86032_{season}'])[0] if 'variety_season' in label_encoders else 0
    }])
    
    # Align columns
    for col in all_features:
        if col not in test_input.columns:
            test_input[col] = 0
    test_input = test_input[all_features]
    
    test_scaled = scaler.transform(test_input)
    pred = xgb_model.predict(test_scaled)[0]
    print(f"{season:10s} -> {pred:.2f} t/ha")

print("\n" + "="*80)
if feature_importance[feature_importance['feature'] == 'variety_season_encoded']['importance'].values[0] > 0.01:
    print("✅ SUCCESS: Model NOW considers variety-season interactions!")
else:
    print("⚠️ Interaction feature importance still low - may need more diverse training data")
print("="*80)

print(f"\nFinished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
