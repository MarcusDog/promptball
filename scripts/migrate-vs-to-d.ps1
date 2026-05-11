$ErrorActionPreference = "Stop"

$logDir = "D:\PromptBallDev\logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$log = Join-Path $logDir "migrate-vs-to-d.log"

function Write-Log($message) {
  $line = "$(Get-Date -Format o) $message"
  Add-Content -LiteralPath $log -Value $line
  Write-Output $line
}

function Assert-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]$identity
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "This script must run as Administrator."
  }
}

function Move-ToDWithJunction($source, $dest, $requiredRelativePath) {
  Write-Log "Preparing migration: $source -> $dest"
  if (-not (Test-Path -LiteralPath $source)) {
    Write-Log "Skipping missing source: $source"
    return
  }

  $sourceItem = Get-Item -LiteralPath $source -Force
  if ($sourceItem.LinkType -eq "Junction") {
    Write-Log "Already junction: $source -> $($sourceItem.Target -join ',')"
    return
  }

  $destParent = Split-Path -Parent $dest
  New-Item -ItemType Directory -Path $destParent -Force | Out-Null
  New-Item -ItemType Directory -Path $dest -Force | Out-Null

  Write-Log "Copying with robocopy..."
  & robocopy $source $dest /MIR /XJ /R:1 /W:1 /COPY:DAT /DCOPY:DAT /NFL /NDL /NP
  $copyExit = $LASTEXITCODE
  if ($copyExit -gt 7) {
    throw "Robocopy failed for $source -> $dest with exit code $copyExit"
  }

  $required = Join-Path $dest $requiredRelativePath
  if (-not (Test-Path -LiteralPath $required)) {
    throw "Copied destination is missing required path: $required"
  }

  Write-Log "Removing original source: $source"
  Remove-Item -LiteralPath $source -Recurse -Force

  Write-Log "Creating junction: $source -> $dest"
  New-Item -ItemType Junction -Path $source -Target $dest | Out-Null
}

Assert-Admin

$processNames = @("vctip", "cl", "link", "MSBuild", "VBCSCompiler", "vs_installer", "setup")
foreach ($name in $processNames) {
  Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

Move-ToDWithJunction `
  "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools" `
  "D:\Microsoft\VisualStudio\2022\BuildTools" `
  "VC\Auxiliary\Build\vcvars64.bat"

Move-ToDWithJunction `
  "C:\Program Files (x86)\Microsoft Visual Studio\Shared" `
  "D:\Microsoft\VisualStudio\Shared" `
  "Common"

Move-ToDWithJunction `
  "C:\Program Files (x86)\Windows Kits" `
  "D:\Microsoft\Windows Kits" `
  "10"

Move-ToDWithJunction `
  "C:\ProgramData\Microsoft\VisualStudio\Packages" `
  "D:\Microsoft\VisualStudio\Packages" `
  "_Instances"

Write-Log "Migration completed."
