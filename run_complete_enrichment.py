"""
Complete Data Enrichment Pipeline Runner
=========================================

This script runs the entire enrichment pipeline:
1. Base structure creation
2. Variety assignment
3. Weather data enrichment
4. Soil data enrichment
5. NDVI data enrichment
6. Historical features
7. Final ML-ready dataset

Usage:
    python run_complete_enrichment.py [--sample SIZE] [--skip-weather] [--skip-ndvi]
"""

import argparse
import os
import sys
from datetime import datetime

# Import enrichment modules
from data_enrichment_pipeline import SugarcaneDataEnrichment
from weather_data_fetcher import WeatherDataFetcher
from ndvi_data_fetcher import NDVIDataFetcher

def print_banner(text):
    """Print a formatted banner"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")

def run_full_pipeline(args):
    """
    Run the complete enrichment pipeline
    
    Parameters:
    -----------
    args : argparse.Namespace
        Command line arguments
    """
    start_time = datetime.now()
    
    print_banner("🌾 SUGARCANE DATA ENRICHMENT PIPELINE 🌾")
    print(f"Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Sample size: {args.sample if args.sample else 'ALL RECORDS'}")
    print(f"Skip weather: {args.skip_weather}")
    print(f"Skip NDVI: {args.skip_ndvi}")
    
    # ================================================================
    # STEP 1: Base Structure & Core Enrichment
    # ================================================================
    print_banner("STEP 1: Creating Base Structure")
    
    pipeline = SugarcaneDataEnrichment(
        base_csv_path='combined_sugarcane_dataset.csv',
        variety_csv_path='backend/data/sugarcane_varieties_master.csv',
        output_dir='enriched_data'
    )
    
    # Run core enrichment steps
    (pipeline
     .create_base_structure()
     .add_variety_information()
     .add_weather_features()  # Creates template
     .add_soil_features()
     .add_ndvi_features()  # Creates template
     .add_irrigation_features()
     .add_historical_yield_features()
     .add_derived_features()
     .create_ml_ready_dataset())
    
    # Save intermediate result
    intermediate_path = 'enriched_data/step1_base_enriched.csv'
    pipeline.ml_ready_df.to_csv(intermediate_path, index=False)
    print(f"\n✅ Saved intermediate dataset: {intermediate_path}")
    
    # ================================================================
    # STEP 2: Weather Data Enrichment (Optional)
    # ================================================================
    if not args.skip_weather:
        print_banner("STEP 2: Weather Data Enrichment")
        
        try:
            fetcher = WeatherDataFetcher(intermediate_path)
            
            weather_enriched = fetcher.enrich_dataset_with_weather(
                sample_size=args.sample if args.sample else None,
                use_cache=True
            )
            
            weather_path = 'enriched_data/step2_weather_enriched.csv'
            fetcher.save_enriched_dataset(weather_enriched, weather_path)
            
            # Update intermediate path
            intermediate_path = weather_path
            
        except Exception as e:
            print(f"\n⚠️  Weather enrichment failed: {str(e)}")
            print("   Continuing with existing weather data...")
    else:
        print_banner("STEP 2: Weather Enrichment SKIPPED")
    
    # ================================================================
    # STEP 3: NDVI Data Enrichment (Optional)
    # ================================================================
    if not args.skip_ndvi:
        print_banner("STEP 3: NDVI Data Enrichment")
        
        try:
            ndvi_fetcher = NDVIDataFetcher(
                intermediate_path,
                ndvi_data_dir='cleaned_data'
            )
            
            ndvi_enriched = ndvi_fetcher.enrich_dataset_with_ndvi()
            
            ndvi_path = 'enriched_data/step3_ndvi_enriched.csv'
            ndvi_fetcher.save_enriched_dataset(ndvi_enriched, ndvi_path)
            
            # Update intermediate path
            intermediate_path = ndvi_path
            
        except Exception as e:
            print(f"\n⚠️  NDVI enrichment failed: {str(e)}")
            print("   Continuing with simulated NDVI data...")
    else:
        print_banner("STEP 3: NDVI Enrichment SKIPPED")
    
    # ================================================================
    # STEP 4: Final Dataset Creation
    # ================================================================
    print_banner("STEP 4: Creating Final ML-Ready Dataset")
    
    import pandas as pd
    final_df = pd.read_csv(intermediate_path)
    
    # Final cleanup and validation
    print("\n🧹 Final data cleanup...")
    
    # Remove records with no yield
    if 'yield' in final_df.columns:
        initial_count = len(final_df)
        final_df = final_df[final_df['yield'].notna() & (final_df['yield'] > 0)]
        print(f"   Removed {initial_count - len(final_df)} records with invalid yield")
    
    # Remove duplicate records
    if 'record_id' in final_df.columns:
        initial_count = len(final_df)
        final_df = final_df.drop_duplicates(subset=['record_id'])
        print(f"   Removed {initial_count - len(final_df)} duplicate records")
    
    # Save final dataset
    final_path = 'enriched_data/FINAL_ML_READY_SUGARCANE_DATASET.csv'
    final_df.to_csv(final_path, index=False)
    
    print(f"\n✅ Saved final dataset: {final_path}")
    print(f"   Total records: {len(final_df):,}")
    print(f"   Total features: {len(final_df.columns)}")
    
    # ================================================================
    # STEP 5: Data Quality Report
    # ================================================================
    print_banner("STEP 5: Data Quality Report")
    
    generate_final_report(final_df)
    
    # ================================================================
    # COMPLETION
    # ================================================================
    end_time = datetime.now()
    duration = end_time - start_time
    
    print_banner("✅ ENRICHMENT PIPELINE COMPLETE!")
    
    print(f"Started:  {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Finished: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Duration: {duration}")
    
    print(f"\n📁 Output Files:")
    print(f"   Final Dataset:     enriched_data/FINAL_ML_READY_SUGARCANE_DATASET.csv")
    print(f"   Data Dictionary:   enriched_data/DATA_DICTIONARY.md")
    print(f"   Quality Report:    enriched_data/DATA_QUALITY_REPORT.txt")
    
    print(f"\n🚀 Next Steps:")
    print(f"   1. Review the data quality report")
    print(f"   2. Explore the final dataset")
    print(f"   3. Begin ML modeling with XGBoost/Random Forest")
    print(f"   4. Consider additional data sources for missing features")


def generate_final_report(df):
    """Generate comprehensive data quality report"""
    
    report_lines = []
    
    report_lines.append("=" * 70)
    report_lines.append("SUGARCANE ML DATASET - FINAL QUALITY REPORT")
    report_lines.append("=" * 70)
    report_lines.append("")
    report_lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append(f"Total Records: {len(df):,}")
    report_lines.append(f"Total Features: {len(df.columns)}")
    report_lines.append("")
    
    # Feature categories
    categories = {
        'Location': ['state', 'district', 'latitude', 'longitude'],
        'Temporal': ['year', 'crop_year', 'season', 'decade'],
        'Farm/Crop': ['area_hectare', 'variety', 'maturity', 'irrigation_type'],
        'Weather': ['rainfall_mm', 'avg_temperature_c', 'humidity_percent', 
                   'rainy_days', 'dry_spell_days'],
        'Growth Stage Weather': ['rainfall_early_growth', 'rainfall_vegetative',
                                'rainfall_grand_growth', 'rainfall_maturity'],
        'Soil': ['soil_ph', 'soil_moisture', 'nitrogen_kg_ha', 'phosphorus_kg_ha', 
                'potassium_kg_ha', 'organic_carbon'],
        'NDVI': ['ndvi_30d', 'ndvi_60d', 'ndvi_90d', 'ndvi_120d', 'ndvi_150d',
                'ndvi_mean', 'ndvi_max'],
        'Variety Traits': ['drought_tolerance', 'salinity_tolerance', 
                          'waterlogging_tolerance', 'ratooning_ability'],
        'Historical': ['prev_year_yield', 'yield_3yr_avg', 'historical_avg_yield'],
        'Derived': ['temp_stress', 'rainfall_sufficient', 'vegetation_health'],
        'Target': ['yield']
    }
    
    report_lines.append("=" * 70)
    report_lines.append("FEATURE COMPLETENESS BY CATEGORY")
    report_lines.append("=" * 70)
    report_lines.append("")
    
    for category, cols in categories.items():
        existing_cols = [c for c in cols if c in df.columns]
        if existing_cols:
            completeness = df[existing_cols].notna().mean().mean() * 100
            status = "✅" if completeness > 80 else "⚠️" if completeness > 50 else "❌"
            report_lines.append(f"{status} {category:25s}: {completeness:5.1f}% complete")
    
    report_lines.append("")
    report_lines.append("=" * 70)
    report_lines.append("TOP 20 MOST COMPLETE FEATURES")
    report_lines.append("=" * 70)
    report_lines.append("")
    
    completeness = df.notna().mean().sort_values(ascending=False)
    for i, (col, pct) in enumerate(completeness.head(20).items(), 1):
        status = "✅" if pct > 0.8 else "⚠️" if pct > 0.5 else "❌"
        report_lines.append(f"{i:2d}. {status} {col:35s}: {pct*100:5.1f}%")
    
    report_lines.append("")
    report_lines.append("=" * 70)
    report_lines.append("FEATURES NEEDING ATTENTION (< 50% complete)")
    report_lines.append("=" * 70)
    report_lines.append("")
    
    incomplete = completeness[completeness < 0.5].sort_values()
    if len(incomplete) > 0:
        for col, pct in incomplete.items():
            report_lines.append(f"❌ {col:35s}: {pct*100:5.1f}% (Missing: {(1-pct)*100:.1f}%)")
    else:
        report_lines.append("✅ All features are > 50% complete!")
    
    # Target variable analysis
    if 'yield' in df.columns:
        report_lines.append("")
        report_lines.append("=" * 70)
        report_lines.append("TARGET VARIABLE (YIELD) ANALYSIS")
        report_lines.append("=" * 70)
        report_lines.append("")
        
        yield_stats = df['yield'].describe()
        report_lines.append(f"Count:      {yield_stats['count']:,.0f}")
        report_lines.append(f"Mean:       {yield_stats['mean']:.2f} t/ha")
        report_lines.append(f"Std:        {yield_stats['std']:.2f} t/ha")
        report_lines.append(f"Min:        {yield_stats['min']:.2f} t/ha")
        report_lines.append(f"25%:        {yield_stats['25%']:.2f} t/ha")
        report_lines.append(f"Median:     {yield_stats['50%']:.2f} t/ha")
        report_lines.append(f"75%:        {yield_stats['75%']:.2f} t/ha")
        report_lines.append(f"Max:        {yield_stats['max']:.2f} t/ha")
    
    # State distribution
    if 'state' in df.columns:
        report_lines.append("")
        report_lines.append("=" * 70)
        report_lines.append("RECORDS BY STATE")
        report_lines.append("=" * 70)
        report_lines.append("")
        
        state_counts = df['state'].value_counts()
        for state, count in state_counts.head(10).items():
            pct = count / len(df) * 100
            report_lines.append(f"{state:25s}: {count:6,d} ({pct:5.1f}%)")
    
    # Year distribution
    if 'year' in df.columns:
        report_lines.append("")
        report_lines.append("=" * 70)
        report_lines.append("RECORDS BY YEAR")
        report_lines.append("=" * 70)
        report_lines.append("")
        
        year_counts = df['year'].value_counts().sort_index()
        report_lines.append(f"Year Range: {year_counts.index.min():.0f} - {year_counts.index.max():.0f}")
        report_lines.append(f"Total Years: {len(year_counts)}")
    
    report_lines.append("")
    report_lines.append("=" * 70)
    report_lines.append("END OF REPORT")
    report_lines.append("=" * 70)
    
    # Save report
    report_path = 'enriched_data/DATA_QUALITY_REPORT.txt'
    with open(report_path, 'w') as f:
        f.write('\n'.join(report_lines))
    
    # Print to console
    print('\n'.join(report_lines))
    
    print(f"\n💾 Saved report: {report_path}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Run complete sugarcane data enrichment pipeline'
    )
    
    parser.add_argument(
        '--sample',
        type=int,
        help='Process only N records (for testing)',
        default=None
    )
    
    parser.add_argument(
        '--skip-weather',
        action='store_true',
        help='Skip weather data fetching (use template values)'
    )
    
    parser.add_argument(
        '--skip-ndvi',
        action='store_true',
        help='Skip NDVI data fetching (use simulated values)'
    )
    
    args = parser.parse_args()
    
    # Create output directory
    os.makedirs('enriched_data', exist_ok=True)
    
    try:
        run_full_pipeline(args)
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Pipeline failed with error:")
        print(f"   {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
