#\!/usr/bin/env python3

import psycopg2
import csv
import sys
import time
from psycopg2.extras import execute_values

# Database connection
conn_string = "postgresql://postgres.tmlrvecuwgppbaynesji:Madengineering%231@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

def show_progress(current, total, start_time):
    """Display progress bar"""
    percent = (current / total) * 100
    elapsed = time.time() - start_time
    rate = current / elapsed if elapsed > 0 else 0
    eta = (total - current) / rate if rate > 0 else 0
    
    bar_length = 50
    filled = int(bar_length * current / total)
    bar = '█' * filled + '░' * (bar_length - filled)
    
    sys.stdout.write(f'\r[{bar}] {percent:.1f}% | {current:,}/{total:,} rows | {rate:.0f} rows/s | ETA: {eta:.0f}s ')
    sys.stdout.flush()

def load_csv_file(filepath):
    """Load a single CSV file to database"""
    print(f"\nLoading: {filepath}")
    
    # Count rows
    with open(filepath, 'r') as f:
        total_rows = sum(1 for line in f) - 1
    print(f"Total rows: {total_rows:,}")
    
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()
    
    start_time = time.time()
    processed = 0
    batch = []
    batch_size = 500
    
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Map CSV columns to lowercase database columns
            record = []
            for col in reader.fieldnames:
                value = row[col]
                # Handle empty strings as NULL
                if value == '':
                    record.append(None)
                else:
                    record.append(value)
            
            batch.append(record)
            
            if len(batch) >= batch_size:
                # Insert batch
                columns = [col.lower() for col in reader.fieldnames if col.lower() in ['co_no', 'parcel_id', 'own_name', 'phy_addr1', 'phy_city', 'phy_zipcd', 'lnd_val', 'jv', 'shape_area']]
                
                query = f"""
                INSERT INTO florida_parcels ({','.join(columns)})
                VALUES %s
                ON CONFLICT DO NOTHING
                """
                
                # Extract only the columns we need
                filtered_batch = []
                for record in batch:
                    filtered_record = []
                    for i, col in enumerate(reader.fieldnames):
                        if col.lower() in columns:
                            filtered_record.append(record[i])
                    filtered_batch.append(filtered_record)
                
                execute_values(cur, query, filtered_batch)
                conn.commit()
                
                processed += len(batch)
                batch = []
                show_progress(processed, total_rows, start_time)
    
    # Insert remaining
    if batch:
        columns = [col.lower() for col in reader.fieldnames if col.lower() in ['co_no', 'parcel_id', 'own_name', 'phy_addr1', 'phy_city', 'phy_zipcd', 'lnd_val', 'jv', 'shape_area']]
        
        query = f"""
        INSERT INTO florida_parcels ({','.join(columns)})
        VALUES %s
        ON CONFLICT DO NOTHING
        """
        
        filtered_batch = []
        for record in batch:
            filtered_record = []
            for i, col in enumerate(reader.fieldnames):
                if col.lower() in columns:
                    filtered_record.append(record[i])
            filtered_batch.append(filtered_record)
        
        execute_values(cur, query, filtered_batch)
        conn.commit()
        processed += len(batch)
        show_progress(processed, total_rows, start_time)
    
    cur.close()
    conn.close()
    
    elapsed = time.time() - start_time
    print(f"\n✅ Complete\! {elapsed:.1f}s ({processed/elapsed:.0f} rows/s)")

if __name__ == "__main__":
    import glob
    
    files = sorted(glob.glob("/Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks/charlotte_part_*.csv"))
    
    print(f"Found {len(files)} files to import")
    
    for i, file in enumerate(files, 1):
        print(f"\n[{i}/{len(files)}]", end="")
        try:
            load_csv_file(file)
        except Exception as e:
            print(f"\n❌ Error: {e}")
            sys.exit(1)
    
    print("\n\n🎉 All files imported successfully\!")
