#!/usr/bin/env python3

import os
import sys
import time
import json
from datetime import datetime


def escape_sql(value):
    """Escape SQL values properly"""
    if value is None or value == "" or value.strip() == "":
        return "NULL"
    # Escape single quotes and clean value
    escaped = str(value).replace("'", "''").strip().replace("\n", " ")
    return f"'{escaped}'"


def process_charlotte_import():
    """Process Charlotte County import with progress tracking"""

    print("========================================")
    print("Charlotte County Parcel Import")
    print("========================================")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Configuration
    project_id = "tmlrvecuwgppbaynesji"
    csv_file = "/tmp/charlotte_parcels.csv"
    batch_size = 1000
    total_parcels = 218846  # Known count for Charlotte County

    # Check if CSV exists
    if not os.path.exists(csv_file):
        print("❌ CSV file not found. Generating from GDB...")
        import subprocess

        result = subprocess.run(
            [
                "ogr2ogr",
                "-f",
                "CSV",
                csv_file,
                "/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb",
                "CADASTRAL_DOR",
                "-where",
                "CO_NO = 18",
                "-progress",
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print(f"Error converting GDB: {result.stderr}")
            return
        print("✅ CSV generated successfully")
        print()

    # Count actual rows
    print("Counting rows in CSV...")
    with open(csv_file, "r") as f:
        actual_count = sum(1 for line in f) - 1  # Subtract header
    print(f"Total rows to import: {actual_count:,}")
    print()

    # Import process
    print("Starting import process...")
    print(f"Batch size: {batch_size:,} rows")
    print()

    import csv
    import subprocess

    successful_inserts = 0
    failed_batches = 0
    start_time = time.time()

    with open(csv_file, "r") as f:
        reader = csv.DictReader(f)

        batch = []
        batch_num = 0
        row_num = 0

        for row in reader:
            # Skip header row if it appears in data
            if row.get("CO_NO") == "CO_NO":
                continue

            row_num += 1

            # Build value tuple
            val = (
                f"({row.get('CO_NO', 18)}, {escape_sql(row.get('PARCEL_ID'))}, "
                f"{escape_sql(row.get('OWN_NAME', 'UNKNOWN'))}, {escape_sql(row.get('PHY_ADDR1'))}, "
                f"{escape_sql(row.get('PHY_CITY'))}, {escape_sql(row.get('PHY_ZIPCD'))}, "
                f"{row.get('LND_VAL') or 'NULL'}, {row.get('JV') or 'NULL'})"
            )

            batch.append(val)

            # Process batch when full or at end
            if len(batch) >= batch_size or row_num == actual_count:
                batch_num += 1

                # Create SQL
                sql = f"""INSERT INTO florida_parcels (co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv) VALUES
{',\n'.join(batch)}
ON CONFLICT DO NOTHING;"""

                # Show progress
                progress = (row_num / actual_count) * 100
                elapsed = time.time() - start_time
                eta = (elapsed / row_num * actual_count) - elapsed if row_num > 0 else 0

                # Progress bar
                bar_length = 40
                filled = int(bar_length * row_num / actual_count)
                bar = "=" * filled + "-" * (bar_length - filled)

                sys.stdout.write(
                    f"\r[{bar}] {progress:.1f}% | Batch {batch_num} | {row_num:,}/{actual_count:,} rows | ETA: {int(eta)}s    "
                )
                sys.stdout.flush()

                # Execute SQL via MCP
                cmd = [
                    "mcp",
                    "supabase",
                    "execute-sql",
                    "--project-id",
                    project_id,
                    "--query",
                    sql,
                ]

                result = subprocess.run(cmd, capture_output=True, text=True)

                if result.returncode == 0:
                    successful_inserts += len(batch)
                else:
                    failed_batches += 1
                    # Log error but continue
                    with open("/tmp/charlotte_import_errors.log", "a") as err_file:
                        err_file.write(
                            f"\nBatch {batch_num} failed:\n{result.stderr}\n"
                        )

                batch = []

    # Final summary
    elapsed_total = time.time() - start_time
    print(
        f'\r[{"=" * bar_length}] 100% | Import completed!                                    '
    )
    print()
    print()
    print("========================================")
    print("Import Summary")
    print("========================================")
    print(f"Total rows processed: {row_num:,}")
    print(f"Successful inserts: {successful_inserts:,}")
    print(f"Failed batches: {failed_batches}")
    print(f"Time elapsed: {int(elapsed_total)}s ({elapsed_total/60:.1f} minutes)")
    print(f"Average speed: {int(row_num/elapsed_total):,} rows/second")
    print()

    # Verify in database
    print("Verifying in database...")
    verify_cmd = [
        "mcp",
        "supabase",
        "execute-sql",
        "--project-id",
        project_id,
        "--query",
        "SELECT COUNT(*) as count FROM florida_parcels WHERE co_no = 18;",
    ]

    result = subprocess.run(verify_cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Database verification: {result.stdout}")
    else:
        print(f"Verification failed: {result.stderr}")

    print()
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if failed_batches > 0:
        print("\n⚠️  Check /tmp/charlotte_import_errors.log for error details")


if __name__ == "__main__":
    try:
        process_charlotte_import()
    except KeyboardInterrupt:
        print("\n\n❌ Import cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Import failed: {e}")
        sys.exit(1)
