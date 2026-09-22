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
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, KFold
from sklearn.preprocessing import LabelEncoder, StandardScaler, RobustScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
import xgboost as xgb
from scipy import stats

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

# Scale features for better performance (RobustScaler is more resistant to outliers)
scaler = RobustScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Convert back to DataFrame for feature names
X_train_scaled = pd.DataFrame(X_train_scaled, columns=X_train.columns)
X_test_scaled = pd.DataFrame(X_test_scaled, columns=X_test.columns)

print(f"  Data cleaned - No NaN values remaining")
print(f"  Using RobustScaler for outlier resistance")

# =============================================================================
# STEP 5: Cross-Validation Setup (Robust Evaluation)
# =============================================================================
print("\n[5/8] Setting up cross-validation framework...")
print("-"*80)

# Use K-Fold cross-validation with 5 folds
kfold = KFold(n_splits=5, shuffle=True, random_state=42)
print(f"  Using {kfold.n_splits}-Fold Cross-Validation")
print(f"  Scoring metrics: RMSE, MAE, R²")

def evaluate_model_with_cv(model, X, y, model_name):
    """
    Evaluate model using cross-validation with MEDIAN aggregation
    MEDIAN is more robust than MEAN when dealing with outliers
    """
    print(f"\n  Evaluating {model_name}...")
    
    # Negative MSE for sklearn (higher is better convention)
    cv_mse = -cross_val_score(model, X, y, cv=kfold, 
                               scoring='neg_mean_squared_error', n_jobs=-1)
    cv_rmse = np.sqrt(cv_mse)
    
    cv_mae = -cross_val_score(model, X, y, cv=kfold, 
                               scoring='neg_mean_absolute_error', n_jobs=-1)
    
    cv_r2 = cross_val_score(model, X, y, cv=kfold, 
                            scoring='r2', n_jobs=-1)
    
    # Use MEDIAN for robust aggregation (less affected by outlier folds)
    median_rmse = np.median(cv_rmse)
    median_mae = np.median(cv_mae)
    median_r2 = np.median(cv_r2)
    
    # Also calculate IQR for understanding spread
    iqr_rmse = stats.iqr(cv_rmse)
    iqr_mae = stats.iqr(cv_mae)
    iqr_r2 = stats.iqr(cv_r2)
    
    # Print fold-wise results
    print(f"    Cross-Validation Results (5 folds):")
    print(f"      RMSE per fold: {', '.join([f'{x:.2f}' for x in cv_rmse])}")
    print(f"      MAE per fold:  {', '.join([f'{x:.2f}' for x in cv_mae])}")
    print(f"      R² per fold:   {', '.join([f'{x:.4f}' for x in cv_r2])}")
    
    print(f"\n    MEDIAN Scores (Robust Aggregation):")
    print(f"      RMSE: {median_rmse:.2f} t/ha (IQR: {iqr_rmse:.2f})")
    print(f"      MAE:  {median_mae:.2f} t/ha (IQR: {iqr_mae:.2f})")
    print(f"      R²:   {median_r2:.4f} (IQR: {iqr_r2:.4f})")
    
    return {
        'cv_rmse_scores': cv_rmse,
        'cv_mae_scores': cv_mae,
        'cv_r2_scores': cv_r2,
        'median_rmse': median_rmse,
        'median_mae': median_mae,
        'median_r2': median_r2,
        'iqr_rmse': iqr_rmse,
        'iqr_mae': iqr_mae,
        'iqr_r2': iqr_r2,
        'mean_rmse': np.mean(cv_rmse),  # Also keep mean for comparison
        'mean_mae': np.mean(cv_mae),
        'mean_r2': np.mean(cv_r2)
    }

# =============================================================================
# STEP 6: Train and Evaluate Multiple Models with Cross-Validation
# =============================================================================
print("\n[6/8] Training models with cross-validation...")
print("-"*80)

models = {}
predictions = {}
metrics = {}
cv_results = {}

# ===== 1. LINEAR REGRESSION (BASELINE) =====
print("\n  [1/5] Linear Regression (Baseline)...")
lr_model = LinearRegression(n_jobs=-1)
cv_results['linear_regression'] = evaluate_model_with_cv(lr_model, X_train_scaled, y_train, "Linear Regression")

# Train on full training set for final predictions
lr_model.fit(X_train_scaled, y_train)
lr_pred = lr_model.predict(X_test_scaled)
models['linear_regression'] = lr_model
predictions['linear_regression'] = lr_pred

# Test set metrics
lr_rmse = np.sqrt(mean_squared_error(y_test, lr_pred))
lr_mae = mean_absolute_error(y_test, lr_pred)
lr_r2 = r2_score(y_test, lr_pred)

metrics['linear_regression'] = {
    'test_rmse': lr_rmse,
    'test_mae': lr_mae,
    'test_r2': lr_r2,
    'cv_median_rmse': cv_results['linear_regression']['median_rmse'],
    'cv_median_r2': cv_results['linear_regression']['median_r2']
}

print(f"    Final Test Set Performance:")
print(f"      RMSE: {lr_rmse:.2f} t/ha")
print(f"      MAE:  {lr_mae:.2f} t/ha")
print(f"      R²:   {lr_r2:.4f}")

# ===== 2. RIDGE REGRESSION (L2 REGULARIZATION) =====
print("\n  [2/5] Ridge Regression (L2 Regularization)...")
ridge_model = Ridge(alpha=1.0, random_state=42)
cv_results['ridge'] = evaluate_model_with_cv(ridge_model, X_train_scaled, y_train, "Ridge Regression")

ridge_model.fit(X_train_scaled, y_train)
ridge_pred = ridge_model.predict(X_test_scaled)
models['ridge'] = ridge_model
predictions['ridge'] = ridge_pred

ridge_rmse = np.sqrt(mean_squared_error(y_test, ridge_pred))
ridge_mae = mean_absolute_error(y_test, ridge_pred)
ridge_r2 = r2_score(y_test, ridge_pred)

metrics['ridge'] = {
    'test_rmse': ridge_rmse,
    'test_mae': ridge_mae,
    'test_r2': ridge_r2,
    'cv_median_rmse': cv_results['ridge']['median_rmse'],
    'cv_median_r2': cv_results['ridge']['median_r2']
}

print(f"    Final Test Set Performance:")
print(f"      RMSE: {ridge_rmse:.2f} t/ha")
print(f"      MAE:  {ridge_mae:.2f} t/ha")
print(f"      R²:   {ridge_r2:.4f}")

# ===== 3. RANDOM FOREST =====
print("\n  [3/5] Random Forest (Ensemble)...")
rf_model = RandomForestRegressor(
    n_estimators=300,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1
)
cv_results['random_forest'] = evaluate_model_with_cv(rf_model, X_train_scaled, y_train, "Random Forest")

rf_model.fit(X_train_scaled, y_train)
rf_pred = rf_model.predict(X_test_scaled)
models['random_forest'] = rf_model
predictions['random_forest'] = rf_pred

rf_rmse = np.sqrt(mean_squared_error(y_test, rf_pred))
rf_mae = mean_absolute_error(y_test, rf_pred)
rf_r2 = r2_score(y_test, rf_pred)

metrics['random_forest'] = {
    'test_rmse': rf_rmse,
    'test_mae': rf_mae,
    'test_r2': rf_r2,
    'cv_median_rmse': cv_results['random_forest']['median_rmse'],
    'cv_median_r2': cv_results['random_forest']['median_r2']
}

print(f"    Final Test Set Performance:")
print(f"      RMSE: {rf_rmse:.2f} t/ha")
print(f"      MAE:  {rf_mae:.2f} t/ha")
print(f"      R²:   {rf_r2:.4f}")

# ===== 4. GRADIENT BOOSTING =====
print("\n  [4/5] Gradient Boosting...")
gb_model = GradientBoostingRegressor(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    subsample=0.8,
    random_state=42
)
cv_results['gradient_boosting'] = evaluate_model_with_cv(gb_model, X_train_scaled, y_train, "Gradient Boosting")

gb_model.fit(X_train_scaled, y_train)
gb_pred = gb_model.predict(X_test_scaled)
models['gradient_boosting'] = gb_model
predictions['gradient_boosting'] = gb_pred

gb_rmse = np.sqrt(mean_squared_error(y_test, gb_pred))
gb_mae = mean_absolute_error(y_test, gb_pred)
gb_r2 = r2_score(y_test, gb_pred)

metrics['gradient_boosting'] = {
    'test_rmse': gb_rmse,
    'test_mae': gb_mae,
    'test_r2': gb_r2,
    'cv_median_rmse': cv_results['gradient_boosting']['median_rmse'],
    'cv_median_r2': cv_results['gradient_boosting']['median_r2']
}

print(f"    Final Test Set Performance:")
print(f"      RMSE: {gb_rmse:.2f} t/ha")
print(f"      MAE:  {gb_mae:.2f} t/ha")
print(f"      R²:   {gb_r2:.4f}")

# ===== 5. XGBOOST =====
print("\n  [5/5] XGBoost (Optimized Gradient Boosting)...")
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
cv_results['xgboost'] = evaluate_model_with_cv(xgb_model, X_train_scaled, y_train, "XGBoost")

xgb_model.fit(X_train_scaled, y_train)
xgb_pred = xgb_model.predict(X_test_scaled)
models['xgboost'] = xgb_model
predictions['xgboost'] = xgb_pred

xgb_rmse = np.sqrt(mean_squared_error(y_test, xgb_pred))
xgb_mae = mean_absolute_error(y_test, xgb_pred)
xgb_r2 = r2_score(y_test, xgb_pred)

metrics['xgboost'] = {
    'test_rmse': xgb_rmse,
    'test_mae': xgb_mae,
    'test_r2': xgb_r2,
    'cv_median_rmse': cv_results['xgboost']['median_rmse'],
    'cv_median_r2': cv_results['xgboost']['median_r2']
}

print(f"    Final Test Set Performance:")
print(f"      RMSE: {xgb_rmse:.2f} t/ha")
print(f"      MAE:  {xgb_mae:.2f} t/ha")
print(f"      R²:   {xgb_r2:.4f}")

# ===== MODEL COMPARISON =====
print("\n" + "="*80)
print("MODEL COMPARISON - CROSS-VALIDATION vs TEST SET")
print("="*80)

# Create comparison DataFrame
comparison_data = []
for model_name in metrics.keys():
    comparison_data.append({
        'Model': model_name.replace('_', ' ').title(),
        'CV_Median_R²': cv_results[model_name]['median_r2'],
        'CV_Median_RMSE': cv_results[model_name]['median_rmse'],
        'Test_R²': metrics[model_name]['test_r2'],
        'Test_RMSE': metrics[model_name]['test_rmse'],
        'Test_MAE': metrics[model_name]['test_mae'],
        'CV_IQR_R²': cv_results[model_name]['iqr_r2']
    })

comparison_df = pd.DataFrame(comparison_data)
comparison_df = comparison_df.sort_values('CV_Median_R²', ascending=False)
comparison_df = comparison_df.round(4)

print("\n" + comparison_df.to_string(index=False))

# Select best model based on CV Median R2 (most robust metric)
best_idx = comparison_df['CV_Median_R²'].idxmax()
best_model_display = comparison_df.loc[best_idx, 'Model']
best_model_name = [k for k in metrics.keys() if k.replace('_', ' ').title() == best_model_display][0]
best_model = models[best_model_name]

print(f"\n{'='*80}")
print(f"BEST MODEL (Based on CV Median R²): {best_model_name.upper()}")
print(f"  CV Median R²: {cv_results[best_model_name]['median_r2']:.4f}")
print(f"  CV Median RMSE: {cv_results[best_model_name]['median_rmse']:.2f} t/ha")
print(f"  Test R²: {metrics[best_model_name]['test_r2']:.4f}")
print(f"  Test RMSE: {metrics[best_model_name]['test_rmse']:.2f} t/ha")
print(f"  Test MAE: {metrics[best_model_name]['test_mae']:.2f} t/ha")
print(f"{'='*80}")

# Save CV results
cv_summary = pd.DataFrame([
    {
        'model': name,
        'cv_median_rmse': res['median_rmse'],
        'cv_median_mae': res['median_mae'],
        'cv_median_r2': res['median_r2'],
        'cv_mean_rmse': res['mean_rmse'],
        'cv_mean_mae': res['mean_mae'],
        'cv_mean_r2': res['mean_r2'],
        'cv_iqr_rmse': res['iqr_rmse'],
        'cv_iqr_r2': res['iqr_r2']
    }
    for name, res in cv_results.items()
])
cv_summary.to_csv(results_dir / 'cross_validation_results.csv', index=False)
print(f"\n  Saved CV results: {results_dir / 'cross_validation_results.csv'}")

# =============================================================================
# STEP 7: Feature Importance & Explainability
# =============================================================================
print("\n[7/8] Calculating feature importance and SHAP values...")
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
# STEP 8: Confidence Scoring & Yield Loss Analysis
# =============================================================================
print("\n[8/8] Calculating confidence scores and yield loss...")
print("-"*80)

# Calculate prediction intervals using ensemble predictions
best_pred = predictions[best_model_name]

if best_model_name in ['random_forest']:
    # Use individual tree predictions for Random Forest
    tree_predictions = np.array([tree.predict(X_test_scaled) for tree in best_model.estimators_])
    pred_std = np.std(tree_predictions, axis=0)
elif best_model_name in ['xgboost', 'gradient_boosting']:
    # For boosting models, use ensemble of all available predictions
    ensemble_preds = [predictions[m] for m in ['xgboost', 'gradient_boosting', 'random_forest'] 
                      if m in predictions]
    pred_std = np.std(ensemble_preds, axis=0)
else:
    # For linear models, use residual-based estimation
    residuals = np.abs(y_train.values - best_model.predict(X_train_scaled))
    pred_std = np.full(len(X_test), np.std(residuals))

# Confidence score (inverse of prediction std, normalized)
max_std = np.percentile(pred_std, 95)
confidence_scores = 100 * (1 - pred_std / max_std)
confidence_scores = np.clip(confidence_scores, 0, 100)

print(f"  Average confidence: {confidence_scores.mean():.1f}%")

# Yield loss analysis (compare to potential yield)
expected_yield = df_clean['yield'].quantile(0.75)  # 75th percentile as potential
yield_loss = expected_yield - best_pred
yield_loss_pct = (yield_loss / expected_yield * 100).clip(0, 100)

# Categorize loss risk
loss_risk = pd.cut(yield_loss_pct, 
                   bins=[-1, 10, 30, 100],
                   labels=['Low', 'Medium', 'High'])

print(f"\n  Yield Loss Analysis:")
print(f"    Low risk:    {(loss_risk == 'Low').sum()} samples ({(loss_risk == 'Low').sum()/len(loss_risk)*100:.1f}%)")
print(f"    Medium risk: {(loss_risk == 'Medium').sum()} samples ({(loss_risk == 'Medium').sum()/len(loss_risk)*100:.1f}%)")
print(f"    High risk:   {(loss_risk == 'High').sum()} samples ({(loss_risk == 'High').sum()/len(loss_risk)*100:.1f}%)")

# Variety Comparison (part of Step 8)
print("\n  Variety comparison analysis...")
print("  " + "-"*76)

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
for model_name in models.keys():
    model_path = model_dir / f'{model_name}_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(models[model_name], f)
    print(f"  Saved: {model_path}")

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

# Save model metadata with CV results
metadata = {
    'best_model': best_model_name,
    'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'cross_validation': {
        'n_folds': 5,
        'aggregation_method': 'median',
        'reason': 'Median is more robust to outliers than mean'
    },
    'n_samples_train': len(X_train),
    'n_samples_test': len(X_test),
    'n_features': len(all_features),
    'models_trained': list(models.keys()),
    'test_metrics': {k: {mk: float(mv) for mk, mv in v.items()} for k, v in metrics.items()},
    'cv_metrics': {
        name: {
            'median_r2': float(res['median_r2']),
            'median_rmse': float(res['median_rmse']),
            'median_mae': float(res['median_mae']),
            'mean_r2': float(res['mean_r2']),
            'mean_rmse': float(res['mean_rmse']),
            'iqr_r2': float(res['iqr_r2'])
        }
        for name, res in cv_results.items()
    },
    'feature_importance_top10': feature_importance.head(10).to_dict('records')
}

with open(model_dir / 'model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print(f"  Saved: {model_dir / 'model_metadata.json'}")

# Save test results with all model predictions
test_results_dict = {
    'actual_yield': y_test.values,
    'confidence_score': confidence_scores,
    'yield_loss_risk': loss_risk
}

# Add predictions from all models
for model_name in predictions.keys():
    test_results_dict[f'predicted_yield_{model_name}'] = predictions[model_name]

test_results = pd.DataFrame(test_results_dict)
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

# 4. Cross-Validation Comparison (Median vs Mean)
plt.figure(figsize=(14, 8))
model_names = [name.replace('_', ' ').title() for name in cv_results.keys()]
x = np.arange(len(model_names))
width = 0.35

median_r2 = [cv_results[name]['median_r2'] for name in cv_results.keys()]
mean_r2 = [cv_results[name]['mean_r2'] for name in cv_results.keys()]

plt.bar(x - width/2, median_r2, width, label='Median R² (Robust)', alpha=0.8)
plt.bar(x + width/2, mean_r2, width, label='Mean R²', alpha=0.8)

plt.xlabel('Models')
plt.ylabel('R² Score')
plt.title('Cross-Validation: Median vs Mean R² Scores')
plt.xticks(x, model_names, rotation=45, ha='right')
plt.legend()
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(plots_dir / 'cv_median_vs_mean.png', dpi=300)
plt.close()
print(f"  Saved: {plots_dir / 'cv_median_vs_mean.png'}")

# 5. Model Comparison Boxplot (showing CV fold variance)
plt.figure(figsize=(14, 8))
cv_data_for_plot = []
model_labels = []

for name in cv_results.keys():
    cv_data_for_plot.append(cv_results[name]['cv_r2_scores'])
    model_labels.append(name.replace('_', ' ').title())

plt.boxplot(cv_data_for_plot, labels=model_labels)
plt.ylabel('R² Score')
plt.title('Cross-Validation R² Score Distribution (5 Folds)')
plt.xticks(rotation=45, ha='right')
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(plots_dir / 'cv_boxplot.png', dpi=300)
plt.close()
print(f"  Saved: {plots_dir / 'cv_boxplot.png'}")

# =============================================================================
# Final Summary
# =============================================================================
print("\n" + "="*80)
print("TRAINING COMPLETE!")
print("="*80)

print(f"\n🎯 Best Model: {best_model_name.upper()}")
print(f"\n📊 Cross-Validation Results (5-Fold with MEDIAN aggregation):")
print(f"   Median R²:    {cv_results[best_model_name]['median_r2']:.4f}")
print(f"   Median RMSE:  {cv_results[best_model_name]['median_rmse']:.2f} t/ha")
print(f"   Median MAE:   {cv_results[best_model_name]['median_mae']:.2f} t/ha")
print(f"   IQR (R²):     {cv_results[best_model_name]['iqr_r2']:.4f}")

print(f"\n📈 Test Set Performance:")
print(f"   R²:    {metrics[best_model_name]['test_r2']:.4f}")
print(f"   RMSE:  {metrics[best_model_name]['test_rmse']:.2f} t/ha")
print(f"   MAE:   {metrics[best_model_name]['test_mae']:.2f} t/ha")

print(f"\n✅ Models Trained:")
for i, model_name in enumerate(models.keys(), 1):
    print(f"   {i}. {model_name.replace('_', ' ').title()}")

print(f"\n💾 Outputs:")
print(f"   Models:        {model_dir}")
print(f"   Results:       {results_dir}")
print(f"   Plots:         {plots_dir}")
print(f"   CV Summary:    {results_dir / 'cross_validation_results.csv'}")

print(f"\n⚡ Key Improvements:")
print(f"   ✓ 5-Fold Cross-Validation with MEDIAN aggregation (robust to outliers)")
print(f"   ✓ {len(models)} models trained (Linear, Ridge, RF, GB, XGBoost)")
print(f"   ✓ RobustScaler used (resistant to outliers)")
print(f"   ✓ Regularization added (Ridge, XGBoost L1/L2)")
print(f"   ✓ Enhanced hyperparameters for all models")

print(f"\nFinished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("\n" + "="*80)
print("READY FOR FLASK API INTEGRATION!")
print("="*80)
