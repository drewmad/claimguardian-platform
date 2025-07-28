#!/bin/bash
# Development utilities
source scripts/utils/common.sh

check_project_root

case "$1" in
  setup) 
    log_info "Setting up development environment..."
    pnpm install && pnpm prepare 
    ;;
  clean) 
    log_info "Cleaning build artifacts..."
    pnpm clean 
    ;;
  lint) 
    log_info "Running smart lint fix..."
    pnpm lint:smart-fix 
    ;;
  *) 
    echo "Usage: ./scripts/dev.sh {setup|clean|lint}" 
    ;;
esac