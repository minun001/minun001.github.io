[CmdletBinding()]
param(
    [string]$TaskName = "Scholar Metrics Local Fallback",
    [string]$At = "01:30",
    [string]$ScriptPath = "",
    [string]$Python = "",
    [switch]$RunNow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDirectory = if ([string]::IsNullOrWhiteSpace($PSScriptRoot)) {
    Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
    $PSScriptRoot
}

function Resolve-TaskTime {
    param([string]$Value)

    $parts = $Value.Split(":")
    if ($parts.Count -ne 2) {
        throw "Use HH:mm format for -At, for example 01:30."
    }

    $hour = [int]$parts[0]
    $minute = [int]$parts[1]
    if ($hour -lt 0 -or $hour -gt 23 -or $minute -lt 0 -or $minute -gt 59) {
        throw "Use a valid 24-hour HH:mm value for -At."
    }

    return [DateTime]::Today.AddHours($hour).AddMinutes($minute)
}

if ([string]::IsNullOrWhiteSpace($ScriptPath)) {
    $ScriptPath = Join-Path $ScriptDirectory "scholar_local_fallback.ps1"
}

$resolvedScriptPath = (Resolve-Path -LiteralPath $ScriptPath).Path
$taskTime = Resolve-TaskTime $At
$powerShellExe = Join-Path $env:WINDIR "System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$resolvedScriptPath`""
if (-not [string]::IsNullOrWhiteSpace($Python)) {
    $resolvedPython = (Resolve-Path -LiteralPath $Python).Path
    $arguments += " -Python `"$resolvedPython`""
}

$action = New-ScheduledTaskAction -Execute $powerShellExe -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Daily -At $taskTime
$principal = New-ScheduledTaskPrincipal `
    -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) `
    -LogonType Interactive `
    -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -MultipleInstances IgnoreNew

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Daily delayed fallback for Google Scholar data updates when GitHub Actions does not refresh the site." `
    -Force | Out-Null

Write-Host "Registered scheduled task '$TaskName' for $At local time."
Write-Host "Action: $powerShellExe $arguments"

if ($RunNow) {
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "Started scheduled task '$TaskName'."
}
