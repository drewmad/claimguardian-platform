#!/bin/bash

# Optimal Parallel Import Runner
# This script runs 3 parallel imports for maximum speed

echo "🚀 Starting Optimal Parallel Import for 73 Remaining Files"
echo "========================================================="
echo ""

# Check if files exist
FILE_COUNT=$(ls CleanedSplit/*.csv 2>/dev/null | wc -l | tr -d ' ')
echo "📊 Found $FILE_COUNT CSV files to process"
echo ""

if [ "$FILE_COUNT" -eq 0 ]; then
    echo "❌ No CSV files found in CleanedSplit/"
    exit 1
fi

# Kill any existing node processes importing CSVs
echo "🧹 Cleaning up any existing import processes..."
pkill -f "import-parallel-optimal.js" 2>/dev/null
sleep 1

# Create log directory
mkdir -p import_logs

# Calculate file distribution
THIRD=$((FILE_COUNT / 3))
REMAINDER=$((FILE_COUNT % 3))

# Adjust for remainder
FIRST_END=$THIRD
SECOND_START=$FIRST_END
SECOND_END=$((FIRST_END + THIRD))
THIRD_START=$SECOND_END
THIRD_END=$FILE_COUNT

# Add remainder to last batch
if [ $REMAINDER -gt 0 ]; then
    THIRD_END=$((THIRD_END))
fi

echo "📋 File distribution:"
echo "   Process 1: Files 0-${FIRST_END} ($((FIRST_END)) files)"
echo "   Process 2: Files ${SECOND_START}-${SECOND_END} ($((SECOND_END - SECOND_START)) files)"
echo "   Process 3: Files ${THIRD_START}-${THIRD_END} ($((THIRD_END - THIRD_START)) files)"
echo ""

# Start imports in background
echo "🚀 Starting 3 parallel import processes..."
echo ""

# Process 1
node scripts/import-parallel-optimal.js 0 $FIRST_END > import_logs/process1.log 2>&1 &
PID1=$!
echo "   Process 1 started (PID: $PID1)"

# Process 2
node scripts/import-parallel-optimal.js $SECOND_START $SECOND_END > import_logs/process2.log 2>&1 &
PID2=$!
echo "   Process 2 started (PID: $PID2)"

# Process 3
node scripts/import-parallel-optimal.js $THIRD_START $THIRD_END > import_logs/process3.log 2>&1 &
PID3=$!
echo "   Process 3 started (PID: $PID3)"

echo ""
echo "📊 Monitoring progress..."
echo "   Logs: tail -f import_logs/process*.log"
echo ""

# Monitor progress with enhanced display
SECONDS=0
LAST_IMPORTED=0
LAST_TIME=0

# Function to draw progress bar
draw_progress_bar() {
    local current=$1
    local total=$2
    local width=40
    local percent=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))
    
    printf "["
    printf "%*s" $filled | tr ' ' '█'
    printf "%*s" $empty | tr ' ' '░'
    printf "] %3d%%" $percent
}

# Function to estimate completion time
estimate_completion() {
    local imported=$1
    local total=$2
    local elapsed=$3
    
    if [ $imported -gt 0 ] && [ $elapsed -gt 0 ]; then
        local rate=$((imported * 60 / elapsed))  # files per minute
        local remaining=$((total - imported))
        local eta_mins=$((remaining / rate))
        printf "ETA: %dm" $eta_mins
    else
        printf "ETA: --"
    fi
}

# Function to get detailed process status
get_process_details() {
    local logfile=$1
    local current_file=""
    local progress=""
    
    if [ -f "$logfile" ]; then
        # Get the last file being processed
        current_file=$(tail -n 10 "$logfile" | grep -o '\[[0-9]*/[0-9]*\] [^(]*' | tail -1 | cut -d']' -f2 | xargs)
        # Get the last progress line
        progress=$(tail -n 5 "$logfile" | grep -o 'Progress: [0-9]*/[0-9]* ([0-9]*%)' | tail -1)
    fi
    
    if [ -z "$current_file" ]; then
        current_file="Starting..."
    fi
    
    if [ -z "$progress" ]; then
        progress="Initializing..."
    fi
    
    echo "${current_file} | ${progress}"
}

clear
echo "🚀 PARALLEL IMPORT PROGRESS MONITOR"
echo "══════════════════════════════════════════════════════════════════════════"

while kill -0 $PID1 2>/dev/null || kill -0 $PID2 2>/dev/null || kill -0 $PID3 2>/dev/null; do
    IMPORTED=$(ls CleanedSplit_imported/*.csv 2>/dev/null | wc -l | tr -d ' ')
    REMAINING=$(ls CleanedSplit/*.csv 2>/dev/null | wc -l | tr -d ' ')
    
    # Calculate elapsed time
    ELAPSED=$SECONDS
    MINS=$((ELAPSED / 60))
    SECS=$((ELAPSED % 60))
    
    # Calculate import rate
    RATE=""
    if [ $ELAPSED -gt $LAST_TIME ] && [ $IMPORTED -gt $LAST_IMPORTED ]; then
        FILES_PER_SEC=$(echo "scale=2; ($IMPORTED - $LAST_IMPORTED) / ($ELAPSED - $LAST_TIME)" | bc 2>/dev/null || echo "0")
        RATE=$(printf "%.1f files/sec" $FILES_PER_SEC)
    fi
    
    # Status for each process
    P1_STATUS="✅ Complete"
    P2_STATUS="✅ Complete"  
    P3_STATUS="✅ Complete"
    
    kill -0 $PID1 2>/dev/null && P1_STATUS="🔄 Running"
    kill -0 $PID2 2>/dev/null && P2_STATUS="🔄 Running"
    kill -0 $PID3 2>/dev/null && P3_STATUS="🔄 Running"
    
    # Clear screen and redraw
    printf "\033[H\033[J"
    echo "🚀 PARALLEL IMPORT PROGRESS MONITOR"
    echo "══════════════════════════════════════════════════════════════════════════"
    echo ""
    
    # Overall progress
    echo "📊 OVERALL PROGRESS"
    printf "   "
    draw_progress_bar $IMPORTED $FILE_COUNT
    echo ""
    printf "   Files: %d/%d imported | %d remaining\n" $IMPORTED $FILE_COUNT $REMAINING
    echo ""
    
    # Time and rate info
    echo "⏱️  TIMING"
    printf "   Elapsed: %02d:%02d | Rate: %s | " $MINS $SECS "$RATE"
    estimate_completion $IMPORTED $FILE_COUNT $ELAPSED
    echo ""
    echo ""
    
    # Process details
    echo "🔧 PROCESS STATUS"
    printf "   Process 1: %s\n" "$P1_STATUS"
    if kill -0 $PID1 2>/dev/null; then
        printf "      └─ %s\n" "$(get_process_details import_logs/process1.log)"
    fi
    echo ""
    
    printf "   Process 2: %s\n" "$P2_STATUS"
    if kill -0 $PID2 2>/dev/null; then
        printf "      └─ %s\n" "$(get_process_details import_logs/process2.log)"
    fi
    echo ""
    
    printf "   Process 3: %s\n" "$P3_STATUS"
    if kill -0 $PID3 2>/dev/null; then
        printf "      └─ %s\n" "$(get_process_details import_logs/process3.log)"
    fi
    echo ""
    
    # Recent activity
    echo "📋 RECENT ACTIVITY"
    if [ -f "import_logs/process1.log" ] || [ -f "import_logs/process2.log" ] || [ -f "import_logs/process3.log" ]; then
        tail -n 3 import_logs/process*.log 2>/dev/null | grep -E "(✅|❌|📤)" | tail -5 | sed 's/^/   /'
    else
        echo "   Starting up processes..."
    fi
    echo ""
    
    echo "💡 TIP: Use 'tail -f import_logs/process*.log' in another terminal for detailed logs"
    echo "══════════════════════════════════════════════════════════════════════════"
    
    # Update tracking variables
    LAST_IMPORTED=$IMPORTED
    LAST_TIME=$ELAPSED
    
    sleep 3
done

# Wait for all processes to complete
wait $PID1 $PID2 $PID3

# Final calculations
FINAL_ELAPSED=$SECONDS
FINAL_MINS=$((FINAL_ELAPSED / 60))
FINAL_SECS=$((FINAL_ELAPSED % 60))
FINAL_IMPORTED=$(ls CleanedSplit_imported/*.csv 2>/dev/null | wc -l | tr -d ' ')
FINAL_REMAINING=$(ls CleanedSplit/*.csv 2>/dev/null | wc -l | tr -d ' ')

# Calculate final stats
TOTAL_RECORDS=0
SUCCESS_COUNT=0
ERROR_COUNT=0

for logfile in import_logs/process*.log; do
    if [ -f "$logfile" ]; then
        RECORDS=$(grep -o '[0-9]* records' "$logfile" | tail -1 | grep -o '[0-9]*' | head -1)
        SUCCESSES=$(grep -c "✅ Success" "$logfile" 2>/dev/null || echo 0)
        ERRORS=$(grep -c "❌ Failed" "$logfile" 2>/dev/null || echo 0)
        
        TOTAL_RECORDS=$((TOTAL_RECORDS + ${RECORDS:-0}))
        SUCCESS_COUNT=$((SUCCESS_COUNT + SUCCESSES))
        ERROR_COUNT=$((ERROR_COUNT + ERRORS))
    fi
done

# Clear screen for final report
printf "\033[H\033[J"
echo "🎉 IMPORT COMPLETE!"
echo "══════════════════════════════════════════════════════════════════════════"
echo ""

# Final progress bar
echo "📊 FINAL RESULTS"
printf "   "
draw_progress_bar $FINAL_IMPORTED $FILE_COUNT
echo ""
printf "   Files: %d/%d imported (%d remaining)\n" $FINAL_IMPORTED $FILE_COUNT $FINAL_REMAINING
echo ""

# Performance stats
echo "⚡ PERFORMANCE"
RATE_PER_MIN=$(echo "scale=1; $FINAL_IMPORTED * 60 / $FINAL_ELAPSED" | bc 2>/dev/null || echo "0")
printf "   Total time: %02d:%02d (%d seconds)\n" $FINAL_MINS $FINAL_SECS $FINAL_ELAPSED
printf "   Average rate: %s files/min\n" $RATE_PER_MIN
if [ $TOTAL_RECORDS -gt 0 ]; then
    RECORDS_PER_SEC=$(echo "scale=0; $TOTAL_RECORDS / $FINAL_ELAPSED" | bc 2>/dev/null || echo "0")
    printf "   Records processed: %s (~%s records/sec)\n" $TOTAL_RECORDS $RECORDS_PER_SEC
fi
echo ""

# Error summary
echo "🔍 QUALITY REPORT"
if [ $ERROR_COUNT -gt 0 ]; then
    printf "   ⚠️  %d files had errors\n" $ERROR_COUNT
    printf "   ✅ %d files imported successfully\n" $SUCCESS_COUNT
    echo ""
    echo "   🔎 Error details:"
    grep -n "❌\|Error\|Failed" import_logs/*.log 2>/dev/null | head -5 | sed 's/^/      /'
    if [ $(grep -c "❌\|Error\|Failed" import_logs/*.log 2>/dev/null | wc -l) -gt 5 ]; then
        echo "      ... (run 'grep -n \"❌\\|Error\\|Failed\" import_logs/*.log' for all errors)"
    fi
else
    printf "   ✅ All %d files imported successfully!\n" $SUCCESS_COUNT
    echo "   🎯 No errors detected!"
fi
echo ""

# Next steps
echo "📋 NEXT STEPS"
echo "   📁 Imported files moved to: CleanedSplit_imported/"
echo "   📊 Detailed logs available in: import_logs/"
echo "   🔍 Running verification script..."
echo ""

# Run verification
if [ -f "scripts/verify-import-complete.js" ]; then
    echo "══════════════════════════════════════════════════════════════════════════"
    node scripts/verify-import-complete.js
else
    echo "✅ Import process completed successfully!"
    echo "══════════════════════════════════════════════════════════════════════════"
fi