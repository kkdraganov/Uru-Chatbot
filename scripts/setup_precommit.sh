#!/bin/bash
# Pre-commit Setup Script for Uru Chatbot
# This script sets up pre-commit hooks and validates the configuration

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ SUCCESS: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

print_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

# Check if we're in the project root
check_project_root() {
    if [[ ! -f ".pre-commit-config.yaml" ]]; then
        print_error "Not in project root or .pre-commit-config.yaml not found"
        exit 1
    fi
    print_success "Found .pre-commit-config.yaml"
}

# Install Python dependencies
setup_python_env() {
    print_header "Setting up Python Environment"

    # Check if Python is available
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi

    print_info "Python version: $(python3 --version)"

    # Install backend development dependencies
    if [[ -f "backend/requirements-dev.txt" ]]; then
        print_info "Installing Python development dependencies..."
        cd backend
        python3 -m pip install --upgrade pip
        python3 -m pip install -r requirements-dev.txt
        cd ..
        print_success "Python dependencies installed"
    else
        print_warning "backend/requirements-dev.txt not found, installing pre-commit only"
        python3 -m pip install pre-commit
    fi
}

# Install Node.js dependencies
setup_node_env() {
    print_header "Setting up Node.js Environment"

    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    print_info "Node.js version: $(node --version)"
    print_info "npm version: $(npm --version)"

    # Install frontend dependencies
    if [[ -f "frontend/package.json" ]]; then
        print_info "Installing Node.js dependencies..."
        cd frontend
        npm install
        cd ..
        print_success "Node.js dependencies installed"
    else
        print_warning "frontend/package.json not found"
    fi
}

# Make scripts executable
setup_scripts() {
    print_header "Setting up Scripts"

    # Make validation scripts executable
    if [[ -f "scripts/validate_mcp_schemas.py" ]]; then
        chmod +x scripts/validate_mcp_schemas.py
        print_success "Made validate_mcp_schemas.py executable"
    fi

    if [[ -f "scripts/validate_env_files.sh" ]]; then
        chmod +x scripts/validate_env_files.sh
        print_success "Made validate_env_files.sh executable"
    fi
}

# Install pre-commit hooks
install_precommit() {
    print_header "Installing Pre-commit Hooks"

    # Install pre-commit hooks
    print_info "Installing pre-commit hooks..."
    pre-commit install
    print_success "Pre-commit hooks installed"

    # Install pre-commit hooks for commit-msg (if needed)
    pre-commit install --hook-type commit-msg || true

    # Install pre-commit hooks for pre-push (if needed)
    pre-commit install --hook-type pre-push || true
}

# Validate pre-commit configuration
validate_config() {
    print_header "Validating Pre-commit Configuration"

    print_info "Validating .pre-commit-config.yaml..."
    pre-commit validate-config
    print_success "Pre-commit configuration is valid"

    print_info "Validating manifest..."
    pre-commit validate-manifest || print_warning "Some hooks may not be available yet"
}

# Run initial checks
run_initial_checks() {
    print_header "Running Initial Quality Checks"

    print_info "Running pre-commit on all files (this may take a while)..."

    # Run pre-commit on all files, but don't fail if some hooks fail initially
    if pre-commit run --all-files; then
        print_success "All pre-commit hooks passed!"
    else
        print_warning "Some pre-commit hooks failed - this is normal for initial setup"
        print_info "You can fix issues and run 'pre-commit run --all-files' again"
    fi
}

# Test specific hooks
test_hooks() {
    print_header "Testing Individual Hooks"

    # Test Python hooks if backend exists
    if [[ -d "backend" ]]; then
        print_info "Testing Python hooks..."
        pre-commit run ruff --all-files || print_warning "Ruff hook needs attention"
        pre-commit run ruff-format --all-files || print_warning "Ruff format hook needs attention"
    fi

    # Test frontend hooks if frontend exists
    if [[ -d "frontend" ]]; then
        print_info "Testing frontend hooks..."
        pre-commit run eslint --all-files || print_warning "ESLint hook needs attention"
        pre-commit run prettier --all-files || print_warning "Prettier hook needs attention"
    fi

    # Test custom hooks
    print_info "Testing custom validation hooks..."
    pre-commit run validate-mcp-schemas --all-files || print_warning "MCP validation needs attention"
    pre-commit run validate-env-files --all-files || print_warning "Environment file validation needs attention"
}

# Display usage information
show_usage() {
    print_header "Pre-commit Setup Complete!"

    echo "Pre-commit hooks are now installed and configured."
    echo ""
    echo "Available commands:"
    echo "  pre-commit run --all-files    # Run all hooks on all files"
    echo "  pre-commit run <hook-name>    # Run specific hook"
    echo "  pre-commit autoupdate         # Update hook versions"
    echo "  pre-commit clean              # Clean cached repos"
    echo ""
    echo "Hooks will automatically run on git commit."
    echo "To skip hooks temporarily: git commit --no-verify"
    echo ""
    echo "For more information, see: https://pre-commit.com/"
}

# Main execution
main() {
    print_header "Uru Chatbot Pre-commit Setup"

    check_project_root
    setup_python_env
    setup_node_env
    setup_scripts
    install_precommit
    validate_config
    run_initial_checks
    test_hooks
    show_usage

    print_success "Pre-commit setup completed successfully!"
}

# Run main function
main "$@"
