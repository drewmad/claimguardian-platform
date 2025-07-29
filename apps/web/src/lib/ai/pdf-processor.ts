// PDF processing utilities for AI analysis
import * as pdfjs from 'pdfjs-dist'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`

export interface ProcessedPDF {
  text: string
  pageCount: number
  metadata?: {
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creationDate?: Date
    modificationDate?: Date
  }
}

export interface PageContent {
  pageNumber: number
  text: string
  lines: string[]
}

export async function processPDF(file: File | ArrayBuffer): Promise<ProcessedPDF> {
  try {
    const data = file instanceof File ? await file.arrayBuffer() : file
    const pdf = await pdfjs.getDocument({ data }).promise
    
    let fullText = ''
    const pages: PageContent[] = []
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const pageText = `--- PAGE ${i} ---\n`
      fullText += pageText
      
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageLines: string[] = []
      let currentLine = ''
      let lastY: number | null = null
      
      // Process text items to reconstruct lines
      textContent.items.forEach((item: any) => {
        if ('str' in item) {
          // Check if this is a new line based on Y position
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            if (currentLine.trim()) {
              pageLines.push(currentLine.trim())
            }
            currentLine = item.str
          } else {
            currentLine += ' ' + item.str
          }
          lastY = item.transform[5]
        }
      })
      
      // Add the last line
      if (currentLine.trim()) {
        pageLines.push(currentLine.trim())
      }
      
      const pageContent = pageLines.join('\n')
      fullText += pageContent + '\n\n'
      
      pages.push({
        pageNumber: i,
        text: pageContent,
        lines: pageLines
      })
    }
    
    // Extract metadata
    const metadata = await pdf.getMetadata()
    
    const info = metadata.info as any
    
    return {
      text: fullText,
      pageCount: pdf.numPages,
      metadata: info ? {
        title: info.Title as string,
        author: info.Author as string,
        subject: info.Subject as string,
        keywords: info.Keywords as string,
        creationDate: info.CreationDate ? new Date(info.CreationDate as string) : undefined,
        modificationDate: info.ModDate ? new Date(info.ModDate as string) : undefined
      } : undefined
    }
  } catch (error) {
    console.error('Error processing PDF:', error)
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function searchInPDF(pdfText: string, query: string, contextLength = 50): Array<{
  page: number
  text: string
  matchIndex: number
}> {
  const results: Array<{ page: number; text: string; matchIndex: number }> = []
  const regex = new RegExp(`.{0,${contextLength}}${query}.{0,${contextLength}}`, 'gi')
  const matches = [...pdfText.matchAll(regex)]
  
  matches.forEach(match => {
    if (match.index === undefined) return
    
    // Find which page this match is on
    const textBeforeMatch = pdfText.substring(0, match.index)
    const pageMatches = textBeforeMatch.match(/--- PAGE (\d+) ---/g)
    const page = pageMatches ? parseInt(pageMatches.pop()?.match(/\d+/)?.[0] || '1', 10) : 1
    
    results.push({
      page,
      text: match[0].trim(),
      matchIndex: match.index
    })
  })
  
  return results
}

export function extractPolicyData(pdfText: string): {
  carrier?: string
  policyNumber?: string
  effectiveDate?: string
  expirationDate?: string
  premium?: number
  coverageDwelling?: number
  standardDeductible?: number
  windDeductible?: string
} {
  const data: any = {}
  
  // Common patterns for policy data extraction
  const patterns = {
    carrier: /(?:company|carrier|insurer):\s*([^\n]+)/i,
    policyNumber: /policy\s*(?:number|#|no\.?):\s*([A-Z0-9-]+)/i,
    effectiveDate: /effective\s*date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    expirationDate: /expiration\s*date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    premium: /(?:total|annual)\s*premium:\s*\$?([\d,]+(?:\.\d{2})?)/i,
    coverageDwelling: /coverage\s*a.*?dwelling.*?\$?([\d,]+)/i,
    standardDeductible: /(?:all\s*other\s*perils|standard)\s*deductible:\s*\$?([\d,]+)/i,
    windDeductible: /(?:hurricane|wind(?:storm)?)\s*deductible:\s*(\d+%|\$[\d,]+)/i
  }
  
  // Extract data using patterns
  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = pdfText.match(pattern)
    if (match) {
      const value = match[1].trim()
      if (['premium', 'coverageDwelling', 'standardDeductible'].includes(key)) {
        data[key] = parseFloat(value.replace(/,/g, ''))
      } else {
        data[key] = value
      }
    }
  })
  
  return data
}