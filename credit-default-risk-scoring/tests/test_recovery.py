"""Data provenance and fixed-estimator calibration regression checks."""
import sys
from types import SimpleNamespace

import numpy as np
import pytest


def test_failed_download_never_writes_synthetic_uci(monkeypatch, tmp_path):
    from src.ingestion import load_data
    path = tmp_path / "credit_default.csv"
    monkeypatch.setattr(load_data, "RAW_CSV", path)

    def unavailable(**kwargs):
        raise ConnectionError("offline test")

    monkeypatch.setitem(sys.modules, "ucimlrepo", SimpleNamespace(fetch_ucirepo=unavailable))
    with pytest.raises(RuntimeError, match="no synthetic replacement"):
        load_data.download_dataset()
    assert not path.exists()


def test_unknown_cache_provenance_is_rejected(monkeypatch, tmp_path):
    from src.ingestion import load_data
    path = tmp_path / "credit_default.csv"
    path.write_text("feature,target\n1,0\n")
    monkeypatch.setattr(load_data, "RAW_CSV", path)
    with pytest.raises(RuntimeError, match="no provenance"):
        load_data.download_dataset()


@pytest.mark.parametrize("value", [np.nan, np.inf, -.1, 1.1])
def test_invalid_probability_rejected(value):
    from src.models.calibrate import build_score_output
    with pytest.raises(ValueError):
        build_score_output(value)


def test_calibration_preserves_fitted_classifier(trained_lr, scaler_and_scaled, split_data):
    from src.models.calibrate import calibrate_model
    _, _, validation, test = scaler_and_scaled
    _, _, _, _, y_validation, *_ = split_data
    coefficients = trained_lr.coef_.copy()
    calibrated = calibrate_model(trained_lr, validation, y_validation)
    assert np.array_equal(trained_lr.coef_, coefficients)
    scores = calibrated.predict_proba(test)
    assert np.isfinite(scores).all()
    assert np.allclose(scores.sum(axis=1), 1)


def test_trend_is_positive_for_balance_growing_toward_present():
    from src.features.feature_store import _linear_slope
    assert _linear_slope(np.array([[6., 5., 4., 3., 2., 1.]]))[0] == pytest.approx(1.)


def test_engineered_monetary_trends_are_scaled(scaler_and_scaled):
    _, train, _, _ = scaler_and_scaled
    assert abs(train["bill_trend"].mean()) < 1e-10
    assert train["bill_trend"].std(ddof=0) == pytest.approx(1.)


def test_unknown_model_feature_is_not_filled_with_zero(sample_record):
    from src.models.predict import predict_single
    with pytest.raises(ValueError, match="Missing model features"):
        predict_single(sample_record, model=object(), scaler=object(), feature_names=["unknown_feature"])
