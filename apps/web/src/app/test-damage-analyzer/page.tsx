'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/components/auth/auth-provider'
import { useAuthDebug } from '@/hooks/use-auth-debug'
import { logger } from '@/lib/logger'

export default function TestDamageAnalyzerPage() {
  const [logs, setLogs] = useState<string[]>([])
  const { user, loading } = useAuth()
  
  useAuthDebug('TestDamageAnalyzerPage')
  
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logEntry])
    console.log(logEntry)
    logger.info(message)
  }
  
  const simulateDocumentSelect = () => {
    addLog('Document select clicked')
    // Simulate opening a file picker
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        addLog(`File selected: ${target.files[0].name}`)
        addLog(`Auth state - User: ${user?.id}, Loading: ${loading}`)
      }
    }
    
    input.oncancel = () => {
      addLog('File picker cancelled')
      addLog(`Auth state after cancel - User: ${user?.id}, Loading: ${loading}`)
    }
    
    input.click()
  }
  
  const simulateModalOpen = () => {
    addLog('Modal open clicked')
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black/50 z-50'
    modal.onclick = () => {
      addLog('Modal backdrop clicked')
      document.body.removeChild(modal)
      addLog(`Auth state after modal close - User: ${user?.id}, Loading: ${loading}`)
    }
    document.body.appendChild(modal)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Damage Analyzer Debug Test</h1>
        
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4">Current Auth State</h2>
          <div className="space-y-2 text-sm">
            <p>User ID: {user?.id || 'null'}</p>
            <p>User Email: {user?.email || 'null'}</p>
            <p>Loading: {loading ? 'true' : 'false'}</p>
            <p>Timestamp: {new Date().toISOString()}</p>
          </div>
        </Card>
        
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4">Test Actions</h2>
          <div className="space-y-4">
            <Button onClick={simulateDocumentSelect}>
              Simulate Document Select
            </Button>
            <Button onClick={simulateModalOpen} variant="outline">
              Simulate Modal Open/Close
            </Button>
            <Button 
              onClick={() => {
                addLog('Manual auth check')
                addLog(`User: ${user?.id}, Loading: ${loading}`)
              }}
              variant="secondary"
            >
              Check Auth State
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="destructive"
            >
              Reload Page
            </Button>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Event Log</h2>
          <div className="space-y-1 text-xs font-mono max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No events logged yet</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-gray-700">{log}</div>
              ))
            )}
          </div>
          <Button 
            onClick={() => setLogs([])}
            variant="ghost"
            size="sm"
            className="mt-4"
          >
            Clear Logs
          </Button>
        </Card>
      </div>
    </div>
  )
}