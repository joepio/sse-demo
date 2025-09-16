#!/bin/bash

# Development script for SSE Demo React + Rust application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 > /dev/null 2>&1
}

# Function to kill processes on specific ports
cleanup_ports() {
    print_info "Cleaning up any existing servers..."

    # Kill any existing processes on port 3000 and 5173
    if port_in_use 3000; then
        print_info "Stopping process on port 3000..."
        pkill -f "target/debug/sse-delta-snapshot" || true
        sleep 2
    fi

    if port_in_use 5173; then
        print_info "Stopping process on port 5173..."
        pkill -f "vite" || true
        sleep 2
    fi
}

# Function to check dependencies
check_dependencies() {
    print_info "Checking dependencies..."

    if ! command -v cargo &> /dev/null; then
        print_error "Rust/Cargo not found. Please install Rust from https://rustup.rs/"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js from https://nodejs.org/"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install npm (usually comes with Node.js)"
        exit 1
    fi

    print_success "All dependencies found"
}

# Function to install frontend dependencies
install_deps() {
    print_info "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
}

# Function to build production version
build_production() {
    print_info "Building production version..."

    # Build React app
    print_info "Building React frontend..."
    cd frontend
    npm run build
    cd ..

    # Build Rust backend
    print_info "Building Rust backend..."
    cargo build --release

    print_success "Production build completed!"
    print_info "Built files:"
    print_info "  • React app: dist/"
    print_info "  • Rust binary: target/release/sse-delta-snapshot"
}

# Function to run production mode
run_production() {
    print_info "Starting production server..."
    print_info "Server will serve React app at http://localhost:3000"
    cargo run
}

# Function to run development mode
run_development() {
    print_info "Starting development servers..."
    print_info "This will start two servers:"
    print_info "  • Rust backend: http://localhost:3000 (API only)"
    print_info "  • React frontend: http://localhost:5173 (with hot reload)"
    print_warning "Keep both terminals open for full functionality"

    # Create a function to handle cleanup on script exit
    trap cleanup_ports EXIT INT TERM

    # Start Rust backend in background
    print_info "Starting Rust backend..."
    cargo run --features local &
    RUST_PID=$!

    # Wait a moment for Rust server to start
    sleep 3

    # Check if Rust server started successfully
    if ! port_in_use 3000; then
        print_error "Rust backend failed to start on port 3000"
        kill $RUST_PID 2>/dev/null || true
        exit 1
    fi
    print_success "Rust backend started on port 3000"

    # Start React dev server
    print_info "Starting React dev server..."
    cd frontend
    npm run dev
}

# Function to test the API
test_api() {
    print_info "Testing API endpoints..."

    if ! port_in_use 3000; then
        print_error "Server not running on port 3000. Please start the server first."
        exit 1
    fi

    # Test issues endpoint
    print_info "Testing /issues endpoint..."
    if curl -s http://localhost:3000/issues > /dev/null; then
        print_success "/issues endpoint responding"
    else
        print_error "/issues endpoint not responding"
    fi

    # Test cloudevents endpoint
    print_info "Testing /cloudevents endpoint..."
    if curl -s http://localhost:3000/cloudevents > /dev/null; then
        print_success "/cloudevents endpoint responding"
    else
        print_error "/cloudevents endpoint not responding"
    fi

    print_success "API tests completed"
}

# Function to show usage
show_usage() {
    echo "SSE Demo Development Script"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  dev           Start development servers (Rust + React with hot reload)"
    echo "  prod          Build and run production server"
    echo "  build         Build production version (React + Rust)"
    echo "  install       Install frontend dependencies"
    echo "  test          Test API endpoints"
    echo "  clean         Clean up any running servers"
    echo "  help          Show this help message"
    echo
    echo "Development workflow:"
    echo "  1. Run './dev.sh install' to install dependencies"
    echo "  2. Run './dev.sh dev' for development with hot reload"
    echo "  3. Run './dev.sh prod' for production testing"
    echo "  4. Run './dev.sh build' to create production builds"
    echo
    echo "URLs:"
    echo "  • Development: http://localhost:5173 (React) + http://localhost:3000 (API)"
    echo "  • Production:  http://localhost:3000 (Rust serving React build)"
}

# Main script logic
main() {
    # Check if we're in the right directory
    if [ ! -f "Cargo.toml" ] || [ ! -d "frontend" ]; then
        print_error "Please run this script from the root of the sse-demo project"
        exit 1
    fi

    case "${1:-help}" in
        "dev"|"development")
            check_dependencies
            cleanup_ports
            run_development
            ;;
        "prod"|"production")
            check_dependencies
            build_production
            run_production
            ;;
        "build")
            check_dependencies
            build_production
            ;;
        "install"|"deps")
            check_dependencies
            install_deps
            ;;
        "test")
            test_api
            ;;
        "clean"|"cleanup")
            cleanup_ports
            print_success "Cleanup completed"
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            echo
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
