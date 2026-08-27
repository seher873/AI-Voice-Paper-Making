@echo off
title Paperbol - Test Runner
color 0A
cd /d "%~dp0"

echo ============================================
echo   PAPERBOL - FULL TEST RUNNER (All Tests)
echo   %date% %time%
echo ============================================
echo.

set TEST_ERROR=0

echo [1/3] Result Engine tests...
call npx tsx tests/resultEngine.test.ts
if errorlevel 1 set TEST_ERROR=1 & echo   !!! RESULT ENGINE FAILED

echo.
echo [2/3] Reducer tests...
call npx tsx tests/reducer.test.ts
if errorlevel 1 set TEST_ERROR=1 & echo   !!! REDUCER FAILED

echo.
echo [3/3] Excel Paper / Fee Engine tests...
call npx tsx tests/excelPaper.test.ts
if errorlevel 1 set TEST_ERROR=1 & echo   !!! EXCEL PAPER FAILED
call npx tsx tests/feeEngine.test.ts
if errorlevel 1 set TEST_ERROR=1 & echo   !!! FEE ENGINE FAILED

echo.
echo ============================================
if %TEST_ERROR% EQU 1 (
    color 0C
    echo   FINAL RESULT: FAILURES DETECTED - check above
) else (
    echo   FINAL RESULT: ALL TESTS PASSED
)
echo ============================================
echo.
pause