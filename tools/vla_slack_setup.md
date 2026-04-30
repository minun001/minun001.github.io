## VLA Slack setup

### 1. Create the Slack app

1. Open Slack app management.
2. Create a new app from manifest.
3. Paste the contents of `tools/slack_vla_app_manifest.yaml`.
4. Create the app in the same workspace where you want the DM alerts.

### 2. Install the app

1. Open the new `VLA` app settings.
2. Install the app to the workspace.
3. Copy the bot token that starts with `xoxb-`.

### 3. Configure the local runtime

Set these environment variables on the trusted machine that will send VLA completion notices:

- `SLACK_VLA_BOT_TOKEN`
- `SLACK_VLA_TARGET_USER`

Recommended target user:

- `SLACK_VLA_TARGET_USER=U0ALWBGLSBH`

Fastest way:

```powershell
powershell -ExecutionPolicy Bypass -File tools/set_vla_slack_env.ps1 -BotToken "xoxb-..." -Persist
```

### 4. Verify the connection

Run this command from the website repo:

```powershell
python tools/send_vla_slack_dm.py "VLA notification test"
```

Or use the PowerShell helper:

```powershell
powershell -ExecutionPolicy Bypass -File tools/test_vla_slack_dm.ps1
```

Expected result:

- Slack DM arrives from the `VLA` bot
- Message prefix is `[VLA]`

### 5. Use for VLA task completion

When a VLA task finishes, call:

```powershell
python tools/send_vla_slack_dm.py "Completed: <task summary>"
```

Or use the completion helper:

```powershell
powershell -ExecutionPolicy Bypass -File tools/send_vla_completion_notice.ps1 -TaskSummary "<task summary>"
```

### 6. Wrap a task and notify automatically

If you want a command to send a VLA DM automatically when it succeeds:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run_with_vla_notice.ps1 -TaskSummary "VLA batch inference finished" -CommandLine "python run_vla_job.py"
```

Optional failure notice:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run_with_vla_notice.ps1 -TaskSummary "VLA batch inference finished" -NotifyOnFailure -CommandLine "python run_vla_job.py"
```

### Notes

- The current Codex Slack connection cannot create a Slack app directly.
- It can send Slack DMs once the app exists and you have the token wired into a local runtime.
