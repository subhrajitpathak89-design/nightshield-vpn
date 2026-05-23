$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 4173
$server = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $port)
$server.Start()
Write-Host "NightShield preview running at http://127.0.0.1:$port/"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg" = "image/svg+xml"
}

function Send-Response($client, $status, $contentType, [byte[]] $body) {
  $stream = $client.GetStream()
  $reason = if ($status -eq 200) { "OK" } else { "Not Found" }
  $headers = "HTTP/1.1 $status $reason`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  $stream.Write($body, 0, $body.Length)
  $stream.Close()
  $client.Close()
}

try {
  while ($true) {
    $client = $server.AcceptTcpClient()
    $stream = $client.GetStream()
    $buffer = New-Object byte[] 4096
    $read = $stream.Read($buffer, 0, $buffer.Length)
    $request = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read)
    $firstLine = ($request -split "`r`n")[0]
    $parts = $firstLine -split " "

    if ($parts.Length -lt 2 -or $parts[0] -ne "GET") {
      Send-Response $client 404 "text/plain; charset=utf-8" ([System.Text.Encoding]::UTF8.GetBytes("Not found"))
      continue
    }

    $path = [Uri]::UnescapeDataString($parts[1].Split("?")[0].TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($path)) {
      $path = "index.html"
    }

    $filePath = Join-Path $root $path
    $resolvedRoot = [System.IO.Path]::GetFullPath($root)
    $resolvedFile = [System.IO.Path]::GetFullPath($filePath)

    if (-not $resolvedFile.StartsWith($resolvedRoot) -or -not (Test-Path -LiteralPath $resolvedFile -PathType Leaf)) {
      Send-Response $client 404 "text/plain; charset=utf-8" ([System.Text.Encoding]::UTF8.GetBytes("Not found"))
      continue
    }

    $extension = [System.IO.Path]::GetExtension($resolvedFile)
    $contentType = $mimeTypes[$extension]
    if (-not $contentType) {
      $contentType = "application/octet-stream"
    }

    Send-Response $client 200 $contentType ([System.IO.File]::ReadAllBytes($resolvedFile))
  }
} finally {
  $server.Stop()
}
