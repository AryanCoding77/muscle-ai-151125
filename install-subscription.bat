@echo off
echo ========================================
echo Muscle AI - Subscription System Setup
echo ========================================
echo.

echo [1/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [2/5] Checking environment configuration...
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file with Razorpay credentials
    pause
    exit /b 1
)

findstr /C:"EXPO_PUBLIC_RAZORPAY_KEY_ID" .env >nul
if %errorlevel% neq 0 (
    echo WARNING: EXPO_PUBLIC_RAZORPAY_KEY_ID not found in .env
    echo Please add your Razorpay Key ID to .env file
    echo.
)
echo ✓ Environment file exists
echo.

echo [3/5] Checking Supabase CLI...
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Supabase CLI not found
    echo Please install: npm install -g supabase
    echo.
) else (
    echo ✓ Supabase CLI found
)
echo.

echo [4/5] Setup Instructions:
echo.
echo Next steps to complete setup:
echo.
echo 1. Configure Razorpay:
echo    - Get API keys from https://dashboard.razorpay.com
echo    - Update .env with EXPO_PUBLIC_RAZORPAY_KEY_ID
echo.
echo 2. Setup Supabase Database:
echo    - Open Supabase SQL Editor
echo    - Run supabase-schema.sql
echo.
echo 3. Deploy Edge Functions:
echo    - Run: supabase login
echo    - Set secrets with: supabase secrets set KEY=VALUE
echo    - Deploy: supabase functions deploy [function-name]
echo.
echo 4. Configure Razorpay Webhooks:
echo    - Add webhook URL in Razorpay Dashboard
echo    - Copy webhook secret to Supabase secrets
echo.

echo [5/5] Documentation:
echo.
echo - SUBSCRIPTION_README.md - Quick start guide
echo - SUBSCRIPTION_SETUP.md - Detailed setup instructions
echo - SUBSCRIPTION_TESTING_GUIDE.md - Testing scenarios
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Run 'npm start' to launch the app
echo.
pause
