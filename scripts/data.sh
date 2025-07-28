#!/bin/bash
# Data management utilities
source scripts/utils/common.sh

check_project_root

case "$1" in
  import) 
    log_info "Starting parallel data import..."
    if [ -f "./scripts/utils/run-parallel-import.sh" ]; then
        ./scripts/utils/run-parallel-import.sh
    else
        log_error "Import script not found in utils"
    fi
    ;;
  verify) 
    log_info "Verifying import completion..."
    if [ -f "./scripts/utils/verify-import-complete.js" ]; then
        node scripts/utils/verify-import-complete.js
    else
        log_error "Verification script not found in utils"
    fi
    ;;
  clean) 
    log_warn "Cleaning processed data..."
    rm -rf data/processed/*
    log_info "Processed data cleaned"
    ;;
  *) 
    echo "Usage: ./scripts/data.sh {import|verify|clean}" 
    ;;
esac