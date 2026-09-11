"""Create a full, no-blank, multi-sheet Excel workbook from sugarcane CSV data."""
import csv
import math
from collections import Counter
from pathlib import Path
from statistics import median

import xlsxwriter

ROOT = Path(r"C:\Users\chand\OneDrive\Desktop\Major-project")
SOURCES = [
    ("Training Data", Path(r"C:\Users\chand\OneDrive\Desktop\master_sugarcane_training_dataset.csv")),
    ("Production Data", Path(r"C:\Users\chand\OneDrive\Desktop\Cleaned_Sugarcane_Dataset.csv")),
    ("Variety Master", ROOT / "backend" / "data" / "sugarcane_varieties_master.csv"),
]
OUTPUT = ROOT / "sugarcane_complete_imputed_workbook.xlsx"


def as_number(value):
    text = value.strip().replace(",", "")
    try:
        result = float(text)
        return result if math.isfinite(result) else None
    except ValueError:
        return None


def analyse(path):
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.reader(file)
        headers = next(reader)
        stats = [{"observed": 0, "numeric": 0, "numbers": [], "texts": Counter(), "missing": 0} for _ in headers]
        for row in reader:
            row.extend([""] * (len(headers) - len(row)))
            for index, value in enumerate(row[:len(headers)]):
                value = value.strip()
                stat = stats[index]
                if not value:
                    stat["missing"] += 1
                    continue
                stat["observed"] += 1
                numeric = as_number(value)
                if numeric is not None:
                    stat["numeric"] += 1
                    stat["numbers"].append(numeric)
                stat["texts"][value] += 1
    rules = []
    for header, stat in zip(headers, stats):
        numeric = stat["observed"] > 0 and stat["numeric"] / stat["observed"] >= 0.95
        if numeric:
            fill = median(stat["numbers"])
            strategy = "Median (numeric)"
        else:
            fill = stat["texts"].most_common(1)[0][0] if stat["texts"] else "Not recorded"
            strategy = "Mode (categorical)"
        rules.append({"header": header, "numeric": numeric, "fill": fill,
                      "strategy": strategy, "replaced": stat["missing"]})
    return headers, rules


workbook = xlsxwriter.Workbook(OUTPUT, {"constant_memory": True, "strings_to_numbers": False})
header_format = workbook.add_format({"bold": True, "font_color": "#FFFFFF", "bg_color": "#1F4E78", "border": 0,
                                      "text_wrap": True, "valign": "vcenter"})
title_format = workbook.add_format({"bold": True, "font_color": "#FFFFFF", "bg_color": "#1F4E78", "font_size": 14,
                                     "align": "center", "valign": "vcenter"})
subheader_format = workbook.add_format({"bold": True, "bg_color": "#D9EAF7", "text_wrap": True})
wrap_format = workbook.add_format({"text_wrap": True, "valign": "top"})
numeric_format = workbook.add_format({"num_format": "0.00"})

audit_rows = []
for sheet_name, source_path in SOURCES:
    headers, rules = analyse(source_path)
    sheet = workbook.add_worksheet(sheet_name)
    sheet.hide_gridlines(2)
    sheet.freeze_panes(1, min(2, len(headers)))
    sheet.set_row(0, 30)
    sheet.write_row(0, 0, headers, header_format)
    for index, header in enumerate(headers):
        width = min(max(len(header) + 2, 12), 25)
        sheet.set_column(index, index, width, numeric_format if rules[index]["numeric"] else None)
    with source_path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.reader(file)
        next(reader)
        for row_index, row in enumerate(reader, start=1):
            row.extend([""] * (len(headers) - len(row)))
            for col_index, rule in enumerate(rules):
                value = row[col_index].strip() if col_index < len(row) else ""
                if not value:
                    value = rule["fill"]
                if rule["numeric"]:
                    numeric = as_number(str(value))
                    sheet.write_number(row_index, col_index, numeric if numeric is not None else float(rule["fill"]))
                else:
                    sheet.write_string(row_index, col_index, str(value))
    sheet.autofilter(0, 0, row_index, len(headers) - 1)
    audit_rows.extend([[sheet_name, rule["header"], "Numeric" if rule["numeric"] else "Categorical",
                        rule["strategy"], rule["replaced"], rule["fill"]] for rule in rules])

guide = workbook.add_worksheet("Imputation Guide")
guide.hide_gridlines(2)
guide.merge_range("A1:F1", "Sugarcane Dataset: Missing-Value Treatment", title_format)
guide.set_row(0, 28)
guide.write_row("A3", ["Rule", "Implementation"], subheader_format)
guide.set_column("A:A", 24)
guide.set_column("B:B", 80, wrap_format)
guide.write_row("A4", ["Numeric columns", "Blank values were replaced with the median for the same column and source sheet. Median is robust to outliers."], wrap_format)
guide.write_row("A5", ["Categorical columns", "Blank values were replaced with the most frequent observed value (mode) in the same column and source sheet."], wrap_format)
guide.write_row("A6", ["Source separation", "Training, Production, and Variety data are kept on separate sheets. Values were never borrowed across sources."], wrap_format)
guide.write_row("A7", ["No blank cells", "Every blank source cell has been replaced. The audit below identifies the strategy and number of replacements."], wrap_format)
guide.set_row(3, 35)
guide.set_row(4, 35)
guide.set_row(5, 35)
guide.set_row(6, 35)
guide.write_row("A10", ["Sheet", "Field", "Type", "Strategy", "Values Replaced", "Replacement Value"], header_format)
guide.set_column("C:D", 20)
guide.set_column("E:E", 18)
guide.set_column("F:F", 35)
for index, audit in enumerate(audit_rows, start=10):
    guide.write_row(index, 0, audit)
guide.freeze_panes(10, 0)
guide.autofilter(9, 0, 9 + len(audit_rows), 5)
workbook.close()
print(f"Created {OUTPUT} with {len(audit_rows)} field-level imputation audit records.")
