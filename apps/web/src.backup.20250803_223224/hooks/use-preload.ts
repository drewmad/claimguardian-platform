import { useCallback } from 'react'

export function usePreload() {
  const preloadComponent = useCallback((componentPath: string) => {
    // Preload the component module
    switch (componentPath) {
      case 'ImageUploadAnalyzer':
        import('@/components/ai/image-upload-analyzer')
        break
      case 'AIChatInterface':
        import('@/components/ai/ai-chat-interface')
        break
      case 'CameraCapture':
        import('@/components/ai/camera-capture')
        break
      case 'ReportGenerator':
        import('@/components/reports/report-generator')
        break
      // case 'PDFViewer':
      //   import('@/components/pdf/pdf-viewer').catch(() => {})
      //   break
      default:
        break
    }
  }, [])

  return { preloadComponent }
}