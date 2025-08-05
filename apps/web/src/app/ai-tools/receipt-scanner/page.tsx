/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { ArrowLeft, Receipt } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReceiptScannerPage() {
  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/ai-tools">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to AI Tools
            </Button>
          </Link>
          <Receipt className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Receipt Scanner</h1>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Receipt Scanner - Under Development</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">
              The receipt scanner feature is currently being updated and will be available soon.
              This tool will help you scan and organize receipts for your property claims.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}