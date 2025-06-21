#!/bin/bash
# Environment File Validation Script
# Validates .env files for common issues and security concerns

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

# Function to print colored output
print_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ((ERRORS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to validate a single env file
validate_env_file() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        print_error "File $file does not exist"
        return
    fi

    echo "Validating $file..."

    # Check for common security issues
    while IFS= read -r line; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

        # Check for proper format (KEY=VALUE)
        if [[ ! "$line" =~ ^[A-Z_][A-Z0-9_]*= ]]; then
            print_warning "$file: Line '$line' doesn't follow KEY=VALUE format"
        fi

        # Check for exposed secrets (basic patterns)
        if [[ "$line" =~ (password|secret|key|token).*=.*(password|secret|123|admin|root|test) ]]; then
            print_error "$file: Potential exposed secret in line: ${line%%=*}=***"
        fi

        # Check for localhost in production files
        if [[ "$file" == *"production"* && "$line" =~ localhost ]]; then
            print_warning "$file: localhost found in production environment file"
        fi

        # Check for empty values that should have values
        if [[ "$line" =~ ^(DATABASE_URL|SECRET_KEY|API_KEY|PASSWORD)=$ ]]; then
            print_warning "$file: Critical environment variable ${line%=} is empty"
        fi

    done < "$file"
}

# Main validation logic
main() {
    echo "🔍 Starting environment file validation..."

    # Find all .env files
    env_files=()
    while IFS= read -r -d '' file; do
        env_files+=("$file")
    done < <(find . -name ".env*" -type f -not -path "./node_modules/*" -not -path "./.git/*" -print0)

    if [[ ${#env_files[@]} -eq 0 ]]; then
        print_warning "No .env files found"
        exit 0
    fi

    # Validate each file
    for file in "${env_files[@]}"; do
        validate_env_file "$file"
    done

    # Check for required example files
    if [[ ! -f ".env.example" ]]; then
        print_warning "No .env.example file found - consider creating one for documentation"
    fi

    # Summary
    echo ""
    if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
        print_success "All environment files are valid!"
    elif [[ $ERRORS -eq 0 ]]; then
        print_success "No errors found, but $WARNINGS warnings to address"
    else
        print_error "Found $ERRORS errors and $WARNINGS warnings"
        exit 1
    fi
}

# Run main function
main "$@"
