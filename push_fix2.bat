@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/lib/api.ts "src/app/(staff)/layout.tsx" src/app/scan-login/page.tsx
git commit -m "fix: repair truncated files - api.ts, staff layout, scan-login page"
git push origin main
echo.
echo Done!
pause
