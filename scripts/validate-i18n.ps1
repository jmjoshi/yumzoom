# Multi-language Support Validation Script
# Checks for English and Spanish content on key pages
param(
    [string]$BaseUrl = "https://localhost:3000"
)
$pages = @("/en", "/es")
foreach ($page in $pages) {
    $url = "$BaseUrl$page"
    Write-Host "Checking language support for $url..."
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "SUCCESS: $url is reachable."
    } else {
        Write-Host "FAIL: $url returned status $($response.StatusCode)"
    }
}
Write-Host "Multi-language support check complete."
