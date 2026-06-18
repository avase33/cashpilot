@echo off
echo CashPilot - GitHub Issues Creator
echo ==================================
echo.
set /p TOKEN="Enter your GitHub personal access token: "
echo.
echo Creating issues...
powershell -ExecutionPolicy Bypass -File "%~dp0create_issues.ps1" -Token "%TOKEN%"
echo.
pause
