@echo off
echo Starting EcoVision Backend API...
cd /d "%~dp0"
backend\venv\Scripts\python.exe backend\run.py
pause

