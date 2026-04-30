param(
    [Parameter(Mandatory = $true)]
    [string]$TaskSummary,
    [string]$Workdir,
    [switch]$NotifyOnFailure,
    [Parameter(Mandatory = $true)]
    [string]$CommandLine
)

$noticeScript = Join-Path $PSScriptRoot "send_vla_completion_notice.ps1"
$pythonScript = Join-Path $PSScriptRoot "send_vla_slack_dm.py"

if (-not $env:SLACK_VLA_BOT_TOKEN) {
    $persistedToken = [Environment]::GetEnvironmentVariable("SLACK_VLA_BOT_TOKEN", "User")
    if ($persistedToken) {
        $env:SLACK_VLA_BOT_TOKEN = $persistedToken
    }
}

if (-not $env:SLACK_VLA_TARGET_USER) {
    $persistedTarget = [Environment]::GetEnvironmentVariable("SLACK_VLA_TARGET_USER", "User")
    if ($persistedTarget) {
        $env:SLACK_VLA_TARGET_USER = $persistedTarget
    } else {
        $env:SLACK_VLA_TARGET_USER = "U0ALWBGLSBH"
    }
}

$pushed = $false
if ($Workdir) {
    Push-Location $Workdir
    $pushed = $true
}

try {
    Write-Host ("Running command: " + $CommandLine)
    & cmd.exe /d /s /c $CommandLine

    $exitCode = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } elseif ($?) { 0 } else { 1 }

    if ($exitCode -eq 0) {
        powershell -ExecutionPolicy Bypass -File $noticeScript -TaskSummary $TaskSummary
    } elseif ($NotifyOnFailure) {
        python $pythonScript "[VLA] Failed: $TaskSummary (exit $exitCode)"
    }

    exit $exitCode
} finally {
    if ($pushed) {
        Pop-Location
    }
}
