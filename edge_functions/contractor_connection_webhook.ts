/// <reference types="https://deno.land/x/std@0.224.0/types.d.ts" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import crypto from "https://deno.land/std@0.224.0/crypto/mod.ts";

const supabase = createClient(
Deno.env.get("SUPABASE_URL")!,
Deno.env.get("SUPABASE_ANON_KEY")!,
);

const WEBHOOK_SECRET = Deno.env.get("CONTRACTOR_CONN_WEBHOOK_SECRET")!;

function verifySignature(req: Request, rawBody: Uint8Array) {
const sig = req.headers.get("x-cc-signature") || "";
const key = new TextEncoder().encode(WEBHOOK_SECRET);
const mac = crypto.HMAC("SHA-256", key).update(rawBody).hex();
return crypto.timingSafeEqual(
 new TextEncoder().encode(mac),
 new TextEncoder().encode(sig),
);
}

serve(async (req) => {
const raw = new Uint8Array(await req.arrayBuffer());
if (!verifySignature(req, raw)) return new Response("Invalid signature", { status: 401 });

const payload = JSON.parse(new TextDecoder().decode(raw));
const { eventType, data } = payload;

// Store raw event
const { data: eventRow, error: eventErr } = await supabase
 .from("contractor_connection.integration_events")
 .insert({
   event_type: "webhook_received",
   event_payload: payload,
 })
 .select()
 .single();

if (eventErr) return new Response(eventErr.message, { status: 500 });

// Minimal router – extend as needed
switch (eventType) {
 case "JobUpdated":
   await upsertJob(data);
   break;
 case "EstimateSubmitted":
   await upsertEstimate(data);
   break;
 case "InvoiceSubmitted":
   await upsertInvoice(data);
   break;
 case "NoteAdded":
   await upsertJobNote(data);
   break;
 default:
   // no‑op
}

return new Response("ok");
});

async function upsertJob(job: any) {
await supabase
 .from("contractor_connection.jobs")
 .upsert(
   {
     id: job.id,
     contractor_id: job.contractorId,
     job_reference_number: job.referenceNumber,
     job_status: job.status.toLowerCase(),
     trade_id: job.tradeId,
     assignment_date: job.assignmentDate,
     scheduled_start_date: job.scheduledStartDate,
     scheduled_completion_date: job.scheduledCompletionDate,
     scope_description: job.scope,
     estimated_cost: job.estimatedCost,
     updated_at: new Date().toISOString(),
   },
   { ignoreDuplicates: false, onConflict: "id" },
 );
}

async function upsertEstimate(est: any) {
await supabase
 .from("contractor_connection.job_estimates")
 .upsert(
   {
     id: est.id,
     job_id: est.jobId,
     estimate_version: est.version,
     total_estimate: est.total,
     review_status: "pending_review",
     estimate_json: est.lineItems,
     attached_document_id: est.documentId,
   },
   { ignoreDuplicates: false, onConflict: "id" },
 );
}

async function upsertInvoice(inv: any) {
await supabase
 .from("contractor_connection.job_invoices")
 .upsert(
   {
     id: inv.id,
     job_id: inv.jobId,
     invoice_number: inv.invoiceNumber,
     total_invoice: inv.total,
     tax_amount: inv.tax,
     review_status: "pending_review",
     attached_document_id: inv.documentId,
   },
   { ignoreDuplicates: false, onConflict: "id" },
 );
}

async function upsertJobNote(note: any) {
await supabase
 .from("contractor_connection.job_notes")
 .insert({
   id: note.id,
   job_id: note.jobId,
   author_id: note.authorId,
   note_text: note.text,
   visibility: note.visibility || "internal",
 });
}
//
//  contractor_connection_webhook.ts
//  
//
//  Created by Mad Engineering on 7/8/25.
//

