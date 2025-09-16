#!/bin/bash

# Build script for SSE Demo React + Rust application

set -e  # Exit on any error

echo "🏗️  Building SSE Demo Application..."

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the root of the sse-demo project"
    exit 1
fi

echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🔧 Building React frontend..."
npm run build

echo "📁 Build output created in dist/"
cd ..

# Check if dist folder was created
if [ ! -d "dist" ]; then
    echo "❌ Error: Frontend build failed - dist folder not found"
    exit 1
fi

echo "🦀 Building Rust backend..."
cargo build --release

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   • For development: cargo run --features local (serves React dev server)"
echo "   • For production: cargo run (serves built React app from dist/)"
echo "   • For deployment: shuttle deploy"
echo ""
echo "🌐 The application will be available at:"
echo "   • Development: http://localhost:3000 (Rust) + http://localhost:5173 (React)"
echo "   • Production: http://localhost:3000 (Rust serving React build)"
