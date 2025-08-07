/**
 * @fileMetadata
 * @purpose "Damage Documentation Copilot UI Component - Real-time AI guidance for damage photography"
 * @owner ai-innovation-team
 * @dependencies ["@claimguardian/ui", "react"]
 * @exports ["ToolComponent"]
 * @complexity medium
 * @status stable
 */

import { Card, CardHeader, CardContent, Button } from '@claimguardian/ui'
import { CameraCapture } from '@claimguardian/ui'
import React from 'react'

import { useDamageCopilot } from './useDamageCopilot'

export function ToolComponent() {
  const {
    guidance,
    complete,
    progress,
    capturedImages,
    qualityScore,
    capture,
    resetSession,
    loading
  } = useDamageCopilot()

  return (
    <Card className="bg-gray-800 border-gray-700 w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Damage Documentation Copilot</h2>
          <p className="text-sm text-gray-400">
            AI-guided evidence capture · Progress: {progress.current}/{progress.total}
          </p>
        </div>
        {complete && (
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-medium">✓ Complete</span>
            <Button
              onClick={resetSession}
              variant="outline"
              className="text-sm"
            >
              New Session
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Indicator */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>

        {/* Camera Interface */}
        <div className="space-y-4">
          <CameraCapture
            onCapture={capture}
            className="rounded-md border border-gray-700"
            disabled={complete || loading}
          />

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-400">Analyzing image...</span>
            </div>
          )}
        </div>

        {/* AI Guidance */}
        <div className="space-y-2">
          <h3 className="font-medium text-white">AI Guidance</h3>
          <div className={`p-4 rounded-md border ${
            complete
              ? 'bg-green-900/20 border-green-700'
              : 'bg-blue-900/20 border-blue-700'
          }`}>
            <p className={`text-sm ${
              complete ? 'text-green-300' : 'text-blue-300'
            }`}>
              {guidance}
            </p>
          </div>
        </div>

        {/* Quality Score */}
        {qualityScore > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-white">Documentation Quality</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    qualityScore >= 80 ? 'bg-green-600' :
                    qualityScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${qualityScore}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${
                qualityScore >= 80 ? 'text-green-400' :
                qualityScore >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {qualityScore}%
              </span>
            </div>
          </div>
        )}

        {/* Captured Images Summary */}
        {capturedImages.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-white">Captured Evidence</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {capturedImages.map((image, index) => (
                <div key={index} className="relative">
                  <div className="aspect-square bg-gray-700 rounded-md overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(image.file)}
                      alt={`Damage evidence ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-1 right-1">
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      image.quality >= 80 ? 'bg-green-500' :
                      image.quality >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
