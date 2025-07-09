/// <reference types="https://deno.land/std@0.224.0/types.d.ts" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_BASE = Deno.env.get("CONTRACTOR_CONN_API_BASE_URL")!;
const API_KEY  = Deno.env.get("CONTRACTOR_CONN_API_KEY")!;

const supabase = createClient(
Deno.env.get("SUPABASE_URL")!,
Deno.env.get("SUPABASE_ANON_KEY")!,
);

/**
* Simple fetch wrapper with auth header.
*/
async function ccFetch(path: string) {
const res = await fetch(`${API_BASE}${path}`, {
 headers: { Authorization: `Bearer ${API_KEY}` },
});
if (!res.ok) throw new Error(`CC fetch failed ${res.status}`);
return res.json();
}

serve(async () => {
const start = new Date();
let created = 0, updated = 0, failed = 0;

try {
 /** 1. Pull contractor companies (paginated). */
 for await (const company of paginate("/contractors?updatedSince=1d")) {
   const { error } = await supabase
     .from("contractor_connection.contractor_companies")
     .upsert(
       {
         id: company.id,
         name: company.name,
         fein_tax_id: company.fein,
         address_line1: company.address.line1,
         city: company.address.city,
         state: company.address.state,
         postal_code: company.address.zip,
         primary_phone: company.phone,
         primary_email: company.email,
         contractor_status: company.status.toLowerCase(),
         rating_overall: company.rating,
         avg_cycle_time_days: company.avgCycleTime,
         avg_customer_satisfaction: company.customerSat,
         updated_at: new Date().toISOString(),
       },
       { ignoreDuplicates: false, onConflict: "id" },
     );
   if (error) { failed++; continue; }
   company.isNew ? created++ : updated++;
 }

 /** 2. Pull documents & compliance */
 for await (const doc of paginate("/documents?updatedSince=1d")) {
   const { error } = await supabase
     .from("contractor_connection.contractor_documents")
     .upsert(
       {
         id: doc.id,
         contractor_id: doc.contractorId,
         document_type: doc.type.toLowerCase(),
         file_storage_key: doc.storageKey,
         upload_date: doc.uploadedAt,
         expiration_date: doc.expiresAt,
         review_status: doc.reviewStatus.toLowerCase(),
       },
       { ignoreDuplicates: false, onConflict: "id" },
     );
   if (error) { failed++; continue; }
   doc.isNew ? created++ : updated++;
 }

 /** 3. Derived performance metrics (simple example) */
 await supabase.rpc("calculate_contractor_metrics");

} catch (err) {
 await logRun(start, created, updated, failed, "rejected", err.message);
 throw err;
}

await logRun(start, created, updated, failed, "approved");
return new Response("sync ok");
});

/** Generator that yields each item from paginated GET. */
async function* paginate(path: string) {
let url = path;
while (url) {
 const page = await ccFetch(url);
 for (const item of page.results) yield { ...item, isNew: page.isFirstSync };
 url = page.next; // null when done
}
}

/** Write summary row */
async function logRun(start: Date, created: number, updated: number, failed: number, status: string, msg = "") {
await supabase
 .from("contractor_connection.sync_run_log")
 .insert({
   started_at: start.toISOString(),
   completed_at: new Date().toISOString(),
   status,
   records_created: created,
   records_updated: updated,
   records_failed: failed,
   error_messages: msg,
 });
}
//
//  contractor_connection_sync.ts
//  
//
//  Created by Mad Engineering on 7/8/25.
//

