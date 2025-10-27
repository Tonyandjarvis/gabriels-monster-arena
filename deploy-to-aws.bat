@echo off
REM AWS Deployment Script for Gabriel's Monster Arena (Windows)
REM This script prepares the production files for AWS deployment

echo 🚀 Preparing Gabriel's Monster Arena for AWS deployment...

REM Create production directory
set PROD_DIR=gabriels-game-production
set ZIP_FILE=gabriels-game-aws.zip

REM Clean up any existing production directory
if exist "%PROD_DIR%" (
    echo Cleaning up existing production directory...
    rmdir /s /q "%PROD_DIR%"
)

REM Create production directory
mkdir "%PROD_DIR%"

echo 📦 Copying production files...

REM Copy essential game files
copy Gabriels_Game.html "%PROD_DIR%\"
copy index.html "%PROD_DIR%\"
xcopy js "%PROD_DIR%\js\" /e /i
xcopy config "%PROD_DIR%\config\" /e /i
xcopy Assets "%PROD_DIR%\Assets\" /e /i

REM Copy any other HTML files that might be needed
if exist "embedded_test.html" (
    copy embedded_test.html "%PROD_DIR%\"
)

if exist "test_phase1_fixes.html" (
    copy test_phase1_fixes.html "%PROD_DIR%\"
)

echo ✅ Production files copied successfully!

REM Create deployment zip (requires PowerShell)
echo 📦 Creating deployment package...
powershell -command "Compress-Archive -Path '%PROD_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

echo 🎉 Deployment package created: %ZIP_FILE%
echo.
echo 📋 Next steps:
echo 1. Upload %ZIP_FILE% to your EC2 instance
echo 2. Extract it in your web server directory
echo 3. Set proper permissions
echo.
echo 🔗 Upload command example:
echo scp -i your-key.pem %ZIP_FILE% ec2-user@your-ec2-ip:/home/ec2-user/
echo.
echo 📁 Files included in deployment:
dir "%PROD_DIR%"

REM Ask if user wants to keep production directory
set /p KEEP_DIR="Remove production directory? (y/n): "
if /i "%KEEP_DIR%"=="y" (
    rmdir /s /q "%PROD_DIR%"
    echo Production directory removed.
) else (
    echo Production directory kept at: %PROD_DIR%
)

echo ✅ AWS deployment preparation complete!
pause
