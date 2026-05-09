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

Then open:

```text
https://minun001.github.io/workspace/timesfm/?timesfmApi=https://timesfm-api.example.com
```

Keep `/api/timesfm/*` protected with `TIMESFM_API_TOKEN`. If Cloudflare Access is added, the browser may also need Access headers or an allowed session.
