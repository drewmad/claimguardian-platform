#!/bin/bash

# Setup script for DBPR license weekly download cron job

echo "DBPR License Data - Weekly Import Setup"
echo "========================================"
echo ""

# Script path
SCRIPT_PATH="/Users/madengineering/ClaimGuardian/scripts/data-import/download_dbpr_licenses.sh"

# Check if script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Error: Download script not found at $SCRIPT_PATH"
    exit 1
fi

# Check if script is executable
if [ ! -x "$SCRIPT_PATH" ]; then
    echo "Making script executable..."
    chmod +x "$SCRIPT_PATH"
fi

echo "This will add a cron job to download DBPR license data weekly."
echo ""
echo "Schedule options:"
echo "1. Every Sunday at 2:00 AM (recommended)"
echo "2. Every Monday at 3:00 AM"
echo "3. Every Saturday at 1:00 AM"
echo "4. Custom schedule"
echo ""
read -p "Choose option (1-4): " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * 0"
        SCHEDULE_DESC="Every Sunday at 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 3 * * 1"
        SCHEDULE_DESC="Every Monday at 3:00 AM"
        ;;
    3)
        CRON_SCHEDULE="0 1 * * 6"
        SCHEDULE_DESC="Every Saturday at 1:00 AM"
        ;;
    4)
        echo "Enter cron schedule (e.g., '0 2 * * 0' for Sunday 2 AM):"
        read CRON_SCHEDULE
        SCHEDULE_DESC="Custom: $CRON_SCHEDULE"
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

# Create the cron entry
CRON_ENTRY="$CRON_SCHEDULE $SCRIPT_PATH >> /Users/madengineering/ClaimGuardian/logs/dbpr_cron.log 2>&1"

echo ""
echo "Will add the following cron job:"
echo "$CRON_ENTRY"
echo "Schedule: $SCHEDULE_DESC"
echo ""
read -p "Continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Cancelled"
    exit 0
fi

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"; then
    echo "Warning: A cron job for this script already exists:"
    crontab -l | grep "$SCRIPT_PATH"
    echo ""
    read -p "Replace existing job? (y/n): " replace
    
    if [ "$replace" = "y" ]; then
        # Remove existing job
        (crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH") | crontab -
        echo "Removed existing job"
    else
        echo "Keeping existing job"
        exit 0
    fi
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo ""
echo "✅ Cron job added successfully!"
echo ""
echo "You can view your cron jobs with: crontab -l"
echo "You can edit them with: crontab -e"
echo "You can remove them with: crontab -r"
echo ""
echo "The script will run: $SCHEDULE_DESC"
echo "Logs will be saved to: /Users/madengineering/ClaimGuardian/logs/dbpr_cron.log"
echo ""
echo "To test the download manually, run:"
echo "  $SCRIPT_PATH"