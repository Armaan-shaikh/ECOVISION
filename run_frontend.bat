@echo off
setlocal

echo ======================================================================
echo                ECOVISION FRONTEND INITIALIZATION AND LAUNCH
echo ======================================================================
cd /d "%~dp0\frontend"

:: 1. Check if Node.js / npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js or npm was not found on your system PATH.
    echo Please install Node.js v18 or v20 LTS from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Frontend dependencies not found.
    echo [INFO] Running npm install automatically...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Please check your network connection.
        pause
        exit /b 1
    )
    echo [SUCCESS] Frontend dependencies installed successfully.
)

:: 3. Launch Vite dev server
echo ======================================================================
echo Launching React 19 + Vite Frontend on http://localhost:5173 ...
echo Proxying API calls to Flask Backend on http://127.0.0.1:5001 ...
echo ======================================================================
call npm run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Frontend dev server stopped unexpectedly.
    pause
)
