#!/bin/bash
# RapidReach Fly.io Deployment Script
# Bash script for Linux/macOS deployment

echo "🚀 RapidReach Fly.io Deployment Script"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl is not installed. Please install it first:${NC}"
    echo -e "${YELLOW}   curl -L https://fly.io/install.sh | sh${NC}"
    echo -e "${YELLOW}   Or visit: https://fly.io/docs/hands-on/install-flyctl/${NC}"
    exit 1
fi

# Check if user is logged in to Fly.io
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Fly.io. Please login first:${NC}"
    echo -e "${YELLOW}   flyctl auth login${NC}"
    exit 1
fi

AUTH_USER=$(flyctl auth whoami)
echo -e "${GREEN}✅ Logged in to Fly.io as: $AUTH_USER${NC}"

# Build the application
echo -e "${BLUE}📦 Building the application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Check if app exists
APP_EXISTS=$(flyctl apps list --json | jq -r '.[] | select(.Name == "rapidreach-test") | .Name' 2>/dev/null)

if [ -z "$APP_EXISTS" ]; then
    echo -e "${BLUE}🆕 Creating new Fly.io app...${NC}"
    flyctl apps create rapidreach-test
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create app!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ App created successfully!${NC}"
fi

# Deploy the application
echo -e "${BLUE}🚀 Deploying to Fly.io...${NC}"
flyctl deploy --local-only
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

# Get the app URL
APP_URL="https://rapidreach-test.fly.dev"
echo -e "${CYAN}🌐 Your app is available at: $APP_URL${NC}"

# Open in browser (macOS/Linux)
read -p "Would you like to open the app in your browser? (y/n): " OPEN_BROWSER
if [[ $OPEN_BROWSER == "y" || $OPEN_BROWSER == "Y" ]]; then
    if command -v open &> /dev/null; then
        open "$APP_URL"  # macOS
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$APP_URL"  # Linux
    else
        echo -e "${YELLOW}⚠️  Could not open browser automatically. Please visit: $APP_URL${NC}"
    fi
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${BLUE}📊 To monitor your app:${NC}"
echo -e "${YELLOW}   flyctl logs${NC}"
echo -e "${YELLOW}   flyctl status${NC}"
echo -e "${YELLOW}   flyctl dashboard${NC}"
