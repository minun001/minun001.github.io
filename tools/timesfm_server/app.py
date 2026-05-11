from __future__ import annotations

import io
import os
from typing import Annotated

import pandas as pd
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from model_service import ForecastError, ForecastParams, TimesFMService, run_forecast
from schemas import ColumnInfo, HealthResponse, PreviewResponse, SuggestedWindow, TimestampRange


SERVICE_VERSION = "2026.05.09"
DEFAULT_ALLOWED_ORIGINS = "https://minun001.github.io,http://127.0.0.1:4000,http://localhost:4000"


def get_max_upload_mb() -> int:
    try:
        return int(os.getenv("MAX_UPLOAD_MB", "25"))
    except ValueError:
        return 25


def get_allowed_origins() -> list[str]:
    raw = os.getenv("TIMESFM_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS)
    return [item.strip() for item in raw.split(",") if item.strip()]


app = FastAPI(title="TimesFM aibig9 API", version=SERVICE_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

service = TimesFMService()


def is_local_client(request: Request) -> bool:
    host = request.client.host if request.client else ""
    return host in {"127.0.0.1", "localhost", "::1"}


async def require_bearer_auth(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    local_dev_disabled = os.getenv("DISABLE_AUTH_FOR_LOCAL_DEV", "0") == "1"
    if local_dev_disabled and is_local_client(request):
        return
    expected = os.getenv("TIMESFM_API_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=503, detail="TIMESFM_API_TOKEN is not configured.")
    prefix = "Bearer "
    if not authorization or not authorization.startswith(prefix):
        raise HTTPException(status_code=401, detail="Missing aibig9 API token.")
    supplied = authorization[len(prefix):].strip()
    if supplied != expected:
        raise HTTPException(status_code=403, detail="Invalid aibig9 API token.")


async def read_upload_bytes(file: UploadFile) -> bytes:
    filename = (file.filename or "").lower()
    if not (filename.endswith(".csv") or filename.endswith(".tsv")):
        raise HTTPException(status_code=400, detail="Could not parse the file. Use CSV/TSV with one timestamp column and one numeric target column.")
    max_bytes = get_max_upload_mb() * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {get_max_upload_mb()} MB maximum upload size.")
    return content


def parse_upload_dataframe(content: bytes, filename: str) -> pd.DataFrame:
    try:
        if filename.lower().endswith(".tsv"):
            df = pd.read_csv(io.BytesIO(content), sep="\t")
        else:
            df = pd.read_csv(io.BytesIO(content), sep=None, engine="python")
        df.columns = [str(column) for column in df.columns]
        return df
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail="Could not parse the file. Use CSV/TSV with one timestamp column and one numeric target column.",
        ) from error


def jsonable_cell(value: object) -> object:
    if value is None or pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if hasattr(value, "item"):
        try:
            return value.item()
        except ValueError:
            pass
    return value if isinstance(value, (str, int, float, bool)) else str(value)


def sample_rows(df: pd.DataFrame) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for record in df.head(5).to_dict(orient="records"):
        rows.append({str(key): jsonable_cell(value) for key, value in record.items()})
    return rows


def infer_column_info(df: pd.DataFrame) -> list[ColumnInfo]:
    columns: list[ColumnInfo] = []
    for name in df.columns:
        series = df[name]
        numeric = pd.to_numeric(series, errors="coerce").notna().sum() >= max(3, int(series.notna().sum() * 0.6))
        parsed_dates = pd.to_datetime(series, errors="coerce")
        datetime_like = parsed_dates.notna().sum() >= max(3, int(series.notna().sum() * 0.6))
        columns.append(ColumnInfo(
            name=str(name),
            dtype=str(series.dtype),
            non_null=int(series.notna().sum()),
            numeric=bool(numeric),
            datetime_like=bool(datetime_like),
        ))
    return columns


def infer_timestamp_range(df: pd.DataFrame, columns: list[ColumnInfo]) -> TimestampRange | None:
    for column in columns:
        if not column.datetime_like:
            continue
        values = pd.to_datetime(df[column.name], errors="coerce").dropna()
        if values.empty:
            continue
        return TimestampRange(
            column=column.name,
            start=values.min().isoformat(),
            end=values.max().isoformat(),
        )
    return None


def infer_suggested_window(df: pd.DataFrame, timestamp_range: TimestampRange | None) -> SuggestedWindow | None:
    if timestamp_range is None:
        return None
    values = (
        pd.to_datetime(df[timestamp_range.column], errors="coerce")
        .dropna()
        .drop_duplicates()
        .sort_values()
        .reset_index(drop=True)
    )
    total = int(len(values))
    if total < 2:
        return None
    if total >= 40:
        test_count = min(max(8, round(total * 0.2)), total - 32)
    else:
        test_count = min(max(1, round(total * 0.2)), total - 1)
    if test_count < 1:
        return None
    split_index = total - test_count
    return SuggestedWindow(
        train_start=values.iloc[0].isoformat(),
        train_end=values.iloc[split_index - 1].isoformat(),
        test_start=values.iloc[split_index].isoformat(),
        test_end=values.iloc[total - 1].isoformat(),
        note="Auto-filled from detected timestamps; adjust if needed.",
    )


def preview_warnings(df: pd.DataFrame, columns: list[ColumnInfo]) -> list[str]:
    warnings: list[str] = []
    if df.isna().any().any():
        warnings.append("Missing values detected.")
    if not any(column.datetime_like for column in columns):
        warnings.append("No timestamp-like column was detected automatically.")
    if not any(column.numeric for column in columns):
        warnings.append("No numeric target candidate was detected automatically.")
    return warnings


def infer_series_values(df: pd.DataFrame) -> dict[str, list[str]]:
    values: dict[str, list[str]] = {}
    for column in df.columns:
        series = df[column].dropna().astype(str)
        if series.empty:
            continue
        unique = series.drop_duplicates().head(200).tolist()
        if 1 < len(unique) <= 200:
            values[str(column)] = unique
    return values


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        model_id=service.model_id,
        model_loaded=service.model_loaded,
        device=service.device,
        gpu_name=service.gpu_name,
        cuda_available=service.cuda_available,
        max_upload_mb=get_max_upload_mb(),
        version=SERVICE_VERSION,
    )


@app.post("/api/timesfm/preview", response_model=PreviewResponse, dependencies=[Depends(require_bearer_auth)])
async def preview(file: UploadFile = File(...)) -> PreviewResponse:
    content = await read_upload_bytes(file)
    df = parse_upload_dataframe(content, file.filename or "")
    columns = infer_column_info(df)
    timestamp_range = infer_timestamp_range(df, columns)
    return PreviewResponse(
        columns=columns,
        row_count=int(len(df)),
        sample_rows=sample_rows(df),
        timestamp_range=timestamp_range,
        suggested_window=infer_suggested_window(df, timestamp_range),
        series_values=infer_series_values(df),
        warnings=preview_warnings(df, columns),
    )


@app.post("/api/timesfm/forecast", dependencies=[Depends(require_bearer_auth)])
async def forecast(
    file: UploadFile = File(...),
    timestamp_col: str = Form(...),
    target_col: str = Form(...),
    series_id_col: str | None = Form(None),
    selected_series_id: str | None = Form(None),
    train_start: str = Form(...),
    train_end: str = Form(...),
    test_start: str = Form(...),
    test_end: str = Form(...),
    validation_mode: str = Form("auto"),
    validation_ratio: float = Form(0.2),
    context_mode: str = Form("auto"),
    context_candidates: str | None = Form(None),
) -> dict:
    content = await read_upload_bytes(file)
    df = parse_upload_dataframe(content, file.filename or "")
    params = ForecastParams(
        timestamp_col=timestamp_col,
        target_col=target_col,
        series_id_col=series_id_col or None,
        selected_series_id=selected_series_id or None,
        train_start=train_start,
        train_end=train_end,
        test_start=test_start,
        test_end=test_end,
        validation_mode=validation_mode,
        validation_ratio=validation_ratio,
        context_mode=context_mode,
        context_candidates=context_candidates,
    )
    try:
        return run_forecast(df, params, service)
    except ForecastError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
