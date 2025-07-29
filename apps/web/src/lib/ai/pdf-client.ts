'use client'

// This module handles PDF.js imports for client-side only usage
export async function getPdfLib() {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be used in the browser')
  }
  
  const pdfjs = await import('pdfjs-dist')
  
  // Configure worker
  pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`
  
  return pdfjs
}