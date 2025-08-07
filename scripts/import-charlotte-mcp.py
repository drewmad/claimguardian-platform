#!/usr/bin/env python3

import os
import sys
import time
import csv
from datetime import datetime


def escape_sql(value):
    """Escape SQL values properly"""
    if value is None or value == "" or value.strip() == "":
        return "NULL"
    # Escape single quotes and clean value
    escaped = str(value).replace("'", "''").strip().replace("\n", " ")
    return f"'{escaped}'"


def show_progress(current, total, desc="Progress", bar_length=40):
    """Display progress bar"""
    progress = current / total
    filled = int(bar_length * progress)
    bar = "=" * filled + "-" * (bar_length - filled)
    percent = progress * 100
    sys.stdout.write(f"\r{desc}: [{bar}] {percent:.1f}% ({current:,}/{total:,})")
    sys.stdout.flush()


print("========================================")
print("Charlotte County Parcel Import (Direct)")
print("========================================")
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

# Configuration
csv_file = "/tmp/charlotte_parcels.csv"
batch_size = 500  # Smaller batches for reliability

# Check if CSV exists
if not os.path.exists(csv_file):
    print("❌ CSV file not found at /tmp/charlotte_parcels.csv")
    print("Please run: ./scripts/load-parcels-simple.sh first")
    sys.exit(1)

# Count rows
print("Counting rows in CSV...")
with open(csv_file, "r") as f:
    total_rows = sum(1 for line in f) - 1  # Subtract header

print(f"Total rows to import: {total_rows:,}")
print(f"Batch size: {batch_size} rows")
print()

# Process imports
successful = 0
failed = 0
start_time = time.time()

with open(csv_file, "r") as f:
    reader = csv.DictReader(f)

    batch = []
    batch_num = 0

    for i, row in enumerate(reader):
        # Skip header row if it appears in data
        if row.get("CO_NO") == "CO_NO":
            continue

        # Build value tuple
        val = (
            f"({row.get('CO_NO', 18)}, {escape_sql(row.get('PARCEL_ID'))}, "
            f"{escape_sql(row.get('OWN_NAME', 'UNKNOWN'))}, {escape_sql(row.get('PHY_ADDR1'))}, "
            f"{escape_sql(row.get('PHY_CITY'))}, {escape_sql(row.get('PHY_ZIPCD'))}, "
            f"{row.get('LND_VAL') or 'NULL'}, {row.get('JV') or 'NULL'})"
        )

        batch.append(val)

        # Process batch when full or at end
        if len(batch) >= batch_size or i == total_rows - 1:
            batch_num += 1

            # Create SQL
            sql = f"""INSERT INTO florida_parcels (co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv) VALUES
{',\n'.join(batch)}
ON CONFLICT DO NOTHING;"""

            # Save to file for manual execution
            sql_file = f"/tmp/charlotte_batch_{batch_num:04d}.sql"
            with open(sql_file, "w") as sql_out:
                sql_out.write(f"-- Charlotte County Batch {batch_num}\n")
                sql_out.write(f"-- Rows: {len(batch)}\n")
                sql_out.write(sql)

            successful += len(batch)
            show_progress(successful, total_rows, f"Batch {batch_num}")

            batch = []

# Complete progress
show_progress(total_rows, total_rows, "Complete")
print()
print()

# Summary
elapsed = time.time() - start_time
print("========================================")
print("Import Summary")
print("========================================")
print(f"Total SQL files created: {batch_num}")
print(f"Total rows prepared: {successful:,}")
print(f"Time elapsed: {int(elapsed)}s ({elapsed/60:.1f} minutes)")
print(f"Average speed: {int(successful/elapsed):,} rows/second")
print()
print("SQL files saved to: /tmp/charlotte_batch_*.sql")
print()
print("Next steps:")
print("1. Execute each SQL file via Supabase SQL Editor")
print("2. Or use the mcp__supabase__execute_sql function")
print("\nFirst batch saved to: /tmp/charlotte_batch_0001.sql")
