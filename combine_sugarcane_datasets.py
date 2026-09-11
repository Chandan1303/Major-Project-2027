"""Build one traceable, imputed union of the supplied sugarcane CSV files."""

import csv
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path
from statistics import median

ROOT = Path(r"C:\Users\chand\OneDrive\Desktop\Major-project")
INPUTS = [
    ("training", Path(r"C:\Users\chand\OneDrive\Desktop\master_sugarcane_training_dataset.csv")),
    ("production", Path(r"C:\Users\chand\OneDrive\Desktop\Cleaned_Sugarcane_Dataset.csv")),
    ("variety", ROOT / "backend" / "data" / "sugarcane_varieties_master.csv"),
]
OUTPUT = ROOT / "combined_sugarcane_dataset.csv"
REPORT = ROOT / "combined_sugarcane_cleaning_report.md"

# Correct known aliases/typos before aligning columns across sources.
ALIASES = {
    "distcode": "district_code", "districtcode": "district_code",
    "statecode": "state_code", "statename": "state_name",
    "distname": "district_name", "districtname": "district_name",
    "cropyear": "crop_year", "year": "year",
    "yieldtonnesperhectare": "yield_t_ha", "yieldtonnehectare": "yield_t_ha",
    "averageyieldofsugarcaneintonnesha": "yield_t_ha",
    "caneyieldtha": "cane_yield_t_ha", "potasium": "potassium",
    "presipitasi": "precipitation", "temparature": "temperature",
}


def canonical_header(header: str) -> str:
    key = re.sub(r"[^a-z0-9]+", "", header.lower())
    if key in ALIASES:
        return ALIASES[key]
    normalized = re.sub(r"[^a-z0-9]+", "_", header.lower()).strip("_")
    return normalized


def number(value: str):
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except (TypeError, ValueError):
        return None


def format_number(value: float) -> str:
    return str(int(value)) if value.is_integer() else format(value, ".10g")


def is_numeric(values):
    valid = [value for value in values if value]
    return bool(valid) and sum(number(value) is not None for value in valid) / len(valid) >= 0.95


def impute(records, field, group_name):
    """Impute only fields substantially populated for a source component."""
    values = [record[field] for record in records if record[field]]
    missing_records = [record for record in records if not record[field]]
    if not missing_records or len(values) < 20 or len(missing_records) / len(records) > 0.40:
        return None
    if is_numeric(values):
        numeric_values = [number(value) for value in values]
        fill_value = format_number(float(median(value for value in numeric_values if value is not None)))
        method = "median"
    else:
        counts = Counter(values)
        fill_value, mode_count = counts.most_common(1)[0]
        # Do not apply an unrepresentative categorical mode.
        if mode_count / len(values) < 0.15:
            return None
        method = "mode"
    for record in missing_records:
        record[field] = fill_value
        record["imputed_fields"] = ";".join(filter(None, [record["imputed_fields"], field]))
    return {"component": group_name, "field": field, "method": method,
            "filled": len(missing_records), "value": fill_value}


records = []
all_fields = set()
source_sizes = Counter()
for source_name, path in INPUTS:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle)
        original_headers = next(reader)
        headers = [canonical_header(header) for header in original_headers]
        for row_number, row in enumerate(reader, start=2):
            row += [""] * (len(headers) - len(row))
            record = {"record_id": f"{source_name}_{row_number - 1}", "source_dataset": source_name,
                      "source_file": path.name, "imputed_fields": ""}
            # Coalesce duplicate semantic headers without discarding observed values.
            for header, value in zip(headers, row):
                value = value.strip()
                if value and not record.get(header):
                    record[header] = value
            if source_name == "training":
                record["source_component"] = record.get("original_file", "training_unspecified")
            else:
                record["source_component"] = source_name
            records.append(record)
            all_fields.update(record)
            source_sizes[source_name] += 1

# Structural fields have their own source identifier; imputation occurs only in a logical component.
for record in records:
    for field in all_fields:
        record.setdefault(field, "")

imputations = []
by_component = defaultdict(list)
for record in records:
    by_component[record["source_component"]].append(record)

protected = {"record_id", "source_dataset", "source_file", "source_component", "imputed_fields"}
for component, component_records in by_component.items():
    component_fields = set().union(*(record.keys() for record in component_records)) - protected
    for field in sorted(component_fields):
        result = impute(component_records, field, component)
        if result:
            imputations.append(result)

ordered_meta = ["record_id", "source_dataset", "source_file", "source_component", "imputed_fields"]
ordered_fields = ordered_meta + sorted(all_fields - set(ordered_meta))
with OUTPUT.open("w", encoding="utf-8", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=ordered_fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(records)

imputed_records = sum(bool(record["imputed_fields"]) for record in records)
report = [
    "# Combined sugarcane dataset: cleaning report",
    "",
    f"Output: `{OUTPUT.name}`",
    "",
    "## Merge approach",
    "",
    "The sources do not share a reliable row-level key, so they were appended (unioned), not joined. "
    "`source_dataset`, `source_file`, and `source_component` preserve provenance for every row. "
    "Semantic duplicate headers were coalesced after normalization (for example, `State_Name`/`state_name`).",
    "",
    "## Result",
    "",
    f"- Rows: {len(records):,}",
    f"- Columns: {len(ordered_fields):,}",
    f"- Source rows: {', '.join(f'{name}={count:,}' for name, count in sorted(source_sizes.items()))}",
    f"- Rows with one or more imputed values: {imputed_records:,}",
    f"- Values imputed: {sum(item['filled'] for item in imputations):,}",
    "",
    "## Missing-value strategy",
    "",
    "Imputation was performed independently inside each logical source component. Numeric fields use the median, "
    "which is more robust than the mean for agricultural measurements with outliers. Categorical fields use the mode "
    "only when it represents at least 15% of observed values. A field is imputed only when it has at least 20 observed "
    "values and no more than 40% missing values in that component. Higher-missing fields remain blank because they are "
    "usually not collected for that component; filling them would fabricate data. The `imputed_fields` column records "
    "exactly which values were filled for each row.",
    "",
    "## Imputation log",
    "",
]
if imputations:
    report.append("| Component | Field | Method | Values filled | Imputed value |")
    report.append("|---|---|---:|---:|---|")
    for item in imputations:
        value = str(item["value"]).replace("|", "/")
        report.append(f"| {item['component']} | {item['field']} | {item['method']} | {item['filled']:,} | {value} |")
else:
    report.append("No fields met the conservative imputation criteria.")
REPORT.write_text("\n".join(report) + "\n", encoding="utf-8")

print(json.dumps({"output": str(OUTPUT), "report": str(REPORT), "rows": len(records),
                  "columns": len(ordered_fields), "imputed_values": sum(item["filled"] for item in imputations)}, indent=2))
