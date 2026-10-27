Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting SugarYield Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location backend
$env:FLASK_DEBUG="1"

Write-Host "Starting Flask on port 5000..." -ForegroundColor Green
Write-Host ""
Write-Host "Keep this window open!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python app.py
