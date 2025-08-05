#!/bin/bash

# Real-time monitoring script for Florida parcels import

DB_PASSWORD="Hotdam2025a"

clear
echo "=================================="
echo "Florida Parcels Import Monitor"
echo "=================================="

while true; do
    # Get current counts
    TOTAL=$(PGPASSWORD="$DB_PASSWORD" psql -h aws-0-us-east-2.pooler.supabase.com -p 6543 -U postgres.tmlrvecuwgppbaynesji -d postgres -t -c "SELECT COUNT(*) FROM florida_parcels;" 2>/dev/null | xargs)
    COUNTIES=$(PGPASSWORD="$DB_PASSWORD" psql -h aws-0-us-east-2.pooler.supabase.com -p 6543 -U postgres.tmlrvecuwgppbaynesji -d postgres -t -c "SELECT COUNT(DISTINCT co_no) FROM florida_parcels;" 2>/dev/null | xargs)
    
    # Get top counties
    TOP_COUNTIES=$(PGPASSWORD="$DB_PASSWORD" psql -h aws-0-us-east-2.pooler.supabase.com -p 6543 -U postgres.tmlrvecuwgppbaynesji -d postgres -c "SELECT co_no, COUNT(*) as parcels FROM florida_parcels GROUP BY co_no ORDER BY COUNT(*) DESC LIMIT 10;" 2>/dev/null)
    
    # Clear and update display
    printf "\033[2J\033[H"  # Clear screen and move to top
    echo "=================================="
    echo "Florida Parcels Import Monitor"
    echo "=================================="
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "Total Parcels: $(printf "%'d" $TOTAL)"
    echo "Counties Imported: $COUNTIES / 67"
    echo
    echo "Top Counties by Parcel Count:"
    echo "$TOP_COUNTIES"
    echo
    echo "Press Ctrl+C to exit"
    echo "Refreshing every 5 seconds..."
    
    sleep 5
done