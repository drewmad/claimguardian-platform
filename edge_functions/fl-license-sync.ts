import { createClient } from '@supabase/supabase-js'
import { serve } from 'std/server'
import JSZip from "https://esm.sh/jszip@3.10.1";
import { parse } from "https://deno.land/std@0.229.1/csv/mod.ts";

const CSV_URL = 'https://www2.myfloridalicense.com/sto/file_download/extracts/cilb_certified.csv'; // live weekly snapshot

/** Fetch, unzip (if needed), and return CSV text */
async function fetchCsv(): Promise<string> {
  const resp = await fetch(CSV_URL, { redirect: "follow" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${CSV_URL}`);

  const isZip = resp.headers.get("content-type")?.includes("zip")
             || CSV_URL.endsWith(".zip");

  if (!isZip) return await resp.text();

  const zipData = new Uint8Array(await resp.arrayBuffer());
  const zip     = await JSZip.loadAsync(zipData);

  const entry   = Object.values(zip.files)
                        .find(f => f.name.toLowerCase().endsWith(".csv"));
  if (!entry) throw new Error("CSV not found inside ZIP archive");

  return await entry.async("string");
}

const ZIP_RE = /\b\d{5}(?:-\d{4})?\b/;

function extractZip(text?: string | null): string | null {
  if (!text) return null;
  const m = text.match(ZIP_RE);
  return m ? m[0] : null;
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const csvText = await fetchCsv();

    // Using Deno's standard CSV parser. Assumes first row is the header.
    const records = parse(csvText, {
        skipFirstRow: true,
    });

    // Get the header row to map columns by name.
    const header = (parse(csvText, { skipFirstRow: false, take: 1 }))[0];

    const rowsToUpsert = records.map(record => {
        const row = Object.fromEntries(header.map((key, i) => [key.trim(), record[i]]));

        // NOTE: The following mapping is based on the `contractor_license_raw` table schema.
        // The actual column names in the CSV might be different and may need to be adjusted.
        return {
            license_number: row['license_number'],
            board: row['board'],
            license_type: row['license_type'],
            rank: row['rank'],
            qualifier_name: row['qualifier_name'],
            dba_name: row['dba_name'],
            city: row['city'],
            county_name: row['county_name'],
            status_primary: row['status_primary'],
            status_secondary: row['status_secondary'],
            issue_date: row['issue_date'] || null,
            expiry_date: row['expiry_date'] || null,
            bond_ind: row['bond_ind'] === 'true',
            wc_exempt: row['wc_exempt'] === 'true',
            liability_ins: row['liability_ins'] === 'true',
            discipline_flag: row['discipline_flag'] === 'true',
            // The extractZip function is available, but we need to know which column
            // contains the address information to use it. For example:
            // postal_code: extractZip(row["CITY_STATE_ZIP"] ?? row["ADDRESS2"]),
        };
    });

    const { error: upsertError } = await supabase
      .from('contractor_license_raw')
      .upsert(rowsToUpsert, { onConflict: 'license_number' });

    if (upsertError) {
      throw upsertError;
    }

    const { error: rpcError } = await supabase.rpc('merge_license_into_contractor');

    if (rpcError) {
      throw rpcError;
    }

    return new Response(JSON.stringify({ message: 'Sync completed successfully.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error during license sync:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});