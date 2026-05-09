# TimesFM API for aibig9

This FastAPI service runs Google Research TimesFM on GPU Server 9 / aibig9. The GitHub Pages website is static and only sends CSV/TSV files to this HTTPS API after the private Workspace session is valid.

## Important Boundary

- GitHub Pages does not run Python, CUDA, PyTorch, or TimesFM.
- TimesFM runs only on aibig9.
- The service uses zero-shot inference only.
- The selected train window is historical context, not model-weight training.
- Validation is used only for zero-shot backtesting and context-length selection.
- Do not commit `.env`, tokens, uploaded files, model weights, logs, or private datasets.

## Deploy on aibig9

```bash
ssh aibig9
cd ~/min_hs
git clone https://github.com/minun001/minun001.github.io.git
cd minun001.github.io/tools/timesfm_server
cp .env.example .env
# edit .env and set TIMESFM_API_TOKEN
bash deploy_aibig9.sh
```

Smoke test:

```bash
set -a; . ./.env; set +a
uvicorn app:app --host 127.0.0.1 --port 8791
curl http://127.0.0.1:8791/health
```

For local frontend/backend testing without a GPU:

```bash
TIMESFM_MOCK=1 DISABLE_AUTH_FOR_LOCAL_DEV=1 uvicorn app:app --host 127.0.0.1 --port 8791
```

Then open local Jekyll with:

```text
http://127.0.0.1:4000/workspace/timesfm/?timesfmApi=http://127.0.0.1:8791
```

Production should use an HTTPS endpoint, for example:

```text
https://minun001.github.io/workspace/timesfm/?timesfmApi=https://timesfm-api.example.com
```

The static config intentionally keeps `apiBaseUrl` as `AIBIG9_PUBLIC_API_URL` until a real HTTPS Cloudflare Tunnel or Nginx endpoint is available.

## Endpoints

### `GET /health`

Public health endpoint. It reports service state, model id, CUDA availability, GPU name when available, and max upload size. It does not expose secrets.

### `POST /api/timesfm/preview`

Requires:

```http
Authorization: Bearer ${TIMESFM_API_TOKEN}
```

Input is multipart form data with a CSV or TSV file. The response includes columns, row count, first 5 rows, inferred timestamp range, and warnings.

### `POST /api/timesfm/forecast`

Requires:

```http
Authorization: Bearer ${TIMESFM_API_TOKEN}
```

Input is multipart form data:

- `file`
- `timestamp_col`
- `target_col`
- `series_id_col` optional
- `selected_series_id` optional
- `train_start`
- `train_end`
- `test_start`
- `test_end`
- `validation_ratio`
- `context_mode`
- `context_candidates`

The service cleans the data, infers frequency, creates internal validation from the train window, selects a context length by zero-shot backtesting, and returns test-window forecasts.

## HTTPS Exposure Options

Use one of:

- Cloudflare Tunnel, see `cloudflared_tunnel.example.md`.
- Nginx HTTPS reverse proxy to `http://127.0.0.1:8791`.
- SSH tunnel for development only.

Do not expose an unauthenticated public forecasting endpoint.
