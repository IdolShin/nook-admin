@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"

if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\rebase-merge" rmdir /s /q ".git\rebase-merge"
if exist ".git\rebase-apply" rmdir /s /q ".git\rebase-apply"

echo === Restoring working directory ===
git checkout -- .

echo.
echo === Local commits to push ===
git log --oneline -5

echo.
echo === Force pushing to GitHub ===
git push -f origin main

echo.
echo Exit code: %ERRORLEVEL%
echo.
echo Done! Railway will auto-deploy in ~3-5 min.
pause
