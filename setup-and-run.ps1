# Stop on first error
$ErrorActionPreference = 'Stop'

# Set working directory explicitly
Set-Location -Path "C:\Users\Jayant\Documents\projects\yumzoom"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

# Start the development server
Write-Host "Starting Next.js development server..." -ForegroundColor Green
npm run dev
