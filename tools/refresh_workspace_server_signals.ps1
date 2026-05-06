$ErrorActionPreference = 'Stop'

$syncRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $syncRoot
$configPath = Join-Path $repoRoot 'tools\workspace_servers.local.json'
$fallbackPath = Join-Path $syncRoot 'tools\workspace_server_sync_fallback.json'
$lockDir = Join-Path $syncRoot '.server-signals-refresh.lock'

if (-not (Test-Path $configPath)) {
    throw "Workspace server config not found: $configPath"
}

try {
    New-Item -ItemType Directory -Path $lockDir -ErrorAction Stop | Out-Null
} catch {
    Write-Output "Server signals refresh is already running. Skipping this interval."
    exit 0
}

try {
    Set-Location $syncRoot

    $preStatus = git status --porcelain
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to read git status before refresh.'
    }
    if ($preStatus) {
        throw "Sync clone is not clean before refresh.`n$preStatus"
    }

    git fetch origin
    if ($LASTEXITCODE -ne 0) {
        throw 'git fetch failed.'
    }

    git checkout main
    if ($LASTEXITCODE -ne 0) {
        throw 'git checkout main failed.'
    }

    git pull --rebase origin main
    if ($LASTEXITCODE -ne 0) {
        throw 'git pull --rebase origin main failed.'
    }

    python tools\workspace_server_sync.py --config $configPath --fallback-output $fallbackPath
    if ($LASTEXITCODE -ne 0) {
        throw 'workspace_server_sync.py refresh failed.'
    }

    git diff --quiet -- tools/workspace_server_sync_fallback.json
    $diffExit = $LASTEXITCODE
    if ($diffExit -eq 0) {
        Write-Output 'Server signals fallback is already up to date.'
        exit 0
    }
    if ($diffExit -ne 1) {
        throw 'Unable to determine whether the fallback file changed.'
    }

    git add tools/workspace_server_sync_fallback.json
    if ($LASTEXITCODE -ne 0) {
        throw 'git add failed for the fallback file.'
    }

    git commit -m "Workspace: refresh server signals fallback"
    if ($LASTEXITCODE -ne 0) {
        throw 'git commit failed for the fallback file refresh.'
    }

    git push origin main
    if ($LASTEXITCODE -ne 0) {
        throw 'git push origin main failed after refreshing the fallback file.'
    }

    Write-Output 'Server signals fallback refreshed and pushed to origin/main.'
} finally {
    if (Test-Path $lockDir) {
        Remove-Item $lockDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
