#!/bin/bash

##############################################################################
# OPTIMIZED PARALLEL IMPORT V2 - PRODUCTION-GRADE PERFORMANCE
##############################################################################

set -euo pipefail

# Color codes for enhanced output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'
readonly BOLD='\033[1m'
readonly DIM='\033[2m'

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly LOG_DIR="$PROJECT_ROOT/import_logs"
readonly STATE_FILE="$LOG_DIR/import_state.json"
readonly PERF_LOG="$LOG_DIR/performance.jsonl"
readonly CSV_DIR="$PROJECT_ROOT/CleanedSplit"
readonly IMPORTED_DIR="$PROJECT_ROOT/CleanedSplit_imported"

# System detection and optimization
readonly CPU_CORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "4")
readonly TOTAL_RAM_GB=$(free -g 2>/dev/null | awk 'NR==2{print $2}' || echo "8")
readonly AVAILABLE_RAM_GB=$(free -g 2>/dev/null | awk 'NR==2{print $7}' || echo "4")

# Dynamic performance tuning
calculate_optimal_processes() {
    local file_count=$1
    local min_processes=2
    local max_processes=$((CPU_CORES + 1))
    
    if [ "$file_count" -lt 10 ]; then
        echo $((file_count < min_processes ? file_count : min_processes))
    elif [ "$file_count" -lt 50 ]; then
        echo $((CPU_CORES / 2 + 1))
    else
        echo $max_processes
    fi
}

calculate_batch_size() {
    local avg_file_size_mb=$1
    local base_batch=1000
    
    if [ "$avg_file_size_mb" -gt 100 ]; then
        echo $((base_batch / 2))
    elif [ "$avg_file_size_mb" -lt 50 ] && [ "$AVAILABLE_RAM_GB" -gt 8 ]; then
        echo $((base_batch * 2))
    else
        echo $base_batch
    fi
}

# Advanced logging with structured data
log_performance() {
    local event="$1"
    local data="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
    
    echo "{\"timestamp\":\"$timestamp\",\"event\":\"$event\",\"data\":$data}" >> "$PERF_LOG"
}

# Enhanced progress calculation with ETA
calculate_progress() {
    local imported=$1
    local total=$2
    local start_time=$3
    local current_time=$4
    
    local elapsed=$((current_time - start_time))
    local rate=0
    local eta="--:--"
    
    if [ "$imported" -gt 0 ] && [ "$elapsed" -gt 0 ]; then
        rate=$(echo "scale=2; $imported / $elapsed * 60" | bc 2>/dev/null || echo "0")
        local remaining=$((total - imported))
        if [ "$rate" != "0" ]; then
            local eta_mins=$(echo "scale=0; $remaining / $rate" | bc 2>/dev/null || echo "0")
            eta=$(printf "%02d:%02d" $((eta_mins / 60)) $((eta_mins % 60)))
        fi
    fi
    
    echo "$rate|$eta"
}

# Smart retry logic with exponential backoff
retry_with_backoff() {
    local cmd="$1"
    local max_attempts=5
    local attempt=1
    local delay=1
    
    while [ $attempt -le $max_attempts ]; do
        if eval "$cmd"; then
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Retry $attempt/$max_attempts failed, waiting ${delay}s...${NC}"
        sleep $delay
        delay=$((delay * 2))
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ Command failed after $max_attempts attempts${NC}"
    return 1
}

# Advanced progress bar with color coding
draw_enhanced_progress_bar() {
    local current=$1
    local total=$2
    local width=50
    local percent=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))
    
    local color=$RED
    if [ $percent -gt 30 ]; then color=$YELLOW; fi
    if [ $percent -gt 70 ]; then color=$GREEN; fi
    
    printf "${color}["
    printf "%*s" $filled | tr ' ' '█'
    printf "${DIM}%*s${NC}${color}" $empty | tr ' ' '░'
    printf "] %3d%%${NC}" $percent
}

# Memory-optimized file analysis
analyze_files() {
    local file_count=0
    local total_size=0
    local sample_files=0
    local max_samples=10
    
    for file in "$CSV_DIR"/*.csv; do
        if [ -f "$file" ]; then
            file_count=$((file_count + 1))
            local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
            total_size=$((total_size + size))
            
            sample_files=$((sample_files + 1))
            if [ $sample_files -ge $max_samples ]; then
                break
            fi
        fi
    done
    
    local avg_size_mb=50
    if [ $file_count -gt 0 ] && [ $total_size -gt 0 ]; then
        avg_size_mb=$(echo "scale=0; $total_size / $sample_files / 1024 / 1024" | bc 2>/dev/null || echo "50")
    fi
    
    echo "$file_count|$avg_size_mb"
}

# Process distribution with load balancing
distribute_files() {
    local file_count=$1
    local num_processes=$2
    
    local base_files_per_process=$((file_count / num_processes))
    local remainder=$((file_count % num_processes))
    local current_start=0
    
    for ((i=0; i<num_processes; i++)); do
        local files_for_this_process=$base_files_per_process
        if [ $i -lt $remainder ]; then
            files_for_this_process=$((files_for_this_process + 1))
        fi
        
        local end=$((current_start + files_for_this_process))
        echo "$current_start:$end"
        current_start=$end
    done
}

# Main execution function
main() {
    # Initialize
    echo -e "${BOLD}${BLUE}"
    echo "██████╗  █████╗ ██████╗  █████╗ ██╗     ██╗     ███████╗██╗     "
    echo "██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║     ██║     ██╔════╝██║     "
    echo "██████╔╝███████║██████╔╝███████║██║     ██║     █████╗  ██║     "
    echo "██╔═══╝ ██╔══██║██╔══██╗██╔══██║██║     ██║     ██╔══╝  ██║     "
    echo "██║     ██║  ██║██║  ██║██║  ██║███████╗███████╗███████╗███████╗"
    echo "╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚══════╝"
    echo -e "${NC}${BOLD}           IMPORT V2 - PRODUCTION OPTIMIZED${NC}"
    echo ""
    
    # Create directories
    mkdir -p "$LOG_DIR"
    
    # System information
    echo -e "${WHITE}🖥️  SYSTEM CONFIGURATION${NC}"
    echo -e "   CPU Cores: ${GREEN}$CPU_CORES${NC}"
    echo -e "   Total RAM: ${GREEN}${TOTAL_RAM_GB}GB${NC}"
    echo -e "   Available RAM: ${GREEN}${AVAILABLE_RAM_GB}GB${NC}"
    echo ""
    
    # File analysis
    echo -e "${CYAN}🔍 Analyzing CSV files for optimization...${NC}"
    local analysis_result
    analysis_result=$(analyze_files)
    local file_count=$(echo "$analysis_result" | cut -d'|' -f1)
    local avg_file_size=$(echo "$analysis_result" | cut -d'|' -f2)
    
    if [ "$file_count" -eq 0 ]; then
        echo -e "${RED}❌ No CSV files found in $CSV_DIR${NC}"
        exit 1
    fi
    
    # Performance optimization calculations
    local num_processes
    num_processes=$(calculate_optimal_processes "$file_count")
    local batch_size
    batch_size=$(calculate_batch_size "$avg_file_size")
    
    echo -e "${WHITE}⚡ PERFORMANCE OPTIMIZATION${NC}"
    echo -e "   Files to process: ${GREEN}$file_count${NC}"
    echo -e "   Average file size: ${GREEN}${avg_file_size}MB${NC}"
    echo -e "   Parallel processes: ${GREEN}$num_processes${NC}"
    echo -e "   Batch size: ${GREEN}$batch_size${NC}"
    echo ""
    
    # Clean up existing processes
    echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
    pkill -f "import-parallel-optimal.js" 2>/dev/null || true
    sleep 2
    
    # Distribute files across processes
    local file_ranges
    file_ranges=($(distribute_files "$file_count" "$num_processes"))
    
    echo -e "${WHITE}📋 PROCESS DISTRIBUTION${NC}"
    local pids=()
    for ((i=0; i<num_processes; i++)); do
        local range=${file_ranges[$i]}
        local start=$(echo "$range" | cut -d':' -f1)
        local end=$(echo "$range" | cut -d':' -f2)
        local count=$((end - start))
        
        echo -e "   Process $((i+1)): Files $start-$((end-1)) (${count} files)"
        
        # Start process with optimized parameters
        BATCH_SIZE=$batch_size node "$SCRIPT_DIR/import-parallel-optimal.js" \
            "$start" "$end" > "$LOG_DIR/process$((i+1)).log" 2>&1 &
        pids[$i]=$!
    done
    echo ""
    
    # Performance monitoring loop
    local start_time
    start_time=$(date +%s)
    local peak_rate=0
    local initial_file_count=$file_count  # Store initial count to avoid recalculation issues
    
    log_performance "import_start" "{\"files\":$file_count,\"processes\":$num_processes,\"batch_size\":$batch_size}"
    
    while true; do
        local running_processes=0
        for pid in "${pids[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                running_processes=$((running_processes + 1))
            fi
        done
        
        if [ $running_processes -eq 0 ]; then
            break
        fi
        
        # Collect metrics
        local current_time
        current_time=$(date +%s)
        local remaining
        remaining=$(find "$CSV_DIR" -name "*.csv" 2>/dev/null | wc -l | tr -d ' ')
        local imported=$((initial_file_count - remaining))
        
        # Ensure imported count is not negative
        if [ $imported -lt 0 ]; then
            imported=0
        fi
        
        # Calculate performance metrics
        local progress_info
        progress_info=$(calculate_progress "$imported" "$initial_file_count" "$start_time" "$current_time")
        local current_rate=$(echo "$progress_info" | cut -d'|' -f1)
        local eta=$(echo "$progress_info" | cut -d'|' -f2)
        
        # Track peak performance
        if [ "$current_rate" != "0" ] && (( $(echo "$current_rate > $peak_rate" | bc -l 2>/dev/null || echo "0") )); then
            peak_rate=$current_rate
        fi
        
        # Enhanced display
        printf "\033[H\033[J"
        echo -e "${BOLD}${BLUE}🚀 PARALLEL IMPORT V2 - LIVE MONITOR${NC}"
        echo "══════════════════════════════════════════════════════════════════════════"
        echo ""
        
        # Progress section
        echo -e "${WHITE}📊 OVERALL PROGRESS${NC}"
        printf "   "
        draw_enhanced_progress_bar "$imported" "$initial_file_count"
        echo ""
        echo -e "   Files: ${GREEN}$imported${NC}/${BLUE}$initial_file_count${NC} | Remaining: ${YELLOW}$remaining${NC}"
        echo -e "   Rate: ${GREEN}${current_rate} files/min${NC} | Peak: ${PURPLE}${peak_rate} files/min${NC}"
        echo -e "   ETA: ${CYAN}$eta${NC}"
        echo ""
        
        # Process status
        echo -e "${WHITE}🔧 PROCESS STATUS${NC}"
        for ((i=0; i<num_processes; i++)); do
            local pid=${pids[$i]}
            local status="✅ Complete"
            
            if kill -0 "$pid" 2>/dev/null; then
                status="${GREEN}🔄 Running${NC}"
            fi
            
            echo -e "   Process $((i+1)): $status"
        done
        echo ""
        
        # Performance metrics
        local elapsed=$((current_time - start_time))
        local hours=$((elapsed / 3600))
        local minutes=$(((elapsed % 3600) / 60))
        local seconds=$((elapsed % 60))
        
        echo -e "${WHITE}⏱️  PERFORMANCE METRICS${NC}"
        printf "   Elapsed: %02d:%02d:%02d | " $hours $minutes $seconds
        echo -e "Active Processes: ${GREEN}$running_processes${NC}/$num_processes"
        echo ""
        
        # Recent activity
        echo -e "${WHITE}📋 RECENT ACTIVITY${NC}"
        if find "$LOG_DIR" -name "process*.log" -exec grep -l . {} \; &>/dev/null; then
            find "$LOG_DIR" -name "process*.log" -exec tail -n 2 {} \; 2>/dev/null | \
                grep -E "(✅|❌|📤|Progress)" | tail -4 | sed 's/^/   /' || echo "   Starting processes..."
        else
            echo "   Initializing import processes..."
        fi
        echo ""
        
        echo -e "${DIM}💡 TIP: Use 'tail -f $LOG_DIR/process*.log' for detailed logs${NC}"
        echo "══════════════════════════════════════════════════════════════════════════"
        
        sleep 2
    done
    
    # Wait for all processes to complete
    for pid in "${pids[@]}"; do
        wait "$pid" 2>/dev/null || true
    done
    
    # Final report
    local end_time
    end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    local final_imported
    local final_remaining
    final_remaining=$(find "$CSV_DIR" -name "*.csv" 2>/dev/null | wc -l | tr -d ' ')
    local final_imported=$((initial_file_count - final_remaining))
    
    # Ensure final imported count is not negative
    if [ $final_imported -lt 0 ]; then
        final_imported=0
    fi
    
    printf "\033[H\033[J"
    echo -e "${BOLD}${GREEN}🎉 IMPORT COMPLETE!${NC}"
    echo "══════════════════════════════════════════════════════════════════════════"
    echo ""
    
    # Success metrics - avoid division by zero
    local success_rate=0
    if [ $initial_file_count -gt 0 ]; then
        success_rate=$((final_imported * 100 / initial_file_count))
    fi
    
    echo -e "${WHITE}📊 FINAL RESULTS${NC}"
    printf "   "
    draw_enhanced_progress_bar "$final_imported" "$initial_file_count"
    echo ""
    echo -e "   Files processed: ${GREEN}$final_imported${NC}/$initial_file_count (${GREEN}$success_rate%${NC})"
    
    local hours=$((total_time / 3600))
    local minutes=$(((total_time % 3600) / 60))
    local seconds=$((total_time % 60))
    
    echo -e "   Total time: ${BLUE}%02d:%02d:%02d${NC}" $hours $minutes $seconds
    echo ""
    
    # Error analysis
    local total_errors=0
    for logfile in "$LOG_DIR"/process*.log; do
        if [ -f "$logfile" ]; then
            local errors
            errors=$(grep -c "❌\|Error\|Failed" "$logfile" 2>/dev/null || echo "0")
            total_errors=$((total_errors + errors))
        fi
    done
    
    echo -e "${WHITE}🔍 QUALITY REPORT${NC}"
    if [ $total_errors -gt 0 ]; then
        echo -e "   ⚠️  ${YELLOW}$total_errors${NC} errors detected"
        echo -e "   📋 Check logs: ${CYAN}$LOG_DIR/${NC}"
    else
        echo -e "   ✅ ${GREEN}No errors detected - Perfect execution!${NC}"
    fi
    echo ""
    
    # Run verification if available
    if [ -f "$SCRIPT_DIR/verify-import-complete.js" ]; then
        echo "══════════════════════════════════════════════════════════════════════════"
        echo -e "${GREEN}🔍 Running verification...${NC}"
        retry_with_backoff "node '$SCRIPT_DIR/verify-import-complete.js'" || true
    else
        echo -e "${GREEN}✅ Import process completed successfully!${NC}"
    fi
    
    echo "══════════════════════════════════════════════════════════════════════════"
}

# Dependency checks
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js not found${NC}"; exit 1; }
command -v bc >/dev/null 2>&1 || { echo -e "${RED}❌ bc calculator not found${NC}"; exit 1; }

# Execute main function
main "$@"