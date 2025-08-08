# ClaimGuardian Secure Environment Management Guide

**Comprehensive guide to secure environment variable management for ClaimGuardian**

## 🔐 Overview

ClaimGuardian implements enterprise-grade security for environment variable management with:

- **Automatic validation** with format checking and security enforcement
- **Encryption at rest** for sensitive data using AES-256-GCM
- **Key rotation support** with backward compatibility
- **Runtime security checks** with connection validation
- **Audit logging** for compliance and security monitoring
- **Secure deployment** with Vercel integration

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Run the secure environment manager
./scripts/secure-env-manager.sh setup

# This will:
# - Create .env.local with secure template
# - Generate SESSION_SECRET and ENCRYPTION_KEY
# - Set proper file permissions (600)
# - Initialize audit logging
```

### 2. Add Your API Keys

Edit `.env.local` and add your API keys:

```bash
# Required: Get from https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Required: AI Services
OPENAI_API_KEY=sk-proj-...  # Get from https://platform.openai.com/api-keys
GEMINI_API_KEY=AIza...      # Get from https://makersuite.google.com/app/apikey

# Required: Email Service
RESEND_API_KEY=re_...       # Get from https://resend.com/api-keys

# Optional: Google Maps (for address verification)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...  # Get from Google Cloud Console
```

### 3. Validate Configuration

```bash
# Validate all environment variables
./scripts/secure-env-manager.sh validate

# This will:
# - Check API key formats
# - Test API connections
# - Verify security settings
# - Generate security report
```

### 4. Deploy to Production

```bash
# Deploy environment variables to Vercel
./scripts/secure-env-manager.sh deploy

# Then deploy your application
vercel --prod
```

## 🛡️ Security Features

### Environment Variable Classification

All environment variables are classified by security level:

- **🌍 PUBLIC** - Can be exposed to client (e.g., `NEXT_PUBLIC_*`)
- **🔒 INTERNAL** - Server-side only, low sensitivity
- **🔐 SENSITIVE** - Server-side only, medium sensitivity
- **🗝️ SECRET** - Server-side only, API keys and tokens
- **⚡ CRITICAL** - Server-side only, encryption keys

### Automatic Validation

The system automatically validates:

```typescript
// API key formats
OPENAI_API_KEY: /^sk-[a-zA-Z0-9]{48,}$/
GEMINI_API_KEY: /^[A-Za-z0-9_-]{39}$/
SUPABASE_*_KEY: /^eyJ[A-Za-z0-9_-]{40,}$/

// Security requirements
SESSION_SECRET: minimum 32 characters
ENCRYPTION_KEY: exactly 44 characters (base64)

// URL formats
NEXT_PUBLIC_SUPABASE_URL: https://*.supabase.co
```

### Runtime Security Checks

```typescript
import { validateRuntimeEnvironment } from '@/lib/env-runtime-validator';

// Validate on application startup
await validateRuntimeEnvironment();

// This checks:
// - All required variables are present
// - Formats are correct
// - API connections work
// - Security settings are proper
```

## 🔄 Key Rotation

### Automated Rotation

```bash
# Rotate session and encryption keys
./scripts/secure-env-manager.sh rotate

# Choose what to rotate:
# 1) SESSION_SECRET only
# 2) ENCRYPTION_KEY only  
# 3) Both internal keys
# 4) All API keys (manual checklist)
```

### Manual API Key Rotation

For API keys, follow this secure rotation process:

1. **Generate new keys** in service provider dashboards
2. **Update `.env.local`** with new keys
3. **Validate locally**: `./scripts/secure-env-manager.sh validate`
4. **Deploy to Vercel**: `./scripts/secure-env-manager.sh deploy`
5. **Test in production** thoroughly
6. **Revoke old keys** after 24 hours

### Rotation Schedule

- **CRITICAL keys** (SESSION_SECRET, ENCRYPTION_KEY): 30 days
- **SECRET keys** (API keys): 30-90 days depending on usage
- **SENSITIVE keys**: 90 days
- **PUBLIC keys**: 180 days or as needed

## 🗂️ Environment Files Structure

```
.env.local              # Local development (NEVER commit)
.env.example            # Template with empty values
.env.security.example   # Comprehensive security template
.env.production         # Production template (NEVER commit)

.vault/                 # Secure vault directory
├── audit.log          # Security audit trail
├── backups/           # Encrypted backups
└── metadata.json      # Key rotation metadata
```

## 🔍 Security Monitoring

### Audit Logging

All security operations are logged:

```bash
# View recent security events
./scripts/secure-env-manager.sh audit

# Example log entries:
# 2025-01-08 12:00:00 UTC - SETUP - User: john - Created new environment
# 2025-01-08 12:15:00 UTC - VALIDATE - User: john - 0 issues, 2 warnings
# 2025-01-08 12:30:00 UTC - KEY_ROTATION - User: john - Rotated SESSION_SECRET
```

### Runtime Monitoring

```typescript
import { useEnvironmentValidation } from '@/lib/env-runtime-validator';

function MyComponent() {
  const { validateVariable, needsRevalidation } = useEnvironmentValidation();
  
  // Check if specific variable is valid
  const isValidKey = validateVariable('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
  
  // Check if revalidation is needed (every 5 minutes)
  if (needsRevalidation()) {
    // Trigger background revalidation
  }
}
```

## 🚀 Production Deployment

### Vercel Environment Variables

**Required Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL          # Public
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Public  
SUPABASE_SERVICE_ROLE_KEY         # Secret
OPENAI_API_KEY                    # Secret
GEMINI_API_KEY                    # Secret
RESEND_API_KEY                    # Secret
SESSION_SECRET                    # Secret
ENCRYPTION_KEY                    # Secret
```

**Optional Variables:**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY   # Public (with domain restrictions)
SENTRY_AUTH_TOKEN                 # Secret
NEXT_PUBLIC_SENTRY_DSN           # Public
```

### Security Configuration

```bash
# Production security settings
RATE_LIMIT_WINDOW_MS=60000        # 1 minute
RATE_LIMIT_MAX_REQUESTS=30        # Per window per IP
SESSION_MAX_AGE=3600              # 1 hour
DATABASE_POOL_MIN=2               # Minimum connections
DATABASE_POOL_MAX=10              # Maximum connections
```

### Domain Restrictions

**Google Maps API Key Restrictions:**
- `https://claimguardianai.com/*`
- `https://*.vercel.app/*` 
- `http://localhost:3000/*` (development only)

**Supabase RLS Policies:**
- Row Level Security enabled on all tables
- User isolation enforced
- Service role used only for server-side operations

## 🧪 Testing and Validation

### Local Development Testing

```bash
# Full environment validation
pnpm test:env

# This runs:
# - Format validation
# - API connection tests  
# - Security configuration checks
# - Performance benchmarks
```

### Production Health Checks

```bash
# Check production environment health
curl https://claimguardianai.com/api/health/env

# Response includes:
{
  "status": "healthy",
  "environment": "production", 
  "validations": {
    "supabase": "connected",
    "openai": "connected",
    "security": "configured"
  }
}
```

## 🚨 Security Incidents

### Key Compromise Response

If an API key is compromised:

1. **Immediate Response** (within 5 minutes)
   ```bash
   # Revoke the compromised key immediately
   # - Go to service provider dashboard
   # - Revoke/delete the compromised key
   # - Check audit logs for unauthorized usage
   ```

2. **Generate New Key** (within 15 minutes)
   ```bash
   # Generate new key and update environments
   ./scripts/secure-env-manager.sh rotate
   # Update production: ./scripts/secure-env-manager.sh deploy
   # Verify: ./scripts/secure-env-manager.sh validate
   ```

3. **Incident Documentation**
   - Document in audit log
   - Update incident response records
   - Review access patterns
   - Implement additional monitoring if needed

### Environment File Exposure

If `.env.local` is accidentally committed:

1. **Remove from Git History**
   ```bash
   # Remove from current commit
   git rm --cached .env.local
   git commit --amend --no-edit
   
   # Remove from history (if already pushed)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env.local' \
     --prune-empty --tag-name-filter cat -- --all
   ```

2. **Rotate All Keys**
   ```bash
   # Assume all keys are compromised
   ./scripts/secure-env-manager.sh rotate
   # Select option 4 for full API key rotation
   ```

3. **Verify Security**
   ```bash
   # Check git ignore is working
   echo "test" > .env.local
   git status # Should show file is ignored
   ```

## 🔧 Troubleshooting

### Common Issues

**"Missing required environment variable"**
```bash
# Check which variables are missing
./scripts/secure-env-manager.sh validate

# Add missing variables to .env.local
# Validate again until all checks pass
```

**"Invalid API key format"**
```bash
# Check the format requirements
./scripts/secure-env-manager.sh help

# Common issues:
# - Extra spaces or quotes in .env.local
# - Wrong key type (client ID vs API key)
# - Truncated key during copy/paste
```

**"API connection failed"**
```bash
# Test individual API connections
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Common issues:
# - API key not activated
# - Billing not enabled
# - Rate limits exceeded
# - Network connectivity
```

### Debug Mode

```bash
# Enable debug mode for detailed logging
export NEXT_PUBLIC_DEBUG_MODE=true
pnpm dev

# This will show:
# - Detailed validation steps
# - API connection attempts
# - Security check results
# - Performance metrics
```

## 📖 Best Practices

### Development

- ✅ Never commit `.env.local` files
- ✅ Use different keys for development/staging/production
- ✅ Validate environment before each deployment
- ✅ Rotate keys according to schedule
- ✅ Monitor audit logs regularly
- ❌ Don't share environment files via messaging/email
- ❌ Don't use production keys in development
- ❌ Don't skip validation in CI/CD

### Production

- ✅ Use Vercel environment variables (encrypted at rest)
- ✅ Enable domain restrictions on public API keys
- ✅ Monitor API usage and set up alerts
- ✅ Keep encryption keys separate from other secrets
- ✅ Implement proper backup and recovery procedures
- ❌ Don't log full API keys anywhere
- ❌ Don't store keys in code or databases
- ❌ Don't use weak or predictable keys

### Team Collaboration

- ✅ Use secure password managers for key sharing
- ✅ Document key rotation in team calendar
- ✅ Assign key ownership and rotation responsibility
- ✅ Train team on security procedures
- ✅ Implement code review for environment changes
- ❌ Don't share keys via Slack/email/unencrypted channels
- ❌ Don't let keys expire without rotation planning

## 🆘 Support

- **Documentation**: This guide and inline code comments
- **Tools**: `./scripts/secure-env-manager.sh help`
- **Validation**: `./scripts/secure-env-manager.sh validate`
- **Audit Trail**: `./scripts/secure-env-manager.sh audit`

**For security incidents or questions:**
- Review audit logs first
- Check troubleshooting section
- Validate environment configuration
- Document any issues for future reference

---

**Security is everyone's responsibility. Keep your environment variables secure! 🔐**