@echo off
setlocal enabledelayedexpansion

set "NODE_BIN=%USERPROFILE%\node20\node-v20.19.5-win-x64"
set "PATH=%NODE_BIN%;%PATH%"
set "SERVER_DIR=%~dp0adhd-app\server"
set "CLIENT_DIR=%~dp0adhd-app\client"

echo Starting FocusLoop backend on port 4000...
start "FocusLoop Backend" cmd /k "cd /d ""%SERVER_DIR%"" && set ""PATH=%NODE_BIN%;%%PATH%%"" && ""%NODE_BIN%\node.exe"" server.js"

echo Starting FocusLoop frontend on port 5173...
start "FocusLoop Frontend" cmd /k "cd /d ""%CLIENT_DIR%"" && set ""PATH=%NODE_BIN%;%%PATH%%"" && call ""%NODE_BIN%\npm.cmd"" run dev -- --host 0.0.0.0"

echo Opening browser in 2 seconds...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo ==============================================
echo   FocusLoop is now running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:4000
echo ==============================================
echo.
echo Keep the two open command windows running while using the app.
echo You can close this launcher window at any time.
pause >nul
