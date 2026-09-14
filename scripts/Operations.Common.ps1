Set-StrictMode -Version Latest

function Resolve-EndpointManagerProjectRoot {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if ([string]::IsNullOrWhiteSpace($Path)) {
        throw 'ProjectRoot cannot be empty.'
    }

    $fullPath = [System.IO.Path]::GetFullPath($Path).TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )
    $volumeRoot = [System.IO.Path]::GetPathRoot($fullPath).TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )

    if ([string]::Equals($fullPath, $volumeRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to use a filesystem root as ProjectRoot: $fullPath"
    }

    $manifestPath = Join-Path $fullPath 'package.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        throw "The selected ProjectRoot does not contain package.json: $fullPath"
    }

    return $fullPath
}

function Resolve-EndpointManagerChildPath {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Root,

        [Parameter(Mandatory = $true)]
        [string]$Path,

        [switch]$AllowRoot
    )

    $resolvedRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )
    $candidate = if ([System.IO.Path]::IsPathRooted($Path)) {
        [System.IO.Path]::GetFullPath($Path)
    }
    else {
        [System.IO.Path]::GetFullPath((Join-Path $resolvedRoot $Path))
    }

    $isRoot = [string]::Equals(
        $candidate.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar),
        $resolvedRoot,
        [System.StringComparison]::OrdinalIgnoreCase
    )
    $rootPrefix = $resolvedRoot + [System.IO.Path]::DirectorySeparatorChar
    $isChild = $candidate.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)

    if ((-not $isChild) -and ((-not $AllowRoot) -or (-not $isRoot))) {
        throw "Path must remain inside the managed project root. Root: $resolvedRoot; Path: $candidate"
    }

    if ($isRoot -and (-not $AllowRoot)) {
        throw "Refusing an operation against the project root itself: $candidate"
    }

    return $candidate
}

function Assert-EndpointManagerSafeDirectory {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $fullPath = [System.IO.Path]::GetFullPath($Path).TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )
    $volumeRoot = [System.IO.Path]::GetPathRoot($fullPath).TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )

    if ([string]::Equals($fullPath, $volumeRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to use a filesystem root: $fullPath"
    }

    return $fullPath
}

function Get-EndpointManagerPackageScripts {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectRoot
    )

    $manifestPath = Join-Path $ProjectRoot 'package.json'
    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    if ($null -eq $manifest.scripts) {
        return @()
    }

    return @($manifest.scripts.PSObject.Properties.Name)
}

function Assert-EndpointManagerPackageScript {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectRoot,

        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $scripts = @(Get-EndpointManagerPackageScripts -ProjectRoot $ProjectRoot)
    if ($Name -notin $scripts) {
        throw "package.json does not define the required '$Name' script."
    }
}

function Get-EndpointManagerPnpmLauncher {
    [CmdletBinding()]
    param()

    $corepack = Get-Command 'corepack.cmd' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $corepack) {
        $corepack = Get-Command 'corepack' -ErrorAction SilentlyContinue | Select-Object -First 1
    }

    if ($null -ne $corepack) {
        return [pscustomobject]@{
            FilePath = $corepack.Source
            Prefix   = @('pnpm')
        }
    }

    $pnpm = Get-Command 'pnpm.cmd' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $pnpm) {
        $pnpm = Get-Command 'pnpm' -ErrorAction SilentlyContinue | Select-Object -First 1
    }

    if ($null -eq $pnpm) {
        throw 'pnpm is unavailable. Install a supported Node.js release with Corepack, then enable pnpm.'
    }

    return [pscustomobject]@{
        FilePath = $pnpm.Source
        Prefix   = @()
    }
}

function Invoke-EndpointManagerPnpm {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectRoot,

        [Parameter(Mandatory = $true)]
        [string[]]$PnpmArguments
    )

    $launcher = Get-EndpointManagerPnpmLauncher
    $arguments = @($launcher.Prefix) + @($PnpmArguments)

    Push-Location $ProjectRoot
    try {
        & $launcher.FilePath @arguments
        if ($LASTEXITCODE -ne 0) {
            throw "pnpm failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

function Get-EndpointManagerSha256 {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function New-EndpointManagerTemporaryDirectory {
    [CmdletBinding()]
    param(
        [string]$Purpose = 'operation'
    )

    $safePurpose = $Purpose -replace '[^a-zA-Z0-9-]', '-'
    $path = Join-Path ([System.IO.Path]::GetTempPath()) (
        'endpoint-manager-{0}-{1}' -f $safePurpose, [guid]::NewGuid().ToString('N')
    )
    $null = New-Item -ItemType Directory -Path $path -ErrorAction Stop
    return [System.IO.Path]::GetFullPath($path)
}

function Remove-EndpointManagerTemporaryDirectory {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $fullPath = [System.IO.Path]::GetFullPath($Path)
    $temporaryRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    $leaf = Split-Path -Leaf $fullPath

    if ((-not $fullPath.StartsWith($temporaryRoot, [System.StringComparison]::OrdinalIgnoreCase)) -or
        (-not $leaf.StartsWith('endpoint-manager-', [System.StringComparison]::OrdinalIgnoreCase))) {
        throw "Refusing to remove an unrecognized temporary directory: $fullPath"
    }

    if (Test-Path -LiteralPath $fullPath) {
        Remove-Item -LiteralPath $fullPath -Recurse -Force
    }
}

