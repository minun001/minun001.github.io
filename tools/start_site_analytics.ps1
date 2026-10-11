param([int]$Port = 8792, [string]$Python = 'python', [string]$Cloudflared = 'cloudflared', [switch]$LocalOnly)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$auth = Join-Path $repo '.private\analytics\owner.json'
if (!(Test-Path -LiteralPath $auth)) { throw 'Configure the owner first: python tools/site_analytics.py --set-credentials' }
if ($LocalOnly -and $Port -ne 8792) { throw 'Local-only mode uses port 8792, matching the local dashboard.' }
function Test-LocalPort([int]$Value) {
    $probe = New-Object System.Net.Sockets.TcpClient
    try { $probe.Connect('127.0.0.1', $Value); return $true } catch { return $false }
    finally { $probe.Dispose() }
}
$api = $null
$preview = $null
$tunnel = $null
try {
    if (Test-LocalPort $Port) {
        $existing = Invoke-RestMethod "http://127.0.0.1:$Port/health" -TimeoutSec 2
        if ($existing.service -ne 'private-site-analytics' -or !$existing.configured) { throw "Port $Port is occupied by an unexpected or unconfigured service." }
        Write-Host 'Reusing the running Analytics API. This launcher will not stop an existing process.'
    } else {
        $api = Start-Process -FilePath $Python -ArgumentList @('tools/site_analytics.py', '--port', $Port) -WorkingDirectory $repo -WindowStyle Hidden -PassThru
    }
    $ready = $false
    for ($i=0; $i -lt 30; $i++) {
        if ($null -ne $api -and $api.HasExited) { throw 'The Analytics API could not start. Check for an existing process on this port.' }
        try {
            $health = Invoke-RestMethod "http://127.0.0.1:$Port/health" -TimeoutSec 1
            if ($health.service -eq 'private-site-analytics' -and $health.configured) { $ready = $true; break }
        } catch {}
        Start-Sleep -Milliseconds 300
    }
    if (!$ready) { throw 'The private Analytics API did not become ready.' }
    if ($LocalOnly) {
        if (!(Test-Path -LiteralPath (Join-Path $repo '_site\analytics\index.html'))) { throw 'Build the local site first: bundle exec jekyll build' }
        if (!(Test-LocalPort 4000)) {
            $preview = Start-Process -FilePath $Python -ArgumentList @('-m', 'http.server', '4000', '--bind', '127.0.0.1', '--directory', '_site') -WorkingDirectory $repo -WindowStyle Hidden -PassThru
        }
        $previewReady = $false
        for ($i=0; $i -lt 30; $i++) {
            if ($null -ne $preview -and $preview.HasExited) { throw 'The local site preview could not start.' }
            try {
                $page = Invoke-WebRequest 'http://127.0.0.1:4000/analytics/' -UseBasicParsing -TimeoutSec 1
                if ($page.Content -match 'id="analytics-login-form"') { $previewReady = $true; break }
            } catch {}
            Start-Sleep -Milliseconds 300
        }
        if (!$previewReady) { throw 'Port 4000 did not serve the expected built Analytics page. Existing processes were not stopped.' }
        Write-Host 'Local Analytics: http://127.0.0.1:4000/analytics/'
        Write-Host 'PC-hosted mode. No public visits are collected without a permitted HTTPS tunnel.'
        Write-Host 'Shutdown or sleep interrupts the API. Missed visits are not queued or recovered.'
        Write-Host 'Keep this launcher running. Only processes started by it are stopped on exit.'
        while ($true) {
            if (($null -ne $api -and $api.HasExited) -or ($null -ne $preview -and $preview.HasExited)) { throw 'A local Analytics process stopped. Restart this launcher.' }
            Start-Sleep -Seconds 2
        }
    }
    if (!(Get-Command $Cloudflared -ErrorAction SilentlyContinue)) {
        $installed = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
        if (Test-Path -LiteralPath $installed) { $Cloudflared = $installed }
        else { throw 'Install the official Cloudflare.cloudflared package first, or use -LocalOnly.' }
    }
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = $Cloudflared
    $info.Arguments = "tunnel --url http://127.0.0.1:$Port --no-autoupdate"
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardError = $true
    $tunnel = [System.Diagnostics.Process]::Start($info)
    $published = $false
    $url = $null
    $lastLine = ''
    while (!$tunnel.StandardError.EndOfStream) {
        $line = $tunnel.StandardError.ReadLine()
        $lastLine = $line
        # Only accept the allocated hostname from the success banner, not api.trycloudflare.com in an error.
        if (!$published -and $line -match '\|\s*(https://(?!api\.)[a-z0-9-]+\.trycloudflare\.com)\s*\|') {
            $url = $Matches[1]
        }
        if (!$published -and $url -and $line -match 'Registered tunnel connection') {
            $reachable = $false
            for ($attempt=0; $attempt -lt 10; $attempt++) {
                try {
                    $publicHealth = Invoke-RestMethod "$url/health" -TimeoutSec 5
                    if ($publicHealth.service -eq 'private-site-analytics' -and $publicHealth.configured) { $reachable = $true; break }
                } catch {}
                Start-Sleep -Seconds 1
            }
            if (!$reachable) { throw 'The allocated HTTPS URL did not reach the Analytics API. Public config was not changed.' }
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
    if (!$published) { throw "The tunnel did not become reachable. Public config was not changed. $lastLine" }
    throw 'The HTTPS tunnel stopped. Restart this launcher and redeploy the new API URL.'
} finally {
    if ($null -ne $tunnel -and !$tunnel.HasExited) { $tunnel.Kill() }
    if ($null -ne $preview -and !$preview.HasExited) { Stop-Process -Id $preview.Id }
    if ($null -ne $api -and !$api.HasExited) { Stop-Process -Id $api.Id }
}
