/**
 * @fileMetadata
 * @purpose Server actions for AI image generation
 * @owner frontend-team
 * @dependencies ["openai"]
 * @exports ["generatePropertyImageServer", "testImageGeneration"]
 * @complexity medium
 * @tags ["server-action", "ai", "image-generation"]
 * @status active
 */
'use server'

import { getPropertyImage, generatePropertyImage, PropertyImageStyle } from '@/lib/ai/image-generation'

interface GenerateImageParams {
  propertyType?: string
  style?: PropertyImageStyle
  location?: string
  features?: string[]
}

export async function generatePropertyImageServer(params: GenerateImageParams) {
  try {
    const imageUrl = await getPropertyImage(params)
    return { data: imageUrl, error: null }
  } catch (error) {
    console.error('Error generating property image:', error)
    return { data: null, error: error as Error }
  }
}

export async function testImageGeneration() {
  try {
    // Test with a simple Florida home
    const imageUrl = await generatePropertyImage({
      propertyType: 'Single Family Home',
      style: 'florida-style',
      location: 'Port Charlotte, Florida',
      features: ['pool', 'palm trees', 'tile roof']
    })
    
    return { 
      data: { 
        imageUrl, 
        success: !!imageUrl,
        message: imageUrl ? 'Image generated successfully' : 'Using fallback image'
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error in test image generation:', error)
    return { data: null, error: error as Error }
  }
}