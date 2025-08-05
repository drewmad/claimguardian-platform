#!/usr/bin/env python3
"""
Ultra-fast Florida parcels import using parallel processing
Imports all 67 counties in ~30-60 minutes instead of days
"""

import subprocess
import multiprocessing
import time
from datetime import datetime
import os

# Florida county codes and names
COUNTIES = {
    11: "ALACHUA", 12: "BAKER", 13: "BAY", 14: "BRADFORD", 15: "BREVARD",
    16: "BROWARD", 17: "CALHOUN", 18: "CHARLOTTE", 19: "CITRUS", 20: "CLAY",
    21: "COLLIER", 22: "COLUMBIA", 23: "DESOTO", 24: "DIXIE", 25: "DUVAL",
    26: "ESCAMBIA", 27: "FLAGLER", 28: "FRANKLIN", 29: "GADSDEN", 30: "GILCHRIST",
    31: "GLADES", 32: "GULF", 33: "HAMILTON", 34: "HARDEE", 35: "HENDRY",
    36: "HERNANDO", 37: "HIGHLANDS", 38: "HILLSBOROUGH", 39: "HOLMES", 40: "INDIAN RIVER",
    41: "JACKSON", 42: "JEFFERSON", 43: "LAFAYETTE", 44: "LAKE", 45: "LEE",
    46: "LEON", 47: "LEVY", 48: "LIBERTY", 49: "MADISON", 50: "MANATEE",
    51: "MARION", 52: "MARTIN", 53: "MIAMI-DADE", 54: "MONROE", 55: "NASSAU",
    56: "OKALOOSA", 57: "OKEECHOBEE", 58: "ORANGE", 59: "OSCEOLA", 60: "PALM BEACH",
    61: "PASCO", 62: "PINELLAS", 63: "POLK", 64: "PUTNAM", 65: "ST. JOHNS",
    66: "ST. LUCIE", 67: "SANTA ROSA", 68: "SARASOTA", 69: "SEMINOLE", 70: "SUMTER",
    71: "SUWANNEE", 72: "TAYLOR", 73: "UNION", 74: "VOLUSIA", 75: "WAKULLA",
    76: "WALTON", 77: "WASHINGTON"
}

def import_county_direct(county_code, county_name):
    """Import a single county using ogr2ogr directly to PostgreSQL"""
    
    print(f"\n[{county_code}] Starting import for {county_name} County...")
    start_time = time.time()
    
    # Database connection
    db_connection = (
        "PG:host=aws-0-us-east-1.pooler.supabase.com "
        "port=6543 "
        "dbname=postgres "
        "user=postgres.tmlrvecuwgppbaynesji "
        "password=YOUR_PASSWORD"  # Replace with actual password
    )
    
    # ogr2ogr command for direct import
    cmd = [
        'ogr2ogr',
        '-f', 'PostgreSQL',
        db_connection,
        '/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb',
        '-nln', 'florida_parcels_temp',  # Temporary table
        'CADASTRAL_DOR',
        '-where', f'CO_NO = {county_code}',
        '-progress',
        '-skipfailures',
        '-overwrite',
        '--config', 'PG_USE_COPY', 'YES'  # Use COPY for speed
    ]
    
    try:
        # Run import
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            # Insert from temp table to main table with proper field mapping
            insert_sql = f"""
            INSERT INTO florida_parcels (co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv)
            SELECT {county_code}, "PARCEL_ID", "OWN_NAME", "PHY_ADDR1", "PHY_CITY", "PHY_ZIPCD", "LND_VAL"::bigint, "JV"::bigint
            FROM florida_parcels_temp
            ON CONFLICT DO NOTHING;
            
            DROP TABLE IF EXISTS florida_parcels_temp;
            """
            
            # Execute SQL
            sql_cmd = [
                'psql',
                '-h', 'aws-0-us-east-1.pooler.supabase.com',
                '-p', '6543',
                '-U', 'postgres.tmlrvecuwgppbaynesji',
                '-d', 'postgres',
                '-c', insert_sql
            ]
            
            subprocess.run(sql_cmd, env={**os.environ, 'PGPASSWORD': 'YOUR_PASSWORD'})
            
            elapsed = time.time() - start_time
            print(f"[{county_code}] ✅ {county_name} imported in {elapsed:.1f} seconds")
            return (county_code, True, elapsed)
            
        else:
            print(f"[{county_code}] ❌ {county_name} failed: {result.stderr}")
            return (county_code, False, 0)
            
    except Exception as e:
        print(f"[{county_code}] ❌ {county_name} error: {e}")
        return (county_code, False, 0)

def main():
    print("========================================")
    print("Florida Parcels Fast Import System")
    print("========================================")
    print(f"Starting at: {datetime.now()}")
    print(f"Counties to import: {len(COUNTIES)}")
    print(f"Parallel workers: {multiprocessing.cpu_count()}")
    print()
    
    # Use multiprocessing for parallel imports
    with multiprocessing.Pool(processes=4) as pool:  # Limit to 4 parallel imports
        results = pool.starmap(import_county_direct, COUNTIES.items())
    
    # Summary
    successful = sum(1 for _, success, _ in results if success)
    total_time = sum(elapsed for _, _, elapsed in results)
    
    print("\n========================================")
    print("Import Complete!")
    print("========================================")
    print(f"Successful: {successful}/{len(COUNTIES)} counties")
    print(f"Total time: {total_time/60:.1f} minutes")
    print(f"Average per county: {total_time/len(COUNTIES):.1f} seconds")
    print(f"Completed at: {datetime.now()}")

if __name__ == "__main__":
    main()