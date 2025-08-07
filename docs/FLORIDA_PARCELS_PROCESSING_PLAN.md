# Florida Parcels Processing Plan

## Current State
- **Source Data**: Cadastral_Statewide.gdb (FileGeodatabase)
- **Total Parcels**: 10,711,337 across 67 counties
- **Data Location**: Local filesystem at `/Users/madengineering/ClaimGuardian/data/florida/`

## Processing Strategy

### Phase 1: Data Preparation (Local)
1. **Convert GDB to GeoJSON by County**
   - Use ogr2ogr to extract each county (CO_NO = 1-67)
   - Convert from Florida State Plane to WGS84 (EPSG:4326)
   - Expected output: 67 GeoJSON files
   - Estimated time: 2-3 hours for all counties

2. **File Size Analysis**
   - Small counties (<50MB): Direct upload to Storage
   - Medium counties (50-500MB): Compress before upload
   - Large counties (>500MB): Split into chunks or stream upload

### Phase 2: Storage Upload
1. **Create Storage Structure**
   ```
   parcels/
   ├── counties/
   │   ├── county_1_ALACHUA.geojson
   │   ├── county_2_BAKER.geojson
   │   └── ... (67 total)
   └── processed/
       └── status.json
   ```

2. **Upload Methods**
   - Small files: Direct HTTP upload
   - Large files: Multipart upload or streaming
   - Alternative: Use Supabase CLI for bulk uploads

### Phase 3: Database Processing
1. **Priority Order** (by population/importance):
   - Miami-Dade (13) - 950k parcels
   - Broward (6) - 720k parcels
   - Palm Beach (50) - 650k parcels
   - Hillsborough (29) - 520k parcels
   - Orange (48) - 480k parcels
   - Then remaining 62 counties

2. **Processing Configuration**
   - Batch size: 1000 parcels per batch
   - Parallel counties: 2-3 (based on size)
   - Error handling: Automatic retry with smaller batches
   - Progress tracking: Real-time dashboard updates

### Phase 4: Quality Assurance
1. **Data Validation**
   - Verify parcel counts match source
   - Check geometry validity
   - Validate required fields populated
   - Cross-reference with county estimates

2. **Performance Monitoring**
   - Track processing speed per county
   - Monitor error rates
   - Optimize batch sizes based on performance
   - Generate completion reports

## Implementation Scripts

### 1. Convert All Counties (convert-all-counties.sh)
```bash
#!/bin/bash
for i in {1..67}; do
    ./scripts/convert-county-to-geojson.sh $i
done
```

### 2. Upload Counties (upload-counties.py)
```python
import os
import asyncio
from supabase import create_client

async def upload_county(file_path):
    # Upload logic here
    pass

async def main():
    counties_dir = "data/florida/counties"
    tasks = []
    for file in os.listdir(counties_dir):
        if file.endswith('.geojson'):
            tasks.append(upload_county(file))
    await asyncio.gather(*tasks)
```

### 3. Process Counties (process-counties.sh)
```bash
# Start with priority counties
curl -X POST $ORCHESTRATOR_URL \
  -d '{"action": "start", "mode": "priority"}'

# Monitor progress
watch -n 10 "curl -s $MONITOR_URL | jq '.summary'"
```

## Timeline Estimate

1. **Data Conversion**: 2-3 hours (can run overnight)
2. **Upload to Storage**: 1-2 hours (depends on internet speed)
3. **Database Processing**:
   - Priority counties: 4-6 hours
   - All counties: 24-48 hours
4. **Total Time**: 2-3 days for complete import

## Resource Requirements

- **Local Storage**: ~20GB for converted GeoJSON files
- **Supabase Storage**: ~15GB for compressed files
- **Database Storage**: ~25GB for all parcels
- **Processing Cost**: ~$5-10 (Edge Function compute time)

## Risk Mitigation

1. **Large File Handling**
   - Pre-compress large counties
   - Implement streaming uploads
   - Consider splitting very large counties

2. **Processing Failures**
   - Automatic retry logic
   - Resume from last successful batch
   - Manual intervention procedures

3. **Data Quality**
   - Validate conversions before upload
   - Spot-check random parcels
   - Compare counts with official sources

## Monitoring & Verification

1. **Real-time Dashboard**: http://localhost:3000/admin/florida-parcels
2. **Database Queries**:
   ```sql
   -- Check progress by county
   SELECT * FROM florida_parcels_import_status;

   -- Verify parcel counts
   SELECT CO_NO, COUNT(*) FROM florida_parcels GROUP BY CO_NO;
   ```

3. **Edge Function Logs**:
   ```bash
   supabase functions logs florida-parcels-processor --follow
   ```

## Next Steps

1. Start with Charlotte County (15) as test case
2. Validate process end-to-end
3. Process priority counties
4. Complete remaining counties
5. Generate final import report
