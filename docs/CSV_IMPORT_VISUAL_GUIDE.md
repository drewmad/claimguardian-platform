# CSV Import Visual Guide for Florida Parcels

## ⚠️ IMPORTANT: Use the Correct Table!

### ❌ WRONG - Do NOT use this:
```
Table Editor > florida_parcels
```
This will fail with "incompatible headers" error because it expects lowercase columns.

### ✅ CORRECT - Use this instead:
```
Table Editor > florida_parcels_uppercase
```
This view accepts your CSV with UPPERCASE headers!

## Step-by-Step Import Process

1. **Navigate to Table Editor**
   - Go to your Supabase Dashboard
   - Click "Table Editor" in the left sidebar

2. **Find the Correct View**
   - Scroll down in the table list
   - Look for `florida_parcels_uppercase` (it's a VIEW, not a TABLE)
   - It should be listed separately from `florida_parcels`
   
   You should see something like:
   ```
   Tables:
   - florida_counties
   - florida_parcels          ← ❌ NOT THIS ONE
   - ...other tables...
   
   Views:
   - florida_parcels_uppercase ← ✅ USE THIS ONE!
   - florida_parcels_summary
   ```

3. **Click on `florida_parcels_uppercase`**
   - This opens the view that accepts UPPERCASE columns

4. **Import Your CSV**
   - Click "Import data from CSV"
   - Upload your file with headers like: CO_NO, PARCEL_ID, JV, etc.
   - The import will work seamlessly!

## How It Works

The `florida_parcels_uppercase` view:
- Accepts CSV columns in UPPERCASE (CO_NO, PARCEL_ID, etc.)
- Automatically maps them to lowercase columns in the database
- Calculates county_fips from CO_NO field
- Handles duplicates with UPSERT logic

## Troubleshooting

**"Table not found" error?**
- The view might not be visible immediately
- Try refreshing the Supabase dashboard
- Check under "Views" section, not "Tables"

**Still seeing incompatible headers?**
- Make sure you selected `florida_parcels_uppercase` (with "_uppercase")
- NOT `florida_parcels` (without "_uppercase")

**Can't find the view?**
Run this SQL in the SQL Editor to verify it exists:
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name LIKE 'florida_parcels%'
ORDER BY table_name;
```

You should see:
- florida_parcels (BASE TABLE)
- florida_parcels_uppercase (VIEW) ← This is what you need!

## Alternative: Use SQL Editor

If you still have issues, use the SQL Editor to verify and query:

```sql
-- Check if you can query the uppercase view
SELECT "CO_NO", "PARCEL_ID", "OWN_NAME" 
FROM florida_parcels_uppercase 
LIMIT 5;

-- Count rows in the view
SELECT COUNT(*) FROM florida_parcels_uppercase;
```