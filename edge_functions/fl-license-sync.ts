import { createClient } from '@supabase/supabase-js'
import { serve } from 'std/server'

const CSV_URL = 'https://www2.myfloridalicense.com/sto/file_download/extracts/cilb_certified.csv'; // live weekly snapshot

serve(async (req) => {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch the license data from the CSV source
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV data: ${response.statusText}`);
    }
    const csvData = await response.text();

    // NOTE: This is a simplified CSV parser. For a production environment, 
    // consider using a more robust CSV parsing library.
    const rows = csvData.split('\n').slice(1).map(line => {
      const [        license_number, board, license_type, rank, qualifier_name,
        dba_name, city, county_name, status_primary, status_secondary,
        issue_date, expiry_date, bond_ind, wc_exempt, liability_ins,
        discipline_flag
      ] = line.split(',');

      return {
        license_number,
        board,
        license_type,
        rank,
        qualifier_name,
        dba_name,
        city,
        county_name,
        status_primary,
        status_secondary,
        issue_date: issue_date || null,
        expiry_date: expiry_date || null,
        bond_ind: bond_ind === 'true',
        wc_exempt: wc_exempt === 'true',
        liability_ins: liability_ins === 'true',
        discipline_flag: discipline_flag === 'true',
      };
    });

    // 2. Upsert the data into the raw license table
    const { error: upsertError } = await supabase
      .from('contractor_license_raw')
      .upsert(rows, { onConflict: 'license_number' });

    if (upsertError) {
      throw upsertError;
    }

    // 3. Call the merge function to update the main contractor table
    const { error: rpcError } = await supabase.rpc('merge_license_into_contractor');

    if (rpcError) {
      throw rpcError;
    }

    return new Response(JSON.stringify({ message: 'Sync completed successfully.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // TODO: Implement more robust error logging, such as sending to a logging service
    // or a dead-letter queue for failed rows.
    console.error('Error during license sync:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
