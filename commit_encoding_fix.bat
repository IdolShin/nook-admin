@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"
if exist ".git\index.lock" del /f ".git\index.lock"
echo Adding files...
git add -u
echo Committing...
git commit -m "fix: replace literal Unicode chars with JS escapes to prevent UTF-8 mojibake"
echo Pushing...
git push origin main
echo.
echo === Done. Exit code: %ERRORLEVEL% ===
pause
