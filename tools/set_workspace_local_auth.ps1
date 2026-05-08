param(
    [string]$Email = '',
    [int]$SessionMinutes = 180
)

$ErrorActionPreference = 'Stop'

$toolsRoot = $PSScriptRoot
$authPath = Join-Path $toolsRoot 'workspace_auth.local.json'

$normalizedEmail = $Email.Trim().ToLowerInvariant()
$promptLabel = if ([string]::IsNullOrWhiteSpace($normalizedEmail)) {
    'Local Workspace password'
}
else {
    "Local Workspace password for $normalizedEmail"
}

$securePassword = Read-Host -Prompt $promptLabel -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    if ([string]::IsNullOrWhiteSpace($password)) {
        throw 'Password cannot be empty.'
    }

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($password)
        $hashBytes = $sha.ComputeHash($bytes)
        $hash = [BitConverter]::ToString($hashBytes).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $sha.Dispose()
    }

    $payload = [ordered]@{
        email = $normalizedEmail
        allow_any_email = [string]::IsNullOrWhiteSpace($normalizedEmail)
        password_sha256 = $hash
        session_minutes = [Math]::Max(5, [Math]::Min($SessionMinutes, 1440))
    }

    $json = $payload | ConvertTo-Json -Depth 3
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($authPath, "$json`n", $utf8NoBom)
    Write-Host "Wrote local auth config: $authPath"
    Write-Host 'This file is ignored by git and must stay local.'
}
finally {
    if ($bstr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}
