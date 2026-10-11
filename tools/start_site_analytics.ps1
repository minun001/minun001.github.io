param([int]$Port = 8792, [string]$Python = 'python', [string]$Cloudflared = 'cloudflared')
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$auth = Join-Path $repo '.private\analytics\owner.json'
if (!(Test-Path -LiteralPath $auth)) { throw 'Configure the owner first: python tools/site_analytics.py --set-credentials' }
$probe = New-Object System.Net.Sockets.TcpClient
try { $probe.Connect('127.0.0.1', $Port) } catch {}
$occupied = $probe.Connected
$probe.Dispose()
if ($occupied) { throw "Port $Port is already in use. Stop the existing Analytics API before starting this launcher." }
if (!(Get-Command $Cloudflared -ErrorAction SilentlyContinue)) {
    $installed = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
    if (Test-Path -LiteralPath $installed) { $Cloudflared = $installed }
    else { throw 'Install the official Cloudflare.cloudflared package first.' }
}
$api = Start-Process -FilePath $Python -ArgumentList @('tools/site_analytics.py', '--port', $Port) -WorkingDirectory $repo -WindowStyle Hidden -PassThru
$tunnel = $null
try {
    $ready = $false
    for ($i=0; $i -lt 30; $i++) {
        if ($api.HasExited) { throw 'The Analytics API could not start. Check for an existing process on this port.' }
        try {
            $health = Invoke-RestMethod "http://127.0.0.1:$Port/health" -TimeoutSec 1
            if ($health.service -eq 'private-site-analytics' -and $health.configured) { $ready = $true; break }
        } catch {}
        Start-Sleep -Milliseconds 300
    }
    if (!$ready) { throw 'The private Analytics API did not become ready.' }
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = $Cloudflared
    $info.Arguments = "tunnel --url http://127.0.0.1:$Port --no-autoupdate"
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardError = $true
    $tunnel = [System.Diagnostics.Process]::Start($info)
    $published = $false
    while (!$tunnel.StandardError.EndOfStream) {
        $line = $tunnel.StandardError.ReadLine()
        if (!$published -and $line -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
            $url = $Matches[0]
            # A public URL is not a credential. Never put credentials or statistics in this asset.
            $source = "window.SITE_ANALYTICS_CONFIG = {`n  apiBaseUrl: '$url',`n  collectionEnabled: true,`n  timezone: 'Asia/Seoul',`n  retentionDays: 90`n};`n"
            [System.IO.File]::WriteAllText((Join-Path $repo 'assets\site-analytics-config.js'), $source, (New-Object System.Text.UTF8Encoding($false)))
            Write-Host "Analytics HTTPS API: $url"
            Write-Host 'The public config has been updated locally. Build, review and deploy it to GitHub Pages.'
            Write-Host 'Keep this process running. Restarting a Quick Tunnel changes its URL and requires redeployment.'
            $published = $true
        }
        if ($line -match '\bERR\b') { Write-Warning 'The HTTPS tunnel reported a connection error.' }
    }
    if (!$published) { throw 'The tunnel did not provide an HTTPS URL.' }
} finally {
    if ($null -ne $tunnel -and !$tunnel.HasExited) { $tunnel.Kill() }
    if (!$api.HasExited) { Stop-Process -Id $api.Id }
}
