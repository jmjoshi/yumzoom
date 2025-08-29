# YumZoom Page Load Time Validation Script
# This script uses PowerShell and Invoke-WebRequest to measure page load times
# Note: This is a basic check and does not measure full browser rendering time

$pages = @(
  "https://your-production-url.com/",
  "https://your-production-url.com/restaurants",
  "https://your-production-url.com/profile"
)

Write-Host "--- Page Load Time Validation ---"
foreach ($url in $pages) {
  $result = Measure-Command { Invoke-WebRequest -Uri $url -UseBasicParsing }
  $ms = [math]::Round($result.TotalMilliseconds, 2)
  if ($ms -le 3000) {
    Write-Host "$url load time: $ms ms ✅"
  } else {
    Write-Host "$url load time: $ms ms ❌ (Over 3s)"
  }
}
Write-Host "--- Validation Complete ---"
