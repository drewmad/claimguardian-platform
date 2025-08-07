#!/bin/bash

##############################################################################
# QUICK TEST IMPORT - Tests just 1-2 files for rapid validation
##############################################################################

set -euo pipefail

# Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'
readonly BOLD='\033[1m'

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly LOG_DIR="$PROJECT_ROOT/import_logs"
readonly CSV_DIR="$PROJECT_ROOT/CleanedSplit"

# Test parameters
readonly TEST_FILES=1  # Number of files to test
readonly TEST_BATCH_SIZE=1  # Just the first row for ultra-fast testing

main() {
    echo -e "${BOLD}${BLUE}"
    echo "████████╗███████╗███████╗████████╗    ██╗███╗   ███╗██████╗  ██████╗ ██████╗ ████████╗"
    echo "╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝    ██║████╗ ████║██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝"
    echo "   ██║   █████╗  ███████╗   ██║       ██║██╔████╔██║██████╔╝██║   ██║██████╔╝   ██║   "
    echo "   ██║   ██╔══╝  ╚════██║   ██║       ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗   ██║   "
    echo "   ██║   ███████╗███████║   ██║       ██║██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║   ██║   "
    echo "   ╚═╝   ╚══════╝╚══════╝   ╚═╝       ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   "
    echo -e "${NC}${BOLD}                    ULTRA-FAST TEST - FIRST ROW ONLY${NC}"
    echo ""

    # Create log directory
    mkdir -p "$LOG_DIR"

    # Get first available file only
    local available_files
    available_files=($(find "$CSV_DIR" -name "*.csv" | head -1))

    if [ ${#available_files[@]} -eq 0 ]; then
        echo -e "${RED}❌ No CSV files found in $CSV_DIR${NC}"
        exit 1
    fi

    echo -e "${WHITE}🎯 TEST CONFIGURATION${NC}"
    echo -e "   Files to test: ${GREEN}${#available_files[@]}${NC}"
    echo -e "   Records per file: ${GREEN}$TEST_BATCH_SIZE${NC} (first row only)"
    echo -e "   Log directory: ${CYAN}$LOG_DIR${NC}"
    echo ""

    echo -e "${WHITE}📋 FILES TO PROCESS${NC}"
    for i in "${!available_files[@]}"; do
        local file=$(basename "${available_files[$i]}")
        local size=$(du -h "${available_files[$i]}" | cut -f1)
        echo -e "   $((i+1)). $file (${size})"
    done
    echo ""

    # Start test
    local start_time=$(date +%s)
    local success_count=0
    local total_records=0

    echo -e "${CYAN}🚀 Starting ultra-fast test (1 record only)...${NC}"
    echo ""

    # Process each file
    for i in "${!available_files[@]}"; do
        local file="${available_files[$i]}"
        local filename=$(basename "$file")

        echo -e "${WHITE}[$((i+1))/${#available_files[@]}] Processing: ${filename}${NC}"

        # Run import for this single file with limited records
        local file_start=$(date +%s)

        # Create a test version of the file with just the header + first row
        local test_file="/tmp/test_$(basename "$file")"
        head -2 "$file" > "$test_file"

        # Temporarily move original and replace with test file
        local original_file="$CSV_DIR/$(basename "$file")"
        mv "$original_file" "$original_file.backup"
        cp "$test_file" "$original_file"

        if BATCH_SIZE=$TEST_BATCH_SIZE node "$SCRIPT_DIR/import-parallel-optimal.js" 0 1 > "$LOG_DIR/test_$((i+1)).log" 2>&1; then
            local file_end=$(date +%s)
            local duration=$((file_end - file_start))

            # Get record count from log
            local records=$(grep -o "[0-9]\+ records" "$LOG_DIR/test_$((i+1)).log" | tail -1 | grep -o "[0-9]\+" || echo "0")

            success_count=$((success_count + 1))
            total_records=$((total_records + records))

            echo -e "   ${GREEN}✅ Success!${NC} $records record in ${duration}s"
        else
            echo -e "   ${RED}❌ Failed!${NC} Check $LOG_DIR/test_$((i+1)).log"
            echo -e "   ${YELLOW}Error details:${NC}"
            tail -3 "$LOG_DIR/test_$((i+1)).log" | sed 's/^/      /'
        fi

        # Restore original file
        if [ -f "$original_file.backup" ]; then
            mv "$original_file.backup" "$original_file"
        fi
        rm -f "$test_file"

        echo ""
    done

    # Final results
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    local minutes=$((total_time / 60))
    local seconds=$((total_time % 60))

    echo "══════════════════════════════════════════════════════════════════════════"
    echo -e "${BOLD}${GREEN}🎉 TEST COMPLETE!${NC}"
    echo "══════════════════════════════════════════════════════════════════════════"
    echo ""

    echo -e "${WHITE}📊 TEST RESULTS${NC}"
    echo -e "   Files processed: ${GREEN}$success_count${NC}/${#available_files[@]}"
    echo -e "   Total records: ${GREEN}$total_records${NC} (first row test)"
    echo -e "   Total time: ${BLUE}${minutes}m ${seconds}s${NC}"

    if [ $success_count -eq ${#available_files[@]} ]; then
        echo -e "   Status: ${GREEN}✅ ALL TESTS PASSED${NC}"
        echo ""
        echo -e "${GREEN}🚀 Schema validation passed! Ready for full import:${NC}"
        echo -e "   ${CYAN}bash scripts/run-parallel-import.sh${NC}"
    else
        local failed=$((${#available_files[@]} - success_count))
        echo -e "   Status: ${RED}❌ $failed TESTS FAILED${NC}"
        echo ""
        echo -e "${YELLOW}🔍 Check logs for details:${NC}"
        echo -e "   ${CYAN}ls -la $LOG_DIR/test_*.log${NC}"
    fi

    echo ""

    # Run verification
    if [ -f "$SCRIPT_DIR/verify-import-complete.js" ]; then
        echo "══════════════════════════════════════════════════════════════════════════"
        echo -e "${CYAN}🔍 Running verification...${NC}"
        node "$SCRIPT_DIR/verify-import-complete.js" || true
    fi

    echo "══════════════════════════════════════════════════════════════════════════"
}

# Check dependencies
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js not found${NC}"; exit 1; }

# Execute main function
main "$@"
