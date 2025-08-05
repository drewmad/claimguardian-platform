#!/bin/bash

# Secure Keychain Setup for Supabase Service Role Key

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

KEYCHAIN_SERVICE="ClaimGuardian-Supabase"
KEYCHAIN_ACCOUNT="service-role-key"

echo -e "${GREEN}=== Secure Keychain Setup ===${NC}"
echo ""
echo "This script will securely store your Supabase service role key in macOS Keychain."
echo "The key will be encrypted and only accessible by your user account."
echo ""

# Check if key already exists
if security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" >/dev/null 2>&1; then
    echo -e "${YELLOW}Key already exists in keychain.${NC}"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing key."
        exit 0
    fi
    # Delete existing key
    security delete-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT"
fi

# Prompt for key
echo -e "${YELLOW}Please paste your Supabase service role key:${NC}"
echo "(It will not be displayed on screen)"
read -s SERVICE_ROLE_KEY

# Validate key format
if [[ ! "$SERVICE_ROLE_KEY" =~ ^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
    echo -e "${RED}Error: Invalid key format. Service role keys should start with 'eyJ' and have three parts separated by dots.${NC}"
    exit 1
fi

# Store in keychain
security add-generic-password \
    -s "$KEYCHAIN_SERVICE" \
    -a "$KEYCHAIN_ACCOUNT" \
    -w "$SERVICE_ROLE_KEY" \
    -T "" \
    -U \
    -D "Supabase Service Role Key" \
    -j "Supabase service role key for ClaimGuardian project"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Key successfully stored in macOS Keychain!${NC}"
    echo ""
    echo "The key is now securely stored and encrypted."
    echo "It will be automatically loaded when you run scripts."
    echo ""
    echo -e "${YELLOW}Test retrieval:${NC}"
    # Test retrieval
    if security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Key retrieval successful!${NC}"
    else
        echo -e "${RED}✗ Key retrieval failed!${NC}"
        exit 1
    fi
else
    echo -e "${RED}Failed to store key in keychain!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo "Your scripts will now automatically use the key from Keychain."