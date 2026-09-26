"""
Seed Advanced Demo Data for Major Project 2027
Populates realistic demo data for:
- Farms & Fields
- All 5 Sugarcane Varieties
- Soil Data & Weather Data
- Yield Predictions, History, and Explanations
- Multi-severity Alerts
- Model Performance (RF vs XGBoost)
- AI Recommendations & Farm Reports
Clearly marks demo records with is_demo = 1.
"""

import os
import sys
import json
from datetime import datetime, date, timedelta
from pathlib import Path

# Ensure UTF-8
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import pymysql

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "212006")
DB_PORT = int(os.environ.get("DB_PORT", 3306))
DB_NAME = os.environ.get("DB_NAME", "majorlogin")

def seed_demo_data():
    print("🌱 Connecting to MySQL database to seed demo data...")
    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        database=DB_NAME,
        autocommit=True
    )
    cur = conn.cursor()

    # 1. Get user IDs
    cur.execute("SELECT id FROM users ORDER BY id ASC LIMIT 5;")
    user_rows = cur.fetchall()
    if not user_rows:
        print("❌ No users found in database. Please run initial setup first.")
        return

    primary_user_id = user_rows[0][0]
    farmer_user_id = user_rows[-1][0]
    all_users = [r[0] for r in user_rows]

    print(f"   Using User ID {primary_user_id} and {farmer_user_id} for demo records.")

    # 2. Seed Multi-Farms
    farms_data = [
        ("Sahyadri Green Cane Estate", "Kolhapur, Maharashtra", "Plot 42, Karveer Tehsil", "Kolhapur", "Maharashtra", 18.5, 16.704987, 74.243256),
        ("Kaveri Delta Cane Plantation", "Mandya, Karnataka", "Survey 88, Maddur Taluk", "Mandya", "Karnataka", 14.2, 12.521820, 76.895142),
        ("Krishna Valley Agro Farms", "Belagavi, Karnataka", "Chikodi Sector 3", "Belagavi", "Karnataka", 22.0, 16.425810, 74.598210),
        ("Ganga Basin Sugarcane Farm", "Meerut, Uttar Pradesh", "Daurala Road, Mawana", "Meerut", "Uttar Pradesh", 16.8, 29.082100, 77.721500)
    ]

    farm_ids = []
    for name, loc, addr, dist, st, area, lat, lon in farms_data:
        cur.execute("SELECT id FROM farms WHERE name = %s AND user_id = %s;", (name, primary_user_id))
        row = cur.fetchone()
        if row:
            farm_ids.append(row[0])
        else:
            cur.execute("""
                INSERT INTO farms (user_id, name, location, address, district, state, total_area, latitude, longitude)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (primary_user_id, name, loc, addr, dist, st, area, lat, lon))
            farm_ids.append(cur.lastrowid)

    print(f"   Seeded/verified {len(farm_ids)} multi-farms.")

    # 3. Seed Fields
    fields_data = [
        (farm_ids[0], "North Canal Plot A", "Kolhapur North", 4.5, "Black Soil", 7.4, 65.0, "Co 86032", 1, date(2025, 10, 15)),
        (farm_ids[0], "Riverbank Plot B", "Kolhapur South", 6.0, "Clay Loam", 6.9, 58.0, "CoM 0265", 5, date(2025, 11, 20)),
        (farm_ids[1], "Mandya Early Block 1", "Maddur East", 3.8, "Red Loam", 6.5, 52.0, "CoC 671", 3, date(2026, 1, 10)),
        (farm_ids[1], "Mandya High-Brix Block 2", "Maddur West", 5.2, "Red Loam", 6.7, 48.0, "Co 99004", 4, date(2025, 12, 5)),
        (farm_ids[2], "Belagavi Black Cotton 1", "Chikodi Central", 7.5, "Black Soil", 7.8, 62.0, "CoM 0265", 5, date(2025, 9, 25)),
        (farm_ids[3], "Meerut Subtropical Strip", "Mawana North", 5.5, "Alluvial Soil", 7.2, 55.0, "Co 0238", 2, date(2025, 11, 1))
    ]

    field_ids = []
    for f_id, fname, floc, farea, stype, sph, smoist, fvar, var_id, pdate in fields_data:
        cur.execute("SELECT id FROM fields WHERE farm_id = %s AND name = %s;", (f_id, fname))
        row = cur.fetchone()
        if row:
            field_ids.append(row[0])
        else:
            cur.execute("""
                INSERT INTO fields (farm_id, name, location, area, soil_type, soil_ph, soil_moisture, sugarcane_variety, variety_id, planting_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (f_id, fname, floc, farea, stype, sph, smoist, fvar, var_id, pdate))
            field_ids.append(cur.lastrowid)

    print(f"   Seeded/verified {len(field_ids)} fields covering all 5 sugarcane varieties.")

    # 4. Seed Soil Data Records
    soil_records = [
        (field_ids[0], farm_ids[0], "Black Soil", 7.4, 65.0, 185.0, 62.0, 95.0, 0.85, 0.42, 88.0, "Highly Suitable", "Optimal neutral-alkaline range", "Adequate moisture retention", "Ideal deep black soil for Co 86032 with balanced N-P-K reserves."),
        (field_ids[1], farm_ids[0], "Clay Loam", 6.9, 58.0, 170.0, 54.0, 88.0, 0.78, 0.38, 85.0, "Highly Suitable", "Optimal slightly acidic-neutral", "Good capillary retention", "Excellent fertility profile supporting grand growth expansion."),
        (field_ids[2], farm_ids[1], "Red Loam", 6.5, 52.0, 150.0, 48.0, 75.0, 0.65, 0.32, 79.0, "Suitable", "Favorable pH for micronutrients", "Moderate moisture; monitor irrigation", "Permeable red loam with fast drainage; regular irrigation recommended."),
        (field_ids[3], farm_ids[1], "Red Loam", 6.7, 48.0, 142.0, 45.0, 70.0, 0.60, 0.30, 76.0, "Suitable", "Optimal pH for cane roots", "Slight moisture deficit", "Moisture requires replenishment before tillering peak."),
        (field_ids[4], farm_ids[2], "Black Soil", 7.8, 62.0, 195.0, 70.0, 110.0, 0.92, 0.50, 91.0, "Highly Suitable", "Marginally high but tolerated by CoM 0265", "High water retention", "Heavy black soil with supreme nutrient retention for bumper tonnage."),
        (field_ids[5], farm_ids[3], "Alluvial Soil", 7.2, 55.0, 165.0, 58.0, 82.0, 0.72, 0.35, 84.0, "Highly Suitable", "Ideal neutral pH", "Adequate moisture status", "Fertile Indo-Gangetic alluvium providing great root penetration.")
    ]

    for fid, fmid, stype, sph, smoist, n, p, k, oc, ec, score, suit, phi, mi, summ in soil_records:
        cur.execute("SELECT id FROM soil_data WHERE field_id = %s;", (fid,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO soil_data (field_id, farm_id, soil_type, soil_ph, soil_moisture, nitrogen_kg_ha, phosphorus_kg_ha, potassium_kg_ha, organic_carbon_pct, electrical_conductivity, soil_health_score, sugarcane_suitability, ph_impact, moisture_impact, soil_impact_summary)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (fid, fmid, stype, sph, smoist, n, p, k, oc, ec, score, suit, phi, mi, summ))

    print(f"   Seeded/verified soil health records.")

    # 5. Seed Crop Intelligence Records
    crop_records_data = [
        (field_ids[0], "Co 86032", date(2025, 10, 15), "Grand Growth", 345, 380, date(2026, 11, 1), "Excellent", 88.0, 92.0, "High", "Final earthing up completed, maintain steady irrigation"),
        (field_ids[1], "CoM 0265", date(2025, 11, 20), "Grand Growth", 310, 390, date(2026, 12, 15), "Good", 78.0, 86.0, "High", "Internode elongation active, monitor stem borer"),
        (field_ids[2], "CoC 671", date(2026, 1, 10), "Tillering", 258, 330, date(2026, 12, 5), "Normal", 65.0, 82.0, "Medium", "Tiller thinning and propping advised"),
        (field_ids[3], "Co 99004", date(2025, 12, 5), "Tillering", 294, 370, date(2026, 12, 10), "Normal", 70.0, 80.0, "Medium", "Foliar spray of micronutrients recommended"),
        (field_ids[4], "CoM 0265", date(2025, 9, 25), "Maturity", 366, 390, date(2026, 10, 20), "Excellent", 94.0, 95.0, "Low", "Sugar accumulation stage, curtail heavy nitrogen"),
        (field_ids[5], "Co 0238", date(2025, 11, 1), "Grand Growth", 329, 340, date(2026, 10, 10), "Good", 85.0, 88.0, "Medium", "Pre-harvest inspection and Brix monitoring")
    ]

    for fid, cvar, pdate, stage, dsp, timeline, hdate, cond, prog, score, water, act in crop_records_data:
        cur.execute("SELECT id FROM crop_records WHERE field_id = %s;", (fid,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO crop_records (field_id, sugarcane_variety, planting_date, current_stage, days_since_planting, expected_growth_timeline_days, estimated_harvest_date, current_crop_condition, stage_progress_pct, health_score, water_requirement_level, key_agronomic_activity)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (fid, cvar, pdate, stage, dsp, timeline, hdate, cond, prog, score, water, act))

    print(f"   Seeded/verified crop intelligence lifecycle records.")

    # 6. Seed Yield Predictions, Prediction History & Explanations
    predictions_demo = [
        {
            "user_id": primary_user_id,
            "farm_id": farm_ids[0],
            "field_id": field_ids[0],
            "farm_name": "Sahyadri Green Cane Estate",
            "field_name": "North Canal Plot A",
            "location": "Kolhapur, Maharashtra",
            "variety": "Co 86032",
            "area": 4.5,
            "soil_type": "Black Soil",
            "soil_ph": 7.4,
            "soil_moisture": 65.0,
            "rainfall": 1280.0,
            "temperature": 29.2,
            "humidity": 74.0,
            "planting_date": date(2025, 10, 15),
            "crop_growth_stage": "Grand Growth",
            "historical_yield": 115.0,
            "predicted_yield": 112.40,
            "expected_production": 505.80,
            "confidence": 92.5,
            "expected_range_low": 104.5,
            "expected_range_high": 120.3,
            "risk_level": "Low",
            "loss_percentage": 5.1,
            "expected_loss_tonnes": 27.4,
            "model_used": "Random Forest",
            "crop_health": "Excellent",
            "is_demo": 1,
            "created_at": datetime.now() - timedelta(days=2)
        },
        {
            "user_id": primary_user_id,
            "farm_id": farm_ids[0],
            "field_id": field_ids[1],
            "farm_name": "Sahyadri Green Cane Estate",
            "field_name": "Riverbank Plot B",
            "location": "Kolhapur, Maharashtra",
            "variety": "CoM 0265",
            "area": 6.0,
            "soil_type": "Clay Loam",
            "soil_ph": 6.9,
            "soil_moisture": 58.0,
            "rainfall": 1240.0,
            "temperature": 29.8,
            "humidity": 71.0,
            "planting_date": date(2025, 11, 20),
            "crop_growth_stage": "Grand Growth",
            "historical_yield": 135.0,
            "predicted_yield": 131.80,
            "expected_production": 790.80,
            "confidence": 90.8,
            "expected_range_low": 123.0,
            "expected_range_high": 140.5,
            "risk_level": "Low",
            "loss_percentage": 7.2,
            "expected_loss_tonnes": 61.2,
            "model_used": "Random Forest",
            "crop_health": "Excellent",
            "is_demo": 1,
            "created_at": datetime.now() - timedelta(days=5)
        },
        {
            "user_id": primary_user_id,
            "farm_id": farm_ids[1],
            "field_id": field_ids[2],
            "farm_name": "Kaveri Delta Cane Plantation",
            "field_name": "Mandya Early Block 1",
            "location": "Mandya, Karnataka",
            "variety": "CoC 671",
            "area": 3.8,
            "soil_type": "Red Loam",
            "soil_ph": 6.5,
            "soil_moisture": 45.0,
            "rainfall": 920.0,
            "temperature": 32.5,
            "humidity": 62.0,
            "planting_date": date(2026, 1, 10),
            "crop_growth_stage": "Tillering",
            "historical_yield": 88.0,
            "predicted_yield": 78.50,
            "expected_production": 298.30,
            "confidence": 84.2,
            "expected_range_low": 70.2,
            "expected_range_high": 86.8,
            "risk_level": "Medium",
            "loss_percentage": 23.0,
            "expected_loss_tonnes": 89.3,
            "model_used": "XGBoost",
            "crop_health": "Normal",
            "is_demo": 1,
            "created_at": datetime.now() - timedelta(days=8)
        },
        {
            "user_id": primary_user_id,
            "farm_id": farm_ids[1],
            "field_id": field_ids[3],
            "farm_name": "Kaveri Delta Cane Plantation",
            "field_name": "Mandya High-Brix Block 2",
            "location": "Mandya, Karnataka",
            "variety": "Co 99004",
            "area": 5.2,
            "soil_type": "Red Loam",
            "soil_ph": 6.7,
            "soil_moisture": 42.0,
            "rainfall": 890.0,
            "temperature": 33.1,
            "humidity": 59.0,
            "planting_date": date(2025, 12, 5),
            "crop_growth_stage": "Tillering",
            "historical_yield": 95.0,
            "predicted_yield": 82.10,
            "expected_production": 426.92,
            "confidence": 83.5,
            "expected_range_low": 74.0,
            "expected_range_high": 90.2,
            "risk_level": "Medium",
            "loss_percentage": 26.7,
            "expected_loss_tonnes": 155.4,
            "model_used": "Random Forest",
            "crop_health": "Normal",
            "is_demo": 1,
            "created_at": datetime.now() - timedelta(days=12)
        },
        {
            "user_id": primary_user_id,
            "farm_id": farm_ids[2],
            "field_id": field_ids[4],
            "farm_name": "Krishna Valley Agro Farms",
            "field_name": "Belagavi Black Cotton 1",
            "location": "Belagavi, Karnataka",
            "variety": "CoM 0265",
            "area": 7.5,
            "soil_type": "Black Soil",
            "soil_ph": 7.8,
            "soil_moisture": 62.0,
            "rainfall": 1310.0,
            "temperature": 28.5,
            "humidity": 76.0,
            "planting_date": date(2025, 9, 25),
            "crop_growth_stage": "Maturity",
            "historical_yield": 142.0,
            "predicted_yield": 139.50,
            "expected_production": 1046.25,
            "confidence": 93.8,
            "expected_range_low": 131.0,
            "expected_range_high": 148.0,
            "risk_level": "Low",
            "loss_percentage": 1.8,
            "expected_loss_tonnes": 18.7,
            "model_used": "Random Forest",
            "crop_health": "Excellent",
            "is_demo": 1,
            "created_at": datetime.now() - timedelta(days=15)
        },
        {
            "user_id": primary_user_id,
            "farm_id": farm_ids[3],
            "field_id": field_ids[5],
            "farm_name": "Ganga Basin Sugarcane Farm",
            "field_name": "Meerut Subtropical Strip",
            "location": "Meerut, Uttar Pradesh",
            "variety": "Co 0238",
            "area": 5.5,
            "soil_type": "Alluvial Soil",
            "soil_ph": 7.2,
            "soil_moisture": 38.0,
            "rainfall": 780.0,
            "temperature": 37.2,
            "humidity": 51.0,
            "planting_date": date(2025, 11, 1),
            "crop_growth_stage": "Grand Growth",
            "historical_yield": 105.0,
            "predicted_yield": 72.30,
            "expected_production": 397.65,
            "confidence": 81.0,
            "expected_range_low": 63.5,
            "expected_range_high": 81.1,
            "risk_level": "High",
            "loss_percentage": 45.2,
            "expected_loss_tonnes": 328.3,
            "model_used": "XGBoost",
            "crop_health": "Stressed",
            "is_demo": 1,
            "created_at": datetime.now() - timedelta(days=1)
        }
    ]

    for p in predictions_demo:
        cur.execute("""
            SELECT id FROM yield_predictions WHERE user_id = %s AND field_id = %s AND created_at = %s;
        """, (p["user_id"], p["field_id"], p["created_at"]))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO yield_predictions (
                    user_id, farm_id, field_id, location, variety, area, soil_type, soil_ph,
                    soil_moisture, rainfall, temperature, humidity, planting_date, crop_growth_stage,
                    historical_yield, predicted_yield, expected_production, confidence,
                    expected_range_low, expected_range_high, risk_level, loss_percentage,
                    expected_loss_tonnes, model_used, crop_health, is_demo, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s
                );
            """, (
                p["user_id"], p["farm_id"], p["field_id"], p["location"], p["variety"], p["area"], p["soil_type"], p["soil_ph"],
                p["soil_moisture"], p["rainfall"], p["temperature"], p["humidity"], p["planting_date"], p["crop_growth_stage"],
                p["historical_yield"], p["predicted_yield"], p["expected_production"], p["confidence"],
                p["expected_range_low"], p["expected_range_high"], p["risk_level"], p["loss_percentage"],
                p["expected_loss_tonnes"], p["model_used"], p["crop_health"], p["is_demo"], p["created_at"]
            ))
            yp_id = cur.lastrowid

            # Insert legacy predictions table row for 100% Part 1 compatibility
            cur.execute("""
                INSERT INTO predictions (
                    user_id, field_id, farm_name, field_name, location, variety, area,
                    soil_type, soil_ph, soil_moisture, rainfall, temperature, humidity,
                    predicted_yield, expected_production, confidence, expected_loss,
                    crop_health, factors, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s
                );
            """, (
                p["user_id"], p["field_id"], p["farm_name"], p["field_name"], p["location"], p["variety"], p["area"],
                p["soil_type"], p["soil_ph"], p["soil_moisture"], p["rainfall"], p["temperature"], p["humidity"],
                p["predicted_yield"], p["expected_production"], p["confidence"], p["loss_percentage"],
                p["crop_health"], f"Model: {p['model_used']}", p["created_at"]
            ))

            # Insert prediction history
            cur.execute("""
                INSERT INTO prediction_history (
                    prediction_id, user_id, farm_id, field_id, farm_name, field_name, variety,
                    predicted_yield, expected_production, confidence, risk_level, loss_percentage,
                    scenario_name, is_simulation, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                yp_id, p["user_id"], p["farm_id"], p["field_id"], p["farm_name"], p["field_name"], p["variety"],
                p["predicted_yield"], p["expected_production"], p["confidence"], p["risk_level"], p["loss_percentage"],
                "Baseline Season 2026", 0, p["created_at"]
            ))

            # Insert prediction explanation
            pos_factors = json.dumps([
                {"factor": "Historical Baseline", "value": f"{p['historical_yield']} t/ha", "impact": "+Positive", "note": "Strong field yield record."},
                {"factor": "Soil Quality", "value": f"{p['soil_type']} (pH {p['soil_ph']})", "impact": "+Optimal", "note": "Healthy nutrient availability."}
            ])
            neg_factors = json.dumps([
                {"factor": "Heat Deficit", "value": f"{p['temperature']}°C", "impact": "-Stress", "note": "Elevated midday temperature."}
            ] if p["temperature"] > 34 else [])
            conf_reasons = json.dumps([
                "Consistent tree model consensus between RF and XGBoost.",
                "Agronomic inputs adhere closely to regional sugarcane baseline."
            ])
            cur.execute("""
                INSERT INTO prediction_explanations (
                    prediction_id, positive_factors_json, negative_factors_json, confidence_reasons_json, summary_explanation
                ) VALUES (%s, %s, %s, %s, %s);
            """, (yp_id, pos_factors, neg_factors, conf_reasons, f"Predicted {p['predicted_yield']} t/ha with {p['confidence']}% model confidence."))

    print("   Seeded/verified yield predictions, history logs, and XAI explanations.")

    # 7. Seed Multi-Severity Alerts
    alerts_data = [
        (primary_user_id, "weather", "critical", "High Heat Stress Advisory (>37°C)", "Meerut Subtropical Strip is experiencing 37.2°C ambient temperatures. High evapotranspiration detected; immediate twilight irrigation advised.", farm_ids[3], field_ids[5], 0, 1),
        (primary_user_id, "soil", "high", "Low Soil Moisture Warning (<40%)", "Soil moisture in Meerut Subtropical Strip has declined to 38.0%, below critical cane threshold. Schedule irrigation.", farm_ids[3], field_ids[5], 0, 1),
        (primary_user_id, "weather", "medium", "Rainfall Deficit Watch", "Mandya received only 890mm cumulative precipitation. Supplementary drip irrigation advised during formative stage.", farm_ids[1], field_ids[3], 0, 1),
        (primary_user_id, "yield", "high", "Projected Yield Deficit Detected", "Ganga Basin Subtropical Strip projected at 72.3 t/ha (-45.2% potential loss). Action required to prevent further reduction.", farm_ids[3], field_ids[5], 0, 1),
        (primary_user_id, "irrigation", "low", "Optimal Soil Moisture Maintained", "Sahyadri Green Cane Estate North Canal Plot A moisture stands at 65%, ideal for active cane elongation.", farm_ids[0], field_ids[0], 1, 1),
        (primary_user_id, "general", "info", "Maturity Stage Nutrition Advisory", "Belagavi Black Cotton 1 has entered Maturity stage (366 days). Stop nitrogen top-dressing to preserve high sucrose brix.", farm_ids[2], field_ids[4], 1, 1)
    ]

    for uid, atype, asev, atitle, amsg, fid, flid, aread, ademo in alerts_data:
        cur.execute("SELECT id FROM alerts WHERE user_id = %s AND title = %s;", (uid, atitle))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO alerts (user_id, type, severity, title, message, farm_id, field_id, is_read, is_demo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (uid, atype, asev, atitle, amsg, fid, flid, aread, ademo))

    print(f"   Seeded/verified multi-severity alert notifications.")

    # 8. Seed Model Performance in database
    model_perf_data = [
        ("Random Forest", "2.0.0", 8.84, 15.33, 0.7866, 0.8005, 5, 6288, 1573, 1),
        ("XGBoost", "2.0.0", 9.17, 16.06, 0.7659, 0.7936, 5, 6288, 1573, 1)
    ]
    for mname, mver, mae, rmse, r2, cv, folds, ntr, nte, act in model_perf_data:
        cur.execute("SELECT id FROM model_performance WHERE model_name = %s;", (mname,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO model_performance (model_name, version, mae, rmse, r2_score, cv_score, cv_folds, n_train_samples, n_test_samples, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (mname, mver, mae, rmse, r2, cv, folds, ntr, nte, act))

    print("   Seeded model performance evaluation records.")

    # 9. Seed Recommendations
    recs_data = [
        (primary_user_id, farm_ids[0], field_ids[0], "advisor", "Optimal Grand Growth Management", "Maintain current 7-day irrigation rotation and ensure weed suppression in furrows.", "Soil moisture (65%) and temperatures (29.2°C) are in prime agronomic balance.", "low", "active", "Continue schedule", 1),
        (primary_user_id, farm_ids[3], field_ids[5], "irrigation", "Immediate Irrigation Scheduling Required", "Apply 40-50mm irrigation depth in evening to mitigate high soil temperature (37.2°C) and replenish 38% soil moisture.", "Low soil moisture combined with high ambient heat halts stalk elongation.", "high", "active", "Initiate irrigation immediately", 1),
        (primary_user_id, farm_ids[1], field_ids[2], "variety", "Co 86032 Recommended for Next Ratoon Cycle", "In Mandya's red loam soil, Co 86032 offers superior drought resilience and higher tonnage than early varieties.", "Model simulations show a +18.5 t/ha boost with Co 86032 under identical rainfall.", "medium", "active", "Review variety comparison", 1)
    ]

    for uid, fmid, flid, cat, title, content, expl, prio, stat, act, demo in recs_data:
        cur.execute("SELECT id FROM recommendations WHERE user_id = %s AND title = %s;", (uid, title))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO recommendations (user_id, farm_id, field_id, category, title, content, explanation, priority, status, action_required, is_demo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (uid, fmid, flid, cat, title, content, expl, prio, stat, act, demo))

    print("   Seeded AI farm recommendations.")

    # 10. Seed Demo Reports
    demo_reports = [
        (primary_user_id, farm_ids[0], field_ids[0], "Yield Prediction Report", "Yield Forecast & Production Analysis — Sahyadri Estate", "Complete seasonal yield projection for Co 86032 at 112.4 t/ha.", json.dumps({"variety": "Co 86032", "field": "North Canal Plot A"}), json.dumps({"predicted_yield": 112.4, "production": 505.8, "confidence": 92.5}), "PDF", 3, 1),
        (primary_user_id, farm_ids[3], field_ids[5], "Yield Loss Report", "Yield Loss & Risk Mitigation Report — Ganga Basin", "Analysis of 45.2% potential yield gap under heat and moisture stress.", json.dumps({"variety": "Co 0238", "field": "Meerut Subtropical Strip"}), json.dumps({"loss_pct": 45.2, "loss_tonnes": 328.3, "risk": "High"}), "PDF", 1, 1),
        (primary_user_id, None, None, "Complete Farm Intelligence Report", "Integrated Multi-Farm Agro-Intelligence Brief", "Comprehensive cross-farm evaluation of production, soil vitality, and weather vulnerability.", json.dumps({"farms_count": 4}), json.dumps({"total_area": 65.5, "total_production": 2420.0}), "PDF", 5, 1)
    ]

    for uid, fmid, flid, rtype, title, summ, pjson, rdata, fmt, cnt, demo in demo_reports:
        cur.execute("SELECT id FROM reports WHERE user_id = %s AND title = %s;", (uid, title))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO reports (user_id, farm_id, field_id, report_type, title, summary, parameters_json, report_data_json, file_format, download_count, is_demo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (uid, fmid, flid, rtype, title, summ, pjson, rdata, fmt, cnt, demo))

    print("   Seeded comprehensive demo reports.")

    cur.close()
    conn.close()
    print("✅ All advanced demo data seeded successfully!")

if __name__ == "__main__":
    seed_demo_data()
