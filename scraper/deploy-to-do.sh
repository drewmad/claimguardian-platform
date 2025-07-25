#!/bin/bash

# Digital Ocean Deployment Script for Property Scraper
# Usage: ./deploy-to-do.sh [app|droplet]

set -e

echo "🚀 ClaimGuardian Property Scraper - Digital Ocean Deployment"
echo "==========================================================="

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

DEPLOYMENT_TYPE=${1:-app}

if [ "$DEPLOYMENT_TYPE" == "app" ]; then
    echo "📱 Deploying to Digital Ocean App Platform..."
    
    # Install doctl if not present
    if ! command -v doctl &> /dev/null; then
        echo "Installing doctl CLI..."
        brew install doctl || (wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz && tar xf doctl-1.98.1-linux-amd64.tar.gz && sudo mv doctl /usr/local/bin)
    fi
    
    # Authenticate with DO
    echo "🔐 Authenticating with Digital Ocean..."
    doctl auth init
    
    # Create app
    echo "🏗️  Creating app..."
    doctl apps create --spec .do/app.yaml
    
    echo "✅ App created! Check your Digital Ocean dashboard for the app URL."
    echo "📊 To view logs: doctl apps logs <app-id>"
    
elif [ "$DEPLOYMENT_TYPE" == "droplet" ]; then
    echo "💧 Setting up Digital Ocean Droplet..."
    
    # Create setup script
    cat > setup-droplet.sh << 'EOF'
#!/bin/bash
# Droplet setup script

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Create app directory
mkdir -p /opt/claimguardian-scraper
cd /opt/claimguardian-scraper

# Create environment file
cat > .env << EOL
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
BATCH_SIZE=500
MAX_RETRIES=3
RETRY_DELAY=5000
EOL

# Set permissions
chmod 600 .env

# Start with PM2
pm2 start index.js --name claimguardian-scraper --cron "0 2 * * *"
pm2 save
pm2 startup

echo "✅ Droplet setup complete!"
EOF

    echo "📋 Droplet setup script created: setup-droplet.sh"
    echo ""
    echo "To complete setup:"
    echo "1. Create a Ubuntu 22.04 droplet in Digital Ocean"
    echo "2. SSH into the droplet"
    echo "3. Copy the scraper files to /opt/claimguardian-scraper"
    echo "4. Run: bash setup-droplet.sh"
    echo "5. The scraper will run daily at 2 AM"
    
else
    echo "❌ Unknown deployment type: $DEPLOYMENT_TYPE"
    echo "Usage: ./deploy-to-do.sh [app|droplet]"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Monitor the first run to ensure data is being collected"
echo "2. Check Supabase dashboard for incoming data"
echo "3. Set up alerts for failures (optional)"
echo "4. Run the normalization pipeline after data collection"