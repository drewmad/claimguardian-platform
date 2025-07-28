#!/bin/bash
# Build utilities
source scripts/utils/common.sh

check_project_root

case "$1" in
  all) 
    log_info "Building all packages..."
    pnpm build 
    ;;
  web) 
    log_info "Building web app..."
    pnpm --filter=web build 
    ;;
  packages) 
    log_info "Building packages..."
    turbo build --filter="./packages/*" 
    ;;
  *) 
    echo "Usage: ./scripts/build.sh {all|web|packages}" 
    ;;
esac