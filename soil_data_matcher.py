"""
Soil Data Matcher
=================

Enhances the enriched dataset with soil data from existing cleaned datasets:
- soil_data_cleaned.csv
- DB_SugarCane_SOILS_MENDELEY_Cleaned.csv
- fertilizer_data_sugarcane_cleaned.csv

Matches based on state, district, and uses spatial interpolation if needed.
"""

import pandas as pd
import numpy as np
import os

class SoilDataMatcher:
    """
    Match and integrate soil data from multiple sources
    """
    
    def __init__(self, enriched_csv_path, soil_data_dir='cleaned_data'):
        """
        Initialize soil data matcher
        
        Parameters:
        -----------
        enriched_csv_path : str
            Path to enriched dataset
        soil_data_dir : str
            Directory containing soil CSV files
        """
        self.df = pd.read_csv(enriched_csv_path)
        self.soil_data_dir = soil_data_dir
        
        print(f"📂 Loaded {len(self.df)} records for soil enrichment")
        
        # Load soil datasets
        self.soil_datasets = self._load_soil_datasets()
    
    def _load_soil_datasets(self):
        """Load all available soil CSV files"""
        soil_files = [
            'soil_data_cleaned.csv',
            'DB_SugarCane_SOILS_MENDELEY_Cleaned.csv',
            'fertilizer_data_sugarcane_cleaned.csv'
        ]
        
        datasets = {}
        
        for filename in soil_files:
            filepath = os.path.join(self.soil_data_dir, filename)
            if os.path.exists(filepath):
                try:
                    df = pd.read_csv(filepath, low_memory=False)
                    datasets[filename] = df
                    print(f"  ✅ Loaded {filename}: {len(df)} records, {len(df.columns)} columns")
                except Exception as e:
                    print(f"  ⚠️  Failed to load {filename}: {str(e)}")
        
        return datasets
    
    def match_soil_data(self, row):
        """
        Match soil data for a single row
        
        Parameters:
        -----------
        row : pd.Series
            Row from enriched dataset
            
        Returns:
        --------
        dict : Matched soil features
        """
        state = str(row.get('state', '')).lower().strip()
        district = str(row.get('district', '')).lower().strip()
        
        soil_features = {}
        
        # Try each soil dataset
        for dataset_name, soil_df in self.soil_datasets.items():
            # Identify location columns
            location_cols = self._identify_location_columns(soil_df)
            
            if not location_cols:
                continue
            
            # Try to match by district first
            matched = self._match_by_location(soil_df, location_cols, district, 'district')
            
            # If no district match, try state
            if matched is None or len(matched) == 0:
                matched = self._match_by_location(soil_df, location_cols, state, 'state')
            
            if matched is not None and len(matched) > 0:
                # Extract soil features from matched records
                features = self._extract_soil_features(matched)
                
                # Merge with existing features (prefer non-null values)
                for key, value in features.items():
                    if pd.notna(value):
                        if key not in soil_features or pd.isna(soil_features[key]):
                            soil_features[key] = value
        
        return soil_features
    
    def _identify_location_columns(self, df):
        """Identify state/district columns in dataset"""
        location_cols = {}
        
        col_names_lower = [col.lower() for col in df.columns]
        
        # Find state column
        for col, col_lower in zip(df.columns, col_names_lower):
            if 'state' in col_lower:
                location_cols['state'] = col
                break
        
        # Find district column
        for col, col_lower in zip(df.columns, col_names_lower):
            if 'district' in col_lower:
                location_cols['district'] = col
                break
        
        return location_cols
    
    def _match_by_location(self, df, location_cols, location_value, location_type):
        """Match records by location"""
        if location_type not in location_cols:
            return None
        
        col_name = location_cols[location_type]
        
        # Try exact match first
        matched = df[df[col_name].astype(str).str.lower().str.contains(location_value, na=False)]
        
        if len(matched) == 0:
            # Try partial match
            matched = df[df[col_name].astype(str).str.lower().str.contains(
                location_value.split()[0] if ' ' in location_value else location_value[:5], 
                na=False
            )]
        
        return matched
    
    def _extract_soil_features(self, matched_df):
        """Extract soil features from matched records"""
        features = {}
        
        # Soil pH
        ph_cols = [col for col in matched_df.columns if 'ph' in col.lower() and 'soil' in col.lower()]
        if not ph_cols:
            ph_cols = [col for col in matched_df.columns if col.lower() in ['ph', 'soil_ph', 'ph_value']]
        
        if ph_cols:
            ph_values = pd.to_numeric(matched_df[ph_cols[0]], errors='coerce')
            ph_values = ph_values[(ph_values >= 4) & (ph_values <= 10)]  # Valid pH range
            if len(ph_values) > 0:
                features['soil_ph'] = ph_values.mean()
        
        # Soil moisture
        moisture_cols = [col for col in matched_df.columns if 'moisture' in col.lower()]
        if moisture_cols:
            moisture_values = pd.to_numeric(matched_df[moisture_cols[0]], errors='coerce')
            if len(moisture_values.dropna()) > 0:
                features['soil_moisture'] = moisture_values.mean()
        
        # Nitrogen
        n_cols = [col for col in matched_df.columns 
                 if any(x in col.lower() for x in ['nitrogen', '_n_', '_n', 'n_kg', 'n(kg'])]
        if n_cols:
            n_values = pd.to_numeric(matched_df[n_cols[0]], errors='coerce')
            if len(n_values.dropna()) > 0:
                features['nitrogen_kg_ha'] = n_values.mean()
        
        # Phosphorus
        p_cols = [col for col in matched_df.columns 
                 if any(x in col.lower() for x in ['phosphorus', 'phosphorous', '_p_', '_p', 'p_kg', 'p(kg', 'p2o5'])]
        if p_cols:
            p_values = pd.to_numeric(matched_df[p_cols[0]], errors='coerce')
            if len(p_values.dropna()) > 0:
                features['phosphorus_kg_ha'] = p_values.mean()
        
        # Potassium
        k_cols = [col for col in matched_df.columns 
                 if any(x in col.lower() for x in ['potassium', 'potasium', '_k_', '_k', 'k_kg', 'k(kg', 'k2o'])]
        if k_cols:
            k_values = pd.to_numeric(matched_df[k_cols[0]], errors='coerce')
            if len(k_values.dropna()) > 0:
                features['potassium_kg_ha'] = k_values.mean()
        
        # Organic carbon / organic matter
        oc_cols = [col for col in matched_df.columns 
                  if any(x in col.lower() for x in ['organic_carbon', 'organic carbon', 'organic_matter', 'organic matter', 'oc'])]
        if oc_cols:
            oc_values = pd.to_numeric(matched_df[oc_cols[0]], errors='coerce')
            if len(oc_values.dropna()) > 0:
                features['organic_carbon'] = oc_values.mean()
        
        # Soil texture (categorical)
        texture_cols = [col for col in matched_df.columns 
                       if any(x in col.lower() for x in ['texture', 'soil_type', 'soil type'])]
        if texture_cols:
            texture_values = matched_df[texture_cols[0]].dropna()
            if len(texture_values) > 0:
                # Most common soil type
                features['soil_type'] = texture_values.mode()[0] if len(texture_values.mode()) > 0 else texture_values.iloc[0]
        
        return features
    
    def enrich_dataset_with_soil(self):
        """
        Enrich dataset with soil data
        
        Returns:
        --------
        pd.DataFrame : Soil-enriched dataset
        """
        print("\n🌍 Enriching dataset with soil data...")
        print("=" * 60)
        
        enriched_records = []
        matched_count = 0
        
        for idx, row in self.df.iterrows():
            row_dict = row.to_dict()
            
            # Get soil features
            soil_features = self.match_soil_data(row)
            
            if soil_features:
                matched_count += 1
                # Update with new soil features (only if better than existing)
                for key, value in soil_features.items():
                    if pd.notna(value):
                        # Only update if existing is null or new value is more reasonable
                        if pd.isna(row_dict.get(key)):
                            row_dict[key] = value
            
            enriched_records.append(row_dict)
            
            if (idx + 1) % 1000 == 0:
                print(f"  Processed {idx + 1}/{len(self.df)} records...")
        
        enriched_df = pd.DataFrame(enriched_records)
        
        print(f"\n✅ Soil enrichment complete:")
        print(f"   Matched records: {matched_count}/{len(self.df)} ({matched_count/len(self.df)*100:.1f}%)")
        
        return enriched_df
    
    def save_enriched_dataset(self, enriched_df, output_path):
        """Save soil-enriched dataset"""
        enriched_df.to_csv(output_path, index=False)
        print(f"\n💾 Saved soil-enriched dataset: {output_path}")
        
        # Print soil data summary
        soil_cols = ['soil_ph', 'nitrogen_kg_ha', 'phosphorus_kg_ha', 
                    'potassium_kg_ha', 'organic_carbon', 'soil_type']
        
        print("\n📊 Soil Data Summary:")
        for col in soil_cols:
            if col in enriched_df.columns:
                if enriched_df[col].dtype in ['float64', 'int64']:
                    completeness = enriched_df[col].notna().mean() * 100
                    mean_val = enriched_df[col].mean()
                    print(f"   {col:20s}: {completeness:5.1f}% complete, mean = {mean_val:.2f}")
                else:
                    completeness = enriched_df[col].notna().mean() * 100
                    unique_count = enriched_df[col].nunique()
                    print(f"   {col:20s}: {completeness:5.1f}% complete, {unique_count} unique values")


def main():
    """Main execution"""
    print("=" * 60)
    print("🌍 SOIL DATA ENRICHMENT")
    print("=" * 60)
    
    # Check which dataset to use as input
    input_files = [
        'enriched_data/ndvi_enriched_dataset.csv',
        'enriched_data/weather_enriched_dataset.csv',
        'enriched_data/step1_base_enriched.csv',
        'enriched_data/ml_ready_sugarcane_dataset.csv'
    ]
    
    input_path = None
    for path in input_files:
        if os.path.exists(path):
            input_path = path
            break
    
    if not input_path:
        print("❌ No enriched dataset found. Run the main pipeline first.")
        return
    
    print(f"📂 Using input: {input_path}")
    
    # Initialize matcher
    matcher = SoilDataMatcher(input_path, soil_data_dir='cleaned_data')
    
    # Enrich dataset
    enriched_df = matcher.enrich_dataset_with_soil()
    
    # Save result
    output_path = 'enriched_data/soil_enriched_dataset.csv'
    matcher.save_enriched_dataset(enriched_df, output_path)
    
    print("\n✅ Soil enrichment complete!")
    print("\nNote: This uses your existing cleaned soil datasets")
    print("For additional soil data, consider:")
    print("- ISRIC SoilGrids API")
    print("- FAO Soil Portal")
    print("- State agricultural department data")


if __name__ == "__main__":
    main()
