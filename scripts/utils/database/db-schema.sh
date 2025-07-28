#!/bin/bash

# Database schema management script for single-file approach

set -e

SCHEMA_FILE="supabase/schema.sql"
PROJECT_ID="tmlrvecuwgppbaynesji"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  dump     - Dump current production schema to schema.sql"
    echo "  apply    - Apply schema.sql to database (via Supabase dashboard)"
    echo "  diff     - Show differences between local and production"
    echo "  backup   - Create timestamped backup of current schema"
    echo "  validate - Validate schema file syntax"
    echo ""
    exit 1
}

dump_schema() {
    echo -e "${YELLOW}📥 Dumping production schema...${NC}"
    
    if [ -f "$SCHEMA_FILE" ]; then
        # Create backup of existing schema
        backup_schema
    fi
    
    supabase db dump --schema public > "$SCHEMA_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Schema dumped successfully to $SCHEMA_FILE${NC}"
        echo -e "${GREEN}   Size: $(wc -l < "$SCHEMA_FILE") lines${NC}"
    else
        echo -e "${RED}❌ Failed to dump schema${NC}"
        exit 1
    fi
}

apply_schema() {
    echo -e "${YELLOW}📤 Applying schema...${NC}"
    echo ""
    echo "Since we're using Supabase hosted, the schema needs to be applied via the dashboard."
    echo ""
    echo "Steps:"
    echo "1. Copy schema to clipboard:"
    echo "   cat $SCHEMA_FILE | pbcopy"
    echo ""
    echo "2. Open Supabase SQL Editor:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_ID/editor"
    echo ""
    echo "3. Paste and run the schema"
    echo ""
    
    # Copy to clipboard if on macOS
    if command -v pbcopy &> /dev/null; then
        cat "$SCHEMA_FILE" | pbcopy
        echo -e "${GREEN}✅ Schema copied to clipboard!${NC}"
    fi
    
    # Try to open dashboard
    if command -v open &> /dev/null; then
        open "https://supabase.com/dashboard/project/$PROJECT_ID/editor"
        echo -e "${GREEN}✅ Opened Supabase dashboard${NC}"
    fi
}

diff_schema() {
    echo -e "${YELLOW}🔍 Comparing schemas...${NC}"
    
    # Dump current production to temp file
    TEMP_SCHEMA="/tmp/production_schema_$$.sql"
    echo "Dumping current production schema..."
    supabase db dump --schema public > "$TEMP_SCHEMA"
    
    if [ -f "$SCHEMA_FILE" ]; then
        echo ""
        echo "Differences between local schema.sql and production:"
        echo "==================================================="
        
        # Use diff with context
        if diff -u "$SCHEMA_FILE" "$TEMP_SCHEMA" > /tmp/schema_diff_$$; then
            echo -e "${GREEN}✅ No differences found - schemas are in sync${NC}"
        else
            # Count changes
            ADDITIONS=$(grep -c "^+" /tmp/schema_diff_$$ || true)
            DELETIONS=$(grep -c "^-" /tmp/schema_diff_$$ || true)
            
            echo -e "${YELLOW}Found differences:${NC}"
            echo "  Additions: $ADDITIONS lines"
            echo "  Deletions: $DELETIONS lines"
            echo ""
            echo "Full diff:"
            cat /tmp/schema_diff_$$
        fi
        
        rm -f /tmp/schema_diff_$$
    else
        echo -e "${RED}❌ Local schema.sql not found${NC}"
    fi
    
    rm -f "$TEMP_SCHEMA"
}

backup_schema() {
    if [ -f "$SCHEMA_FILE" ]; then
        BACKUP_FILE="supabase/schema_backup_$(date +%Y%m%d_%H%M%S).sql"
        cp "$SCHEMA_FILE" "$BACKUP_FILE"
        echo -e "${GREEN}✅ Backed up current schema to $BACKUP_FILE${NC}"
    fi
}

validate_schema() {
    echo -e "${YELLOW}🔧 Validating schema...${NC}"
    
    if [ ! -f "$SCHEMA_FILE" ]; then
        echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
        exit 1
    fi
    
    # Basic validation checks
    echo "Running validation checks..."
    
    # Check for common issues
    if grep -q "CREATE SCHEMA.*auth" "$SCHEMA_FILE"; then
        echo -e "${RED}⚠️  Warning: Schema contains auth schema creation (usually handled by Supabase)${NC}"
    fi
    
    # Count key elements
    TABLES=$(grep -c "CREATE TABLE" "$SCHEMA_FILE" || true)
    INDEXES=$(grep -c "CREATE INDEX" "$SCHEMA_FILE" || true)
    FUNCTIONS=$(grep -c "CREATE FUNCTION" "$SCHEMA_FILE" || true)
    POLICIES=$(grep -c "CREATE POLICY" "$SCHEMA_FILE" || true)
    
    echo ""
    echo "Schema Statistics:"
    echo "  Tables:    $TABLES"
    echo "  Indexes:   $INDEXES"
    echo "  Functions: $FUNCTIONS"
    echo "  Policies:  $POLICIES"
    
    # Check file size
    SIZE=$(wc -l < "$SCHEMA_FILE")
    if [ $SIZE -lt 100 ]; then
        echo -e "${RED}⚠️  Warning: Schema seems too small ($SIZE lines)${NC}"
    else
        echo -e "${GREEN}✅ Schema size looks reasonable ($SIZE lines)${NC}"
    fi
}

# Main script
case "${1:-}" in
    dump)
        dump_schema
        ;;
    apply)
        apply_schema
        ;;
    diff)
        diff_schema
        ;;
    backup)
        backup_schema
        ;;
    validate)
        validate_schema
        ;;
    *)
        usage
        ;;
esac