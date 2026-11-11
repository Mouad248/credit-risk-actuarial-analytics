"""
Probability calibration: wraps a fitted classifier with isotonic or sigmoid calibration.
"""

from __future__ import annotations

import numpy as np
from sklearn.calibration import CalibratedClassifierCV

from src.utils.logger import get_logger

logger = get_logger(__name__)


def calibrate_model(
    model,
    X_val: "pd.DataFrame",
    y_val: np.ndarray,
    method: str = "isotonic",
    cv: str = "prefit",
) -> CalibratedClassifierCV:
    """
    Calibrate a pre-fitted model using validation data.

    Args:
        model: A fitted classifier with predict_proba.
        X_val: Validation features.
        y_val: Validation targets.
        method: 'isotonic' (better for larger datasets) or 'sigmoid'.
        cv: must be 'prefit'; the fitted estimator remains frozen.
            Calibration data must be separate from training and test data.

    Returns:
        A calibrated classifier.
    """
    if method not in {"isotonic", "sigmoid"} or cv != "prefit":
        raise ValueError("Use isotonic/sigmoid with a pre-fitted estimator")
    try:
        from sklearn.frozen import FrozenEstimator
    except ImportError:
        calibrated = CalibratedClassifierCV(estimator=model, method=method, cv="prefit")
    else:
        calibrated = CalibratedClassifierCV(estimator=FrozenEstimator(model), method=method)
    calibrated.fit(X_val, y_val)
    return calibrated


class _WrappedCalibratedModel:
    """
    Lightweight wrapper that provides a calibrated predict_proba without
    relying on CalibratedClassifierCV(cv='prefit') which was removed in
    sklearn 1.8.
    """

    def __init__(self, base_model, calibrator, method: str):
        self._base = base_model
        self._cal = calibrator
        self._method = method
        # Expose feature_importances_ if available (for SHAP unwrapping)
        if hasattr(base_model, "feature_importances_"):
            self.feature_importances_ = base_model.feature_importances_
        # Mimic CalibratedClassifierCV attribute so SHAP unwrapping works
        self.calibrated_classifiers_ = [_FakeCalClassifier(base_model)]

    def predict_proba(self, X) -> np.ndarray:
        raw = self._base.predict_proba(X)[:, 1]
        if self._method == "isotonic":
            cal_pos = self._cal.predict(raw)
        else:
            cal_pos = self._cal.predict(raw.reshape(-1, 1))
        cal_pos = np.clip(cal_pos, 0, 1)
        return np.column_stack([1 - cal_pos, cal_pos])

    def predict(self, X) -> np.ndarray:
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)

    # Make joblib serialisation work
    def __getstate__(self):
        return self.__dict__

    def __setstate__(self, state):
        self.__dict__.update(state)


class _FakeCalClassifier:
    """Thin shim so SHAP can reach base_model.estimator."""

    def __init__(self, estimator):
        self.estimator = estimator


def probability_to_score(probability: float | np.ndarray) -> int | np.ndarray:
    """
    Convert calibrated default probability -> risk score (0-100).

    Formula: score = round(probability * 100), clamped to [0, 100].
    """
    values = np.asarray(probability, dtype=float)
    if values.ndim > 1 or not np.isfinite(values).all() or ((values < 0) | (values > 1)).any():
        raise ValueError("Probabilities must be finite scalars or vectors in [0, 1]")
    score = np.round(values * 100).astype(int)
    return int(np.clip(score, 0, 100)) if score.ndim == 0 else np.clip(score, 0, 100)


def score_to_band(score: int | np.ndarray) -> str | np.ndarray:
    """
    Map a risk score (0-100) to a risk band label.

    Bands:
        0-30  -> Low
        31-60 -> Medium
        61-100 -> High
    """

    def _band(s: int) -> str:
        if s <= 30:
            return "Low"
        elif s <= 60:
            return "Medium"
        else:
            return "High"

    if np.ndim(score) == 0:
        return _band(int(score))
    return np.array([_band(int(s)) for s in score])


def build_score_output(
    probability: float | np.ndarray,
) -> dict | list[dict]:
    """
    Convert probability (or array of probabilities) to full scoring output.

    Returns a dict or list of dicts with keys:
        default_probability, risk_score, risk_band
    """
    scalar = np.ndim(probability) == 0
    proba = np.atleast_1d(np.asarray(probability, dtype=float))
    scores = probability_to_score(proba)
    bands = score_to_band(scores)

    results = [
        {
            "default_probability": round(float(p), 4),
            "risk_score": int(s),
            "risk_band": b,
        }
        for p, s, b in zip(proba, scores, bands)
    ]
    return results[0] if scalar else results
