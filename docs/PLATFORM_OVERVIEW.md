# ClaimGuardian Platform Overview

## Table of Contents
1. [Platform Architecture](#platform-architecture)
2. [Authentication & Security](#authentication--security)
3. [AI-Powered Features](#ai-powered-features)
4. [Data Collection](#data-collection)
5. [Logging & Monitoring](#logging--monitoring)
6. [Development Guide](#development-guide)

---

## Platform Architecture

ClaimGuardian is a comprehensive AI-powered insurance claim advocacy platform specifically designed for Florida homeowners. Built with modern web technologies and a security-first approach.

### Technology Stack
- **Frontend**: Next.js 15.3.5, React 19.0.0, TypeScript 5.8.3
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI Integration**: OpenAI GPT-4, Google Gemini Pro Vision, Custom MCP Server
- **Infrastructure**: Vercel, Turborepo monorepo
- **Styling**: Tailwind CSS, shadcn/ui components
- **Package Manager**: pnpm 10.13.1
- **Node.js**: 22+ required

### Project Structure
```
ClaimGuardian/
├── apps/
│   └── web/                 # Next.js application
├── packages/
│   ├── ui/                  # Shared React components
│   ├── utils/               # Shared utilities
│   ├── config/              # Shared configuration
│   ├── ai-config/           # AI configuration and prompts
│   ├── db/                  # Database types and Supabase client
│   └── mcp-server/          # Model Context Protocol server
├── docs/                    # Documentation
├── supabase/               # Database migrations and functions
└── legal/                  # Legal documents
```

---

## Authentication & Security

### Multi-Layer Security Architecture

1. **Middleware Protection** (`/apps/web/src/middleware.ts`)
   - Server-side route protection
   - Session validation
   - Request logging
   - Security headers injection

2. **Client-Side Protection** (`/apps/web/src/components/auth/protected-route.tsx`)
   - Component-based route guarding
   - Loading states during auth checks
   - Automatic redirects for unauthenticated users

3. **Legal Compliance** (`/apps/web/src/lib/auth/legal-guard.tsx`)
   - Terms of service acceptance tracking
   - Privacy policy compliance
   - GDPR/CCPA considerations

### Authentication Features
- Email/password authentication
- Email verification
- Password reset/recovery
- Security questions for account recovery
- Session management with auto-refresh
- Login activity tracking
- Rate limiting
- Remember me functionality

### Security Measures
- HTTPS enforcement
- XSS protection
- CSRF protection
- SQL injection prevention (via Supabase RLS)
- Content Security Policy headers
- Rate limiting on auth endpoints
- Comprehensive audit logging

For detailed implementation, see:
- [Authentication Implementation Guide](./setup/AUTH_IMPLEMENTATION.md)
- [Authentication Quick Reference](./setup/AUTH_QUICK_REFERENCE.md)
- [Deployment Checklist](./setup/AUTH_DEPLOYMENT_CHECKLIST.md)

---

## AI-Powered Features

### 1. Policy Chat Advisor
- **Models**: OpenAI GPT-4, Google Gemini Pro
- **Purpose**: Interactive policy understanding and coverage analysis
- **Features**:
  - Multi-document support
  - Policy comparison
  - Florida-specific insurance guidance
  - Coverage gap identification

### 2. AI Damage Analyzer
- **Models**: GPT-4 Vision, Gemini Vision
- **Purpose**: Automated damage assessment from photos
- **Features**:
  - Multi-image analysis
  - Damage severity classification
  - Repair cost estimation
  - Safety hazard detection
  - Professional report generation

### 3. Inventory Scanner
- **Models**: GPT-4 Vision, Gemini Vision
- **Purpose**: Automated home inventory cataloging
- **Features**:
  - Room-by-room scanning
  - Barcode scanning integration
  - Value estimation
  - Category organization
  - Export capabilities

### 4. MCP Server Integration
- Custom Model Context Protocol server
- Enhanced context management
- Supabase integration for AI operations
- Real-time data access for AI models

For detailed AI implementation, see:
- [AI Features Roadmap](./AI_FEATURES_ROADMAP.md)
- [AI Features & Improvements](../apps/web/src/app/ai-augmented/AI_FEATURES_IMPROVEMENTS.md)
- [AI Models & Prompts Guide](../apps/web/src/app/ai-augmented/AI_MODELS_AND_PROMPTS.md)

---

## Data Collection

ClaimGuardian implements comprehensive data collection for insurance claims, property management, and risk assessment.

### Core Data Categories
1. **Policy & Coverage** - Complete insurance policy details
2. **Property Information** - Physical characteristics and location data
3. **Damage Documentation** - Structural and contents damage tracking
4. **Financial Tracking** - Payments, estimates, and expenses
5. **Legal & Compliance** - Florida statute compliance tracking
6. **External Data Integration** - Weather, real estate, and environmental data

### Data Sources
- **Google Maps Platform** - Location, elevation, street view, environmental data
- **Real Estate APIs** - Property valuations, market data
- **Weather Services** - NOAA/NWS historical and forecast data
- **IoT Integration** - Smart home sensors and telemetry

For the complete data collection framework, see:
- [Comprehensive Data Collection Guide](./DATA_COLLECTION_COMPREHENSIVE.md)

---

## Logging & Monitoring

### Enhanced Logging System
Located at `/apps/web/src/lib/logger/enhanced-logger.ts`

#### Logging Categories
1. **Authentication Events**
   - Login attempts, successes, and failures
   - Session events (start, refresh, expire)
   - Security events and anomalies

2. **Route Access**
   - Protected route access attempts
   - Blocked access logging
   - Navigation tracking

3. **API Operations**
   - Request/response logging
   - Performance metrics
   - Error tracking

4. **AI Operations**
   - Model usage tracking
   - Token consumption
   - Operation success/failure rates

5. **Business Operations**
   - Claim actions
   - Property management
   - Document operations

### Monitoring Features
- Real-time error tracking with Sentry
- Performance monitoring
- User activity analytics
- Security event alerting
- Compliance audit trails

---

## Development Guide

### Prerequisites
- Node.js >= 22.0.0
- pnpm 10.12.4
- Supabase CLI
- Git

### Getting Started
```bash
# Clone the repository
git clone <repository-url>
cd ClaimGuardian

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Configure Supabase and API keys

# Run development server
pnpm dev
```

### Key Commands
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm test         # Run tests
pnpm lint         # Run linting
pnpm type-check   # TypeScript validation
pnpm validate     # Run all checks
```

### Development Workflow
1. Create feature branch from `main`
2. Implement changes following coding standards
3. Add tests for new functionality
4. Run `pnpm validate` before committing
5. Use conventional commits (`pnpm cz`)
6. Create pull request with detailed description

### Coding Standards
- TypeScript strict mode enabled
- ESLint and Prettier configured
- Component-based architecture
- Server-side rendering where appropriate
- Comprehensive error handling
- Accessibility (WCAG 2.1 AA compliance)

---

## Additional Resources

### Documentation
- [Supabase Setup Guide](./setup/SUPABASE_SETUP.md)
- [Legal Compliance Guide](./setup/LEGAL_COMPLIANCE.md)
- [API Endpoints Reference](./setup/API_LEGAL_ENDPOINTS.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Google AI Documentation](https://ai.google.dev/)

---

## Support & Contact

For questions or support:
- Technical Issues: Create a GitHub issue
- Security Concerns: security@claimguardian.com
- General Inquiries: support@claimguardian.com

---

*Last Updated: January 2025*