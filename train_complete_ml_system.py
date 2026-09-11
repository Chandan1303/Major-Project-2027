"""
Complete ML Training System for Sugarcane Yield Prediction
===========================================================

Features:
1. Yield Prediction (XGBoost + Random Forest)
2. Confidence Score (prediction intervals)
3. Explainability (SHAP values)
4. Variety Comparison
5. Yield-Loss Analysis
6. Weather Impact Analysis

Team: Dayanand, Chandan (Lead), Harsha, Mohammad
"""

import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# ML libraries
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb

# Explainability
import shap

# Visualization
import matplotlib.pyplot as plt
import seaborn as sns

print("="*80)
print("COMPLETE ML TRAINING SYSTEM - SUGARCANE YIELD PREDICTION")
print("="*80)
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# =============================================================================
# STEP 1: Load and Prepare Data
# =============================================================================
print("[1/8] Loading dataset...")
print("-"*80)

data_path = Path('final_dataset/SUGARCANE_COMPLETE_ML_DATASET.csv')
df = pd.read_csv(data_path)
print(f"  Loaded: {len(df):,} records, {len(df.columns)} features")

# Create output directories
model_dir = Path('models')
model_dir.mkdir(exist_ok=True)

results_dir = Path('ml_results')
results_dir.mkdir(exist_ok=True)

plots_dir = results_dir / 'plots'
plots_dir.mkdir(exist_ok=True)

# =============================================================================
# STEP 2: Feature Engineering
# =============================================================================
print("\n[2/8] Feature engineering...")
print("-"*80)

# Select features for modeling
feature_cols = [
    'rainfall_mm', 'temperature_c', 'sunlight_hours',
    'soil_nitrogen', 'soil_phosphorus', 'soil_potassium',
    'ndvi_mean', 'ndvi_max', 'ndvi_min', 'ndvi_std',
    'crop_duration_days', 'irrigation_frequency',
    'prev_year_yield', 'yield_3yr_avg', 'yield_5yr_avg',
    'area_hectare', 'variety', 'state', 'season'
]

# Keep only available features
available_features = [col for col in feature_cols if col in df.columns]
print(f"  Available features: {len(available_features)}")

# Handle missing values
df_clean = df[available_features + ['yield']].copy()

# Fill missing NDVI with median
for col in ['ndvi_mean', 'ndvi_max', 'ndvi_min', 'ndvi_std']:
    if col in df_clean.columns:
        df_clean[col] = df_clean[col].fillna(df_clean[col].median())

# Fill missing weather with mean by variety
for col in ['rainfall_mm', 'temperature_c', 'sunlight_hours']:
    if col in df_clean.columns:
        df_clean[col] = df_clean.groupby('variety')[col].transform(
            lambda x: x.fillna(x.mean())
        )

# Fill missing soil with mean
for col in ['soil_nitrogen', 'soil_phosphorus', 'soil_potassium']:
    if col in df_clean.columns:
        df_clean[col] = df_clean[col].fillna(df_clean[col].mean())

# Fill missing historical with forward fill
for col in ['prev_year_yield', 'yield_3yr_avg', 'yield_5yr_avg']:
    if col in df_clean.columns:
        df_clean[col] = df_clean[col].fillna(method='ffill').fillna(df_clean['yield'].mean())

# Drop rows with missing target
df_clean = df_clean.dropna(subset=['yield'])

# Remove outliers (yield > 1000 t/ha is unrealistic)
df_clean = df_clean[df_clean['yield'] < 1000]

print(f"  Clean dataset: {len(df_clean):,} records")
print(f"  Features after cleaning: {len([c for c in df_clean.columns if c != 'yield'])}")

# =============================================================================
# STEP 3: Encode Categorical Variables
# =============================================================================
print("\n[3/8] Encoding categorical variables...")
print("-"*80)

# Encode categorical features
categorical_cols = ['variety', 'state', 'season']
label_encoders = {}

for col in categorical_cols:
    if col in df_clean.columns:
        le = LabelEncoder()
        df_clean[col + '_encoded'] = le.fit_transform(df_clean[col].astype(str))
        label_encoders[col] = le
        print(f"  Encoded {col}: {len(le.classes_)} categories")

# Prepare feature matrix
# Drop original categorical columns, keep only encoded versions
numeric_features = [col for col in df_clean.columns 
                   if col not in categorical_cols + ['yield'] 
                   and not col.endswith('_name')
                   and not col.endswith('_encoded')]

encoded_features = [col + '_encoded' for col in categorical_cols if col in df_clean.columns]
all_features = numeric_features + encoded_features

# Remove any duplicates
all_features = list(dict.fromkeys(all_features))

X = df_clean[all_features].copy()
y = df_clean['yield'].copy()

print(f"\n  Final feature set: {len(all_features)} features")
print(f"  Target (yield) shape: {y.shape}")

# =============================================================================
# STEP 4: Train-Test Split
# =============================================================================
print("\n[4/8] Splitting data...")
print("-"*80)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"  Training set: {len(X_train):,} samples")
print(f"  Test set: {len(X_test):,} samples")

# Fill any remaining NaN values before scaling
X_train = X_train.fillna(0)
X_test = X_test.fillna(0)

# Scale features for better performance
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Convert back to DataFrame for feature names
X_train_scaled = pd.DataFrame(X_train_scaled, columns=X_train.columns)
X_test_scaled = pd.DataFrame(X_test_scaled, columns=X_test.columns)

print(f"  Data cleaned - No NaN values remaining")

# =============================================================================
# STEP 5: Train Models (Linear Regression, Random Forest, XGBoost)
# =============================================================================
print("\n[5/8] Training all 3 models...")
print("-"*80)

models = {}
predictions = {}
metrics = {}

# ===== 1. LINEAR REGRESSION =====
print("\n  [1/3] Training Linear Regression...")
lr_model = LinearRegression(n_jobs=-1)

lr_model.fit(X_train_scaled, y_train)
lr_pred = lr_model.predict(X_test_scaled)

models['linear_regression'] = lr_model
predictions['linear_regression'] = lr_pred

# Calculate metrics
lr_mse = mean_squared_error(y_test, lr_pred)
lr_rmse = np.sqrt(lr_mse)
lr_mae = mean_absolute_error(y_test, lr_pred)
lr_r2 = r2_score(y_test, lr_pred)

metrics['linear_regression'] = {
    'MSE': lr_mse,
    'RMSE': lr_rmse,
    'MAE': lr_mae,
    'R2': lr_r2
}

print(f"        RMSE: {lr_rmse:.2f} t/ha")
print(f"        MAE:  {lr_mae:.2f} t/ha")
print(f"        R2:   {lr_r2:.4f}")

# ===== 2. RANDOM FOREST =====
print("\n  [2/3] Training Random Forest...")
rf_model = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_train_scaled, y_train)
rf_pred = rf_model.predict(X_test_scaled)

models['random_forest'] = rf_model
predictions['random_forest'] = rf_pred

# Calculate metrics
rf_mse = mean_squared_error(y_test, rf_pred)
rf_rmse = np.sqrt(rf_mse)
rf_mae = mean_absolute_error(y_test, rf_pred)
rf_r2 = r2_score(y_test, rf_pred)

metrics['random_forest'] = {
    'MSE': rf_mse,
    'RMSE': rf_rmse,
    'MAE': rf_mae,
    'R2': rf_r2
}

print(f"        RMSE: {rf_rmse:.2f} t/ha")
print(f"        MAE:  {rf_mae:.2f} t/ha")
print(f"        R2:   {rf_r2:.4f}")

# ===== 3. XGBOOST =====
print("\n  [3/3] Training XGBoost...")
xgb_model = xgb.XGBRegressor(
    n_estimators=200,
    max_depth=8,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1
)

xgb_model.fit(X_train_scaled, y_train)
xgb_pred = xgb_model.predict(X_test_scaled)

models['xgboost'] = xgb_model
predictions['xgboost'] = xgb_pred

# Calculate metrics
xgb_mse = mean_squared_error(y_test, xgb_pred)
xgb_rmse = np.sqrt(xgb_mse)
xgb_mae = mean_absolute_error(y_test, xgb_pred)
xgb_r2 = r2_score(y_test, xgb_pred)

metrics['xgboost'] = {
    'MSE': xgb_mse,
    'RMSE': xgb_rmse,
    'MAE': xgb_mae,
    'R2': xgb_r2
}

print(f"        RMSE: {xgb_rmse:.2f} t/ha")
print(f"        MAE:  {xgb_mae:.2f} t/ha")
print(f"        R2:   {xgb_r2:.4f}")

# ===== MODEL COMPARISON =====
print("\n" + "="*80)
print("MODEL COMPARISON - ALL 3 MODELS")
print("="*80)

comparison_df = pd.DataFrame(metrics).T
comparison_df = comparison_df.round(4)
comparison_df = comparison_df.sort_values('R2', ascending=False)

print("\n" + comparison_df.to_string())

# Select best model based on R2 score
best_model_name = comparison_df.index[0]
best_model = models[best_model_name]

print(f"\n{'='*80}")
print(f"BEST MODEL: {best_model_name.upper()}")
print(f"  R2 Score: {metrics[best_model_name]['R2']:.4f}")
print(f"  RMSE: {metrics[best_model_name]['RMSE']:.2f} t/ha")
print(f"  MAE: {metrics[best_model_name]['MAE']:.2f} t/ha")
print(f"{'='*80}")

# =============================================================================
# STEP 6: Feature Importance & Explainability
# =============================================================================
print("\n[6/8] Calculating feature importance and SHAP values...")
print("-"*80)

# Feature importance
if best_model_name == 'xgboost':
    feature_importance = pd.DataFrame({
        'feature': X_train.columns,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)
else:
    feature_importance = pd.DataFrame({
        'feature': X_train.columns,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)

print("\n  Top 10 Important Features:")
print(feature_importance.head(10).to_string(index=False))

# Save feature importance
feature_importance.to_csv(results_dir / 'feature_importance.csv', index=False)

# SHAP values for explainability
print("\n  Calculating SHAP values...")
explainer = shap.TreeExplainer(best_model)
shap_values = explainer.shap_values(X_test_scaled)

print(f"    SHAP values shape: {shap_values.shape}")

# =============================================================================
# STEP 7: Confidence Scoring & Yield Loss Analysis
# =============================================================================
print("\n[7/8] Calculating confidence scores and yield loss...")
print("-"*80)

# Calculate prediction intervals using ensemble predictions
if best_model_name == 'xgboost':
    # Use all trees in XGBoost for uncertainty
    pred_all = []
    for i in range(0, best_model.n_estimators, 10):
        model_subset = xgb.XGBRegressor()
        model_subset.__dict__.update(best_model.__dict__)
        pred_all.append(best_model.predict(X_test_scaled))
    
    pred_std = np.std(pred_all, axis=0)
else:
    # Use individual tree predictions for Random Forest
    tree_predictions = np.array([tree.predict(X_test_scaled) for tree in best_model.estimators_])
    pred_std = np.std(tree_predictions, axis=0)
    pred_mean = np.mean(tree_predictions, axis=0)

# Confidence score (inverse of prediction std, normalized)
max_std = np.percentile(pred_std, 95)
confidence_scores = 100 * (1 - pred_std / max_std)
confidence_scores = np.clip(confidence_scores, 0, 100)

print(f"  Average confidence: {confidence_scores.mean():.1f}%")

# Yield loss analysis (compare to potential yield)
best_pred = predictions[best_model_name]
expected_yield = df_clean['yield'].quantile(0.75)  # 75th percentile as potential
yield_loss = expected_yield - best_pred
yield_loss_pct = (yield_loss / expected_yield * 100).clip(0, 100)

# Categorize loss risk
loss_risk = pd.cut(yield_loss_pct, 
                   bins=[-1, 10, 30, 100],
                   labels=['Low', 'Medium', 'High'])

print(f"\n  Yield Loss Analysis:")
print(f"    Low risk:    {(loss_risk == 'Low').sum()} samples")
print(f"    Medium risk: {(loss_risk == 'Medium').sum()} samples")
print(f"    High risk:   {(loss_risk == 'High').sum()} samples")

# =============================================================================
# STEP 8: Variety Comparison
# =============================================================================
print("\n[8/8] Variety comparison analysis...")
print("-"*80)

# Get variety information from test set
test_indices = X_test.index
variety_test = df_clean.loc[test_indices, 'variety'] if 'variety' in df_clean.columns else None

if variety_test is not None:
    variety_performance = pd.DataFrame({
        'variety': variety_test.values,
        'actual_yield': y_test.values,
        'predicted_yield': best_pred,
        'confidence': confidence_scores,
        'loss_risk': loss_risk
    })
    
    variety_stats = variety_performance.groupby('variety').agg({
        'actual_yield': 'mean',
        'predicted_yield': 'mean',
        'confidence': 'mean'
    }).round(2)
    
    print("\n  Variety Performance Summary:")
    print(variety_stats.to_string())
    
    variety_stats.to_csv(results_dir / 'variety_comparison.csv')
else:
    print("  Variety information not available")

# =============================================================================
# Save Everything
# =============================================================================
print("\n" + "="*80)
print("SAVING MODELS AND RESULTS")
print("="*80)

# Save models
with open(model_dir / 'linear_regression_model.pkl', 'wb') as f:
    pickle.dump(models['linear_regression'], f)
print(f"\n  Saved: {model_dir / 'linear_regression_model.pkl'}")

with open(model_dir / 'random_forest_model.pkl', 'wb') as f:
    pickle.dump(models['random_forest'], f)
print(f"  Saved: {model_dir / 'random_forest_model.pkl'}")

with open(model_dir / 'xgboost_model.pkl', 'wb') as f:
    pickle.dump(models['xgboost'], f)
print(f"  Saved: {model_dir / 'xgboost_model.pkl'}")

# Save scaler and encoders
with open(model_dir / 'scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print(f"  Saved: {model_dir / 'scaler.pkl'}")

with open(model_dir / 'label_encoders.pkl', 'wb') as f:
    pickle.dump(label_encoders, f)
print(f"  Saved: {model_dir / 'label_encoders.pkl'}")

# Save feature names
with open(model_dir / 'feature_names.json', 'w') as f:
    json.dump(all_features, f, indent=2)
print(f"  Saved: {model_dir / 'feature_names.json'}")

# Save model metadata
metadata = {
    'best_model': best_model_name,
    'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'n_samples_train': len(X_train),
    'n_samples_test': len(X_test),
    'n_features': len(all_features),
    'metrics': {k: {mk: float(mv) for mk, mv in v.items()} for k, v in metrics.items()},
    'feature_importance_top10': feature_importance.head(10).to_dict('records')
}

with open(model_dir / 'model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print(f"  Saved: {model_dir / 'model_metadata.json'}")

# Save test results
test_results = pd.DataFrame({
    'actual_yield': y_test.values,
    'predicted_yield_lr': predictions['linear_regression'],
    'predicted_yield_rf': predictions['random_forest'],
    'predicted_yield_xgb': predictions['xgboost'],
    'confidence_score': confidence_scores,
    'yield_loss_risk': loss_risk
})

test_results.to_csv(results_dir / 'test_predictions.csv', index=False)
print(f"  Saved: {results_dir / 'test_predictions.csv'}")

# =============================================================================
# Create Visualizations
# =============================================================================
print("\n" + "="*80)
print("CREATING VISUALIZATIONS")
print("="*80)

# 1. Actual vs Predicted
plt.figure(figsize=(10, 6))
plt.scatter(y_test, best_pred, alpha=0.5)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
plt.xlabel('Actual Yield (t/ha)')
plt.ylabel('Predicted Yield (t/ha)')
plt.title(f'{best_model_name.upper()} - Actual vs Predicted Yield')
plt.tight_layout()
plt.savefig(plots_dir / 'actual_vs_predicted.png', dpi=300)
plt.close()
print(f"\n  Saved: {plots_dir / 'actual_vs_predicted.png'}")

# 2. Feature Importance
plt.figure(figsize=(12, 8))
top_features = feature_importance.head(15)
plt.barh(top_features['feature'], top_features['importance'])
plt.xlabel('Importance')
plt.title('Top 15 Feature Importance')
plt.tight_layout()
plt.savefig(plots_dir / 'feature_importance.png', dpi=300)
plt.close()
print(f"  Saved: {plots_dir / 'feature_importance.png'}")

# 3. Residuals
residuals = y_test.values - best_pred
plt.figure(figsize=(10, 6))
plt.scatter(best_pred, residuals, alpha=0.5)
plt.axhline(y=0, color='r', linestyle='--')
plt.xlabel('Predicted Yield (t/ha)')
plt.ylabel('Residuals')
plt.title('Residual Plot')
plt.tight_layout()
plt.savefig(plots_dir / 'residuals.png', dpi=300)
plt.close()
print(f"  Saved: {plots_dir / 'residuals.png'}")

# =============================================================================
# Final Summary
# =============================================================================
print("\n" + "="*80)
print("TRAINING COMPLETE!")
print("="*80)

print(f"\nBest Model: {best_model_name.upper()}")
print(f"  R2 Score: {metrics[best_model_name]['R2']:.4f}")
print(f"  RMSE: {metrics[best_model_name]['RMSE']:.2f} t/ha")
print(f"  MAE: {metrics[best_model_name]['MAE']:.2f} t/ha")

print(f"\nModels saved in: {model_dir}")
print(f"Results saved in: {results_dir}")
print(f"Plots saved in: {plots_dir}")

print(f"\nFinished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("\n" + "="*80)
print("READY FOR FLASK API INTEGRATION!")
print("="*80)
