"""
Calculate Realistic Variety Benchmarks from Training Data
==========================================================
This script analyzes the actual training dataset to determine:
1. What are the ACTUAL highest yields achieved for each variety?
2. What is the 90th percentile (top 10% of farmers achieve this)?
3. What is the 75th percentile (top 25% of farmers achieve this)?

This gives us DATA-DRIVEN benchmarks instead of guessing.
"""

import pandas as pd
import numpy as np
from pathlib import Path

print("="*80)
print("VARIETY BENCHMARK CALCULATOR - Based on Real Training Data")
print("="*80)

# Load the training dataset
data_path = Path('final_dataset/SUGARCANE_COMPLETE_ML_DATASET.csv')
print(f"\n[1] Loading dataset: {data_path}")
df = pd.read_csv(data_path)
print(f"    Loaded: {len(df):,} records")

# Check if yield column exists
yield_col = None
for col in ['yield_t_ha', 'yield', 'Yield', 'yield_tonnes_per_hectare']:
    if col in df.columns:
        yield_col = col
        break

if yield_col is None:
    print("\n❌ ERROR: Could not find yield column in dataset")
    print(f"Available columns: {list(df.columns)}")
    exit(1)

print(f"    Using yield column: '{yield_col}'")

# Check if variety column exists
variety_col = None
for col in ['variety', 'Variety', 'sugarcane_variety', 'variety_name']:
    if col in df.columns:
        variety_col = col
        break

if variety_col is None:
    print("\n❌ ERROR: Could not find variety column in dataset")
    print(f"Available columns: {list(df.columns)}")
    exit(1)

print(f"    Using variety column: '{variety_col}'")

# Analyze each variety
print("\n" + "="*80)
print("[2] Analyzing Yield Statistics by Variety")
print("="*80)

varieties = df[variety_col].unique()
print(f"\nFound {len(varieties)} varieties in dataset")

benchmarks = {}

for variety in sorted(varieties):
    if pd.isna(variety):
        continue
    
    variety_data = df[df[variety_col] == variety][yield_col].dropna()
    
    if len(variety_data) < 10:  # Skip varieties with too few samples
        continue
    
    stats = {
        'count': len(variety_data),
        'mean': variety_data.mean(),
        'median': variety_data.median(),
        'std': variety_data.std(),
        'min': variety_data.min(),
        'max': variety_data.max(),
        'p25': variety_data.quantile(0.25),
        'p50': variety_data.quantile(0.50),
        'p75': variety_data.quantile(0.75),
        'p90': variety_data.quantile(0.90),
        'p95': variety_data.quantile(0.95)
    }
    
    benchmarks[variety] = stats
    
    print(f"\n{'─'*80}")
    print(f"Variety: {variety}")
    print(f"{'─'*80}")
    print(f"  Sample Size:        {stats['count']:>6,} records")
    print(f"  Mean Yield:         {stats['mean']:>6.2f} t/ha")
    print(f"  Median Yield:       {stats['median']:>6.2f} t/ha")
    print(f"  Std Deviation:      {stats['std']:>6.2f} t/ha")
    print(f"  Min Yield:          {stats['min']:>6.2f} t/ha")
    print(f"  Max Yield:          {stats['max']:>6.2f} t/ha")
    print(f"  ─────────────────────────────────")
    print(f"  25th Percentile:    {stats['p25']:>6.2f} t/ha  (bottom 25% achieve this)")
    print(f"  50th Percentile:    {stats['p50']:>6.2f} t/ha  (average farmer)")
    print(f"  75th Percentile:    {stats['p75']:>6.2f} t/ha  (top 25% achieve this) ✓")
    print(f"  90th Percentile:    {stats['p90']:>6.2f} t/ha  (top 10% achieve this) ✓✓")
    print(f"  95th Percentile:    {stats['p95']:>6.2f} t/ha  (top 5% achieve this)")

# Generate recommendations
print("\n\n" + "="*80)
print("[3] RECOMMENDED BENCHMARKS")
print("="*80)

print("\n🎯 OPTION 1: Use 90th Percentile (Top 10% Achievement)")
print("   → Ambitious but achievable target for good farmers")
print("─"*80)
print("variety_potentials = {")
for variety, stats in sorted(benchmarks.items()):
    print(f'    "{variety}": {stats["p90"]:.1f},  # Top 10% achieve this')
print("}")

print("\n🎯 OPTION 2: Use 75th Percentile (Top 25% Achievement)")
print("   → Realistic target for above-average farmers")
print("─"*80)
print("variety_potentials = {")
for variety, stats in sorted(benchmarks.items()):
    print(f'    "{variety}": {stats["p75"]:.1f},  # Top 25% achieve this')
print("}")

print("\n🎯 OPTION 3: Use Mean + 0.5 * Std Dev")
print("   → Statistical benchmark (68% of farmers below this)")
print("─"*80)
print("variety_potentials = {")
for variety, stats in sorted(benchmarks.items()):
    benchmark = stats['mean'] + 0.5 * stats['std']
    print(f'    "{variety}": {benchmark:.1f},')
print("}")

# Show comparison with current benchmarks
print("\n\n" + "="*80)
print("[4] COMPARISON WITH CURRENT CODE BENCHMARKS")
print("="*80)

current_benchmarks = {
    "Co 86032": 95.0,
    "Co 0238": 105.0,
    "CoC 671": 85.0,
    "Co 99004": 90.0,
    "CoM 0265": 110.0,
    "Co 94012": 90.0,
    "Co 419": 95.0,
    "Co 62175": 100.0
}

print("\n{:<20} {:>12} {:>12} {:>12} {:>12}".format(
    "Variety", "Current", "Data P75", "Data P90", "Status"
))
print("─"*80)

for variety, current in current_benchmarks.items():
    if variety in benchmarks:
        p75 = benchmarks[variety]['p75']
        p90 = benchmarks[variety]['p90']
        
        # Determine if current is reasonable
        if p75 <= current <= p90:
            status = "✓ Good"
        elif current < p75:
            status = "⚠ Too Low"
        elif current > p90:
            status = "⚠ Too High"
        else:
            status = "?"
        
        print(f"{variety:<20} {current:>10.1f}   {p75:>10.1f}   {p90:>10.1f}   {status}")
    else:
        print(f"{variety:<20} {current:>10.1f}   {'N/A':>10}   {'N/A':>10}   ⚠ No Data")

print("\n" + "="*80)
print("ANALYSIS COMPLETE")
print("="*80)
print("\n💡 RECOMMENDATION:")
print("   Use OPTION 1 (90th percentile) for ambitious but achievable targets")
print("   This represents what the top 10% of farmers actually achieve in real data")
print("\n")
