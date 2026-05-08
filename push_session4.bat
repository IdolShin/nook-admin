@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"
git add src/app/(admin)/coupons/page.tsx src/app/(admin)/settings/page.tsx src/app/(admin)/layout.tsx src/components/layout/Topbar.tsx src/components/layout/Sidebar.tsx src/lib/api.ts
git commit -m "feat: coupons mobile layout (isPhone card view) + settings overhaul + more menu restructure"
git push origin main
echo.
echo === DONE ===
pause
