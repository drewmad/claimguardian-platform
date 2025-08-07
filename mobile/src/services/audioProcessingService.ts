/**
 * Audio Processing Service
 * Handles audio enhancement, noise reduction, and format conversion
 */

import * as FileSystem from 'expo-file-system'
import { Audio } from 'expo-av'

export interface AudioProcessingOptions {
  strength?: number // 0-1, noise reduction strength
  preserveQuality?: boolean
  outputFormat?: 'mp3' | 'm4a' | 'wav'
  bitRate?: number
  sampleRate?: number
  enableEcho?: boolean
  enableGainControl?: boolean
  normalizeVolume?: boolean
}

export interface AudioAnalysis {
  duration: number
  averageVolume: number
  peakVolume: number
  noiseLevel: number
  signalToNoiseRatio: number
  silencePercentage: number
  frequency: {
    low: number    // 0-300Hz
    mid: number    // 300-3000Hz
    high: number   // 3000Hz+
  }
}

export interface AudioProcessingResult {
  processedUri: string
  originalUri: string
  processingTime: number
  improvements: {
    noiseReduced: boolean
    volumeNormalized: boolean
    echoRemoved: boolean
    qualityEnhanced: boolean
  }
  analysis: AudioAnalysis
}

class AudioProcessingService {
  private readonly tempDirectory = FileSystem.documentDirectory + 'temp/audio/'

  async reduceNoise(
    audioUri: string,
    options: AudioProcessingOptions = {}
  ): Promise<string> {
    const {
      strength = 0.5,
      preserveQuality = true,
      outputFormat = 'm4a'
    } = options

    try {
      // Ensure temp directory exists
      await this.ensureTempDirectory()

      // Generate output filename
      const outputUri = await this.generateOutputPath(outputFormat)

      // In a real implementation, this would use audio processing libraries
      // such as FFmpeg, SoX, or native audio processing APIs

      // For now, we'll implement a mock noise reduction
      const processedUri = await this.mockNoiseReduction(
        audioUri,
        outputUri,
        strength,
        preserveQuality
      )

      return processedUri

    } catch (error) {
      console.error('Noise reduction failed:', error)
      throw new Error(`Audio processing failed: ${error}`)
    }
  }

  async analyzeAudio(audioUri: string): Promise<AudioAnalysis> {
    try {
      // Load audio file for analysis
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri })
      const status = await sound.getStatusAsync()

      if (!status.isLoaded) {
        throw new Error('Could not load audio for analysis')
      }

      const duration = status.durationMillis ? status.durationMillis / 1000 : 0

      // Unload audio
      await sound.unloadAsync()

      // In a real implementation, this would analyze the audio waveform
      // For now, we'll provide mock analysis data
      const analysis: AudioAnalysis = {
        duration,
        averageVolume: this.generateMockValue(0.3, 0.7),
        peakVolume: this.generateMockValue(0.7, 1.0),
        noiseLevel: this.generateMockValue(0.1, 0.4),
        signalToNoiseRatio: this.generateMockValue(8, 20),
        silencePercentage: this.generateMockValue(5, 25),
        frequency: {
          low: this.generateMockValue(0.1, 0.3),
          mid: this.generateMockValue(0.4, 0.8),
          high: this.generateMockValue(0.1, 0.4)
        }
      }

      return analysis

    } catch (error) {
      throw new Error(`Audio analysis failed: ${error}`)
    }
  }

  async processAudio(
    audioUri: string,
    options: AudioProcessingOptions = {}
  ): Promise<AudioProcessingResult> {
    const startTime = Date.now()

    try {
      // Analyze original audio
      const originalAnalysis = await this.analyzeAudio(audioUri)

      let processedUri = audioUri
      const improvements = {
        noiseReduced: false,
        volumeNormalized: false,
        echoRemoved: false,
        qualityEnhanced: false
      }

      // Apply noise reduction if needed
      if (originalAnalysis.noiseLevel > 0.3) {
        processedUri = await this.reduceNoise(processedUri, options)
        improvements.noiseReduced = true
      }

      // Apply volume normalization if enabled
      if (options.normalizeVolume &&
          (originalAnalysis.averageVolume < 0.3 || originalAnalysis.averageVolume > 0.8)) {
        processedUri = await this.normalizeVolume(processedUri, options)
        improvements.volumeNormalized = true
      }

      // Apply echo removal if enabled
      if (options.enableEcho) {
        processedUri = await this.removeEcho(processedUri, options)
        improvements.echoRemoved = true
      }

      // Apply gain control if enabled
      if (options.enableGainControl) {
        processedUri = await this.applyGainControl(processedUri, options)
        improvements.qualityEnhanced = true
      }

      // Analyze processed audio
      const processedAnalysis = await this.analyzeAudio(processedUri)

      const result: AudioProcessingResult = {
        processedUri,
        originalUri: audioUri,
        processingTime: Date.now() - startTime,
        improvements,
        analysis: processedAnalysis
      }

      return result

    } catch (error) {
      throw new Error(`Audio processing failed: ${error}`)
    }
  }

  async convertFormat(
    audioUri: string,
    targetFormat: 'mp3' | 'm4a' | 'wav',
    options: AudioProcessingOptions = {}
  ): Promise<string> {
    try {
      await this.ensureTempDirectory()
      const outputUri = await this.generateOutputPath(targetFormat)

      // Mock format conversion - in reality would use FFmpeg or similar
      const convertedUri = await this.mockFormatConversion(
        audioUri,
        outputUri,
        targetFormat,
        options
      )

      return convertedUri

    } catch (error) {
      throw new Error(`Format conversion failed: ${error}`)
    }
  }

  async normalizeVolume(
    audioUri: string,
    options: AudioProcessingOptions = {}
  ): Promise<string> {
    try {
      await this.ensureTempDirectory()
      const outputUri = await this.generateOutputPath('m4a')

      // Mock volume normalization
      await this.copyAudio(audioUri, outputUri)

      return outputUri

    } catch (error) {
      throw new Error(`Volume normalization failed: ${error}`)
    }
  }

  async removeEcho(
    audioUri: string,
    options: AudioProcessingOptions = {}
  ): Promise<string> {
    try {
      await this.ensureTempDirectory()
      const outputUri = await this.generateOutputPath('m4a')

      // Mock echo removal
      await this.copyAudio(audioUri, outputUri)

      return outputUri

    } catch (error) {
      throw new Error(`Echo removal failed: ${error}`)
    }
  }

  async applyGainControl(
    audioUri: string,
    options: AudioProcessingOptions = {}
  ): Promise<string> {
    try {
      await this.ensureTempDirectory()
      const outputUri = await this.generateOutputPath('m4a')

      // Mock gain control
      await this.copyAudio(audioUri, outputUri)

      return outputUri

    } catch (error) {
      throw new Error(`Gain control failed: ${error}`)
    }
  }

  // Batch processing
  async processMultipleAudio(
    audioUris: string[],
    options: AudioProcessingOptions = {}
  ): Promise<AudioProcessingResult[]> {
    const results: AudioProcessingResult[] = []

    for (const audioUri of audioUris) {
      try {
        const result = await this.processAudio(audioUri, options)
        results.push(result)
      } catch (error) {
        console.error(`Failed to process ${audioUri}:`, error)
        // Add error result
        results.push({
          processedUri: audioUri,
          originalUri: audioUri,
          processingTime: 0,
          improvements: {
            noiseReduced: false,
            volumeNormalized: false,
            echoRemoved: false,
            qualityEnhanced: false
          },
          analysis: {
            duration: 0,
            averageVolume: 0,
            peakVolume: 0,
            noiseLevel: 1,
            signalToNoiseRatio: 0,
            silencePercentage: 100,
            frequency: { low: 0, mid: 0, high: 0 }
          }
        })
      }
    }

    return results
  }

  // Audio quality assessment
  async assessAudioQuality(audioUri: string): Promise<{
    score: number // 0-100
    issues: string[]
    recommendations: string[]
  }> {
    try {
      const analysis = await this.analyzeAudio(audioUri)

      let score = 100
      const issues: string[] = []
      const recommendations: string[] = []

      // Check noise levels
      if (analysis.noiseLevel > 0.4) {
        score -= 20
        issues.push('High background noise detected')
        recommendations.push('Apply noise reduction')
      }

      // Check volume levels
      if (analysis.averageVolume < 0.2) {
        score -= 15
        issues.push('Audio volume is too low')
        recommendations.push('Increase gain or normalize volume')
      } else if (analysis.averageVolume > 0.9) {
        score -= 10
        issues.push('Audio may be clipping')
        recommendations.push('Reduce gain to prevent distortion')
      }

      // Check signal to noise ratio
      if (analysis.signalToNoiseRatio < 10) {
        score -= 15
        issues.push('Poor signal-to-noise ratio')
        recommendations.push('Re-record in quieter environment')
      }

      // Check silence percentage
      if (analysis.silencePercentage > 40) {
        score -= 10
        issues.push('Too much silence in recording')
        recommendations.push('Trim silent sections')
      }

      // Check frequency balance
      if (analysis.frequency.mid < 0.3) {
        score -= 10
        issues.push('Weak mid-frequency content')
        recommendations.push('Check microphone positioning')
      }

      return {
        score: Math.max(0, score),
        issues,
        recommendations
      }

    } catch (error) {
      throw new Error(`Audio quality assessment failed: ${error}`)
    }
  }

  // Cleanup methods
  async cleanupTempFiles(): Promise<void> {
    try {
      const tempInfo = await FileSystem.getInfoAsync(this.tempDirectory)
      if (tempInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(this.tempDirectory)

        for (const file of files) {
          const filePath = this.tempDirectory + file
          const fileInfo = await FileSystem.getInfoAsync(filePath)

          // Delete files older than 1 hour
          if (fileInfo.exists && fileInfo.modificationTime) {
            const ageMs = Date.now() - fileInfo.modificationTime * 1000
            if (ageMs > 60 * 60 * 1000) { // 1 hour
              await FileSystem.deleteAsync(filePath, { idempotent: true })
            }
          }
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }

  // Private helper methods
  private async ensureTempDirectory(): Promise<void> {
    const tempInfo = await FileSystem.getInfoAsync(this.tempDirectory)
    if (!tempInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.tempDirectory, { intermediates: true })
    }
  }

  private async generateOutputPath(format: string): Promise<string> {
    const timestamp = Date.now()
    const filename = `processed_${timestamp}.${format}`
    return this.tempDirectory + filename
  }

  private async copyAudio(sourceUri: string, targetUri: string): Promise<void> {
    await FileSystem.copyAsync({
      from: sourceUri,
      to: targetUri
    })
  }

  private generateMockValue(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }

  // Mock implementations (would be replaced with real audio processing)
  private async mockNoiseReduction(
    inputUri: string,
    outputUri: string,
    strength: number,
    preserveQuality: boolean
  ): Promise<string> {
    // In a real implementation, this would use audio processing libraries
    // For now, just copy the file
    await this.copyAudio(inputUri, outputUri)
    return outputUri
  }

  private async mockFormatConversion(
    inputUri: string,
    outputUri: string,
    targetFormat: string,
    options: AudioProcessingOptions
  ): Promise<string> {
    // In a real implementation, this would convert audio formats
    // For now, just copy the file
    await this.copyAudio(inputUri, outputUri)
    return outputUri
  }

  // Real-time audio processing (for live recording)
  createRealtimeProcessor(options: AudioProcessingOptions = {}) {
    return {
      processChunk: async (audioChunk: ArrayBuffer): Promise<ArrayBuffer> => {
        // Real-time audio chunk processing would go here
        // For now, return the chunk unchanged
        return audioChunk
      },

      getProcessingStats: () => ({
        latency: 5, // ms
        cpuUsage: 15, // percentage
        bufferSize: 1024,
        sampleRate: 44100
      })
    }
  }

  // Preset configurations
  getPresetOptions(preset: 'voice' | 'music' | 'field' | 'interview'): AudioProcessingOptions {
    const presets: Record<string, AudioProcessingOptions> = {
      voice: {
        strength: 0.6,
        preserveQuality: true,
        normalizeVolume: true,
        enableGainControl: true,
        enableEcho: false,
        bitRate: 64000,
        sampleRate: 22050
      },
      music: {
        strength: 0.2,
        preserveQuality: true,
        normalizeVolume: false,
        enableGainControl: false,
        enableEcho: false,
        bitRate: 128000,
        sampleRate: 44100
      },
      field: {
        strength: 0.8,
        preserveQuality: false,
        normalizeVolume: true,
        enableGainControl: true,
        enableEcho: true,
        bitRate: 32000,
        sampleRate: 16000
      },
      interview: {
        strength: 0.4,
        preserveQuality: true,
        normalizeVolume: true,
        enableGainControl: true,
        enableEcho: true,
        bitRate: 64000,
        sampleRate: 22050
      }
    }

    return presets[preset] || presets.voice
  }
}

export const audioProcessingService = new AudioProcessingService()
export default audioProcessingService
