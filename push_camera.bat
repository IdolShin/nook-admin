@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"

if exist ".git\index.lock" del /f ".git\index.lock"

git add src/app/(staff)/scan/page.tsx
git commit -m "feat: camera scanning with BarcodeDetector API - auto QR/barcode scan"
git push origin main

echo Done! Railway rebuilding...
pause
