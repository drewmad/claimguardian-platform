/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { ErrorDashboard } from '@/components/admin/error-dashboard'

export default function ErrorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorDashboard />
    </div>
  )
}