$ErrorActionPreference = 'Stop'
$env:TEMP = 'D:\temp'
$env:TMP = 'D:\temp'
[System.IO.Directory]::CreateDirectory('D:\temp') | Out-Null
[System.IO.Directory]::CreateDirectory('D:\dotnet') | Out-Null

$zipUrl = "https://builds.dotnet.microsoft.com/dotnet/Sdk/8.0.424/dotnet-sdk-8.0.424-win-x64.zip"
$zipPath = "D:\temp\dotnet-sdk-8.0.424-win-x64.zip"

if (-not (Test-Path $zipPath) -or ((Get-Item $zipPath).Length -lt 280000000)) {
    Write-Host "Downloading .NET 8 SDK zip from $zipUrl to $zipPath..."
    $client = New-Object System.Net.WebClient
    $client.DownloadFile($zipUrl, $zipPath)
    Write-Host "Download complete. Size: $((Get-Item $zipPath).Length) bytes"
} else {
    Write-Host "Zip file already downloaded: $((Get-Item $zipPath).Length) bytes"
}

Write-Host "Extracting to D:\dotnet..."
Expand-Archive -Path $zipPath -DestinationPath "D:\dotnet" -Force
Write-Host "Extraction complete!"

$dotnetExe = "D:\dotnet\dotnet.exe"
if (Test-Path $dotnetExe) {
    Write-Host "Successfully installed .NET 8.0 SDK!"
    & $dotnetExe --info
} else {
    Write-Error "dotnet.exe not found at $dotnetExe"
}
