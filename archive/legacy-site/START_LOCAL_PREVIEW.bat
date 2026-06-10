@echo off
setlocal
cd /d "%~dp0"

set "PYTHON_CMD="

where python >nul 2>nul
if %ERRORLEVEL%==0 set "PYTHON_CMD=python"

if not defined PYTHON_CMD (
    where py >nul 2>nul
    if %ERRORLEVEL%==0 set "PYTHON_CMD=py -3"
)

if not defined PYTHON_CMD (
    echo Python was not found on this computer.
    echo Please install Python, then double-click this button again.
    pause
    exit /b 1
)

start "Bodhi Swan Preview Server" cmd /k %PYTHON_CMD% -m http.server 3000
timeout /t 2 >nul
start "" http://127.0.0.1:3000/calendar.html

exit /b 0
