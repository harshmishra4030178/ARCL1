param(
  [Parameter(Mandatory=$true)]
  [string]$ImagePath
)

$ErrorActionPreference = "Stop"

try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
  [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
  [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null

  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.IsGenericMethod
  })[0]

  function Await-WinRt ($WinRtTask, $ResultType) {
    $netTask = $asTaskGeneric.MakeGenericMethod($ResultType).Invoke($null, @($WinRtTask))
    return $netTask.GetAwaiter().GetResult()
  }

  $resolvedPath = (Resolve-Path -LiteralPath $ImagePath).Path
  $bytes = [System.IO.File]::ReadAllBytes($resolvedPath)
  $memStream = New-Object System.IO.MemoryStream(,$bytes)
  $winrtStream = [System.IO.WindowsRuntimeStreamExtensions]::AsRandomAccessStream($memStream)

  try {
    $decoder = Await-WinRt ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($winrtStream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $rawBitmap = Await-WinRt ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $bitmap = $rawBitmap
    if ($rawBitmap.BitmapPixelFormat -ne [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8 -or $rawBitmap.BitmapAlphaMode -eq [Windows.Graphics.Imaging.BitmapAlphaMode]::Straight) {
      $bitmap = [Windows.Graphics.Imaging.SoftwareBitmap]::Convert(
        $rawBitmap,
        [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,
        [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied
      )
    }

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if (-not $engine) {
      $lang = New-Object Windows.Globalization.Language("en-US")
      $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
    }
    if (-not $engine) {
      throw "No Windows OCR language pack available."
    }

    $ocrResult = Await-WinRt ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

    $linesOut = @()
    foreach ($line in $ocrResult.Lines) {
      $wordsOut = @()
      foreach ($w in $line.Words) {
        $wordsOut += @{
          text = [string]$w.Text
          x = [Math]::Round([double]$w.BoundingRect.X, 1)
          y = [Math]::Round([double]$w.BoundingRect.Y, 1)
          w = [Math]::Round([double]$w.BoundingRect.Width, 1)
          h = [Math]::Round([double]$w.BoundingRect.Height, 1)
        }
      }
      $linesOut += @{
        text = [string]$line.Text
        words = $wordsOut
      }
    }

    $payload = @{
      ok = $true
      text = [string]$ocrResult.Text
      lines = $linesOut
    }
    $payload | ConvertTo-Json -Depth 6 -Compress
  } finally {
    if ($winrtStream) { $winrtStream.Dispose() }
    if ($memStream) { $memStream.Dispose() }
  }
} catch {
  $msg = $_.Exception.Message
  if ($_.Exception.InnerException) {
    $msg = $_.Exception.InnerException.Message
  }
  $errPayload = @{
    ok = $false
    error = $msg
    text = ""
    lines = @()
  }
  $errPayload | ConvertTo-Json -Depth 4 -Compress
}
