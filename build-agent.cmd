@echo off
set "NUGET_PACKAGES=D:\nuget\packages"
set "DOTNET_CLI_HOME=D:\dotnet_home"
set "TEMP=D:\temp"
set "TMP=D:\temp"
if not exist "D:\nuget\packages" mkdir "D:\nuget\packages"
if not exist "D:\dotnet_home" mkdir "D:\dotnet_home"
if not exist "D:\temp" mkdir "D:\temp"
D:\dotnet\dotnet.exe %*
