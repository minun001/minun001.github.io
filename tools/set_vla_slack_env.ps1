param(
    [Parameter(Mandatory = $true)]
    [string]$BotToken,
    [string]$TargetUser = "U0ALWBGLSBH",
    [switch]$Persist
)

if (-not $BotToken.StartsWith("xoxb-")) {
    Write-Error "Bot token must start with xoxb-."
    exit 1
}

$env:SLACK_VLA_BOT_TOKEN = $BotToken
$env:SLACK_VLA_TARGET_USER = $TargetUser

Write-Host "Set SLACK_VLA_BOT_TOKEN for this PowerShell session."
Write-Host "Set SLACK_VLA_TARGET_USER=$TargetUser for this PowerShell session."

if ($Persist) {
    setx SLACK_VLA_BOT_TOKEN $BotToken | Out-Null
    setx SLACK_VLA_TARGET_USER $TargetUser | Out-Null
    Write-Host "Persisted environment variables with setx. Open a new PowerShell window to use the persisted values."
}
