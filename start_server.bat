@echo off
echo Starting Gabriel's Monster Arena Server...
echo.
echo Your computer's IP address is: 192.168.1.3
echo.
echo Desktop access: http://localhost:3000
echo Mobile access: http://192.168.1.3:3000
echo.
echo Make sure your mobile device is on the same WiFi network!
echo.
python -m http.server 3000
pause
