"""
Data Visualization for Enriched Sugarcane Dataset
==================================================

Creates visualization plots to understand the enriched dataset:
- Data completeness heatmap
- Yield distribution by state/variety
- NDVI time series patterns
- Weather vs Yield correlation
- Feature importance preview

Usage:
    python visualize_enriched_data.py
"""

import pandas as pd
import numpy as np
import os

def print_banner(text):
    """Print formatted banner"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def visualize_data_completeness(df):
    """Show data completeness as a text-based visualization"""
    print_banner("📊 DATA COMPLETENESS")
    
    completeness = df.notna().mean().sort_values(ascending=False) * 100
    
    # Group by completeness ranges
    complete = completeness[completeness >= 80]
    moderate = completeness[(completeness >= 50) & (completeness < 80)]
    incomplete = completeness[completeness < 50]
    
    print(f"\n✅ Complete Features (≥80%): {len(complete)}")
    for col, pct in complete.head(15).items():
        bar = "█" * int(pct / 5)
        print(f"  {col:30s} {bar} {pct:5.1f}%")
    
    if len(complete) > 15:
        print(f"  ... and {len(complete) - 15} more")
    
    print(f"\n⚠️  Moderate Features (50-80%): {len(moderate)}")
    for col, pct in moderate.head(10).items():
        bar = "▓" * int(pct / 5)
        print(f"  {col:30s} {bar} {pct:5.1f}%")
    
    if len(incomplete) > 0:
        print(f"\n❌ Incomplete Features (<50%): {len(incomplete)}")
        for col, pct in incomplete.head(10).items():
            bar = "░" * int(pct / 5)
            print(f"  {col:30s} {bar} {pct:5.1f}%")

def visualize_yield_distribution(df):
    """Show yield distribution statistics"""
    print_banner("🎯 YIELD DISTRIBUTION")
    
    if 'yield' not in df.columns:
        print("⚠️  No yield column found")
        return
    
    yield_data = df['yield'].dropna()
    
    print(f"\nTotal Records: {len(yield_data):,}")
    print(f"Mean Yield:    {yield_data.mean():.2f} t/ha")
    print(f"Median Yield:  {yield_data.median():.2f} t/ha")
    print(f"Std Dev:       {yield_data.std():.2f} t/ha")
    print(f"Min Yield:     {yield_data.min():.2f} t/ha")
    print(f"Max Yield:     {yield_data.max():.2f} t/ha")
    
    # Create histogram using text
    print("\nYield Distribution (Histogram):")
    bins = [0, 20, 40, 60, 80, 100, 120, 200]
    hist, _ = np.histogram(yield_data, bins=bins)
    max_count = hist.max()
    
    for i in range(len(bins) - 1):
        count = hist[i]
        bar = "█" * int(count / max_count * 50)
        print(f"  {bins[i]:3.0f}-{bins[i+1]:3.0f} t/ha │{bar} {count:,}")

def visualize_state_analysis(df):
    """Analyze data by state"""
    print_banner("🗺️  STATE-WISE ANALYSIS")
    
    if 'state' not in df.columns:
        print("⚠️  No state column found")
        return
    
    state_stats = df.groupby('state').agg({
        'yield': ['count', 'mean', 'std'] if 'yield' in df.columns else ['count']
    }).round(2)
    
    print(f"\nTop 10 States by Number of Records:")
    
    if 'yield' in df.columns:
        state_counts = df.groupby('state')['yield'].agg(['count', 'mean']).sort_values('count', ascending=False)
        
        for state, row in state_counts.head(10).iterrows():
            count = int(row['count'])
            mean_yield = row['mean']
            bar = "█" * min(50, int(count / 100))
            print(f"  {state:20s} │{bar} {count:5,} records, avg yield: {mean_yield:.1f} t/ha")
    else:
        state_counts = df['state'].value_counts()
        for state, count in state_counts.head(10).items():
            bar = "█" * min(50, int(count / 100))
            print(f"  {state:20s} │{bar} {count:5,} records")

def visualize_variety_analysis(df):
    """Analyze data by variety"""
    print_banner("🌱 VARIETY ANALYSIS")
    
    if 'variety' not in df.columns:
        print("⚠️  No variety column found")
        return
    
    variety_counts = df['variety'].value_counts()
    
    print(f"\nTop 10 Varieties by Frequency:")
    print(f"Total Unique Varieties: {df['variety'].nunique()}")
    print()
    
    for variety, count in variety_counts.head(10).items():
        pct = count / len(df) * 100
        bar = "█" * int(pct * 2)
        
        # Get average yield for this variety if available
        if 'yield' in df.columns:
            avg_yield = df[df['variety'] == variety]['yield'].mean()
            print(f"  {variety:20s} │{bar} {count:5,} ({pct:4.1f}%), avg: {avg_yield:.1f} t/ha")
        else:
            print(f"  {variety:20s} │{bar} {count:5,} ({pct:4.1f}%)")

def visualize_ndvi_patterns(df):
    """Visualize NDVI patterns"""
    print_banner("🛰️  NDVI PATTERNS")
    
    ndvi_cols = ['ndvi_30d', 'ndvi_60d', 'ndvi_90d', 'ndvi_120d', 'ndvi_150d']
    available_ndvi = [col for col in ndvi_cols if col in df.columns]
    
    if not available_ndvi:
        print("⚠️  No NDVI columns found")
        return
    
    print("\nAverage NDVI Growth Curve:")
    print("(Sugarcane typically peaks at 90-120 days)")
    print()
    
    for col in available_ndvi:
        day = col.split('_')[1]
        mean_val = df[col].mean()
        std_val = df[col].std()
        
        if pd.notna(mean_val):
            bar = "█" * int(mean_val * 50)
            health = "🟢" if mean_val > 0.6 else "🟡" if mean_val > 0.4 else "🔴"
            print(f"  {day:6s} {health} │{bar} {mean_val:.3f} (±{std_val:.3f})")
    
    # Vegetation health distribution
    if 'vegetation_health' in df.columns:
        print("\nVegetation Health Distribution:")
        health_counts = df['vegetation_health'].value_counts()
        total = len(df)
        
        for health, count in health_counts.items():
            pct = count / total * 100
            bar = "█" * int(pct)
            emoji = "🟢" if health == 'Good' else "🟡" if health == 'Moderate' else "🔴"
            print(f"  {emoji} {health:12s} │{bar} {count:5,} ({pct:5.1f}%)")

def visualize_weather_patterns(df):
    """Visualize weather patterns"""
    print_banner("☁️  WEATHER PATTERNS")
    
    weather_cols = {
        'rainfall_mm': ('Rainfall', 'mm'),
        'avg_temperature_c': ('Temperature', '°C'),
        'humidity_percent': ('Humidity', '%')
    }
    
    available_weather = {k: v for k, v in weather_cols.items() if k in df.columns}
    
    if not available_weather:
        print("⚠️  No weather columns found")
        return
    
    print("\nWeather Statistics:")
    print()
    
    for col, (label, unit) in available_weather.items():
        data = df[col].dropna()
        
        if len(data) > 0:
            mean = data.mean()
            std = data.std()
            min_val = data.min()
            max_val = data.max()
            
            print(f"{label:15s}: {mean:6.1f} {unit} (±{std:5.1f})")
            print(f"                 Range: {min_val:6.1f} - {max_val:6.1f} {unit}")
            print()

def visualize_feature_correlations(df):
    """Show potential feature correlations with yield"""
    print_banner("📈 FEATURE RELATIONSHIPS")
    
    if 'yield' not in df.columns:
        print("⚠️  No yield column found")
        return
    
    # Select numerical columns
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    numerical_cols = [col for col in numerical_cols if col != 'yield' and df[col].notna().sum() > 100]
    
    if not numerical_cols:
        print("⚠️  Not enough numerical features")
        return
    
    print("\nTop Features Correlated with Yield:")
    print("(Based on available data)")
    print()
    
    correlations = []
    for col in numerical_cols:
        try:
            corr = df[['yield', col]].dropna().corr().iloc[0, 1]
            if pd.notna(corr):
                correlations.append((col, corr))
        except:
            pass
    
    correlations.sort(key=lambda x: abs(x[1]), reverse=True)
    
    for col, corr in correlations[:15]:
        bar_len = int(abs(corr) * 30)
        bar = "█" * bar_len
        sign = "+" if corr > 0 else "-"
        emoji = "🔺" if corr > 0 else "🔻"
        print(f"  {col:30s} {emoji} {sign}{bar} {corr:+.3f}")

def generate_model_readiness_report(df):
    """Generate ML model readiness report"""
    print_banner("🤖 ML MODEL READINESS")
    
    print("\n✅ Dataset Overview:")
    print(f"   Total Records:        {len(df):,}")
    print(f"   Total Features:       {len(df.columns)}")
    print(f"   Memory Usage:         {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
    
    # Check target variable
    if 'yield' in df.columns:
        yield_completeness = df['yield'].notna().mean() * 100
        status = "✅" if yield_completeness > 90 else "⚠️" if yield_completeness > 70 else "❌"
        print(f"\n{status} Target Variable (yield):")
        print(f"   Completeness:         {yield_completeness:.1f}%")
        print(f"   Valid Records:        {df['yield'].notna().sum():,}")
    
    # Count feature types
    numerical = len(df.select_dtypes(include=[np.number]).columns)
    categorical = len(df.select_dtypes(include=['object']).columns)
    
    print(f"\n📊 Feature Types:")
    print(f"   Numerical Features:   {numerical}")
    print(f"   Categorical Features: {categorical}")
    
    # Check key feature categories
    categories = {
        'Location': ['state', 'district'],
        'Temporal': ['year', 'season'],
        'Weather': ['rainfall_mm', 'avg_temperature_c'],
        'Soil': ['soil_ph', 'nitrogen_kg_ha'],
        'NDVI': ['ndvi_mean', 'ndvi_max'],
        'Variety': ['variety', 'maturity'],
    }
    
    print(f"\n📋 Feature Category Readiness:")
    
    for category, required_cols in categories.items():
        available = sum(1 for col in required_cols if col in df.columns)
        total = len(required_cols)
        
        if available == total:
            status = "✅"
        elif available > 0:
            status = "⚠️"
        else:
            status = "❌"
        
        print(f"   {status} {category:12s}: {available}/{total} features available")
    
    # Overall completeness
    overall_completeness = df.notna().mean().mean() * 100
    
    print(f"\n📈 Overall Data Completeness: {overall_completeness:.1f}%")
    
    if overall_completeness > 70:
        print("\n🎉 Dataset is READY for ML modeling!")
        print("   Recommended next steps:")
        print("   1. Handle missing values (imputation or drop)")
        print("   2. Encode categorical variables")
        print("   3. Split into train/test sets")
        print("   4. Train Random Forest and XGBoost models")
    elif overall_completeness > 50:
        print("\n⚠️  Dataset needs some attention:")
        print("   1. Review DATA_QUALITY_REPORT.txt")
        print("   2. Add more data for missing features")
        print("   3. Consider feature selection")
        print("   4. Proceed with imputation strategy")
    else:
        print("\n❌ Dataset needs significant enrichment:")
        print("   1. Re-run enrichment with all options")
        print("   2. Add external data sources")
        print("   3. Review data collection process")

def main():
    """Main visualization function"""
    print("=" * 70)
    print("  🌾 ENRICHED SUGARCANE DATASET VISUALIZATION")
    print("=" * 70)
    
    # Find the enriched dataset
    possible_files = [
        'enriched_data/FINAL_ML_READY_SUGARCANE_DATASET.csv',
        'enriched_data/ndvi_enriched_dataset.csv',
        'enriched_data/weather_enriched_dataset.csv',
        'enriched_data/step1_base_enriched.csv',
        'enriched_data/ml_ready_sugarcane_dataset.csv'
    ]
    
    data_file = None
    for file_path in possible_files:
        if os.path.exists(file_path):
            data_file = file_path
            break
    
    if not data_file:
        print("\n❌ No enriched dataset found!")
        print("Please run the enrichment pipeline first:")
        print("   python run_complete_enrichment.py --sample 50 --skip-weather --skip-ndvi")
        return
    
    print(f"\n📂 Loading: {data_file}")
    df = pd.read_csv(data_file)
    print(f"✅ Loaded {len(df):,} records with {len(df.columns)} features")
    
    # Run all visualizations
    visualize_data_completeness(df)
    visualize_yield_distribution(df)
    visualize_state_analysis(df)
    visualize_variety_analysis(df)
    visualize_ndvi_patterns(df)
    visualize_weather_patterns(df)
    visualize_feature_correlations(df)
    generate_model_readiness_report(df)
    
    print("\n" + "=" * 70)
    print("  ✅ VISUALIZATION COMPLETE")
    print("=" * 70)
    print("\nNext Steps:")
    print("1. Review the visualizations above")
    print("2. Check DATA_QUALITY_REPORT.txt for detailed analysis")
    print("3. Start ML modeling if readiness is good")
    print("4. Consider additional enrichment if needed")

if __name__ == "__main__":
    main()
