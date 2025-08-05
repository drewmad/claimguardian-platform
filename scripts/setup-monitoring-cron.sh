#!/bin/bash

# Setup script for daily monitoring cron job

echo "========================================"
echo "📅 SETTING UP DAILY MONITORING CRON JOB"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get the full path to the monitoring script
SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/monitor-production.sh"
LOG_DIR="$(cd "$(dirname "$0")/.." && pwd)/logs"

echo -e "${BLUE}Setting up monitoring automation...${NC}"
echo ""

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"
echo -e "${GREEN}✓ Created logs directory: $LOG_DIR${NC}"

# Create the cron job line
CRON_LINE="0 9 * * * cd $(dirname "$SCRIPT_PATH")/.. && $SCRIPT_PATH >> $LOG_DIR/monitoring.log 2>&1"

echo ""
echo -e "${YELLOW}To set up daily monitoring at 9 AM ET:${NC}"
echo ""
echo "1. Run: crontab -e"
echo "2. Add this line:"
echo ""
echo "$CRON_LINE"
echo ""
echo "3. Save and exit"
echo ""

# Alternative: Use launchd on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}Alternative for macOS (using launchd):${NC}"
    echo ""
    
    # Create plist file
    cat > ~/Library/LaunchAgents/com.claimguardian.monitoring.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claimguardian.monitoring</string>
    <key>ProgramArguments</key>
    <array>
        <string>$SCRIPT_PATH</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>WorkingDirectory</key>
    <string>$(dirname "$SCRIPT_PATH")/..</string>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/monitoring.log</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/monitoring-error.log</string>
</dict>
</plist>
EOF

    echo "Created launchd plist at: ~/Library/LaunchAgents/com.claimguardian.monitoring.plist"
    echo ""
    echo "To enable with launchd:"
    echo "launchctl load ~/Library/LaunchAgents/com.claimguardian.monitoring.plist"
    echo ""
    echo "To disable:"
    echo "launchctl unload ~/Library/LaunchAgents/com.claimguardian.monitoring.plist"
fi

echo ""
echo -e "${GREEN}✅ Setup instructions ready!${NC}"
echo ""
echo "The monitoring script will:"
echo "- Run daily at 9 AM ET"
echo "- Check all Edge Functions"
echo "- Verify database health"
echo "- Log results to: $LOG_DIR/monitoring.log"
echo "- Generate reports in the project directory"