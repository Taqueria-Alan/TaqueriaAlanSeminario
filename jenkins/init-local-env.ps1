$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot '..\docker\.env'
if (Test-Path $envFile) {
    Write-Output 'docker/.env exists; preserved'
    exit 0
}
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$a = New-Object byte[] 24
$b = New-Object byte[] 24
$rng.GetBytes($a)
$rng.GetBytes($b)
$rootPassword = [BitConverter]::ToString($a).Replace('-', '').ToLower()
$appPassword = [BitConverter]::ToString($b).Replace('-', '').ToLower()
@(
    "MYSQL_ROOT_PASSWORD=$rootPassword"
    'MYSQL_DATABASE=taqueria_db'
    'MYSQL_USER=taqueria'
    "MYSQL_PASSWORD=$appPassword"
    'MYSQL_PORT=3306'
    'REDIS_PORT=6379'
) | Set-Content -Path $envFile -Encoding Ascii
Write-Output 'Created docker/.env (password values hidden)'
