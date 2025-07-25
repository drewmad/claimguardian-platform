'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { Progress } from '@/components/ui/progress'
import { Loader2, Play, Pause, CheckCircle, AlertCircle } from 'lucide-react'

interface ScraperConfig {
  name: string
  displayName: string
  serviceUrl: string
  fieldMap: Record<string, string>
}

const counties: ScraperConfig[] = [
  {
    name: 'fl_charlotte_county',
    displayName: 'Charlotte County',
    serviceUrl: 'https://ccgis.charlottecountyfl.gov/arcgis/rest/services/WEB_Parcels/MapServer/0',
    fieldMap: {
      'OBJECTID': 'source_object_id',
      'Strap': 'parcel_id',
      'Owner': 'owner_name',
      'Situs_Addr': 'situs_address',
      'Situs_City': 'situs_city',
      'Situs_Zip': 'situs_zip',
      'Total_Just': 'just_value',
      'Year_Built': 'year_built',
      'Prop_Use_C': 'property_use_code',
      'Heated_Are': 'heated_area_sqft'
    }
  },
  {
    name: 'fl_lee_county',
    displayName: 'Lee County',
    serviceUrl: 'https://maps.leepa.org/arcgis/rest/services/Leegis/SecureParcels/MapServer/0',
    fieldMap: {
      'OBJECTID': 'source_object_id',
      'STRAP': 'parcel_id',
      'OWNER_NAME': 'owner_name',
      'SITE_ADDRESS_LINE1': 'situs_address',
      'SITE_ADDRESS_CITY': 'situs_city',
      'SITE_ADDRESS_ZIP': 'situs_zip',
      'TOTAL_ASSESSED_VALUE': 'assessed_value',
      'JUST_MARKET_VALUE': 'just_value',
      'YEAR_BUILT': 'year_built',
      'USE_CODE': 'property_use_code',
      'TOTAL_LIVING_AREA': 'heated_area_sqft'
    }
  },
  {
    name: 'fl_sarasota_county',
    displayName: 'Sarasota County',
    serviceUrl: 'https://gis.sc-pa.com/server/rest/services/Parcel/ParcelData/MapServer/1',
    fieldMap: {
      'OBJECTID': 'source_object_id',
      'PARCEL_ID': 'parcel_id',
      'OWNER_1': 'owner_name',
      'SITUS_ADDR': 'situs_address',
      'SITUS_CITY': 'situs_city',
      'SITUS_ZIP': 'situs_zip',
      'JV_TOTAL': 'just_value',
      'YR_BLT': 'year_built',
      'DOR_UC': 'property_use_code',
      'TOT_LVG_AR': 'heated_area_sqft'
    }
  }
]

export function PropertyScraper() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentCounty, setCurrentCounty] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    errors: 0
  })
  const [logs, setLogs] = useState<string[]>([])
  
  const supabase = createClient()
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${message}`])
  }
  
  const processCounty = async (county: ScraperConfig) => {
    setCurrentCounty(county.name)
    addLog(`Starting ${county.displayName}...`)
    
    try {
      // Get last processed ID
      const { data: lastRun } = await supabase
        .from('scraper_runs')
        .select('last_object_id')
        .eq('source', county.name)
        .single()
      
      const lastObjectId = lastRun?.last_object_id || 0
      const BATCH_SIZE = 100 // Smaller batches for browser
      let offset = 0
      let hasMore = true
      let maxObjectId = lastObjectId
      let countyTotal = 0
      
      while (hasMore && isRunning) {
        const params = new URLSearchParams({
          where: `OBJECTID > ${lastObjectId}`,
          outFields: Object.keys(county.fieldMap).join(','),
          f: 'json',
          resultOffset: String(offset),
          resultRecordCount: String(BATCH_SIZE),
          orderByFields: 'OBJECTID ASC'
        })
        
        try {
          // Use a CORS proxy for client-side requests
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(`${county.serviceUrl}/query?${params}`)}`
          const response = await fetch(proxyUrl)
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          
          const data = await response.json()
          
          if (!data.features || data.features.length === 0) {
            hasMore = false
            continue
          }
          
          // Map and prepare data
          const mappedData = data.features.map((feature: any) => {
            const mapped: any = {}
            for (const [source, target] of Object.entries(county.fieldMap)) {
              mapped[target] = feature.attributes[source]
            }
            
            const objectId = feature.attributes.OBJECTID
            if (objectId > maxObjectId) maxObjectId = objectId
            
            return {
              source: county.name,
              import_batch: crypto.randomUUID(),
              raw_data: mapped
            }
          })
          
          // Insert into staging table
          const { error } = await supabase
            .from('property_import_staging')
            .insert(mappedData)
          
          if (error) {
            setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
            addLog(`Error inserting batch: ${error.message}`)
          } else {
            countyTotal += data.features.length
            setStats(prev => ({ 
              ...prev, 
              processed: prev.processed + data.features.length 
            }))
          }
          
          offset += BATCH_SIZE
          setProgress((offset / 1000) * 100) // Estimate based on typical county size
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          addLog(`Error fetching data: ${error.message}`)
          setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
          hasMore = false
        }
      }
      
      // Update scraper run record
      if (countyTotal > 0) {
        await supabase
          .from('scraper_runs')
          .upsert({
            source: county.name,
            last_object_id: maxObjectId,
            last_run_at: new Date().toISOString()
          })
        
        addLog(`${county.displayName}: Processed ${countyTotal} records`)
      }
      
    } catch (error) {
      addLog(`Failed to process ${county.displayName}: ${error.message}`)
    }
  }
  
  const startScraping = async () => {
    setIsRunning(true)
    setStats({ total: 0, processed: 0, errors: 0 })
    
    for (const county of counties) {
      if (!isRunning) break
      await processCounty(county)
    }
    
    // Trigger processing of staged data
    addLog('Triggering data processing...')
    const { data, error } = await supabase
      .rpc('trigger_property_import_processing')
    
    if (error) {
      addLog(`Processing error: ${error.message}`)
    } else {
      addLog('Data processing complete')
    }
    
    setIsRunning(false)
    setCurrentCounty(null)
    setProgress(0)
  }
  
  const stopScraping = () => {
    setIsRunning(false)
    addLog('Scraping stopped by user')
  }
  
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Property Data Scraper</span>
          <div className="flex gap-2">
            {!isRunning ? (
              <Button 
                onClick={startScraping}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Scraping
              </Button>
            ) : (
              <Button 
                onClick={stopScraping}
                variant="destructive"
              >
                <Pause className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Records</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Processed</p>
            <p className="text-2xl font-bold text-green-400">{stats.processed}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Errors</p>
            <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
          </div>
        </div>
        
        {/* Current County */}
        {currentCounty && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Processing: {counties.find(c => c.name === currentCounty)?.displayName}
            </p>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {/* Activity Log */}
        <div className="bg-gray-900 rounded p-3 h-48 overflow-y-auto">
          <p className="text-xs text-gray-400 mb-2">Activity Log</p>
          {logs.map((log, i) => (
            <p key={i} className="text-xs text-gray-300 font-mono">{log}</p>
          ))}
        </div>
        
        {/* Status Icons */}
        <div className="flex justify-center gap-4">
          {counties.map(county => (
            <div key={county.name} className="text-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mb-1",
                currentCounty === county.name ? "bg-blue-600" : "bg-gray-700"
              )}>
                {currentCounty === county.name ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : stats.processed > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-400">{county.displayName.split(' ')[0]}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}