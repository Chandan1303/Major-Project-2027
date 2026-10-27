"""Crop-calendar, comparison, and evidence-led assessment rules."""

import json
from datetime import date, datetime, timedelta
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent / "data" / "crop_intelligence"
STAGE_SEED = json.loads((DATA_DIR / "growth_stages.json").read_text(encoding="utf-8"))
VARIETY_SEED = json.loads((DATA_DIR / "variety_profiles.json").read_text(encoding="utf-8"))
MITIGATION_SEED = json.loads((DATA_DIR / "mitigation_strategies.json").read_text(encoding="utf-8"))
CHECKPOINTS = (30, 60, 90, 120, 150, 180)
OBSERVATION_FIELDS = (
    "plant_height_cm", "tiller_count", "measurement_area_m2", "establishment_pct",
    "leaf_condition", "leaf_symptoms", "soil_moisture_pct", "rainfall_mm",
    "irrigation_activity", "pest_symptoms", "disease_symptoms", "soil_or_drainage", "notes",
)
NUMERIC_METRICS = {
    "plant_height_cm": "plant_height_cm",
    "tiller_count": "tiller_count",
    "establishment_pct": "establishment_pct",
    "soil_moisture_pct": "soil_moisture_pct",
}


def json_text(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def parse_json(value, fallback=None):
    try:
        return json.loads(value) if value else (fallback if fallback is not None else {})
    except (TypeError, ValueError):
        return fallback if fallback is not None else {}


def parse_date(value, field_name="date"):
    if isinstance(value, date):
        return value
    if not isinstance(value, str):
        raise ValueError(f"{field_name} must use YYYY-MM-DD format.")
    try:
        return date.fromisoformat(value[:10])
    except ValueError as exc:
        raise ValueError(f"{field_name} must use YYYY-MM-DD format.") from exc


def dap_for(planting_date, on_date=None):
    on_date = on_date or date.today()
    return (on_date - planting_date).days


def stage_for_dap(dap, stage_references=None):
    stages = stage_references or STAGE_SEED
    if dap < 0:
        return None
    if dap == 0:
        return stages[0]
    for stage in stages:
        start = int(stage["start_day"])
        end = stage.get("end_day")
        if dap >= start and (end is None or dap <= int(end)):
            return stage
    return stages[-1]


def stage_progress(dap, stage):
    if not stage:
        return 0.0
    if stage.get("end_day") is None:
        return None
    span = int(stage["end_day"]) - int(stage["start_day"]) + 1
    return round(max(0.0, min(100.0, (dap - int(stage["start_day"]) + 1) / span * 100)), 1)


def _metric_reference(profile, metric, dap, region=None):
    region_values = {
        str(value).strip().casefold()
        for value in (region or {}).values()
        if value and str(value).strip()
    } if isinstance(region, dict) else ({str(region).strip().casefold()} if region else set())
    for current, alias in (("belagavi", "belgaum"), ("belgaum", "belagavi")):
        if current in region_values:
            region_values.add(alias)
    for item in profile.get("growth_reference_ranges", []) if isinstance(profile, dict) else []:
        if item.get("metric") != metric:
            continue
        if int(item.get("start_day", 0)) <= dap <= int(item.get("end_day", 0)):
            applicable_regions = {
                str(value).strip().casefold()
                for value in [item.get("region"), *(item.get("region_aliases") or [])]
                if value and str(value).strip()
            }
            if not applicable_regions.intersection(region_values):
                continue
            if item.get("low") is not None and item.get("high") is not None:
                return item
    return None


def _reference_gap_explanation(profile, metric, dap, region=None):
    """Explain which match condition is missing without substituting another trial."""
    ranges = [
        item for item in (profile.get("growth_reference_ranges", []) if isinstance(profile, dict) else [])
        if item.get("metric") == metric and item.get("low") is not None and item.get("high") is not None
    ]
    variety = (profile.get("official_identifier") or "this variety") if isinstance(profile, dict) else "this variety"
    label = metric.replace("_", " ")
    if not ranges:
        return f"No sourced {label} range is configured for {variety}; this measurement at {dap} DAP stays unscored."

    region_values = {
        str(value).strip().casefold()
        for value in (region or {}).values()
        if value and str(value).strip()
    } if isinstance(region, dict) else ({str(region).strip().casefold()} if region else set())
    for current, alias in (("belagavi", "belgaum"), ("belgaum", "belagavi")):
        if current in region_values:
            region_values.add(alias)
    local_ranges = []
    for item in ranges:
        item_regions = {
            str(value).strip().casefold()
            for value in [item.get("region"), *(item.get("region_aliases") or [])]
            if value and str(value).strip()
        }
        if item_regions.intersection(region_values):
            local_ranges.append(item)
    if not local_ranges:
        source_regions = sorted({str(item.get("region")) for item in ranges if item.get("region")})
        return f"Sourced {label} data exists for {variety} ({', '.join(source_regions)}), but not for this farm's region; this measurement stays unscored."

    days = sorted({int(item["start_day"]) for item in local_ranges if item.get("start_day") is not None})
    return f"Sourced {label} data for {variety} in this region is available at {', '.join(f'{day} DAP' for day in days)}, not {dap} DAP; this measurement stays unscored."


def compare_measurements(observation, profile, dap, region=None):
    comparisons = []
    for metric, label in NUMERIC_METRICS.items():
        actual = getattr(observation, metric, None)
        if actual is None:
            comparisons.append({
                "metric": metric,
                "label": metric.replace("_", " ").title(),
                "actual": None,
                "unit": {"plant_height_cm": "cm", "tiller_count": "count", "establishment_pct": "%", "soil_moisture_pct": "%"}[metric],
                "status": "not_recorded",
                "explanation": "No measurement was recorded for this indicator on this observation date.",
                "reference": None,
            })
            continue
        reference = _metric_reference(profile, metric, dap, region)
        if reference is None:
            comparisons.append({
                "metric": metric,
                "label": metric.replace("_", " ").title(),
                "actual": actual,
                "unit": {"plant_height_cm": "cm", "tiller_count": "count", "establishment_pct": "%", "soil_moisture_pct": "%"}[metric],
                "status": "insufficient_reference",
                "explanation": _reference_gap_explanation(profile, metric, dap, region),
                "reference": None,
            })
            continue
        comparison_actual = actual
        comparison_unit = reference.get("unit")
        if metric == "tiller_count":
            area = getattr(observation, "measurement_area_m2", None)
            if not area or comparison_unit not in {"tillers/m²", "tillers per m²"}:
                comparisons.append({
                    "metric": metric,
                    "label": metric.replace("_", " ").title(),
                    "actual": actual,
                    "unit": "count",
                    "status": "insufficient_reference",
                    "explanation": "Tiller counts can be compared only after converting the recorded count and sample area to the reference unit (tillers per square metre).",
                    "reference": None,
                })
                continue
            comparison_actual = float(actual) / float(area)
        low, high = float(reference["low"]), float(reference["high"])
        evidence_class = reference.get("evidence_class")
        if evidence_class == "trial_mean_plus_minus_one_sd":
            result = "below_trial_band" if comparison_actual < low else "above_trial_band" if comparison_actual > high else "within_trial_band"
            explanations = {
                "below_trial_band": "Below this study's mean ± 1 SD band. This is a trial comparison, not a diagnosis or proof of poor crop health.",
                "within_trial_band": "Within this study's mean ± 1 SD band. Trial conditions differ from other farms; this does not certify crop health.",
                "above_trial_band": "Above this study's mean ± 1 SD band. This is a trial comparison, not proof of unusually good crop health.",
            }
        else:
            result = "below_reference" if comparison_actual < low else "above_reference" if comparison_actual > high else "within_reference"
            explanations = {
                "below_reference": "The recorded value is below the configured reference range; verify the measurement and local conditions.",
                "within_reference": "The recorded value is within the configured reference range for its stated conditions.",
                "above_reference": "The recorded value is above the configured reference range; verify the measurement and local conditions.",
            }
        comparisons.append({
            "metric": metric,
            "label": metric.replace("_", " ").title(),
            "actual": round(comparison_actual, 3) if metric == "tiller_count" else actual,
            "unit": comparison_unit,
            "status": result,
            "explanation": explanations[result],
            "reference": {
                "low": low, "high": high, "unit": reference.get("unit"),
                "region": reference.get("region"), "conditions": reference.get("conditions"),
                "source": reference.get("source"), "method": reference.get("method"),
                "evidence_class": evidence_class,
            },
        })
    return comparisons


def _strategy_for(key, strategies):
    return strategies.get(key) or {
        "problem": key.replace("_", " ").title(),
        "possible_causes": ["This observation can have multiple causes and does not confirm a diagnosis."],
        "investigate": ["Verify the observation and record relevant field conditions."],
        "immediate_actions": ["Record a follow-up observation and consult local agricultural guidance."],
        "avoid": ["Do not apply chemical or nutrient inputs solely from this observation."],
        "follow_up_days": 7,
        "expert_help": "Contact a local agricultural extension officer if the condition persists or spreads.",
        "source": {"evidence_class": "general scouting guidance; diagnosis unconfirmed"},
    }


def assess_observation(cycle, observation, profile, history, strategies, region=None):
    dap = observation.dap
    comparisons = compare_measurements(observation, profile, dap, region)
    alerts = []
    quality = []
    if observation.plant_height_cm is not None and observation.plant_height_cm <= 0:
        quality.append("Plant height must be positive; correct this measurement.")
    if observation.tiller_count is not None and observation.measurement_area_m2 is None:
        quality.append("Add the measured area before comparing tiller counts over time.")
    if not any(getattr(observation, name, None) is not None for name in NUMERIC_METRICS):
        quality.append("No measured growth values were recorded for this observation.")

    symptoms = " ".join(str(getattr(observation, field, "") or "") for field in (
        "leaf_condition", "leaf_symptoms", "pest_symptoms", "disease_symptoms", "soil_or_drainage"
    )).casefold()
    symptom_rules = (
        ("leaf_yellowing", ("yellow", "pale")),
        ("wilting", ("wilt", "droop")),
        ("waterlogging", ("standing water", "waterlogged", "poor drainage", "water logging")),
        ("suspected_pest", ("pest", "borer", "insect", "feeding damage")),
        ("suspected_disease", ("disease", "rot", "smut", "rust", "lesion", "fungal")),
    )
    for rule_key, terms in symptom_rules:
        if any(term in symptoms for term in terms):
            strategy = _strategy_for(rule_key, strategies)
            alerts.append(_alert_payload(
                cycle, observation, rule_key, rule_key.replace("_", " "), None, "Farmer-reported symptom",
                "low", f"The farmer recorded a symptom matching the {strategy['problem'].lower()} scouting rule. This is not a diagnosis.", strategy
            ))

    previous = [item for item in history if item.id != observation.id and item.observation_date < observation.observation_date]
    previous.sort(key=lambda item: item.observation_date)
    prior = previous[-1] if previous else None
    if prior and observation.tiller_count is not None and prior.tiller_count is not None:
        if observation.measurement_area_m2 and prior.measurement_area_m2 and abs(observation.measurement_area_m2 - prior.measurement_area_m2) < 1e-6:
            if observation.tiller_count < prior.tiller_count:
                strategy = _strategy_for("tiller_decline", strategies)
                alerts.append(_alert_payload(
                    cycle, observation, "tiller_decline", "Tiller count", observation.tiller_count,
                    f"Previous count: {prior.tiller_count} on {prior.observation_date.isoformat()} for the same recorded area",
                    "low", "A lower count was recorded for the same sampling area. Sampling variation and crop conditions must be checked.", strategy
                ))
        else:
            quality.append("Tiller trend was not compared because the sampling area changed or was not recorded.")
    if prior and observation.plant_height_cm is not None and prior.plant_height_cm is not None and observation.plant_height_cm < prior.plant_height_cm:
        strategy = _strategy_for("height_decline", strategies)
        alerts.append(_alert_payload(
            cycle, observation, "height_decline", "Plant height", observation.plant_height_cm,
            f"Previous measurement: {prior.plant_height_cm} cm on {prior.observation_date.isoformat()}",
            "informational", "A lower height value was recorded than previously. Check sampling method, data entry, lodging, or breakage.", strategy
        ))

    for item in comparisons:
        if item["status"] not in {"below_reference", "above_reference"}:
            continue
        key = f"{item['metric']}_{item['status']}"
        strategy = _strategy_for(key, strategies)
        alerts.append(_alert_payload(
            cycle, observation, key, item["label"], item["actual"],
            f"{item['reference']['low']}–{item['reference']['high']} {item['unit']}", "moderate",
            item["explanation"], strategy
        ))
    return {"comparisons": comparisons, "alerts": alerts, "data_quality": quality}


def _alert_payload(cycle, observation, key, indicator, observed, reference, severity, evidence, strategy):
    return {
        "rule_key": key,
        "indicator": indicator,
        "observed_value": str(observed) if observed is not None else None,
        "reference_value": reference,
        "severity": severity,
        "evidence": evidence,
        "possible_explanations": strategy.get("possible_causes", []),
        "investigate": strategy.get("investigate", []),
        "mitigation": strategy.get("immediate_actions", []),
        "avoid": strategy.get("avoid", []),
        "follow_up_days": int(strategy.get("follow_up_days", 7)),
        "expert_help": strategy.get("expert_help", "Consult a local agricultural expert if the condition persists."),
        "source": strategy.get("source", {}),
        "cycle_id": cycle.id,
        "variety_code": cycle.variety_code,
        "observation_date": observation.observation_date.isoformat(),
        "dap": observation.dap,
    }


def expected_stage_guidance(stage, profile):
    return {
        "stage": stage,
        "variety_reference": profile,
        "reference_status": "Use variety-specific ranges only when a profile contains a sourced range matching crop age and region.",
        "activities": stage.get("activities", []),
        "observations": stage.get("observations", []),
        "frequency": stage.get("frequency"),
        "evidence_class": "General stage-planning guidance; not a variety-specific growth target.",
    }


def summarize_stage(cycle, stage, observations, tasks, alerts, today=None):
    today = today or date.today()
    dap = dap_for(cycle.planting_date, today)
    stage_observations = [item for item in observations if item.dap >= stage["start_day"] and (stage.get("end_day") is None or item.dap <= stage["end_day"])]
    stage_tasks = [item for item in tasks if stage["start_day"] <= dap_for(cycle.planting_date, item.due_date) and (stage.get("end_day") is None or dap_for(cycle.planting_date, item.due_date) <= stage["end_day"])]
    stage_alerts = [item for item in alerts if item.status not in {"resolved", "unconfirmed"} and (item.observation_id is None or item.observation_id in {observation.id for observation in stage_observations})]
    completed = sum(task.status == "completed" for task in stage_tasks)
    return {
        "stage_key": stage["key"], "name": stage["name"], "start_day": stage["start_day"], "end_day": stage["end_day"],
        "is_current": dap >= stage["start_day"] and (stage.get("end_day") is None or dap <= stage["end_day"]),
        "observations": len(stage_observations), "tasks_completed": completed,
        "tasks_pending": sum(task.status != "completed" for task in stage_tasks),
        "unresolved_alerts": len(stage_alerts),
        "assessment": "Evidence recorded; review the observations and unresolved alerts." if stage_observations else "Insufficient data: no observation has been recorded for this stage.",
    }


def stage_for_calendar_day(cycle, on_date, stage_references):
    dap = dap_for(cycle.planting_date, on_date)
    stage = stage_for_dap(dap, stage_references)
    return dap, stage


def next_checkpoint(dap):
    return next((day for day in CHECKPOINTS if day >= dap), None)


def report_payload(cycle, farm, field, stage_references, observations, tasks, alerts, profile, strategies=None):
    dap = dap_for(cycle.planting_date)
    stage = stage_for_dap(dap, stage_references)
    last_observation = observations[-1] if observations else None
    region = {"state": farm.state, "district": farm.district} if farm else None
    assessment = assess_observation(cycle, last_observation, profile, observations, strategies or MITIGATION_SEED, region) if last_observation else None
    return {
        "cycle_id": cycle.id,
        "farm": {"id": farm.id, "name": farm.name, "state": farm.state, "district": farm.district},
        "field": {"id": field.id, "name": field.name},
        "variety": cycle.variety_code,
        "planting_date": cycle.planting_date.isoformat(),
        "actual_dap": dap,
        "stage": stage,
        "variety_reference": profile,
        "observations": [observation_dict(item) for item in observations],
        "comparisons": assessment["comparisons"] if assessment else [],
        "data_quality": assessment["data_quality"] if assessment else ["No crop observations have been recorded."],
        "tasks": [task_dict(item) for item in tasks],
        "alerts": [alert_dict(item) for item in alerts],
        "limitations": ["Reports summarize stored farmer observations and configured rules. They do not diagnose disease or declare harvest readiness."],
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


def observation_dict(item):
    result = {name: getattr(item, name) for name in OBSERVATION_FIELDS}
    result.update({"id": item.id, "cycle_id": item.cycle_id, "observation_date": item.observation_date.isoformat(), "dap": item.dap, "source": item.source, "photo_available": bool(item.photo_path), "created_at": item.created_at.isoformat() if item.created_at else None, "updated_at": item.updated_at.isoformat() if item.updated_at else None})
    return result


def task_dict(item):
    return {"id": item.id, "cycle_id": item.cycle_id, "due_date": item.due_date.isoformat(), "title": item.title, "category": item.category, "details": item.details, "priority": item.priority, "status": item.status, "completed_at": item.completed_at.isoformat() if item.completed_at else None, "created_at": item.created_at.isoformat() if item.created_at else None}


def alert_dict(item):
    return {"id": item.id, "cycle_id": item.cycle_id, "observation_id": item.observation_id, "rule_key": item.rule_key, "indicator": item.indicator, "observed_value": item.observed_value, "reference_value": item.reference_value, "severity": item.severity, "evidence": item.evidence, "possible_explanations": parse_json(item.possible_explanations_json, []), "investigate": parse_json(item.investigate_json, []), "mitigation": parse_json(item.mitigation_json, []), "follow_up_date": item.follow_up_date.isoformat() if item.follow_up_date else None, "status": item.status, "resolution_notes": item.resolution_notes, "created_at": item.created_at.isoformat() if item.created_at else None}
