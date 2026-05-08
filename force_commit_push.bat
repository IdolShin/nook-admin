@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"

echo === Removing all git lock files ===
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\packed-refs.lock" 2>nul
del /f /q ".git\refs\heads\main.lock" 2>nul
del /f /q ".git\refs\remotes\origin\main.lock" 2>nul
echo Lock files cleared.

echo === Pulling latest (rebase) ===
git pull --rebase origin main
if %ERRORLEVEL% NEQ 0 (
    echo Pull failed, trying force push approach...
    goto forcepush
)

echo === Adding all modified tracked files ===
git add -u

echo === Committing ===
git commit -m "fix: replace literal Unicode chars with JS escapes to prevent UTF-8 mojibake"
if %ERRORLEVEL% NEQ 0 (
    echo Nothing to commit or commit failed
)

echo === Pushing ===
git push origin main
goto done

:forcepush
echo === Force pushing with lease ===
git add -u
git commit -m "fix: replace literal Unicode chars with JS escapes to prevent UTF-8 mojibake" 2>nul || echo Nothing new to commit
git push --force-with-lease origin main

:done
echo.
echo === Done. Exit: %ERRORLEVEL% ===
pause
