# \!/usr/bin/env python3

import os
import sys
import csv
import json
import time
import requests
from datetime import datetime

# Configuration
SUPABASE_URL = "https://tmlrvecuwgppbaynesji.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA3NTAzOSwiZXhwIjoyMDY0NjUxMDM5fQ.oSc6kfaT_fyrtIS7noLzJdw4gGGJXIivnz0cqJfwuxc"
CSV_FILE = "/tmp/charlotte_parcels.csv"
BATCH_SIZE = 1000


def show_progress(current, total, start_time):
    """Display progress bar with stats"""
    percent = (current / total) * 100
    elapsed = time.time() - start_time
    rate = current / elapsed if elapsed > 0 else 0
    eta = (total - current) / rate if rate > 0 else 0

    bar_length = 50
    filled = int(bar_length * current / total)
    bar = "█" * filled + "░" * (bar_length - filled)

    sys.stdout.write(
        f"\r[{bar}] {percent:.1f}% | {current:,}/{total:,} rows | {rate:.0f} rows/s | ETA: {eta:.0f}s "
    )
    sys.stdout.flush()


def load_parcels():
    """Load parcels from CSV to Supabase"""
    print(f"Loading parcels from: {CSV_FILE}")

    # Count total rows
    with open(CSV_FILE, "r") as f:
        total_rows = sum(1 for line in f) - 1  # Subtract header

    print(f"Total parcels to import: {total_rows:,}")
    print(f"Batch size: {BATCH_SIZE:,}")
    print("")

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    start_time = time.time()
    processed = 0
    batch = []

    with open(CSV_FILE, "r") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Map CSV columns to database columns
            parcel = {
                "CO_NO": int(row.get("CO_NO", 18)),
                "PARCEL_ID": row.get("PARCEL_ID"),
                "OWN_NAME": row.get("OWN_NAME"),
                "PHY_ADDR1": row.get("PHY_ADDR1"),
                "PHY_CITY": row.get("PHY_CITY"),
                "PHY_ZIPCD": row.get("PHY_ZIPCD"),
                "SITE_ADDR": row.get("SITE_ADDR"),
                "SITE_CITY": row.get("SITE_CITY"),
                "SITE_ZIP": row.get("SITE_ZIP"),
                "LND_VAL": float(row.get("LND_VAL", 0)) if row.get("LND_VAL") else None,
                "BLD_VAL": float(row.get("BLD_VAL", 0)) if row.get("BLD_VAL") else None,
                "JV": float(row.get("JV", 0)) if row.get("JV") else None,
                "SHAPE_WKT": row.get("WKT"),
            }

            batch.append(parcel)

            # Insert when batch is full
            if len(batch) >= BATCH_SIZE:
                response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/florida_parcels",
                    headers=headers,
                    json=batch,
                )

                if response.status_code not in [200, 201]:
                    print(f"\nError: {response.status_code} - {response.text}")
                    return

                processed += len(batch)
                batch = []
                show_progress(processed, total_rows, start_time)

    # Insert remaining parcels
    if batch:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/florida_parcels", headers=headers, json=batch
        )
        processed += len(batch)
        show_progress(processed, total_rows, start_time)

    # Final stats
    elapsed = time.time() - start_time
    print("\n\n✅ Import complete!")
    print(f"   Total time: {elapsed:.1f} seconds")
    print(f"   Average rate: {processed/elapsed:.0f} rows/second")
    print(f"   Total imported: {processed:,} parcels")


if __name__ == "__main__":
    if not os.path.exists(CSV_FILE):
        print(f"Error: CSV file not found at {CSV_FILE}")
        print("Run ./scripts/load-parcels-simple.sh first to create the CSV")
        sys.exit(1)

    try:
        load_parcels()
    except KeyboardInterrupt:
        print("\n\nImport cancelled by user")
    except Exception as e:
        print(f"\n\nError: {e}")
