@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/lib/api.ts
git add src/components/layout/Topbar.tsx
git add src/components/layout/Sidebar.tsx
git add "src/app/(admin)/layout.tsx"
git add "src/app/(admin)/settings/page.tsx"
git add "src/app/(admin)/coupons/page.tsx"
git commit -m "feat: Settings overhaul, More menu accordion, Coupons mobile layout, notification bell"
git push origin main
echo.
echo Frontend done! Railway auto-deploys in ~3 min.
pause
