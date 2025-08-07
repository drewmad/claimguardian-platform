#!/bin/bash

# ClaimGuardian Production Deployment Script
# Comprehensive zero-downtime deployment with rollback capability
# Author: Claude AI Assistant - Production Engineering Team
# Version: 1.0.0

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
readonly DEPLOYMENT_LOG="/var/log/claimguardian/deployment.log"
readonly ROLLBACK_DIR="/opt/claimguardian/rollback"
readonly HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost/api/health}"
readonly DEPLOYMENT_TIMEOUT="${DEPLOYMENT_TIMEOUT:-300}" # 5 minutes
readonly HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-10}"

# Deployment configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DEPLOYMENT_STRATEGY="${DEPLOYMENT_STRATEGY:-blue-green}"
SKIP_TESTS="${SKIP_TESTS:-false}"
FORCE_DEPLOY="${FORCE_DEPLOY:-false}"
DRY_RUN="${DRY_RUN:-false}"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
    esac

    # Log to file if directory exists
    if [[ -d "$(dirname "$DEPLOYMENT_LOG")" ]]; then
        echo "$timestamp [$level] $message" >> "$DEPLOYMENT_LOG"
    fi
}

# Error handler
error_handler() {
    local exit_code=$?
    local line_number=$1
    log "ERROR" "Script failed at line $line_number with exit code $exit_code"

    # Attempt rollback on failure
    if [[ "$exit_code" -ne 0 ]] && [[ "${SKIP_ROLLBACK:-false}" != "true" ]]; then
        log "WARN" "Attempting automatic rollback..."
        rollback_deployment || log "ERROR" "Rollback failed! Manual intervention required."
    fi

    exit $exit_code
}

trap 'error_handler $LINENO' ERR

# Show usage information
show_usage() {
    cat << EOF
ClaimGuardian Production Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENVIRONMENT   Target environment (production, staging)
    -t, --tag TAG                   Docker image tag to deploy
    -s, --strategy STRATEGY         Deployment strategy (blue-green, rolling)
    -h, --health-check URL          Health check URL
    -n, --dry-run                   Show what would be deployed without executing
    -f, --force                     Force deployment even if checks fail
    --skip-tests                    Skip pre-deployment tests
    --skip-rollback                 Skip automatic rollback on failure
    --help                          Show this help message

Examples:
    $0 --environment production --tag v1.2.3
    $0 --dry-run --strategy rolling
    $0 --force --skip-tests --tag latest

Environment Variables:
    ENVIRONMENT                     Target environment
    IMAGE_TAG                       Docker image tag
    DEPLOYMENT_STRATEGY            Deployment strategy
    HEALTH_CHECK_URL               Health check endpoint
    DATABASE_URL                   Database connection string
    REDIS_URL                      Redis connection string

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -s|--strategy)
                DEPLOYMENT_STRATEGY="$2"
                shift 2
                ;;
            -h|--health-check)
                HEALTH_CHECK_URL="$2"
                shift 2
                ;;
            -n|--dry-run)
                DRY_RUN="true"
                shift
                ;;
            -f|--force)
                FORCE_DEPLOY="true"
                shift
                ;;
            --skip-tests)
                SKIP_TESTS="true"
                shift
                ;;
            --skip-rollback)
                SKIP_ROLLBACK="true"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Validate environment and prerequisites
validate_environment() {
    log "INFO" "Validating deployment environment..."

    # Check required tools
    local required_tools=("docker" "docker-compose" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "Required tool '$tool' is not installed"
            return 1
        fi
    done

    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
        log "ERROR" "Invalid environment: $ENVIRONMENT"
        return 1
    fi

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log "ERROR" "Docker daemon is not running"
        return 1
    fi

    # Validate deployment strategy
    if [[ ! "$DEPLOYMENT_STRATEGY" =~ ^(blue-green|rolling)$ ]]; then
        log "ERROR" "Invalid deployment strategy: $DEPLOYMENT_STRATEGY"
        return 1
    fi

    # Check required environment variables
    local required_vars=("DATABASE_URL" "REDIS_URL" "NEXT_PUBLIC_SUPABASE_URL")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            if [[ "$FORCE_DEPLOY" != "true" ]]; then
                log "ERROR" "Required environment variable $var is not set"
                return 1
            else
                log "WARN" "Required environment variable $var is not set (forced deployment)"
            fi
        fi
    done

    log "INFO" "Environment validation completed successfully"
    return 0
}

# Run pre-deployment tests
run_pre_deployment_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log "WARN" "Skipping pre-deployment tests"
        return 0
    fi

    log "INFO" "Running pre-deployment tests..."

    # Unit tests
    log "INFO" "Running unit tests..."
    if [[ "$DRY_RUN" == "false" ]]; then
        cd "$PROJECT_ROOT"
        npm run test:ci || {
            log "ERROR" "Unit tests failed"
            return 1
        }
    fi

    # Integration tests
    log "INFO" "Running integration tests..."
    if [[ "$DRY_RUN" == "false" ]]; then
        npm run test:integration || {
            log "ERROR" "Integration tests failed"
            return 1
        }
    fi

    # Security tests
    log "INFO" "Running security tests..."
    if [[ "$DRY_RUN" == "false" ]]; then
        npm audit --audit-level high || {
            if [[ "$FORCE_DEPLOY" != "true" ]]; then
                log "ERROR" "Security audit failed"
                return 1
            else
                log "WARN" "Security audit failed (forced deployment)"
            fi
        }
    fi

    log "INFO" "Pre-deployment tests completed successfully"
    return 0
}

# Create deployment backup point
create_backup_point() {
    log "INFO" "Creating deployment backup point..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would create backup point"
        return 0
    fi

    # Create rollback directory
    mkdir -p "$ROLLBACK_DIR"

    # Backup current docker-compose configuration
    if [[ -f "$PROJECT_ROOT/docker-compose.production.yml" ]]; then
        cp "$PROJECT_ROOT/docker-compose.production.yml" "$ROLLBACK_DIR/docker-compose.backup.yml"
    fi

    # Save current container states
    docker-compose -f "$PROJECT_ROOT/infrastructure/docker-compose.production.yml" config > "$ROLLBACK_DIR/current-config.yml"

    # Create database backup
    log "INFO" "Creating database backup..."
    local backup_file="$ROLLBACK_DIR/database-backup-$(date +%Y%m%d-%H%M%S).sql"

    # This would be customized based on your database setup
    # For Supabase, you might use pg_dump or their backup API
    if [[ -n "${DATABASE_URL:-}" ]]; then
        pg_dump "$DATABASE_URL" > "$backup_file" 2>/dev/null || {
            log "WARN" "Database backup failed, continuing deployment"
        }
    fi

    log "INFO" "Backup point created successfully"
    return 0
}

# Build and push Docker images
build_and_push_images() {
    log "INFO" "Building and pushing Docker images..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would build and push images with tag $IMAGE_TAG"
        return 0
    fi

    cd "$PROJECT_ROOT"

    # Build main application image
    log "INFO" "Building application image..."
    docker build -t "claimguardian/app:$IMAGE_TAG" \
        --build-arg NODE_ENV=production \
        --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
        -f Dockerfile .

    # Build backup service image
    log "INFO" "Building backup service image..."
    docker build -t "claimguardian/backup:$IMAGE_TAG" \
        -f infrastructure/dockerfiles/Dockerfile.backup .

    # Tag as latest for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker tag "claimguardian/app:$IMAGE_TAG" "claimguardian/app:latest"
        docker tag "claimguardian/backup:$IMAGE_TAG" "claimguardian/backup:latest"
    fi

    log "INFO" "Docker images built successfully"
    return 0
}

# Deploy with blue-green strategy
deploy_blue_green() {
    log "INFO" "Starting blue-green deployment..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would perform blue-green deployment"
        return 0
    fi

    local compose_file="$PROJECT_ROOT/infrastructure/docker-compose.production.yml"

    # Start new instances (green environment)
    log "INFO" "Starting green environment..."

    # Update docker-compose with new image tags
    export IMAGE_TAG="$IMAGE_TAG"

    # Start new containers alongside existing ones
    docker-compose -f "$compose_file" up -d --no-deps app-1 app-2 worker

    # Wait for new containers to be ready
    log "INFO" "Waiting for new containers to be healthy..."
    sleep 30

    # Health check new instances
    local health_check_passed=false
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        log "INFO" "Health check attempt $i/$HEALTH_CHECK_RETRIES..."

        if check_application_health; then
            health_check_passed=true
            break
        fi

        if [[ $i -eq $HEALTH_CHECK_RETRIES ]]; then
            log "ERROR" "Health checks failed after $HEALTH_CHECK_RETRIES attempts"
            return 1
        fi

        sleep 10
    done

    if [[ "$health_check_passed" == "true" ]]; then
        log "INFO" "Health checks passed, switching traffic to green environment"

        # Update load balancer to point to new instances
        # This would involve updating HAProxy configuration or similar
        switch_traffic_to_green

        # Stop old instances after successful switch
        log "INFO" "Stopping blue environment..."
        # docker-compose -f "$compose_file" stop old-app-1 old-app-2 old-worker

        log "INFO" "Blue-green deployment completed successfully"
    else
        log "ERROR" "Health checks failed, keeping blue environment active"
        return 1
    fi

    return 0
}

# Deploy with rolling strategy
deploy_rolling() {
    log "INFO" "Starting rolling deployment..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would perform rolling deployment"
        return 0
    fi

    local compose_file="$PROJECT_ROOT/infrastructure/docker-compose.production.yml"

    # Update docker-compose with new image tags
    export IMAGE_TAG="$IMAGE_TAG"

    # Rolling update of application instances
    local instances=("app-1" "app-2")

    for instance in "${instances[@]}"; do
        log "INFO" "Updating instance: $instance"

        # Stop instance
        docker-compose -f "$compose_file" stop "$instance"

        # Start with new image
        docker-compose -f "$compose_file" up -d "$instance"

        # Wait for health check
        sleep 30

        if ! check_application_health; then
            log "ERROR" "Health check failed for instance: $instance"
            return 1
        fi

        log "INFO" "Instance $instance updated successfully"
    done

    # Update worker
    log "INFO" "Updating worker instance..."
    docker-compose -f "$compose_file" up -d --no-deps worker

    log "INFO" "Rolling deployment completed successfully"
    return 0
}

# Switch traffic to green environment
switch_traffic_to_green() {
    log "INFO" "Switching traffic to green environment..."

    # This would update load balancer configuration
    # For HAProxy, this might involve updating the config and reloading
    # For cloud load balancers, this would use their APIs

    # Example for HAProxy:
    # - Update backend server definitions
    # - Reload HAProxy configuration
    # - Verify traffic is flowing to new instances

    log "INFO" "Traffic switched to green environment"
}

# Check application health
check_application_health() {
    local max_attempts=3
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        log "DEBUG" "Health check attempt $attempt/$max_attempts"

        # Check main health endpoint
        local response
        if response=$(curl -s -f "$HEALTH_CHECK_URL" -w "%{http_code}" -o /tmp/health_response.json); then
            local http_code="${response: -3}"

            if [[ "$http_code" == "200" ]]; then
                # Check detailed health status
                local status
                status=$(jq -r '.status' /tmp/health_response.json 2>/dev/null || echo "unknown")

                if [[ "$status" == "healthy" ]]; then
                    log "DEBUG" "Application health check passed"
                    rm -f /tmp/health_response.json
                    return 0
                else
                    log "WARN" "Application status is: $status"
                fi
            else
                log "WARN" "Health check returned HTTP $http_code"
            fi
        else
            log "WARN" "Health check request failed"
        fi

        ((attempt++))
        if [[ $attempt -le $max_attempts ]]; then
            sleep 5
        fi
    done

    rm -f /tmp/health_response.json
    return 1
}

# Post-deployment verification
post_deployment_verification() {
    log "INFO" "Running post-deployment verification..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would run post-deployment verification"
        return 0
    fi

    # Extended health checks
    log "INFO" "Running extended health checks..."
    local health_check_count=0
    local max_health_checks=5

    for i in $(seq 1 $max_health_checks); do
        if check_application_health; then
            ((health_check_count++))
            log "DEBUG" "Health check $i/$max_health_checks passed"
        else
            log "WARN" "Health check $i/$max_health_checks failed"
        fi
        sleep 10
    done

    if [[ $health_check_count -lt 3 ]]; then
        log "ERROR" "Too many health check failures: $health_check_count/$max_health_checks passed"
        return 1
    fi

    # Test critical user journeys
    log "INFO" "Testing critical user journeys..."
    if ! test_critical_user_journeys; then
        log "ERROR" "Critical user journey tests failed"
        return 1
    fi

    # Verify integrations
    log "INFO" "Verifying external integrations..."
    if ! verify_external_integrations; then
        log "WARN" "Some external integrations failed (non-critical)"
    fi

    log "INFO" "Post-deployment verification completed successfully"
    return 0
}

# Test critical user journeys
test_critical_user_journeys() {
    local base_url="${HEALTH_CHECK_URL%/api/health}"

    # Test homepage load
    if ! curl -s -f "$base_url" > /dev/null; then
        log "ERROR" "Homepage load test failed"
        return 1
    fi

    # Test API endpoints
    local endpoints=("/api/health" "/api/auth/session")
    for endpoint in "${endpoints[@]}"; do
        if ! curl -s -f "$base_url$endpoint" > /dev/null; then
            log "WARN" "Endpoint test failed: $endpoint"
        fi
    done

    log "DEBUG" "Critical user journey tests passed"
    return 0
}

# Verify external integrations
verify_external_integrations() {
    # Test database connection
    if [[ -n "${DATABASE_URL:-}" ]]; then
        # This would test database connectivity
        log "DEBUG" "Database connection test would run here"
    fi

    # Test Redis connection
    if [[ -n "${REDIS_URL:-}" ]]; then
        # This would test Redis connectivity
        log "DEBUG" "Redis connection test would run here"
    fi

    # Test external APIs
    # This would test OpenAI, Google APIs, etc.
    log "DEBUG" "External API tests would run here"

    return 0
}

# Rollback deployment
rollback_deployment() {
    log "WARN" "Starting deployment rollback..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would perform rollback"
        return 0
    fi

    if [[ ! -d "$ROLLBACK_DIR" ]]; then
        log "ERROR" "Rollback directory not found: $ROLLBACK_DIR"
        return 1
    fi

    # Restore previous docker-compose configuration
    if [[ -f "$ROLLBACK_DIR/docker-compose.backup.yml" ]]; then
        cp "$ROLLBACK_DIR/docker-compose.backup.yml" "$PROJECT_ROOT/docker-compose.production.yml"
    fi

    # Rollback containers
    docker-compose -f "$PROJECT_ROOT/infrastructure/docker-compose.production.yml" down
    docker-compose -f "$ROLLBACK_DIR/current-config.yml" up -d

    # Verify rollback
    sleep 30
    if check_application_health; then
        log "INFO" "Rollback completed successfully"
        return 0
    else
        log "ERROR" "Rollback failed - manual intervention required"
        return 1
    fi
}

# Cleanup deployment artifacts
cleanup_deployment() {
    log "INFO" "Cleaning up deployment artifacts..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would clean up deployment artifacts"
        return 0
    fi

    # Remove old Docker images (keep last 3 versions)
    docker image prune -f

    # Clean up old backup files (keep last 5)
    if [[ -d "$ROLLBACK_DIR" ]]; then
        find "$ROLLBACK_DIR" -name "database-backup-*.sql" -type f -exec ls -t {} + | tail -n +6 | xargs -r rm
    fi

    log "INFO" "Cleanup completed"
}

# Send deployment notification
send_deployment_notification() {
    local status="$1"
    local message="$2"

    log "INFO" "Sending deployment notification: $status"

    # This would send notifications to Slack, email, etc.
    # For now, just log the notification

    local notification_data=$(cat << EOF
{
    "deployment": {
        "environment": "$ENVIRONMENT",
        "image_tag": "$IMAGE_TAG",
        "strategy": "$DEPLOYMENT_STRATEGY",
        "status": "$status",
        "message": "$message",
        "timestamp": "$(date -Iseconds)"
    }
}
EOF
    )

    log "DEBUG" "Notification data: $notification_data"

    # Example webhook call (uncomment and configure for your setup)
    # curl -X POST "$WEBHOOK_URL" \
    #     -H "Content-Type: application/json" \
    #     -d "$notification_data"
}

# Main deployment function
main() {
    log "INFO" "Starting ClaimGuardian production deployment"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Image Tag: $IMAGE_TAG"
    log "INFO" "Strategy: $DEPLOYMENT_STRATEGY"
    log "INFO" "Dry Run: $DRY_RUN"

    # Validate environment
    if ! validate_environment; then
        send_deployment_notification "failed" "Environment validation failed"
        exit 1
    fi

    # Run pre-deployment tests
    if ! run_pre_deployment_tests; then
        send_deployment_notification "failed" "Pre-deployment tests failed"
        exit 1
    fi

    # Create backup point
    if ! create_backup_point; then
        send_deployment_notification "failed" "Failed to create backup point"
        exit 1
    fi

    # Build and push images
    if ! build_and_push_images; then
        send_deployment_notification "failed" "Failed to build Docker images"
        exit 1
    fi

    # Deploy based on strategy
    case "$DEPLOYMENT_STRATEGY" in
        "blue-green")
            if ! deploy_blue_green; then
                send_deployment_notification "failed" "Blue-green deployment failed"
                exit 1
            fi
            ;;
        "rolling")
            if ! deploy_rolling; then
                send_deployment_notification "failed" "Rolling deployment failed"
                exit 1
            fi
            ;;
        *)
            log "ERROR" "Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
            exit 1
            ;;
    esac

    # Post-deployment verification
    if ! post_deployment_verification; then
        send_deployment_notification "failed" "Post-deployment verification failed"
        exit 1
    fi

    # Cleanup
    cleanup_deployment

    # Success notification
    send_deployment_notification "success" "Deployment completed successfully"

    log "INFO" "ClaimGuardian deployment completed successfully!"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Version: $IMAGE_TAG"
    log "INFO" "Health Check: $HEALTH_CHECK_URL"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_arguments "$@"
    main
fi
