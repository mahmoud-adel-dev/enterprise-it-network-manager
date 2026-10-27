<#
.SYNOPSIS
    Builds a standalone, 100% offline desktop installer (NetworkManager-Setup.exe) using Inno Setup.
    Includes embedded Node.js runtime, production build, pre-seeded SQLite database, and desktop launcher.
#>

[CmdletBinding()]
param(
    [string]$OutputDir = "",
    [switch]$RepackModules
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not $OutputDir) {
    $OutputDir = Join-Path (Split-Path -Parent $PSScriptRoot) "dist"
}

$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
$BinDir = Join-Path $OutputDir "bin"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Enterprise Network Manager - Standalone Desktop Builder   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Locate Node.js executable to embed
Write-Host "`n[1/5] Locating portable Node.js runtime..." -ForegroundColor Yellow
$nodeSource = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $nodeSource)) {
    $nodeCmd = Get-Command "node.exe" -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        $nodeSource = $nodeCmd.Source
    } else {
        throw "Could not find node.exe to embed in the installer."
    }
}
Write-Host "  -> Found node.exe: $nodeSource" -ForegroundColor Green

# 2. Locate Inno Setup Compiler (ISCC.exe)
Write-Host "`n[2/5] Locating Inno Setup Compiler (ISCC.exe)..." -ForegroundColor Yellow
$isccCandidates = @(
    "C:\Users\Eng Ramy\AppData\Local\Programs\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
)
$isccPath = $null
foreach ($c in $isccCandidates) {
    if (Test-Path $c) {
        $isccPath = $c
        break
    }
}
if (-not $isccPath) {
    $isccCmd = Get-Command "iscc.exe" -ErrorAction SilentlyContinue
    if ($isccCmd) { $isccPath = $isccCmd.Source }
}
if (-not $isccPath) {
    throw "Inno Setup compiler (ISCC.exe) was not found."
}
Write-Host "  -> Found ISCC.exe: $isccPath" -ForegroundColor Green

# 3. Prepare Launcher and Staged Helpers
Write-Host "`n[3/5] Preparing launcher scripts and runtime..." -ForegroundColor Yellow
if (-not (Test-Path $BinDir)) {
    $null = New-Item -ItemType Directory -Path $BinDir -Force
}
$runtimeDir = Join-Path $BinDir "runtime"
if (-not (Test-Path $runtimeDir)) {
    $null = New-Item -ItemType Directory -Path $runtimeDir -Force
}

# Copy embedded node.exe
Copy-Item -Path $nodeSource -Destination (Join-Path $runtimeDir "node.exe") -Force
Write-Host "  -> Portable node.exe ready: $runtimeDir\node.exe" -ForegroundColor Green

# Copy Visual C++ runtime DLLs to guarantee SQLite and C++ addons work on clean Windows installations
$vcDlls = @("vcruntime140.dll", "vcruntime140_1.dll", "msvcp140.dll")
foreach ($dll in $vcDlls) {
    $sysPath = "C:\Windows\System32\$dll"
    if (Test-Path $sysPath) {
        Copy-Item -Path $sysPath -Destination (Join-Path $runtimeDir $dll) -Force
        Write-Host "  -> Bundled VC++ runtime DLL: $dll" -ForegroundColor Green
    }
}

# Copy icon
$iconSrc = Join-Path $ProjectRoot "src\app\favicon.ico"
$iconDst = Join-Path $BinDir "app.ico"
if (Test-Path $iconSrc) {
    Copy-Item -Path $iconSrc -Destination $iconDst -Force
}

# Snapshot copy of SQLite database with admin user
$dbSrc = Join-Path $ProjectRoot "data\endpoint-manager.sqlite"
$dbDst = Join-Path $BinDir "endpoint-manager.sqlite"
if (Test-Path $dbSrc) {
    Copy-Item -Path $dbSrc -Destination $dbDst -Force
    Write-Host "  -> Snapshot of SQLite database ready with admin credentials." -ForegroundColor Green
}

# Ensure app_modules.tar exists (bundle of node_modules)
$tarFile = Join-Path $BinDir "app_modules.tar"
if ($RepackModules -or (-not (Test-Path $tarFile))) {
    Write-Host "  -> Packing node_modules into app_modules.tar..." -ForegroundColor Yellow
    if (Test-Path $tarFile) { Remove-Item -Path $tarFile -Force }
    & C:\Windows\System32\tar.exe -cf $tarFile --exclude="node_modules/.cache" -C $ProjectRoot node_modules
    Write-Host "  -> app_modules.tar created successfully." -ForegroundColor Green
} else {
    Write-Host "  -> Existing app_modules.tar verified." -ForegroundColor Green
}

# Generate start.bat
$startBatContent = @'
@echo off
setlocal enabledelayedexpansion
title Enterprise Network & Endpoint Manager

cd /d "%~dp0"
set "NODE_ENV=production"
set "PORT=3000"
set "DATABASE_PATH=%~dp0data\endpoint-manager.sqlite"
set "AUTH_SECRET=enterprise-network-manager-auth-secret-key-32chars"

:: Check if server is already running on port 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if !errorlevel! equ 0 (
    goto launch_ui
)

:: Start the server silently in background
start "NetworkManagerServer" /min "%~dp0runtime\node.exe" "%~dp0node_modules\next\dist\bin\next" start -p 3000

:: Wait until port 3000 is listening
set /a attempts=0
:wait_loop
timeout /t 1 /nobreak >nul 2>&1
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if !errorlevel! equ 0 goto launch_ui
set /a attempts+=1
if !attempts! lss 30 goto wait_loop

:launch_ui
:: Launch in Edge App Mode (looks 100% like a standalone native desktop app)
start "" msedge.exe --app=http://localhost:3000 2>nul
if !errorlevel! neq 0 (
    start http://localhost:3000
)
exit /b 0
'@
Set-Content -Path (Join-Path $BinDir "start.bat") -Value $startBatContent -Encoding ASCII

# Generate stop.bat
$stopBatContent = @'
@echo off
setlocal enabledelayedexpansion
title Stop Enterprise Network Manager
echo Stopping Enterprise Network Manager background server...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Server has been stopped successfully.
timeout /t 2 >nul
exit /b 0
'@
Set-Content -Path (Join-Path $BinDir "stop.bat") -Value $stopBatContent -Encoding ASCII

# Generate silent launcher.vbs
$launcherVbsContent = @'
Set WshShell = CreateObject("WScript.Shell")
strDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strDir
WshShell.Run Chr(34) & strDir & "\start.bat" & Chr(34), 0, False
Set WshShell = Nothing
'@
Set-Content -Path (Join-Path $BinDir "launcher.vbs") -Value $launcherVbsContent -Encoding ASCII

# 4. Generate Inno Setup Script
Write-Host "`n[4/5] Generating Inno Setup configuration..." -ForegroundColor Yellow
$issPath = Join-Path $OutputDir "NetworkManager.iss"
$issContent = @"
#define MyAppName "Enterprise Network & Endpoint Manager"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Enterprise IT Network Manager"
#define MyAppExeName "launcher.vbs"

[Setup]
AppId={{C84F39E1-72B2-4E25-8A19-61DEB892F1C4}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\EnterpriseNetworkManager
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=$OutputDir
OutputBaseFilename=NetworkManager-Setup
SetupIconFile=$iconDst
Compression=lzma2/fast
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
UninstallDisplayIcon={app}\app.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Portable Node.js runtime & VC++ dependencies
Source: "$runtimeDir\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs

; Production .next folder (exclude dev cache & lock files from active dev server)
Source: "$ProjectRoot\.next\*"; DestDir: "{app}\.next"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "dev\*, cache\*, *.lock, lock, trace, trace-build, standalone\*"

; Public static assets
Source: "$ProjectRoot\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs

; Database with pre-seeded users and settings - only install if not already exists (preserves user data on upgrade)
Source: "$BinDir\endpoint-manager.sqlite"; DestDir: "{app}\data"; DestName: "endpoint-manager.sqlite"; Flags: onlyifdoesntexist

; Package json & scripts
Source: "$ProjectRoot\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "$BinDir\start.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "$BinDir\stop.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "$BinDir\launcher.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "$BinDir\app.ico"; DestDir: "{app}"; Flags: ignoreversion

; Client Agent binaries for deployment across the network
Source: "$ProjectRoot\agent\publish\*"; DestDir: "{app}\agent"; Flags: ignoreversion recursesubdirs

; Bundled node_modules archive (unpacked automatically during installation)
Source: "$BinDir\app_modules.tar"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Start Menu Shortcuts
Name: "{group}\{#MyAppName}"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\launcher.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app.ico"
Name: "{group}\إيقاف السيرفر (Stop Server)"; Filename: "{app}\stop.bat"; WorkingDir: "{app}"
Name: "{group}\مجلد عميل الأجهزة (Client Agent)"; Filename: "{app}\agent"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"

; Desktop Shortcut
Name: "{autodesktop}\{#MyAppName}"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\launcher.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app.ico"; Tasks: desktopicon

[Run]
; 1. Unpack node_modules using native Windows tar
Filename: "{sys}\tar.exe"; Parameters: "-xf ""{app}\app_modules.tar"" -C ""{app}"""; StatusMsg: "تهيئة مكتبات تشغيل الخادم (Extracting Server Modules)..."; Flags: runhidden

; 2. Delete temporary tar archive to save space
Filename: "{cmd}"; Parameters: "/c del /f /q ""{app}\app_modules.tar"""; Flags: runhidden

; 3. Launch application
Filename: "{sys}\wscript.exe"; Parameters: """{app}\launcher.vbs"""; Description: "تشغيل البرنامج فوراً (Launch Enterprise Network Manager)"; Flags: postinstall shellexec skipifsilent
"@
Set-Content -Path $issPath -Value $issContent -Encoding UTF8

# 5. Compile with Inno Setup
Write-Host "`n[5/5] Compiling standalone setup with Inno Setup..." -ForegroundColor Yellow
Write-Host "  -> Running: $isccPath `"$issPath`"" -ForegroundColor Cyan

& $isccPath $issPath

$setupExe = Join-Path $OutputDir "NetworkManager-Setup.exe"
if (Test-Path $setupExe) {
    $sizeMb = [math]::Round((Get-Item $setupExe).Length / 1MB, 2)
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host " SUCCESS! Standalone Offline Installer Built Successfully!" -ForegroundColor Green
    Write-Host " Output file: $setupExe ($sizeMb MB)" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    throw "Failed to generate $setupExe."
}
