/**
 * @fileMetadata
 * @purpose Claude Learning System Monitoring Dashboard Page
 * @owner ai-team
 * @status active
 */

import { Metadata } from 'next'
import { ClaudeMonitoringDashboard } from '@/components/claude/claude-monitoring-dashboard'

export const metadata: Metadata = {
  title: 'Claude Learning System Monitor | ClaimGuardian',
  description: 'Real-time monitoring and analytics for the Claude Learning System',
}

export default function ClaudeMonitoringPage() {
  return <ClaudeMonitoringDashboard />
}