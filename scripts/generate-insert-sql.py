#!/usr/bin/env python3

import csv
import sys


def escape_sql(value):
    """Escape single quotes for SQL"""
    if value is None or value == "":
        return "NULL"
    return f"'{str(value).replace('\'', '\'\'')}'"


def generate_inserts(csv_file, batch_size=100):
    """Generate SQL INSERT statements from CSV"""

    with open(csv_file, "r") as f:
        reader = csv.DictReader(f)

        batch = []
        batch_num = 1

        for row in reader:
            # Extract key fields
            values = f"""(
                {row.get('CO_NO', 18)},
                {escape_sql(row.get('PARCEL_ID'))},
                {escape_sql(row.get('OWN_NAME', 'UNKNOWN'))},
                {escape_sql(row.get('PHY_ADDR1'))},
                {escape_sql(row.get('PHY_CITY'))},
                {escape_sql(row.get('PHY_ZIPCD'))},
                {row.get('LND_VAL') or 'NULL'},
                {row.get('JV') or 'NULL'}
            )"""

            batch.append(values)

            if len(batch) >= batch_size:
                print(f"-- Batch {batch_num} ({batch_size} rows)")
                print(
                    "INSERT INTO florida_parcels (co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv) VALUES"
                )
                print(",\n".join(batch))
                print("ON CONFLICT DO NOTHING;")
                print()

                batch = []
                batch_num += 1

        # Insert remaining
        if batch:
            print(f"-- Final batch ({len(batch)} rows)")
            print(
                "INSERT INTO florida_parcels (co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv) VALUES"
            )
            print(",\n".join(batch))
            print("ON CONFLICT DO NOTHING;")


if __name__ == "__main__":
    # Generate SQL for first 1000 rows as a test
    print("-- Charlotte County Import SQL")
    print("-- Generated from CSV data")
    print()

    csv_file = "/Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks/charlotte_part_aa.csv"

    # First, just do 10 rows to test
    with open(csv_file, "r") as f:
        reader = csv.DictReader(f)
        rows = []
        for i, row in enumerate(reader):
            if i >= 10:
                break
            rows.append(row)

    print("-- Test batch (10 rows)")
    print(
        "INSERT INTO florida_parcels (co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv) VALUES"
    )

    values = []
    for row in rows:
        values.append(
            f"""(
            {row.get('CO_NO', 18)},
            {escape_sql(row.get('PARCEL_ID'))},
            {escape_sql(row.get('OWN_NAME', 'UNKNOWN'))},
            {escape_sql(row.get('PHY_ADDR1'))},
            {escape_sql(row.get('PHY_CITY'))},
            {escape_sql(row.get('PHY_ZIPCD'))},
            {row.get('LND_VAL') or 'NULL'},
            {row.get('JV') or 'NULL'}
        )"""
        )

    print(",\n".join(values))
    print("ON CONFLICT DO NOTHING;")
    print()
    print(
        "-- Run this in SQL Editor: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new"
    )
