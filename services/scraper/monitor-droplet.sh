#!/bin/bash

# Monitor script for ClaimGuardian scraper on Digital Ocean

DROPLET_IP="159.223.126.155"
DROPLET_USER="root"

echo "📊 ClaimGuardian Scraper Monitor"
echo "================================"
echo ""

# Check PM2 status
echo "🔍 Process Status:"
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "pm2 status" 2>/dev/null

echo ""
echo "📋 Recent Logs (last 20 lines):"
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "pm2 logs claimguardian-scraper --lines 20 --nostream" 2>/dev/null

echo ""
echo "🏥 Health Check:"
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "cd /opt/claimguardian-scraper && node index.js health" 2>/dev/null

echo ""
echo "💾 Disk Usage:"
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "df -h / | grep -v Filesystem"

echo ""
echo "🧠 Memory Usage:"
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "free -h | grep -E 'Mem:|Swap:'"

echo ""
echo "📁 Log Files:"
ssh -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "ls -lah /var/log/claimguardian-scraper/" 2>/dev/null || echo "No log files yet"