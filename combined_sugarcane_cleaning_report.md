# Combined sugarcane dataset: cleaning report

Output: `combined_sugarcane_dataset.csv`

## Merge approach

The sources do not share a reliable row-level key, so they were appended (unioned), not joined. `source_dataset`, `source_file`, and `source_component` preserve provenance for every row. Semantic duplicate headers were coalesced after normalization (for example, `State_Name`/`state_name`).

## Result

- Rows: 40,723
- Columns: 260
- Source rows: production=18,467, training=22,133, variety=123
- Rows with one or more imputed values: 90
- Values imputed: 152

## Missing-value strategy

Imputation was performed independently inside each logical source component. Numeric fields use the median, which is more robust than the mean for agricultural measurements with outliers. Categorical fields use the mode only when it represents at least 15% of observed values. A field is imputed only when it has at least 20 observed values and no more than 40% missing values in that component. Higher-missing fields remain blank because they are usually not collected for that component; filling them would fabricate data. The `imputed_fields` column records exactly which values were filled for each row.

## Imputation log

| Component | Field | Method | Values filled | Imputed value |
|---|---|---:|---:|---|
| Crop_SUGARCANE_HARVESTED_Area_in_Hectares_Production_in_Tonnes_Yield_in_Kgs_Hectare_Cleaned | slno | median | 1 | 15.5 |
| Crop_SUGARCANE_PLANTED_Area_in_Hectares_Production_in_Tonnes_Yield_in_Kgs_Hectare_Cleaned | slno | median | 1 | 15.5 |
| gross_irrigated_area_cleaned | 2006 | median | 3 | 1.85 |
| gross_irrigated_area_cleaned | 2007 | median | 2 | 2.4 |
| gross_irrigated_area_cleaned | 2008 | median | 2 | 3 |
| gross_irrigated_area_cleaned | 2009 | median | 2 | 2.1 |
| gross_irrigated_area_cleaned | 2010 | median | 2 | 2.1 |
| gross_irrigated_area_cleaned | 2011 | median | 2 | 1.8 |
| sugarcane_harvested_cleaned | slno | median | 1 | 15.5 |
| sugarcane_planted_cleaned | slno | median | 1 | 15.5 |
| Table_6.3_gross_irrigated_area_Sugercane_Cleaned | 2006 | median | 3 | 1.85 |
| Table_6.3_gross_irrigated_area_Sugercane_Cleaned | 2007 | median | 2 | 2.4 |
| Table_6.3_gross_irrigated_area_Sugercane_Cleaned | 2008 | median | 2 | 3 |
| Table_6.3_gross_irrigated_area_Sugercane_Cleaned | 2009 | median | 2 | 2.2 |
| Table_6.3_gross_irrigated_area_Sugercane_Cleaned | 2010 | median | 2 | 2.2 |
| variety | maturity | mode | 8 | Mid-late |
| variety | red_rot_resistance | mode | 43 | Moderately Resistant |
| variety | type | mode | 42 | Midlate |
| variety | zone | mode | 31 | Peninsular Zone |
