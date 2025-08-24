@echo off
REM PlanMyEscape Checkpoint Management Script for Windows

if "%1"=="create" (
    REM Create a new checkpoint with optional description
    set DESC=%2
    if "%DESC%"=="" set DESC=Working state
    
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set TAG_NAME=checkpoint-%datetime:~0,8%-%datetime:~8,6%
    
    git add .
    git commit -m "Checkpoint: %DESC%"
    git tag -a %TAG_NAME% -m "%DESC%"
    echo Created checkpoint: %TAG_NAME%
    echo Description: %DESC%
    goto :eof
)

if "%1"=="list" (
    REM List all checkpoints
    echo Available checkpoints:
    git tag -l "checkpoint-*" | sort /R | head -10
    goto :eof
)

if "%1"=="restore" (
    REM Restore to a specific checkpoint
    if "%2"=="" (
        echo Please specify a checkpoint name
        echo Usage: checkpoint.bat restore checkpoint-name
        exit /b 1
    )
    echo WARNING: This will discard all uncommitted changes!
    set /p CONFIRM=Are you sure? (y/N): 
    if /i "%CONFIRM%"=="y" (
        git reset --hard %2
        echo Restored to checkpoint: %2
    ) else (
        echo Restore cancelled
    )
    goto :eof
)

if "%1"=="delete" (
    REM Delete a checkpoint
    if "%2"=="" (
        echo Please specify a checkpoint name
        exit /b 1
    )
    git tag -d %2
    echo Deleted checkpoint: %2
    goto :eof
)

REM Show help
echo PlanMyEscape Checkpoint Manager
echo ================================
echo Usage:
echo   checkpoint.bat create [description]  - Create a new checkpoint
echo   checkpoint.bat list                  - List recent checkpoints
echo   checkpoint.bat restore ^<name^>        - Restore to a checkpoint
echo   checkpoint.bat delete ^<name^>         - Delete a checkpoint
echo.
echo Examples:
echo   checkpoint.bat create "Before adding payment feature"
echo   checkpoint.bat restore checkpoint-20250824-084456