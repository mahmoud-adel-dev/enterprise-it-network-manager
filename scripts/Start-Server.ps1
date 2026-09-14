[CmdletBinding()]
param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [ValidateSet('Web', 'Worker', 'All')]
    [string]$Component = 'All',
    [int]$Port = 3000,
    [string]$WebScript = 'start',
    [string]$WorkerScript = 'worker',
    [string]$LogDirectory = 'logs'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Operations.Common.ps1')

if ($Port -lt 1 -or $Port -gt 65535) {
    throw 'Port must be between 1 and 65535.'
}

$root = Resolve-EndpointManagerProjectRoot -Path $ProjectRoot
$logs = Resolve-EndpointManagerChildPath -Root $root -Path $LogDirectory
$null = New-Item -ItemType Directory -Path $logs -Force

if ($Component -in @('Web', 'All')) {
    Assert-EndpointManagerPackageScript -ProjectRoot $root -Name $WebScript
}
if ($Component -in @('Worker', 'All')) {
    Assert-EndpointManagerPackageScript -ProjectRoot $root -Name $WorkerScript
}

$launcher = Get-EndpointManagerPnpmLauncher
$env:NODE_ENV = 'production'
$env:PORT = $Port.ToString([System.Globalization.CultureInfo]::InvariantCulture)

function Start-EndpointManagerComponent {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [string]$ScriptName
    )

    $timestamp = [DateTimeOffset]::UtcNow.ToString('yyyyMMdd-HHmmss')
    $standardOutput = Join-Path $logs ("{0}-{1}.out.log" -f $Name.ToLowerInvariant(), $timestamp)
    $standardError = Join-Path $logs ("{0}-{1}.error.log" -f $Name.ToLowerInvariant(), $timestamp)
    $arguments = @($launcher.Prefix) + @('run', $ScriptName)

    Write-Output "Starting $Name; stdout=$standardOutput; stderr=$standardError"
    return Start-Process `
        -FilePath $launcher.FilePath `
        -ArgumentList $arguments `
        -WorkingDirectory $root `
        -RedirectStandardOutput $standardOutput `
        -RedirectStandardError $standardError `
        -NoNewWindow `
        -PassThru
}

if ($Component -eq 'Web') {
    $process = Start-EndpointManagerComponent -Name 'Web' -ScriptName $WebScript
    $process.WaitForExit()
    exit $process.ExitCode
}

if ($Component -eq 'Worker') {
    $process = Start-EndpointManagerComponent -Name 'Worker' -ScriptName $WorkerScript
    $process.WaitForExit()
    exit $process.ExitCode
}

$webProcess = $null
$workerProcess = $null
try {
    $webProcess = Start-EndpointManagerComponent -Name 'Web' -ScriptName $WebScript
    $workerProcess = Start-EndpointManagerComponent -Name 'Worker' -ScriptName $WorkerScript

    while ($true) {
        Start-Sleep -Seconds 2
        $webProcess.Refresh()
        $workerProcess.Refresh()

        if ($webProcess.HasExited) {
            throw "Web process exited with code $($webProcess.ExitCode)."
        }
        if ($workerProcess.HasExited) {
            throw "Worker process exited with code $($workerProcess.ExitCode)."
        }
    }
}
finally {
    foreach ($process in @($webProcess, $workerProcess)) {
        if (($null -ne $process) -and (-not $process.HasExited)) {
            Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
        }
    }
}

