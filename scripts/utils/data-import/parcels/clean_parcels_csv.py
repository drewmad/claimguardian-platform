#!/usr/bin/env python3
"""
Clean Florida parcels CSV data for Supabase import.
Converts empty strings and spaces in numeric columns to empty (NULL).
"""

import csv
import sys
import argparse
from pathlib import Path

# Numeric columns that need cleaning
NUMERIC_COLUMNS = {
    'OBJECTID': 'bigint',
    'CO_NO': 'integer',
    'ASMNT_YR': 'integer',
    'JV': 'numeric',
    'AV_SD': 'numeric',
    'AV_NSD': 'numeric',
    'TV_SD': 'numeric',
    'TV_NSD': 'numeric',
    'LAND_VAL': 'numeric',
    'BLDG_VAL': 'numeric',
    'TOT_VAL': 'numeric',
    'ACT_YR_BLT': 'integer',
    'EFF_YR_BLT': 'integer',
    'TOT_LVG_AR': 'numeric',
    'LAND_SQFOOT': 'numeric',
    'NO_BULDNG': 'integer',
    'NO_RES_UNT': 'integer',
    'SALE_PRC1': 'numeric',
    'SALE_YR1': 'integer',
    'SALE_PRC2': 'numeric',
    'SALE_YR2': 'integer',
}

def clean_value(value, column_name):
    """Clean a single value based on column type."""
    # Strip whitespace
    value = value.strip()
    
    # If it's a numeric column and contains only spaces or is empty, return empty string (NULL)
    if column_name in NUMERIC_COLUMNS:
        if value in ('', ' ', '  ', '   '):
            return ''
        # Also handle common NULL representations
        if value.upper() in ('NULL', 'NONE', 'N/A', 'NA'):
            return ''
    
    return value

def clean_csv(input_file, output_file):
    """Clean CSV file for Supabase import."""
    print(f"🧹 Cleaning CSV file: {input_file}")
    
    rows_processed = 0
    cells_cleaned = 0
    
    with open(input_file, 'r', newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        if not fieldnames:
            print("❌ Error: No headers found in CSV file")
            return False
        
        print(f"📋 Found {len(fieldnames)} columns")
        
        # Check which numeric columns are present
        numeric_cols_found = [col for col in fieldnames if col in NUMERIC_COLUMNS]
        print(f"🔢 Found {len(numeric_cols_found)} numeric columns to clean: {', '.join(numeric_cols_found[:5])}...")
        
        with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for row in reader:
                rows_processed += 1
                cleaned_row = {}
                
                for column, value in row.items():
                    original_value = value
                    cleaned_value = clean_value(value, column)
                    cleaned_row[column] = cleaned_value
                    
                    if original_value != cleaned_value:
                        cells_cleaned += 1
                
                writer.writerow(cleaned_row)
                
                if rows_processed % 10000 == 0:
                    print(f"  Processed {rows_processed:,} rows...")
    
    print(f"\n✅ Cleaning complete!")
    print(f"📊 Rows processed: {rows_processed:,}")
    print(f"🧹 Cells cleaned: {cells_cleaned:,}")
    print(f"💾 Clean file saved: {output_file}")
    
    return True

def main():
    parser = argparse.ArgumentParser(description='Clean Florida parcels CSV for Supabase import')
    parser.add_argument('input_file', help='Input CSV file path')
    parser.add_argument('-o', '--output', help='Output CSV file path (default: input_cleaned.csv)')
    
    args = parser.parse_args()
    
    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"❌ Error: Input file not found: {input_path}")
        sys.exit(1)
    
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = input_path.parent / f"{input_path.stem}_cleaned{input_path.suffix}"
    
    print(f"🏘️  Florida Parcels CSV Cleaner")
    print("=" * 50)
    
    success = clean_csv(input_path, output_path)
    
    if success:
        print(f"\n📤 Next steps:")
        print(f"1. Go to Supabase Table Editor")
        print(f"2. Select the 'florida_parcels' table")
        print(f"3. Click 'Import data from CSV'")
        print(f"4. Upload: {output_path}")
        print(f"\n💡 The cleaned file has empty strings instead of spaces in numeric columns,")
        print(f"   which Supabase will correctly interpret as NULL values.")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()