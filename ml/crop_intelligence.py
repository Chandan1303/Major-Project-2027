"""
Crop Intelligence Engine
Tracks sugarcane growth stages, days since planting, timeline progression,
estimated harvest date, water requirements, and current crop condition.

Stages:
1. Planting     (0 - 30 days)
2. Germination  (30 - 60 days)
3. Tillering    (60 - 120 days)
4. Grand Growth (120 - 270 days)
5. Maturity     (270 - 360 days)
6. Harvest      (360+ days)
"""

from datetime import datetime, date, timedelta

GROWTH_STAGES = [
    {
        "stage": "Planting",
        "order": 1,
        "start_day": 0,
        "end_day": 30,
        "duration_days": 30,
        "description": "Sett preparation, furrow placement, basal fertilization, and initial irrigation.",
        "water_requirement": "High",
        "key_activity": "Select disease-free setts, apply basal NPK dose, maintain moist seedbed without water stagnation."
    },
    {
        "stage": "Germination",
        "order": 2,
        "start_day": 30,
        "end_day": 60,
        "duration_days": 30,
        "description": "Bud sprouting, primary shoot emergence, and initial root establishment.",
        "water_requirement": "High",
        "key_activity": "Inspect germination percentage (>85%), fill gaps using pre-germinated nursery setts, weed management."
    },
    {
        "stage": "Tillering",
        "order": 3,
        "start_day": 60,
        "end_day": 120,
        "duration_days": 60,
        "description": "Formation of secondary and tertiary stalks from primary shoots, establishing millable cane density.",
        "water_requirement": "Medium",
        "key_activity": "First nitrogen top dressing, earthing up to anchor tillers, ensure 8-10 tillers per clump."
    },
    {
        "stage": "Grand Growth",
        "order": 4,
        "start_day": 120,
        "end_day": 270,
        "duration_days": 150,
        "description": "Rapid internode elongation, maximum biomass accumulation, and peak leaf area index.",
        "water_requirement": "Very High",
        "key_activity": "Heavy irrigation schedule, second potassium top dressing, scout for top borer and stem borer."
    },
    {
        "stage": "Maturity",
        "order": 5,
        "start_day": 270,
        "end_day": 360,
        "duration_days": 90,
        "description": "Sucrose synthesis and storage in stalk internodes; slowing of vegetative elongation.",
        "water_requirement": "Low",
        "key_activity": "Withhold heavy irrigation 20-30 days before harvest to concentrate sucrose, check brix with refractometer."
    },
    {
        "stage": "Harvest",
        "order": 6,
        "start_day": 360,
        "end_day": 400,
        "duration_days": 40,
        "description": "Peak commercial cane sugar (CCS); cutting at ground level for clean harvesting.",
        "water_requirement": "None",
        "key_activity": "Harvest at ground level to avoid stalk damage, arrange rapid transport to mill within 24h, prepare for ratoon."
    }
]

class CropIntelligenceEngine:
    DEFAULT_CYCLE_DAYS = 365

    @classmethod
    def evaluate_crop_status(cls, planting_date_str, soil_moisture=65.0, soil_ph=6.8, current_date=None):
        """
        Calculates all crop growth intelligence parameters based on planting date and agronomic state.
        """
        if current_date is None:
            current_date = date.today()
        elif isinstance(current_date, str):
            current_date = datetime.strptime(current_date, "%Y-%m-%d").date()

        if isinstance(planting_date_str, str):
            try:
                p_date = datetime.strptime(planting_date_str.split("T")[0], "%Y-%m-%d").date()
            except Exception:
                p_date = date.today()
        elif isinstance(planting_date_str, (date, datetime)):
            p_date = planting_date_str if isinstance(planting_date_str, date) else planting_date_str.date()
        else:
            p_date = date.today()

        days_since_planting = max(0, (current_date - p_date).days)
        est_harvest_date = p_date + timedelta(days=cls.DEFAULT_CYCLE_DAYS)
        days_to_harvest = max(0, (est_harvest_date - current_date).days)
        progress_pct = min(100.0, round((days_since_planting / cls.DEFAULT_CYCLE_DAYS) * 100.0, 1))

        # Determine current stage
        matched_stage = GROWTH_STAGES[-1]
        for stg in GROWTH_STAGES:
            if stg["start_day"] <= days_since_planting < stg["end_day"]:
                matched_stage = stg
                break
        if days_since_planting >= 360:
            matched_stage = GROWTH_STAGES[-1]

        # Calculate crop condition based on days and soil factors
        condition = "Good"
        condition_score = 88.0

        if soil_moisture < 40.0:
            condition = "Stressed"
            condition_score -= 25.0
        elif soil_moisture < 50.0:
            condition = "Normal"
            condition_score -= 10.0
        elif 60.0 <= soil_moisture <= 75.0:
            condition = "Excellent"
            condition_score += 5.0

        if soil_ph < 5.8 or soil_ph > 8.2:
            if condition == "Excellent":
                condition = "Good"
            condition_score -= 10.0

        condition_score = max(40.0, min(98.0, condition_score))

        return {
            "planting_date": p_date.isoformat(),
            "days_since_planting": days_since_planting,
            "expected_growth_timeline_days": cls.DEFAULT_CYCLE_DAYS,
            "estimated_harvest_date": est_harvest_date.isoformat(),
            "days_to_harvest": days_to_harvest,
            "progress_pct": progress_pct,
            "current_stage": matched_stage["stage"],
            "stage_order": matched_stage["order"],
            "stage_description": matched_stage["description"],
            "water_requirement": matched_stage["water_requirement"],
            "key_agronomic_activity": matched_stage["key_activity"],
            "current_crop_condition": condition,
            "condition_score": condition_score,
            "all_stages": GROWTH_STAGES
        }
