"""
Sugarcane Yield Prediction Engine
Loads and serves predictions from real trained XGBoost, Random Forest, and Linear Regression models.
Includes ensemble forecasting, confidence intervals, risk categorization, and feature explanations.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

class YieldPredictionEngine:
    def __init__(self, models_dir=None):
        self.models_dir = Path(models_dir) if models_dir else MODELS_DIR
        self._load_models()

    def _load_models(self):
        def _read_pkl(filename):
            p = self.models_dir / filename
            if not p.exists():
                raise FileNotFoundError(f"Model file missing: {p}")
            with open(p, "rb") as f:
                return pickle.load(f)

        self.xgb_model = _read_pkl("xgboost_model.pkl")
        self.rf_model = _read_pkl("random_forest_model.pkl")
        self.lr_model = _read_pkl("linear_regression_model.pkl")
        self.scaler = _read_pkl("scaler.pkl")
        self.encoders = _read_pkl("label_encoders.pkl")

        with open(self.models_dir / "feature_names.json", "r", encoding="utf-8") as f:
            self.feature_names = json.load(f)

        with open(self.models_dir / "model_metadata.json", "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

        self.best_model_name = self.metadata.get("best_model", "xgboost")
        self.best_model = self.xgb_model if self.best_model_name == "xgboost" else self.rf_model

        self.varieties = ["Co 86032", "Co 0238", "CoC 671", "Co 99004", "CoM 0265"]
        self.variety_potentials = {
            "Co 86032": 118.5,
            "Co 0238": 132.0,
            "CoC 671": 102.0,
            "Co 99004": 112.0,
            "CoM 0265": 142.0
        }

    def encode_input(self, raw: dict) -> pd.DataFrame:
        """Encodes user inputs into preprocessed features for model inference"""
        defaults = {
            "rainfall_mm": 1200.0,
            "temperature_c": 29.5,
            "sunlight_hours": 8.0,
            "soil_nitrogen": 160.0,
            "soil_phosphorus": 60.0,
            "soil_potassium": 80.0,
            "ndvi_mean": 0.60,      # Baseline neutral parameter for pre-trained weights
            "ndvi_max": 0.75,
            "ndvi_min": 0.40,
            "ndvi_std": 0.10,
            "crop_duration_days": 360,
            "irrigation_frequency": 3,
            "prev_year_yield": 75.0,
            "yield_3yr_avg": 75.0,
            "yield_5yr_avg": 75.0,
            "area_hectare": 1.0,
            "variety": "Co 86032",
            "state": "Maharashtra",
            "season": "Annual"
        }
        row = {**defaults, **raw}

        # Map variety if given
        variety_val = str(row.get("variety", "Co 86032"))
        if "variety" in self.encoders:
            enc = self.encoders["variety"]
            val = variety_val if variety_val in enc.classes_ else enc.classes_[0]
            row["variety_encoded"] = int(enc.transform([val])[0])

        # Map state if given
        state_val = str(row.get("state", "Maharashtra"))
        if "state" in self.encoders:
            enc = self.encoders["state"]
            val = state_val if state_val in enc.classes_ else enc.classes_[0]
            row["state_encoded"] = int(enc.transform([val])[0])

        # Map season if given
        season_val = str(row.get("season", "Annual"))
        if "season" in self.encoders:
            enc = self.encoders["season"]
            val = season_val if season_val in enc.classes_ else enc.classes_[0]
            row["season_encoded"] = int(enc.transform([val])[0])

        # Construct dataframe adhering strictly to feature_names order
        X = pd.DataFrame([{f: float(row.get(f, 0.0)) for f in self.feature_names}])
        X = X.fillna(0.0)
        X_scaled = self.scaler.transform(X)
        return pd.DataFrame(X_scaled, columns=self.feature_names)

    @staticmethod
    def calculate_confidence(predictions: list) -> float:
        """Calculates prediction confidence percentage from ensemble variance"""
        arr = np.array(predictions)
        std = np.std(arr)
        return round(float(np.clip(100.0 * (1.0 - std / 45.0), 60.0, 98.5)), 1)

    @staticmethod
    def calculate_risk(loss_pct: float) -> str:
        if loss_pct < 10.0:
            return "Low"
        elif loss_pct < 25.0:
            return "Medium"
        elif loss_pct < 40.0:
            return "High"
        return "Critical"

    def predict(self, raw_input: dict) -> dict:
        """Runs real ML inference using trained XGBoost and Random Forest models"""
        X = self.encode_input(raw_input)

        xgb_val = float(self.xgb_model.predict(X)[0])
        rf_val = float(self.rf_model.predict(X)[0])
        lr_val = float(self.lr_model.predict(X)[0])

        # Ensemble prediction (45% XGBoost, 45% Random Forest, 10% Linear Regression)
        ensemble_val = round((xgb_val * 0.45 + rf_val * 0.45 + lr_val * 0.10), 2)
        primary_val = round(xgb_val if self.best_model_name == "xgboost" else rf_val, 2)

        variety = raw_input.get("variety", "Co 86032")
        ref_yield = self.variety_potentials.get(variety, 110.0)
        expected_loss_t = max(0.0, ref_yield - primary_val)
        expected_loss_pct = round((expected_loss_t / ref_yield) * 100.0, 1)

        area = float(raw_input.get("area_hectare", raw_input.get("area", 1.0)))
        total_production = round(primary_val * area, 2)
        confidence = self.calculate_confidence([xgb_val, rf_val, lr_val])
        risk = self.calculate_risk(expected_loss_pct)

        # Feature importances from best model
        importances = dict(zip(self.feature_names, self.best_model.feature_importances_.tolist()))
        top_factors = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:8]

        crop_health = (
            "Excellent" if primary_val >= 90.0
            else "Healthy" if primary_val >= 70.0
            else "Moderate" if primary_val >= 55.0
            else "Stressed"
        )

        return {
            "predicted_yield": primary_val,
            "ensemble_yield": ensemble_val,
            "expected_production": total_production,
            "confidence": confidence,
            "risk": risk,
            "expected_loss_t": round(expected_loss_t, 2),
            "expected_loss_pct": expected_loss_pct,
            "expected_range": {
                "low": round(primary_val * 0.92, 2),
                "high": round(primary_val * 1.08, 2)
            },
            "model_used": self.best_model_name.upper(),
            "ensemble": {
                "xgboost": round(xgb_val, 2),
                "random_forest": round(rf_val, 2),
                "linear_regression": round(lr_val, 2),
                "weighted_ensemble": ensemble_val
            },
            "feature_importance": [
                {
                    "feature": k.replace("_encoded", "").replace("_", " ").title(),
                    "importance": round(v, 4),
                    "pct": round(v * 100.0, 1)
                }
                for k, v in top_factors
            ],
            "crop_health": crop_health
        }

    def what_if_simulation(self, base_inputs: dict, scenario_inputs: dict) -> dict:
        """Simulates what-if impact on sugarcane yield given modifications"""
        X_base = self.encode_input(base_inputs)
        merged_scenario = {**base_inputs, **scenario_inputs}
        X_scen = self.encode_input(merged_scenario)

        base_pred = float(self.best_model.predict(X_base)[0])
        scen_pred = float(self.best_model.predict(X_scen)[0])

        diff = round(scen_pred - base_pred, 2)
        pct_change = round((diff / max(base_pred, 1.0)) * 100.0, 1)

        changed = []
        for k, v in scenario_inputs.items():
            old_v = base_inputs.get(k, v)
            if v != old_v:
                changed.append({
                    "feature": k.replace("_", " ").title(),
                    "from": old_v,
                    "to": v,
                    "impact": "positive" if diff >= 0 else "negative"
                })

        return {
            "base_prediction": round(base_pred, 2),
            "scenario_prediction": round(scen_pred, 2),
            "difference": diff,
            "percentage_change": pct_change,
            "changed_features": changed
        }

    def explain_prediction(self, raw_input: dict) -> dict:
        """Provides agronomic explanations for model predictions based on input limits"""
        X = self.encode_input(raw_input)
        primary = float(self.best_model.predict(X)[0])
        
        positives = []
        negatives = []

        rainfall = float(raw_input.get("rainfall_mm", 1200))
        if 1100 <= rainfall <= 1600:
            positives.append({"factor": "Rainfall", "value": f"{rainfall} mm", "note": "Optimal water precipitation range"})
        elif rainfall < 1000:
            negatives.append({"factor": "Rainfall", "value": f"{rainfall} mm", "note": "Below optimal; irrigation recommended"})
        else:
            negatives.append({"factor": "Rainfall", "value": f"{rainfall} mm", "note": "Excess rainfall; watch drainage"})

        temp = float(raw_input.get("temperature_c", 30))
        if 27 <= temp <= 34:
            positives.append({"factor": "Temperature", "value": f"{temp} °C", "note": "Optimal thermal window for photosynthesis"})
        else:
            negatives.append({"factor": "Temperature", "value": f"{temp} °C", "note": "Temperature deviating from ideal 27-34°C"})

        ph = float(raw_input.get("soil_ph", 6.8))
        if 6.2 <= ph <= 7.8:
            positives.append({"factor": "Soil pH", "value": f"{ph}", "note": "Ideal root nutrient availability range"})
        else:
            negatives.append({"factor": "Soil pH", "value": f"{ph}", "note": "Outside optimal 6.2-7.8 range"})

        return {
            "predicted_yield": round(primary, 2),
            "positive_factors": positives,
            "negative_factors": negatives,
            "summary": (
                f"The system forecasts a yield of {round(primary, 1)} t/ha. "
                f"{'Soil and weather parameters are favourable for healthy sugarcane growth.' if primary >= 75 else 'Certain limiting agronomic factors require mitigation.'}"
            )
        }

    def get_model_metrics(self) -> dict:
        """Returns actual trained model metrics and cross-validation performance"""
        cv = self.metadata.get("cv_metrics", {})
        tm = self.metadata.get("test_metrics", {})
        models = []
        for name in ["xgboost", "random_forest", "linear_regression"]:
            c = cv.get(name, {})
            t = tm.get(name, {})
            models.append({
                "name": name,
                "display_name": name.replace("_", " ").title(),
                "is_production": name == self.best_model_name,
                "cv_median_r2": round(c.get("median_r2", 0.0), 4),
                "cv_median_rmse": round(c.get("median_rmse", 0.0), 2),
                "cv_median_mae": round(c.get("median_mae", 0.0), 2),
                "test_r2": round(t.get("test_r2", 0.0), 4),
                "test_rmse": round(t.get("test_rmse", 0.0), 2),
                "test_mae": round(t.get("test_mae", 0.0), 2),
            })
        return {
            "models": models,
            "best_model": self.best_model_name,
            "training_date": self.metadata.get("training_date", "2026"),
            "n_features": self.metadata.get("n_features", len(self.feature_names)),
            "feature_importance": self.metadata.get("feature_importance_top10", [])
        }
