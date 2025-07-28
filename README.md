# ClaimGuardian

<div align="center">
  <img src="https://claimguardianai.com/logo.png" alt="ClaimGuardian Logo" width="200"/>
  
  **AI-Powered Property Intelligence Platform for Florida Homeowners**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
  [![pnpm](https://img.shields.io/badge/pnpm-10.13.1-orange)](https://pnpm.io/)
  [![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)
</div>

## 🚀 Overview

ClaimGuardian transforms property ownership from a source of anxiety into an opportunity for optimization. By creating comprehensive digital twins of properties and leveraging advanced AI capabilities, we provide:

- **🛡️ Proactive Risk Management** - AI-powered damage detection and insurance claim assistance
- **📊 Property Intelligence** - Complete digital twins with predictive maintenance
- **🤝 Community Resilience** - Neighbor-driven insights and verified contractor networks
- **⚡ Florida-Optimized** - Built specifically for Florida's unique insurance challenges

## 🏗️ Architecture

```
ClaimGuardian/
├── apps/web/              # Next.js 15 application
├── packages/
│   ├── ui/                # Shared React components
│   ├── utils/             # Shared utilities
│   ├── config/            # Shared configuration
│   ├── ai-config/         # AI prompts and configurations
│   ├── db/                # Database types and Supabase client
│   └── mcp-server/        # Model Context Protocol server
├── supabase/              # Database schema and edge functions
├── docs/                  # Documentation
└── scripts/               # Automation and deployment scripts
```

## 🚦 Quick Start

### Prerequisites

- **Node.js 22+** (Required)
- **pnpm 10.13.1** (Required)
- **Supabase Account** (For backend services)
- **Git** (For version control)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/claimguardian.git
cd claimguardian

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Set up your environment variables
# See docs/setup/SUPABASE_SETUP.md for detailed instructions
```

### Development

```bash
# Start development server
pnpm dev

# Run all validation checks
pnpm validate

# Fix lint issues automatically
pnpm lint:fix

# Run type checking
pnpm type-check

# Run tests
pnpm test
```

### Building for Production

```bash
# Build all packages
pnpm build

# Run production build locally
pnpm start
```

## 🧩 Key Features

### AI-Powered Tools
- **Damage Analyzer** - Computer vision for instant damage assessment
- **Policy Chat** - Natural language policy understanding
- **Claim Assistant** - Step-by-step claim guidance
- **3D Model Generator** - Photogrammetry from multiple images
- **Settlement Analyzer** - Fair settlement evaluation
- **Evidence Organizer** - Smart document categorization

### Florida Data Platform
- **FLOIR Integration** - Real-time insurance regulation data
- **Property Data** - 10M+ Florida property records with AI enrichment
- **Spatial Analysis** - PostGIS-powered risk assessment
- **Semantic Search** - Vector-based intelligent search

### Security & Compliance
- **Multi-layer Authentication** - Supabase Auth with 2FA
- **Row-Level Security** - Database-level access control
- **Legal Compliance** - GDPR/CCPA compliant consent tracking
- **Audit Trails** - Complete activity logging

## 📖 Documentation

- **[Platform Overview](./docs/PLATFORM_OVERVIEW.md)** - Complete architecture guide
- **[Setup Guide](./docs/setup/SUPABASE_SETUP.md)** - Detailed setup instructions
- **[AI Features](./docs/AI_FEATURES_ROADMAP.md)** - AI capabilities and roadmap
- **[Contributing](./CONTRIBUTING.md)** - How to contribute
- **[Claude AI Instructions](./CLAUDE.md)** - AI assistant guidelines

## 🔧 Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Features (Optional)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-key

# Google Services (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key

# Monitoring (Optional)
SENTRY_AUTH_TOKEN=your-sentry-token
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:
- Code style and standards
- Development workflow
- Testing requirements
- Pull request process

## 🛠️ Development Tools

### Pre-commit Hooks
Automated checks run before each commit:
- Dependency validation
- Lint auto-fixing
- Type checking
- Test execution

### Common Commands
```bash
pnpm validate      # Run all checks
pnpm lint:fix      # Auto-fix lint issues
pnpm deps:update   # Update dependencies
pnpm db:types      # Generate TypeScript types from database
pnpm cz            # Commit with conventional format
```

## 📱 Deployment

The project is optimized for deployment on:
- **Vercel** - Frontend hosting (automatic deployments)
- **Supabase** - Backend services (database, auth, storage)
- **GitHub Actions** - CI/CD pipeline

See [Deployment Guide](./docs/deployment/README.md) for detailed instructions.

## 🔐 Security

- All data encrypted at rest and in transit
- Regular security audits and dependency updates
- Bug bounty program (coming soon)
- Security issues: security@claimguardianai.com

## 📄 License

ClaimGuardian is proprietary software. All rights reserved.

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Turborepo](https://turbo.build/) - Monorepo management

---

<div align="center">
  <strong>Built with ❤️ for Florida homeowners</strong>
  <br>
  <a href="https://claimguardianai.com">Website</a> •
  <a href="https://docs.claimguardianai.com">Documentation</a> •
  <a href="mailto:support@claimguardianai.com">Support</a>
</div>