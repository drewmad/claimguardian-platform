/**
 * @fileMetadata
 * @purpose "Damage Documentation Copilot page - AI-guided evidence capture"
 * @owner ai-innovation-team
 * @dependencies ["@claimguardian/damage-doc-copilot"]
 * @exports ["default"]
 * @complexity medium
 * @status stable
 */

'use client'

// Temporarily disabled for deployment
export default function DamageCopilotPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Damage Documentation Copilot</h1>
          <p className="text-gray-400">
            Get real-time AI guidance to capture perfect damage documentation photos.
            Our AI coach ensures you capture all required angles with optimal quality.
          </p>
        </div>
        
        <div className="bg-gray-800 border-gray-700 rounded-lg p-6">
          <p className="text-gray-400">Feature temporarily disabled for deployment.</p>
        </div>
        
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Documentation Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-white">Required Photo Types</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span><strong>Overview:</strong> Wide shot showing entire damage area</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span><strong>Close-up:</strong> Detailed view of specific damage</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span><strong>Context:</strong> Damage in relation to surroundings</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span><strong>Comparison:</strong> Undamaged areas for reference</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span><strong>Evidence:</strong> Serial numbers, measurements</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-white">Quality Tips</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Use natural lighting when possible</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Keep camera steady to avoid blur</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Include reference objects for scale</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Ensure damage is clearly visible</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Follow AI guidance for optimal angles</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
