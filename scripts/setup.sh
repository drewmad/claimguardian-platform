#!/bin/bash

# ClaimGuardian Platform Setup Script
# This script automates the initial setup of the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -c 2-)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
    if [ "$MAJOR_VERSION" -lt 20 ]; then
        log_error "Node.js version $NODE_VERSION detected. Node.js 20+ is required."
        exit 1
    fi
    log_success "Node.js $NODE_VERSION detected"
    
    # Check pnpm
    if ! command_exists pnpm; then
        log_warning "pnpm not found. Installing pnpm..."
        npm install -g pnpm@10.14.0
    fi
    log_success "pnpm $(pnpm --version) detected"
    
    # Check Git
    if ! command_exists git; then
        log_error "Git is not installed. Please install Git."
        exit 1
    fi
    log_success "Git $(git --version | cut -d' ' -f3) detected"
    
    # Check Docker (optional)
    if ! command_exists docker; then
        log_warning "Docker is not installed. Some local development features will not be available."
    else
        log_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) detected"
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    pnpm install
    log_success "Dependencies installed"
}

# Setup Supabase CLI
setup_supabase_cli() {
    log_info "Setting up Supabase CLI..."
    
    if ! command_exists supabase; then
        log_info "Installing Supabase CLI..."
        
        # Detect OS and install accordingly
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command_exists brew; then
                brew install supabase/tap/supabase
            else
                log_warning "Homebrew not found. Please install Supabase CLI manually from https://supabase.com/docs/guides/cli"
                return
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -s https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash
        else
            log_warning "Unsupported OS for automatic Supabase CLI installation. Please install manually."
            return
        fi
    fi
    
    log_success "Supabase CLI $(supabase --version) ready"
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment files..."
    
    # Web app environment
    if [ ! -f "apps/web/.env.local" ]; then
        if [ -f "apps/web/.env.example" ]; then
            cp apps/web/.env.example apps/web/.env.local
            log_success "Created apps/web/.env.local from example"
            log_warning "Please edit apps/web/.env.local with your actual API keys and configuration"
        else
            log_warning "No .env.example found in apps/web/"
        fi
    else
        log_info "Environment file apps/web/.env.local already exists"
    fi
    
    # Supabase environment
    if [ ! -f "supabase/.env" ]; then
        cat > supabase/.env << EOF
# AI Service Configuration for Edge Functions
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
EOF
        log_success "Created supabase/.env"
        log_warning "Please edit supabase/.env with your actual AI API keys"
    else
        log_info "Environment file supabase/.env already exists"
    fi
}

# Initialize local Supabase
init_supabase() {
    log_info "Initializing Supabase..."
    
    if [ ! -f "supabase/config.toml" ]; then
        supabase init
        log_success "Supabase initialized"
    else
        log_info "Supabase already initialized"
    fi
    
    # Check if Docker is available for local development
    if command_exists docker; then
        log_info "Starting local Supabase (this may take a few minutes on first run)..."
        supabase start
        log_success "Local Supabase started"
        
        # Apply migrations
        log_info "Applying database migrations..."
        supabase db push
        log_success "Database migrations applied"
        
        # Generate types
        log_info "Generating TypeScript types..."
        supabase gen types typescript --local > packages/db/src/types.ts
        log_success "TypeScript types generated"
    else
        log_warning "Docker not available. Skipping local Supabase setup."
        log_info "You can connect to a remote Supabase project using: supabase link"
    fi
}

# Build packages
build_packages() {
    log_info "Building packages..."
    pnpm build
    log_success "Packages built successfully"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    if pnpm test --passWithNoTests; then
        log_success "All tests passed"
    else
        log_warning "Some tests failed. Check the output above."
    fi
}

# Setup Git hooks
setup_git_hooks() {
    log_info "Setting up Git hooks..."
    
    if [ -d ".git" ]; then
        # Install husky hooks
        pnpm husky install
        log_success "Git hooks installed"
    else
        log_warning "Not a Git repository. Skipping Git hooks setup."
    fi
}

# Display final instructions
show_final_instructions() {
    echo ""
    log_success "🎉 ClaimGuardian setup completed!"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Edit environment files with your API keys:"
    echo "   - apps/web/.env.local"
    echo "   - supabase/.env"
    echo ""
    echo "2. Get API keys from:"
    echo "   - Mapbox: https://mapbox.com (for mapping)"
    echo "   - OpenAI: https://platform.openai.com (for AI services)"
    echo "   - Google: https://console.cloud.google.com (for Gemini API)"
    echo "   - Anthropic: https://console.anthropic.com (for Claude API)"
    echo ""
    echo "3. Start development servers:"
    echo "   pnpm dev"
    echo ""
    echo "4. Access the application:"
    echo "   - Web app: http://localhost:3000"
    echo "   - Supabase Studio: http://localhost:54323"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Main setup function
main() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    ClaimGuardian Platform Setup       ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    check_prerequisites
    install_dependencies
    setup_supabase_cli
    setup_environment
    init_supabase
    build_packages
    setup_git_hooks
    
    # Optional: Run tests
    read -p "Run tests? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    show_final_instructions
}

# Handle script interruption
trap 'log_error "Setup interrupted. You may need to run this script again."; exit 1' INT

# Run main function
main "$@"