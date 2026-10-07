[CmdletBinding()]
param(
    [string]$RepositoryRoot = "",
    [string]$SyncRoot = "",
    [string]$Remote = "origin",
    [string]$Branch = "main",
    [string]$Python = "",
    [switch]$Force,
    [switch]$NoPush,
    [switch]$Quiet
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$MetricsPath = "_data/google-scholar-metrics.json"
$PublicationsPath = "_data/google-scholar-publications.json"
$UpdateScriptPath = "tools/update_scholar_metrics.py"
$ScriptDirectory = if ([string]::IsNullOrWhiteSpace($PSScriptRoot)) {
    Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
    $PSScriptRoot
}

function Write-LogLine {
    param([string]$Message)

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
    $line = "[$timestamp] $Message"
    if (-not $Quiet) {
        Write-Host $line
    }
}

function Send-SlackNotification {
    param(
        [string]$Status,
        [string]$Message
    )

    $webhook = $env:SCHOLAR_SYNC_SLACK_WEBHOOK_URL
    if ([string]::IsNullOrWhiteSpace($webhook)) {
        return
    }

    try {
        $payload = @{
            text = "Google Scholar local fallback [$Status]: $Message"
        } | ConvertTo-Json -Depth 3
        Invoke-RestMethod -Method Post -Uri $webhook -ContentType "application/json" -Body $payload | Out-Null
    } catch {
        Write-LogLine "Slack notification failed: $($_.Exception.Message)"
    }
}

function Invoke-CheckedCommand {
    param(
        [string]$FilePath,
        [string[]]$Arguments
    )

    Write-LogLine "Running: $FilePath $($Arguments -join ' ')"
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }
}

function Invoke-CheckedCapture {
    param(
        [string]$FilePath,
        [string[]]$Arguments
    )

    $output = & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }
    return ($output -join [Environment]::NewLine)
}

function Resolve-PythonCommand {
    if (-not [string]::IsNullOrWhiteSpace($Python)) {
        if (-not (Test-Path -LiteralPath $Python -PathType Leaf)) {
            throw "Python executable not found: $Python"
        }
        return @{
            File = $Python
            Args = @()
        }
    }

    $bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
    if (Test-Path -LiteralPath $bundledPython -PathType Leaf) {
        return @{ File = $bundledPython; Args = @() }
    }

    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($null -ne $pythonCommand) {
        return @{
            File = $pythonCommand.Source
            Args = @()
        }
    }

    $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
    if ($null -ne $pyLauncher) {
        return @{
            File = $pyLauncher.Source
            Args = @("-3")
        }
    }

    throw "Python was not found on PATH. Pass -Python with an absolute python.exe path."
}

if ([string]::IsNullOrWhiteSpace($RepositoryRoot)) {
    $RepositoryRoot = Join-Path $ScriptDirectory ".."
}
$RepositoryRoot = (Resolve-Path -LiteralPath $RepositoryRoot).Path
if ([string]::IsNullOrWhiteSpace($SyncRoot)) {
    $SyncRoot = Join-Path $RepositoryRoot ".scholar-sync-worktree"
}

try {
    Write-LogLine "Starting Google Scholar local fallback."
    Write-LogLine "Repository root: $RepositoryRoot"
    Write-LogLine "Sync root: $SyncRoot"

    if (-not (Test-Path -LiteralPath $SyncRoot)) {
        Write-LogLine "Sync root does not exist; creating a dedicated worktree for $Branch."
        Invoke-CheckedCommand "git" @("-C", $RepositoryRoot, "worktree", "add", $SyncRoot, $Branch)
    }

    $insideWorkTree = Invoke-CheckedCapture "git" @("-C", $SyncRoot, "rev-parse", "--is-inside-work-tree")
    if ($insideWorkTree.Trim() -ne "true") {
        throw "Sync root is not a git worktree: $SyncRoot"
    }

    $preflightStatus = Invoke-CheckedCapture "git" @("-C", $SyncRoot, "status", "--porcelain")
    if (-not [string]::IsNullOrWhiteSpace($preflightStatus)) {
        throw "Sync worktree has local changes. Clean $SyncRoot before running fallback.`n$preflightStatus"
    }

    $currentBranch = Invoke-CheckedCapture "git" @("-C", $SyncRoot, "branch", "--show-current")
    if ($currentBranch.Trim() -ne $Branch) {
        Invoke-CheckedCommand "git" @("-C", $SyncRoot, "checkout", $Branch)
    }

    Invoke-CheckedCommand "git" @("-C", $SyncRoot, "fetch", $Remote, $Branch)
    Invoke-CheckedCommand "git" @("-C", $SyncRoot, "pull", "--ff-only", $Remote, $Branch)

    $pythonCommand = Resolve-PythonCommand
    $pythonArgs = @($pythonCommand.Args) + @("-B", $UpdateScriptPath)
    if (-not $Force) {
        $pythonArgs += "--skip-if-fresh"
    }
    Push-Location $SyncRoot
    try {
        Invoke-CheckedCommand ([string]$pythonCommand.File) ([string[]]$pythonArgs)
    } finally {
        Pop-Location
    }

    $changedFiles = Invoke-CheckedCapture "git" @(
        "-C",
        $SyncRoot,
        "diff",
        "--name-only",
        "--",
        $MetricsPath,
        $PublicationsPath
    )
    if ([string]::IsNullOrWhiteSpace($changedFiles)) {
        Write-LogLine "Refresh ran, but no Scholar data changes were detected."
        return
    }

    Write-LogLine "Scholar data changed:`n$changedFiles"
    Invoke-CheckedCommand "git" @("-C", $SyncRoot, "add", $MetricsPath, $PublicationsPath)
    Invoke-CheckedCommand "git" @(
        "-C",
        $SyncRoot,
        "-c",
        "user.name=trusted-machine[bot]",
        "-c",
        "user.email=trusted-machine@users.noreply.github.com",
        "commit",
        "-m",
        "Update Google Scholar data"
    )
    Invoke-CheckedCommand "git" @("-C", $SyncRoot, "pull", "--rebase", $Remote, $Branch)

    if ($NoPush) {
        Write-LogLine "NoPush was set; commit was created locally and push was skipped."
        Send-SlackNotification "dry-run" "Scholar data changed and a local commit was created, but push was skipped."
        return
    }

    Invoke-CheckedCommand "git" @("-C", $SyncRoot, "push", $Remote, $Branch)
    Write-LogLine "Scholar fallback pushed updates successfully."
    Send-SlackNotification "ok" "Scholar data was refreshed and pushed from the trusted machine."
} catch {
    $message = $_.Exception.Message
    Write-LogLine "Scholar fallback failed: $message"
    Send-SlackNotification "failed" $message
    throw
}
