# Scripts Directory - Claude.md

## Overview
The scripts directory contains essential development, deployment, and maintenance scripts for the ClaimGuardian platform. Updated for modern toolchain with pnpm 10.13.1, Node.js 24.3.0, and enhanced automation.

## Core Scripts

### Database Operations (`db.sh`)
Primary database management script with multiple subcommands.

```bash
# Schema management
./scripts/db.sh schema dump     # Export current production schema
./scripts/db.sh schema apply    # Apply schema.sql to database
./scripts/db.sh schema validate # Validate schema integrity

# Backup operations
./scripts/db.sh backup          # Create timestamped database backup
./scripts/db.sh restore         # Restore from backup file

# Migration management  
./scripts/db.sh migrate         # Apply pending migrations
./scripts/db.sh rollback        # Rollback last migration

# Development utilities
./scripts/db.sh reset           # Reset local development database
./scripts/db.sh seed            # Apply seed data
```

**Key Features:**
- Single source of truth: Uses `supabase/schema.sql` (not migrations)
- Production-safe: Validates operations before execution
- Backup integration: Automatic backups before destructive operations
- Type generation: Triggers TypeScript type updates

### Development Scripts (`dev.sh`)
Development environment management and utilities.

```bash
# Environment setup
./scripts/dev.sh setup          # Initial development setup
./scripts/dev.sh clean          # Clean build artifacts and caches
./scripts/dev.sh reset          # Full environment reset

# Code quality
./scripts/dev.sh lint           # Smart lint fixing with auto-repair
./scripts/dev.sh format         # Code formatting
./scripts/dev.sh typecheck      # Type checking across packages

# Testing
./scripts/dev.sh test           # Run all tests
./scripts/dev.sh test:watch     # Watch mode for active development
```

### Build Operations (`build.sh`)
Production build management and optimization.

```bash
# Build commands
./scripts/build.sh all          # Build all packages in dependency order
./scripts/build.sh web          # Build web application only
./scripts/build.sh packages     # Build shared packages only

# Optimization
./scripts/build.sh analyze      # Bundle analysis and size reporting
./scripts/build.sh optimize     # Apply build optimizations
./scripts/build.sh verify       # Verify build integrity
```

### Data Management (`data.sh`)
Large-scale data processing and import operations.

```bash
# Import operations
./scripts/data.sh import        # Parallel data import with progress tracking
./scripts/data.sh verify        # Verify import completion and integrity
./scripts/data.sh clean         # Clean processed data and temporary files

# Florida-specific data
./scripts/data.sh florida       # Import Florida property and parcel data
./scripts/data.sh parcels       # Process cadastral/parcel data
./scripts/data.sh monitor       # Monitor active import processes
```

## Utilities Directory (`utils/`)

### Data Import Utilities
```bash
# Parallel processing
./scripts/utils/data-import/run-parallel-import.sh          # High-performance imports
./scripts/utils/data-import/verify-import-complete.js       # Completion verification
./scripts/utils/data-import/benchmark-import-performance.sh # Performance testing

# Property data processing
python ./scripts/utils/data-import/analyze_cadastral_gdb.py # GDB file analysis
node ./scripts/utils/data-import/import_cadastral_gdb.js    # Cadastral data import
```

### Database Utilities
```bash
# Schema management
./scripts/utils/db/schema-diff.sh           # Compare schema versions
./scripts/utils/db/validate-rls.js          # Validate Row Level Security
./scripts/utils/db/check-constraints.sql    # Constraint verification
```

### Development Helpers
```bash
# Code analysis
./scripts/utils/validate-lockfile.js        # Package.json/lockfile validation
./scripts/utils/check-dependencies.sh       # Dependency health check
./scripts/utils/analyze-bundle.js           # Bundle size analysis
```

## Script Architecture Patterns

### Error Handling Standard
```bash
#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color coding for output
RED='\033[0;31m'
GREEN='\033[0;32m'  
BLUE='\033[0;34m'
NC='\033[0m' # No Color

error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Usage example
if [[ ! -f "package.json" ]]; then
    error "package.json not found. Run from project root."
fi

success "Script completed successfully"
```

### Progress Tracking Pattern
```bash
# Progress bar implementation
show_progress() {
    local current=$1
    local total=$2
    local desc=$3
    
    local percent=$((current * 100 / total))
    local bar_length=50
    local filled=$((current * bar_length / total))
    
    printf "\r%s [" "$desc"
    printf "%*s" "$filled" | tr ' ' '='
    printf "%*s" $((bar_length - filled)) | tr ' ' '-'
    printf "] %d%% (%d/%d)" "$percent" "$current" "$total"
}

# Usage
for i in $(seq 1 100); do
    show_progress $i 100 "Processing items"
    sleep 0.1
done
echo # New line after completion
```

### Configuration Management
```bash
# Load configuration with defaults
load_config() {
    local config_file="${1:-config/default.conf}"
    
    # Default values
    DATABASE_URL="${DATABASE_URL:-}"
    PARALLEL_JOBS="${PARALLEL_JOBS:-4}"
    BATCH_SIZE="${BATCH_SIZE:-1000}"
    
    # Load from file if exists
    if [[ -f "$config_file" ]]; then
        source "$config_file"
        info "Loaded configuration from $config_file"
    fi
    
    # Validate required variables
    if [[ -z "$DATABASE_URL" ]]; then
        error "DATABASE_URL is required"
    fi
}
```

## Database Script Patterns

### Schema Management
```bash
# schema_operations.sh
dump_schema() {
    local output_file="${1:-supabase/schema.sql}"
    
    info "Dumping database schema to $output_file"
    
    supabase db dump --schema-only > "$output_file.tmp"
    
    # Validate the dump
    if [[ -s "$output_file.tmp" ]]; then
        mv "$output_file.tmp" "$output_file"
        success "Schema dumped successfully"
    else
        rm -f "$output_file.tmp"
        error "Schema dump failed or produced empty file"
    fi
}

apply_schema() {
    local schema_file="${1:-supabase/schema.sql}"
    
    if [[ ! -f "$schema_file" ]]; then
        error "Schema file not found: $schema_file"
    fi
    
    info "Applying schema from $schema_file"
    
    # Create backup before applying
    backup_database
    
    # Apply the schema
    supabase db reset --linked
    
    success "Schema applied successfully"
}
```

### Migration Handling
```bash
# migration_operations.sh
apply_migrations() {
    local migration_dir="supabase/migrations"
    
    if [[ ! -d "$migration_dir" ]]; then
        info "No migrations directory found, skipping"
        return 0
    fi
    
    info "Applying database migrations"
    
    for migration in "$migration_dir"/*.sql; do
        if [[ -f "$migration" ]]; then
            info "Applying $(basename "$migration")"
            supabase db push
        fi
    done
    
    success "All migrations applied"
}
```

## Data Processing Scripts

### Parallel Import Pattern
```bash
# parallel_import.sh
run_parallel_import() {
    local data_dir="$1"
    local batch_size="${2:-1000}"
    local max_jobs="${3:-4}"
    
    info "Starting parallel import from $data_dir"
    info "Batch size: $batch_size, Max parallel jobs: $max_jobs"
    
    # Create job queue
    local job_queue=()
    while IFS= read -r -d '' file; do
        job_queue+=("$file")
    done < <(find "$data_dir" -name "*.json" -print0)
    
    local total_files=${#job_queue[@]}
    local completed=0
    
    # Process files in parallel
    export -f process_file
    printf '%s\n' "${job_queue[@]}" | \
        xargs -n 1 -P "$max_jobs" -I {} bash -c 'process_file "$@"' _ {}
    
    success "Parallel import completed: $total_files files processed"
}

process_file() {
    local file="$1"
    # Processing logic here
    echo "Processed: $(basename "$file")"
}
```

### Data Validation
```bash
# validate_import.sh
validate_import_results() {
    local table_name="$1"
    local expected_count="$2"
    
    info "Validating import results for table: $table_name"
    
    # Check record count
    local actual_count
    actual_count=$(supabase db query "SELECT COUNT(*) FROM $table_name" --csv | tail -n 1)
    
    if [[ "$actual_count" -eq "$expected_count" ]]; then
        success "Import validation passed: $actual_count records"
    else
        error "Import validation failed: expected $expected_count, got $actual_count"
    fi
    
    # Check for data integrity
    local null_count
    null_count=$(supabase db query "SELECT COUNT(*) FROM $table_name WHERE id IS NULL" --csv | tail -n 1)
    
    if [[ "$null_count" -gt 0 ]]; then
        error "Data integrity issue: $null_count records with null IDs"
    fi
    
    success "Data integrity validation passed"
}
```

## Performance Monitoring

### Execution Time Tracking
```bash
# timing.sh
measure_execution() {
    local command="$1"
    local description="${2:-Command}"
    
    info "Starting: $description"
    local start_time=$(date +%s)
    
    # Execute command
    eval "$command"
    local exit_code=$?
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ $exit_code -eq 0 ]]; then
        success "$description completed in ${duration}s"
    else
        error "$description failed after ${duration}s"
    fi
    
    return $exit_code
}

# Usage
measure_execution "pnpm build" "Build process"
measure_execution "./scripts/data.sh import" "Data import"
```

### Resource Monitoring
```bash
# monitor_resources.sh
monitor_system_resources() {
    local pid="$1"
    local log_file="${2:-resource_usage.log}"
    
    echo "timestamp,cpu%,memory_mb,disk_io" > "$log_file"
    
    while kill -0 "$pid" 2>/dev/null; do
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        local cpu_usage=$(ps -p "$pid" -o pcpu= | tr -d ' ')
        local memory_mb=$(ps -p "$pid" -o rss= | awk '{print $1/1024}')
        local disk_io=$(iostat -d 1 1 | tail -n 1 | awk '{print $3+$4}')
        
        echo "$timestamp,$cpu_usage,$memory_mb,$disk_io" >> "$log_file"
        sleep 5
    done
}
```

## Testing Scripts

### Integration Test Runner
```bash
# test_runner.sh
run_integration_tests() {
    local test_env="${1:-development}"
    
    info "Running integration tests in $test_env environment"
    
    # Setup test database
    setup_test_database
    
    # Run test suites
    local test_suites=("auth" "api" "database" "ai-functions")
    
    for suite in "${test_suites[@]}"; do
        info "Running $suite test suite"
        
        if ! pnpm test:"$suite"; then
            error "$suite tests failed"
        fi
        
        success "$suite tests passed"
    done
    
    # Cleanup
    cleanup_test_database
    
    success "All integration tests passed"
}
```

## Security & Validation

### Environment Validation
```bash
# validate_environment.sh
validate_environment() {
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    info "Validating environment configuration"
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable missing: $var"
        fi
    done
    
    # Validate Supabase connectivity
    if ! supabase status | grep -q "API URL"; then
        error "Cannot connect to Supabase. Check configuration."
    fi
    
    success "Environment validation passed"
}
```

### Security Checks
```bash
# security_check.sh
security_audit() {
    info "Running security audit"
    
    # Check for exposed secrets
    if grep -r "sk-" . --exclude-dir=node_modules | grep -v ".env.example"; then
        error "Potential API keys found in code"
    fi
    
    # Validate file permissions
    local secure_files=(".env" ".env.local" "secrets.json")
    for file in "${secure_files[@]}"; do
        if [[ -f "$file" && $(stat -c "%a" "$file") != "600" ]]; then
            error "Insecure permissions on $file. Should be 600."
        fi
    done
    
    success "Security audit passed"
}
```

## Usage Guidelines

### Script Execution
- Always run scripts from project root
- Check script permissions: `chmod +x scripts/*.sh`
- Review script output for errors
- Use `--help` flag for usage information

### Development Workflow
1. **Start development**: `./scripts/dev.sh setup`
2. **Regular maintenance**: `./scripts/dev.sh clean && ./scripts/dev.sh lint`
3. **Database updates**: `./scripts/db.sh schema dump && pnpm db:generate-types`
4. **Pre-deployment**: `./scripts/build.sh verify`

### Error Recovery
- Check script logs in `logs/` directory
- Use `--verbose` flag for detailed output
- Restore from backup if needed: `./scripts/db.sh restore`
- Contact team for complex issues

## Maintenance

### Script Updates
- Test changes in development environment
- Validate with different data sets
- Update documentation when modifying scripts
- Use version control for script changes

### Performance Optimization
- Profile long-running scripts
- Implement parallel processing where possible
- Cache expensive operations
- Monitor resource usage during execution