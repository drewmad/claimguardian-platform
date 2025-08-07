/**
 * @fileMetadata
 * @purpose "Claude Learning System Monitoring Dashboard Page"
 * @dependencies ["@/components","next"]
 * @owner ai-team
 * @status stable
 */

import { Metadata } from "next";
import { ClaudeMonitoringDashboard } from "@/components/claude/claude-monitoring-dashboard";

export const metadata: Metadata = {
  title: "Claude Learning System Monitor | ClaimGuardian",
  description:
    "Real-time monitoring and analytics for the Claude Learning System",
};

export default function ClaudeMonitoringPage() {
  return <ClaudeMonitoringDashboard />;
}
