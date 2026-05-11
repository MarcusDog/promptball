$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

$vcvars = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
if (-not (Test-Path -LiteralPath $vcvars)) {
  throw "Visual Studio vcvars64.bat not found: $vcvars"
}

$command = 'call "{0}" && npm run tauri dev' -f $vcvars
& cmd.exe /d /s /c $command
