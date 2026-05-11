from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ColumnInfo(BaseModel):
    name: str
    dtype: str
    non_null: int
    numeric: bool = False
    datetime_like: bool = False


class TimestampRange(BaseModel):
    column: str
    start: str
    end: str


class SuggestedWindow(BaseModel):
    train_start: str
    train_end: str
    test_start: str
    test_end: str
    note: str | None = None


class PreviewResponse(BaseModel):
    ok: bool = True
    columns: list[ColumnInfo]
    row_count: int
    sample_rows: list[dict[str, Any]]
    timestamp_range: TimestampRange | None = None
    suggested_window: SuggestedWindow | None = None
    series_ids: list[str] = Field(default_factory=list)
    series_values: dict[str, list[str]] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    ok: bool = True
    service: str = "timesfm-api"
    server: str = "aibig9"
    model_id: str
    model_loaded: bool
    device: str
    gpu_name: str | None = None
    cuda_available: bool
    max_upload_mb: int
    version: str


class ForecastPoint(BaseModel):
    timestamp: str
    yhat: float | None = None
    value: float | None = None
    q10: float | None = None
    q50: float | None = None
    q90: float | None = None


class MetricSet(BaseModel):
    mae: float | None = None
    rmse: float | None = None
    mape: float | None = None
    smape: float | None = None
    interval_coverage_q10_q90: float | None = None


class ForecastResponse(BaseModel):
    ok: bool = True
    meta: dict[str, Any]
    metrics: dict[str, MetricSet | None]
    series: dict[str, list[ForecastPoint]]
