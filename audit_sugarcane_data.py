import csv
from collections import Counter
from pathlib import Path

FILES = [
    Path(r"C:\Users\chand\OneDrive\Desktop\master_sugarcane_training_dataset.csv"),
    Path(r"C:\Users\chand\OneDrive\Desktop\Cleaned_Sugarcane_Dataset.csv"),
    Path(r"C:\Users\chand\OneDrive\Desktop\Major-project\backend\data\sugarcane_varieties_master.csv"),
]

for path in FILES:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle)
        headers = next(reader)
        rows = list(reader)
    missing = [sum(not value.strip() for value in column) for column in zip(*rows)]
    print(f"\n{path.name}: {len(rows):,} rows; {len(headers)} columns")
    duplicates = [key for key, count in Counter(headers).items() if count > 1]
    if duplicates:
        print("Duplicate headers:", duplicates)
    print("Top missing columns:")
    for header, count in sorted(zip(headers, missing), key=lambda item: item[1], reverse=True)[:12]:
        print(f"  {header}: {count:,} ({count / len(rows):.1%})")
    if "original_file" in headers:
        index = headers.index("original_file")
        print("Source components:", Counter(row[index] if index < len(row) else "" for row in rows).most_common())
