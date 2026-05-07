$ErrorActionPreference = 'Stop'

$toolsRoot = $PSScriptRoot
$syncRoot = Split-Path -Parent $toolsRoot
$repoRoot = Split-Path -Parent $syncRoot
$configPath = Join-Path $repoRoot 'tools\workspace_servers.local.json'
$fallbackOutput = Join-Path $syncRoot '_site\tools\workspace_server_sync_fallback.json'

if (-not (Test-Path $configPath)) {
    throw "Workspace server config not found: $configPath"
}

Set-Location $syncRoot
python tools\workspace_server_refresh_helper.py --config $configPath --fallback-output $fallbackOutput
