@echo off
setlocal

echo ======================================================================
echo                ECOVISION BACKEND INITIALIZATION AND LAUNCH
echo ======================================================================
cd /d "%~dp0"

:: 1. Check if virtual environment exists
if not exist "backend\venv\Scripts\python.exe" (
    echo [INFO] Python virtual environment not found in backend\venv.
    echo [INFO] Setting up virtual environment automatically...

    set "PYTHON_CMD="
    where python >nul 2>nul && set "PYTHON_CMD=python"
    if not defined PYTHON_CMD (
        where py >nul 2>nul && set "PYTHON_CMD=py"
    )

    if not defined PYTHON_CMD (
        echo [ERROR] Python 3.10+ was not found on your system PATH.
        echo Please install Python 3.10, 3.11, or 3.12 from https://www.python.org/
        echo Make sure to check the box: Add python.exe to PATH during installation.
        pause
        exit /b 1
    )

    echo [INFO] Using system Python to create backend\venv...
    %PYTHON_CMD% -m venv backend\venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment in backend\venv.
        pause
        exit /b 1
    )

    echo [INFO] Upgrading pip...
    backend\venv\Scripts\python.exe -m pip install --upgrade pip

    echo [INFO] Installing required dependencies from backend\requirements.txt...
    backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment configured successfully.
)

:: 2. Ensure .env exists in backend
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo [INFO] Creating backend\.env from template...
        copy "backend\.env.example" "backend\.env" >nul
    )
)

:: 3. Launch Flask Backend on port 5001
echo ======================================================================
echo Launching EcoVision Flask REST API on http://127.0.0.1:5001 ...
echo Press Ctrl+C in this window to stop the server.
echo ======================================================================
backend\venv\Scripts\python.exe backend\run.py

if errorlevel 1 (
    echo.
    echo [ERROR] Backend server stopped unexpectedly.
    pause
)
