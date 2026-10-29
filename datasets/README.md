# SugarYieldAI dataset package

This folder is a consolidated, evaluator-facing copy of the project datasets. The application and training scripts continue to use their existing source paths; files here are copies so collecting them in one place does not change runtime behavior.

## Contents

| Folder/file | Contents and role | Existing project source |
| --- | --- | --- |
| `final_dataset/` | Final and intermediate sugarcane yield datasets, dataset summaries, and collected weather used in ML preparation. The project README identifies `SUGARCANE_COMPLETE_ML_DATASET_CLEAN.csv` as the recommended clean training set. | `final_dataset/` |
| `cleaned_data/` | Cleaned agronomic, soil, irrigation, productivity, and district/state NDVI data used in dataset preparation and NDVI workflows. | `cleaned_data/` |
| `data_collection/collected_data/` | Collected weather, forecast, NDVI, and MOSDAC data. | `data_collection/collected_data/` |
| `data_collection/processed_data/` | Processed, ML-ready collection output and collection metadata. | `data_collection/processed_data/` |
| `reference/` | Variety master, state recommendations, geography and crop-intelligence references, variety benchmarks, and growing-state reference data used by project workflows. | `backend/data/`, `models/variety_benchmarks.json`, and `sugarcane_growing_states.json` |
| `training/` | Karnataka variety training data used in the project’s variety training workflow. | `ml/` |
| `workbooks/` | Consolidated Excel workbook generated from the project data sources. | Project root |
| `combined_sugarcane_dataset.csv` | Combined sugarcane source dataset used by dataset-building scripts. | Project root |
| `DATASET_INVENTORY.csv` | Relative package path, source path, byte size, and SHA-256 for each copied data file. | Generated for this package |

## Notes for evaluation

- `final_dataset/README.md` describes the clean yield dataset, its stated record count and features, and the documented model performance. Refer to that file when describing the training dataset and metrics.
- The cleaned and collected folders include intermediate files and district-specific NDVI extracts. They are retained here for reproducibility and inspection; they are not all independent training datasets.
- The project includes both collected and generated/synthetic NDVI workflows. Check the corresponding collection scripts and metadata before describing any individual NDVI file as satellite-observed data.
- Dataset provenance is not uniform across all historical files. Use the source documentation alongside the data and avoid claiming an external source unless the project records it.
- The inventory hashes allow the evaluator copy to be checked against its original in-project file.

## Runtime compatibility

Do not change application paths to this presentation copy without updating and validating the related code. The existing application, collection scripts, and model-training scripts continue to use the original locations listed above.
