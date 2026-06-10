@echo off
REM Bodhi Swan Ceramics - local preview (Windows)
REM Double-click this file to preview the site in your browser.
cd /d "%~dp0"
echo Starting local preview at http://localhost:8000
start "" http://localhost:8000
python -m http.server 8000
