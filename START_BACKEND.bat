@echo off
echo ========================================
echo Starting SugarYield Backend Server
echo ========================================
echo.

cd backend
set FLASK_DEBUG=1

echo Starting Flask on port 5000...
echo.
echo Keep this window open!
echo Press Ctrl+C to stop the server
echo.

python app.py

pause
