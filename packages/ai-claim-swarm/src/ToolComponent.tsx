/**
 * @fileMetadata
 * @purpose "AI Claim Swarm Tool Component - Multi-user collaborative damage assessment interface"
 * @owner ai-innovation-team
 * @dependencies ["@claimguardian/ui", "react"]
 * @exports ["ToolComponent"]
 * @complexity medium
 * @status stable
 */

import { Card, CardHeader, CardContent, Button } from '@claimguardian/ui'
import { CameraCapture } from '@claimguardian/ui'
import React from 'react'

import { useClaimSwarm } from './useClaimSwarm'

export function ToolComponent() {
  const {
    sessionId,
    swarmMembers,
    analysis,
    captureImage,
    submitMedia,
    consensus,
    loading,
  } = useClaimSwarm()

  return (
    <Card className="bg-gray-800 border-gray-700 w-full max-w-5xl mx-auto">
      <CardHeader className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-white">AI Claim Swarm</h2>
        <p className="text-sm text-gray-400">
          Session ID: {sessionId} · Active Members: {swarmMembers.length}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="space-y-4">
          <CameraCapture
            onCapture={captureImage}
            className="rounded-md border border-gray-700"
          />
          <Button 
            onClick={submitMedia} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processing Analysis...' : 'Submit for Swarm Analysis'}
          </Button>
        </div>

        {analysis && (
          <div className="space-y-2">
            <h3 className="font-medium text-white">Live AI Analysis</h3>
            <div className="bg-gray-900 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm text-gray-300">{analysis}</pre>
            </div>
          </div>
        )}

        {consensus && (
          <div className="space-y-2">
            <h3 className="font-medium text-white">Swarm Consensus</h3>
            <div className="bg-green-900/20 border border-green-700 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm text-green-300">{consensus}</pre>
            </div>
          </div>
        )}

        {swarmMembers.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-white">Active Collaborators</h3>
            <div className="flex flex-wrap gap-2">
              {swarmMembers.map((member, index) => (
                <div key={index} className="bg-blue-900/20 border border-blue-700 px-3 py-1 rounded-full">
                  <span className="text-sm text-blue-300">User {index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}