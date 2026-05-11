from __future__ import annotations

import json
import math
import os
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd


DEFAULT_MODEL_ID = "google/timesfm-2.5-200m-pytorch"
DEFAULT_CONTEXT_CANDIDATES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384]


class ForecastError(ValueError):
    pass


@dataclass
class ForecastParams:
    timestamp_col: str
    target_col: str
    series_id_col: str | None
    selected_series_id: str | None
    train_start: str
    train_end: str
    test_start: str
    test_end: str
    validation_mode: str = "auto"
    validation_ratio: float = 0.2
    context_mode: str = "auto"
    context_candidates: str | None = None


def finite_or_none(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number):
        return None
    return number


def series_to_iso(value: Any) -> str:
    timestamp = pd.Timestamp(value)
    return timestamp.isoformat()


def smape(actual: np.ndarray, predicted: np.ndarray) -> float | None:
    denominator = (np.abs(actual) + np.abs(predicted)) / 2.0
    mask = denominator > 1e-12
    if not np.any(mask):
        return None
    return float(np.mean(np.abs(actual[mask] - predicted[mask]) / denominator[mask]) * 100.0)


def mape(actual: np.ndarray, predicted: np.ndarray) -> float | None:
    mask = np.abs(actual) > 1e-12
    if not np.any(mask):
        return None
    return float(np.mean(np.abs((actual[mask] - predicted[mask]) / actual[mask])) * 100.0)


def compute_metrics(
    actual: np.ndarray,
    predicted: np.ndarray,
    lower: np.ndarray | None = None,
    upper: np.ndarray | None = None,
) -> dict[str, float | None] | None:
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    mask = np.isfinite(actual) & np.isfinite(predicted)
    if not np.any(mask):
        return None
    actual_valid = actual[mask]
    predicted_valid = predicted[mask]
    metrics: dict[str, float | None] = {
        "mae": float(np.mean(np.abs(actual_valid - predicted_valid))),
        "rmse": float(np.sqrt(np.mean(np.square(actual_valid - predicted_valid)))),
        "mape": mape(actual_valid, predicted_valid),
        "smape": smape(actual_valid, predicted_valid),
    }
    if lower is not None and upper is not None:
        lower_valid = np.asarray(lower, dtype=float)[mask]
        upper_valid = np.asarray(upper, dtype=float)[mask]
        interval_mask = np.isfinite(lower_valid) & np.isfinite(upper_valid)
        if np.any(interval_mask):
            covered = (actual_valid[interval_mask] >= lower_valid[interval_mask]) & (
                actual_valid[interval_mask] <= upper_valid[interval_mask]
            )
            metrics["interval_coverage_q10_q90"] = float(np.mean(covered) * 100.0)
    return metrics


def parse_context_candidates(raw: str | None) -> list[int]:
    if not raw:
        return DEFAULT_CONTEXT_CANDIDATES[:]
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return DEFAULT_CONTEXT_CANDIDATES[:]
    if not isinstance(payload, list):
        return DEFAULT_CONTEXT_CANDIDATES[:]
    candidates: list[int] = []
    for item in payload:
        try:
            value = int(item)
        except (TypeError, ValueError):
            continue
        if value in DEFAULT_CONTEXT_CANDIDATES and value not in candidates:
            candidates.append(value)
    return candidates or DEFAULT_CONTEXT_CANDIDATES[:]


def parse_boundary(value: str, label: str) -> pd.Timestamp:
    timestamp = pd.to_datetime(value, errors="coerce")
    if pd.isna(timestamp):
        raise ForecastError(f"Invalid {label}.")
    return pd.Timestamp(timestamp).tz_localize(None) if pd.Timestamp(timestamp).tzinfo else pd.Timestamp(timestamp)


def infer_frequency(timestamps: pd.Series, warnings: list[str]) -> tuple[Any, str]:
    ordered = pd.Series(pd.to_datetime(timestamps).dropna().sort_values().unique())
    if len(ordered) < 3:
        raise ForecastError("Not enough timestamps to infer forecast frequency.")
    try:
        inferred = pd.infer_freq(pd.DatetimeIndex(ordered))
    except ValueError:
        inferred = None
    if inferred:
        return pd.tseries.frequencies.to_offset(inferred), inferred
    deltas = ordered.diff().dropna()
    median_delta = deltas.median()
    if pd.isna(median_delta) or median_delta <= pd.Timedelta(0):
        raise ForecastError("Could not infer a positive time frequency.")
    warnings.append("Frequency could not be inferred exactly; using median timestamp delta.")
    return median_delta, str(median_delta)


def add_offset(timestamp: pd.Timestamp, offset: Any) -> pd.Timestamp:
    return pd.Timestamp(timestamp + offset)


def build_future_index(train_end: pd.Timestamp, test_end: pd.Timestamp, offset: Any) -> pd.DatetimeIndex:
    start = add_offset(train_end, offset)
    if start > test_end:
        return pd.DatetimeIndex([])
    return pd.date_range(start=start, end=test_end, freq=offset)


def points_from_frame(frame: pd.DataFrame, value_col: str, output_col: str = "value") -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for _, row in frame.iterrows():
        rows.append({
            "timestamp": series_to_iso(row["timestamp"]),
            output_col: finite_or_none(row[value_col]),
        })
    return rows


def forecast_points(frame: pd.DataFrame) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for _, row in frame.iterrows():
        rows.append({
            "timestamp": series_to_iso(row["timestamp"]),
            "yhat": finite_or_none(row.get("yhat")),
            "q10": finite_or_none(row.get("q10")),
            "q50": finite_or_none(row.get("q50")),
            "q90": finite_or_none(row.get("q90")),
        })
    return rows


class TimesFMService:
    def __init__(self) -> None:
        self.model_id = os.getenv("TIMESFM_MODEL_ID", DEFAULT_MODEL_ID)
        self.mock = os.getenv("TIMESFM_MOCK", "0") == "1"
        self.max_context = int(os.getenv("TIMESFM_MAX_CONTEXT", "1024"))
        self._model: Any | None = None
        self._torch: Any | None = None
        self._timesfm: Any | None = None
        self.model_loaded = False
        self.device, self.gpu_name, self.cuda_available = self._detect_device()

    def _detect_device(self) -> tuple[str, str | None, bool]:
        if self.mock:
            return "cpu", None, False
        try:
            import torch

            cuda_available = bool(torch.cuda.is_available())
            device = "cuda" if cuda_available and os.getenv("TIMESFM_DEVICE", "auto") != "cpu" else "cpu"
            gpu_name = torch.cuda.get_device_name(0) if cuda_available else None
            return device, gpu_name, cuda_available
        except Exception:
            return "cpu", None, False

    def ensure_model(self) -> None:
        if self.model_loaded:
            return
        if self.mock:
            self.model_loaded = True
            self.model_id = "mock-timesfm"
            return

        import torch
        import timesfm

        torch.set_float32_matmul_precision("high")
        model_class = getattr(timesfm, "TimesFM_2p5_200M_torch", None)
        if model_class is None:
            raise RuntimeError("Installed timesfm package does not expose TimesFM_2p5_200M_torch.")
        self._model = model_class.from_pretrained(self.model_id)
        self._model.compile(
            timesfm.ForecastConfig(
                max_context=self.max_context,
                max_horizon=int(os.getenv("TIMESFM_MAX_HORIZON", "256")),
                normalize_inputs=True,
                use_continuous_quantile_head=True,
                force_flip_invariance=True,
                infer_is_positive=True,
                fix_quantile_crossing=True,
            )
        )
        self._torch = torch
        self._timesfm = timesfm
        self.device, self.gpu_name, self.cuda_available = self._detect_device()
        self.model_loaded = True

    def forecast(self, context: np.ndarray, horizon: int) -> tuple[np.ndarray, dict[str, np.ndarray], list[str]]:
        context = np.asarray(context, dtype=np.float32)
        if context.size < 1:
            raise ForecastError("Forecast context is empty.")
        if horizon < 1:
            raise ForecastError("Forecast horizon must be positive.")
        if self.mock:
            self.ensure_model()
            return self._mock_forecast(context, horizon)

        self.ensure_model()
        warnings: list[str] = []
        with self._torch.inference_mode():
            point_forecast, quantile_forecast = self._model.forecast(
                horizon=horizon,
                inputs=[context],
            )
        point = self._extract_point(point_forecast, horizon)
        quantiles = self._extract_quantiles(quantile_forecast, horizon, warnings)
        return point, quantiles, warnings

    def _mock_forecast(self, context: np.ndarray, horizon: int) -> tuple[np.ndarray, dict[str, np.ndarray], list[str]]:
        window = min(8, len(context))
        tail = context[-window:]
        last = float(context[-1])
        baseline = float(np.mean(tail))
        trend = float((tail[-1] - tail[0]) / max(1, window - 1)) if window > 1 else 0.0
        steps = np.arange(1, horizon + 1, dtype=np.float32)
        point = (last + trend * steps) * 0.7 + baseline * 0.3
        spread = float(np.std(tail)) or max(abs(last) * 0.03, 1e-3)
        return point.astype(float), {
            "q10": point - 1.28 * spread,
            "q50": point,
            "q90": point + 1.28 * spread,
        }, ["TIMESFM_MOCK=1 is enabled; returning a naive mock forecast."]

    @staticmethod
    def _extract_point(point_forecast: Any, horizon: int) -> np.ndarray:
        array = np.asarray(point_forecast, dtype=float)
        if array.ndim == 1:
            return array[:horizon]
        if array.ndim >= 2:
            return array[0, :horizon]
        raise RuntimeError("TimesFM point forecast returned an unsupported shape.")

    @staticmethod
    def _extract_quantiles(quantile_forecast: Any, horizon: int, warnings: list[str]) -> dict[str, np.ndarray]:
        if quantile_forecast is None:
            return {}
        if isinstance(quantile_forecast, dict):
            result: dict[str, np.ndarray] = {}
            for key in ("q10", "q50", "q90"):
                if key in quantile_forecast:
                    result[key] = np.asarray(quantile_forecast[key], dtype=float)[:horizon]
            return result
        array = np.asarray(quantile_forecast, dtype=float)
        if array.ndim >= 3 and array.shape[-1] >= 3:
            sample = array[0, :horizon, :]
            warnings.append("Quantile forecast mapping inferred from returned quantile order.")
            return {
                "q10": sample[:, 0],
                "q50": sample[:, sample.shape[-1] // 2],
                "q90": sample[:, -1],
            }
        warnings.append("TimesFM returned quantiles in an unsupported shape; point forecast only.")
        return {}


def clean_timeseries(df: pd.DataFrame, params: ForecastParams, warnings: list[str]) -> pd.DataFrame:
    required = [params.timestamp_col, params.target_col]
    for column in required:
        if column not in df.columns:
            raise ForecastError(f"Missing required column: {column}")
    working = df.copy()
    if params.series_id_col and params.series_id_col in working.columns and params.selected_series_id:
        working = working[working[params.series_id_col].astype(str) == str(params.selected_series_id)]
        if working.empty:
            raise ForecastError("No rows matched the selected series ID.")

    timestamps = pd.to_datetime(working[params.timestamp_col], errors="coerce")
    try:
        timestamps = timestamps.dt.tz_localize(None)
    except TypeError:
        pass
    working["timestamp"] = timestamps
    working["value"] = pd.to_numeric(working[params.target_col], errors="coerce")
    before = len(working)
    working = working.dropna(subset=["timestamp", "value"])
    dropped = before - len(working)
    if dropped:
        warnings.append(f"Dropped {dropped} rows with missing timestamp or numeric target.")
    if len(working) < 32:
        raise ForecastError("Not enough historical points for TimesFM context and validation. Extend the train period.")
    duplicate_count = int(working.duplicated(subset=["timestamp"]).sum())
    if duplicate_count:
        warnings.append("Duplicate timestamps were aggregated by mean target value.")
        working = working.groupby("timestamp", as_index=False)["value"].mean()
    return working.sort_values("timestamp").reset_index(drop=True)


def choose_validation_length(history_len: int, horizon: int, ratio: float, mode: str, warnings: list[str]) -> int:
    if history_len < 48:
        warnings.append("History is short; skipping validation context selection.")
        return 0
    safe_ratio = min(0.5, max(0.05, float(ratio or 0.2)))
    cap = max(1, int(history_len * 0.3))
    requested = int(history_len * safe_ratio) if mode == "manual" else horizon
    val_len = min(max(8, requested), cap)
    if history_len - val_len < 24:
        warnings.append("Not enough internal train rows for validation; using all history as context.")
        return 0
    return val_len


def eligible_contexts(candidates: list[int], available: int, service: TimesFMService) -> list[int]:
    max_supported = max(1, service.max_context)
    bounded = [candidate for candidate in candidates if candidate <= available and candidate <= max_supported]
    if bounded:
        return bounded
    fallback = min(available, max_supported, 1024)
    return [max(1, fallback)]


def run_forecast(df: pd.DataFrame, params: ForecastParams, service: TimesFMService) -> dict[str, Any]:
    warnings: list[str] = []
    clean = clean_timeseries(df, params, warnings)
    train_start = parse_boundary(params.train_start, "train_start")
    train_end = parse_boundary(params.train_end, "train_end")
    test_start = parse_boundary(params.test_start, "test_start")
    test_end = parse_boundary(params.test_end, "test_end")
    if train_end <= train_start:
        raise ForecastError("train_end must be later than train_start.")
    if test_end <= train_end:
        raise ForecastError("test_end must be later than train_end.")
    if test_end < test_start:
        raise ForecastError("test_end must be later than test_start.")

    offset, frequency_label = infer_frequency(clean["timestamp"], warnings)
    history = clean[(clean["timestamp"] >= train_start) & (clean["timestamp"] <= train_end)].copy()
    if len(history) < 32:
        raise ForecastError("Not enough historical points for TimesFM context and validation. Extend the train period.")

    future_index = build_future_index(train_end, test_end, offset)
    if len(future_index) < 1:
        raise ForecastError("Forecast horizon is empty. Check train_end and test_end.")
    returned_mask = future_index >= test_start
    returned_index = future_index[returned_mask]
    if len(returned_index) < 1:
        raise ForecastError("No forecast points fall inside the requested test window.")

    test_actual = clean[(clean["timestamp"] >= test_start) & (clean["timestamp"] <= test_end)].copy()
    test_actual_indexed = test_actual.set_index("timestamp")["value"] if not test_actual.empty else pd.Series(dtype=float)

    candidates = parse_context_candidates(params.context_candidates)
    if params.context_mode == "auto":
        candidates = DEFAULT_CONTEXT_CANDIDATES[:]

    validation_len = choose_validation_length(
        history_len=len(history),
        horizon=len(returned_index),
        ratio=params.validation_ratio,
        mode=params.validation_mode,
        warnings=warnings,
    )
    validation_forecast_frame = pd.DataFrame(columns=["timestamp", "yhat", "q10", "q50", "q90"])
    validation_metrics: dict[str, float | None] | None = None
    chosen_context = min(len(history), service.max_context, 1024)

    if validation_len > 0:
        train_internal = history.iloc[:-validation_len].copy()
        validation = history.iloc[-validation_len:].copy()
        context_options = eligible_contexts(candidates, len(train_internal), service)
        best: tuple[float, int, np.ndarray, dict[str, np.ndarray], list[str]] | None = None
        for context_len in context_options:
            context = train_internal["value"].tail(context_len).to_numpy(dtype=np.float32)
            point, quantiles, model_warnings = service.forecast(context, validation_len)
            metrics = compute_metrics(validation["value"].to_numpy(dtype=float), point)
            if metrics is None or metrics["mae"] is None:
                continue
            score = float(metrics["mae"])
            if best is None or score < best[0]:
                best = (score, context_len, point, quantiles, model_warnings)
        if best is not None:
            _, chosen_context, point, quantiles, model_warnings = best
            warnings.extend(model_warnings)
            validation_forecast_frame = pd.DataFrame({
                "timestamp": validation["timestamp"].to_numpy(),
                "yhat": point[:validation_len],
            })
            for key, values in quantiles.items():
                validation_forecast_frame[key] = values[:validation_len]
            validation_metrics = compute_metrics(
                validation["value"].to_numpy(dtype=float),
                validation_forecast_frame["yhat"].to_numpy(dtype=float),
                validation_forecast_frame["q10"].to_numpy(dtype=float) if "q10" in validation_forecast_frame else None,
                validation_forecast_frame["q90"].to_numpy(dtype=float) if "q90" in validation_forecast_frame else None,
            )
        else:
            warnings.append("Validation context selection did not produce metrics; using fallback context length.")
    else:
        train_internal = history
        validation = pd.DataFrame(columns=history.columns)

    chosen_context = int(max(1, min(chosen_context, len(history), service.max_context)))
    final_context = history["value"].tail(chosen_context).to_numpy(dtype=np.float32)
    point, quantiles, model_warnings = service.forecast(final_context, len(future_index))
    warnings.extend(model_warnings)
    forecast_frame = pd.DataFrame({
        "timestamp": future_index,
        "yhat": point[: len(future_index)],
    })
    for key, values in quantiles.items():
        forecast_frame[key] = values[: len(future_index)]
    test_forecast_frame = forecast_frame[forecast_frame["timestamp"].isin(returned_index)].copy()

    aligned_actual = test_actual_indexed.reindex(test_forecast_frame["timestamp"]).to_numpy(dtype=float)
    test_metrics = compute_metrics(
        aligned_actual,
        test_forecast_frame["yhat"].to_numpy(dtype=float),
        test_forecast_frame["q10"].to_numpy(dtype=float) if "q10" in test_forecast_frame else None,
        test_forecast_frame["q90"].to_numpy(dtype=float) if "q90" in test_forecast_frame else None,
    )

    split = {
        "train_internal_start": series_to_iso(train_internal["timestamp"].iloc[0]) if len(train_internal) else None,
        "train_internal_end": series_to_iso(train_internal["timestamp"].iloc[-1]) if len(train_internal) else None,
        "validation_start": series_to_iso(validation["timestamp"].iloc[0]) if len(validation) else None,
        "validation_end": series_to_iso(validation["timestamp"].iloc[-1]) if len(validation) else None,
        "test_start": series_to_iso(test_start),
        "test_end": series_to_iso(test_end),
    }

    return {
        "ok": True,
        "meta": {
            "model_id": service.model_id,
            "server": "aibig9",
            "device": service.device,
            "gpu_name": service.gpu_name,
            "chosen_context_length": chosen_context,
            "forecast_horizon_total": int(len(future_index)),
            "returned_test_points": int(len(test_forecast_frame)),
            "frequency": frequency_label,
            "train_row_count": int(len(history)),
            "validation_row_count": int(len(validation)),
            "test_row_count": int(len(test_actual)),
            "split": split,
            "warnings": list(dict.fromkeys(warnings)),
        },
        "metrics": {
            "validation": validation_metrics,
            "test": test_metrics,
        },
        "series": {
            "train_tail": points_from_frame(history.tail(min(500, len(history))), "value"),
            "validation_actual": points_from_frame(validation, "value") if len(validation) else [],
            "validation_forecast": forecast_points(validation_forecast_frame) if len(validation_forecast_frame) else [],
            "test_actual": points_from_frame(test_actual, "value") if len(test_actual) else [],
            "test_forecast": forecast_points(test_forecast_frame),
        },
    }
