@echo off
echo Installing EDA and Forecasting Dependencies...
echo Please wait, this might take 5-10 minutes (it downloads ML libraries).

cd backend

:: Ensure the virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate and install dependencies
call .\venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo =========================================
echo Setup Complete! You can now close this window.
echo Double-click 'run_app.bat' to start the app.
echo =========================================
pause
