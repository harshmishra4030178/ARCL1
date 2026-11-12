param(
  [Parameter(Mandatory=$false)]
  [ValidateSet("list", "scan")]
  [string]$Action = "list",

  [Parameter(Mandatory=$false)]
  [string]$OutPath = "",

  [Parameter(Mandatory=$false)]
  [string]$DeviceId = "",

  [Parameter(Mandatory=$false)]
  [int]$Dpi = 200
)

$ErrorActionPreference = "Stop"
$WIA_FORMAT_PNG = "{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}"
$WIA_FORMAT_JPEG = "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}"

function Get-WiaPropValue($props, $name, $fallback = "") {
  try {
    foreach ($p in $props) {
      if ($p.Name -eq $name) {
        return [string]$p.Value
      }
    }
  } catch {}
  return $fallback
}

function Set-WiaProp($props, $propId, $val) {
  try {
    foreach ($p in $props) {
      if ([int]$p.PropertyID -eq [int]$propId) {
        $p.Value = $val
        return $true
      }
    }
  } catch {}
  return $false
}

try {
  $deviceManager = New-Object -ComObject WIA.DeviceManager
  $scanners = New-Object System.Collections.ArrayList
  foreach ($info in $deviceManager.DeviceInfos) {
    if ([int]$info.Type -eq 1) {
      [void]$scanners.Add(@{
        id = [string]$info.DeviceID
        name = (Get-WiaPropValue $info.Properties "Name" "WIA Scanner")
        manufacturer = (Get-WiaPropValue $info.Properties "Manufacturer" "")
        description = (Get-WiaPropValue $info.Properties "Description" "")
      })
    }
  }

  if ($Action -eq "list") {
    $out = @{
      ok = $true
      scanners = @($scanners.ToArray())
    }
    ConvertTo-Json -InputObject $out -Depth 4 -Compress
    exit 0
  }

  if (-not $OutPath) {
    throw "OutPath is required for scan action."
  }

  $targetInfo = $null
  if ($DeviceId) {
    foreach ($info in $deviceManager.DeviceInfos) {
      if ([string]$info.DeviceID -eq $DeviceId) {
        $targetInfo = $info
        break
      }
    }
  } elseif ($scanners.Count -gt 0) {
    $firstId = $scanners[0].id
    foreach ($info in $deviceManager.DeviceInfos) {
      if ([string]$info.DeviceID -eq $firstId) {
        $targetInfo = $info
        break
      }
    }
  }

  if (-not $targetInfo) {
    $out = @{
      ok = $false
      noScanner = $true
      error = "No physical USB/Wi-Fi WIA scanner detected on this PC. Connect/power on your scanner, or use Live Camera Scan / Upload File."
      scanners = @()
    }
    ConvertTo-Json -InputObject $out -Depth 4 -Compress
    exit 0
  }

  $scannerName = (Get-WiaPropValue $targetInfo.Properties "Name" "WIA Scanner")
  $device = $targetInfo.Connect()
  if ($device.Items.Count -lt 1) {
    throw "Connected scanner returned no scannable items."
  }

  $item = $device.Items.Item(1)
  Set-WiaProp $item.Properties 6146 1 | Out-Null
  Set-WiaProp $item.Properties 6147 $Dpi | Out-Null
  Set-WiaProp $item.Properties 6148 $Dpi | Out-Null

  $imageFile = $null
  try {
    $imageFile = $item.Transfer($WIA_FORMAT_PNG)
  } catch {
    try {
      $imageFile = $item.Transfer($WIA_FORMAT_JPEG)
    } catch {
      $dialog = New-Object -ComObject WIA.CommonDialog
      $imageFile = $dialog.ShowTransfer($item, $WIA_FORMAT_PNG, $false)
    }
  }

  if (-not $imageFile) {
    throw "Scan cancelled or scanner returned no image."
  }

  if (Test-Path -LiteralPath $OutPath) {
    Remove-Item -LiteralPath $OutPath -Force
  }
  $imageFile.SaveFile($OutPath)

  $out = @{
    ok = $true
    scannerName = $scannerName
    outPath = $OutPath
    fileExtension = [string]$imageFile.FileExtension
  }
  ConvertTo-Json -InputObject $out -Depth 4 -Compress
} catch {
  $msg = $_.Exception.Message
  if ($_.Exception.InnerException) {
    $msg = $_.Exception.InnerException.Message
  }
  $out = @{
    ok = $false
    noScanner = ($msg -match "no.*device|not found|0x8021")
    error = $msg
    scanners = @()
  }
  ConvertTo-Json -InputObject $out -Depth 4 -Compress
}
