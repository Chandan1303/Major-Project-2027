"""
Test Script for Data Enrichment Pipeline
=========================================

This script tests all components of the enrichment pipeline
to ensure everything is working correctly.

Usage:
    python test_pipeline.py
"""

import pandas as pd
import numpy as np
import os
import sys

def print_section(title):
    """Print formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_dependencies():
    """Test if all required dependencies are installed"""
    print_section("Testing Dependencies")
    
    required_modules = {
        'pandas': 'Data manipulation',
        'numpy': 'Numerical computations',
        'requests': 'API calls (optional)'
    }
    
    all_ok = True
    
    for module, purpose in required_modules.items():
        try:
            __import__(module)
            print(f"  ✅ {module:15s} - {purpose}")
        except ImportError:
            print(f"  ❌ {module:15s} - Missing! Install with: pip install {module}")
            all_ok = False
    
    return all_ok

def test_input_files():
    """Test if required input files exist"""
    print_section("Testing Input Files")
    
    required_files = {
        'combined_sugarcane_dataset.csv': 'Base dataset',
        'backend/data/sugarcane_varieties_master.csv': 'Variety master data',
        'cleaned_data': 'Directory with cleaned datasets'
    }
    
    all_ok = True
    
    for file_path, description in required_files.items():
        if os.path.exists(file_path):
            if os.path.isdir(file_path):
                count = len([f for f in os.listdir(file_path) if f.endswith('.csv')])
                print(f"  ✅ {file_path:45s} - {description} ({count} CSV files)")
            else:
                size_mb = os.path.getsize(file_path) / (1024 * 1024)
                print(f"  ✅ {file_path:45s} - {description} ({size_mb:.2f} MB)")
        else:
            print(f"  ❌ {file_path:45s} - Missing!")
            all_ok = False
    
    return all_ok

def test_pipeline_modules():
    """Test if pipeline modules can be imported"""
    print_section("Testing Pipeline Modules")
    
    modules = [
        ('data_enrichment_pipeline', 'SugarcaneDataEnrichment'),
        ('weather_data_fetcher', 'WeatherDataFetcher'),
        ('ndvi_data_fetcher', 'NDVIDataFetcher'),
        ('soil_data_matcher', 'SoilDataMatcher'),
    ]
    
    all_ok = True
    
    for module_name, class_name in modules:
        try:
            module = __import__(module_name)
            if hasattr(module, class_name):
                print(f"  ✅ {module_name:30s} - {class_name}")
            else:
                print(f"  ⚠️  {module_name:30s} - Module OK, class {class_name} not found")
        except Exception as e:
            print(f"  ❌ {module_name:30s} - Error: {str(e)[:40]}")
            all_ok = False
    
    return all_ok

def test_base_dataset():
    """Test loading and basic stats of base dataset"""
    print_section("Testing Base Dataset")
    
    try:
        df = pd.read_csv('combined_sugarcane_dataset.csv', low_memory=False)
        
        print(f"\n  Dataset loaded successfully!")
        print(f"  Rows:     {len(df):,}")
        print(f"  Columns:  {len(df.columns):,}")
        print(f"  Memory:   {df.memory_usage(deep=True).sum() / (1024**2):.2f} MB")
        
        # Check for key columns
        key_cols = ['state_name', 'district_name', 'year', 'yield_t_ha', 'yield_tons_per_hectare']
        found_cols = [col for col in key_cols if col in df.columns]
        
        print(f"\n  Key columns found: {len(found_cols)}/{len(key_cols)}")
        for col in found_cols:
            completeness = df[col].notna().mean() * 100
            print(f"    ✅ {col:30s}: {completeness:5.1f}% complete")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error loading dataset: {str(e)}")
        return False

def test_variety_data():
    """Test variety master data"""
    print_section("Testing Variety Data")
    
    try:
        df = pd.read_csv('backend/data/sugarcane_varieties_master.csv')
        
        print(f"\n  Variety data loaded successfully!")
        print(f"  Total varieties:     {len(df)}")
        print(f"  Unique varieties:    {df['Variety_Name'].nunique() if 'Variety_Name' in df.columns else 'N/A'}")
        
        if 'Recommended_States' in df.columns:
            states = df['Recommended_States'].dropna().str.split(',').explode().str.strip().unique()
            print(f"  States covered:      {len(states)}")
        
        # Show sample varieties
        if 'Variety_Name' in df.columns:
            print(f"\n  Sample varieties:")
            for variety in df['Variety_Name'].head(5):
                print(f"    • {variety}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error loading variety data: {str(e)}")
        return False

def test_sample_enrichment():
    """Test running a small sample enrichment"""
    print_section("Testing Sample Enrichment (5 Records)")
    
    try:
        from data_enrichment_pipeline import SugarcaneDataEnrichment
        
        print("\n  Initializing pipeline...")
        pipeline = SugarcaneDataEnrichment(
            base_csv_path='combined_sugarcane_dataset.csv',
            variety_csv_path='backend/data/sugarcane_varieties_master.csv',
            output_dir='test_output'
        )
        
        print("  ✅ Pipeline initialized")
        
        # Limit to 5 records for testing
        pipeline.base_df = pipeline.base_df.head(5)
        
        print("\n  Running enrichment steps...")
        
        steps = [
            ('create_base_structure', 'Base structure'),
            ('add_variety_information', 'Variety assignment'),
            ('add_weather_features', 'Weather template'),
            ('add_soil_features', 'Soil features'),
            ('add_ndvi_features', 'NDVI template'),
            ('add_irrigation_features', 'Irrigation'),
            ('add_historical_yield_features', 'Historical features'),
            ('add_derived_features', 'Derived features'),
            ('create_ml_ready_dataset', 'ML dataset'),
        ]
        
        for method_name, description in steps:
            try:
                method = getattr(pipeline, method_name)
                method()
                print(f"    ✅ {description}")
            except Exception as e:
                print(f"    ❌ {description}: {str(e)[:50]}")
                return False
        
        # Check output
        if hasattr(pipeline, 'ml_ready_df'):
            df = pipeline.ml_ready_df
            print(f"\n  Sample enrichment successful!")
            print(f"  Records:  {len(df)}")
            print(f"  Features: {len(df.columns)}")
            print(f"\n  Sample feature completeness:")
            
            sample_features = ['state', 'district', 'year', 'variety', 'yield']
            for col in sample_features:
                if col in df.columns:
                    completeness = df[col].notna().mean() * 100
                    print(f"    {col:15s}: {completeness:5.1f}%")
        
        # Clean up test output
        import shutil
        if os.path.exists('test_output'):
            shutil.rmtree('test_output')
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error during enrichment: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("  SUGARCANE ENRICHMENT PIPELINE - SYSTEM TEST")
    print("=" * 70)
    
    tests = [
        ('Dependencies', test_dependencies),
        ('Input Files', test_input_files),
        ('Pipeline Modules', test_pipeline_modules),
        ('Base Dataset', test_base_dataset),
        ('Variety Data', test_variety_data),
        ('Sample Enrichment', test_sample_enrichment),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n  ❌ Test failed with exception: {str(e)}")
            results[test_name] = False
    
    # Summary
    print_section("Test Summary")
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} - {test_name}")
    
    print(f"\n  Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n  [SUCCESS] All tests passed! Your system is ready to use.")
        print("\n  Next step: Run the full enrichment pipeline:")
        print("     python run_complete_enrichment.py --sample 50 --skip-weather --skip-ndvi")
    else:
        print("\n  ⚠️  Some tests failed. Please fix the issues above.")
        print("     Check that all dependencies are installed:")
        print("     pip install pandas numpy requests")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
