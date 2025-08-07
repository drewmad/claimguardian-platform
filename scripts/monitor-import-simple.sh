#!/bin/bash

# Simple import monitor

DB_PASSWORD="Hotdam2025a"

while true; do
    clear
    echo "=================================="
    echo "Florida Parcels Import Monitor"
    echo "=================================="
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo

    # Get summary
    STATS=$(PGPASSWORD="$DB_PASSWORD" psql -h aws-0-us-east-2.pooler.supabase.com -p 6543 -U postgres.tmlrvecuwgppbaynesji -d postgres -t -c "SELECT COUNT(*) as total, COUNT(DISTINCT co_no) as counties FROM florida_parcels;" 2>/dev/null)

    if [ $? -eq 0 ]; then
        TOTAL=$(echo $STATS | awk '{print $1}')
        COUNTIES=$(echo $STATS | awk '{print $3}')

        echo "Total Parcels: $(printf "%'d" $TOTAL)"
        echo "Counties Imported: $COUNTIES / 67"
        echo

        # Calculate percentage
        PCT=$((COUNTIES * 100 / 67))
        echo -n "Progress: ["
        for i in $(seq 1 50); do
            if [ $i -le $((PCT / 2)) ]; then
                echo -n "="
            else
                echo -n "-"
            fi
        done
        echo "] $PCT%"
        echo

        # Show recent imports
        echo "Recent imports:"
        grep "✅ Complete" /tmp/florida_parcels_import/logs/*.log 2>/dev/null | tail -5 | sed 's/.*county_/County /' | sed 's/_/ /' | sed 's/\.log:/: /'

        # Show active
        echo
        echo "Active processes:"
        ps aux | grep "[p]rocess_county" | wc -l | xargs echo "  Running:"
    else
        echo "Unable to connect to database"
    fi

    echo
    echo "Press Ctrl+C to exit"
    sleep 10
done
