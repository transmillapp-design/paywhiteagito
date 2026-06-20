#!/bin/bash

# Fallback build script for AgitoCoin frontend
# Uses npm instead of yarn to avoid registry issues

echo "🔧 AgitoCoin Frontend Build Fallback"
echo "================================="

# Set environment variables
export REACT_APP_BACKEND_URL="${BACKEND_URL}/api"
export GENERATE_SOURCEMAP=false
export NODE_ENV=production

echo "Backend URL: $REACT_APP_BACKEND_URL"

# Use npm with robust configuration
npm config set registry https://registry.npmjs.org/
npm config set timeout 300000
npm config set maxsockets 1

# Clean and install
echo "📦 Installing dependencies with npm..."
rm -rf node_modules package-lock.json
npm install --production=false

# Build
echo "🏗️ Building production bundle..."
npm run build

echo "✅ Build complete!"