#!/bin/bash

# Secure Environment Variable Manager for ClaimGuardian
# Handles encryption, validation, rotation, and secure deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🔐 ClaimGuardian Secure Environment Manager${NC}"
echo "=============================================="
echo ""

# Configuration
ENV_VAULT_DIR="$PROJECT_ROOT/.vault"
BACKUP_DIR="$PROJECT_ROOT/.vault/backups"
AUDIT_LOG="$PROJECT_ROOT/.vault/audit.log"

# Ensure vault directories exist
mkdir -p "$ENV_VAULT_DIR" "$BACKUP_DIR"

# Initialize audit log
if [[ ! -f "$AUDIT_LOG" ]]; then
    echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - INIT - Secure Environment Manager initialized" > "$AUDIT_LOG"
fi

# Audit logging function
audit_log() {
    local action="$1"
    local details="$2"
    local user="${USER:-unknown}"
    echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - ${action} - User: ${user} - ${details}" >> "$AUDIT_LOG"
}

# Generate secure random strings
generate_secure_key() {
    local length="${1:-32}"
    openssl rand -base64 "$length" | tr -d '\n'
}

# Validate API key formats
validate_api_key() {
    local key_name="$1"
    local key_value="$2"
    
    case "$key_name" in
        "OPENAI_API_KEY")
            if [[ ! "$key_value" =~ ^sk-[a-zA-Z0-9]{48,} ]]; then
                echo -e "${RED}❌ Invalid OpenAI API key format${NC}"
                return 1
            fi
            ;;
        "GEMINI_API_KEY")
            if [[ ! "$key_value" =~ ^[A-Za-z0-9_-]{39}$ ]]; then
                echo -e "${RED}❌ Invalid Gemini API key format${NC}"
                return 1
            fi
            ;;
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
            if [[ ! "$key_value" =~ ^[A-Za-z0-9_-]{39}$ ]]; then
                echo -e "${RED}❌ Invalid Google Maps API key format${NC}"
                return 1
            fi
            ;;
        "RESEND_API_KEY")
            if [[ ! "$key_value" =~ ^re_[a-zA-Z0-9]{24,}$ ]]; then
                echo -e "${RED}❌ Invalid Resend API key format${NC}"
                return 1
            fi
            ;;
        "SUPABASE_SERVICE_ROLE_KEY"|"NEXT_PUBLIC_SUPABASE_ANON_KEY")
            if [[ ! "$key_value" =~ ^eyJ[A-Za-z0-9_-]{40,}$ ]]; then
                echo -e "${RED}❌ Invalid Supabase key format${NC}"
                return 1
            fi
            ;;
        "SESSION_SECRET"|"ENCRYPTION_KEY")
            if [[ ${#key_value} -lt 32 ]]; then
                echo -e "${RED}❌ ${key_name} must be at least 32 characters${NC}"
                return 1
            fi
            ;;
    esac
    
    echo -e "${GREEN}✅ ${key_name} format is valid${NC}"
    return 0
}

# Check environment variable security
check_env_security() {
    echo -e "${BLUE}🔍 Security Analysis${NC}"
    echo "==================="
    echo ""
    
    local issues=0
    local warnings=0
    
    # Check for required variables
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "OPENAI_API_KEY"
        "GEMINI_API_KEY"
        "RESEND_API_KEY"
        "SESSION_SECRET"
        "ENCRYPTION_KEY"
    )
    
    echo -e "${CYAN}Checking Required Variables:${NC}"
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]] && ! grep -q "^${var}=" .env.local 2>/dev/null; then
            echo -e "   ${RED}❌ ${var} - MISSING${NC}"
            ((issues++))
        else
            local value=""
            if [[ -n "${!var}" ]]; then
                value="${!var}"
            elif grep -q "^${var}=" .env.local 2>/dev/null; then
                value=$(grep "^${var}=" .env.local | cut -d'=' -f2- | tr -d '"')
            fi
            
            if [[ -n "$value" ]]; then
                if validate_api_key "$var" "$value"; then
                    echo -e "   ${GREEN}✅ ${var} - OK${NC}"
                else
                    ((issues++))
                fi
            else
                echo -e "   ${YELLOW}⚠️ ${var} - Empty value${NC}"
                ((warnings++))
            fi
        fi
    done
    
    echo ""
    echo -e "${CYAN}Security Recommendations:${NC}"
    
    # Check file permissions
    if [[ -f ".env.local" ]]; then
        local perms=$(stat -f "%A" .env.local 2>/dev/null || stat -c "%a" .env.local 2>/dev/null || echo "unknown")
        if [[ "$perms" != "600" && "$perms" != "unknown" ]]; then
            echo -e "   ${YELLOW}⚠️ .env.local permissions should be 600 (currently $perms)${NC}"
            echo "      Fix: chmod 600 .env.local"
            ((warnings++))
        else
            echo -e "   ${GREEN}✅ .env.local has secure permissions${NC}"
        fi
    fi
    
    # Check for secrets in git
    if git check-ignore .env.local >/dev/null 2>&1; then
        echo -e "   ${GREEN}✅ .env.local is properly ignored by git${NC}"
    else
        echo -e "   ${RED}❌ .env.local is NOT in .gitignore${NC}"
        echo "      Risk: Secrets could be committed to git"
        ((issues++))
    fi
    
    # Check for weak keys
    if [[ -f ".env.local" ]]; then
        if grep -q "password\|123\|test\|demo\|example" .env.local; then
            echo -e "   ${RED}❌ Weak or test values detected in .env.local${NC}"
            ((issues++))
        fi
    fi
    
    echo ""
    if [[ $issues -eq 0 ]]; then
        echo -e "${GREEN}🎉 Security Check Passed${NC}"
        if [[ $warnings -gt 0 ]]; then
            echo -e "${YELLOW}   $warnings warnings to address${NC}"
        fi
    else
        echo -e "${RED}⚠️ Security Issues Found: $issues critical, $warnings warnings${NC}"
    fi
    
    audit_log "SECURITY_CHECK" "$issues issues, $warnings warnings found"
    return $issues
}

# Setup new environment
setup_environment() {
    echo -e "${BLUE}🚀 Environment Setup${NC}"
    echo "==================="
    echo ""
    
    local env_file=".env.local"
    
    if [[ -f "$env_file" ]]; then
        echo -e "${YELLOW}⚠️ $env_file already exists${NC}"
        echo "Choose action:"
        echo "1) Backup and replace"
        echo "2) Update existing"
        echo "3) Cancel"
        read -p "Enter choice (1-3): " choice
        
        case $choice in
            1)
                local backup_file="${env_file}.backup.$(date +%Y%m%d-%H%M%S)"
                cp "$env_file" "$backup_file"
                echo -e "${GREEN}✅ Backed up to $backup_file${NC}"
                audit_log "BACKUP" "Backed up $env_file to $backup_file"
                ;;
            2)
                echo "Updating existing file..."
                ;;
            3)
                echo "Setup cancelled."
                return 0
                ;;
            *)
                echo -e "${RED}Invalid choice${NC}"
                return 1
                ;;
        esac
    fi
    
    echo ""
    echo -e "${CYAN}Setting up secure environment variables...${NC}"
    echo ""
    
    # Create or update .env.local
    cat > "$env_file" << 'EOF'
# ClaimGuardian Secure Environment Configuration
# Generated by secure-env-manager.sh
# DO NOT COMMIT THIS FILE TO GIT

# ============================================
# NODE CONFIGURATION
# ============================================
NODE_OPTIONS="--max_old_space_size=4096"
TURBO_TELEMETRY_DISABLED="1"

# ============================================
# SUPABASE (Required)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# ============================================
# AI SERVICES (Required)
# ============================================
OPENAI_API_KEY=
GEMINI_API_KEY=

# ============================================
# EMAIL SERVICE (Required)
# ============================================
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@claimguardianai.com

# ============================================
# EXTERNAL APIS (Optional)
# ============================================
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# ============================================
# SECURITY (Required)
# ============================================
SESSION_SECRET=
ENCRYPTION_KEY=
ENCRYPTION_KEY_PREVIOUS=

# ============================================
# MONITORING (Optional)
# ============================================
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=

# ============================================
# CONFIGURATION
# ============================================
NEXT_PUBLIC_SITE_URL=https://claimguardianai.com
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
SESSION_MAX_AGE=3600
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
EOF

    # Generate secure keys
    echo -e "${CYAN}Generating secure keys...${NC}"
    
    local session_secret=$(generate_secure_key 32)
    local encryption_key=$(generate_secure_key 32)
    
    # Update generated keys in file
    sed -i.tmp "s/^SESSION_SECRET=$/SESSION_SECRET=$session_secret/" "$env_file"
    sed -i.tmp "s/^ENCRYPTION_KEY=$/ENCRYPTION_KEY=$encryption_key/" "$env_file"
    rm "${env_file}.tmp"
    
    echo -e "${GREEN}✅ Generated SESSION_SECRET${NC}"
    echo -e "${GREEN}✅ Generated ENCRYPTION_KEY${NC}"
    
    # Set secure permissions
    chmod 600 "$env_file"
    echo -e "${GREEN}✅ Set secure file permissions (600)${NC}"
    
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Add your API keys to $env_file"
    echo "2. Run: ./scripts/secure-env-manager.sh validate"
    echo "3. Test your application: pnpm dev"
    echo ""
    
    audit_log "SETUP" "Created new environment configuration"
}

# Rotate keys securely
rotate_keys() {
    echo -e "${BLUE}🔄 Key Rotation${NC}"
    echo "==============="
    echo ""
    
    if [[ ! -f ".env.local" ]]; then
        echo -e "${RED}❌ .env.local not found${NC}"
        return 1
    fi
    
    # Backup current environment
    local backup_file=".env.local.pre-rotation.$(date +%Y%m%d-%H%M%S)"
    cp ".env.local" "$backup_file"
    echo -e "${GREEN}✅ Backed up current environment to $backup_file${NC}"
    
    echo "Select keys to rotate:"
    echo "1) SESSION_SECRET"
    echo "2) ENCRYPTION_KEY"
    echo "3) Both"
    echo "4) All API keys (manual)"
    read -p "Enter choice (1-4): " choice
    
    case $choice in
        1|3)
            local new_session_secret=$(generate_secure_key 32)
            sed -i.tmp "s/^SESSION_SECRET=.*/SESSION_SECRET=$new_session_secret/" .env.local
            rm .env.local.tmp
            echo -e "${GREEN}✅ Rotated SESSION_SECRET${NC}"
            ;;
    esac
    
    case $choice in
        2|3)
            # For ENCRYPTION_KEY, we need to keep the old one as ENCRYPTION_KEY_PREVIOUS
            local current_key=$(grep "^ENCRYPTION_KEY=" .env.local | cut -d'=' -f2)
            local new_key=$(generate_secure_key 32)
            
            sed -i.tmp "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$new_key/" .env.local
            sed -i.tmp "s/^ENCRYPTION_KEY_PREVIOUS=.*/ENCRYPTION_KEY_PREVIOUS=$current_key/" .env.local
            rm .env.local.tmp
            
            echo -e "${GREEN}✅ Rotated ENCRYPTION_KEY${NC}"
            echo -e "${YELLOW}⚠️ Previous key saved as ENCRYPTION_KEY_PREVIOUS${NC}"
            echo -e "${YELLOW}   Remove ENCRYPTION_KEY_PREVIOUS after 24h${NC}"
            ;;
    esac
    
    if [[ $choice -eq 4 ]]; then
        echo ""
        echo -e "${YELLOW}📋 Manual API Key Rotation Checklist:${NC}"
        echo "□ OpenAI: Generate new key at https://platform.openai.com/api-keys"
        echo "□ Gemini: Generate new key at https://makersuite.google.com/app/apikey"
        echo "□ Resend: Generate new key at https://resend.com/api-keys"
        echo "□ Google Maps: Generate new key at https://console.cloud.google.com/apis/credentials"
        echo "□ Supabase: Generate new keys at https://supabase.com/dashboard/project/_/settings/api"
        echo "□ Update keys in .env.local"
        echo "□ Update keys in Vercel environment variables"
        echo "□ Test all functionality"
        echo "□ Revoke old keys after 24h"
    fi
    
    audit_log "KEY_ROTATION" "Rotated keys (choice: $choice)"
    
    echo ""
    echo -e "${GREEN}🔄 Key rotation completed${NC}"
    echo -e "${YELLOW}⚠️ Don't forget to update production environment variables${NC}"
}

# Deploy to Vercel with validation
deploy_to_vercel() {
    echo -e "${BLUE}☁️ Vercel Deployment${NC}"
    echo "=================="
    echo ""
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not installed${NC}"
        echo "Install: npm i -g vercel"
        return 1
    fi
    
    # Validate local environment first
    if ! check_env_security > /dev/null; then
        echo -e "${RED}❌ Local environment has security issues${NC}"
        echo "Fix issues first, then try again"
        return 1
    fi
    
    echo -e "${CYAN}Deploying environment variables to Vercel...${NC}"
    echo ""
    
    # List of sensitive variables that should be deployed
    local production_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "SUPABASE_JWT_SECRET"
        "OPENAI_API_KEY"
        "GEMINI_API_KEY"
        "RESEND_API_KEY"
        "RESEND_FROM_EMAIL"
        "SESSION_SECRET"
        "ENCRYPTION_KEY"
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
        "NEXT_PUBLIC_SITE_URL"
        "NEXT_PUBLIC_DEBUG_MODE"
        "SENTRY_AUTH_TOKEN"
        "NEXT_PUBLIC_SENTRY_DSN"
    )
    
    for var in "${production_vars[@]}"; do
        local value=$(grep "^${var}=" .env.local 2>/dev/null | cut -d'=' -f2- | tr -d '"')
        
        if [[ -n "$value" && "$value" != "" ]]; then
            echo "Adding $var to Vercel..."
            
            # Add to production and preview
            if echo "$value" | vercel env add "$var" production --force >/dev/null 2>&1; then
                echo -e "   ${GREEN}✅ Added to production${NC}"
            else
                echo -e "   ${RED}❌ Failed to add to production${NC}"
            fi
            
            if echo "$value" | vercel env add "$var" preview --force >/dev/null 2>&1; then
                echo -e "   ${GREEN}✅ Added to preview${NC}"
            else
                echo -e "   ${RED}❌ Failed to add to preview${NC}"
            fi
        else
            echo -e "   ${YELLOW}⚠️ ${var} is empty, skipping${NC}"
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ Environment variables deployed to Vercel${NC}"
    echo -e "${CYAN}Next: Deploy your application${NC}"
    echo "   vercel --prod"
    
    audit_log "DEPLOY" "Deployed environment variables to Vercel"
}

# Validate environment
validate_environment() {
    echo -e "${BLUE}✅ Environment Validation${NC}"
    echo "========================="
    echo ""
    
    check_env_security
    
    echo ""
    echo -e "${CYAN}Testing API connections...${NC}"
    
    # Test Supabase connection
    local supabase_url=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local 2>/dev/null | cut -d'=' -f2- | tr -d '"')
    if [[ -n "$supabase_url" ]]; then
        if curl -s "$supabase_url/rest/v1/" > /dev/null; then
            echo -e "   ${GREEN}✅ Supabase connection OK${NC}"
        else
            echo -e "   ${RED}❌ Supabase connection failed${NC}"
        fi
    fi
    
    # Test OpenAI API
    local openai_key=$(grep "^OPENAI_API_KEY=" .env.local 2>/dev/null | cut -d'=' -f2- | tr -d '"')
    if [[ -n "$openai_key" ]]; then
        local response=$(curl -s -w "%{http_code}" -o /dev/null \
            -H "Authorization: Bearer $openai_key" \
            -H "Content-Type: application/json" \
            "https://api.openai.com/v1/models")
        
        if [[ "$response" == "200" ]]; then
            echo -e "   ${GREEN}✅ OpenAI API connection OK${NC}"
        else
            echo -e "   ${RED}❌ OpenAI API connection failed (HTTP $response)${NC}"
        fi
    fi
    
    audit_log "VALIDATE" "Environment validation completed"
}

# Show help
show_help() {
    echo -e "${BLUE}ClaimGuardian Secure Environment Manager${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo -e "  ${CYAN}setup${NC}     - Create new secure environment configuration"
    echo -e "  ${CYAN}validate${NC}   - Validate current environment security"
    echo -e "  ${CYAN}rotate${NC}     - Rotate encryption keys securely"
    echo -e "  ${CYAN}deploy${NC}     - Deploy environment variables to Vercel"
    echo -e "  ${CYAN}audit${NC}      - Show security audit log"
    echo -e "  ${CYAN}help${NC}       - Show this help message"
    echo ""
    echo "Security Features:"
    echo "  • API key format validation"
    echo "  • Secure key generation"
    echo "  • File permission enforcement"
    echo "  • Git ignore verification"
    echo "  • Key rotation with backward compatibility"
    echo "  • Production deployment validation"
    echo "  • Comprehensive audit logging"
    echo ""
}

# Show audit log
show_audit() {
    echo -e "${BLUE}📋 Security Audit Log${NC}"
    echo "===================="
    echo ""
    
    if [[ -f "$AUDIT_LOG" ]]; then
        tail -20 "$AUDIT_LOG"
    else
        echo "No audit log found"
    fi
}

# Main command handling
case "${1:-help}" in
    "setup")
        setup_environment
        ;;
    "validate")
        validate_environment
        ;;
    "rotate")
        rotate_keys
        ;;
    "deploy")
        deploy_to_vercel
        ;;
    "audit")
        show_audit
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac