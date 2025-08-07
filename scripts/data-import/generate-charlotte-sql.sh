#\!/bin/bash

echo "Generating SQL files for Charlotte County import..."

cd /Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks

# Process each file
for file in charlotte_part_*.csv; do
    echo "Processing $file..."

    # Generate SQL file
    python3 -c "
import csv

def escape_sql(value):
    if value is None or value == '' or value.strip() == '':
        return 'NULL'
    return f\"'{str(value).replace(\"'\", \"''\").strip()}'\"

batch_size = 1000
batch_num = 1
row_count = 0

with open('$file', 'r') as f:
    reader = csv.DictReader(f)

    values = []
    for row in reader:
        # Skip if this looks like a header row
        if row.get('CO_NO') == 'CO_NO':
            continue
        row_count += 1
        val = f\"({row.get('CO_NO', 18)}, {escape_sql(row.get('PARCEL_ID'))}, {escape_sql(row.get('OWN_NAME', 'UNKNOWN'))}, {escape_sql(row.get('PHY_ADDR1'))}, {escape_sql(row.get('PHY_CITY'))}, {escape_sql(row.get('PHY_ZIPCD'))}, {row.get('LND_VAL') or 'NULL'}, {row.get('JV') or 'NULL'})\"
        values.append(val)

        if len(values) >= batch_size:
            with open(f'${file%.csv}_batch_{batch_num}.sql', 'w') as out:
                out.write('-- Batch ' + str(batch_num) + ' of ' + '$file' + '\\n')
                out.write('INSERT INTO florida_parcels (co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv) VALUES\\n')
                out.write(',\\n'.join(values))
                out.write('\\nON CONFLICT DO NOTHING;\\n')

            values = []
            batch_num += 1
            print(f'  Created ${file%.csv}_batch_{batch_num-1}.sql')

    # Final batch
    if values:
        with open(f'${file%.csv}_batch_{batch_num}.sql', 'w') as out:
            out.write('-- Final batch of ' + '$file' + '\\n')
            out.write('INSERT INTO florida_parcels (co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv) VALUES\\n')
            out.write(',\\n'.join(values))
            out.write('\\nON CONFLICT DO NOTHING;\\n')
        print(f'  Created ${file%.csv}_batch_{batch_num}.sql')
"
done

echo ""
echo "SQL files generated\!"
echo ""
echo "To import:"
echo "1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new"
echo "2. Copy and paste each SQL file content"
echo "3. Click 'Run'"
echo ""
ls -lh *.sql | head -10
