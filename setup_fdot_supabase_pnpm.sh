#!/usr/bin/env bash
################################################################################
# ClaimGuardian • FDOT Parcel Edge Function bootstrap (pnpm edition)
#  – Uses pnpm for the Supabase CLI install
#  – Creates / writes functions/foot_sync/index.ts
#  – Sets secrets, deploys, invokes once
#  – Requires pnpm ≥ 8, curl, git
################################################################################
set -euo pipefail

# ───── 0. EDIT THESE TWO LINES ────────────────────────────────────────────────
PROJECT_REF="your-project-ref"           # e.g. tmlrvecuwgppbaynesji
SERVICE_ROLE_KEY="your-service-role-jwt" # copy from Settings ▸ API
# ──────────────────────────────────────────────────────────────────────────────

# 1) Install / upgrade Supabase CLI globally via pnpm
if ! command -v supabase >/dev/null 2>&1; then
  echo "🛠  Installing Supabase CLI (pnpm)…"
  pnpm add -g supabase
else
  echo "🔄  Updating Supabase CLI (pnpm)…"
  pnpm update -g supabase
fi

# 2) Login once (sbp_ token)
if ! supabase status 2>/dev/null | grep -q "Access token"; then
  echo "🔑  Supabase login – paste your sbp_… token"
  supabase login
fi

# 3) Scaffold function folder if absent
mkdir -p supabase/functions/foot_sync

# 4) Write TypeScript (overwrite each run)
cat > supabase/functions/foot_sync/index.ts <<'TS'
// deno-lint-ignore-file
// cron: 0 4 20 6 *   // yearly – 20 June 04:00 UTC
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

const BASE  = "https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer";
const PAGE  = 1000;
const OUTSR = 4326;

async function fetchLayer(layer: number) {
  let offset = 0;
  while (true) {
    const url = `${BASE}/${layer}/query?where=1=1&outFields=*` +
                `&returnGeometry=true&outSR=${OUTSR}&f=geoJSON` +
                `&resultOffset=${offset}&resultRecordCount=${PAGE}`;
    const data = await (await fetch(url)).json();
    const feats = (data.features ?? []) as unknown[];
    if (!feats.length) break;

    for (const f of feats) {
      const { error } = await supabase.rpc("fdot_stage_insert_one", { j: f });
      if (error) throw error;
    }
    if (feats.length < PAGE) break;
    offset += PAGE;
  }
}

async function run() {
  for (let layer = 1; layer <= 67; layer++) await fetchLayer(layer);
  const { error } = await supabase.rpc("fdot_merge_stage");
  if (error) throw error;
}

serve(async () => {
  try {
    await run();
    return new Response("FDOT parcel sync ✅", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(`FDOT parcel sync failed: ${e}`, { status: 500 });
  }
});
TS

# 5) Store secrets in Supabase (one-time)
supabase secrets set \
  SUPABASE_URL="https://${PROJECT_REF}.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="${SERVICE_ROLE_KEY}" \
  --project-ref "${PROJECT_REF}"

# 6) Deploy the Edge Function (forces schema-cache refresh)
supabase functions deploy foot_sync --project-ref "${PROJECT_REF}" --no-verify-jwt

# 7) Tail logs in background
supabase functions logs foot_sync --project-ref "${PROJECT_REF}" --follow &
LOG_PID=$!

# 8) Invoke once for initial 13 M-parcel import
echo "⏳  Running first import…"
supabase functions invoke foot_sync --project-ref "${PROJECT_REF}"

echo "✅  If you saw 'FDOT parcel sync ✅' above, import completed."

# 9) Clean up log tail
kill $LOG_PID || true
################################################################################