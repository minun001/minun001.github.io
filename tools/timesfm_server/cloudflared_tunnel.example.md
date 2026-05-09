# Cloudflare Tunnel Example

Use this when aibig9 does not already have a public HTTPS reverse proxy.

```bash
cloudflared tunnel login
cloudflared tunnel create timesfm-aibig9
cloudflared tunnel route dns timesfm-aibig9 timesfm-api.example.com
```

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: timesfm-aibig9
credentials-file: /home/min_hs/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: timesfm-api.example.com
    service: http://127.0.0.1:8791
  - service: http_status:404
```

Run:

```bash
cloudflared tunnel run timesfm-aibig9
```

If the Workspace helper runs on the same server, set:

```bash
export TIMESFM_API_BASE_URL=http://127.0.0.1:8791
export TIMESFM_API_TOKEN=CHANGE_ME
```

Then open:

```text
https://minun001.github.io/workspace/timesfm/
```

Keep `/api/timesfm/*` protected with `TIMESFM_API_TOKEN`. The browser should normally talk to the Workspace helper proxy, not directly to this TimesFM API hostname.
