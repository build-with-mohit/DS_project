@echo off
title LIBRIX - Library Management System Launcher
echo ===================================================
echo   Starting LIBRIX - Library Management System
echo ===================================================
echo.

:: Check if backend is already listening on port 8000
netstat -ano | findstr :8000 >nul
if %ERRORLEVEL% NEQ 0 (
    echo [1/3] Starting Backend API Server (Port 8000)...
    start "LIBRIX Backend" /min cmd /c "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"
    timeout /t 3 /nobreak >nul
) else (
    echo [1/3] Backend is already running on port 8000.
)

:: Check if frontend is already listening on port 5173
netstat -ano | findstr :5173 >nul
if %ERRORLEVEL% NEQ 0 (
    echo [2/3] Starting Frontend Dev Server (Port 5173)...
    start "LIBRIX Frontend" /min cmd /c "cd /d "%~dp0frontend" && npm run dev"
    timeout /t 3 /nobreak >nul
) else (
    echo [2/3] Frontend is already running on port 5173.
)

echo [3/3] Launching Google Chrome...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:5173"
) else (
    start "" "http://localhost:5173"
)

echo.
echo ===================================================
echo   LIBRIX is open at: http://localhost:5173
echo ===================================================
timeout /t 3 >nul
exit
