#!/usr/bin/env python3
"""
Clean all Florida parcels CSV files in a directory for Supabase import.
Processes all CSV files, handling data type conversions and cleaning.
"""

import csv
import sys
import argparse
import os
from pathlib import Path
from datetime import datetime
import re

# Numeric columns that need cleaning (uppercase as they appear in CSV)
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
    'LND_VAL': 'numeric',
    'LND_SQFOOT': 'numeric',
    'NO_LND_UNT': 'numeric',
    'SPEC_FEAT_': 'numeric',
    'NCONST_VAL': 'numeric',
    'DEL_VAL': 'numeric',
    'DISTR_YR': 'integer',
    'JV_HMSTD': 'numeric',
    'AV_HMSTD': 'numeric',
    'JV_NON_HMS': 'numeric',
    'AV_NON_HMS': 'numeric',
    'JV_RESD_NO': 'numeric',
    'AV_RESD_NO': 'numeric',
    'JV_CLASS_U': 'numeric',
    'AV_CLASS_U': 'numeric',
    'JV_H2O_REC': 'numeric',
    'AV_H2O_REC': 'numeric',
    'JV_CONSRV_': 'numeric',
    'AV_CONSRV_': 'numeric',
    'JV_HIST_CO': 'numeric',
    'AV_HIST_CO': 'numeric',
    'JV_HIST_SI': 'numeric',
    'AV_HIST_SI': 'numeric',
    'JV_WRKNG_W': 'numeric',
    'AV_WRKNG_W': 'numeric',
}

# Text columns that should be trimmed and have empty strings handled
TEXT_COLUMNS = {
    'PARCEL_ID', 'FILE_T', 'DOR_UC', 'PA_UC', 'SPASS_CD', 'JV_CHNG_CD',
    'OWN_NAME', 'OWN_ADDR1', 'OWN_ADDR2', 'OWN_CITY', 'OWN_STATE', 'OWN_ZIPCD',
    'PHY_ADDR1', 'PHY_ADDR2', 'PHY_CITY', 'PHY_ZIPCD', 'S_LEGAL',
    'TWN', 'RNG', 'SEC', 'SALE_MO1', 'SALE_MO2', 'OR_BOOK1', 'OR_PAGE1',
    'OR_BOOK2', 'OR_PAGE2', 'CLERK_NO1', 'CLERK_NO2', 'S_CHNG_CD1', 'S_CHNG_CD2',
    'NBRHD_CD', 'CENSUS_BK', 'MKT_AR', 'FIDU_NAME', 'FIDU_ADDR1', 'FIDU_ADDR2',
    'FIDU_CITY', 'FIDU_STATE', 'FIDU_ZIPCD', 'FIDU_CD', 'APP_STAT', 'CO_APP_STA',
    'PUBLIC_LND', 'TAX_AUTH_C', 'ALT_KEY', 'STATE_PAR_', 'SPC_CIR_CD', 'SPC_CIR_TX',
    'DISTR_CD', 'LND_UNTS_C', 'IMP_QUAL', 'CONST_CLAS', 'OWN_STATE_',
    'ASS_TRNSFR', 'PREV_HMSTD', 'ASS_DIF_TR', 'CONO_PRV_H', 'PARCEL_ID_',
    'YR_VAL_TRN', 'RS_ID', 'MP_ID'
}

# Columns that are definitely uppercase in the CSV
EXPECTED_COLUMNS = {
    'PARCEL_ID', 'CO_NO', 'JV', 'OWN_NAME', 'PHY_ADDR1', 'SALE_PRC1'
}

class CSVCleaner:
    def __init__(self, verbose=True):
        self.verbose = verbose
        self.stats = {
            'files_processed': 0,
            'total_rows': 0,
            'cells_cleaned': 0,
            'errors': 0,
            'files_with_errors': []
        }
    
    def log(self, message):
        """Print message if verbose mode is on."""
        if self.verbose:
            print(message)
    
    def clean_numeric_value(self, value):
        """Clean numeric values - convert empty strings and spaces to NULL."""
        if not value:
            return ''
        
        # Strip whitespace
        value = str(value).strip()
        
        # Check for empty, spaces, or NULL representations
        if value in ('', ' ', '  ', '   ', '.', '..', '...'):
            return ''
        if value.upper() in ('NULL', 'NONE', 'N/A', 'NA', 'NAN', '#N/A'):
            return ''
        
        # Remove any thousands separators and clean up formatting
        value = value.replace(',', '')
        
        # Handle parentheses for negative numbers
        if value.startswith('(') and value.endswith(')'):
            value = '-' + value[1:-1]
        
        # Check if it's a valid number
        try:
            float(value)
            return value
        except ValueError:
            # If it's not a valid number, return empty
            return ''
    
    def clean_text_value(self, value):
        """Clean text values - trim whitespace and handle encoding."""
        if not value:
            return ''
        
        # Convert to string and strip whitespace
        value = str(value).strip()
        
        # Replace multiple spaces with single space
        value = re.sub(r'\s+', ' ', value)
        
        # Handle common encoding issues
        value = value.replace('\x00', '')  # Remove null bytes
        
        return value
    
    def clean_row(self, row):
        """Clean a single row of data."""
        cleaned_row = {}
        cells_cleaned = 0
        
        for column, value in row.items():
            original_value = value
            
            # Check if this is a numeric column
            if column in NUMERIC_COLUMNS:
                cleaned_value = self.clean_numeric_value(value)
            elif column in TEXT_COLUMNS:
                cleaned_value = self.clean_text_value(value)
            else:
                # For unknown columns, just trim whitespace
                cleaned_value = str(value).strip() if value else ''
            
            cleaned_row[column] = cleaned_value
            
            if original_value != cleaned_value:
                cells_cleaned += 1
        
        return cleaned_row, cells_cleaned
    
    def validate_headers(self, headers):
        """Validate that we have expected column headers."""
        headers_set = set(headers)
        missing_expected = EXPECTED_COLUMNS - headers_set
        
        if missing_expected:
            self.log(f"⚠️  Warning: Missing expected columns: {missing_expected}")
            self.log("   File might not be a Florida parcels CSV")
            return False
        
        return True
    
    def clean_csv_file(self, input_file, output_file):
        """Clean a single CSV file."""
        self.log(f"\n📄 Processing: {input_file.name}")
        
        try:
            rows_processed = 0
            file_cells_cleaned = 0
            
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            file_content = None
            used_encoding = None
            
            for encoding in encodings:
                try:
                    with open(input_file, 'r', encoding=encoding) as f:
                        file_content = f.read()
                        used_encoding = encoding
                        break
                except UnicodeDecodeError:
                    continue
            
            if not file_content:
                raise Exception("Could not decode file with any known encoding")
            
            self.log(f"   Using encoding: {used_encoding}")
            
            # Process the CSV
            from io import StringIO
            input_buffer = StringIO(file_content)
            
            reader = csv.DictReader(input_buffer)
            fieldnames = reader.fieldnames
            
            if not fieldnames:
                raise Exception("No headers found in CSV file")
            
            # Validate headers
            if not self.validate_headers(fieldnames):
                self.log("   ⚠️  Skipping file - doesn't appear to be parcels data")
                return False
            
            self.log(f"   Found {len(fieldnames)} columns")
            
            # Count numeric columns
            numeric_cols_found = [col for col in fieldnames if col in NUMERIC_COLUMNS]
            self.log(f"   Cleaning {len(numeric_cols_found)} numeric columns")
            
            # Write cleaned data
            with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
                writer = csv.DictWriter(outfile, fieldnames=fieldnames)
                writer.writeheader()
                
                for row in reader:
                    rows_processed += 1
                    cleaned_row, cells_cleaned = self.clean_row(row)
                    file_cells_cleaned += cells_cleaned
                    writer.writerow(cleaned_row)
                    
                    if rows_processed % 10000 == 0:
                        self.log(f"   Processed {rows_processed:,} rows...")
            
            self.stats['total_rows'] += rows_processed
            self.stats['cells_cleaned'] += file_cells_cleaned
            
            self.log(f"   ✅ Cleaned {rows_processed:,} rows, {file_cells_cleaned:,} cells modified")
            return True
            
        except Exception as e:
            self.log(f"   ❌ Error: {str(e)}")
            self.stats['errors'] += 1
            self.stats['files_with_errors'].append(input_file.name)
            return False
    
    def process_directory(self, input_dir, output_dir):
        """Process all CSV files in a directory."""
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        
        # Create output directory if it doesn't exist
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Find all CSV files
        csv_files = list(input_path.glob('*.csv'))
        
        if not csv_files:
            self.log(f"❌ No CSV files found in {input_path}")
            return False
        
        self.log(f"🔍 Found {len(csv_files)} CSV files to process")
        
        # Process each file
        for csv_file in csv_files:
            output_file = output_path / f"{csv_file.stem}_cleaned.csv"
            
            if self.clean_csv_file(csv_file, output_file):
                self.stats['files_processed'] += 1
        
        return True
    
    def print_summary(self):
        """Print processing summary."""
        print("\n" + "=" * 60)
        print("📊 PROCESSING SUMMARY")
        print("=" * 60)
        print(f"✅ Files successfully processed: {self.stats['files_processed']}")
        print(f"📄 Total rows processed: {self.stats['total_rows']:,}")
        print(f"🧹 Total cells cleaned: {self.stats['cells_cleaned']:,}")
        
        if self.stats['errors'] > 0:
            print(f"❌ Files with errors: {self.stats['errors']}")
            print(f"   Error files: {', '.join(self.stats['files_with_errors'])}")
        
        print("=" * 60)

def main():
    parser = argparse.ArgumentParser(
        description='Clean all Florida parcels CSV files in a directory for Supabase import'
    )
    parser.add_argument('input_dir', help='Directory containing CSV files')
    parser.add_argument(
        '-o', '--output-dir', 
        help='Output directory for cleaned files (default: input_dir/cleaned)'
    )
    parser.add_argument(
        '-q', '--quiet', 
        action='store_true',
        help='Quiet mode - only show summary'
    )
    
    args = parser.parse_args()
    
    input_path = Path(args.input_dir)
    if not input_path.exists():
        print(f"❌ Error: Input directory not found: {input_path}")
        sys.exit(1)
    
    if not input_path.is_dir():
        print(f"❌ Error: Input path is not a directory: {input_path}")
        sys.exit(1)
    
    # Set output directory
    if args.output_dir:
        output_path = Path(args.output_dir)
    else:
        output_path = input_path / 'cleaned'
    
    print(f"🏘️  Florida Parcels CSV Batch Cleaner")
    print("=" * 60)
    print(f"📁 Input directory: {input_path}")
    print(f"📁 Output directory: {output_path}")
    print("=" * 60)
    
    # Create cleaner instance
    cleaner = CSVCleaner(verbose=not args.quiet)
    
    # Process all files
    start_time = datetime.now()
    success = cleaner.process_directory(input_path, output_path)
    end_time = datetime.now()
    
    # Print summary
    cleaner.print_summary()
    
    if success and cleaner.stats['files_processed'] > 0:
        duration = (end_time - start_time).total_seconds()
        print(f"\n⏱️  Processing time: {duration:.1f} seconds")
        print(f"\n📤 Next steps:")
        print(f"1. Go to Supabase Table Editor")
        print(f"2. Select the 'florida_parcels' table")
        print(f"3. Click 'Import data from CSV'")
        print(f"4. Upload files from: {output_path}")
        print(f"\n💡 Tips:")
        print(f"   - Upload files one at a time for better error tracking")
        print(f"   - The import will handle duplicates with UPSERT on parcel_id")
        print(f"   - Empty strings in numeric columns will become NULL values")
    else:
        print("\n❌ No files were successfully processed")
        sys.exit(1)

if __name__ == "__main__":
    main()