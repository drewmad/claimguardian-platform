// Proxy Edge Function that delegates scraping to an external API
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configure your external scraper API endpoint
const EXTERNAL_SCRAPER_API = Deno.env.get('EXTERNAL_SCRAPER_API') || 'https://api.claimguardian.com/scraper';
const SCRAPER_API_KEY = Deno.env.get('SCRAPER_API_KEY') || '';

interface ScrapeRequest {
  sources?: string[];
  forceRefresh?: boolean;
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body: ScrapeRequest = await req.json();
    const sources = body.sources || ['fl_charlotte_county', 'fl_lee_county', 'fl_sarasota_county'];
    
    // Get last run states
    const { data: lastRuns } = await supabase
      .from('scraper_runs')
      .select('source, last_object_id')
      .in('source', sources);
    
    const lastRunMap = new Map(lastRuns?.map(run => [run.source, run.last_object_id]) || []);
    
    // Queue scraping requests
    const requests = sources.map(source => ({
      source,
      last_object_id: body.forceRefresh ? 0 : (lastRunMap.get(source) || 0),
      status: 'pending'
    }));
    
    const { data: queuedItems, error: queueError } = await supabase
      .from('scraper_queue')
      .insert(requests)
      .select();
    
    if (queueError) {
      throw new Error(`Failed to queue scraping requests: ${queueError.message}`);
    }
    
    // Call external scraper API
    const scraperResponse = await fetch(EXTERNAL_SCRAPER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SCRAPER_API_KEY}`,
        'X-Supabase-URL': Deno.env.get('SUPABASE_URL')!,
        'X-Supabase-Service-Key': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      },
      body: JSON.stringify({
        queue_ids: queuedItems.map(item => item.id),
        sources: requests
      })
    });
    
    if (!scraperResponse.ok) {
      throw new Error(`External scraper API error: ${scraperResponse.status}`);
    }
    
    const result = await scraperResponse.json();
    
    return new Response(JSON.stringify({
      message: 'Scraping requests queued successfully',
      queued: queuedItems.length,
      external_response: result
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "error", message: 'Proxy error:', error }));
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});