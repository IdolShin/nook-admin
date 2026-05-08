@echo off
echo === Pulling latest nook-admin ===
cd /d C:\Users\woosa\Desktop\Nook\nook-admin
git pull origin main
git add src/app/(admin)/register/page.tsx src/app/(admin)/analytics/page.tsx src/app/(admin)/layout.tsx src/lib/api.ts
git commit -m "feat: analytics permissions + How to Use mobile layout fix + More menu permission filter"
git push origin main
echo.
echo === Pushing nook backend ===
cd /d C:\Users\woosa\Desktop\Nook
git add src/routes/analytics.js src/index.js
git commit -m "feat: add /api/analytics route with superadmin bizId support"
git push origin main
echo.
echo === DONE ===
pause
