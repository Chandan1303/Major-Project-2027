# AI Crop Intelligence

This module adds independent crop-cycle monitoring at `/crop-intelligence`. It uses the existing authenticated farmer, farm, and field records. It does not call, retrain, or change the yield prediction model.

## Data and calculation rules

- A crop cycle stores its owner, farm, field, variety, planting date, system, season, and notes. Observations, revisions, comparisons, activities, tasks, task events, alerts, alert events, recommendations, imports, and checkpoint reports are persisted in separate `crop_*` tables.
- DAP is the calendar-day difference between the observation date and planting date; planting date is DAP 0. Planning stages begin at DAP 1, and DAP 0 is shown in the first stage. Stage boundaries through day 180 are configurable; continued monitoring starts on day 181. Changing the planting date recalculates observation DAP values.
- Growth comparisons use only a configured variety reference range whose metric and crop-age window match. Missing references are reported as insufficient reference data; missing measurements are shown as not recorded. No universal score or invented growth target is used.
- Alerts are transparent scouting prompts based on recorded symptoms, comparable measurements, or configured reference ranges. A symptom is not a diagnosis. Missing measurements create data-quality reminders, not abnormalities.
- Stage activities are general planning guidance and explain their limitations. Fixed fertilizer, irrigation, pesticide, maturity, or harvest prescriptions are not inferred.

## Agricultural references

Profiles cover all eight varieties already recognized in the project: Co 86032, CoM 0265, Co 94012, Co 419, Co 62175, Co 0238, CoC 671, and Co 99004. Unavailable variety-specific values are explicitly left unavailable. The cited sources establish only the claims described in each profile; they do not provide a universal growth chart.

- [ICAR Kharif Agro-Advisories for Farmers 2025](https://icar.gov.in/en/icar-kharif-agro-advisories-farmers-2025-1): general planting context and mention of varieties including Co 94012, CoM 0265, and Co 86032.
- [ICAR-SBI, “Importance of New Varieties of sugarcane suitable for tropical India” (2017)](https://epubs.icar.org.in/index.php/IndFarm/article/view/73604): tropical-variety trial/adoption context, including Co 86032, CoC 671, and Co 99004; the historical CoC 671 red-rot observation is not a current resistance diagnosis.
- [ICAR-SBI Vision 2050](https://icar.gov.in/sites/default/files/inline-files/ICAR-SBIVision2050.pdf): broad tropical/subtropical context for Co 86032 and Co 0238.
- [DARE-ICAR Significant Achievements 2021–22](https://icar.gov.in/sites/default/files/2025-11/DARE%20ICAR%20Achievements%202021-22%20%281%29.pdf): a CoM 0265 subsurface fertigation result under stated Deccan canal tract, western Maharashtra, medium-deep black-soil conditions; the result is not generalized as a dose.

## Interfaces and endpoints

The UI separates overview, stage monitoring, daily/weekly/stage calendar, observation history, measured comparison charts, alerts, mitigation/recommendations, tasks, imports/reports, and reference configuration. Monitoring cycles support create, read/list/select, edit, and archive/restore operations. Archiving is the delete action and preserves crop observations, reports, and task history. Administrators can edit variety, stage, and mitigation JSON through validated endpoints. Calendar entries are generated for display from planting date and persisted records; missed days never become fabricated observations. Tasks are created explicitly and idempotently.

All routes are under `/api/crop-intelligence` and require the existing JWT cookie or Bearer token. The route module enforces ownership for cycles and fields. Key endpoint groups are:

- `GET /fields`, `GET /varieties`, `GET /stages`, `GET /mitigations`; administrator `PUT` endpoints for each reference type.
- `GET/POST /cycles`, `GET/PATCH/DELETE /cycles/{id}`, and `GET/POST /cycles/{id}/observations`; cycle `DELETE` archives the cycle for recovery, and `PATCH` an observation preserves a revision snapshot.
- Calendar, comparison, recommendation, task, activity, alert, photo, import preview/confirm, report, template, and CSV history-export endpoints under each cycle.

CSV/XLSX imports are capped at 5 MB, 5,000 rows, and 40 columns; spreadsheet expansion is capped at 25 MB. Files are previewed, mapped and validated before transaction-based insertion. Duplicate file hashes and observation dates are rejected. Photos accept JPEG, PNG, and WebP, are limited to 5 MB and 40 megapixels, and are served only after cycle ownership checks.

## Setup and verification

The backend imports the additive models before `db.create_all()` and seeds missing reference records without overwriting administrator edits. No separate schema migration is needed for fresh SQLite/MySQL databases supported by the existing SQLAlchemy setup. For an existing production database, deploy with a normal database backup and apply the additive `create_all()` schema change through the application's established deployment process.

Run from the repository root:

```powershell
python run_backend.py
```

In a second terminal:

```powershell
cd frontend
npm run dev
```

Focused automated checks:

```powershell
python -m pytest backend/tests/test_crop_intelligence_service.py -q
python -m py_compile backend/crop_intelligence_models.py backend/crop_intelligence_service.py backend/crop_intelligence_routes.py backend/app.py
cd frontend
npm run build
```

## Scope and remaining limitations

The repository does not contain reliable numeric growth ranges for most supported variety/region/age combinations, so comparisons correctly remain unavailable until an authorized user adds sourced reference data. Alert thresholds and symptom rules are not validated diagnostic models. Reports are persisted JSON and can be downloaded; the reporting module does not yet render PDF. The calendar supports daily, weekly, and stage views with navigation, but filters by alert/task state and a full 180-day-at-once calendar are not included. Historical charts currently cover height and tiller count; stage summaries expose task completion and alerts. Weather is contextual only when stored on the existing field/cycle records; this feature does not require an external AI or weather service.

The verified focused test suite currently covers DAP, stage boundaries including post-180 monitoring, missing-reference behavior, and symptom prompts. Full end-to-end API ownership/import tests and full pre-existing regression tests have not yet been run. The production frontend build passes; Vite reports its existing large main bundle warning.
