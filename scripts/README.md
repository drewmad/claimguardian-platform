# Scripts Directory Guide

## Structure Overview
```
scripts/
├── core/                   # Core development scripts
│   ├── dev.sh             # Development environment setup
│   ├── build.sh           # Build orchestration
│   ├── data.sh            # Data management
│   └── db.sh              # Database operations
├── data-import/           # Data ingestion scripts
│   ├── parcels/           # Florida parcel imports
│   ├── properties/        # Property data imports
│   └── florida/           # Florida-specific data
├── database/              # Database management
│   ├── migrations/        # Migration scripts
│   ├── backups/           # Backup utilities
│   └── optimization/      # Performance tuning
├── automation/            # Automated processes
│   ├── ai/                # AI-related automation
│   ├── monitoring/        # System monitoring
│   └── reporting/         # Report generation
├── deployment/            # Deployment utilities
│   ├── vercel/            # Vercel deployment
│   ├── supabase/          # Supabase deployment
│   └── docker/            # Docker configurations
├── testing/               # Test runners
└── utilities/             # General purpose tools

## Key Scripts

### Development
- `dev.sh` - Set up development environment
- `build.sh` - Build all packages and apps
- `data.sh` - Manage data imports and exports
- `db.sh` - Database schema and migration tools

### Database Operations
- `database/create-migration.sh` - Create new Supabase migration
- `database/migrations/apply-migration-cli.sh` - Apply migrations
- `database/backups/db-backup.sh` - Backup database

### Data Management
- `data-import/parcels/` - Florida parcel import scripts
- `data-import/run-parallel-import.sh` - Parallel data ingestion
- `data-import/verify-import-complete.js` - Validate imports

### Automation
- `automation/ai/ai-embeddings.js` - Generate AI embeddings
- `automation/monitoring/` - System monitoring scripts
- `automation/reporting/` - Generate reports

## Usage Examples

```bash
# Set up development environment
./scripts/dev.sh setup

# Create a new database migration
./scripts/database/create-migration.sh add_user_profiles

# Import Florida parcels
./scripts/data.sh import

# Build entire project
./scripts/build.sh all

# Backup database
./scripts/db.sh backup
```

## Best Practices

1. **Always use absolute paths** when calling scripts from other locations
2. **Check prerequisites** before running data import scripts
3. **Test migrations locally** before applying to production
4. **Document new scripts** with clear usage instructions
5. **Use common utilities** from `scripts/utils/common.sh`

## Environment Variables

Most scripts expect these environment variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `DATABASE_URL` - Direct database connection string

See `.env.example` for complete list.