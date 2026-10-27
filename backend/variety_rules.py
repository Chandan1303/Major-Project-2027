import json
import os
import re
from pathlib import Path


DEFAULT_RECOMMENDATIONS_PATH = (
    Path(__file__).resolve().parent / "data" / "state_variety_recommendations.json"
)


def load_state_variety_recommendations(path=None):
    configured_path = path or os.environ.get("SUGARCANE_VARIETY_RECOMMENDATIONS_FILE")
    recommendations_path = Path(configured_path).expanduser() if configured_path else DEFAULT_RECOMMENDATIONS_PATH
    with recommendations_path.open(encoding="utf-8") as source:
        config = json.load(source)

    states = config.get("states")
    if not isinstance(states, dict) or any(
        not isinstance(state, str)
        or not isinstance(varieties, list)
        or any(not isinstance(variety, str) for variety in varieties)
        for state, varieties in states.items()
    ):
        raise ValueError("State-variety configuration must contain a states object of variety lists.")
    return config


def canonical_state(value):
    state = (value or "").strip()
    state = re.sub(r"^(southern|northern|central|western|eastern)\s+", "", state, flags=re.I)
    return state.casefold()


def configured_varieties_for_state(state, config):
    normalized_state = canonical_state(state)
    for state_name, variety_codes in config["states"].items():
        if canonical_state(state_name) == normalized_state:
            return list(variety_codes)
    return []


def filter_varieties_for_state(varieties, state, config):
    state_mappings = {
        canonical_state(name): {code.casefold() for code in codes}
        for name, codes in config["states"].items()
    }
    if state:
        allowed_codes = state_mappings.get(canonical_state(state), set())
    else:
        allowed_codes = set().union(*state_mappings.values()) if state_mappings else set()

    filtered = []

    for variety in varieties:
        code = (variety.get("code") or "").casefold()
        if code not in allowed_codes:
            continue
        recommended_states = [
            name for name, codes in config["states"].items()
            if code in {configured_code.casefold() for configured_code in codes}
        ]
        filtered.append({**variety, "recommended_states": recommended_states})

    return filtered

def filter_varieties_for_recorded_fields(varieties, field_varieties):
    recorded = {
        str(value).strip().casefold()
        for value in field_varieties
        if value and str(value).strip()
    }
    return [
        variety for variety in varieties
        if (variety.get("code") or "").casefold() in recorded
        or (variety.get("name") or "").casefold() in recorded
    ]

def soils_for_recorded_variety(fields, variety_code, variety_name):
    variety_names = {
        value.strip().casefold()
        for value in (variety_code, variety_name)
        if value and value.strip()
    }
    return sorted({
        field.soil_type.strip()
        for field in fields
        if field.sugarcane_variety
        and field.sugarcane_variety.strip().casefold() in variety_names
        and field.soil_type
        and field.soil_type.strip()
    })


def is_variety_allowed_in_state(variety_code, state, config):
    if not variety_code or not state:
        return False
    return any(
        code.casefold() == variety_code.strip().casefold()
        for code in configured_varieties_for_state(state, config)
    )