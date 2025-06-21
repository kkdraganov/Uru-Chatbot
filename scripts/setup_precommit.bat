@echo off
REM Pre-commit Setup Script for Windows
REM This script sets up pre-commit hooks for the Uru Chatbot project

echo ================================================
echo Uru Chatbot Pre-commit Setup (Windows)
echo ================================================

REM Check if we're in the project root
if not exist ".pre-commit-config.yaml" (
    echo ERROR: Not in project root or .pre-commit-config.yaml not found
    pause
    exit /b 1
)
echo SUCCESS: Found .pre-commit-config.yaml

echo.
echo ================================================
echo Setting up Python Environment
echo ================================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo INFO: Python version:
python --version

REM Install backend development dependencies
echo INFO: Installing Python development dependencies...
cd backend
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo SUCCESS: Python dependencies installed

echo.
echo ================================================
echo Setting up Node.js Environment
echo ================================================

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo INFO: Node.js version:
node --version
echo INFO: npm version:
npm --version

REM Install frontend dependencies
echo INFO: Installing Node.js dependencies...
cd frontend
npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo SUCCESS: Node.js dependencies installed

echo.
echo ================================================
echo Installing Pre-commit Hooks
echo ================================================

echo INFO: Installing pre-commit hooks...
pre-commit install
if errorlevel 1 (
    echo ERROR: Failed to install pre-commit hooks
    pause
    exit /b 1
)
echo SUCCESS: Pre-commit hooks installed

echo.
echo ================================================
echo Validating Configuration
echo ================================================

echo INFO: Validating .pre-commit-config.yaml...
pre-commit validate-config
if errorlevel 1 (
    echo WARNING: Pre-commit configuration validation failed
) else (
    echo SUCCESS: Pre-commit configuration is valid
)

echo.
echo ================================================
echo Setup Complete!
echo ================================================

echo Pre-commit hooks are now installed and configured.
echo.
echo Available commands:
echo   pre-commit run --all-files    # Run all hooks on all files
echo   pre-commit run ^<hook-name^>    # Run specific hook
echo   pre-commit autoupdate         # Update hook versions
echo   pre-commit clean              # Clean cached repos
echo.
echo Hooks will automatically run on git commit.
echo To skip hooks temporarily: git commit --no-verify
echo.
echo For more information, see: https://pre-commit.com/

pause
