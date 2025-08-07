#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
# Adjust these patterns to match your project structure.
TYPESCRIPT_PROJECT_PATH="." # Path to your tsconfig.json
PYTHON_PATHS_TO_CHECK="."   # Path(s) to check for Python files, e.g., "src/ data/"

# --- Color Codes for Output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Helper Function for Headers ---
print_header() {
    echo -e "\n${YELLOW}--- $1 ---${NC}\n"
}

# ==============================================================================
# PHASE 1: BASELINE ANALYSIS
# ==============================================================================
print_header "PHASE 1: Analyzing Initial State..."

echo "Calculating initial TypeScript error count..."
# Run tsc, count the lines of output. Use || true to prevent exit on error.
initial_ts_errors=$(npx tsc --project $TYPESCRIPT_PROJECT_PATH --noEmit --pretty false | wc -l)
echo "Calculating initial Flake8 error count..."
# Run flake8, count the lines.
initial_flake8_errors=$(flake8 $PYTHON_PATHS_TO_CHECK | wc -l)

total_initial_errors=$((initial_ts_errors + initial_flake8_errors))

echo -e "${GREEN}Initial Analysis Complete:${NC}"
echo "  - TypeScript Errors: $initial_ts_errors"
echo "  - Python (Flake8) Errors: $initial_flake8_errors"
echo "  - Total Initial Errors: $total_initial_errors"

# ==============================================================================
# PHASE 2: AUTOMATED FIXING
# ==============================================================================
print_header "PHASE 2: Running Automated Fixers..."

echo "Fixing formatting with Prettier..."
npx prettier --write .

echo "Fixing linting issues with ESLint..."
npx eslint --fix .

echo "Fixing formatting with Black..."
black $PYTHON_PATHS_TO_CHECK

echo -e "${GREEN}Automated fixers have completed.${NC}"

# ==============================================================================
# PHASE 3: FINAL ANALYSIS & PROGRESS REPORT
# ==============================================================================
print_header "PHASE 3: Calculating Final State and Progress..."

echo "Calculating remaining TypeScript error count..."
final_ts_errors=$(npx tsc --project $TYPESCRIPT_PROJECT_PATH --noEmit --pretty false | wc -l)
echo "Calculating remaining Flake8 error count..."
final_flake8_errors=$(flake8 $PYTHON_PATHS_TO_CHECK | wc -l)

total_final_errors=$((final_ts_errors + final_flake8_errors))

# --- Calculation ---
ts_errors_fixed=$((initial_ts_errors - final_ts_errors))
flake8_errors_fixed=$((initial_flake8_errors - final_flake8_errors))
total_errors_fixed=$((total_initial_errors - total_final_errors))

# --- Percentage Calculation ---
if [ $total_initial_errors -eq 0 ]; then
    percentage_complete=100
else
    # Use 'bc' for floating point arithmetic
    percentage_complete=$(echo "scale=2; ($total_errors_fixed * 100) / $total_initial_errors" | bc)
fi

# --- Final Report ---
print_header "✅ SCRIPT COMPLETE: PROGRESS REPORT"
echo -e "Initial State:"
echo "  - Total Errors: $total_initial_errors (TS: $initial_ts_errors, Py: $initial_flake8_errors)"
echo ""
echo -e "Automated Fixes:"
echo "  - TypeScript Errors Fixed: $ts_errors_fixed"
echo "  - Python (Flake8) Errors Fixed: $flake8_errors_fixed"
echo -e "  - ${GREEN}Total Errors Fixed Automatically: $total_errors_fixed${NC}"
echo ""
echo -e "Current Status:"
echo "  - Remaining TypeScript Errors: $final_ts_errors"
echo "  - Remaining Python (Flake8) Errors: $final_flake8_errors"
echo -e "  - ${RED}Total Manual Fixes Required: $total_final_errors${NC}"
echo ""
echo -e "${YELLOW}--------------------------------------------------${NC}"
echo -e "${YELLOW}PROGRESS: ${percentage_complete}% of identifiable errors fixed.${NC}"
echo -e "--------------------------------------------------${NC}"

echo "Next Steps: Manually address the remaining $total_final_errors errors."
