[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$DatabasePath = 'data\endpoint-manager.sqlite',
    [string]$PackageDirectory = 'data\packages',
    [string]$OutputDirectory = 'data\backups',
    [switch]$DatabaseOnly,
    [switch]$Offline,
    [switch]$ConfirmServicesStopped,
    [ValidateRange(0, 3650)]
    [int]$RetentionDays = 0
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Operations.Common.ps1')

$root = Resolve-EndpointManagerProjectRoot -Path $ProjectRoot
$database = Resolve-EndpointManagerChildPath -Root $root -Path $DatabasePath
$packages = Resolve-EndpointManagerChildPath -Root $root -Path $PackageDirectory

$output = if ([System.IO.Path]::IsPathRooted($OutputDirectory)) {
    Assert-EndpointManagerSafeDirectory -Path $OutputDirectory
}
else {
    Resolve-EndpointManagerChildPath -Root $root -Path $OutputDirectory
}

if ($Offline -and (-not $ConfirmServicesStopped)) {
    throw 'Offline backup requires -ConfirmServicesStopped. Stop both web and worker processes before copying SQLite files.'
}
if (-not (Test-Path -LiteralPath $database -PathType Leaf)) {
    throw "Database file not found: $database"
}
if ((-not $DatabaseOnly) -and (-not (Test-Path -LiteralPath $packages -PathType Container))) {
    throw "Package directory not found: $packages. Use -DatabaseOnly only if package payloads are intentionally excluded."
}

$null = New-Item -ItemType Directory -Path $output -Force
$staging = New-EndpointManagerTemporaryDirectory -Purpose 'backup'

try {
    $databaseStage = Join-Path $staging 'database'
    $null = New-Item -ItemType Directory -Path $databaseStage
    $databaseSnapshot = Join-Path $databaseStage 'endpoint-manager.sqlite'

    if ($Offline) {
        if ($PSCmdlet.ShouldProcess($database, 'Copy stopped SQLite database and sidecars')) {
            Copy-Item -LiteralPath $database -Destination $databaseSnapshot -ErrorAction Stop
        }
    }
    else {
        Assert-EndpointManagerPackageScript -ProjectRoot $root -Name 'db:backup'
        if ($PSCmdlet.ShouldProcess($database, 'Create a consistent online SQLite backup')) {
            Invoke-EndpointManagerPnpm `
                -ProjectRoot $root `
                -PnpmArguments @('run', 'db:backup', '--', '--output', $databaseSnapshot)
        }
    }

    if (-not (Test-Path -LiteralPath $databaseSnapshot -PathType Leaf)) {
        throw "The database backup command did not create the expected file: $databaseSnapshot"
    }

    $databaseFiles = @(
        [ordered]@{
            archivePath = 'database/endpoint-manager.sqlite'
            targetSuffix = ''
            sha256 = Get-EndpointManagerSha256 -Path $databaseSnapshot
            length = (Get-Item -LiteralPath $databaseSnapshot).Length
        }
    )

    if ($Offline) {
        foreach ($suffix in @('-wal', '-shm')) {
            $sourceSidecar = "$database$suffix"
            if (Test-Path -LiteralPath $sourceSidecar -PathType Leaf) {
                $destinationSidecar = "$databaseSnapshot$suffix"
                Copy-Item -LiteralPath $sourceSidecar -Destination $destinationSidecar -ErrorAction Stop
                $databaseFiles += [ordered]@{
                    archivePath = "database/endpoint-manager.sqlite$suffix"
                    targetSuffix = $suffix
                    sha256 = Get-EndpointManagerSha256 -Path $destinationSidecar
                    length = (Get-Item -LiteralPath $destinationSidecar).Length
                }
            }
        }
    }

    $packagesIncluded = -not $DatabaseOnly
    if ($packagesIncluded) {
        $packageStage = Join-Path $staging 'packages'
        if ($PSCmdlet.ShouldProcess($packages, 'Copy managed package payloads into backup')) {
            Copy-Item -LiteralPath $packages -Destination $packageStage -Recurse -ErrorAction Stop
        }
    }

    $manifest = [ordered]@{
        formatVersion = 1
        application = 'enterprise-endpoint-network-manager'
        createdUtc = [DateTimeOffset]::UtcNow.ToString('o')
        sourceHost = $env:COMPUTERNAME
        database = [ordered]@{
            files = $databaseFiles
        }
        packages = [ordered]@{
            included = $packagesIncluded
            archivePath = if ($packagesIncluded) { 'packages' } else { $null }
        }
        secretsIncluded = $false
    }
    $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $staging 'manifest.json') -Encoding UTF8

    $timestamp = [DateTimeOffset]::UtcNow.ToString('yyyyMMdd-HHmmss')
    $archive = Join-Path $output ("endpoint-manager-backup-{0}-{1}.zip" -f $timestamp, [guid]::NewGuid().ToString('N').Substring(0, 8))
    if ($PSCmdlet.ShouldProcess($archive, 'Create backup archive')) {
        Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $archive -CompressionLevel Optimal -ErrorAction Stop
    }

    if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) {
        throw "Backup archive was not created: $archive"
    }

    if ($RetentionDays -gt 0) {
        $cutoff = [DateTimeOffset]::UtcNow.AddDays(-$RetentionDays)
        $expired = Get-ChildItem -LiteralPath $output -File -Filter 'endpoint-manager-backup-*.zip' |
            Where-Object { $_.LastWriteTimeUtc -lt $cutoff.UtcDateTime -and $_.FullName -ne $archive }

        foreach ($item in $expired) {
            if ($PSCmdlet.ShouldProcess($item.FullName, "Remove generated backup older than $RetentionDays days")) {
                Remove-Item -LiteralPath $item.FullName -Force
            }
        }
    }

    Write-Output $archive
}
finally {
    Remove-EndpointManagerTemporaryDirectory -Path $staging
}

