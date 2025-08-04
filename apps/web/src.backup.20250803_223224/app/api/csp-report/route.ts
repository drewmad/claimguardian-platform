import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // CSP violation report format
    const report = body['csp-report'] || body
    
    // Log CSP violation
    logger.warn('CSP Violation', {
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      effectiveDirective: report['effective-directive'],
      originalPolicy: report['original-policy'],
      blockedUri: report['blocked-uri'],
      statusCode: report['status-code'],
      referrer: report.referrer,
      scriptSample: report['script-sample'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number']
    })
    
    // Store in security_logs if available
    try {
      await supabase.from('security_logs').insert({
        event_type: 'csp_violation',
        severity: 'warning',
        action: 'csp_violation_report',
        metadata: {
          report,
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString()
        }
      })
    } catch (dbError) {
      // Don't fail if database insert fails
      console.error('Failed to store CSP violation in database:', dbError)
    }
    
    // Return 204 No Content as per CSP reporting spec
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error('Failed to process CSP report', {}, error instanceof Error ? error : new Error(String(error)))
    
    // Still return 204 to prevent browser from retrying
    return new NextResponse(null, { status: 204 })
  }
}