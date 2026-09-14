[CmdletBinding()]
param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [uri]$HealthUri = 'http://127.0.0.1:3000/api/v1/health',
    [string]$DatabasePath = 'data\endpoint-manager.sqlite',
    [string]$PackageDirectory = 'data\packages',
    [ValidateRange(1, 120)]
    [int]$TimeoutSeconds = 10,
    [ValidateRange(0, 10240)]
    [int]$MinimumFreeSpaceGB = 2,
    [switch]$AsJson
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
. (Join-Path $PSScriptRoot 'Operations.Common.ps1')

$root = Resolve-EndpointManagerProjectRoot -Path $ProjectRoot
$database = Resolve-EndpointManagerChildPath -Root $root -Path $DatabasePath
$packages = Resolve-EndpointManagerChildPath -Root $root -Path $PackageDirectory

if ($HealthUri.Scheme -notin @('http', 'https')) {
    throw 'HealthUri must use HTTP or HTTPS.'
}
if ($HealthUri.Scheme -eq 'http' -and (-not $HealthUri.IsLoopback)) {
    throw 'Plain HTTP health checks are allowed only for loopback addresses. Use HTTPS for remote checks.'
}

$checks = New-Object System.Collections.Generic.List[object]
function Add-HealthCheck {
    param(
        [string]$Name,
        [ValidateSet('PASS', 'WARN', 'FAIL')]
        [string]$Status,
        [string]$Detail
    )
    $checks.Add([pscustomobject]@{ name = $Name; status = $Status; detail = $Detail })
}

try {
    $response = Invoke-WebRequest -Uri $HealthUri -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing
    if ($response.StatusCode -ne 200) {
        Add-HealthCheck -Name 'http' -Status 'FAIL' -Detail "HTTP $($response.StatusCode)"
    }
    else {
        $reportedStatus = $null
        try {
            $body = $response.Content | ConvertFrom-Json
            if ($null -ne $body.status) {
                $reportedStatus = ([string]$body.status).ToLowerInvariant()
            }
        }
        catch {
            Add-HealthCheck -Name 'response-format' -Status 'WARN' -Detail 'Health endpoint returned non-JSON content.'
        }

        if ($reportedStatus -in @('unhealthy', 'failed', 'error', 'down')) {
            Add-HealthCheck -Name 'http' -Status 'FAIL' -Detail "Application reported status '$reportedStatus'."
        }
        else {
            Add-HealthCheck -Name 'http' -Status 'PASS' -Detail "HTTP 200$($(if ($reportedStatus) { "; status=$reportedStatus" } else { '' }))"
        }
    }
}
catch {
    Add-HealthCheck -Name 'http' -Status 'FAIL' -Detail $_.Exception.Message
}

if (Test-Path -LiteralPath $database -PathType Leaf) {
    $databaseInfo = Get-Item -LiteralPath $database
    if ($databaseInfo.Length -gt 0) {
        Add-HealthCheck -Name 'database-file' -Status 'PASS' -Detail "$($databaseInfo.Length) bytes"
    }
    else {
        Add-HealthCheck -Name 'database-file' -Status 'FAIL' -Detail 'SQLite file is empty.'
    }
}
else {
    Add-HealthCheck -Name 'database-file' -Status 'FAIL' -Detail "Not found: $database"
}

if (Test-Path -LiteralPath $packages -PathType Container) {
    Add-HealthCheck -Name 'package-directory' -Status 'PASS' -Detail $packages
}
else {
    Add-HealthCheck -Name 'package-directory' -Status 'FAIL' -Detail "Not found: $packages"
}

try {
    $driveRoot = [System.IO.Path]::GetPathRoot($database)
    $drive = New-Object System.IO.DriveInfo($driveRoot)
    $freeGB = [math]::Round($drive.AvailableFreeSpace / 1GB, 2)
    if ($freeGB -lt $MinimumFreeSpaceGB) {
        Add-HealthCheck -Name 'disk-space' -Status 'FAIL' -Detail "$freeGB GB free; minimum is $MinimumFreeSpaceGB GB."
    }
    else {
        Add-HealthCheck -Name 'disk-space' -Status 'PASS' -Detail "$freeGB GB free"
    }
}
catch {
    Add-HealthCheck -Name 'disk-space' -Status 'WARN' -Detail $_.Exception.Message
}

$overall = if (@($checks | Where-Object { $_.status -eq 'FAIL' }).Count -gt 0) { 'FAIL' }
elseif (@($checks | Where-Object { $_.status -eq 'WARN' }).Count -gt 0) { 'WARN' }
else { 'PASS' }

$result = [ordered]@{
    status = $overall
    checkedUtc = [DateTimeOffset]::UtcNow.ToString('o')
    endpoint = $HealthUri.AbsoluteUri
    checks = $checks
}

if ($AsJson) {
    $result | ConvertTo-Json -Depth 6
}
else {
    $checks | Format-Table -AutoSize
    Write-Output "Overall: $overall"
}

if ($overall -eq 'FAIL') {
    exit 1
}

exit 0

