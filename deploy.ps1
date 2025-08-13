# RapidReach Fly.io Deployment Script
# PowerShell script for Windows deployment

Write-Host "🚀 RapidReach Fly.io Deployment Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Check if flyctl is installed
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ flyctl is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   winget install flyctl" -ForegroundColor Yellow
    Write-Host "   Or download from: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in to Fly.io
$authStatus = flyctl auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Fly.io. Please login first:" -ForegroundColor Red
    Write-Host "   flyctl auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Logged in to Fly.io as: $authStatus" -ForegroundColor Green

# Build the application
Write-Host "📦 Building the application..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Check if app exists
$appExists = flyctl apps list --json | ConvertFrom-Json | Where-Object { $_.Name -eq "rapidreach-test" }

if (-not $appExists) {
    Write-Host "🆕 Creating new Fly.io app..." -ForegroundColor Blue
    flyctl apps create rapidreach-test --generate-name
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create app!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ App created successfully!" -ForegroundColor Green
}

# Deploy the application
Write-Host "🚀 Deploying to Fly.io..." -ForegroundColor Blue
flyctl deploy --local-only
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green

# Get the app URL
$appInfo = flyctl apps list --json | ConvertFrom-Json | Where-Object { $_.Name -eq "rapidreach-test" }
if ($appInfo) {
    $appUrl = "https://$($appInfo.Name).fly.dev"
    Write-Host "🌐 Your app is available at: $appUrl" -ForegroundColor Cyan
    
    # Open in browser
    $openBrowser = Read-Host "Would you like to open the app in your browser? (y/n)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process $appUrl
    }
} else {
    Write-Host "⚠️  Could not determine app URL. Check flyctl apps list" -ForegroundColor Yellow
}

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "📊 To monitor your app:" -ForegroundColor Blue
Write-Host "   flyctl logs" -ForegroundColor Yellow
Write-Host "   flyctl status" -ForegroundColor Yellow
Write-Host "   flyctl dashboard" -ForegroundColor Yellow
