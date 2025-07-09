'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { Button } from './button'
import { Card } from './card'
import { X, Scan } from 'lucide-react'
import { toast } from 'sonner'

interface BarcodeScannerProps {
  onScan: (code: string, format: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [reader] = useState(() => new BrowserMultiFormatReader())

  useEffect(() => {
    startScanning()
    
    return () => {
      reader.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reader])

  const startScanning = async () => {
    try {
      setIsScanning(true)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream
        
        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result) {
              const code = result.getText()
              const format = result.getBarcodeFormat()
              toast.success(`Scanned: ${code}`)
              onScan(code, format.toString())
              handleClose()
            }
          }
        )
      }
    } catch (error) {
      console.error('Failed to start scanner:', error)
      toast.error('Failed to access camera')
      setIsScanning(false)
    }
  }

  const handleClose = () => {
    reader.reset()
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Barcode Scanner
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
                  <div className="w-full h-full border-2 border-white animate-pulse rounded-lg" />
                </div>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            Position the barcode within the frame to scan
          </p>
        </div>
      </Card>
    </div>
  )
}