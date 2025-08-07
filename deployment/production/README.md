# ClaimGuardian Production Deployment

## Overview

This directory contains the complete production deployment configuration for ClaimGuardian AI-Powered Insurance Platform. The deployment uses Docker Compose for orchestration with comprehensive monitoring, backup, and security features.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Internet / Load Balancer                       │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────────┐
│                     Nginx/Traefik (SSL Termination)                     │
├─────────────────────────┬───────────────────────────────────────────────┤
│                         │                                               │
│  ┌─────────────────────▼──────────────────────────────────────────────┐ │
│  │                ClaimGuardian Web Application                        │ │
│  │                  (Next.js + Node.js)                               │ │
│  └─────────────────────┬──────────────────────────────────────────────┘ │
│                        │                                                │
├────────────────────────┼────────────────────────────────────────────────┤
│                        │                                                │
│  ┌────────────────────▼───────────┐  ┌─────────────────────────────────┐ │
│  │        Redis Cache             │  │     Supabase PostgreSQL        │ │
│  │    (Session & Caching)         │  │    (Primary Database)          │ │
│  └────────────────────────────────┘  └─────────────────────────────────┘ │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                           Monitoring Stack                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐ │
│  │   Prometheus    │ │     Grafana     │ │       AlertManager          │ │
│  │   (Metrics)     │ │  (Dashboards)   │ │      (Alerting)             │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐ │
│  │      Loki       │ │    Promtail     │ │      Node Exporter          │ │
│  │   (Logs)        │ │  (Log Shipping) │ │   (System Metrics)          │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

1. **Server Requirements**:
   - Ubuntu 20.04+ or similar Linux distribution
   - 4+ CPU cores, 8GB+ RAM, 100GB+ SSD storage
   - Docker 24.0+ and Docker Compose 2.0+

2. **Domain Setup**:
   - Domain pointed to server IP: `claimguardianai.com`
   - Subdomains configured:
     - `grafana.claimguardianai.com` (monitoring)
     - `metrics.claimguardianai.com` (Prometheus)

3. **External Services**:
   - Supabase project configured
   - OpenAI API access
   - Stripe account (optional)
   - Email service (Resend recommended)

### Installation Steps

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/ClaimGuardian.git
cd ClaimGuardian/deployment/production
```

#### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Validate configuration
./scripts/validate-secrets.sh
```

#### 3. Set Up SSL Certificates
```bash
# Create SSL directory
mkdir -p ssl

# Generate DH parameters (one-time setup)
openssl dhparam -out ssl/dhparam.pem 2048
```

#### 4. Deploy Services
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f web
```

#### 5. Verify Deployment
```bash
# Run health check
./scripts/health-check.sh

# Test endpoints
curl -f https://claimguardianai.com/api/health
curl -f https://grafana.claimguardianai.com
```

## Configuration Files

### Core Configuration
- `docker-compose.prod.yml` - Main orchestration file
- `.env.example` - Environment variables template
- `secrets-management.md` - Secrets handling guide

### Nginx Configuration
- `nginx/nginx.conf` - Main Nginx configuration
- SSL termination and load balancing
- Rate limiting and security headers
- Static file caching

### Monitoring Configuration
- `monitoring/prometheus.yml` - Metrics collection
- `monitoring/alert_rules.yml` - Alert definitions
- `monitoring/alertmanager.yml` - Alert routing
- `monitoring/loki.yml` - Log aggregation
- `monitoring/promtail.yml` - Log shipping

### Grafana Setup
- `monitoring/grafana/datasources/` - Data source configuration
- `monitoring/grafana/dashboards/` - Dashboard provisioning
- Auto-provisioned dashboards for system and business metrics

## Environment Variables

### Required Variables
```bash
# Application
NEXT_PUBLIC_SITE_URL=https://claimguardianai.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key

# Security
REDIS_PASSWORD=your-redis-password
GRAFANA_PASSWORD=your-grafana-password
```

### Optional Variables
```bash
# Payment Processing
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
SLACK_WEBHOOK_URL=your-slack-webhook

# Backup
BACKUP_S3_BUCKET=claimguardian-backups
BACKUP_AWS_ACCESS_KEY_ID=your-aws-key
BACKUP_AWS_SECRET_ACCESS_KEY=your-aws-secret
```

## Services

### Web Application
- **Port**: 3000 (internal)
- **Health Check**: `/api/health`
- **Features**: Next.js SSR, AI integration, real-time WebSockets
- **Scaling**: Horizontal scaling supported

### Redis Cache
- **Port**: 6379 (internal)
- **Purpose**: Session storage, caching, rate limiting
- **Persistence**: Enabled with AOF
- **Memory**: Configured for production workloads

### Monitoring Stack

#### Prometheus
- **Port**: 9090 (internal)
- **Metrics**: Application, system, and business metrics
- **Retention**: 200 hours (8+ days)
- **Storage**: Local time-series database

#### Grafana
- **Port**: 3001 → 80/443 (via subdomain)
- **Dashboards**: Auto-provisioned system and business dashboards
- **Authentication**: Admin user with configurable password
- **Data Sources**: Prometheus, Loki, AlertManager

#### AlertManager
- **Port**: 9093 (internal)
- **Channels**: Email, Slack, Discord, webhooks
- **Routing**: Severity-based alert routing
- **Inhibition**: Smart alert deduplication

#### Loki + Promtail
- **Loki Port**: 3100 (internal)
- **Purpose**: Centralized log aggregation
- **Retention**: 7 days
- **Integration**: Structured logging from all services

### Backup System
- **Schedule**: Daily at 4 AM via cron
- **Retention**: 30 days local, longer-term in S3
- **Types**: Full, schema-only, data-only, table-specific
- **Monitoring**: Backup success/failure alerts

## Monitoring & Alerting

### System Metrics
- CPU, memory, disk usage
- Network I/O and connections
- Docker container health
- SSL certificate expiration

### Application Metrics
- HTTP request rates and latencies
- Error rates and status codes
- AI API usage and costs
- WebSocket connections
- Database performance

### Business Metrics
- User registration and conversion rates
- Revenue and subscription metrics
- Claims processing times
- Feature adoption rates

### Alert Categories
- **Critical**: Immediate response required
- **Warning**: Attention needed within hours
- **Info**: Awareness notifications

### Alert Channels
- Email: Immediate notifications
- Slack: Team coordination
- Dashboard: Visual status updates
- PagerDuty: Escalation (optional)

## Backup & Recovery

### Automatic Backups
```bash
# Daily backup cron job
0 4 * * * /app/scripts/backup-supabase.sh

# Weekly full system backup
0 2 * * 0 /app/scripts/backup-full.sh
```

### Manual Backup
```bash
# Create manual backup
./scripts/backup-supabase.sh

# List available backups
ls -la /backups/

# Upload to S3
aws s3 sync /backups/ s3://claimguardian-backups/
```

### Recovery Procedures
```bash
# Restore full database
./scripts/restore-supabase.sh full backup_file.backup

# Restore specific table
./scripts/restore-supabase.sh table backup_file.backup table_name

# Restore from S3
aws s3 cp s3://claimguardian-backups/backup.tar.gz ./
tar -xzf backup.tar.gz
./scripts/restore-supabase.sh full extracted_backup.backup
```

## Security

### SSL/TLS
- Let's Encrypt certificates via Traefik
- TLS 1.2+ with strong cipher suites
- HSTS headers enabled
- Certificate auto-renewal

### Network Security
- Rate limiting on all endpoints
- CORS configuration
- Security headers (CSP, X-Frame-Options, etc.)
- Internal service communication only

### Access Control
- Basic authentication for monitoring interfaces
- Role-based access in application
- Secrets management best practices
- Regular security updates

### Monitoring
- Failed authentication tracking
- Suspicious activity detection
- SSL certificate monitoring
- Security event logging

## Scaling

### Horizontal Scaling
```bash
# Scale web application
docker-compose up -d --scale web=3

# Load balancer configuration
# Nginx upstream automatically handles multiple instances
```

### Database Scaling
- Supabase handles database scaling
- Read replicas for read-heavy workloads
- Connection pooling via pgBouncer

### Resource Monitoring
- Automatic alerting on resource exhaustion
- Capacity planning dashboards
- Performance trend analysis

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check configuration
docker-compose config

# Check resource usage
docker stats
```

#### SSL Certificate Issues
```bash
# Check certificate status
curl -vI https://claimguardianai.com

# Manual certificate renewal
docker exec traefik certbot renew

# Check Traefik logs
docker-compose logs traefik
```

#### Database Connection Issues
```bash
# Test Supabase connection
psql -h your-supabase-host -U postgres -d postgres

# Check connection pool
docker-compose logs web | grep -i database
```

#### High Resource Usage
```bash
# Check system resources
htop
df -h
docker stats

# Scale services
docker-compose up -d --scale web=2
```

### Debug Commands
```bash
# Enter application container
docker exec -it claimguardian_web_1 sh

# View real-time logs
docker-compose logs -f --tail=100

# Test internal connectivity
docker exec web curl -f http://redis:6379
```

### Log Analysis
```bash
# Search application logs
docker exec loki logcli query '{job="claimguardian-web"} |= "ERROR"'

# Check Grafana for metrics
# Visit: https://grafana.claimguardianai.com

# Prometheus metrics
curl http://localhost:9090/api/v1/label/__name__/values
```

## Maintenance

### Regular Tasks
- [ ] Monitor backup success (daily)
- [ ] Review security alerts (daily)
- [ ] Check system resources (weekly)
- [ ] Update dependencies (monthly)
- [ ] Security audit (quarterly)

### Update Procedures
```bash
# Update application
git pull origin main
docker-compose build --no-cache web
docker-compose up -d

# Update system packages
apt update && apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### Health Checks
```bash
# Manual health check
./scripts/health-check.sh

# Automated health monitoring
# Configured via cron and alerts
```

## Support

### Documentation
- Production deployment guide (this document)
- API documentation: `/docs`
- Monitoring runbooks: `/runbooks`
- Security procedures: `/security`

### Contacts
- **Infrastructure Team**: infrastructure@claimguardianai.com
- **Security Team**: security@claimguardianai.com
- **On-call Engineer**: See escalation procedures

### Emergency Procedures
1. Check system status: `./scripts/health-check.sh`
2. Review recent deployments and changes
3. Check monitoring dashboards
4. Escalate to on-call engineer if needed
5. Document incident and resolution

---

**Version**: 1.0.0
**Last Updated**: $(date)
**Maintainer**: ClaimGuardian Infrastructure Team
