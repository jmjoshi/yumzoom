# Accessibility Audit Script
# Requires Node.js and axe-core CLI (npm install -g axe-core)
# Usage: .\validate-accessibility.ps1 <URL>
param(
    [string]$Url = "https://localhost:3000"
)
Write-Host "Running accessibility audit for $Url..."
axe $Url --exit --tags wcag2a,wcag2aa --reporter html --output accessibility-report.html
Write-Host "Accessibility report saved to accessibility-report.html"
