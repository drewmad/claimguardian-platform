# Generate Vector Tiles Edge Function

This Supabase Edge Function handles the background generation and caching of Mapbox Vector Tiles (MVT) for the ClaimGuardian platform.

## Modes

### Schedule Mode
Queues tiles for generation across Florida's bounding box at multiple zoom levels.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-vector-tiles \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "schedule", "zoom_levels": [6, 7, 8, 9, 10]}'
```

### Worker Mode  
Processes queued tile jobs and generates MVT data.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-vector-tiles \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "worker", "max_jobs": 10}'
```

### Single Mode
Generates a specific tile on-demand.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-vector-tiles \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "single", "single_tile": {"z": 10, "x": 263, "y": 416}}'
```

## Environment Variables

Required environment variables (set via `supabase secrets set`):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `TILE_STORAGE_BUCKET` - Storage bucket name (default: "vector-tiles")  
- `TILE_STORAGE_PREFIX` - Storage path prefix (default: "v1")
- `MVT_VERSION_SIG` - Version signature for cache invalidation
- `MVT_DEFAULT_TTL_SECONDS` - Cache TTL for low zoom tiles (default: 604800)
- `MVT_ACTIVE_TTL_SECONDS` - Cache TTL for high zoom tiles (default: 86400)
- `FLORIDA_BBOX_*` - Florida bounding box coordinates

## Deployment

```bash
# Deploy the function
supabase functions deploy generate-vector-tiles

# Set environment variables
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# ... set other variables

# Schedule regular execution (optional)
# Add to supabase.toml:
[edge_runtime.schedulers.vector_tiles_schedule]
enabled = true
schedule = "*/5 * * * *"  # Every 5 minutes
function = "generate-vector-tiles"
```

## Usage in Applications

```typescript
// Schedule tile generation
await fetch('/api/functions/generate-vector-tiles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'schedule' })
});

// Start a worker to process jobs
await fetch('/api/functions/generate-vector-tiles', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'worker', max_jobs: 5 })
});
```