@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"
if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\rebase-merge" rmdir /s /q ".git\rebase-merge"
if exist ".git\rebase-apply" rmdir /s /q ".git\rebase-apply"
echo Pulling with rebase...
git pull origin main --rebase
echo.
echo Push result:
git push origin main
echo.
echo Exit code: %ERRORLEVEL%
pause
