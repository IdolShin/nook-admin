@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"

if exist ".git\index.lock" del /f ".git\index.lock"

git add src/lib/api.ts
git add src/app/scan-login/page.tsx
git add src/app/(staff)/layout.tsx

git commit -m "feat: staff scanner login page + staffLogin API method"
git push origin main

echo.
echo Done! Railway will auto-deploy in ~2 min.
pause
