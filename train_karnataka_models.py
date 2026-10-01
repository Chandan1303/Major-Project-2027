"""
Train ML models with Karnataka varieties included
Reads from SUGARCANE_AGRONOMIC_ML_DATASET.csv (with Karnataka varieties)
Trains RandomForest and XGBoost models for yield prediction
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Paths
DATA_PATH = Path("final_dataset/SUGARCANE_AGRONOMIC_ML_DATASET.csv")
MODEL_DIR = Path("ml_models")
MODEL_DIR.mkdir(exist_ok=True)

print("🌾 Training Sugarcane Yield Prediction Models (WITH Karnataka Varieties)")
print("=" * 80)

# Load data
print(f"\n📂 Loading dataset from {DATA_PATH}...")
df = pd.read_csv(DATA_PATH)
print(f"   Loaded {len(df)} records")

# Show variety distribution
print("\n📊 Variety Distribution:")
print(df.groupby('variety').size().sort_values(ascending=False))

print("\n🏠 Karnataka Varieties:")
karnataka_df = df[df['state'] == 'Karnataka']
print(karnataka_df.groupby('variety').size())

# Prepare features
print("\n⚙️  Encoding categorical features...")

# Label encoders
encoders = {}
categorical_cols = ['state', 'variety', 'soil_type', 'growth_stage']

for col in categorical_cols:
    encoders[col] = LabelEncoder()
    df[f'{col}_encoded'] = encoders[col].fit_transform(df[col])
    print(f"   Encoded {col}: {list(encoders[col].classes_[:5])}{'...' if len(encoders[col].classes_) > 5 else ''}")

# Feature columns
feature_cols = [
    'rainfall_mm', 'temperature_c', 'humidity_pct',
    'soil_moisture', 'soil_ph', 'area_hectare', 'historical_yield',
    'variety_encoded', 'soil_type_encoded', 'growth_stage_encoded', 'state_encoded'
]

X = df[feature_cols]
y = df['yield']

# Train/test split
print(f"\n📊 Train/Test Split (80/20)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"   Train: {len(X_train)} samples, Test: {len(X_test)} samples")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train Random Forest
print("\n🌲 Training Random Forest...")
rf_model = RandomForestRegressor(
    n_estimators=200,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)

rf_mae = mean_absolute_error(y_test, rf_pred)
rf_rmse = np.sqrt(mean_squared_error(y_test, rf_pred))
rf_r2 = r2_score(y_test, rf_pred)

print(f"   MAE:  {rf_mae:.2f} t/ha")
print(f"   RMSE: {rf_rmse:.2f} t/ha")
print(f"   R²:   {rf_r2:.4f}")

# Train XGBoost
print("\n🚀 Training XGBoost...")
xgb_model = XGBRegressor(
    n_estimators=200,
    max_depth=8,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1
)
xgb_model.fit(X_train, y_train)
xgb_pred = xgb_model.predict(X_test)

xgb_mae = mean_absolute_error(y_test, xgb_pred)
xgb_rmse = np.sqrt(mean_squared_error(y_test, xgb_pred))
xgb_r2 = r2_score(y_test, xgb_pred)

print(f"   MAE:  {xgb_mae:.2f} t/ha")
print(f"   RMSE: {xgb_rmse:.2f} t/ha")
print(f"   R²:   {xgb_r2:.4f}")

# Cross-validation
print("\n🔄 5-Fold Cross-Validation...")
rf_cv_scores = cross_val_score(rf_model, X_train, y_train, cv=5, scoring='r2')
xgb_cv_scores = cross_val_score(xgb_model, X_train, y_train, cv=5, scoring='r2')

print(f"   Random Forest CV R²: {rf_cv_scores.mean():.4f} (±{rf_cv_scores.std():.4f})")
print(f"   XGBoost CV R²:       {xgb_cv_scores.mean():.4f} (±{xgb_cv_scores.std():.4f})")

# Save models
print("\n💾 Saving models...")
joblib.dump(rf_model, MODEL_DIR / "random_forest_model.pkl")
joblib.dump(xgb_model, MODEL_DIR / "xgboost_model.pkl")
joblib.dump(scaler, MODEL_DIR / "feature_scaler.pkl")

# Save encoders
for col, encoder in encoders.items():
    joblib.dump(encoder, MODEL_DIR / f"{col}_label_encoder.pkl")

# Save metadata
metadata = {
    "models": [
        {
            "name": "random_forest",
            "mae": float(rf_mae),
            "rmse": float(rf_rmse),
            "r2": float(rf_r2),
            "cv_r2_mean": float(rf_cv_scores.mean()),
            "cv_r2_std": float(rf_cv_scores.std()),
            "is_production": True
        },
        {
            "name": "xgboost",
            "mae": float(xgb_mae),
            "rmse": float(xgb_rmse),
            "r2": float(xgb_r2),
            "cv_r2_mean": float(xgb_cv_scores.mean()),
            "cv_r2_std": float(xgb_cv_scores.std()),
            "is_production": False
        }
    ],
    "features": feature_cols,
    "varieties": list(encoders['variety'].classes_),
    "states": list(encoders['state'].classes_),
    "soil_types": list(encoders['soil_type'].classes_),
    "growth_stages": list(encoders['growth_stage'].classes_)
}

import json
with open(MODEL_DIR / "model_metadata.json", 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"   ✅ Models saved to {MODEL_DIR}/")
print(f"   ✅ Supported varieties: {metadata['varieties']}")

print("\n" + "=" * 80)
print("✅ Training Complete!")
print(f"🎯 Best Model: Random Forest (R² = {rf_r2:.4f})")
print(f"📊 Dataset: {len(df)} samples")
print(f"🌾 Varieties: {len(metadata['varieties'])}")
print(f"🏠 States: {len(metadata['states'])}")
