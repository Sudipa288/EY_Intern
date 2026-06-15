@echo off
echo Starting EDA and Forecasting Application...

:: Kill any existing process on port 8005
echo Killing any process on port 8005...
powershell -NoProfile -Command "$p=(netstat -ano | Select-String ':8005 ' | Select-String 'LISTENING' | ForEach-Object {($_ -split '\s+')[-1]} | Select-Object -First 1); if($p){taskkill /PID $p /F | Out-Null; Write-Host 'Killed PID' $p} else {Write-Host 'Port 8005 is free'}"

:: Kill any existing process on port 3000
echo Killing any process on port 3000...
powershell -NoProfile -Command "$p=(netstat -ano | Select-String ':3000 ' | Select-String 'LISTENING' | ForEach-Object {($_ -split '\s+')[-1]} | Select-Object -First 1); if($p){taskkill /PID $p /F | Out-Null; Write-Host 'Killed PID' $p} else {Write-Host 'Port 3000 is free'}"


:: Start the backend — use venv python.exe directly (avoids system Python being used by subprocesses)
echo Starting Backend API on port 8005...
start "Backend Server" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8005"

:: Start the frontend server
echo Starting Frontend on port 3000...
start "Frontend Server" cmd /k "cd /d %~dp0 && python -m http.server 3000"

:: Wait for backend to start
timeout /t 4 /nobreak >nul

:: Open the browser
echo Opening browser...
start http://localhost:3000
