@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"
if exist ".git\index.lock" del /f ".git\index.lock"
echo Pushing to origin main...
git push origin main
echo.
echo Exit code: %ERRORLEVEL%
pause
