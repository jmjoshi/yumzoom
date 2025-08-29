# Mobile Responsiveness Test Script
# Requires Node.js and Lighthouse CLI (npm install -g lighthouse)
# Usage: .\validate-mobile.ps1 <URL>
param(
    [string]$Url = "https://localhost:3000"
)
Write-Host "Running Lighthouse mobile audit for $Url..."
lighthouse $Url --preset=mobile --output html --output-path mobile-report.html
Write-Host "Mobile responsiveness report saved to mobile-report.html"
