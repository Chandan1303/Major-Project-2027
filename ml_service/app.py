"""
SugarYield AI — Flask ML Microservice
======================================
Serves predictions, what-if simulation, variety comparison,
feature importance, and model performance from trained models.

Port: 5001  (Node.js backend proxies /api/ml/* → here)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle, json, os, traceback
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ─── Load models ──────────────────────────────────────────────────────────────
BASE = Path(__file__).parent.parent / "models"

def load_pkl(name):
    p = BASE / name
    if not p.exists():
        raise FileNotFoundError(f"Model file not found: {p}")
    with open(p, "rb") as f:
        return pickle.load(f)

rf_model    = load_pkl("random_forest_model.pkl")
xgb_model   = load_pkl("xgboost_model.pkl")
lr_model    = load_pkl("linear_regression_model.pkl")
scaler      = load_pkl("scaler.pkl")
encoders    = load_pkl("label_encoders.pkl")

with open(BASE / "feature_names.json") as f:
    FEATURE_NAMES = json.load(f)

with open(BASE / "model_metadata.json") as f:
    META = json.load(f)

BEST_MODEL_NAME = META.get("best_model", "xgboost")
BEST_MODEL = xgb_model if BEST_MODEL_NAME == "xgboost" else rf_model

VARIETIES   = ["Co 86032", "Co 0238", "CoC 671", "Co 99004", "CoM 0265"]
VARIETY_POT = {"Co 86032": 85, "Co 0238": 92, "CoC 671": 88,
               "Co 99004": 82, "CoM 0265": 91}

print(f"✅  ML Microservice ready — best model: {BEST_MODEL_NAME.upper()}")


# ─── Helpers ──────────────────────────────────────────────────────────────────
def encode_input(raw: dict) -> pd.DataFrame:
    defaults = {
        "rainfall_mm": 1200, "temperature_c": 30, "sunlight_hours": 8,
        "soil_nitrogen": 150, "soil_phosphorus": 60, "soil_potassium": 75,
        "ndvi_mean": 0.6, "ndvi_max": 0.75, "ndvi_min": 0.4, "ndvi_std": 0.1,
        "crop_duration_days": 360, "irrigation_frequency": 3,
        "prev_year_yield": 70, "yield_3yr_avg": 70, "yield_5yr_avg": 70,
        "area_hectare": 1, "variety": "Co 86032",
        "state": "Karnataka", "season": "Annual"
    }
    row = {**defaults, **raw}

    for col, enc in encoders.items():
        val = str(row.get(col, enc.classes_[0]))
        if val not in enc.classes_:
            val = enc.classes_[0]
        row[f"{col}_encoded"] = int(enc.transform([val])[0])

    X = pd.DataFrame([{f: row.get(f, 0) for f in FEATURE_NAMES}])
    X = X.fillna(0)
    X_scaled = scaler.transform(X)
    return pd.DataFrame(X_scaled, columns=FEATURE_NAMES)


def confidence_from_ensemble(preds: list) -> float:
    arr = np.array(preds)
    std = np.std(arr)
    return round(float(np.clip(100 * (1 - std / 50), 55, 98)), 1)


def risk_label(loss_pct: float) -> str:
    if loss_pct < 10:   return "Low"
    if loss_pct < 25:   return "Medium"
    if loss_pct < 40:   return "High"
    return "Critical"


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok", "best_model": BEST_MODEL_NAME,
                    "models_loaded": ["xgboost", "random_forest", "linear_regression"]})


@app.post("/predict")
def predict():
    try:
        body = request.get_json(force=True) or {}
        X = encode_input(body)

        xgb_pred = float(xgb_model.predict(X)[0])
        rf_pred  = float(rf_model.predict(X)[0])
        lr_pred  = float(lr_model.predict(X)[0])

        # Weighted ensemble — XGB & RF are far better than LR
        ensemble = round((xgb_pred * 0.45 + rf_pred * 0.45 + lr_pred * 0.10), 2)
        primary  = round(xgb_pred if BEST_MODEL_NAME == "xgboost" else rf_pred, 2)

        conf     = confidence_from_ensemble([xgb_pred, rf_pred, lr_pred])
        ref_yld  = 85.0          # benchmark reference yield
        loss_t   = max(0, ref_yld - primary)
        loss_pct = round((loss_t / ref_yld) * 100, 1)
        risk     = risk_label(loss_pct)

        area     = float(body.get("area_hectare", 1))
        total    = round(primary * area, 2)

        # SHAP-style importance (from model feature importances)
        fi = dict(zip(FEATURE_NAMES,
                      BEST_MODEL.feature_importances_.tolist()))

        top_factors = sorted(fi.items(), key=lambda x: x[1], reverse=True)[:8]

        return jsonify({
            "success": True,
            "data": {
                "predicted_yield": primary,
                "ensemble_yield": ensemble,
                "expected_production": total,
                "confidence": conf,
                "risk": risk,
                "expected_loss_t": round(loss_t, 2),
                "expected_loss_pct": loss_pct,
                "expected_range": {
                    "low":  round(primary * 0.92, 2),
                    "high": round(primary * 1.08, 2)
                },
                "model_used": BEST_MODEL_NAME,
                "ensemble": {
                    "xgboost": round(xgb_pred, 2),
                    "random_forest": round(rf_pred, 2),
                    "linear_regression": round(lr_pred, 2),
                    "weighted_ensemble": ensemble
                },
                "feature_importance": [
                    {"feature": k, "importance": round(v, 4)}
                    for k, v in top_factors
                ],
                "crop_health": "Healthy" if primary >= 70 else "Moderate" if primary >= 55 else "Stressed"
            }
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@app.post("/what-if")
def what_if():
    try:
        body      = request.get_json(force=True) or {}
        base      = body.get("base", {})
        scenario  = body.get("scenario", {})
        current_p = float(body.get("current_prediction", 80.0))

        X_base     = encode_input(base)
        X_scenario = encode_input({**base, **scenario})

        base_pred = float(BEST_MODEL.predict(X_base)[0])
        scen_pred = float(BEST_MODEL.predict(X_scenario)[0])

        diff = round(scen_pred - base_pred, 2)
        pct  = round((diff / max(base_pred, 1)) * 100, 1)

        # Explain what changed
        changed = []
        for k, v in scenario.items():
            base_v = base.get(k, v)
            if v != base_v:
                changed.append({
                    "feature": k.replace("_", " ").title(),
                    "from": base_v,
                    "to": v,
                    "impact": "positive" if diff >= 0 else "negative"
                })

        return jsonify({
            "success": True,
            "data": {
                "base_prediction": round(base_pred, 2),
                "scenario_prediction": round(scen_pred, 2),
                "difference": diff,
                "percentage_change": pct,
                "changed_features": changed
            }
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@app.post("/variety-compare")
def variety_compare():
    try:
        body = request.get_json(force=True) or {}
        base = body.get("base", {})
        varieties = body.get("varieties", VARIETIES)

        results = []
        for v in varieties:
            X = encode_input({**base, "variety": v})
            pred = float(BEST_MODEL.predict(X)[0])
            rf_p  = float(rf_model.predict(X)[0])
            conf  = confidence_from_ensemble([pred, rf_p])
            loss  = max(0, 85 - pred)
            results.append({
                "variety": v,
                "predicted_yield": round(pred, 2),
                "confidence": conf,
                "risk": risk_label((loss / 85) * 100),
                "loss_pct": round((loss / 85) * 100, 1),
                "expected_production": round(pred * float(base.get("area_hectare", 1)), 2)
            })

        results.sort(key=lambda x: x["predicted_yield"], reverse=True)
        best = results[0]["variety"] if results else None

        return jsonify({"success": True, "data": {"results": results, "recommended": best}})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@app.post("/variety-recommend")
def variety_recommend():
    try:
        body = request.get_json(force=True) or {}
        results = []
        for v in VARIETIES:
            X = encode_input({**body, "variety": v})
            pred  = float(BEST_MODEL.predict(X)[0])
            rf_p  = float(rf_model.predict(X)[0])
            conf  = confidence_from_ensemble([pred, rf_p])
            loss  = max(0, 85 - pred)
            suit  = "High" if pred >= 75 else "Medium" if pred >= 60 else "Low"
            results.append({
                "variety": v,
                "predicted_yield": round(pred, 2),
                "confidence": conf,
                "suitability": suit,
                "risk": risk_label((loss / 85) * 100)
            })
        results.sort(key=lambda x: x["predicted_yield"], reverse=True)
        return jsonify({"success": True, "data": {"recommendations": results}})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@app.get("/model-performance")
def model_performance():
    cv = META.get("cv_metrics", {})
    tm = META.get("test_metrics", {})
    models_data = []
    for name in ["xgboost", "random_forest", "linear_regression"]:
        c  = cv.get(name, {})
        t  = tm.get(name, {})
        models_data.append({
            "name": name,
            "display_name": name.replace("_", " ").title(),
            "is_production": name == BEST_MODEL_NAME,
            "cv_median_r2":    round(c.get("median_r2", 0), 4),
            "cv_median_rmse":  round(c.get("median_rmse", 0), 2),
            "cv_median_mae":   round(c.get("median_mae", 0), 2),
            "test_r2":         round(t.get("test_r2", 0), 4),
            "test_rmse":       round(t.get("test_rmse", 0), 2),
            "test_mae":        round(t.get("test_mae", 0), 2),
            "n_train":         META.get("n_samples_train", 0),
            "n_test":          META.get("n_samples_test", 0),
        })
    fi = META.get("feature_importance_top10", [])
    return jsonify({
        "success": True,
        "data": {
            "models": models_data,
            "best_model": BEST_MODEL_NAME,
            "training_date": META.get("training_date", ""),
            "feature_importance": fi,
            "n_features": META.get("n_features", 0)
        }
    })


@app.post("/explain")
def explain():
    """Generate a text explanation of the prediction"""
    try:
        body = request.get_json(force=True) or {}
        X = encode_input(body)

        primary = float(BEST_MODEL.predict(X)[0])
        fi = sorted(
            zip(FEATURE_NAMES, BEST_MODEL.feature_importances_.tolist()),
            key=lambda x: x[1], reverse=True
        )

        positives, negatives = [], []
        for feat, imp in fi[:8]:
            val = body.get(feat.replace("_encoded", ""), None)
            if val is None:
                continue
            label = feat.replace("_", " ").replace(" encoded", "").title()

            # Threshold-based positive/negative classification
            if "rainfall" in feat and float(val) >= 1000:
                positives.append({"factor": label, "value": val, "note": "Adequate rainfall supports growth"})
            elif "rainfall" in feat:
                negatives.append({"factor": label, "value": val, "note": "Below optimal rainfall range"})
            elif "nitrogen" in feat and float(val) >= 150:
                positives.append({"factor": label, "value": val, "note": "Good nitrogen levels support yield"})
            elif "soil_ph" in feat:
                ph = float(val)
                if 6.0 <= ph <= 7.5:
                    positives.append({"factor": label, "value": val, "note": "pH is within optimal range"})
                else:
                    negatives.append({"factor": label, "value": val, "note": "pH outside optimal 6.0–7.5 range"})
            elif "temperature" in feat:
                temp = float(val)
                if 27 <= temp <= 34:
                    positives.append({"factor": label, "value": val, "note": "Temperature is ideal for sugarcane"})
                else:
                    negatives.append({"factor": label, "value": val, "note": "Temperature outside optimal range"})
            elif "moisture" in feat and float(val) >= 50:
                positives.append({"factor": label, "value": val, "note": "Adequate soil moisture"})
            elif imp > 0.05:
                positives.append({"factor": label, "value": val, "note": f"Significant contributor ({imp:.1%} importance)"})

        return jsonify({
            "success": True,
            "data": {
                "predicted_yield": round(primary, 2),
                "positive_factors": positives[:4],
                "negative_factors": negatives[:4],
                "feature_importance": [
                    {"feature": f.replace("_encoded", "").replace("_", " ").title(),
                     "importance": round(i, 4), "pct": round(i * 100, 1)}
                    for f, i in fi[:10]
                ],
                "summary": f"The model predicted {round(primary, 1)} t/ha based on your inputs. "
                           f"{'Conditions are favourable.' if primary >= 70 else 'Some limiting factors were detected.'}"
            }
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"🚀  Starting ML microservice on port {port}…")
    app.run(host="0.0.0.0", port=port, debug=False)
