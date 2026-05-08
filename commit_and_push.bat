@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"
if exist ".git\index.lock" del /f ".git\index.lock"
echo === Step 1: Stash current changes ===
git stash
echo === Step 2: Pull latest from remote ===
git pull origin main
echo === Step 3: Restore changes ===
git stash pop
echo === Step 4: Add all changes ===
git add -u
echo === Step 5: Commit ===
git commit -m "fix: replace literal Unicode chars with JS escapes to prevent UTF-8 mojibake"
echo === Step 6: Push ===
git push origin main
echo.
echo === Done. Exit: %ERRORLEVEL% ===
pause
