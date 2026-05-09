#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/min_hs/timesfm-api}"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${VENV_DIR:-$APP_DIR/.venv}"
HF_HOME="${HF_HOME:-/data/min_hs/hf_cache/timesfm}"
PORT="${PORT:-8791}"

mkdir -p "$APP_DIR" "$HF_HOME"
python3 -m venv "$VENV_DIR"
"$VENV_DIR/bin/python" -m pip install --upgrade pip wheel
"$VENV_DIR/bin/python" -m pip install -r "$SOURCE_DIR/requirements.txt"

echo "Checking CUDA visibility..."
"$VENV_DIR/bin/python" - <<'PY'
import torch
print("cuda_available=", torch.cuda.is_available())
print("device=", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")
PY

cat <<EOF

TimesFM API environment is ready.

Next steps:
1. Copy .env.example to .env and set TIMESFM_API_TOKEN.
2. Start a smoke test:
   cd "$SOURCE_DIR"
   export HF_HOME="$HF_HOME"
   set -a; [ -f .env ] && . ./.env; set +a
   "$VENV_DIR/bin/uvicorn" app:app --host 127.0.0.1 --port "$PORT"
3. Expose 127.0.0.1:$PORT through HTTPS with Cloudflare Tunnel or Nginx.
4. Restart the Workspace helper with TIMESFM_API_BASE_URL and TIMESFM_API_TOKEN.
5. Open /workspace/timesfm/

Do not expose /api/timesfm/* without TIMESFM_API_TOKEN.
EOF
