from datetime import date
from types import SimpleNamespace

from backend.crop_intelligence_service import (
    STAGE_SEED,
    assess_observation,
    compare_measurements,
    dap_for,
    stage_for_dap,
)


def test_dap_uses_planting_date_as_day_zero():
    planted = date(2026, 1, 1)
    assert dap_for(planted, planted) == 0
    assert dap_for(planted, date(2026, 1, 31)) == 30


def test_stage_ranges_cover_boundaries_and_continue_after_day_180():
    expected = {0: "planting_germination", 1: "planting_germination", 30: "planting_germination", 31: "early_growth_tillering", 60: "early_growth_tillering", 61: "tillering_canopy", 90: "tillering_canopy", 91: "vegetative_growth", 120: "vegetative_growth", 121: "increasing_stem_growth", 150: "increasing_stem_growth", 151: "six_month_assessment", 180: "six_month_assessment", 181: "continued_monitoring", 365: "continued_monitoring"}
    for dap, key in expected.items():
        assert stage_for_dap(dap, STAGE_SEED)["key"] == key
    assert stage_for_dap(-1, STAGE_SEED) is None


def test_missing_variety_reference_is_explicit_and_not_fabricated():
    observation = SimpleNamespace(plant_height_cm=42, tiller_count=None, establishment_pct=None, soil_moisture_pct=None)
    results = compare_measurements(observation, {}, 60)
    height = next(item for item in results if item["metric"] == "plant_height_cm")
    assert height["status"] == "insufficient_reference"
    assert height["reference"] is None
    assert any(item["status"] == "not_recorded" for item in results)


def test_reference_requires_matching_farm_region():
    observation = SimpleNamespace(plant_height_cm=42, tiller_count=None, measurement_area_m2=None, establishment_pct=None, soil_moisture_pct=None)
    profile = {"growth_reference_ranges": [{
        "metric": "plant_height_cm", "start_day": 30, "end_day": 60,
        "low": 35, "high": 50, "unit": "cm", "region": "Maharashtra",
        "conditions": "Trial conditions", "method": "Measure representative stalks",
        "source": {"title": "Trial", "url": "https://example.org/trial", "verified": "2026-10-15"},
    }]}
    other_region = compare_measurements(observation, profile, 45, {"state": "Karnataka"})
    matching_region = compare_measurements(observation, profile, 45, {"state": "Maharashtra"})
    assert next(item for item in other_region if item["metric"] == "plant_height_cm")["status"] == "insufficient_reference"
    assert next(item for item in matching_region if item["metric"] == "plant_height_cm")["status"] == "within_reference"


def test_tiller_reference_requires_area_normalization():
    profile = {"growth_reference_ranges": [{
        "metric": "tiller_count", "start_day": 30, "end_day": 60,
        "low": 10, "high": 20, "unit": "tillers/m²", "region": "Maharashtra",
        "conditions": "Trial conditions", "method": "Count tillers per square metre",
        "source": {"title": "Trial", "url": "https://example.org/trial", "verified": "2026-10-15"},
    }]}
    observation = SimpleNamespace(plant_height_cm=None, tiller_count=30, measurement_area_m2=2, establishment_pct=None, soil_moisture_pct=None)
    result = compare_measurements(observation, profile, 45, {"state": "Maharashtra"})
    tiller = next(item for item in result if item["metric"] == "tiller_count")
    assert tiller["actual"] == 15
    assert tiller["status"] == "within_reference"


def test_symptom_rule_creates_scouting_prompt_not_diagnosis():
    planted = date(2026, 1, 1)
    cycle = SimpleNamespace(id=3, variety_code="Co 86032", planting_date=planted)
    observation = SimpleNamespace(
        id=5, dap=30, observation_date=date(2026, 1, 31),
        plant_height_cm=None, tiller_count=None, measurement_area_m2=None,
        establishment_pct=None, soil_moisture_pct=None,
        leaf_condition="yellowing", leaf_symptoms="leaves look yellow", pest_symptoms=None,
        disease_symptoms=None, soil_or_drainage=None,
    )
    result = assess_observation(cycle, observation, {}, [observation], {})
    assert any(item["rule_key"] == "leaf_yellowing" for item in result["alerts"])
    assert "not a diagnosis" in next(item for item in result["alerts"] if item["rule_key"] == "leaf_yellowing")["evidence"]
    assert "No measured growth values" in result["data_quality"][0]
