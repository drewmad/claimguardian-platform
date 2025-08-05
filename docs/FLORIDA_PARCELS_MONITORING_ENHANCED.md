# Florida Parcels Enhanced Monitoring System

## Overview
The enhanced Florida Parcels monitoring system provides comprehensive real-time tracking, analytics, and control for processing all 67 Florida counties' cadastral data (approximately 10 million parcels).

## Access the Dashboard

### Local Development
```bash
cd /Users/madengineering/ClaimGuardian
pnpm dev
# Open browser to: http://localhost:3000/admin/florida-parcels
```

### Production
Navigate to: `https://claimguardianai.com/admin/florida-parcels`

## Enhanced Features

### 1. **Real-Time Monitoring Dashboard**
- **Auto-refresh**: Configurable intervals (5-60 seconds)
- **Live Progress Tracking**: See parcels processing in real-time
- **Multi-view Interface**: Overview, Counties, Analytics, Timeline tabs
- **Advanced Filtering**: By status, region, progress, or custom search
- **Batch Controls**: Select multiple counties for targeted processing

### 2. **Performance Analytics**
- **Processing Speed Metrics**: Parcels per minute, per county
- **Cost Estimation**: Real-time cost tracking ($0.50 per million parcels)
- **Storage Usage**: Estimated database storage (2.5KB per parcel)
- **Efficiency Scoring**: Performance grades (A+ to F) based on speed and errors
- **Throughput Analysis**: MB/s data processing rates
- **Optimization Recommendations**: AI-driven suggestions for better performance

### 3. **Regional Analysis**
- **7 Florida Regions**: Panhandle, North Central, Northeast, Central, West Central, East Central, Southeast, Southwest, South Central
- **Regional Progress**: Track completion by geographic area
- **Population Coverage**: See how many residents are covered
- **Density Metrics**: Parcels per square mile by region
- **Major Cities**: View processing status for metropolitan areas

### 4. **Error Management**
- **Smart Error Detection**: Pattern recognition for common issues
- **Recovery Suggestions**: Automated recommendations for fixing errors
- **Error Timeline**: Track when and where errors occur
- **Batch Resume**: Continue processing from last successful batch
- **Error Analytics**: Identify systemic issues across counties

### 5. **Predictive Analytics**
- **Completion Estimates**: AI-powered predictions for processing time
- **Resource Planning**: Forecast CPU, memory, and storage needs
- **Cost Projections**: Estimate total processing costs
- **Bottleneck Detection**: Identify slow counties before they impact timeline

### 6. **Advanced Controls**
- **Parallel Processing**: Configure 1-10 counties simultaneously
- **Batch Size Optimization**: Adjust from 100-5000 records per batch
- **Priority Processing**: Start with 20 most populous counties
- **Selective Processing**: Choose specific counties to process
- **Emergency Stop**: Halt all processing immediately

## Dashboard Components

### Summary Cards
1. **Overall Progress**: Visual progress bar with percentage
2. **Processing Speed**: Current parcels/minute rate
3. **Storage Usage**: Estimated GB used in database
4. **Estimated Cost**: Running total of processing costs

### County List Features
- **Expandable Details**: Click to see processing history, errors, logs
- **Status Badges**: Color-coded with icons (Processing, Completed, Error, Pending)
- **Progress Bars**: Visual representation with exact percentages
- **Population Info**: Residents affected by each county
- **Action Buttons**: Retry, Reset, View Logs per county

### Analytics Charts
1. **County Status Distribution**: Pie chart of processing states
2. **Top Counties by Progress**: Bar chart of leading counties
3. **Processing Timeline**: Line chart of activity over time
4. **Regional Heatmap**: Visual map of Florida showing progress

### Timeline View
- **Recent Activity Log**: Last 50 processing events
- **Event Types**: Started, Progress Update, Completed, Failed
- **Timestamps**: Exact time of each event
- **Performance Metrics**: Speed and error count per event

## Processing Workflow

### Starting Processing
1. **Check Storage**: Ensure Cadastral_Statewide.zip is uploaded to Storage
2. **Select Mode**:
   - **Priority**: 20 largest counties by population
   - **All**: All 67 counties in sequence
   - **Specific**: Select individual counties
3. **Configure Settings**:
   - Batch Size: 1000 (default, adjustable)
   - Parallel Counties: 2 (default, max 10)
4. **Monitor Progress**: Watch real-time updates on dashboard

### Error Recovery
1. **Identify Error**: Check error type and affected county
2. **Review Suggestions**: Follow automated recovery recommendations
3. **Retry Options**:
   - Resume from last batch
   - Reset and restart county
   - Adjust batch size and retry

### Performance Optimization
1. **Monitor Speed**: Track parcels/minute rates
2. **Adjust Settings**:
   - Increase batch size for faster counties
   - Reduce batch size for error-prone counties
   - Increase parallel processing during off-peak
3. **Review Analytics**: Check optimization recommendations

## API Endpoints

### Edge Functions
```typescript
// Processor - Handle individual counties
POST /functions/v1/florida-parcels-processor
{
  "action": "process" | "status" | "verify",
  "county_code": 1-67,
  "batch_size": 1000,
  "storage_path": "path/to/geojson"
}

// Orchestrator - Manage multi-county jobs
POST /functions/v1/florida-parcels-orchestrator
{
  "action": "start" | "stop" | "status" | "reset",
  "mode": "priority" | "all" | "specific",
  "counties": [1, 2, 3],
  "batch_size": 1000,
  "parallel_counties": 2
}

// Monitor - Get dashboard data
POST /functions/v1/florida-parcels-monitor
{
  "view": "dashboard" | "timeline" | "errors" | "performance" | "detailed" | "regions" | "predictions",
  "county_code": 15,
  "limit": 50,
  "region": "Southwest"
}
```

## Database Tables

### florida_parcels
- 138 columns matching Florida DOR schema
- PostGIS geometry support
- Indexes on key fields
- RLS policies for security

### florida_parcels_processing_log
- County-level processing status
- Error tracking and recovery points
- Performance metrics

### florida_parcels_orchestrator
- Multi-county job management
- Parallel processing control
- Job history and status

### florida_parcels_processing_stats
- Aggregate performance data
- Historical trends
- System metrics

## Performance Benchmarks

### Expected Processing Rates
- **Small Counties** (<50k parcels): 500-800 parcels/minute
- **Medium Counties** (50k-200k parcels): 400-600 parcels/minute
- **Large Counties** (>200k parcels): 300-500 parcels/minute
- **Miami-Dade** (950k parcels): 250-400 parcels/minute

### Optimization Tips
1. **Batch Size**: 
   - Small counties: 500-1000
   - Large counties: 1000-2000
   - Error-prone: 100-500

2. **Parallel Processing**:
   - Off-peak hours: 5-10 counties
   - Peak hours: 1-3 counties
   - Mixed sizes: Pair large with small

3. **Error Reduction**:
   - Pre-validate data format
   - Monitor Storage API limits
   - Check network stability

## Troubleshooting

### Common Issues
1. **Slow Processing**
   - Check batch size settings
   - Verify network connectivity
   - Review system resources

2. **High Error Rates**
   - Validate source data format
   - Check Storage permissions
   - Review RLS policies

3. **Stuck Processing**
   - Use Stop button to halt
   - Check Edge Function logs
   - Reset affected counties

### Debug Commands
```bash
# Check Edge Function logs
supabase functions logs florida-parcels-processor --follow
supabase functions logs florida-parcels-orchestrator --follow

# Database queries
SELECT * FROM florida_parcels_processing_log WHERE status = 'error';
SELECT * FROM florida_parcels_import_status;
```

## Cost Management

### Pricing Model
- **Processing**: $0.50 per million parcels
- **Storage**: ~2.5KB per parcel
- **Edge Functions**: Included in Supabase plan
- **Estimated Total**: $5-10 for all Florida

### Cost Optimization
1. Process during off-peak hours
2. Use optimal batch sizes
3. Minimize error retries
4. Clean up completed data

## Security Considerations

### Access Control
- Admin-only dashboard access
- Service role for Edge Functions
- RLS policies on all tables
- Audit logging enabled

### Data Protection
- No PII in logs
- Encrypted storage
- Secure API endpoints
- Rate limiting enabled

## Future Enhancements

### Planned Features
1. **ML-Powered Optimization**: Auto-adjust settings based on performance
2. **Mobile Dashboard**: Responsive design for tablet/phone monitoring
3. **Email Alerts**: Notifications for errors or completion
4. **Data Validation**: Pre-processing validation to reduce errors
5. **Incremental Updates**: Process only changed parcels
6. **3D Visualizations**: Property boundaries in 3D
7. **API Integration**: Direct county data source connections
8. **Backup/Restore**: Automated backup of processed data

### Integration Opportunities
- Connect to property enrichment services
- Link to assessment databases
- Integrate with GIS mapping tools
- Export to analytics platforms

## Support

### Resources
- Edge Function logs in Supabase Dashboard
- Database queries for troubleshooting
- Performance analytics in monitoring dashboard
- Error patterns in timeline view

### Best Practices
1. Start with small test batch
2. Monitor first few counties closely
3. Adjust settings based on performance
4. Document any custom configurations
5. Regular backups of processed data