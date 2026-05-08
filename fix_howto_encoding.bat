@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"
if exist ".git\index.lock" del /f ".git\index.lock"
echo === Add changed file ===
git add "src/app/(admin)/register/page.tsx"
echo === Commit ===
git commit -m "fix: restore double-encoded Korean/emoji chars in how-to-use page"
echo === Push ===
git push origin main
echo.
echo === Done. Exit: %ERRORLEVEL% ===
pause
