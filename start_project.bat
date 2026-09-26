@echo off
title Sugarcane Yield Forecasting & Decision Support System
echo =====================================================================
echo  AI-Based Sugarcane Yield Forecasting & Decision Support System
echo =====================================================================
echo.

echo [1/3] Checking MySQL Database connection...
python database\setup_db.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Database setup failed. Please check MySQL credentials.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Starting Backend API Server (Flask)...
start "Sugarcane Backend API" cmd /k "python run_backend.py"

echo.
echo [3/3] Starting Frontend Client (Vite + React)...
start "Sugarcane Frontend UI" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul

echo.
echo =====================================================================
echo  Both Servers are Running!
echo  - Frontend UI:  http://localhost:5173
echo  - Backend API:  http://127.0.0.1:5000
echo =====================================================================
echo Opening web browser...
start http://localhost:5173
pause
