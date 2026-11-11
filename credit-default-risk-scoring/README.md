# Credit default risk scoring

An educational pipeline that uses repayment history, balances and payments to estimate the chance of default next month. It turns that probability into a simple 0-100 display score.

## What is verified locally

A small, explicitly synthetic run now works: generate 1,000 records, clean them, create features, split 700/150/150, fit scaling on training data, train Logistic Regression, calibrate on validation data and evaluate on untouched test data.

**64 selected tests passed** with no new downloads. They cover data validation, cleaning, features, splitting, scaling, baseline training, monitoring, score conversion and the recovery fixes. [reports/offline_verification.json](reports/offline_verification.json) contains the synthetic results and their limits.

In this run, calibration reduced Brier error from 0.2135 to 0.1847, while recall at the unchanged 0.5 threshold fell from 0.76 to 0.04. Calibration and decision-threshold selection solve different problems; an improved probability metric does not establish a useful lending decision rule. These figures are smoke-test results, not real UCI performance.

## Run without downloading anything on this machine

From this project directory, use the existing Python 3.13 installation:

```powershell
py -3.13 scripts/offline_demo.py
```

To repeat the available test scope:

```powershell
$env:PYTHONPATH = (Resolve-Path '..\..\_workspace\runtime\python314\core').Path + ';' + (Get-Location).Path
py -3.13 -m pytest -q tests/test_data.py tests/test_preprocess.py tests/test_monitoring.py tests/test_train.py::TestBaselineModel tests/test_train.py::TestScoringLogic tests/test_recovery.py
```

The shared directory supplies pure-Python pytest; Python 3.13 supplies the numerical libraries. Missing YAML configuration support falls back to standard logging.

## Pipeline

1. `src/ingestion/load_data.py`: fetch the public UCI credit-card-default dataset, normalize columns and record cache provenance. Failed downloads now raise an error instead of silently writing synthetic data as UCI. Unlabelled or modified caches are rejected.
2. `src/processing/` and `src/features/`: remove the ID, normalize category codes, derive utilization/payment ratios, delinquency counts and chronological balance/payment trends. Split before fitting scaling; engineered monetary trends are now scaled too.
3. `src/models/`: train Logistic Regression and XGBoost; calibrate a frozen classifier on validation data using public scikit-learn APIs. Missing XGBoost now raises instead of saving a different algorithm under that name.
4. `src/models/predict.py`: apply the same transformations and exact saved feature contract. Missing expected features raise instead of being silently filled with zero. SHAP output is optional and may be empty.
5. `src/api/` and `src/monitoring/`: expose predictions and inspect input/score drift. These components expose predictions and monitoring diagnostics.

The original `requirements.txt` and module commands remain the setup path for the full pipeline. After installing those dependencies, `python -m src.ingestion.load_data` retrieves UCI data and `python -m src.pipelines.train_pipeline` trains the full models. A missing model makes the API return 503; the offline demo does not install models into the API registry.

## Score meaning

`score = round(100 * probability)`, using NumPy rounding. Non-finite values and probabilities outside [0,1] are rejected. Bands are fixed display labels: **0-30 Low, 31-60 Medium, 61-100 High**. They are not learned percentiles or validated approval/decline thresholds. See [docs/scoring_logic.md](docs/scoring_logic.md).

## Project material

[reports/model_report.md](reports/model_report.md) contains historical model results.

Raw data, samples, scores, logs and original backups are kept in ignored `.private/` locations. Identifying notebook outputs and execution metadata were cleared; original notebooks remain backed up. Mandatory license attribution is preserved. No CV or interview materials were added.
