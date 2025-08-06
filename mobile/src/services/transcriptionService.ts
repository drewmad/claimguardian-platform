/**
 * Audio Transcription Service
 * Handles speech-to-text conversion with multiple provider support
 */

import * as FileSystem from 'expo-file-system'
import { networkService } from './networkService'

export interface TranscriptionOptions {
  audioUri: string
  language?: string
  includeTimestamps?: boolean
  includeConfidence?: boolean
  provider?: 'openai' | 'google' | 'azure' | 'local'
  maxRetries?: number
}

export interface TranscriptionResult {
  text: string
  confidence: number
  language?: string
  segments: Array<{
    start: number
    end: number
    text: string
    confidence: number
  }>
  processingTime: number
  provider: string
}

export interface TranscriptionError {
  code: string
  message: string
  recoverable: boolean
}

class TranscriptionService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
  private readonly maxFileSize = 25 * 1024 * 1024 // 25MB
  private readonly supportedFormats = ['m4a', 'mp3', 'wav', 'aac']

  async transcribeAudio(options: TranscriptionOptions): Promise<TranscriptionResult> {
    const {
      audioUri,
      language = 'en-US',
      includeTimestamps = true,
      includeConfidence = true,
      provider = 'openai',
      maxRetries = 3
    } = options

    // Validate audio file
    await this.validateAudioFile(audioUri)

    // Check if online for cloud providers
    const isOnline = await networkService.isConnected()
    if (!isOnline && provider !== 'local') {
      throw new Error('Internet connection required for transcription')
    }

    // Attempt transcription with retries
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.performTranscription({
          audioUri,
          language,
          includeTimestamps,
          includeConfidence,
          provider
        })

        return result

      } catch (error) {
        console.error(`Transcription attempt ${attempt} failed:`, error)
        lastError = error as Error
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          await this.sleep(delay)
        }
      }
    }

    throw lastError || new Error('Transcription failed after all retries')
  }

  private async validateAudioFile(audioUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri)
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist')
      }

      if (fileInfo.size && fileInfo.size > this.maxFileSize) {
        throw new Error(`Audio file too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`)
      }

      // Check file extension
      const extension = audioUri.split('.').pop()?.toLowerCase()
      if (!extension || !this.supportedFormats.includes(extension)) {
        throw new Error(`Unsupported audio format. Supported: ${this.supportedFormats.join(', ')}`)
      }

    } catch (error) {
      throw new Error(`Audio validation failed: ${error}`)
    }
  }

  private async performTranscription(options: {
    audioUri: string
    language: string
    includeTimestamps: boolean
    includeConfidence: boolean
    provider: string
  }): Promise<TranscriptionResult> {
    const startTime = Date.now()

    switch (options.provider) {
      case 'openai':
        return await this.transcribeWithOpenAI(options, startTime)
      case 'google':
        return await this.transcribeWithGoogle(options, startTime)
      case 'azure':
        return await this.transcribeWithAzure(options, startTime)
      case 'local':
        return await this.transcribeLocally(options, startTime)
      default:
        throw new Error(`Unsupported transcription provider: ${options.provider}`)
    }
  }

  private async transcribeWithOpenAI(
    options: {
      audioUri: string
      language: string
      includeTimestamps: boolean
      includeConfidence: boolean
    },
    startTime: number
  ): Promise<TranscriptionResult> {
    try {
      // Prepare form data
      const formData = new FormData()
      
      // Read audio file as blob
      const audioBlob = await this.uriToBlob(options.audioUri)
      formData.append('file', audioBlob, 'audio.m4a')
      formData.append('model', 'whisper-1')
      formData.append('language', options.language.split('-')[0]) // OpenAI uses 2-letter codes
      
      if (options.includeTimestamps) {
        formData.append('response_format', 'verbose_json')
        formData.append('timestamp_granularities[]', 'segment')
      }

      // Make API request through our backend (to hide API keys)
      const response = await fetch(`${this.baseUrl}/api/transcription/openai`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`OpenAI API error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime

      // Transform OpenAI response to our format
      return {
        text: data.text || '',
        confidence: this.calculateOverallConfidence(data.segments || []),
        language: options.language,
        segments: this.transformOpenAISegments(data.segments || []),
        processingTime,
        provider: 'openai'
      }

    } catch (error) {
      throw new Error(`OpenAI transcription failed: ${error}`)
    }
  }

  private async transcribeWithGoogle(
    options: {
      audioUri: string
      language: string
      includeTimestamps: boolean
      includeConfidence: boolean
    },
    startTime: number
  ): Promise<TranscriptionResult> {
    try {
      // Convert audio to base64 for Google API
      const audioBase64 = await this.uriToBase64(options.audioUri)

      const requestBody = {
        config: {
          encoding: 'M4A',
          sampleRateHertz: 16000,
          languageCode: options.language,
          enableWordTimeOffsets: options.includeTimestamps,
          enableWordConfidence: options.includeConfidence,
          model: 'phone_call',
          useEnhanced: true
        },
        audio: {
          content: audioBase64
        }
      }

      const response = await fetch(`${this.baseUrl}/api/transcription/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Google API error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime

      // Transform Google response to our format
      const results = data.results || []
      const bestResult = results[0]?.alternatives[0] || {}

      return {
        text: bestResult.transcript || '',
        confidence: bestResult.confidence || 0,
        language: options.language,
        segments: this.transformGoogleSegments(bestResult.words || []),
        processingTime,
        provider: 'google'
      }

    } catch (error) {
      throw new Error(`Google transcription failed: ${error}`)
    }
  }

  private async transcribeWithAzure(
    options: {
      audioUri: string
      language: string
      includeTimestamps: boolean
      includeConfidence: boolean
    },
    startTime: number
  ): Promise<TranscriptionResult> {
    try {
      // Azure Speech Service integration would go here
      // This is a placeholder implementation
      
      const audioBlob = await this.uriToBlob(options.audioUri)
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('language', options.language)
      formData.append('format', 'detailed')

      const response = await fetch(`${this.baseUrl}/api/transcription/azure`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Azure API error: ${response.statusText}`)
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime

      return {
        text: data.DisplayText || '',
        confidence: data.Confidence || 0,
        language: options.language,
        segments: this.transformAzureSegments(data.Words || []),
        processingTime,
        provider: 'azure'
      }

    } catch (error) {
      throw new Error(`Azure transcription failed: ${error}`)
    }
  }

  private async transcribeLocally(
    options: {
      audioUri: string
      language: string
      includeTimestamps: boolean
      includeConfidence: boolean
    },
    startTime: number
  ): Promise<TranscriptionResult> {
    try {
      // Local transcription using device capabilities
      // This would use speech recognition APIs available on the device
      
      // Placeholder implementation - in reality this would use:
      // - iOS: Speech framework
      // - Android: SpeechRecognizer
      // - Or a local ML model like Whisper.cpp

      const processingTime = Date.now() - startTime

      return {
        text: 'Local transcription not implemented yet',
        confidence: 0.5,
        language: options.language,
        segments: [],
        processingTime,
        provider: 'local'
      }

    } catch (error) {
      throw new Error(`Local transcription failed: ${error}`)
    }
  }

  // Helper methods
  private async uriToBlob(uri: string): Promise<Blob> {
    try {
      const response = await fetch(uri)
      return await response.blob()
    } catch (error) {
      throw new Error(`Failed to convert URI to blob: ${error}`)
    }
  }

  private async uriToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      })
      return base64
    } catch (error) {
      throw new Error(`Failed to convert URI to base64: ${error}`)
    }
  }

  private transformOpenAISegments(segments: any[]): Array<{
    start: number
    end: number
    text: string
    confidence: number
  }> {
    return segments.map(segment => ({
      start: segment.start || 0,
      end: segment.end || 0,
      text: segment.text || '',
      confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : 0.9
    }))
  }

  private transformGoogleSegments(words: any[]): Array<{
    start: number
    end: number
    text: string
    confidence: number
  }> {
    return words.map(word => ({
      start: parseFloat(word.startTime?.replace('s', '') || '0'),
      end: parseFloat(word.endTime?.replace('s', '') || '0'),
      text: word.word || '',
      confidence: word.confidence || 0
    }))
  }

  private transformAzureSegments(words: any[]): Array<{
    start: number
    end: number
    text: string
    confidence: number
  }> {
    return words.map(word => ({
      start: word.Offset / 10000000, // Convert from ticks to seconds
      end: (word.Offset + word.Duration) / 10000000,
      text: word.Word || '',
      confidence: word.Confidence || 0
    }))
  }

  private calculateOverallConfidence(segments: any[]): number {
    if (!segments.length) return 0
    
    const totalConfidence = segments.reduce((sum, segment) => {
      const confidence = segment.avg_logprob ? Math.exp(segment.avg_logprob) : 0.9
      return sum + confidence
    }, 0)
    
    return totalConfidence / segments.length
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Batch transcription for multiple files
  async transcribeMultiple(
    audioUris: string[],
    options: Omit<TranscriptionOptions, 'audioUri'>
  ): Promise<TranscriptionResult[]> {
    const results: TranscriptionResult[] = []
    
    for (const audioUri of audioUris) {
      try {
        const result = await this.transcribeAudio({ ...options, audioUri })
        results.push(result)
      } catch (error) {
        console.error(`Failed to transcribe ${audioUri}:`, error)
        // Add placeholder result with error
        results.push({
          text: `[Transcription failed: ${error}]`,
          confidence: 0,
          segments: [],
          processingTime: 0,
          provider: options.provider || 'openai'
        })
      }
    }
    
    return results
  }

  // Get supported languages for a provider
  getSupportedLanguages(provider: string = 'openai'): string[] {
    const languageMap: Record<string, string[]> = {
      openai: [
        'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ru-RU',
        'ja-JP', 'ko-KR', 'zh-CN', 'ar-SA', 'hi-IN', 'tr-TR', 'pl-PL',
        'nl-NL', 'sv-SE', 'da-DK', 'no-NO', 'fi-FI'
      ],
      google: [
        'en-US', 'en-GB', 'es-ES', 'es-MX', 'fr-FR', 'fr-CA', 'de-DE',
        'it-IT', 'pt-BR', 'pt-PT', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN',
        'zh-TW', 'ar-SA', 'hi-IN', 'th-TH', 'tr-TR', 'pl-PL', 'nl-NL',
        'sv-SE', 'da-DK', 'no-NO', 'fi-FI', 'cs-CZ', 'hu-HU', 'ro-RO',
        'sk-SK', 'sl-SI', 'hr-HR', 'bg-BG', 'et-EE', 'lv-LV', 'lt-LT',
        'mt-MT', 'ga-IE', 'cy-GB'
      ],
      azure: [
        'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'es-ES', 'es-MX',
        'fr-FR', 'fr-CA', 'de-DE', 'it-IT', 'pt-BR', 'pt-PT', 'ru-RU',
        'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'ar-SA', 'hi-IN', 'th-TH',
        'tr-TR', 'pl-PL', 'nl-NL', 'sv-SE', 'da-DK', 'no-NO', 'fi-FI'
      ],
      local: ['en-US'] // Limited for local processing
    }

    return languageMap[provider] || []
  }

  // Estimate transcription cost
  estimateTranscriptionCost(
    audioUri: string,
    provider: string = 'openai'
  ): Promise<{ estimatedCost: number; currency: string; duration: number }> {
    return new Promise(async (resolve, reject) => {
      try {
        // Get audio duration (this would need to be implemented)
        const duration = await this.getAudioDuration(audioUri)
        
        const costPerMinute: Record<string, number> = {
          openai: 0.006,  // $0.006 per minute
          google: 0.004,  // $0.004 per minute
          azure: 0.005,   // $0.005 per minute
          local: 0        // Free
        }

        const cost = (duration / 60) * (costPerMinute[provider] || 0)
        
        resolve({
          estimatedCost: cost,
          currency: 'USD',
          duration
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  private async getAudioDuration(audioUri: string): Promise<number> {
    // Placeholder - in reality would use audio library to get duration
    try {
      const { Audio } = await import('expo-av')
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri })
      const status = await sound.getStatusAsync()
      await sound.unloadAsync()
      
      if (status.isLoaded && status.durationMillis) {
        return status.durationMillis / 1000 // Convert to seconds
      }
    } catch (error) {
      console.warn('Could not determine audio duration:', error)
    }
    
    return 30 // Default estimate
  }
}

export const transcriptionService = new TranscriptionService()
export default transcriptionService