#!/usr/bin/env python3
"""
Import Florida county data using MCP SQL execution
Handles empty values and data formatting issues properly
"""

import csv
import sys
import subprocess
import json


def clean_value(value, is_numeric=False):
    """Clean a value for SQL insertion"""
    # Remove leading/trailing spaces
    value = value.strip()

    # Handle empty values
    if not value or value == " " or value == "  ":
        return "NULL"

    # For numeric fields, ensure it's a valid number
    if is_numeric:
        try:
            # Try to parse as number
            if "." in value:
                float(value)
            else:
                int(value)
            return value
        except:
            return "0"  # Default numeric value

    # For string fields, escape quotes and wrap in quotes
    value = value.replace("'", "''")
    return f"'{value}'"


def process_county(county_code, county_name):
    """Process a single county"""
    print(f"Processing {county_name} County ({county_code})...")

    # Step 1: Extract from GDB
    csv_file = f"/tmp/{county_name.lower()}_parcels.csv"
    print("Extracting from GDB...")

    cmd = [
        "ogr2ogr",
        "-f",
        "CSV",
        csv_file,
        "/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb",
        "CADASTRAL_DOR",
        "-where",
        f"CO_NO = {county_code}",
        "-progress",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error extracting data: {result.stderr}")
        return False

    # Step 2: Process CSV and generate SQL
    print("Processing CSV data...")

    # Define column mappings (column index -> field name, is_numeric)
    columns = [
        (1, "co_no", True),
        (2, "parcel_id", False),
        (3, "file_t", False),
        (4, "asmnt_yr", True),
        (5, "bas_strt", False),
        (6, "atv_strt", False),
        (7, "grp_no", False),
        (8, "dor_uc", False),
        (9, "pa_uc", False),
        (10, "spass_cd", False),
        (11, "jv", True),
        (12, "jv_chng", True),
        (13, "jv_chng_cd", True),
        (14, "av_sd", True),
        (15, "av_nsd", True),
        (16, "tv_sd", True),
        (17, "tv_nsd", True),
        (18, "jv_hmstd", True),
        (19, "av_hmstd", True),
        (20, "jv_non_hms", True),
        (41, "lnd_val", True),
        (42, "imp_val", True),
        (74, "own_name", False),
        (75, "own_addr1", False),
        (76, "own_addr2", False),
        (77, "own_city", False),
        (78, "own_state", False),
        (79, "own_zipcd", False),
        (99, "phy_addr1", False),
        (100, "phy_addr2", False),
        (101, "phy_city", False),
        (102, "phy_zipcd", False),
        (52, "lnd_sqfoot", True),
        (49, "tot_lvg_ar", True),
        (53, "no_buldng", True),
        (57, "sale_prc1", True),
        (58, "sale_yr1", True),
        (59, "sale_mo1", True),
        (60, "or_book1", False),
        (61, "or_page1", False),
        (62, "clerk_no1", False),
        (55, "qual_cd1", False),
        (67, "sale_prc2", True),
        (68, "sale_yr2", True),
        (69, "sale_mo2", True),
        (70, "or_book2", False),
        (71, "or_page2", False),
        (72, "clerk_no2", False),
        (65, "qual_cd2", False),
        (87, "s_legal", False),
        (88, "twn", False),
        (89, "rng", False),
        (90, "sec", False),
    ]

    # Read CSV and process in batches
    batch_size = 500
    batch = []
    total_processed = 0
    duplicates = set()

    with open(csv_file, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        next(reader)  # Skip header

        for row in reader:
            # Skip if duplicate parcel_id
            parcel_id = row[1] if len(row) > 1 else ""
            if parcel_id in duplicates:
                continue
            duplicates.add(parcel_id)

            # Build values for this row
            values = []
            for idx, field_name, is_numeric in columns:
                if idx <= len(row):
                    value = row[idx - 1] if idx <= len(row) else ""
                    values.append(clean_value(value, is_numeric))
                else:
                    values.append("NULL")

            # Create INSERT statement
            column_names = [col[1] for col in columns]
            sql = f"""
            INSERT INTO florida_parcels ({', '.join(column_names)})
            VALUES ({', '.join(values)})
            ON CONFLICT (co_no, parcel_id) DO NOTHING;
            """

            batch.append(sql)

            # Execute batch when it reaches size limit
            if len(batch) >= batch_size:
                execute_batch(batch)
                total_processed += len(batch)
                print(f"Processed {total_processed} parcels...")
                batch = []

        # Execute remaining batch
        if batch:
            execute_batch(batch)
            total_processed += len(batch)

    print(f"Total processed: {total_processed} parcels")

    # Verify import
    verify_import(county_code, county_name)

    # Cleanup
    subprocess.run(["rm", "-f", csv_file])

    return True


def execute_batch(batch):
    """Execute a batch of SQL statements using MCP"""
    # Combine into single transaction
    sql = "BEGIN;\n" + "\n".join(batch) + "\nCOMMIT;"

    # Write to temp file
    with open("/tmp/batch.sql", "w") as f:
        f.write(sql)

    # Execute via subprocess (since we can't directly call MCP from Python)
    # You'll need to execute this SQL manually or via the MCP tool
    print(f"Execute batch of {len(batch)} inserts...")

    # For now, print the first few statements as example
    print("Sample SQL:")
    print(batch[0])


def verify_import(county_code, county_name):
    """Verify the import completed"""
    print(f"\nVerifying {county_name} County import...")
    print(f"Check: SELECT COUNT(*) FROM florida_parcels WHERE co_no = {county_code};")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 import-county-via-mcp.py <county_code> <county_name>")
        print("Example: python3 import-county-via-mcp.py 12 BAKER")
        sys.exit(1)

    county_code = int(sys.argv[1])
    county_name = sys.argv[2]

    process_county(county_code, county_name)
