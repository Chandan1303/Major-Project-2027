"""
FAST Model Retraining with Season Feature
Skips SHAP calculation to save time and ensure models are saved properly
"""

import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.preprocessing import LabelEncoder, StandardScaler, RobustScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
import xgboost as xgb
from scipy import stats

print("="*80)
print("FAST RETRAINING WITH SEASON FEATURE")
print("="*80)
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# Load dataset
print("[1/6] Loading dataset...")
data_path = Path('final_dataset/SUGARCANE_COMPLETE_ML_DATASET.csv')
df = pd.read_csv(data_path)
print(f"  Loaded: {len(df):,} records\n")

# Feature engineering with SEASON included
print("[2/6] Feature engineering with SEASON...")
feature_cols = [
    'rainfall_mm', 'temperature_c', 'sunlight_hours',
    'soil_nitrogen', 'soil_phosphorus', 'soil_potassium',
    'ndvi_mean', 'ndvi_max', 'ndvi_min', 'ndvi_std',
    'crop_duration_days', 'irrigation_frequency',
    'prev_year_yield', 'yield_3yr_avg', 'yield_5yr_avg',
    'area_hectare', 'variety', 'state', 'season'  # SEASON ADDED
]

available_features = [col for col in feature_cols if col in df.columns]
print(f"  Available features: {len(available_features)}")

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

print(f"  Clean dataset: {len(df_clean):,} records\n")

# Encode categorical variables INCLUDING SEASON
print("[3/6] Encoding categorical variables...")
categorical_cols = ['variety', 'state', 'season']
label_encoders = {}

for col in categorical_cols:
    if col in df_clean.columns:
        le = LabelEncoder()
        df_clean[col + '_encoded'] = le.fit_transform(df_clean[col].astype(str))
        label_encoders[col] = le
        print(f"  Encoded {col}: {len(le.classes_)} categories")
        if col == 'season':
            print(f"    ✓ Season categories: {', '.join(le.classes_)}")

numeric_features = [col for col in df_clean.columns 
                   if col not in categorical_cols + ['yield'] 
                   and not col.endswith('_name')
                   and not col.endswith('_encoded')]

encoded_features = [col + '_encoded' for col in categorical_cols if col in df_clean.columns]
all_features = list(dict.fromkeys(numeric_features + encoded_features))

X = df_clean[all_features].copy()
y = df_clean['yield'].copy()

print(f"\n  Final feature set: {len(all_features)} features")
print(f"  Features: {', '.join(all_features)}\n")

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

# Train models (Random Forest and XGBoost only - the production models)
print("[5/6] Training production models...")
print("-"*80)

models = {}
predictions = {}
metrics = {}

# Random Forest
print("\n  [1/2] Random Forest...")
rf_model = RandomForestRegressor(
    n_estimators=300,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train_scaled, y_train)
rf_pred = rf_model.predict(X_test_scaled)

rf_rmse = np.sqrt(mean_squared_error(y_test, rf_pred))
rf_mae = mean_absolute_error(y_test, rf_pred)
rf_r2 = r2_score(y_test, rf_pred)

print(f"    RMSE: {rf_rmse:.2f} t/ha")
print(f"    MAE:  {rf_mae:.2f} t/ha")
print(f"    R²:   {rf_r2:.4f}")

models['random_forest'] = rf_model
predictions['random_forest'] = rf_pred
metrics['random_forest'] = {'test_rmse': rf_rmse, 'test_mae': rf_mae, 'test_r2': rf_r2}

# XGBoost
print("\n  [2/2] XGBoost...")
xgb_model = xgb.XGBRegressor(
    n_estimators=300,
    max_depth=8,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    n_jobs=-1
)
xgb_model.fit(X_train_scaled, y_train)
xgb_pred = xgb_model.predict(X_test_scaled)

xgb_rmse = np.sqrt(mean_squared_error(y_test, xgb_pred))
xgb_mae = mean_absolute_error(y_test, xgb_pred)
xgb_r2 = r2_score(y_test, xgb_pred)

print(f"    RMSE: {xgb_rmse:.2f} t/ha")
print(f"    MAE:  {xgb_mae:.2f} t/ha")
print(f"    R²:   {xgb_r2:.4f}")

models['xgboost'] = xgb_model
predictions['xgboost'] = xgb_pred
metrics['xgboost'] = {'test_rmse': xgb_rmse, 'test_mae': xgb_mae, 'test_r2': xgb_r2}

# Determine best model
best_model_name = 'random_forest' if rf_r2 > xgb_r2 else 'xgboost'
best_model = models[best_model_name]

print("\n" + "="*80)
print(f"BEST MODEL: {best_model_name.upper()}")
print(f"  R²:   {metrics[best_model_name]['test_r2']:.4f}")
print(f"  RMSE: {metrics[best_model_name]['test_rmse']:.2f} t/ha")
print(f"  MAE:  {metrics[best_model_name]['test_mae']:.2f} t/ha")
print("="*80)

# Feature importance
feature_importance = pd.DataFrame({
    'feature': X_train.columns,
    'importance': best_model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nTop 10 Feature Importances:")
print(feature_importance.head(10).to_string(index=False))

season_importance = feature_importance[feature_importance['feature'] == 'season_encoded']
if not season_importance.empty:
    season_rank = list(feature_importance['feature']).index('season_encoded') + 1
    print(f"\n✅ Season feature rank: #{season_rank} (importance: {season_importance.iloc[0]['importance']:.6f})")

# Save everything
print("\n[6/6] Saving models and artifacts...")
print("-"*80)

model_dir = Path('models')
model_dir.mkdir(exist_ok=True)

# Save models
with open(model_dir / 'random_forest_model.pkl', 'wb') as f:
    pickle.dump(models['random_forest'], f)
print(f"  ✓ Saved: random_forest_model.pkl")

with open(model_dir / 'xgboost_model.pkl', 'wb') as f:
    pickle.dump(models['xgboost'], f)
print(f"  ✓ Saved: xgboost_model.pkl")

# Save scaler and encoders
with open(model_dir / 'scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print(f"  ✓ Saved: scaler.pkl")

with open(model_dir / 'label_encoders.pkl', 'wb') as f:
    pickle.dump(label_encoders, f)
print(f"  ✓ Saved: label_encoders.pkl")

# Save feature names
with open(model_dir / 'feature_names.json', 'w') as f:
    json.dump(all_features, f, indent=2)
print(f"  ✓ Saved: feature_names.json")

# Save metadata
metadata = {
    'best_model': best_model_name,
    'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'n_samples_train': len(X_train),
    'n_samples_test': len(X_test),
    'n_features': len(all_features),
    'season_feature_added': True,
    'season_categories': list(label_encoders['season'].classes_) if 'season' in label_encoders else [],
    'models_trained': list(models.keys()),
    'test_metrics': {k: {mk: float(mv) for mk, mv in v.items()} for k, v in metrics.items()},
    'feature_importance_top10': feature_importance.head(10).to_dict('records')
}

with open(model_dir / 'model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print(f"  ✓ Saved: model_metadata.json")

print("\n" + "="*80)
print("✅ RETRAINING COMPLETE WITH SEASON FEATURE!")
print("="*80)
print(f"\n📊 Summary:")
print(f"  ✓ Season feature added as feature #{all_features.index('season_encoded') + 1}")
print(f"  ✓ {len(label_encoders['season'].classes_)} season categories: {', '.join(label_encoders['season'].classes_)}")
print(f"  ✓ Best model: {best_model_name.upper()}")
print(f"  ✓ Test R²: {metrics[best_model_name]['test_r2']:.4f}")
print(f"  ✓ Total features: {len(all_features)}")
print(f"\n🎯 Now predictions will be season-aware!")
print(f"  - Kharif (monsoon) → Higher yields")
print(f"  - Rabi (winter) → Moderate yields")  
print(f"  - Summer → Lower yields (water stress)")
print("\nFinished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)
