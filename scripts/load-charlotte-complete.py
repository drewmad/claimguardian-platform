#!/usr/bin/env python3

import csv
import subprocess
import time
import sys

def process_csv_batch(csv_file, start_row, batch_size=500):
    """Process a batch of rows from CSV and insert via SQL"""
    
    def escape_sql(value):
        if value is None or value == '' or value.strip() == '':
            return 'NULL'
        return f"'{str(value).replace('\'', '\'\'').strip()}'".replace('\n', ' ')
    
    values = []
    
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        
        for i, row in enumerate(reader):
            if i < start_row:
                continue
            if i >= start_row + batch_size:
                break
                
            val = f"""({row.get('CO_NO', 18)}, {escape_sql(row.get('PARCEL_ID'))}, {escape_sql(row.get('OWN_NAME', 'UNKNOWN'))}, {escape_sql(row.get('PHY_ADDR1'))}, {escape_sql(row.get('PHY_CITY'))}, {escape_sql(row.get('PHY_ZIPCD'))}, {row.get('LND_VAL') or 'NULL'}, {row.get('JV') or 'NULL'})"""
            values.append(val)
    
    if not values:
        return 0
    
    # Create SQL
    sql = f"""INSERT INTO florida_parcels (co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv) VALUES
{',\\n'.join(values)}
ON CONFLICT DO NOTHING;"""
    
    # Execute via MCP
    result = subprocess.run([
        'mcp', 'supabase', 'execute-sql',
        '--project-id', 'tmlrvecuwgppbaynesji',
        '--query', sql
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"\\nError: {result.stderr}")
        return -1
    
    return len(values)

def main():
    csv_files = [
        '/Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks/charlotte_part_aa.csv',
        '/Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks/charlotte_part_ab.csv',
        '/Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks/charlotte_part_ac.csv',
        '/Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks/charlotte_part_ad.csv',
        '/Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks/charlotte_part_ae.csv'
    ]
    
    batch_size = 500
    total_processed = 0
    
    print("Loading Charlotte County parcels...")
    print(f"Batch size: {batch_size}")
    print()
    
    for file_idx, csv_file in enumerate(csv_files):
        print(f"\\nProcessing file {file_idx + 1}/{len(csv_files)}: {csv_file.split('/')[-1]}")
        
        # Count rows in file
        with open(csv_file, 'r') as f:
            file_rows = sum(1 for line in f) - 1  # Subtract header
        
        print(f"Total rows in file: {file_rows:,}")
        
        start_row = 0
        file_processed = 0
        
        while start_row < file_rows:
            # Show progress
            progress = (start_row / file_rows) * 100
            sys.stdout.write(f'\\r[{progress:.1f}%] Processing rows {start_row}-{start_row + batch_size}...')
            sys.stdout.flush()
            
            # Process batch
            result = process_csv_batch(csv_file, start_row, batch_size)
            
            if result == -1:
                print("\\nError processing batch. Stopping.")
                return
            
            file_processed += result
            start_row += batch_size
            
            if result == 0:
                break
        
        print(f'\\r[100%] Completed! Processed {file_processed:,} rows from this file.')
        total_processed += file_processed
    
    print(f"\\n\\nTotal parcels loaded: {total_processed:,}")
    print("\\nVerifying in database...")
    
    # Check count
    result = subprocess.run([
        'mcp', 'supabase', 'execute-sql',
        '--project-id', 'tmlrvecuwgppbaynesji',
        '--query', 'SELECT COUNT(*) as count FROM florida_parcels WHERE co_no = 18;'
    ], capture_output=True, text=True)
    
    print(f"Database result: {result.stdout}")

if __name__ == "__main__":
    main()