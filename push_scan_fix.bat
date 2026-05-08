@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"

if exist ".git\index.lock" del /f ".git\index.lock"

git add src/app/(staff)/layout.tsx src/app/(staff)/scan/page.tsx
git commit -m "fix: staff layout auth guard + auto-detect qr vs barcode scan type"
git push origin main

echo Done! Railway rebuilding...
pause
