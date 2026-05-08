@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"

if exist ".git\index.lock" del /f ".git\index.lock"

git add src/app/(staff)/scan/page.tsx
git commit -m "fix: jsQR CDN fallback for iOS camera scanning - BarcodeDetector not supported on iOS"
git push origin main

echo Done! Railway rebuilding...
pause
