# TimesFM API for aibig9

This FastAPI service runs Google Research TimesFM on GPU Server 9 / aibig9. The GitHub Pages website is static and sends CSV/TSV files through the authenticated Workspace helper after the private Workspace session is valid.

## Important Boundary

- GitHub Pages does not run Python, CUDA, PyTorch, or TimesFM.
- TimesFM runs only on aibig9.
- The service uses zero-shot inference only.
- The selected train window is historical context, not model-weight training.
- Validation is used only for zero-shot backtesting and context-length selection.
- The browser does not store the aibig9 API token. The Workspace helper forwards authenticated requests with `TIMESFM_API_TOKEN` from its server-side environment.
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
http://127.0.0.1:4000/workspace/timesfm/
```

Run or restart the Workspace helper with these environment variables so the static page can call aibig9 through the existing Workspace session:

```bash
export TIMESFM_API_BASE_URL=http://127.0.0.1:8791
export TIMESFM_API_TOKEN=CHANGE_ME
python tools/workspace_server_refresh_helper.py
```

For a remote helper or Cloudflare Tunnel setup, keep the browser pointed at the Workspace helper. The helper can talk to the TimesFM API over `http://127.0.0.1:8791` when both run on the same server, or over a private HTTPS endpoint when they are separate.

Production page:

```text
https://minun001.github.io/workspace/timesfm/
```

The static config intentionally uses Workspace helper proxy endpoints (`/timesfm/health`, `/timesfm/preview`, `/timesfm/forecast`) so the aibig9 token never appears in the browser.

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

## Workspace Helper Proxy

The existing Workspace helper now exposes authenticated proxy routes:

- `GET /timesfm/health` -> `GET ${TIMESFM_API_BASE_URL}/health`
- `POST /timesfm/preview` -> `POST ${TIMESFM_API_BASE_URL}/api/timesfm/preview`
- `POST /timesfm/forecast` -> `POST ${TIMESFM_API_BASE_URL}/api/timesfm/forecast`

All three routes require the Workspace helper session. The helper injects `Authorization: Bearer ${TIMESFM_API_TOKEN}` when it talks to the FastAPI backend.

## HTTPS Exposure Options

Use one of:

- Cloudflare Tunnel, see `cloudflared_tunnel.example.md`.
- Nginx HTTPS reverse proxy to `http://127.0.0.1:8791`.
- SSH tunnel for development only.

Do not expose an unauthenticated public forecasting endpoint.
