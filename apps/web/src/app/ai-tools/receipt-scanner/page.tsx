'use client'

import { useState } from 'react'
import { ArrowLeft, Receipt, FileText, Calculator, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OCRScanner } from '@/components/ocr/ocr-scanner'
import { OCRResult } from '@/lib/services/ocr-service'
import { createBrowserSupabaseClient } from '@claimguardian/db'

export default function ReceiptScannerPage() {
  const [scannedReceipts, setScannedReceipts] = useState<OCRResult[]>([])
  const supabase = createBrowserSupabaseClient()

  const handleScanComplete = (result: OCRResult) => {
    if (result.success) {
      setScannedReceipts(prev => [result, ...prev])
    }
  }

  const saveReceipt = async (result: OCRResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to save receipts')
        return
      }

      // Save to database
      const { error } = await supabase
        .from('saved_receipts')
        .insert({
          user_id: user.id,
          merchant_name: result.structuredData?.merchantName,
          date: result.structuredData?.date,
          total: result.structuredData?.total,
          raw_text: result.text,
          structured_data: result.structuredData,
          confidence: result.confidence
        })

      if (error) throw error

      toast.success('Receipt saved successfully!')
    } catch (error) {
      console.error('Error saving receipt:', error)
      toast.error('Failed to save receipt')
    }
  }

  const calculateTotals = () => {
    const totals = scannedReceipts.reduce((acc, receipt) => {
      if (receipt.structuredData?.total) {
        acc.total += receipt.structuredData.total
        acc.count += 1
      }
      return acc
    }, { total: 0, count: 0 })

    return totals
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/ai-tools" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to AI Tools
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Receipt Scanner</h1>
            <Badge variant="outline">OCR Powered</Badge>
          </div>
          
          <p className="text-gray-600">
            Scan receipts to automatically extract and organize expense data for your property claims
          </p>
        </div>

        <Tabs defaultValue="scan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scan">Scan Receipt</TabsTrigger>
            <TabsTrigger value="recent">Recent Scans ({scannedReceipts.length})</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="scan">
            <OCRScanner
              documentType="receipt"
              onScanComplete={handleScanComplete}
              showHistory={false}
            />
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {scannedReceipts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No receipts scanned yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Switch to the Scan Receipt tab to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              scannedReceipts.map((receipt, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {receipt.structuredData?.merchantName || 'Unknown Merchant'}
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveReceipt(receipt)}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                    <CardDescription>
                      {receipt.structuredData?.date || 'No date'} • 
                      Confidence: {receipt.confidence ? `${(receipt.confidence * 100).toFixed(0)}%` : 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {receipt.structuredData?.items && (
                        <div>
                          <p className="text-sm font-medium mb-1">Items:</p>
                          <div className="text-sm space-y-1">
                            {receipt.structuredData.items.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between">
                                <span className="text-gray-600">{item.name}</span>
                                <span>${item.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>
                            ${receipt.structuredData?.total?.toFixed(2) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="summary">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Total Receipts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totals.count}</p>
                  <p className="text-sm text-gray-600 mt-1">Scanned this session</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Total Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${totals.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-1">Combined total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Average Receipt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    ${totals.count > 0 ? (totals.total / totals.count).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Per receipt</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Export your scanned receipts for claims documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" disabled={scannedReceipts.length === 0}>
                  Export as CSV
                </Button>
                <Button variant="outline" className="w-full" disabled={scannedReceipts.length === 0}>
                  Export as PDF Report
                </Button>
                <Button variant="outline" className="w-full" disabled={scannedReceipts.length === 0}>
                  Add to Claim Evidence
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}