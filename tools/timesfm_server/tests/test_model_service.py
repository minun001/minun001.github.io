from __future__ import annotations

import os

import numpy as np
import pandas as pd

from model_service import ForecastParams, TimesFMService, compute_metrics, run_forecast


def test_compute_metrics_basic() -> None:
    metrics = compute_metrics(np.array([1.0, 2.0, 3.0]), np.array([1.0, 2.5, 2.0]))
    assert metrics is not None
    assert round(metrics["mae"], 3) == 0.5
    assert round(metrics["rmse"], 3) == 0.645
    assert metrics["smape"] is not None


def test_mock_forecast_split_and_response(monkeypatch) -> None:
    monkeypatch.setitem(os.environ, "TIMESFM_MOCK", "1")
    dates = pd.date_range("2026-01-01", periods=90, freq="D")
    df = pd.DataFrame({
        "date": dates,
        "value": np.linspace(10.0, 30.0, len(dates)),
    })
    params = ForecastParams(
        timestamp_col="date",
        target_col="value",
        series_id_col=None,
        selected_series_id=None,
        train_start="2026-01-01",
        train_end="2026-03-10",
        test_start="2026-03-11",
        test_end="2026-03-20",
    )
    service = TimesFMService()
    result = run_forecast(df, params, service)
    assert result["ok"] is True
    assert result["meta"]["model_id"] == "mock-timesfm"
    assert result["meta"]["chosen_context_length"] > 0
    assert len(result["series"]["test_forecast"]) == 10
    assert result["metrics"]["validation"] is not None
