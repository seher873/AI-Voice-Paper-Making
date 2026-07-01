@echo off
cd /d "%~dp0"
echo PaperBol Server Starting...
echo Open http://localhost:3000 in your browser
npx next dev -p 3000
pause
