@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"

echo Removing git lock file if exists...
if exist ".git\index.lock" del /f ".git\index.lock"

echo Adding all files...
git add -A

echo Committing...
git commit -m "feat: standalone staff scanner at /scan, remove auth from scanner route"

echo Pushing to origin main...
git push origin main

echo Done!
pause
