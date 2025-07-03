# ClaimGuardian

A comprehensive insurance claims management platform built with modern web technologies.

## 🏗️ Architecture

This is a monorepo built with **Turborepo** and **pnpm** workspaces, containing:

### Apps
- **`apps/web`** - Next.js web application (customer-facing)
- **`apps/admin`** - Admin dashboard (planned)
- **`apps/mobile`** - React Native mobile app (planned)
- **`apps/api`** - Backend API service (planned)
- **`apps/auth`** - Authentication service (planned)

### Packages
- **`packages/ui`** - Shared UI components
- **`packages/types`** - TypeScript type definitions
- **`packages/utils`** - Utility functions
- **`packages/api-client`** - API client library
- **`packages/database`** - Database models and migrations
- **`packages/security-middleware`** - Security middleware
- **`packages/ai-services`** - AI integration services

### Libraries
- **`libs/policy-engine`** - Business logic for policy processing
- **`libs/risk-scoring`** - Risk assessment algorithms

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ClaimGuardian

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Development

```bash
# Start the development server
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## 📁 Project Structure

```
ClaimGuardian/
├── apps/
│   ├── web/          # Next.js web application
│   ├── admin/        # Admin dashboard
│   ├── mobile/       # Mobile application
│   ├── api/          # API service
│   └── auth/         # Authentication service
├── packages/
│   ├── ui/           # Shared UI components
│   ├── types/        # TypeScript types
│   ├── utils/        # Utility functions
│   ├── api-client/   # API client
│   ├── database/     # Database layer
│   ├── security-middleware/ # Security
│   └── ai-services/  # AI services
├── libs/
│   ├── policy-engine/ # Policy processing
│   └── risk-scoring/  # Risk assessment
├── infrastructure/   # Infrastructure configs
├── tools/           # Development tools
└── docs/           # Documentation
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Node.js, tRPC, Prisma
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Build Tool**: Turborepo
- **Package Manager**: pnpm
- **Deployment**: Vercel

## 📝 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Database
DATABASE_URL=your_database_url

# AI Services
OPENAI_API_KEY=your_openai_api_key
```

## 🚀 Deployment

The project is configured for deployment on Vercel with the following settings:

- **Build Command**: `cd apps/web && pnpm install && pnpm build`
- **Output Directory**: `apps/web/.next`
- **Framework**: Next.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@claimguardian.com or join our Slack channel. 