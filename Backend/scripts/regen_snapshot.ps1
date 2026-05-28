#requires -Version 5.1
<#
.SYNOPSIS
  Regenerate Backend/fixtures/simulated_quarter.sql.gz from a clean DB.

.DESCRIPTION
  Tears the configured Postgres database down to nothing, runs alembic
  to the head, executes the discrete-event simulator for the configured
  window, then `pg_dump`s + gzips the result into the fixture path the
  snapshot_loader reads at boot.

  The previous snapshot lacked permissions / role_permissions rows because
  the simulator's TRUNCATE wiped them and no one repopulated before the
  dump. After the seeder fix (seed_rbac runs at the end of bootstrap_baseline)
  this script regenerates a snapshot that ships those rows out of the box,
  so fresh installs render /admin/permissions matrix without the seed_rbac
  band-aid kicking in.

.PARAMETER Days
  Number of days the simulator should replay. Default 90.

.PARAMETER Seed
  RNG seed for the simulator. Default 42 (the production-baseline seed).

.PARAMETER SkipDbReset
  Run only the simulator + dump; assume the DB is already at a clean
  alembic head. Useful when iterating on simulator code without paying
  the migration cost each time.

.EXAMPLE
  pwsh ./scripts/regen_snapshot.ps1
  pwsh ./scripts/regen_snapshot.ps1 -Days 30 -Seed 7
#>

[CmdletBinding()]
param(
    [int]$Days = 90,
    [int]$Seed = 42,
    [switch]$SkipDbReset
)

$ErrorActionPreference = 'Stop'

# --- Locate paths ---------------------------------------------------------
$BackendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$FixturePath = Join-Path $BackendRoot 'fixtures/simulated_quarter.sql.gz'
$TempSqlPath = Join-Path $BackendRoot 'fixtures/_snapshot.tmp.sql'

# --- Sanity-check prerequisites -------------------------------------------
function Assert-Command([string]$name, [string]$hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Error "Required command '$name' not on PATH. $hint"
        exit 1
    }
}
Assert-Command 'pg_dump' 'Install PostgreSQL client (matching server major version) and add it to PATH.'
Assert-Command 'psql'    'Install PostgreSQL client.'
Assert-Command 'python'  'Install Python 3.12+ and activate the backend venv.'
Assert-Command 'alembic' 'Activate the backend venv where `alembic` is installed.'

# --- Read DB connection from settings -------------------------------------
Push-Location $BackendRoot
try {
    $connJson = python -c "import json; from app.infrastructure.config import settings; print(json.dumps({'host': settings.DB_HOST, 'port': settings.DB_PORT, 'user': settings.DB_USER, 'password': settings.DB_PASSWORD, 'name': settings.DB_NAME}))"
} finally {
    Pop-Location
}
$conn = $connJson | ConvertFrom-Json
$env:PGPASSWORD = $conn.password

function Invoke-Psql([string]$db, [string]$sql) {
    & psql --host=$conn.host --port=$conn.port --username=$conn.user --dbname=$db --no-password -v ON_ERROR_STOP=1 -c $sql | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "psql failed: $sql" }
}

# --- Step 1: drop + recreate the DB ---------------------------------------
if (-not $SkipDbReset) {
    Write-Host "==> Dropping + recreating database '$($conn.name)' on $($conn.host):$($conn.port)..." -ForegroundColor Cyan
    Invoke-Psql 'postgres' "DROP DATABASE IF EXISTS `"$($conn.name)`" WITH (FORCE);"
    Invoke-Psql 'postgres' "CREATE DATABASE `"$($conn.name)`" OWNER `"$($conn.user)`";"

    Write-Host '==> Running alembic upgrade head...' -ForegroundColor Cyan
    Push-Location $BackendRoot
    try {
        & alembic upgrade head
        if ($LASTEXITCODE -ne 0) { throw 'alembic upgrade head failed' }
    } finally {
        Pop-Location
    }
}

# --- Step 2: run the simulator --------------------------------------------
Write-Host "==> Running simulator for $Days days (seed=$Seed)..." -ForegroundColor Cyan
Push-Location $BackendRoot
try {
    & python -m app.dev.simulator.run --days $Days --seed $Seed
    if ($LASTEXITCODE -ne 0) { throw 'simulator failed' }
} finally {
    Pop-Location
}

# --- Step 3: pg_dump the data + gzip --------------------------------------
# --inserts          : portable INSERT statements (vs COPY) so snapshot_loader's
#                       line-based asyncpg replay works.
# --data-only        : skip CREATE TABLE etc. — the loader assumes alembic
#                       already applied the schema.
# --exclude-table    : skip alembic_version (immutable migration ledger) and
#                       system_config (admin-tunable; never overwrite on restore).
Write-Host '==> Dumping snapshot...' -ForegroundColor Cyan
& pg_dump `
    --host=$conn.host --port=$conn.port --username=$conn.user `
    --no-password `
    --dbname=$conn.name `
    --inserts `
    --data-only `
    --exclude-table=alembic_version `
    --exclude-table=system_config `
    --file=$TempSqlPath
if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed' }

Write-Host "==> Compressing -> $FixturePath ..." -ForegroundColor Cyan
# Stream-gzip so the .sql.gz only contains the dump, no .sql shadow left over.
$inStream = [System.IO.File]::OpenRead($TempSqlPath)
$outStream = [System.IO.File]::Create($FixturePath)
$gz = New-Object System.IO.Compression.GzipStream($outStream, [System.IO.Compression.CompressionLevel]::Optimal)
try {
    $inStream.CopyTo($gz)
} finally {
    $gz.Dispose()
    $outStream.Dispose()
    $inStream.Dispose()
}
Remove-Item $TempSqlPath -Force

$sizeKb = [int]((Get-Item $FixturePath).Length / 1024)
Write-Host "==> Done. Snapshot is $sizeKb KB at $FixturePath" -ForegroundColor Green
Write-Host '   Verify with: gunzip -c fixtures/simulated_quarter.sql.gz | grep -c "INSERT INTO public.role_permissions"'
