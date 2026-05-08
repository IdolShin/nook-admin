@echo off
cd /d "C:\Users\woosa\Desktop\Nook\nook-admin"

echo === Removing any lock files ===
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\packed-refs.lock" 2>nul
del /f /q ".git\refs\heads\main.lock" 2>nul
del /f /q ".git\refs\remotes\origin\main.lock" 2>nul

echo === Fetching remote ===
git fetch origin main

echo === Rebasing local onto remote ===
git rebase origin/main
if %ERRORLEVEL% NEQ 0 (
    echo Rebase conflict - aborting rebase and trying merge approach
    git rebase --abort
    git merge origin/main -X ours -m "merge: integrate remote encoding fixes"
    if %ERRORLEVEL% NEQ 0 (
        echo Merge also failed. Using force push.
        goto forceonly
    )
)

echo === Pushing ===
git push origin main
goto done

:forceonly
echo === Force pushing ===
git push --force origin main

:done
echo.
echo === Done. Exit: %ERRORLEVEL% ===
pause
