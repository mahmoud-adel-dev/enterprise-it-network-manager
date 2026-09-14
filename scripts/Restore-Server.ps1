[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupArchive,
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$DatabasePath = 'data\endpoint-manager.sqlite',
    [string]$PackageDirectory = 'data\packages',
    [switch]$RestorePackages,
    [switch]$ConfirmServicesStopped
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Operations.Common.ps1')

if (-not $ConfirmServicesStopped) {
    throw 'Restore requires -ConfirmServicesStopped. Stop both web and worker processes before replacing SQLite or package files.'
}

$root = Resolve-EndpointManagerProjectRoot -Path $ProjectRoot
$database = Resolve-EndpointManagerChildPath -Root $root -Path $DatabasePath
$packages = Resolve-EndpointManagerChildPath -Root $root -Path $PackageDirectory
$archive = [System.IO.Path]::GetFullPath($BackupArchive)
if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) {
    throw "Backup archive not found: $archive"
}
if ([System.IO.Path]::GetExtension($archive) -ne '.zip') {
    throw 'BackupArchive must be a .zip file produced by Backup-Server.ps1.'
}

$staging = New-EndpointManagerTemporaryDirectory -Purpose 'restore'
$rollback = Resolve-EndpointManagerChildPath `
    -Root $root `
    -Path ("data\backups\pre-restore-{0}-{1}" -f [DateTimeOffset]::UtcNow.ToString('yyyyMMdd-HHmmss'), [guid]::NewGuid().ToString('N').Substring(0, 8))

try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($archive)
    try {
        $stagingPrefix = $staging.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
        foreach ($entry in $zip.Entries) {
            $destination = [System.IO.Path]::GetFullPath((Join-Path $staging $entry.FullName))
            if (-not $destination.StartsWith($stagingPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                throw "Backup contains an unsafe path: $($entry.FullName)"
            }
        }
    }
    finally {
        $zip.Dispose()
    }

    [System.IO.Compression.ZipFile]::ExtractToDirectory($archive, $staging)
    $manifestPath = Join-Path $staging 'manifest.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        throw 'Backup manifest.json is missing.'
    }

    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    if ($manifest.formatVersion -ne 1 -or $manifest.application -ne 'enterprise-endpoint-network-manager') {
        throw 'Unsupported or unrelated backup archive.'
    }
    if ($manifest.secretsIncluded -eq $true) {
        throw 'Refusing a backup that claims to contain secrets.'
    }

    $databaseFiles = @($manifest.database.files)
    if ($databaseFiles.Count -lt 1) {
        throw 'Backup manifest contains no database files.'
    }

    $validatedFiles = @()
    foreach ($file in $databaseFiles) {
        if ($file.targetSuffix -notin @('', '-wal', '-shm')) {
            throw "Unsupported SQLite target suffix in backup: $($file.targetSuffix)"
        }
        $source = Resolve-EndpointManagerChildPath -Root $staging -Path ([string]$file.archivePath)
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
            throw "Backup database file is missing: $($file.archivePath)"
        }
        $actualHash = Get-EndpointManagerSha256 -Path $source
        if ($actualHash -ne ([string]$file.sha256).ToLowerInvariant()) {
            throw "SHA-256 mismatch for backup member: $($file.archivePath)"
        }
        if ((Get-Item -LiteralPath $source).Length -ne [long]$file.length) {
            throw "Length mismatch for backup member: $($file.archivePath)"
        }

        $validatedFiles += [pscustomobject]@{
            Source = $source
            Target = "$database$($file.targetSuffix)"
        }
    }

    if ($RestorePackages -and (-not [bool]$manifest.packages.included)) {
        throw 'This backup does not contain package payloads.'
    }

    $packageSource = $null
    if ($RestorePackages) {
        $packageSource = Resolve-EndpointManagerChildPath -Root $staging -Path ([string]$manifest.packages.archivePath)
        if (-not (Test-Path -LiteralPath $packageSource -PathType Container)) {
            throw 'Package payload directory is missing from the backup.'
        }
    }

    $targetDescription = if ($RestorePackages) { 'SQLite database and managed packages' } else { 'SQLite database' }
    if (-not $PSCmdlet.ShouldProcess($root, "Restore $targetDescription from $archive")) {
        return
    }

    $null = New-Item -ItemType Directory -Path (Split-Path -Parent $database) -Force
    $null = New-Item -ItemType Directory -Path $rollback -Force

    $restoreToken = [guid]::NewGuid().ToString('N')
    $preparedFiles = @()
    foreach ($item in $validatedFiles) {
        $prepared = "$($item.Target).restore-$restoreToken.tmp"
        Copy-Item -LiteralPath $item.Source -Destination $prepared -ErrorAction Stop
        if ((Get-EndpointManagerSha256 -Path $prepared) -ne (Get-EndpointManagerSha256 -Path $item.Source)) {
            throw "Failed to verify prepared restore file: $prepared"
        }
        $preparedFiles += [pscustomobject]@{ Prepared = $prepared; Target = $item.Target }
    }

    $preparedPackages = $null
    if ($RestorePackages) {
        $preparedPackages = "$packages.restore-$restoreToken"
        Copy-Item -LiteralPath $packageSource -Destination $preparedPackages -Recurse -ErrorAction Stop
    }

    $movedOriginals = @()
    try {
        foreach ($suffix in @('', '-wal', '-shm')) {
            $target = "$database$suffix"
            if (Test-Path -LiteralPath $target) {
                $rollbackTarget = Join-Path $rollback ("endpoint-manager.sqlite$suffix")
                Move-Item -LiteralPath $target -Destination $rollbackTarget -ErrorAction Stop
                $movedOriginals += [pscustomobject]@{ Original = $target; Rollback = $rollbackTarget }
            }
        }

        foreach ($item in $preparedFiles) {
            Move-Item -LiteralPath $item.Prepared -Destination $item.Target -ErrorAction Stop
        }

        if ($RestorePackages) {
            if (Test-Path -LiteralPath $packages) {
                $rollbackPackages = Join-Path $rollback 'packages'
                Move-Item -LiteralPath $packages -Destination $rollbackPackages -ErrorAction Stop
                $movedOriginals += [pscustomobject]@{ Original = $packages; Rollback = $rollbackPackages }
            }
            Move-Item -LiteralPath $preparedPackages -Destination $packages -ErrorAction Stop
        }
    }
    catch {
        foreach ($item in $movedOriginals) {
            if ((-not (Test-Path -LiteralPath $item.Original)) -and (Test-Path -LiteralPath $item.Rollback)) {
                Move-Item -LiteralPath $item.Rollback -Destination $item.Original -ErrorAction SilentlyContinue
            }
        }
        throw
    }

    Write-Output "Restore completed. Pre-restore files are retained at: $rollback"
    Write-Warning 'Run Test-ServerHealth.ps1 after starting the web and worker processes. Remove the rollback directory only after verification.'
}
finally {
    Remove-EndpointManagerTemporaryDirectory -Path $staging
}

