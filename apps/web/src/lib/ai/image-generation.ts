/**
 * @fileMetadata
 * @purpose "AI image generation service for property images"
 * @owner frontend-team
 * @dependencies ["openai"]
 * @exports ["generatePropertyImage", "getPropertyImagePrompt", "PropertyImageStyle"]
 * @complexity medium
 * @tags ["ai", "image-generation", "property", "openai"]
 * @status stable
 */

import { logger } from '@/lib/logger'
import { toError } from '@claimguardian/utils'

export type PropertyImageStyle =
  | 'modern-home'
  | 'traditional-home'
  | 'florida-style'
  | 'coastal-home'
  | 'suburban-home'
  | 'luxury-home'
  | 'condo-building'
  | 'townhouse'

interface PropertyImageOptions {
  propertyType?: string
  style?: PropertyImageStyle
  location?: string
  features?: string[]
}

export function getPropertyImagePrompt(options: PropertyImageOptions = {}): string {
  const {
    propertyType = 'Single Family Home',
    style = 'florida-style',
    location = 'Florida',
    features = []
  } = options

  const basePrompts = {
    'modern-home': 'A modern, sleek single-family home with clean lines, large windows, and contemporary architecture',
    'traditional-home': 'A classic traditional home with timeless architectural details, pitched roof, and welcoming front porch',
    'florida-style': 'A beautiful Florida-style home with Mediterranean influences, tile roof, palm trees, and tropical landscaping',
    'coastal-home': 'A stunning coastal home with wraparound porches, nautical elements, and ocean-inspired design',
    'suburban-home': 'A charming suburban family home with manicured lawn, driveway, and neighborhood setting',
    'luxury-home': 'An elegant luxury home with premium materials, sophisticated design, and upscale landscaping',
    'condo-building': 'A modern condominium building with multiple units, balconies, and contemporary facade',
    'townhouse': 'A stylish townhouse with attached units, individual entrances, and urban design'
  }

  let prompt = basePrompts[style] || basePrompts['florida-style']

  // Add property type specifics
  if (propertyType.toLowerCase().includes('condo')) {
    prompt = basePrompts['condo-building']
  } else if (propertyType.toLowerCase().includes('townhouse')) {
    prompt = basePrompts['townhouse']
  }

  // Add location context
  if (location.toLowerCase().includes('florida')) {
    prompt += ', situated in sunny Florida with palm trees and tropical vegetation'
  }

  // Add features
  if (features.length > 0) {
    prompt += `, featuring ${features.join(', ')}`
  }

  // Add consistent styling requirements
  prompt += ', professional real estate photography style, bright natural lighting, clear blue sky, well-maintained property, high quality, 4K resolution, architectural photography'

  return prompt
}

export async function generatePropertyImage(options: PropertyImageOptions = {}): Promise<string | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
    // WARNING: API key moved to server-side - use /api/ai endpoint instead

    if (!apiKey) {
      logger.warn('OpenAI API key not found. Cannot generate property images.')
      return null
    }

    const prompt = getPropertyImagePrompt(options)

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural'
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.data && data.data[0] && data.data[0].url) {
      return data.data[0].url
    }

    return null
  } catch (error) {
    logger.error('Error generating property image:', undefined, toError(error))
    return null
  }
}

// Pre-generated property image URLs (fallback when AI generation is not available)
export const DEFAULT_PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop&crop=center'
]

// Get a property image - tries AI generation first, falls back to curated images
export async function getPropertyImage(options: PropertyImageOptions = {}): Promise<string> {
  // Try AI generation first
  const aiImage = await generatePropertyImage(options)
  if (aiImage) {
    return aiImage
  }

  // Fallback to curated images
  const imageIndex = Math.floor(Math.random() * DEFAULT_PROPERTY_IMAGES.length)
  return DEFAULT_PROPERTY_IMAGES[imageIndex]
}

// Get property image based on property type and characteristics
export function getPropertyImageByType(propertyType: string): string {
  const typeImageMap: Record<string, string> = {
    'Single Family Home': DEFAULT_PROPERTY_IMAGES[0],
    'Condo': DEFAULT_PROPERTY_IMAGES[1],
    'Townhouse': DEFAULT_PROPERTY_IMAGES[2],
    'Multi-Family': DEFAULT_PROPERTY_IMAGES[3],
    'Vacation Home': DEFAULT_PROPERTY_IMAGES[4]
  }

  return typeImageMap[propertyType] || DEFAULT_PROPERTY_IMAGES[0]
}
