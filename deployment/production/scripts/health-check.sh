#!/bin/bash

# Health Check Script for ClaimGuardian Production
# Comprehensive system and application health monitoring

set -e

# Configuration
HEALTH_LOG="/var/log/health-check.log"
ALERT_THRESHOLD=3  # Number of failures before alerting
STATUS_FILE="/tmp/health-status"

# Service endpoints
WEB_ENDPOINT="http://web:3000/api/health"
PROMETHEUS_ENDPOINT="http://prometheus:9090/-/healthy"
GRAFANA_ENDPOINT="http://grafana:3000/api/health"
REDIS_HOST="redis"
REDIS_PORT="6379"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $HEALTH_LOG
}

# Initialize status tracking
init_status() {
    if [ ! -f "$STATUS_FILE" ]; then
        echo "0" > "$STATUS_FILE"
    fi
}

# Get current failure count
get_failure_count() {
    cat "$STATUS_FILE" 2>/dev/null || echo "0"
}

# Update failure count
update_failure_count() {
    local count=$1
    echo "$count" > "$STATUS_FILE"
}

# Send alert
send_alert() {
    local message=$1
    local severity=${2:-"warning"}

    log "ALERT: $message"

    # Slack notification
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        local color="warning"
        if [ "$severity" == "critical" ]; then
            color="danger"
        fi

        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Health Check Alert: $message\",\"color\":\"$color\"}" \
            "$SLACK_WEBHOOK_URL" &>/dev/null
    fi

    # Email notification (if configured)
    if [ ! -z "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "ClaimGuardian Health Alert" "$ALERT_EMAIL" &>/dev/null
    fi
}

# Check HTTP endpoint
check_http_endpoint() {
    local name=$1
    local url=$2
    local timeout=${3:-5}

    log "Checking $name endpoint: $url"

    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" || echo "000")

    if [ "$http_code" -eq 200 ]; then
        log "✅ $name is healthy (HTTP $http_code)"
        return 0
    else
        log "❌ $name is unhealthy (HTTP $http_code)"
        return 1
    fi
}

# Check Redis
check_redis() {
    log "Checking Redis connection"

    if command -v redis-cli &> /dev/null; then
        local response=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT ping 2>/dev/null || echo "ERROR")

        if [ "$response" == "PONG" ]; then
            log "✅ Redis is healthy"
            return 0
        else
            log "❌ Redis is unhealthy: $response"
            return 1
        fi
    else
        log "⚠️ redis-cli not available, skipping Redis check"
        return 0
    fi
}

# Check disk space
check_disk_space() {
    log "Checking disk space"

    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    local threshold=85

    if [ "$usage" -lt "$threshold" ]; then
        log "✅ Disk space is healthy ($usage% used)"
        return 0
    else
        log "❌ Disk space is low ($usage% used, threshold: $threshold%)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    log "Checking memory usage"

    local usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    local threshold=90

    if [ "$usage" -lt "$threshold" ]; then
        log "✅ Memory usage is healthy ($usage% used)"
        return 0
    else
        log "❌ Memory usage is high ($usage% used, threshold: $threshold%)"
        return 1
    fi
}

# Check CPU load
check_cpu_load() {
    log "Checking CPU load"

    local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cores=$(nproc)
    local threshold=$(echo "$cores * 2" | bc)

    if (( $(echo "$load < $threshold" | bc -l) )); then
        log "✅ CPU load is healthy ($load, threshold: $threshold)"
        return 0
    else
        log "❌ CPU load is high ($load, threshold: $threshold)"
        return 1
    fi
}

# Check Docker containers
check_docker_containers() {
    log "Checking Docker containers"

    if command -v docker &> /dev/null; then
        local unhealthy=$(docker ps --filter "health=unhealthy" -q | wc -l)
        local exited=$(docker ps --filter "status=exited" -q | wc -l)

        if [ "$unhealthy" -eq 0 ] && [ "$exited" -eq 0 ]; then
            log "✅ All Docker containers are healthy"
            return 0
        else
            log "❌ Docker containers issues: $unhealthy unhealthy, $exited exited"
            return 1
        fi
    else
        log "⚠️ Docker not available, skipping container check"
        return 0
    fi
}

# Check SSL certificate
check_ssl_certificate() {
    local domain=${1:-"claimguardianai.com"}
    log "Checking SSL certificate for $domain"

    local expiry=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | \
                   openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [ ! -z "$expiry" ]; then
        local expiry_epoch=$(date -d "$expiry" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

        if [ "$days_until_expiry" -gt 7 ]; then
            log "✅ SSL certificate is valid ($days_until_expiry days remaining)"
            return 0
        else
            log "❌ SSL certificate expires soon ($days_until_expiry days remaining)"
            return 1
        fi
    else
        log "❌ Could not retrieve SSL certificate"
        return 1
    fi
}

# Main health check function
run_health_checks() {
    local failures=0
    local checks=0

    log "=== Starting ClaimGuardian Health Check ==="

    # System checks
    ((checks++))
    check_disk_space || ((failures++))

    ((checks++))
    check_memory || ((failures++))

    ((checks++))
    check_cpu_load || ((failures++))

    ((checks++))
    check_docker_containers || ((failures++))

    # Application checks
    ((checks++))
    check_http_endpoint "ClaimGuardian Web" "$WEB_ENDPOINT" 10 || ((failures++))

    ((checks++))
    check_redis || ((failures++))

    # Monitoring checks
    ((checks++))
    check_http_endpoint "Prometheus" "$PROMETHEUS_ENDPOINT" 5 || ((failures++))

    ((checks++))
    check_http_endpoint "Grafana" "$GRAFANA_ENDPOINT" 5 || ((failures++))

    # Security check
    ((checks++))
    check_ssl_certificate || ((failures++))

    log "=== Health Check Summary: $failures failures out of $checks checks ==="

    return $failures
}

# Generate health report
generate_health_report() {
    local failures=$1
    local timestamp=$(date)
    local uptime=$(uptime -p)
    local load=$(uptime | awk -F'load average:' '{print $2}')
    local memory=$(free -h | grep Mem | awk '{print $3 "/" $2}')
    local disk=$(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')

    cat > "/tmp/health-report.json" << EOF
{
    "timestamp": "$timestamp",
    "status": "$([ $failures -eq 0 ] && echo 'healthy' || echo 'unhealthy')",
    "failures": $failures,
    "system": {
        "uptime": "$uptime",
        "load": "$load",
        "memory": "$memory",
        "disk": "$disk"
    },
    "services": {
        "web": "$(check_http_endpoint "Web" "$WEB_ENDPOINT" 3 &>/dev/null && echo 'up' || echo 'down')",
        "redis": "$(check_redis &>/dev/null && echo 'up' || echo 'down')",
        "prometheus": "$(check_http_endpoint "Prometheus" "$PROMETHEUS_ENDPOINT" 3 &>/dev/null && echo 'up' || echo 'down')",
        "grafana": "$(check_http_endpoint "Grafana" "$GRAFANA_ENDPOINT" 3 &>/dev/null && echo 'up' || echo 'down')"
    }
}
EOF

    # Make report available via HTTP endpoint
    cp "/tmp/health-report.json" "/var/www/html/health.json" 2>/dev/null || true
}

# Main execution
main() {
    init_status

    # Run health checks
    run_health_checks
    local current_failures=$?

    # Generate health report
    generate_health_report $current_failures

    # Handle failure count and alerting
    local previous_failures=$(get_failure_count)

    if [ $current_failures -gt 0 ]; then
        local total_failures=$((previous_failures + 1))
        update_failure_count $total_failures

        if [ $total_failures -ge $ALERT_THRESHOLD ]; then
            send_alert "Health check failed $total_failures consecutive times. $current_failures services are unhealthy." "critical"
        elif [ $total_failures -eq 1 ]; then
            send_alert "Health check detected $current_failures unhealthy services (first occurrence)." "warning"
        fi
    else
        # Reset failure count on success
        if [ $previous_failures -gt 0 ]; then
            log "Health restored after $previous_failures failures"
            send_alert "Health check has recovered. All services are healthy." "good"
        fi
        update_failure_count 0
    fi

    exit $current_failures
}

# Run health check
main "$@"
