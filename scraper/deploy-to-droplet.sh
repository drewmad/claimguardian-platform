#!/bin/bash

# Deployment script for existing Digital Ocean droplet
# Run this from your local machine

set -e

echo "🚀 ClaimGuardian Property Scraper - Droplet Deployment"
echo "======================================================"

# Configuration
DROPLET_IP="159.223.126.155"
DROPLET_USER="root"
APP_DIR="/opt/claimguardian-scraper"

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please set:"
    echo "  export SUPABASE_URL='your_supabase_url'"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'"
    exit 1
fi

echo "📦 Creating deployment package..."
# Create a temporary directory for deployment files
DEPLOY_DIR=$(mktemp -d)
cp -r index.js package.json package-lock.json $DEPLOY_DIR/ 2>/dev/null || true

# Create setup script that will run on the droplet
cat > $DEPLOY_DIR/setup.sh << 'SETUP_SCRIPT'
#!/bin/bash
set -e

echo "🔧 Setting up ClaimGuardian Property Scraper..."

# Update system
echo "📦 Updating system packages..."
apt update
apt upgrade -y

# Install Node.js 20 LTS
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /opt/claimguardian-scraper
cd /opt/claimguardian-scraper

# Create systemd service for PM2
echo "🔧 Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

echo "✅ Setup complete!"
SETUP_SCRIPT

# Create ecosystem file for PM2
cat > $DEPLOY_DIR/ecosystem.config.js << ECOSYSTEM
module.exports = {
  apps: [{
    name: 'claimguardian-scraper',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      SUPABASE_URL: '$SUPABASE_URL',
      SUPABASE_SERVICE_ROLE_KEY: '$SUPABASE_SERVICE_ROLE_KEY',
      BATCH_SIZE: '500',
      MAX_RETRIES: '3',
      RETRY_DELAY: '5000'
    },
    cron_restart: '0 8 * * 0', // Run weekly on Sunday at 3 AM EST (8 AM UTC)
    error_file: '/var/log/claimguardian-scraper/error.log',
    out_file: '/var/log/claimguardian-scraper/out.log',
    log_file: '/var/log/claimguardian-scraper/combined.log',
    time: true
  }]
};
ECOSYSTEM

# Create health check script
cat > $DEPLOY_DIR/health-check.sh << 'HEALTH_SCRIPT'
#!/bin/bash
# Health check script for monitoring

cd /opt/claimguardian-scraper
HEALTH_STATUS=$(node index.js health 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Scraper is healthy"
    echo "$HEALTH_STATUS"
else
    echo "❌ Scraper health check failed"
    exit 1
fi
HEALTH_SCRIPT

chmod +x $DEPLOY_DIR/setup.sh
chmod +x $DEPLOY_DIR/health-check.sh

echo "📤 Uploading files to droplet..."
# Create directory on droplet
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "mkdir -p $APP_DIR /var/log/claimguardian-scraper"

# Copy files to droplet
scp -o StrictHostKeyChecking=no -r $DEPLOY_DIR/* $DROPLET_USER@$DROPLET_IP:$APP_DIR/

echo "🔧 Running setup on droplet..."
# Execute setup script
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "cd $APP_DIR && bash setup.sh"

echo "📦 Installing Node.js dependencies..."
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "cd $APP_DIR && npm install --production"

echo "🚀 Starting scraper with PM2..."
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "cd $APP_DIR && pm2 delete claimguardian-scraper 2>/dev/null || true && pm2 start ecosystem.config.js"

echo "💾 Saving PM2 configuration..."
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "pm2 save"

echo "🏥 Running health check..."
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "cd $APP_DIR && bash health-check.sh"

# Cleanup
rm -rf $DEPLOY_DIR

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Useful commands:"
echo "  SSH to droplet:        ssh $DROPLET_USER@$DROPLET_IP"
echo "  View logs:             ssh $DROPLET_USER@$DROPLET_IP 'pm2 logs claimguardian-scraper'"
echo "  Check status:          ssh $DROPLET_USER@$DROPLET_IP 'pm2 status'"
echo "  Manual run:            ssh $DROPLET_USER@$DROPLET_IP 'cd $APP_DIR && node index.js'"
echo "  Health check:          ssh $DROPLET_USER@$DROPLET_IP 'cd $APP_DIR && node index.js health'"
echo ""
echo "🕐 The scraper is scheduled to run automatically at:"
echo "  - 2:00 AM UTC (10:00 PM EST)"
echo "  - 2:00 PM UTC (10:00 AM EST)"
echo ""
echo "📈 Monitor in Supabase:"
echo "  SELECT * FROM scraper_dashboard;"
echo "  SELECT * FROM get_scraper_health();"