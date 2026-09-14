[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [int]$Port = 3000,
    [string]$TaskPrefix = 'EndpointManagement',
    [string]$WebScript = 'start',
    [string]$WorkerScript = 'worker',
    [switch]$SkipDependencyInstall,
    [switch]$SkipBuild,
    [switch]$SkipMigration,
    [switch]$RegisterScheduledTasks,
    [switch]$ReplaceExistingTasks,
    [switch]$StartAfterInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Operations.Common.ps1')

if ($Port -lt 1 -or $Port -gt 65535) {
    throw 'Port must be between 1 and 65535.'
}
if ($TaskPrefix -notmatch '^[A-Za-z0-9_-]{3,48}$') {
    throw 'TaskPrefix must contain 3-48 letters, numbers, underscores, or hyphens.'
}
if ($StartAfterInstall -and (-not $RegisterScheduledTasks)) {
    throw 'StartAfterInstall requires RegisterScheduledTasks.'
}

$root = Resolve-EndpointManagerProjectRoot -Path $ProjectRoot
$lockfile = Join-Path $root 'pnpm-lock.yaml'
if (-not (Test-Path -LiteralPath $lockfile -PathType Leaf)) {
    throw "A committed pnpm-lock.yaml is required before installation: $lockfile"
}

$node = Get-Command 'node.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $node) {
    $node = Get-Command 'node' -ErrorAction SilentlyContinue | Select-Object -First 1
}
if ($null -eq $node) {
    throw 'Node.js is unavailable. Install the supported Node.js LTS release first.'
}

$nodeVersionText = (& $node.Source --version).TrimStart('v')
$nodeVersion = [version]$nodeVersionText
if ($nodeVersion.Major -lt 24) {
    throw "Node.js 24 or newer is required; found $nodeVersionText."
}

Assert-EndpointManagerPackageScript -ProjectRoot $root -Name $WebScript
Assert-EndpointManagerPackageScript -ProjectRoot $root -Name $WorkerScript
if (-not $SkipBuild) {
    Assert-EndpointManagerPackageScript -ProjectRoot $root -Name 'build'
}
if (-not $SkipMigration) {
    Assert-EndpointManagerPackageScript -ProjectRoot $root -Name 'db:migrate'
}

$managedDirectories = @(
    (Resolve-EndpointManagerChildPath -Root $root -Path 'data'),
    (Resolve-EndpointManagerChildPath -Root $root -Path 'data\packages'),
    (Resolve-EndpointManagerChildPath -Root $root -Path 'data\backups'),
    (Resolve-EndpointManagerChildPath -Root $root -Path 'logs')
)
foreach ($directory in $managedDirectories) {
    if ($PSCmdlet.ShouldProcess($directory, 'Create managed runtime directory')) {
        $null = New-Item -ItemType Directory -Path $directory -Force
    }
}

if (-not $SkipDependencyInstall) {
    if ($PSCmdlet.ShouldProcess($root, 'Install locked dependencies with pnpm')) {
        Invoke-EndpointManagerPnpm -ProjectRoot $root -PnpmArguments @('install', '--frozen-lockfile')
    }
}

if (-not $SkipBuild) {
    if ($PSCmdlet.ShouldProcess($root, 'Create the production Next.js and worker build')) {
        Invoke-EndpointManagerPnpm -ProjectRoot $root -PnpmArguments @('run', 'build')
    }
}

if (-not $SkipMigration) {
    if ($PSCmdlet.ShouldProcess($root, 'Apply forward-only database migrations')) {
        Invoke-EndpointManagerPnpm -ProjectRoot $root -PnpmArguments @('run', 'db:migrate')
    }
}

if ($RegisterScheduledTasks) {
    $registerCommand = Get-Command 'Register-ScheduledTask' -ErrorAction SilentlyContinue
    if ($null -eq $registerCommand) {
        throw 'Windows ScheduledTasks cmdlets are required to register persistent processes.'
    }

    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principalContext = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principalContext.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Run this script from an elevated Windows PowerShell session to register scheduled tasks.'
    }

    $startScript = Resolve-EndpointManagerChildPath -Root $root -Path 'scripts\Start-Server.ps1'
    if (-not (Test-Path -LiteralPath $startScript -PathType Leaf)) {
        throw "Start script not found: $startScript"
    }

    $powerShellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    if (-not (Test-Path -LiteralPath $powerShellPath -PathType Leaf)) {
        throw "Windows PowerShell executable not found: $powerShellPath"
    }

    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet `
        -RestartCount 10 `
        -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero) `
        -MultipleInstances IgnoreNew `
        -StartWhenAvailable
    $taskPrincipal = New-ScheduledTaskPrincipal `
        -UserId 'NT AUTHORITY\SYSTEM' `
        -LogonType ServiceAccount `
        -RunLevel Highest

    $taskDefinitions = @(
        [pscustomobject]@{
            Name      = "$TaskPrefix-Web"
            Component = 'Web'
            Script    = $WebScript
        },
        [pscustomobject]@{
            Name      = "$TaskPrefix-Worker"
            Component = 'Worker'
            Script    = $WorkerScript
        }
    )

    foreach ($definition in $taskDefinitions) {
        $existing = Get-ScheduledTask -TaskName $definition.Name -ErrorAction SilentlyContinue
        if (($null -ne $existing) -and (-not $ReplaceExistingTasks)) {
            throw "Scheduled task '$($definition.Name)' already exists. Use -ReplaceExistingTasks to replace it explicitly."
        }

        $arguments = if ($definition.Component -eq 'Web') {
            '-NoLogo -NoProfile -NonInteractive -File "{0}" -ProjectRoot "{1}" -Component Web -Port {2} -WebScript "{3}"' -f `
                $startScript, $root, $Port, $WebScript
        }
        else {
            '-NoLogo -NoProfile -NonInteractive -File "{0}" -ProjectRoot "{1}" -Component Worker -WorkerScript "{2}"' -f `
                $startScript, $root, $WorkerScript
        }

        $action = New-ScheduledTaskAction `
            -Execute $powerShellPath `
            -Argument $arguments `
            -WorkingDirectory $root

        if ($PSCmdlet.ShouldProcess($definition.Name, 'Register SYSTEM startup task')) {
            Register-ScheduledTask `
                -TaskName $definition.Name `
                -Action $action `
                -Trigger $trigger `
                -Settings $settings `
                -Principal $taskPrincipal `
                -Description "Endpoint Management $($definition.Component) production process" `
                -Force | Out-Null
        }
    }

    if ($StartAfterInstall) {
        foreach ($definition in $taskDefinitions) {
            if ($PSCmdlet.ShouldProcess($definition.Name, 'Start scheduled task')) {
                Start-ScheduledTask -TaskName $definition.Name
            }
        }
    }
}

Write-Output "Server installation checks completed for $root"
Write-Warning 'Scheduled tasks run as LocalSystem. Configure production secrets as protected machine-level environment variables or through the application secret provider before starting them.'

