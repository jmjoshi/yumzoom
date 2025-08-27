#!/usr/bin/env pwsh
Write-Host "Starting build test..."
npm run build
Write-Host "Build test completed with exit code: $LASTEXITCODE"
