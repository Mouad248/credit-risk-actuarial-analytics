"""Small synthetic Logistic Regression/calibration check; no downloads or API."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.ingestion.load_data import _make_synthetic_data
from src.processing.preprocess import clean_raw, build_scaler, apply_scaler
from src.features.feature_store import add_derived_features
from src.processing.split import split_dataset, get_X_y
from src.models.train import train_baseline
from src.models.calibrate import calibrate_model, build_score_output
from src.models.evaluate import compute_metrics


def main():
    frame = add_derived_features(clean_raw(_make_synthetic_data(n=1000)))
    train, validation, test = split_dataset(frame)
    x_train, y_train = get_X_y(train)
    x_validation, y_validation = get_X_y(validation)
    x_test, y_test = get_X_y(test)
    scaler = build_scaler(x_train)
    x_train = apply_scaler(x_train, scaler)
    x_validation = apply_scaler(x_validation, scaler)
    x_test = apply_scaler(x_test, scaler)
    model = train_baseline(x_train, y_train)
    calibrated = calibrate_model(model, x_validation, y_validation)
    probabilities = calibrated.predict_proba(x_test)[:, 1]
    record = {
        "data_kind": "explicit synthetic schema smoke test; not UCI data",
        "rows": len(frame), "split_rows": [len(train), len(validation), len(test)],
        "raw_logistic_regression": compute_metrics(y_test, model.predict_proba(x_test)[:, 1]),
        "calibrated_logistic_regression": compute_metrics(y_test, probabilities),
        "example_synthetic_score": build_score_output(float(probabilities[0])),
        "unverified": ["Real UCI data/results", "XGBoost training", "SHAP explanations",
                       "FastAPI endpoints", "Full training pipeline", "Installation/build"],
    }
    (ROOT / "reports/offline_verification.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
    print(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
