@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"

if exist ".git\index.lock" del /f ".git\index.lock"

git add src/lib/api.ts
git commit -m "fix: remove duplicate/truncated ApiCouponPass at end of api.ts"
git push origin main

echo Done! Railway will rebuild now.
pause
