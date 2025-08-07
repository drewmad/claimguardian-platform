#!/bin/bash

# Clean CSV file for import - handle empty values properly

INPUT_CSV=$1
OUTPUT_CSV=$2

if [ -z "$INPUT_CSV" ] || [ -z "$OUTPUT_CSV" ]; then
    echo "Usage: $0 <input_csv> <output_csv>"
    exit 1
fi

echo "Cleaning CSV file: $INPUT_CSV -> $OUTPUT_CSV"

# Use awk to clean the data
awk -F',' '
BEGIN {
    OFS=","
}
NR==1 {
    # Print header as-is
    print
}
NR>1 {
    # Clean each field
    for (i = 1; i <= NF; i++) {
        # Remove leading/trailing spaces
        gsub(/^[ \t]+|[ \t]+$/, "", $i)

        # Handle numeric fields (columns that should be integers)
        # JV fields (11-20), value fields (21-22), sqfoot/area (33-35), sale fields (36-38, 43-45)
        if ((i >= 11 && i <= 22) || (i >= 33 && i <= 38) || (i >= 43 && i <= 45)) {
            if ($i == "" || $i == " " || $i == "  " || $i == "NULL") {
                $i = "0"
            }
        }

        # Handle text fields that might have commas or quotes
        if ((i >= 23 && i <= 32) || i == 50) {  # owner/address fields and legal description
            # Escape quotes
            gsub(/"/, "\"\"", $i)
            # If field contains comma or quote, wrap in quotes
            if (index($i, ",") > 0 || index($i, "\"") > 0 || index($i, "\n") > 0) {
                $i = "\"" $i "\""
            }
        }
    }
    print
}' "$INPUT_CSV" > "$OUTPUT_CSV"

echo "Cleaned $(wc -l < $OUTPUT_CSV) rows"
