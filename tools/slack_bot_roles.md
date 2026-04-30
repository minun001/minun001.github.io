## Slack bot roles

### Codex Tool

- Role: monitor the Publications Google Scholar snapshot and DM Hyunsik Min when the section does not update on the current KST day.
- Delivery target: Slack user `U0ALWBGLSBH`
- Current automation: `publications-stale-monitor`
- Schedule: daily at `01:30 KST`
- Trigger condition: `_data/google-scholar-metrics.json` shows a `checked_at_display` value older than today in Asia/Seoul.

### VLA

- Role: send a completion DM to Hyunsik Min when a VLA task finishes.
- Delivery target: Slack user `U0ALWBGLSBH`
- Slack app manifest: `tools/slack_vla_app_manifest.yaml`
- Required capability: bot scope `chat:write`
- Recommended message prefix: `[VLA]`

## Notes

- The current Codex Slack integration can send Slack DMs, but it cannot create a new Slack app or bot user by itself.
- To create `VLA`, open Slack app management and create a new app from the manifest in `tools/slack_vla_app_manifest.yaml`, then install it to the workspace.
- After installation, connect the bot token to the runtime that will send VLA completion notices.
