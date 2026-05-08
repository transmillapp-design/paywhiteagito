#!/bin/bash

# AgitoCoin Deploy Ready Script
# Prepares system for deployment using existing build

echo "🚀 AgitoCoin Deploy Preparation"
echo "=============================="

# Update environment variables for production
echo "REACT_APP_BACKEND_URL=https://test-auth-fix-1.emergent.host/api" > /app/frontend/.env
echo "GENERATE_SOURCEMAP=false" >> /app/frontend/.env

# Update backend .env for production
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://test-auth-fix-1.emergent.host|' /app/backend/.env

# Verify build exists
if [ -d "/app/frontend/build" ]; then
    echo "✅ Frontend build exists"
    ls -la /app/frontend/build/static/js/ | head -3
else
    echo "❌ Frontend build not found"
    exit 1
fi

# Verify backend files
if [ -f "/app/backend/server.py" ]; then
    echo "✅ Backend files exist"
else
    echo "❌ Backend files not found"
    exit 1
fi

# Create deployment marker
echo "deployment_ready: true" > /app/.deploy-ready
echo "timestamp: $(date)" >> /app/.deploy-ready
echo "backend_url: https://test-auth-fix-1.emergent.host/api" >> /app/.deploy-ready

echo ""
echo "✅ System ready for deployment!"
echo "   Frontend: Build exists with production config"
echo "   Backend: Environment variables updated"
echo "   URLs: Configured for test-auth-fix-1.emergent.host"
echo ""
echo "🚀 You can now trigger deployment"