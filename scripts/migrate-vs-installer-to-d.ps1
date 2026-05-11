$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
  throw "This script must run as Administrator."
}

$source = "C:\Program Files (x86)\Microsoft Visual Studio\Installer"
$target = "D:\Microsoft\VisualStudio\Installer"
$required = "vs_installer.exe"
$logPath = "D:\PromptBallDev\logs\migrate-vs-installer-to-d.log"

New-Item -ItemType Directory -Path (Split-Path -Parent $logPath) -Force | Out-Null
function Write-Log([string]$message) {
  $line = "$(Get-Date -Format o) $message"
  Add-Content -LiteralPath $logPath -Value $line
}

if (-not (Test-Path -LiteralPath $source)) {
  Write-Log "Source missing, nothing to migrate: $source"
  exit 0
}

$sourceItem = Get-Item -LiteralPath $source -Force
if ($sourceItem.LinkType -eq "Junction") {
  Write-Log "Source already junction: $source -> $($sourceItem.Target -join ';')"
  exit 0
}

New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
Write-Log "Copying: $source -> $target"
robocopy $source $target /MIR /XJ /R:1 /W:1 /COPY:DAT /DCOPY:DAT /NFL /NDL /NP | Out-Null
$copyCode = $LASTEXITCODE
if ($copyCode -ge 8) {
  throw "Robocopy failed with exit code $copyCode"
}

$requiredPath = Join-Path $target $required
if (-not (Test-Path -LiteralPath $requiredPath)) {
  throw "Required file missing after copy: $requiredPath"
}

Write-Log "Removing original source: $source"
Remove-Item -LiteralPath $source -Recurse -Force
Write-Log "Creating junction: $source -> $target"
New-Item -ItemType Junction -Path $source -Target $target | Out-Null
Write-Log "Migration completed."
