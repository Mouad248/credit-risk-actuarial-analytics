"""Centralised path resolution for the project."""

from pathlib import Path

# Project root is two levels up from this file (src/utils/paths.py -> root)
ROOT = Path(__file__).resolve().parents[2]

DATA_RAW = ROOT / ".private" / "data" / "raw"
DATA_INTERIM = ROOT / ".private" / "data" / "interim"
DATA_PROCESSED = ROOT / ".private" / "data" / "processed"
DATA_SAMPLES = ROOT / ".private" / "data" / "samples"

ARTIFACTS_MODELS = ROOT / "artifacts" / "models"
ARTIFACTS_METRICS = ROOT / "artifacts" / "metrics"
ARTIFACTS_SHAP = ROOT / "artifacts" / "shap"
ARTIFACTS_LOGS = ROOT / ".private" / "logs"
ARTIFACTS_SCORES = ROOT / ".private" / "scores"

CONFIGS = ROOT / "configs"
REPORTS = ROOT / "reports"
NOTEBOOKS = ROOT / "notebooks"


def ensure_dirs() -> None:
    """Create all artifact directories if they don't exist."""
    for d in [
        DATA_RAW,
        DATA_INTERIM,
        DATA_PROCESSED,
        DATA_SAMPLES,
        ARTIFACTS_MODELS,
        ARTIFACTS_METRICS,
        ARTIFACTS_SHAP,
        ARTIFACTS_LOGS,
        ARTIFACTS_SCORES,
        REPORTS / "figures",
    ]:
        d.mkdir(parents=True, exist_ok=True)
