# YumZoom API Performance Validation Script
# This script checks response times for key API endpoints

$endpoints = @(
  "https://your-api-url.com/api/login",
  "https://your-api-url.com/api/restaurants",
  "https://your-api-url.com/api/user"
)

Write-Host "--- API Response Time Validation ---"
foreach ($url in $endpoints) {
  $result = Measure-Command { Invoke-WebRequest -Uri $url -UseBasicParsing }
  $ms = [math]::Round($result.TotalMilliseconds, 2)
  if ($ms -le 500) {
    Write-Host "$url response time: $ms ms ✅"
  } else {
    Write-Host "$url response time: $ms ms ❌ (Over 500ms)"
  }
}
Write-Host "--- Validation Complete ---"
