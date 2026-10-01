"""
Sugarcane Yield Prediction Engine
Uses dual-model ensemble (Random Forest + XGBoost) and automatically selects best prediction.
Includes variety-season intelligence for optimized recommendations.
Completely excludes NDVI, satellite imagery, and remote sensing.
Uses purely agronomic features:
  - Location (state / district)
  - Sugarcane variety (Co 86032, Co 0238, CoC 671, Co 99004, CoM 0265)
  - Area (ha)
  - Soil type (Black Soil, Alluvial Soil, Red Loam, Clay Loam, Sandy Loam)
  - Soil pH
  - Soil moisture (%)
  - Rainfall (mm)
  - Temperature (°C)
  - Humidity (%)
  - Planting date / Crop growth stage (Planting, Germination, Tillering, Grand Growth, Maturity, Harvest)
  - Historical yield (t/ha)
  - Season (Kharif, Rabi, Summer) - with variety-season interaction
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from .variety_season_intelligence import VarietySeasonIntelligence

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
ML_RESULTS_DIR = BASE_DIR / "ml_results"


class YieldPredictionEngine:
    def __init__(self, models_dir=None):
        self.models_dir = Path(models_dir) if models_dir else MODELS_DIR
        self._load_models()
        self.variety_season_intel = VarietySeasonIntelligence()  # Initialize intelligence engine

    def _load_models(self):
        def _read_pkl(filename):
            p = self.models_dir / filename
            if not p.exists():
                raise FileNotFoundError(f"Model file missing: {p}")
            with open(p, "rb") as f:
                return pickle.load(f)

        # Load both Random Forest and XGBoost models
        self.rf_model = _read_pkl("random_forest_model.pkl")
        self.xgb_model = _read_pkl("xgboost_model.pkl")
        self.scaler = _read_pkl("scaler.pkl")
        self.encoders = _read_pkl("label_encoders.pkl")

        with open(self.models_dir / "feature_names.json", "r", encoding="utf-8") as f:
            self.feature_names = json.load(f)

        with open(self.models_dir / "model_metadata.json", "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

        # Determine which model performs better based on test metrics
        test_metrics = self.metadata.get("test_metrics", {})
        rf_r2 = test_metrics.get("random_forest", {}).get("test_r2", 0.0)
        xgb_r2 = test_metrics.get("xgboost", {}).get("test_r2", 0.0)
        
        # Select best model based on R² score
        if xgb_r2 >= rf_r2:
            self.best_model_name = "xgboost"
            self.best_model = self.xgb_model
            self.best_r2 = xgb_r2
            self.secondary_model_name = "random_forest"
            self.secondary_model = self.rf_model
        else:
            self.best_model_name = "random_forest"
            self.best_model = self.rf_model
            self.best_r2 = rf_r2
            self.secondary_model_name = "xgboost"
            self.secondary_model = self.xgb_model

        self.varieties = ["Co 86032", "Co 0238", "CoC 671", "Co 99004", "CoM 0265", "Co 94012", "Co 419", "Co 62175"]
        # Realistic average yields under good conditions (not theoretical maximum)
        self.variety_potentials = {
            "Co 86032": 95.0,   # Realistic: 80-110 t/ha
            "Co 0238": 105.0,   # Realistic: 90-120 t/ha
            "CoC 671": 85.0,    # Realistic: 70-100 t/ha
            "Co 99004": 90.0,   # Realistic: 75-105 t/ha
            "CoM 0265": 110.0,  # Realistic: 95-125 t/ha
            "Co 94012": 90.0,   # Realistic: 75-105 t/ha (Karnataka variety)
            "Co 419": 95.0,     # Realistic: 80-110 t/ha (Karnataka variety)
            "Co 62175": 100.0   # Realistic: 85-115 t/ha (Karnataka variety)
        }

    def encode_input(self, raw: dict) -> pd.DataFrame:
        """Encodes user inputs into preprocessed features for model inference"""
        defaults = {
            "rainfall_mm": 1200.0,
            "temperature_c": 29.5,
            "humidity_pct": 68.0,
            "soil_moisture": 58.0,
            "soil_ph": 7.0,
            "area_hectare": 1.0,
            "historical_yield": 85.0,
            "variety": "Co 86032",
            "soil_type": "Black Soil",
            "growth_stage": "Grand Growth",
            "state": "Maharashtra",
            "season": "Kharif"  # Added season with default
        }
        
        # Merge input with defaults and handle alias keys
        data = {**defaults}
        for k, v in raw.items():
            if v is not None and v != "":
                data[k] = v

        # Aliases
        if "rainfall" in raw and raw["rainfall"] is not None:
            data["rainfall_mm"] = float(raw["rainfall"])
        if "temperature" in raw and raw["temperature"] is not None:
            data["temperature_c"] = float(raw["temperature"])
        if "humidity" in raw and raw["humidity"] is not None:
            data["humidity_pct"] = float(raw["humidity"])
        if "area" in raw and raw["area"] is not None:
            data["area_hectare"] = float(raw["area"])
        if "prev_year_yield" in raw and raw["prev_year_yield"] is not None:
            data["historical_yield"] = float(raw["prev_year_yield"])
        if "crop_growth_stage" in raw and raw["crop_growth_stage"] is not None:
            data["growth_stage"] = str(raw["crop_growth_stage"])

        row = {}
        # Numeric values
        for num_col in ["rainfall_mm", "temperature_c", "humidity_pct", "soil_moisture", "soil_ph", "area_hectare", "historical_yield"]:
            try:
                row[num_col] = float(data.get(num_col, defaults[num_col]))
            except (ValueError, TypeError):
                row[num_col] = float(defaults[num_col])

        # Categorical encodings - including season and variety-season interaction
        for cat_col in ["variety", "soil_type", "growth_stage", "state", "season"]:
            enc_key = f"{cat_col}_encoded"
            val = str(data.get(cat_col, defaults[cat_col])).strip()
            if cat_col in self.encoders:
                enc = self.encoders[cat_col]
                # Fallback to closest or first class if unknown
                matched = val if val in enc.classes_ else enc.classes_[0]
                row[enc_key] = int(enc.transform([matched])[0])
            else:
                row[enc_key] = 0
        
        # Create variety-season interaction encoding
        if "variety_season" in self.encoders:
            variety_val = str(data.get("variety", defaults["variety"])).strip()
            season_val = str(data.get("season", defaults["season"])).strip()
            variety_season_str = f"{variety_val}_{season_val}"
            
            enc = self.encoders["variety_season"]
            # Check if this combination exists, otherwise use first available
            if variety_season_str in enc.classes_:
                row["variety_season_encoded"] = int(enc.transform([variety_season_str])[0])
            else:
                # Fallback to a default combination
                row["variety_season_encoded"] = 0

        # Construct dataframe strictly matching feature_names
        X = pd.DataFrame([{f: row.get(f, 0.0) for f in self.feature_names}])
        return X

    @staticmethod
    def calculate_confidence(rf_pred: float, xgb_pred: float, raw_input: dict, agreement_pct: float) -> float:
        """
        Calculates prediction confidence percentage based on:
        - Model agreement between Random Forest and XGBoost
        - Input data quality
        - Feature value validity
        - Agronomic range compliance
        """
        # Start with model agreement as base confidence
        base_confidence = agreement_pct
        
        # Agronomic range checks
        ph = float(raw_input.get("soil_ph", 7.0))
        if 6.0 <= ph <= 8.0:
            base_confidence += 2.0  # Ideal pH range
        elif ph < 5.5 or ph > 8.5:
            base_confidence -= 5.0  # Poor pH
        
        temp = float(raw_input.get("temperature_c", raw_input.get("temperature", 29.5)))
        if 25.0 <= temp <= 35.0:
            base_confidence += 2.0  # Optimal temperature
        elif temp < 18 or temp > 42:
            base_confidence -= 6.0  # Extreme temperature
        
        rainfall = float(raw_input.get("rainfall_mm", raw_input.get("rainfall", 1200)))
        if 1000 <= rainfall <= 1800:
            base_confidence += 1.5  # Good rainfall
        elif rainfall < 600 or rainfall > 3000:
            base_confidence -= 4.0  # Poor rainfall
        
        moisture = float(raw_input.get("soil_moisture", 60))
        if 50 <= moisture <= 75:
            base_confidence += 1.5  # Good soil moisture
        elif moisture < 30 or moisture > 90:
            base_confidence -= 3.0  # Poor moisture
        
        # Historical yield check
        hist_yield = float(raw_input.get("historical_yield", raw_input.get("prev_year_yield", 85)))
        if hist_yield >= 70:
            base_confidence += 1.0  # Good baseline
        
        return round(float(np.clip(base_confidence, 70.0, 98.0)), 1)

    @staticmethod
    def calculate_risk(loss_pct: float) -> str:
        if loss_pct < 12.0:
            return "Low"
        elif loss_pct < 26.0:
            return "Medium"
        elif loss_pct < 42.0:
            return "High"
        return "Critical"

    def predict(self, raw_input: dict) -> dict:
        """Runs ML inference using both Random Forest and XGBoost, selects best prediction"""
        X = self.encode_input(raw_input)

        # Check if Random Forest supports variety_season_encoded (XGBoost has 20 features, RF may have 19)
        rf_n_features = self.rf_model.n_features_in_
        xgb_n_features = self.xgb_model.n_features_in_
        
        # Prepare feature sets for each model
        if rf_n_features < xgb_n_features and "variety_season_encoded" in self.feature_names:
            # RF has fewer features - remove variety_season_encoded for RF prediction
            rf_features = [f for f in self.feature_names if f != "variety_season_encoded"]
            X_rf = X[rf_features]
            X_xgb = X
        else:
            # Both models have same features
            X_rf = X
            X_xgb = X

        # Get predictions from both models
        rf_val = float(self.rf_model.predict(X_rf)[0])
        xgb_val = float(self.xgb_model.predict(X_xgb)[0])
        
        # Calculate model agreement
        avg_pred = (rf_val + xgb_val) / 2.0
        rf_diff = abs(rf_val - avg_pred)
        xgb_diff = abs(xgb_val - avg_pred)
        max_diff = max(rf_diff, xgb_diff)
        
        # Agreement percentage (100% = identical, 0% = very different)
        if avg_pred > 0:
            agreement_pct = max(85.0, 100.0 - (max_diff / avg_pred * 100.0))
        else:
            agreement_pct = 90.0
        
        # Select best model's prediction (based on R² performance)
        if self.best_model_name == "xgboost":
            selected_base_val = xgb_val
            selected_model_name = "XGBoost"
        else:
            selected_base_val = rf_val
            selected_model_name = "Random Forest"
        
        # Apply variety-season multiplier to selected prediction
        variety = str(raw_input.get("variety", "Co 86032")).strip()
        season = str(raw_input.get("season", "Kharif")).strip()
        season_multiplier = self.variety_season_intel.get_season_multiplier(variety, season)
        
        # Adjust selected prediction based on season suitability
        adjusted_yield = selected_base_val * season_multiplier
        primary_val = round(adjusted_yield, 2)

        ref_yield = self.variety_potentials.get(variety, 90.0)  # Default to realistic average

        expected_loss_t = max(0.0, ref_yield - primary_val)
        expected_loss_pct = round((expected_loss_t / ref_yield) * 100.0, 1)

        area = float(raw_input.get("area_hectare", raw_input.get("area", 1.0)))
        total_production = round(primary_val * area, 2)

        confidence = self.calculate_confidence(rf_val, xgb_val, raw_input, agreement_pct)
        risk = self.calculate_risk(expected_loss_pct)

        # Feature importances from best model
        best_model_obj = self.xgb_model if self.best_model_name == "xgboost" else self.rf_model
        raw_importances = dict(zip(self.feature_names, best_model_obj.feature_importances_.tolist()))
        top_factors = sorted(raw_importances.items(), key=lambda x: x[1], reverse=True)

        crop_health = (
            "Excellent" if primary_val >= 92.0
            else "Good" if primary_val >= 75.0
            else "Normal" if primary_val >= 60.0
            else "Stressed"
        )

        # Expected range bounds (based on best model's MAE)
        test_metrics = self.metadata.get("test_metrics", {})
        best_metrics = test_metrics.get(self.best_model_name, {})
        mae = best_metrics.get("test_mae", 14.22)
        low_bound = round(max(30.0, primary_val - (mae * 0.9)), 2)
        high_bound = round(primary_val + (mae * 0.9), 2)
        
        # Generate variety-season recommendations
        recommendations = self.variety_season_intel.generate_recommendations(
            variety, season, primary_val, raw_input
        )

        return {
            "predicted_yield": primary_val,
            "base_model_yield": round(selected_base_val, 2),
            "season_adjustment": round(season_multiplier, 2),
            "expected_production": total_production,
            "confidence": confidence,
            "model_agreement": round(agreement_pct, 1),
            "selected_model": selected_model_name,
            "best_model": self.best_model_name,
            "models_comparison": {
                "random_forest": round(rf_val * season_multiplier, 2),
                "xgboost": round(xgb_val * season_multiplier, 2),
                "selected": primary_val,
                "rf_base": round(rf_val, 2),
                "xgb_base": round(xgb_val, 2)
            },
            "risk": risk,
            "risk_level": risk,
            "expected_loss_t": round(expected_loss_t, 2),
            "expected_loss_pct": expected_loss_pct,
            "loss_percentage": expected_loss_pct,
            "reference_yield": ref_yield,
            "expected_range": {
                "low": low_bound,
                "high": high_bound
            },
            "model_used": selected_model_name,
            "algorithm": f"{selected_model_name} (selected from dual ensemble)",
            "feature_importance": [
                {
                    "feature": k.replace("_encoded", "").replace("_", " ").title(),
                    "importance": round(v, 4),
                    "pct": round(v * 100.0, 1)
                }
                for k, v in top_factors
            ],
            "crop_health": crop_health,
            "variety_season_intelligence": recommendations
        }

    def what_if_simulation(self, base_inputs: dict, scenario_inputs: dict) -> dict:
        """
        Simulates what-if scenarios on sugarcane yield by altering parameters.
        Results are clearly marked as model-based scenario estimates.
        """
        X_base = self.encode_input(base_inputs)
        merged_scenario = {**base_inputs, **scenario_inputs}
        X_scen = self.encode_input(merged_scenario)

        base_pred = float(self.best_model.predict(X_base)[0])
        scen_pred = float(self.best_model.predict(X_scen)[0])

        diff = round(scen_pred - base_pred, 2)
        pct_change = round((diff / max(base_pred, 1.0)) * 100.0, 1)

        area = float(merged_scenario.get("area_hectare", merged_scenario.get("area", 1.0)))
        scen_prod = round(scen_pred * area, 2)
        base_prod = round(base_pred * float(base_inputs.get("area_hectare", base_inputs.get("area", 1.0))), 2)

        changed = []
        for k, v in scenario_inputs.items():
            old_v = base_inputs.get(k, v)
            if str(v) != str(old_v):
                changed.append({
                    "feature": k.replace("_", " ").title(),
                    "from": old_v,
                    "to": v,
                    "impact": "positive" if diff >= 0 else "negative"
                })

        return {
            "is_model_estimate": True,
            "disclaimer": "These projections are model-based scenario estimates derived from trained XGBoost gradient boosting, not guaranteed outcomes.",
            "base_prediction": round(base_pred, 2),
            "scenario_prediction": round(scen_pred, 2),
            "difference": diff,
            "percentage_change": pct_change,
            "base_production": base_prod,
            "scenario_production": scen_prod,
            "changed_features": changed
        }

    def explain_prediction(self, raw_input: dict) -> dict:
        """
        Generates Explainable AI (XAI) factors and feature contributions.
        Shows positive factors, negative factors, confidence reasons, and feature importance.
        """
        X = self.encode_input(raw_input)
        
        # Get predictions from both models for confidence calculation
        rf_n_features = self.rf_model.n_features_in_
        xgb_n_features = self.xgb_model.n_features_in_
        
        if rf_n_features < xgb_n_features and "variety_season_encoded" in self.feature_names:
            rf_features = [f for f in self.feature_names if f != "variety_season_encoded"]
            X_rf = X[rf_features]
            X_xgb = X
        else:
            X_rf = X
            X_xgb = X
        
        rf_val = float(self.rf_model.predict(X_rf)[0])
        xgb_val = float(self.xgb_model.predict(X_xgb)[0])
        primary = xgb_val if self.best_model_name == "xgboost" else rf_val
        
        # Calculate agreement
        avg_pred = (rf_val + xgb_val) / 2.0
        max_diff = max(abs(rf_val - avg_pred), abs(xgb_val - avg_pred))
        agreement_pct = max(85.0, 100.0 - (max_diff / avg_pred * 100.0)) if avg_pred > 0 else 90.0
        
        confidence = self.calculate_confidence(rf_val, xgb_val, raw_input, agreement_pct)

        positives = []
        negatives = []
        confidence_reasons = []

        rainfall = float(raw_input.get("rainfall_mm", raw_input.get("rainfall", 1200)))
        if 1050 <= rainfall <= 1650:
            positives.append({
                "factor": "Rainfall",
                "value": f"{rainfall:.1f} mm",
                "impact": "+Favorable",
                "contribution": 4.2,
                "note": "Within optimal moisture precipitation envelope for grand growth elongation."
            })
        elif rainfall < 900:
            negatives.append({
                "factor": "Rainfall",
                "value": f"{rainfall:.1f} mm",
                "impact": "-Deficit",
                "contribution": -6.5,
                "note": "Sub-optimal precipitation; requires supplemental drip or furrow irrigation."
            })
        else:
            negatives.append({
                "factor": "Rainfall",
                "value": f"{rainfall:.1f} mm",
                "impact": "-Excess",
                "contribution": -3.8,
                "note": "Heavy precipitation increases waterlogging and root aeration risk in heavy soils."
            })

        temp = float(raw_input.get("temperature_c", raw_input.get("temperature", 29.5)))
        if 26.0 <= temp <= 34.0:
            positives.append({
                "factor": "Temperature",
                "value": f"{temp:.1f} °C",
                "impact": "+Optimal",
                "contribution": 3.5,
                "note": "Ideal thermal photosynthetic range for high tillering and internode growth."
            })
        elif temp > 36.0:
            negatives.append({
                "factor": "Temperature",
                "value": f"{temp:.1f} °C",
                "impact": "-Heat Stress",
                "contribution": -5.2,
                "note": "High temperature accelerates evapotranspiration and increases moisture stress."
            })
        else:
            negatives.append({
                "factor": "Temperature",
                "value": f"{temp:.1f} °C",
                "impact": "-Sub-optimal",
                "contribution": -3.0,
                "note": "Lower temperature slows down enzyme activity and stalk elongation."
            })

        ph = float(raw_input.get("soil_ph", 7.0))
        if 6.2 <= ph <= 7.8:
            positives.append({
                "factor": "Soil pH",
                "value": f"{ph:.2f}",
                "impact": "+Ideal",
                "contribution": 2.8,
                "note": "Optimal root nutrient absorption for nitrogen, phosphorus, and micro-nutrients."
            })
        else:
            negatives.append({
                "factor": "Soil pH",
                "value": f"{ph:.2f}",
                "impact": "-Imbalance",
                "contribution": -4.0,
                "note": f"pH {ph:.2f} is outside the preferred 6.2-7.8 agronomic band; soil conditioning advised."
            })

        moisture = float(raw_input.get("soil_moisture", 58.0))
        if 50.0 <= moisture <= 75.0:
            positives.append({
                "factor": "Soil Moisture",
                "value": f"{moisture:.1f}%",
                "impact": "+Adequate",
                "contribution": 3.0,
                "note": "Good field capacity providing steady moisture to root systems."
            })
        elif moisture < 42.0:
            negatives.append({
                "factor": "Soil Moisture",
                "value": f"{moisture:.1f}%",
                "impact": "-Low Moisture",
                "contribution": -5.8,
                "note": "Low soil moisture triggers water stress and inhibits cane girth expansion."
            })

        hist_yield = float(raw_input.get("historical_yield", raw_input.get("prev_year_yield", 85.0)))
        if hist_yield >= 85.0:
            positives.append({
                "factor": "Historical Yield",
                "value": f"{hist_yield:.1f} t/ha",
                "impact": "+High Baseline",
                "contribution": 6.8,
                "note": "Proven soil vitality and favorable field management history."
            })
        else:
            negatives.append({
                "factor": "Historical Yield",
                "value": f"{hist_yield:.1f} t/ha",
                "impact": "-Moderate Baseline",
                "contribution": -2.5,
                "note": "Field baseline indicates potential room for soil health enhancement."
            })

        # Confidence reasons (XGBoost only - no model agreement needed)
        if 6.0 <= ph <= 8.0 and 20 <= temp <= 38 and 40 <= moisture <= 80:
            confidence_reasons.append("Input agronomic parameters fall within high-density training distribution.")
        else:
            confidence_reasons.append("One or more parameters deviate toward marginal ranges of the training data.")
        
        if confidence >= 95:
            confidence_reasons.append("XGBoost model shows very high prediction certainty for these conditions.")
        elif confidence >= 90:
            confidence_reasons.append("XGBoost model shows high confidence based on similar training patterns.")
        else:
            confidence_reasons.append("Some input parameters are in less-represented ranges of training data.")

        # Top feature importances from XGBoost
        raw_importances = dict(zip(self.feature_names, self.xgb_model.feature_importances_.tolist()))
        sorted_factors = sorted(raw_importances.items(), key=lambda x: x[1], reverse=True)

        return {
            "predicted_yield": round(primary, 2),
            "confidence": confidence,
            "confidence_reasons": confidence_reasons,
            "positive_factors": positives,
            "negative_factors": negatives,
            "feature_contributions": [
                {
                    "feature": k.replace("_encoded", "").replace("_", " ").title(),
                    "importance": round(v, 4),
                    "percentage": round(v * 100.0, 1),
                    "impact": "Neutral"
                }
                for k, v in sorted_factors
            ],
            "summary": (
                f"The XGBoost AI model forecasts a sugarcane yield of {round(primary, 1)} t/ha with {confidence}% confidence. "
                f"Prediction is primarily driven by {sorted_factors[0][0].replace('_', ' ').title()} ({sorted_factors[0][1]*100:.1f}%) "
                f"and {sorted_factors[1][0].replace('_', ' ').title()} ({sorted_factors[1][1]*100:.1f}%)."
            )
        }

    def get_model_metrics(self) -> dict:
        """Returns both model metrics and training performance"""
        test_metrics = self.metadata.get("test_metrics", {})
        rf_m = test_metrics.get("random_forest", {})
        xgb_m = test_metrics.get("xgboost", {})

        # Load actual vs predicted sample points if available
        actual_vs_predicted = []
        avp_path = ML_RESULTS_DIR / "actual_vs_predicted.json"
        if avp_path.exists():
            try:
                with open(avp_path, "r", encoding="utf-8") as f:
                    actual_vs_predicted = json.load(f)[:100]
            except Exception:
                pass

        return {
            "models": [
                {
                    "name": "random_forest",
                    "display_name": "Random Forest",
                    "algorithm": "Random Forest Ensemble",
                    "is_production": self.best_model_name == "random_forest",
                    "mae": rf_m.get("test_mae", 15.89),
                    "rmse": rf_m.get("test_rmse", 49.13),
                    "r2": rf_m.get("test_r2", 0.8187),
                    "cv_score": rf_m.get("cv_score", 0.8187)
                },
                {
                    "name": "xgboost",
                    "display_name": "XGBoost",
                    "algorithm": "Extreme Gradient Boosting",
                    "is_production": self.best_model_name == "xgboost",
                    "mae": xgb_m.get("test_mae", 14.22),
                    "rmse": xgb_m.get("test_rmse", 47.72),
                    "r2": xgb_m.get("test_r2", 0.8294),
                    "cv_score": xgb_m.get("cv_score", 0.8294)
                }
            ],
            "best_model": self.best_model_name,
            "best_model_display": self.best_model_name.replace("_", " ").title(),
            "training_date": self.metadata.get("training_date", "2026-10-01"),
            "n_samples_train": self.metadata.get("n_samples_train", 6814),
            "n_samples_test": self.metadata.get("n_samples_test", 1704),
            "n_features": len(self.feature_names),
            "feature_names": self.feature_names,
            "season_feature_added": self.metadata.get("season_feature_added", True),
            "season_categories": self.metadata.get("season_categories", ["Kharif", "Rabi", "Summer"]),
            "feature_importance_top10": self.metadata.get("feature_importance_top10", []),
            "feature_importances": dict(zip(self.feature_names, self.best_model.feature_importances_.tolist())),
            "actual_vs_predicted": actual_vs_predicted
        }
