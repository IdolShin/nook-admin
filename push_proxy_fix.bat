@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"

if exist ".git\index.lock" del /f ".git\index.lock"

git add proxy.ts
git commit -m "fix: proxy.ts truncation - restore full matcher config"
git push origin main

echo Done! Railway will now rebuild with the fix.
pause
