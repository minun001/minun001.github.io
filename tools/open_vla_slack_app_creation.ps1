$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repoRoot "tools\\slack_vla_app_manifest.yaml"

if (-not (Test-Path $manifestPath)) {
    Write-Error "Manifest not found: $manifestPath"
    exit 1
}

$manifest = Get-Content $manifestPath -Raw -Encoding UTF8
$encodedManifest = [System.Uri]::EscapeDataString($manifest)
$url = "https://api.slack.com/apps?new_app=1&manifest_yaml=$encodedManifest"

Write-Host "Opening Slack app creation flow for VLA..."
Start-Process $url
