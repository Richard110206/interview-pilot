# Yingda one-shot dev starter (Windows PowerShell).
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1
# Env:    create .local/runtime.env from deploy/runtime.env.example first.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot '.local/runtime.env'
if (!(Test-Path -LiteralPath $envPath)) {
    throw 'Missing .local/runtime.env - copy deploy/runtime.env.example and fill in your keys first.'
}
foreach ($line in Get-Content -LiteralPath $envPath -Encoding utf8) {
    if ($line -match '^([A-Z][A-Z0-9_]*)=(.*)$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}

# 1) infrastructure: MySQL (+schema/seeds), MongoDB, Redis Stack
docker compose --env-file $envPath -f (Join-Path $repoRoot 'deploy/compose.local.yml') up -d --wait --wait-timeout 180
if ($LASTEXITCODE -ne 0) { throw 'Docker compose failed - is Docker Desktop running?' }

# 2) backend: build the jar if missing, then start it
$jarDir = Join-Path $repoRoot 'backend/admin/target'
$jar = Get-ChildItem -LiteralPath $jarDir -Filter 'xunzhi-admin-*.jar' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notmatch '\.original$' } | Select-Object -First 1
if (!$jar) {
    Write-Output 'Building backend (first run, a few minutes)...'
    Push-Location (Join-Path $repoRoot 'backend')
    try { & (Join-Path $repoRoot 'backend/mvnw.cmd') -q -pl admin -am package -DskipTests
        if ($LASTEXITCODE -ne 0) { throw 'Maven build failed.' } } finally { Pop-Location }
    $jar = Get-ChildItem -LiteralPath $jarDir -Filter 'xunzhi-admin-*.jar' |
        Where-Object { $_.Name -notmatch '\.original$' } | Select-Object -First 1
}
New-Item -ItemType Directory -Force -Path (Join-Path $repoRoot '.local/data'), (Join-Path $repoRoot '.local/logs') | Out-Null
$env:XUNZHI_STORAGE_BASE_DIR = Join-Path $repoRoot '.local/data'
$env:XUNZHI_LOG_DIR = Join-Path $repoRoot '.local/logs'
$javaExe = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin/java.exe' } else { 'java' }
Write-Output "Starting backend from $($jar.Name) on port $env:SERVER_PORT ..."
$backend = Start-Process -FilePath $javaExe -ArgumentList @('-Dfile.encoding=UTF-8', '-jar', ('"' + $jar.FullName + '"')) `
    -WindowStyle Hidden -WorkingDirectory (Join-Path $repoRoot 'backend') -PassThru
Write-Output "Backend PID $($backend.Id). Health: http://127.0.0.1:$env:SERVER_PORT/actuator/health (ready in ~15s)"

# 3) frontend: install deps if needed, then start Vite dev server
Push-Location (Join-Path $repoRoot 'frontend')
try {
    if (!(Test-Path 'node_modules')) { npm.cmd install }
    $frontend = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort') `
        -WindowStyle Hidden -WorkingDirectory (Get-Location) -PassThru
    Write-Output "Frontend PID $($frontend.Id): http://127.0.0.1:5173/"
} finally { Pop-Location }

Write-Output 'Demo account: demo / 123456 (or register your own).'
