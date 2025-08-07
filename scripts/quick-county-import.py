#!/usr/bin/env python3
"""
Optimized parallel import system for Florida counties
Uses Python multiprocessing for better control and progress tracking
"""

import os
import subprocess
import multiprocessing
import time
import psycopg2
from datetime import datetime
import signal
import sys

# Configuration
DB_CONFIG = {
    "host": "db.tmlrvecuwgppbaynesji.supabase.co",
    "port": 5432,
    "database": "postgres",
    "user": "postgres",
    "password": "Hotdam2025a",
}

GDB_PATH = "/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb"
WORK_DIR = "/tmp/florida_import"
MAX_WORKERS = 4

# Florida counties (excluding Charlotte which is already done)
COUNTIES = {
    11: "ALACHUA",
    12: "BAKER",
    13: "BAY",
    14: "BRADFORD",
    15: "BREVARD",
    16: "BROWARD",
    17: "CALHOUN",
    19: "CITRUS",
    20: "CLAY",
    21: "COLLIER",
    22: "COLUMBIA",
    23: "DESOTO",
    24: "DIXIE",
    25: "DUVAL",
    26: "ESCAMBIA",
    27: "FLAGLER",
    28: "FRANKLIN",
    29: "GADSDEN",
    30: "GILCHRIST",
    31: "GLADES",
    32: "GULF",
    33: "HAMILTON",
    34: "HARDEE",
    35: "HENDRY",
    36: "HERNANDO",
    37: "HIGHLANDS",
    38: "HILLSBOROUGH",
    39: "HOLMES",
    40: "INDIAN RIVER",
    41: "JACKSON",
    42: "JEFFERSON",
    43: "LAFAYETTE",
    44: "LAKE",
    45: "LEE",
    46: "LEON",
    47: "LEVY",
    48: "LIBERTY",
    49: "MADISON",
    50: "MANATEE",
    51: "MARION",
    52: "MARTIN",
    53: "MIAMI-DADE",
    54: "MONROE",
    55: "NASSAU",
    56: "OKALOOSA",
    57: "OKEECHOBEE",
    58: "ORANGE",
    59: "OSCEOLA",
    60: "PALM BEACH",
    61: "PASCO",
    62: "PINELLAS",
    63: "POLK",
    64: "PUTNAM",
    65: "ST. JOHNS",
    66: "ST. LUCIE",
    67: "SANTA ROSA",
    68: "SARASOTA",
    69: "SEMINOLE",
    70: "SUMTER",
    71: "SUWANNEE",
    72: "TAYLOR",
    73: "UNION",
    74: "VOLUSIA",
    75: "WAKULLA",
    76: "WALTON",
    77: "WASHINGTON",
}

# Global progress tracking
progress = multiprocessing.Manager().dict()
start_time = time.time()


def signal_handler(sig, frame):
    print("\n\nImport interrupted by user")
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)


def import_county(county_code, county_name):
    """Import a single county"""
    county_start = time.time()
    csv_file = f"{WORK_DIR}/county_{county_code}.csv"

    try:
        # Update progress
        progress[county_code] = {"status": "extracting", "name": county_name}

        # Extract from GDB
        cmd = [
            "ogr2ogr",
            "-f",
            "CSV",
            csv_file,
            GDB_PATH,
            "CADASTRAL_DOR",
            "-where",
            f"CO_NO = {county_code}",
            "-progress",
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            progress[county_code] = {"status": "failed", "error": "extraction failed"}
            return

        # Count rows
        with open(csv_file, "r") as f:
            row_count = sum(1 for line in f) - 1

        progress[county_code] = {"status": "processing", "rows": row_count}

        # Import using psql COPY
        os.environ["PGPASSWORD"] = DB_CONFIG["password"]

        # Create clean CSV with proper columns (similar to Charlotte process)
        clean_csv = f"{WORK_DIR}/county_{county_code}_clean.csv"

        # Use awk to extract columns
        awk_cmd = f"""awk -F',' '
        NR==1 {{
            print "co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec"
        }}
        NR>1 {{
            printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\\n",
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                $41,$42,$74,$75,$76,$77,$78,$79,$99,$100,$101,$102,$52,$49,$53,
                $57,$58,$59,$60,$61,$62,$55,$67,$68,$69,$70,$71,$72,$65,$87,$88,$89,$90
        }}' {csv_file} > {clean_csv}"""

        subprocess.run(awk_cmd, shell=True)

        # Remove duplicates
        unique_csv = f"{WORK_DIR}/county_{county_code}_unique.csv"
        subprocess.run(
            f"awk -F',' 'NR==1 || !seen[$2]++' {clean_csv} > {unique_csv}", shell=True
        )

        # Import via psql
        progress[county_code] = {"status": "importing"}

        copy_cmd = [
            "psql",
            "-h",
            DB_CONFIG["host"],
            "-p",
            str(DB_CONFIG["port"]),
            "-U",
            DB_CONFIG["user"],
            "-d",
            DB_CONFIG["database"],
            "-c",
            f"\\COPY florida_parcels(co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec) FROM '{unique_csv}' WITH (FORMAT csv, HEADER true);",
        ]

        result = subprocess.run(copy_cmd, capture_output=True, text=True)

        # Clean up
        for f in [csv_file, clean_csv, unique_csv]:
            if os.path.exists(f):
                os.remove(f)

        # Update progress
        elapsed = time.time() - county_start
        progress[county_code] = {
            "status": "complete",
            "time": elapsed,
            "name": county_name,
        }

    except Exception as e:
        progress[county_code] = {"status": "error", "error": str(e)}


def print_progress():
    """Print current progress"""
    os.system("clear")
    print("=" * 60)
    print("Florida Counties Import Progress")
    print("=" * 60)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Elapsed: {int(time.time() - start_time)}s")
    print()

    # Count statuses
    statuses = {
        "complete": 0,
        "processing": 0,
        "importing": 0,
        "extracting": 0,
        "failed": 0,
    }
    for county_info in progress.values():
        status = county_info.get("status", "pending")
        if status in statuses:
            statuses[status] += 1

    print(f"Complete: {statuses['complete']}/66")
    print(
        f"Processing: {statuses['extracting'] + statuses['processing'] + statuses['importing']}"
    )
    print(f"Failed: {statuses['failed']}")
    print()

    # Show active counties
    print("Active imports:")
    for code, info in sorted(progress.items()):
        if info["status"] in ["extracting", "processing", "importing"]:
            print(f"  County {code} ({info.get('name', 'Unknown')}): {info['status']}")

    # Show recent completions
    print("\nRecent completions:")
    completed = [(k, v) for k, v in progress.items() if v.get("status") == "complete"]
    for code, info in sorted(completed, key=lambda x: -x[1].get("time", 0))[:5]:
        print(f"  County {code} ({info['name']}): {info['time']:.1f}s")


def main():
    # Create work directory
    os.makedirs(WORK_DIR, exist_ok=True)

    print("Florida Counties Parallel Import System")
    print(f"Counties to import: {len(COUNTIES)}")
    print(f"Parallel workers: {MAX_WORKERS}")
    print(f"Starting at: {datetime.now()}")
    print()

    # Create pool
    pool = multiprocessing.Pool(processes=MAX_WORKERS)

    # Submit all jobs
    results = []
    for code, name in COUNTIES.items():
        result = pool.apply_async(import_county, (code, name))
        results.append(result)

    # Close pool
    pool.close()

    # Monitor progress
    while not all(r.ready() for r in results):
        print_progress()
        time.sleep(2)

    # Wait for completion
    pool.join()

    # Final summary
    print_progress()
    print("\n" + "=" * 60)
    print("Import Complete!")
    print(f"Total time: {int(time.time() - start_time)}s")

    # Get final counts from database
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM florida_parcels")
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT co_no) FROM florida_parcels")
    counties = cur.fetchone()[0]
    conn.close()

    print(f"Total parcels in database: {total:,}")
    print(f"Total counties: {counties}")


if __name__ == "__main__":
    main()
