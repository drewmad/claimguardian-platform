
'use client'

import { useState } from 'react'
import { Camera, FileText, Loader2, Upload, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ocrService, DocumentType, OCRResult, ReceiptData } from '@/lib/services/ocr-service'
import { CameraCapture } from '@/components/camera/camera-capture'

interface OCRScannerProps {
  onScanComplete?: (result: OCRResult) => void
  documentType?: DocumentType
  showHistory?: boolean
}

export function OCRScanner({ 
  onScanComplete, 
  documentType = 'receipt',
  showHistory = true 
}: OCRScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number }>({ used: 0, limit: 0, remaining: 0 })
  const [history, setHistory] = useState<any[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Load usage info on mount
  useState(() => {
    loadUsageInfo()
    if (showHistory) {
      loadHistory()
    }
  })

  const loadUsageInfo = async () => {
    const usageData = await ocrService.getOCRUsage()
    setUsage(usageData)
  }

  const loadHistory = async () => {
    const historyData = await ocrService.getOCRHistory(5)
    setHistory(historyData)
  }

  const processFile = async (file: File) => {
    if (!file) return

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    setIsProcessing(true)
    try {
      const ocrResult = await ocrService.processDocument(file, {
        documentType,
        extractStructuredData: true,
        language: 'en'
      })

      setResult(ocrResult)
      
      if (ocrResult.success) {
        toast.success('Document processed successfully!')
        onScanComplete?.(ocrResult)
        
        // Reload usage and history
        await loadUsageInfo()
        if (showHistory) {
          await loadHistory()
        }
      } else {
        toast.error(ocrResult.error || 'Failed to process document')
      }
    } catch (error) {
      console.error('OCR error:', error)
      toast.error('Failed to process document')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleCameraCapture = async (file: File) => {
    setShowCamera(false)
    
    processFile(file)
  }

  const clearResult = () => {
    setResult(null)
    setPreviewUrl(null)
  }

  const renderStructuredData = (data: any) => {
    if (!data) return null

    switch (documentType) {
      case 'receipt':
        const receipt = data as ReceiptData
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Merchant</p>
                <p className="font-medium">{receipt.merchantName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{receipt.date || 'N/A'}</p>
              </div>
            </div>
            
            {receipt.items && receipt.items.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Items</p>
                <div className="space-y-1">
                  {receipt.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.name} {item.quantity && item.quantity > 1 ? `(${item.quantity})` : ''}</span>
                      <span>{ocrService.formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-t pt-4 space-y-1">
              {receipt.subtotal !== undefined && (
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{ocrService.formatCurrency(receipt.subtotal)}</span>
                </div>
              )}
              {receipt.tax !== undefined && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{ocrService.formatCurrency(receipt.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{ocrService.formatCurrency(receipt.total)}</span>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Usage Info */}
      <Card>
        <CardHeader>
          <CardTitle>OCR Usage</CardTitle>
          <CardDescription>
            {usage.limit === -1 
              ? 'Unlimited OCR scans with your Pro plan'
              : `${usage.remaining} of ${usage.limit} scans remaining this month`}
          </CardDescription>
        </CardHeader>
        {usage.limit !== -1 && (
          <CardContent>
            <Progress value={(usage.used / usage.limit) * 100} className="h-2" />
          </CardContent>
        )}
      </Card>

      {/* Scanner Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Document</CardTitle>
          <CardDescription>
            Upload or capture a {documentType} to extract text and data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!result && !isProcessing && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowCamera(true)}
                  disabled={usage.remaining === 0}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Use Camera
                </Button>
                
                <Button
                  variant="outline"
                  disabled={usage.remaining === 0}
                  className="flex-1"
                  asChild
                >
                  <label>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>

              {usage.remaining === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>OCR Limit Reached</AlertTitle>
                  <AlertDescription>
                    You've used all your OCR scans for this month. Upgrade your plan for more scans.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Camera View */}
          {showCamera && (
            <div className="fixed inset-0 z-50 bg-black">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white"
                onClick={() => setShowCamera(false)}
              >
                <X className="w-6 h-6" />
              </Button>
              <CameraCapture
                onCapture={handleCameraCapture}
                onClose={() => setShowCamera(false)}
              />
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-gray-600">Processing document...</p>
            </div>
          )}

          {/* Results */}
          {result && !isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? 'Success' : 'Failed'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearResult}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>

              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Scanned document"
                    className="w-full max-h-64 object-contain rounded border"
                  />
                </div>
              )}

              {result.success && (
                <Tabs defaultValue="structured" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="structured">Structured Data</TabsTrigger>
                    <TabsTrigger value="text">Raw Text</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="structured" className="mt-4">
                    {result.structuredData ? (
                      renderStructuredData(result.structuredData)
                    ) : (
                      <p className="text-sm text-gray-500">No structured data extracted</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="text" className="mt-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <pre className="text-sm whitespace-pre-wrap">{result.text || 'No text extracted'}</pre>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {!result.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Processing Failed</AlertTitle>
                  <AlertDescription>
                    {result.error || 'Failed to process document'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Processing time: {result.processingTime}ms</span>
                {result.confidence && (
                  <span>Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {showHistory && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{item.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.success ? 'default' : 'secondary'} className="text-xs">
                    {item.document_type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
