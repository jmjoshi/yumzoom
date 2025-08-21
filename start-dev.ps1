$ErrorActionPreference = 'Stop'
$projectPath = "C:\Users\Jayant\Documents\projects\yumzoom"
Write-Host "Starting from: $PWD"
Write-Host "Changing to project directory: $projectPath"
Set-Location -LiteralPath $projectPath
Write-Host "Current directory: $PWD"
Write-Host "Starting Next.js development server..."
npm run dev
