@echo off
cd /d "C:\Users\18019\Gabriels Game"
echo Starting Gabriel's Monster Arena Server...
echo.
echo Desktop: http://localhost:3000
echo Mobile: http://192.168.1.3:3000
echo.
python -m http.server 3000
