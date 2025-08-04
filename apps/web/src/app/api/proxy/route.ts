import { NextRequest, NextResponse } from 'next/server'
import { logger } from "@/lib/logger/production-logger"

// Whitelist of allowed domains for security
const ALLOWED_DOMAINS = [
  'ccgis.charlottecountyfl.gov',
  'maps.leepa.org',
  'gis.sc-pa.com'
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }
    
    // Validate the URL is from an allowed domain
    const url = new URL(targetUrl)
    if (!ALLOWED_DOMAINS.some(domain => url.hostname.includes(domain))) {
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 }
      )
    }
    
    // Fetch the data from the target URL
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Target server returned ${response.status}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    logger.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    )
  }
}