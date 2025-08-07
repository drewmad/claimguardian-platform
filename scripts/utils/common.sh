#!/bin/bash
# Common utilities for scripts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running from project root
check_project_root() {
    if [ ! -f "package.json" ] || [ ! -f "CLAUDE.md" ]; then
        log_error "Please run from project root directory"
        exit 1
    fi
}
