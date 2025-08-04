/**
 * @fileMetadata
 * @purpose Displays the Florida compliance and regulatory information page.
 * @owner legal-team
 * @status foundation
 */
/**
 * @fileMetadata
 * @purpose Florida compliance page foundation for regulatory and legal compliance information
 * @owner legal-team
 * @dependencies ["react"]
 * @exports ["CompliancePage"]
 * @complexity low
 * @tags ["legal", "compliance", "florida", "regulations"]
 * @status foundation
 */

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Florida Compliance</span>
              <span className="block mt-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                & Regulatory Information
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Understanding regulatory compliance for property intelligence and insurance documentation in Florida.
            </p>
          </div>

          <div className="space-y-8">
            {/* Disclaimer */}
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-yellow-400 mb-3">Important Notice</h2>
              <p className="text-gray-300">
                ClaimGuardian is a property documentation and organization platform. We are not licensed insurance 
                adjusters, attorneys, or financial advisors. Our platform provides tools and information to help 
                you manage your property data, but does not constitute professional advice.
              </p>
            </div>

            {/* Coming Soon Content */}
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6">Compliance Framework Under Development</h2>
              
              <p className="text-gray-300 mb-6">
                As a Florida-based family business, we're committed to full compliance with all applicable 
                regulations. Our compliance documentation is currently being developed and will include:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-green-400 mb-3">Data Protection</h3>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li>• Privacy protection standards</li>
                    <li>• Data retention policies</li>
                    <li>• User consent management</li>
                    <li>• Third-party data sharing</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-400 mb-3">Florida Regulations</h3>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li>• Insurance documentation rules</li>
                    <li>• Consumer protection compliance</li>
                    <li>• Business licensing requirements</li>
                    <li>• Professional service boundaries</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-purple-400 mb-3">Industry Standards</h3>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li>• Property data security</li>
                    <li>• Documentation best practices</li>
                    <li>• Technology compliance</li>
                    <li>• Accessibility standards</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-orange-400 mb-3">User Rights</h3>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li>• Data ownership rights</li>
                    <li>• Platform access policies</li>
                    <li>• Service limitations</li>
                    <li>• Dispute resolution</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact for Compliance */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Compliance Questions</h3>
              <p className="text-gray-400 mb-4">
                If you have specific compliance questions or need clarification on our regulatory approach, 
                please contact our team.
              </p>
              <a 
                href="mailto:support@claimguardianai.com?subject=Compliance%20Question" 
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Contact Compliance Team
              </a>
            </div>

            {/* Quick Links */}
            <div className="grid md:grid-cols-3 gap-4">
              <a 
                href="/legal/privacy-policy" 
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <h4 className="font-semibold text-green-400 mb-2">Privacy Policy</h4>
                <p className="text-sm text-gray-400">How we protect your data</p>
              </a>
              
              <a 
                href="/legal/terms-of-service" 
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <h4 className="font-semibold text-blue-400 mb-2">Terms of Service</h4>
                <p className="text-sm text-gray-400">Platform usage terms</p>
              </a>
              
              <a 
                href="/contact" 
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <h4 className="font-semibold text-purple-400 mb-2">Contact Support</h4>
                <p className="text-sm text-gray-400">Get help from our team</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}