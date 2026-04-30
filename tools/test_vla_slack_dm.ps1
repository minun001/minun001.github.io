$repoRoot = Split-Path -Parent $PSScriptRoot
$pythonScript = Join-Path $repoRoot "tools\\send_vla_slack_dm.py"

if (-not $env:SLACK_VLA_BOT_TOKEN) {
    Write-Error "SLACK_VLA_BOT_TOKEN is not set."
    exit 1
}

if (-not $env:SLACK_VLA_TARGET_USER) {
    $env:SLACK_VLA_TARGET_USER = "U0ALWBGLSBH"
}

python $pythonScript "VLA notification test"
