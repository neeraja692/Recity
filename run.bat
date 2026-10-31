@echo off
echo ======================================================================
echo    ReCity - AI-Powered Urban Space Revival Platform
echo    SEVA First Innovation Challenge 2026
echo ======================================================================
echo.
echo [1/2] Starting ReCity FastAPI Backend and Local Server...
start "" http://127.0.0.1:8000
echo [2/2] Access ReCity in your browser at: http://127.0.0.1:8000
echo.
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
